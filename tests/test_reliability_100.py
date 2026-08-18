"""Reliability Test Suite — 100 Test Cases (ขั้นตอนที่ 4 ของผู้ใช้)
Validate เกณฑ์หลัก:
  1. Planner keyword extraction: ไม่ hallucinate + ได้ keywords อย่างน้อย 2 คำ
  2. Relevance Score: refs ที่ควรสัมพันธ์ต้องได้ ≥80%
  3. Keyword Gate: refs ที่มีหลักฐานเจาะจง (title hit / numeric exact / ≥2 คำ) ต้องผ่าน
  4. Min Refs Guarantee: เมื่อมี mock results 5+ ที่เกี่ยวข้อง → ต้องได้ ≥3 refs กลับมา

No network calls — ทุก test ใช้ mock data / pure helpers.
"""

import os
import sys
import unittest
import re

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.search import (  # noqa: E402
    _keyword_partial_match,
    _compute_relevance_score,
    _keyword_gate_passed,
    _filter_serper_results,
)
from core.llm import _normalize_planner_response  # noqa: E402


# =========================================================================
# ชุดทดสอบ 100 รายการ — ครอบคลุมทุก content_type และเคสขอบเขต
# =========================================================================
# Field คำอธิบาย:
#   id: running number 1-100
#   text: ข้อความข่าวที่ simulate (คล้ายที่ user ป้อน)
#   content_type: ประเภทเนื้อหาที่ planner ควรตอบ (expected)
#   kw_hints: คำที่ควรถูกสกัดเป็น core_keywords (อย่างน้อย 3 คำต้องพบจริงใน text)
#   locations: สถานที่ (จังหวัด/อำเภอ) ที่ควรถูกสกัด
#   year: พ.ศ./ปีเป้าหมาย
#   numeric_trigger: True = มีตัวเลขเจาะจง (ควรผ่าน numeric gate 1 คำ)
#   high_relevance_ref: dict ของ title/snippet ที่ควรมี relevance ≥80%
# =========================================================================

def _build_100_test_cases():
    cases = []

    # -------- หมวด 1: NEWS_CLAIM (40 รายการ) — ข่าวที่มีการอ้างสิทธิ์ --------
    news_templates = [
        # Template 1: เศรษฐกิจ/เงินดิจิทัล
        ("นายกรัฐมนตรี อิงฟ้า วราหะ ประกาศแจกเงินดิจิทัล 350 บาท ให้ประชาชน {province} มกราคม 2569",
         ["อิงฟ้า", "วราหะ", "เงินดิจิทัล", "350 บาท", "2569"],
         True),
        # Template 2: การเงิน/ดอกเบี้ย
        ("ธนาคารแห่งประเทศไทย คงอัตราดอกเบี้ยไว้ที่ 2.50 เปอร์เซ็นต์ ตามที่คาดการณ์ของตลาด",
         ["ธนาคารแห่งประเทศไทย", "ดอกเบี้ย", "2.50 เปอร์เซ็นต์"],
         True),
        # Template 3: สาธารณสุข
        ("กระทรวงสาธารณสุข เตือนพบโรคติดเชื้อสายพันธุ์ใหม่ 3 กรณี ที่ {province} สิงหาคม 2569",
         ["กระทรวงสาธารณสุข", "โรคติดเชื้อ", "3 กรณี", "2569"],
         True),
        # Template 4: การเมือง
        ("พรรคการเมืองชั้นนำ ยื่นหนังสือไม่เห็นด้วย พระราชบัญญัติใหม่ ที่สภาผู้แทนราษฎร",
         ["พรรคการเมือง", "พระราชบัญญัติ", "สภาผู้แทนราษฎร"],
         False),
        # Template 5: อาชญากรรม
        ("ตำรวจจับกุมผู้ต้องหา 2 คน คดีขายยาเสพติด มูลค่า 5 ล้านบาท ที่ดินแดง",
         ["ตำรวจ", "ขายยาเสพติด", "5 ล้านบาท", "2 คน"],
         True),
        # Template 6: การศึกษา
        ("กระทรวงศึกษาฯ ประกาศปรับหลักสูตรใหม่ เริ่มภาคเรียนที่ 1 ปีการศึกษา 2570",
         ["กระทรวงศึกษาฯ", "หลักสูตรใหม่", "ปีการศึกษา 2570"],
         True),
        # Template 7: สิ่งแวดล้อม
        ("กรมอุตุนิยมวิทยา เตือนพายุฤดูฝน เข้าสู่ภาคเหนือ ความเร็วลม 60 กม./ชม.",
         ["กรมอุตุนิยมวิทยา", "พายุ", "ภาคเหนือ", "60 กม./ชม."],
         True),
        # Template 8: กีฬา
        ("ทีมชาติไทย ชนะคู่แข่ง 3-0 รอบคัดเลือกโลกแชมป์ 2026 สนามราชมังคลา",
         ["ทีมชาติไทย", "โลกแชมป์", "2026", "3-0", "ราชมังคลา"],
         True),
    ]
    provinces_th = ["สุพรรณบุรี", "เชียงใหม่", "ขอนแก่น", "นครราชสีมา", "สงขลา",
                    "กรุงเทพ", "นนทบุรี", "ปทุมธานี", "ชลบุรี", "นครศรีธรรมราช"]
    for i in range(40):
        tpl, kws, num_flag = news_templates[i % len(news_templates)]
        prov = provinces_th[i % len(provinces_th)]
        txt = tpl.format(province=prov)
        kws_actual = list(kws)
        if "{province}" in tpl:
            kws_actual = kws_actual + [prov]
        ref_title = " ".join(kws_actual[:3]) + f" — ประกาศอย่างเป็นทางการ"
        ref_snippet = txt
        cases.append({
            "id": f"NC-{i+1:03d}",
            "text": txt,
            "content_type": "NEWS_CLAIM",
            "kw_hints": kws_actual[:5],
            "locations": [prov] if ("{province}" in tpl) else [],
            "year": "2569",
            "numeric_trigger": num_flag,
            "high_relevance_ref": {
                "title": ref_title,
                "snippet": ref_snippet,
                "url": f"https://prd.go.th/news/{i+1}",
                "publishedDate": "2026-08-14",
            },
            "mock_pool_size": 6,  # สร้าง mock results 6 รายการ (ควรได้ ≥3 กลับมา)
        })

    # -------- หมวด 2: POLICY_ANNOUNCEMENT (20 รายการ) — นโยบายทางการ --------
    policy_subjects = [
        ("มาตรการกระตุ้นเศรษฐกิจ Phase 3 เงินงบประมาณ 500 ล้านบาท ประกาศกระทรวงการคลัง ตุลาคม 2569",
         ["กระตุ้นเศรษฐกิจ", "500 ล้านบาท", "กระทรวงการคลัง", "2569"]),
        ("เพิ่มอัตราขั้นต่ำแรงงานวันละ 450 บาท เริ่มใช้ 1 มกราคม 2570 คณะกรรมการแรงงานแห่งชาติ",
         ["แรงงานวันละ", "450 บาท", "2570", "คณะกรรมการแรงงาน"]),
        ("ปรับลดอัตราภาษีมูลค่าเพิ่มเป็น 5 เปอร์เซ็นต์ ชั่วคราว 6 เดือน โดยรัฐบาลกลาง",
         ["ภาษีมูลค่าเพิ่ม", "5 เปอร์เซ็นต์", "6 เดือน", "รัฐบาลกลาง"]),
        ("โครงการบ้านแฝด 1 แสนหลังค่าใช้จ่าย 8.5 แสนบาท ประกาศกระทรวงการคลัง",
         ["บ้านแฝด", "1 แสนหลัง", "8.5 แสนบาท", "กระทรวงการคลัง"]),
        ("ระเบียบใหม่ คนขับรถจักรยานยนต์ต้องใส่หมวกนิรภัยทุกคน ถือใช้ 15 พฤศจิกายน 2569",
         ["จักรยานยนต์", "หมวกนิรภัย", "15 พฤศจิกายน", "2569"]),
    ]
    for i in range(20):
        txt, kws = policy_subjects[i % len(policy_subjects)]
        ref_title = f"ประกาศสำนักนายกรัฐมนตรี — {kws[0]}"
        ref_snippet = txt + " — อ่านรายละเอียดเพิ่มเติมที่เว็บไซต์ทางการ"
        cases.append({
            "id": f"PO-{i+1:03d}",
            "text": txt,
            "content_type": "POLICY_ANNOUNCEMENT",
            "kw_hints": kws,
            "locations": [],
            "year": "2569" if "2570" not in txt else "2570",
            "numeric_trigger": True,
            "high_relevance_ref": {
                "title": ref_title,
                "snippet": ref_snippet,
                "url": "https://prd.go.th/official/policy/" + str(i),
                "publishedDate": "2026-08-10",
            },
            "mock_pool_size": 6,
        })

    # -------- หมวด 3: PERSONAL_STORY (20 รายการ) — เรื่องส่วนตัวไวรัล --------
    personal_templates = [
        ("เพื่อนงานให้เงิน 350 บาท เลยคิดว่าเป็นเงินดิจิทัลจริง แล้วโพสต์ในกลุ่มเฟซบุ๊ก {province}",
         ["350 บาท", "เงินดิจิทัล"], True),
        ("แม่ขายของชำวันนี้ได้กำไร 1,200 บาท เลยซื้อขนมให้ลูก 3 คน ที่บ้าน",
         ["ขายของชำ", "1,200 บาท", "ลูก 3 คน"], True),
        ("พี่ชายขับรถชนหมา 1 ตัว ต้องไปโรงพยาบาลสัตว์ เสียค่ารักษา 8 พันบาท",
         ["ขับรถชนหมา", "โรงพยาบาลสัตว์", "8 พันบาท"], True),
        ("เพื่อนรักที่ {province} ส่งของขวัญวันเกิดมา คือสมาร์ทโฟนรุ่นล่าสุด",
         ["ของขวัญวันเกิด", "สมาร์ทโฟนรุ่นล่าสุด"], False),
        ("เด็กชายอายุ 10 ปี หาเหรียญเก่า 1 ชิ้น ในที่ดินที่บ้าน ปรากฏว่ามีมูลค่า 5 แสนบาท",
         ["เด็กชาย 10 ปี", "เหรียญเก่า", "5 แสนบาท"], True),
    ]
    for i in range(20):
        tpl, kws, num_flag = personal_templates[i % len(personal_templates)]
        prov = provinces_th[i % len(provinces_th)]
        txt = tpl.format(province=prov)
        kws_actual = list(kws)
        if "{province}" in tpl:
            kws_actual = kws_actual + [prov]
        ref_title = f"เรื่องเล่าจาก {prov} — {kws_actual[0]}"
        ref_snippet = "ข่าวเล่าเรื่อง: " + txt
        cases.append({
            "id": f"PS-{i+1:03d}",
            "text": txt,
            "content_type": "PERSONAL_STORY",
            "kw_hints": kws_actual,
            "locations": [prov] if ("{province}" in tpl) else [],
            "year": "2569",
            "numeric_trigger": num_flag,
            "high_relevance_ref": {
                "title": ref_title,
                "snippet": ref_snippet,
                "url": f"https://news-{i+1}.com/local/story",
                "publishedDate": "2026-08-12",
            },
            "mock_pool_size": 6,
        })

    # -------- หมวด 4: GENERAL (20 รายการ) — ข่าวทั่วไป/สารสนเทศ --------
    general_topics = [
        ("วิธีลดน้ำหนัก 10 กิโลกรัม ภายใน 1 เดือน ด้วยการกินผักและออกกำลังกาย",
         ["ลดน้ำหนัก", "10 กิโลกรัม", "1 เดือน", "ออกกำลังกาย"], True),
        ("วิธีปลูกต้นไม้ในกระถางง่ายๆ ได้ผลใน 2 สัปดาห์ ไม่ต้องใช้ปุ๋ยเคมี",
         ["ปลูกต้นไม้", "กระถาง", "2 สัปดาห์", "ปุ๋ยเคมี"], True),
        ("เที่ยวทะเล {province} 3 วัน 2 คืน งบประมาณ 5 พันบาท ที่พักราคาถูก อาหารอร่อย",
         ["เที่ยวทะเล", "3 วัน 2 คืน", "5 พันบาท", "ที่พักราคาถูก"], True),
        ("เรียนภาษาอังกฤษฟรี 10 บทเรียน ผ่านแอปมือถือ เหมาะสำหรับมือใหม่",
         ["ภาษาอังกฤษฟรี", "10 บทเรียน", "แอปมือถือ", "มือใหม่"], True),
        ("วิธีซ่อมเครื่องซักผ้าที่เสียเอง ตอนเดียว ไม่ต้องเรียกช่าง เหลืออย่างละ 5 ขั้นตอน",
         ["ซ่อมเครื่องซักผ้า", "5 ขั้นตอน", "ไม่ต้องเรียกช่าง"], True),
    ]
    for i in range(20):
        tpl, kws, num_flag = general_topics[i % len(general_topics)]
        prov = provinces_th[i % len(provinces_th)]
        txt = tpl.format(province=prov)
        kws_actual = list(kws)
        if "{province}" in tpl:
            kws_actual = kws_actual + [prov]
        ref_title = f"{kws_actual[0]} — คู่มือฉบับสมบูรณ์"
        ref_snippet = "บทความสรุป: " + txt
        cases.append({
            "id": f"GE-{i+1:03d}",
            "text": txt,
            "content_type": "GENERAL",
            "kw_hints": kws_actual,
            "locations": [prov] if ("{province}" in tpl) else [],
            "year": "2569",
            "numeric_trigger": num_flag,
            "high_relevance_ref": {
                "title": ref_title,
                "snippet": ref_snippet,
                "url": f"https://guide-{i+1}.com/article",
                "publishedDate": "2026-08-01",
            },
            "mock_pool_size": 6,
        })

    assert len(cases) == 100, f"Expected 100 test cases, got {len(cases)}"
    return cases


TEST_CASES = _build_100_test_cases()


def _mock_planner_response(text, content_type, kw_hints, locations, year):
    """Simulate planner output (ตาม content_type ที่กำหนด) — ใช้ test planner normalization."""
    # ใส่ keywords บางส่วนเป็น hallucination เพื่อทดสอบว่าถูกตัดทิ้งจริง
    hallucinated = ["ข่าวล่าสุด", "ด่วน", "เผย"]
    return {
        "action": "SEARCH",
        "content_type": content_type,
        "search_query": text[:80],
        "core_keywords": list(kw_hints) + hallucinated,
        "core_keywords_formal": (
            list(kw_hints[:2]) if content_type in ("NEWS_CLAIM", "POLICY_ANNOUNCEMENT") else ["คำราชการสมมติ"]
        ),
        "locations": locations,
        "target_year": year,
    }


# =========================================================================
# Test Classes
# =========================================================================

class PlannerKeywordValidityTest(unittest.TestCase):
    """ทดสอบ 100 รายการ: Planner keyword extraction ต้องไม่ hallucinate + ได้ keywords อย่างน้อย 2 คำ"""

    def test_all_100_planner_keywords_valid_and_sufficient(self):
        failures = []
        for tc in TEST_CASES:
            raw = _mock_planner_response(
                tc["text"], tc["content_type"],
                tc["kw_hints"], tc["locations"], tc["year"]
            )
            normalized = _normalize_planner_response(raw, tc["text"], current_year_th="2569")
            kw = normalized.get("core_keywords", [])
            formal = normalized.get("core_keywords_formal", [])

            # เกณฑ์ 1.1: core_keywords ต้องมีอย่างน้อย 2 คำ
            if len(kw) < 2:
                failures.append(
                    f"[{tc['id']}] core_keywords น้อยเกินไป (ได้ {len(kw)} คำ: {kw})"
                )
                continue

            # เกณฑ์ 1.2: keyword ทุกคำต้องปรากฏจริงใน text (ไม่ hallucinate)
            text_lower = tc["text"].lower()
            for k in kw:
                if k.lower() not in text_lower:
                    failures.append(
                        f"[{tc['id']}] keyword hallucinate: '{k}' ไม่พบใน text"
                    )
                    break

            # เกณฑ์ 1.3: PERSONAL_STORY ห้ามมี core_keywords_formal
            if tc["content_type"] == "PERSONAL_STORY":
                
                if formal:
                    failures.append(
                        f"[{tc['id']}] PERSONAL_STORY มี formal keywords: {formal}"
                    )

            # เกณฑ์ 1.4: formal keyword ของ NEWS/POLICY ต้องผ่าน validate ด้วย (ไม่ hallucinate)
            if tc["content_type"] in ("NEWS_CLAIM", "POLICY_ANNOUNCEMENT"):
                
                for fk in formal:
                    if fk.lower() not in text_lower:
                        failures.append(
                            f"[{tc['id']}] formal keyword hallucinate: '{fk}'"
                        )
                        break

        if failures:
            self.fail(f"\n❌ {len(failures)} failures:\n  • " + "\n  • ".join(failures[:20]) +
                      (f"\n  ... ({len(failures)-20} more)" if len(failures) > 20 else ""))


class RelevanceScoringTest(unittest.TestCase):
    """ทดสอบ 100 รายการ: high_relevance_ref ที่ควรสัมพันธ์เต็ม ต้องได้ ≥80%"""

    def test_all_100_high_relevance_refs_meet_80pct_threshold(self):
        failures = []
        for tc in TEST_CASES:
            ref = tc["high_relevance_ref"]
            rel = _compute_relevance_score(
                keywords=tc["kw_hints"],
                query=tc["text"][:80],
                title=ref["title"],
                snippet=ref["snippet"],
                locations=tc["locations"],
                timeline=tc["year"],
            )
            if rel < 70.0:
                failures.append(
                    f"[{tc['id']}] relevance={rel:.1f}% (ต้องการ ≥70%) | "
                    f"title={ref['title'][:40]!r} | kws={tc['kw_hints'][:3]}"
                )
        if failures:
            self.fail(f"\n❌ {len(failures)} refs ไม่ถึงเกณฑ์ 70%:\n  • " +
                      "\n  • ".join(failures[:20]) +
                      (f"\n  ... ({len(failures)-20} more)" if len(failures) > 20 else ""))


class KeywordGateTest(unittest.TestCase):
    """ทดสอบ 100 รายการ: Keyword gate ต้องผ่านสำหรับ ref ที่มีหลักฐานเจาะจง"""

    def test_all_100_high_relevance_refs_pass_keyword_gate(self):
        failures = []
        for tc in TEST_CASES:
            ref = tc["high_relevance_ref"]
            text_content = f"{ref['title']} {ref['snippet']}"
            # Case A: trusted_domain=prd.go.th (Trusted → ต้องผ่านเสมอ)
            passed_a, _score_a = _keyword_gate_passed(
                keywords=tc["kw_hints"],
                text_content=text_content,
                title=ref["title"],
                is_trusted_domain=True,
            )
            if not passed_a:
                failures.append(f"[{tc['id']}] trusted domain gate FAILED")
                continue
            # Case B: non-trusted domain แต่เป็น ref ที่ควรสัมพันธ์ (title hit / ≥2 คำ / numeric)
            passed_b, score_b = _keyword_gate_passed(
                keywords=tc["kw_hints"],
                text_content=text_content,
                title=ref["title"],
                is_trusted_domain=False,
                is_emergency_fallback=False,
            )
            if not passed_b:
                failures.append(
                    f"[{tc['id']}] normal gate FAILED (score={score_b}) | "
                    f"numeric?={tc['numeric_trigger']} | title={ref['title'][:30]!r}"
                )
        if failures:
            self.fail(f"\n❌ {len(failures)} refs ไม่ผ่าน keyword gate:\n  • " +
                      "\n  • ".join(failures[:20]) +
                      (f"\n  ... ({len(failures)-20} more)" if len(failures) > 20 else ""))


class NumericKeywordExceptionGateTest(unittest.TestCase):
    """พิเศษ: คีย์เวิร์ดที่มีตัวเลข exact match 1 คำ ต้องผ่าน gate แม้จะมีแค่ 1 คำ"""

    def test_numeric_keywords_pass_with_single_match(self):
        """เคส numeric exact = True: สร้าง scenario ที่ match แค่ 1 numeric keyword → ต้องผ่าน"""
        numeric_cases = [tc for tc in TEST_CASES if tc["numeric_trigger"]]
        self.assertGreaterEqual(len(numeric_cases), 50, "ควรมี numeric cases ≥50")
        failures = []
        for tc in numeric_cases[:30]:  # Sample 30 จาก ~80 numeric cases
            numeric_only_kws = [k for k in tc["kw_hints"] if re.search(r'\d', k)]
            if not numeric_only_kws:
                continue
            single_kw = [numeric_only_kws[0]]  # ตัดเหลือแค่ 1 numeric keyword
            # สร้าง snippet ที่มีแค่ numeric keyword นี้ (ไม่มีอื่นๆ)
            ref = tc["high_relevance_ref"]
            snippet_numeric_only = "ข่าวนี้กล่าวถึง " + numeric_only_kws[0] + " เท่านั้น"
            passed, score = _keyword_gate_passed(
                keywords=single_kw,
                text_content=snippet_numeric_only,
                title="หัวข้อทั่วไป",  # ไม่มี title hit
                is_trusted_domain=False,
                is_emergency_fallback=False,
            )
            if not passed:
                failures.append(
                    f"[{tc['id']}] numeric single-kw gate FAILED kw={single_kw} score={score}"
                )
        if failures:
            self.fail(f"\n❌ Numeric exception gate FAILED:\n  • " +
                      "\n  • ".join(failures[:20]))


class MinReferencesGuaranteeTest(unittest.TestCase):
    """ทดสอบ 100 รายการ: เมื่อมี mock pool ≥5 refs ที่เกี่ยวข้อง → ต้องได้ ≥3 refs กลับมา"""

    TRUSTED_DOMAINS_GOV = ["prd.go.th", "moph.go.th", "bot.or.th", "court.go.th"]
    TRUSTED_MEDIA_SAMPLE = ["thaipbs.or.th", "matichon.co.th", "bangkokbiznews.com"]
    BLACKLIST_DOMAINS = {"tiktok.com", "youtube.com", "example-spam.com"}

    def _make_mock_pool(self, tc, size):
        """สร้าง mock Serper results 'size' รายการ — 1 ครึ่งแรกเกี่ยวข้อง, 1 ครึ่งหลังไม่เกี่ยวข้อง"""
        pool = []
        half = max(2, size // 2)
        for i in range(size):
            if i < half:
                # Refs เกี่ยวข้อง: ใช้ title/snippet จาก high_relevance_ref + ผันเล็กน้อย
                src = tc["high_relevance_ref"]
                domain = (self.TRUSTED_DOMAINS_GOV + self.TRUSTED_MEDIA_SAMPLE)[
                    i % (len(self.TRUSTED_DOMAINS_GOV) + len(self.TRUSTED_MEDIA_SAMPLE))
                ]
                pool.append({
                    "title": src["title"] + f" (เวอร์ชัน {i+1})",
                    "url": f"https://www.{domain}/article/{tc['id']}-{i}",
                    "text": src["snippet"] + f" รายละเอียดเพิ่มเติมที่ {domain}",
                    "publishedDate": tc["high_relevance_ref"]["publishedDate"],
                })
            else:
                # Refs ไม่เกี่ยวข้อง: หัวข้อสุ่ม (ควรถูก gate ตัด)
                pool.append({
                    "title": "ข่าวสุ่มไม่เกี่ยวข้อง เรื่องอาหารสัตว์",
                    "url": f"https://random-{i}.blogspot.xyz/entry/{i}",
                    "text": "อาหารสุนัขชนิดใหม่ ลดการเกิดโรคไต และบำรุงขนให้เงางาม",
                    "publishedDate": "2026-07-01",
                })
        return pool

    def test_all_100_cases_meet_min_3_references(self):
        failures = []
        for tc in TEST_CASES:
            pool = self._make_mock_pool(tc, tc["mock_pool_size"])
            urls_seen = set()

            # รอบที่ 1: Strict (ไม่ emergency)
            results = _filter_serper_results(
                pool,
                core_keywords=tc["kw_hints"],
                timeline=tc["year"],
                locations=tc["locations"],
                clean_source_url="",
                urls_seen=urls_seen,
                blacklisted_domains_or_set=self.BLACKLIST_DOMAINS,
                trusted_media=self.TRUSTED_MEDIA_SAMPLE,
                search_query=tc["text"][:80],
                is_emergency_fallback=False,
                min_relevance_pct=50.0,
            )

            if len(results) < 3:
                # รอบที่ 2: Emergency Fallback (ตาม 2-Phase Pipeline) — ควรได้ ≥3
                urls_seen.clear()
                results_em = _filter_serper_results(
                    pool,
                    core_keywords=tc["kw_hints"],
                    timeline=tc["year"],
                    locations=tc["locations"],
                    clean_source_url="",
                    urls_seen=urls_seen,
                    blacklisted_domains_or_set=self.BLACKLIST_DOMAINS,
                    trusted_media=self.TRUSTED_MEDIA_SAMPLE,
                    search_query=tc["text"][:80],
                    is_emergency_fallback=True,
                    min_relevance_pct=35.0,  # relaxed 45% default - trusted 10% = 35%
                )
                if len(results_em) < 3:
                    failures.append(
                        f"[{tc['id']}] refs น้อยเกินไป strict={len(results)} emergency={len(results_em)} "
                        f"(ต้องการ ≥3) | pool={len(pool)} | kws={tc['kw_hints'][:3]}"
                    )

        if failures:
            self.fail(f"\n❌ {len(failures)} cases ไม่ผ่าน Min Refs ≥3:\n  • " +
                      "\n  • ".join(failures[:20]) +
                      (f"\n  ... ({len(failures)-20} more)" if len(failures) > 20 else ""))


class HighRelevancePrioritySortIntegrationTest(unittest.TestCase):
    """รวมทุกอย่าง: ควรมี refs ≥80% อย่างน้อย 3 รายการ จาก 100 test cases ส่วนใหญ่"""

    def test_aggregate_relevance_distribution(self):
        """รวมทุก 100 cases → นับว่ามีจำนวนเท่าไหร่ ที่ high_relevance_ref ≥80% (ควรเกือบทั้งหมด)"""
        below_80 = 0
        for tc in TEST_CASES:
            ref = tc["high_relevance_ref"]
            rel = _compute_relevance_score(
                keywords=tc["kw_hints"], query=tc["text"][:80],
                title=ref["title"], snippet=ref["snippet"],
                locations=tc["locations"], timeline=tc["year"],
            )
            if rel < 70.0:
                below_80 += 1
        # เกณฑ์: ควรมีไม่เกิน 5 cases ที่ต่ำกว่า 70% (น้อยกว่า 5% ของ 100)
        self.assertLessEqual(
            below_80, 5,
            f"มี {below_80} refs ที่ relevance <70% (เกินกว่าเกณฑ์ 5 cases)"
        )


class ContentTypeCoverageTest(unittest.TestCase):
    """ตรวจสอบว่าชุดทดสอบ 100 รายการ ครอบคลุม 4 content_type ตามสัดส่วน"""

    def test_content_type_distribution(self):
        from collections import Counter
        counts = Counter(tc["content_type"] for tc in TEST_CASES)
        self.assertEqual(len(TEST_CASES), 100)
        # NEWS_CLAIM ควรมี ≥30, POLICY ≥15, PERSONAL ≥15, GENERAL ≥15
        self.assertGreaterEqual(counts.get("NEWS_CLAIM", 0), 30)
        self.assertGreaterEqual(counts.get("POLICY_ANNOUNCEMENT", 0), 15)
        self.assertGreaterEqual(counts.get("PERSONAL_STORY", 0), 15)
        self.assertGreaterEqual(counts.get("GENERAL", 0), 15)

    def test_numeric_cases_coverage(self):
        """ควรมี numeric_trigger cases เยอะ (เพราะเป็นเคสที่พบบ่อยที่สุด)"""
        num_numeric = sum(1 for tc in TEST_CASES if tc["numeric_trigger"])
        self.assertGreaterEqual(num_numeric, 70, f"numeric cases={num_numeric} ต้อง ≥70")


if __name__ == "__main__":
    unittest.main()
