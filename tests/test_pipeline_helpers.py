"""Unit tests for the Final-Project-dev pipeline helpers (no network calls)."""

import os
import sys
import unittest
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.search import build_fast_search_query, merge_search_reports, _filter_serper_results, _build_channel_queries  # noqa: E402
from core.llm import _build_analyzer_ref_text, validate_ai_response, _normalize_planner_response  # noqa: E402


class BuildFastSearchQueryTest(unittest.TestCase):
    def test_strips_urls_and_caption_framing(self):
        q = build_fast_search_query("โพสต์จาก Instagram:\nอิงฟ้า วราหะ นำเงิน 350 บาท\nhttps://t.co/xyz")
        self.assertNotIn("https://", q)
        self.assertNotIn("โพสต์จาก", q)
        self.assertNotIn("Instagram:", q)
        self.assertIn("อิงฟ้า", q)

    def test_caps_length(self):
        long_text = "ข้อความ " * 200
        q = build_fast_search_query(long_text)
        self.assertLessEqual(len(q), 140)

    def test_empty_input(self):
        self.assertEqual(build_fast_search_query("   "), "")


class ChannelQueriesTest(unittest.TestCase):
    """แยก query ตามช่องทาง: exa_gov, exa_media ใช้ semantic, serper ใช้ exact keyword"""

    def test_gov_prefers_formal_keywords(self):
        gov_q, media_q, serper_q, serper_news_q = _build_channel_queries("อิงฟ้า", ["อิงฟ้า", "น้ำฝน"], exact_quote="มาตรการ กระตุ้น เศรษฐกิจ อย่าง เป็น ทางการ")
        self.assertIn("อิงฟ้า", gov_q)
        self.assertEqual("มาตรการ กระตุ้น เศรษฐกิจ อย่าง เป็น ทางการ", media_q)
        self.assertIn("อิงฟ้า", serper_q)

    def test_gov_falls_back_to_colloquial_when_no_formal(self):
        gov_q, media_q, serper_q, serper_news_q = _build_channel_queries("อิงฟ้า", ["อิงฟ้า", "น้ำฝน"], "")
        self.assertIn("อิงฟ้า", gov_q)
        self.assertIn("อิงฟ้า", media_q)
        self.assertIn("อิงฟ้า", serper_q)

    def test_no_keywords_returns_plain_query(self):
        gov_q, media_q, serper_q, serper_news_q = _build_channel_queries("อิงฟ้า", [], "")
        self.assertEqual(gov_q, "อิงฟ้า")
        self.assertEqual(media_q, "อิงฟ้า")
        self.assertEqual(serper_q, "อิงฟ้า")


class MergeSearchReportsTest(unittest.TestCase):
    def _ref(self, href, title="t", snippet="s"):
        return {"href": href, "title": title, "snippet": snippet}

    def test_planned_keep_priority_and_dedupe(self):
        wave0 = [self._ref("https://b.com/y", snippet="น้ำฝน วราหะ"), self._ref("https://a.com/x")]
        planned = [self._ref("https://b.com/y", snippet="น้ำฝน"), self._ref("https://c.com/z", snippet="สุพรรณบุรี อิงฟ้า")]
        merged = merge_search_reports(wave0, planned, ["น้ำฝน"])
        self.assertEqual([r["href"] for r in merged], ["https://b.com/y", "https://c.com/z"])
        self.assertEqual(len(merged), 2)  # a.com/x rejected: no keyword in text

    def test_wave0_keyword_gate(self):
        wave0 = [self._ref("https://d.com/zz", title="ทองคำวันนี้", snippet="ราคาทอง")]
        planned = [self._ref("https://b.com/y", snippet="น้ำฝน วราหะ")]
        merged = merge_search_reports(wave0, planned, ["น้ำฝน"])
        self.assertEqual([r["href"] for r in merged], ["https://b.com/y"])

    def test_wave0_fills_when_planned_empty(self):
        wave0 = [self._ref("https://d.com/zz", title="กนง. คงดอกเบี้ย 2.50", snippet="กนง. คงดอกเบี้ย 2.50")]
        merged = merge_search_reports(wave0, [], ["กนง."])
        self.assertEqual(len(merged), 1)

    def test_limit(self):
        wave0 = [self._ref(f"https://w{i}.com", title="กนง. คงดอกเบี้ย", snippet="กนง. คงดอกเบี้ย 2.50") for i in range(8)]
        planned = [self._ref(f"https://p{i}.com", snippet="กนง. คงดอกเบี้ย") for i in range(6)]
        merged = merge_search_reports(wave0, planned, ["กนง."])
        self.assertEqual(len(merged), 14)  # limit is now 15, 8+6=14 items pass

    def test_wave0_single_snippet_keyword_passed(self):
        """Task 6: match 1 คำสามัญใน snippet อย่างเดียว → pass (ผ่อนคลาย)."""
        wave0 = [self._ref("https://d.com/zz", title="ข่าวทั่วไป", snippet="มีคำว่าแจกเงินอยู่ในเนื้อหา")]
        merged = merge_search_reports(wave0, [], ["แจกเงิน"])
        self.assertEqual(len(merged), 1)


class FilterSerperResultsTest(unittest.TestCase):
    """Tests for Serper (Google) filter — different logic from Exa filter."""

    BL = ['youtube.com', 'facebook.com', 'wikipedia.org']
    TM = ['thairath.co.th', 'thaipbs.or.th']

    def _item(self, title="ข่าว", url="https://example.com/news/1", snippet="เนื้อหา", publishedDate="2026-08-14"):
        return {"title": title, "url": url, "text": snippet, "publishedDate": publishedDate}

    def test_keyword_gate_blocks_irrelevant(self):
        items = [self._item(title="ราคาทองวันนี้", snippet="ทองคำพุ่ง")]
        result = _filter_serper_results(items, ["ดอกเบี้ย"], "", [], "", set(), self.BL, self.TM)
        self.assertEqual(len(result), 0)

    def test_keyword_gate_passes_relevant(self):
        items = [self._item(title="กนง. คงดอกเบี้ย", snippet="ประชุมคงอัตรา")]
        result = _filter_serper_results(items, ["ดอกเบี้ย"], "", [], "", set(), self.BL, self.TM)
        self.assertEqual(len(result), 1)

    def test_title_match_scores_higher(self):
        items = [
            self._item(title="ดอกเบี้ยคงที่", url="https://thairath.co.th/1", snippet="x", publishedDate="2026-07-20"),
            self._item(title="ข่าวเศรษฐกิจ", url="https://thairath.co.th/2", snippet="ดอกเบี้ย", publishedDate="2026-07-20"),
        ]
        result = _filter_serper_results(items, ["ดอกเบี้ย"], "", [], "", set(), self.BL, self.TM)
        self.assertEqual(len(result), 2)
        self.assertGreater(result[0]["match_score"], result[1]["match_score"])

    def test_two_keywords_in_snippet_passes(self):
        """Task 6: match >=2 คำใน snippet → ผ่าน (หลายคำยืนยันเรื่องเดียวกัน)."""
        items = [self._item(title="ข่าวทั่วไป", url="https://c.com/3", snippet="อิงฟ้า น้ำฝน เล่าเรื่องเงิน 350 บาท")]
        result = _filter_serper_results(items, ["อิงฟ้า", "น้ำฝน", "350 บาท"], "", [], "", set(), self.BL, self.TM)
        self.assertEqual(len(result), 1)

    def test_blacklist_blocks(self):
        items = [self._item(url="https://www.youtube.com/watch?v=123", title="ดอกเบี้ย")]
        result = _filter_serper_results(items, ["ดอกเบี้ย"], "", [], "", set(), self.BL, self.TM)
        self.assertEqual(len(result), 0)

    def test_spam_domain_blocked(self):
        items = [self._item(url="https://slotxo-casino.com/news", title="ดอกเบี้ย")]
        result = _filter_serper_results(items, ["ดอกเบี้ย"], "", [], "", set(), self.BL, self.TM)
        self.assertEqual(len(result), 0)

    def test_url_dedup_with_exa(self):
        seen = {"https://thairath.co.th/news/123"}
        items = [self._item(url="https://thairath.co.th/news/123", title="ดอกเบี้ย")]
        result = _filter_serper_results(items, ["ดอกเบี้ย"], "", [], "", seen, self.BL, self.TM)
        self.assertEqual(len(result), 0)

    def test_same_content_different_url_kept(self):
        items = [
            self._item(title="กนง. คงดอกเบี้ย 2.50", url="https://thairath.co.th/n/1", snippet="คงอัตรา"),
            self._item(title="กนง. คงดอกเบี้ย 2.50", url="https://khaosod.co.th/n/2", snippet="คงอัตรา"),
        ]
        result = _filter_serper_results(items, ["ดอกเบี้ย"], "", [], "", set(), self.BL, self.TM)
        self.assertEqual(len(result), 2)

    def test_day_based_gate_blocks_old_news(self):
        # ข่าวเกิน 30 วัน (เช่น ข่าวปีที่แล้ว หรือเดือนที่แล้ว) จะถูกเตะทิ้ง
        items = [self._item(title="ดอกเบี้ยคงที่", snippet="คงอัตรา", publishedDate="2025-01-01")]
        result = _filter_serper_results(items, ["ดอกเบี้ย"], "2569", [], "", set(), self.BL, self.TM)
        self.assertEqual(len(result), 0)

    def test_day_based_gate_allows_recent_news(self):
        # ข่าวใหม่ (เช่น ภายใน 30 วัน) จะไม่ถูกเตะทิ้ง
        # datetime.now() ในเทสคือ 2026-08 (สมมติว่าตอนรัน) -> เราจะใช้ 0 วัน คือวันนี้ เพื่อให้ผ่านเสมอ
        today_str = datetime.now().strftime("%Y-%m-%d")
        items_fresh = [self._item(title="ดอกเบี้ยคงที่", snippet="คงอัตรา", publishedDate=today_str)]
        result_fresh = _filter_serper_results(items_fresh, ["ดอกเบี้ย"], "2569", [], "", set(), self.BL, self.TM)
        self.assertEqual(len(result_fresh), 1)

    def test_gov_domain_gets_tier_0(self):
        items = [self._item(url="https://www.bot.go.th/news/rate", title="ดอกเบี้ย")]
        result = _filter_serper_results(items, ["ดอกเบี้ย"], "", [], "", set(), self.BL, self.TM)
        self.assertEqual(len(result), 1)

    def test_no_keywords_passes_all(self):
        items = [self._item(title="อะไรก็ได้", snippet="ไม่มี keyword")]
        result = _filter_serper_results(items, [], "", [], "", set(), self.BL, self.TM)
        self.assertEqual(len(result), 1)


class AnalyzerRefTextTest(unittest.TestCase):
    def test_slices_snippets(self):
        refs = [{"title": "x", "snippet": "ก" * 5000, "pub_date": "2026-01-01"}]
        text = _build_analyzer_ref_text(refs, max_refs=10, max_chars=1000)
        self.assertIn("ก" * 1000, text)
        self.assertNotIn("ก" * 1001, text)

    def test_no_references(self):
        self.assertEqual(_build_analyzer_ref_text([], max_refs=10, max_chars=1000), "ไม่มีอ้างอิง")


class ValidateAiResponseTest(unittest.TestCase):
    def test_score_clamped(self):
        out = validate_ai_response({"score": "7", "comparative_analysis": "x"})
        self.assertEqual(out["score"], 5)

    def test_missing_keys_filled(self):
        out = validate_ai_response({})
        self.assertEqual(out["score"], 3)
        self.assertIsInstance(out["relevant_ref_ids"], list)


class NormalizePlannerResponseTest(unittest.TestCase):
    """Planner normalize — บังคับ PERSONAL_STORY ห้ามมี formal keywords ที่สมมติขึ้น."""

    PERSONAL_TEXT = "เคยมีเพื่อนรัก ตอนที่อยู่สุพรรณบุรี เราไม่มีเงิน เพื่อนคนนี้คอยฝากเงินให้เราตลอดวันละ 10-20 บาท ก่อนออก นางไปเบิกตัวมาให้ 350 บาท จำมาจนทุกวันนี้ ชื่อ น้ำฝน"

    def test_personal_story_forces_empty_formal(self):
        res = {
            "action": "SEARCH",
            "content_type": "PERSONAL_STORY",
            "search_query": "น้ำฝนเพื่อนรักอิงฟ้า",
            "core_keywords": ["อิงฟ้า", "น้ำฝน", "350 บาท", "เบิกตัว"],
            # โมเดลพยายามสมมติคำทางการ → ต้องถูกกวาดทิ้ง
            "core_keywords_formal": ["เงินดิจิทัล", "กระตุ้นเศรษฐกิจ"],
        }
        plan = _normalize_planner_response(res, self.PERSONAL_TEXT, "2569")
        self.assertEqual(plan["content_type"], "PERSONAL_STORY")
        self.assertEqual(plan["core_keywords_formal"], [])
        self.assertEqual(plan["core_keywords"], ["น้ำฝน", "350 บาท", "เบิกตัว"])  # อิงฟ้าไม่อยู่ใน text → ตัดทิ้ง

    def test_hallucinated_keywords_dropped(self):
        """Task 6: keyword ที่ไม่มีในข้อความจริง (hallucinate) ต้องถูกตัดทิ้ง."""
        res = {
            "action": "SEARCH",
            "content_type": "NEWS_CLAIM",
            "search_query": "เพื่อนให้เงิน 350 บาท",
            "core_keywords": ["เพื่อน", "350 บาท", "เงินดิจิทัล", "นโยบายเศรษฐกิจ"],
            "core_keywords_formal": ["มาตรการกระตุ้นเศรษฐกิจ"],
        }
        plan = _normalize_planner_response(res, self.PERSONAL_TEXT, "2569")
        self.assertNotIn("เงินดิจิทัล", plan["core_keywords"])
        self.assertNotIn("นโยบายเศรษฐกิจ", plan["core_keywords"])
        self.assertIn("350 บาท", plan["core_keywords"])
        self.assertEqual(plan["core_keywords_formal"], ["มาตรการกระตุ้นเศรษฐกิจ"])

    def test_platform_words_removed_from_keywords(self):
        """Task 6: คำว่า Facebook/Instagram ในคีย์เวิร์ดต้องถูกกวาดทิ้ง."""
        res = {
            "action": "SEARCH",
            "content_type": "NEWS_CLAIM",
            "search_query": "อิงฟ้า 350 บาท",
            "core_keywords": ["อิงฟ้า", "350 บาท", "facebook", "Instagram", "คลิป"],
            "core_keywords_formal": [],
        }
        plan = _normalize_planner_response(res, "อิงฟ้า 350 บาท สุพรรณบุรี", "2569")
        for bad in ("facebook", "Instagram", "คลิป"):
            self.assertNotIn(bad, plan["core_keywords"])

    def test_generic_words_removed_from_keywords(self):
        """Task 6.9: คำสามัญ ("เพื่อนรัก" ฯลฯ) ต้องถูกตัด — กัน title hit ปล่อยขยะ
        (ข่าว "เพื่อนรักหักเหลี่ยมโหด" ฯลฯ ที่ไม่เกี่ยวกับเรื่องนี้)."""
        res = {
            "action": "SEARCH",
            "content_type": "PERSONAL_STORY",
            "search_query": "เพื่อนรัก ให้เงิน 350 บาท",
            "core_keywords": ["เพื่อนรัก", "น้ำฝน", "350 บาท", "เบิกตัว"],
            "core_keywords_formal": [],
        }
        plan = _normalize_planner_response(res, self.PERSONAL_TEXT, "2569")
        self.assertNotIn("เพื่อนรัก", plan["core_keywords"])
        self.assertNotIn("เพื่อน", plan["core_keywords"])
        self.assertIn("350 บาท", plan["core_keywords"])

    def test_fallback_when_too_few_valid_keywords(self):
        """Task 6: keyword เหลือน้อยเกินไป → fallback สกัดตัวเลขจากข้อความจริง."""
        res = {
            "action": "SEARCH",
            "content_type": "NEWS_CLAIM",
            "search_query": "แจกเงิน",
            "core_keywords": ["แจกเงิน", "สมมติขึ้นมา"],
            "core_keywords_formal": [],
        }
        plan = _normalize_planner_response(res, self.PERSONAL_TEXT, "2569")
        self.assertGreaterEqual(len(plan["core_keywords"]), 1)

    def test_news_claim_keeps_formal(self):
        res = {
            "action": "SEARCH",
            "content_type": "NEWS_CLAIM",
            "search_query": "แจกเงินดิจิทัลวอลเล็ต",
            "core_keywords": ["แจกเงิน", "เงินดิจิทัล"],
            "core_keywords_formal": ["มาตรการกระตุ้นเศรษฐกิจ", "นโยบายเงินดิจิทัล"],
        }
        plan = _normalize_planner_response(res, "แจกเงินดิจิทัลวอลเล็ต 10000 บาท", "2569")
        self.assertEqual(plan["content_type"], "NEWS_CLAIM")
        self.assertEqual(plan["core_keywords_formal"], ["มาตรการกระตุ้นเศรษฐกิจ", "นโยบายเงินดิจิทัล"])
        self.assertEqual(plan["core_keywords"], ["แจกเงิน", "เงินดิจิทัล"])

    def test_cleans_query_and_defaults_year(self):
        plan = _normalize_planner_response({}, "text", "2569")
        self.assertEqual(plan["search_query"], "text")
        self.assertEqual(plan["timeline"], "ไม่ระบุ")


class TestEntityDiscriminatorAndYearPrecision(unittest.TestCase):
    def test_unrelated_opponent_rejected(self):
        """Query is Thailand vs Croatia, reference is Thailand vs Indonesia -> must reject."""
        from core.search import _compute_relevance_score
        query = "ถ่ายทอดสด ไทย U17 พบ โครเอเชีย ชิงอันดับ 7 ชิงแชมป์โลก 2026 คืนนี้"
        keywords = ["ถ่ายทอดสด", "ไทย U17", "โครเอเชีย", "ชิงอันดับ 7", "ชิงแชมป์โลก"]
        
        # Unrelated match
        unrelated_title = "ถ่ายทอดสด วอลเลย์บอลหญิง SEA V CUP 2026 ไทย VS อินโดนีเซีย 16.00 น."
        unrelated_snip = "ดูสด วอลเลย์บอลหญิง นัดแรก ทีมชาติไทย พบ อินโดนีเซีย"
        score = _compute_relevance_score(keywords, query, unrelated_title, unrelated_snip, timeline="2569")
        self.assertLess(score, 30.0)

    def test_old_year_rejected_when_targeting_new_year(self):
        """Query is World Championship 2026, reference is World Championship 2025 -> must reject."""
        from core.search import _compute_relevance_score
        query = "ถ่ายทอดสด ไทย U17 พบ โครเอเชีย ชิงอันดับ 7 ชิงแชมป์โลก 2026 คืนนี้"
        keywords = ["ถ่ายทอดสด", "ไทย U17", "โครเอเชีย", "ชิงอันดับ 7", "ชิงแชมป์โลก"]
        
        old_title = "“พิมพิชยา” ทุบกระจาย! 5 ท็อปสกอร์ วอลเลย์บอลหญิงชิงแชมป์โลก 2025 ไทย ชนะ 3-1 เซต"
        old_snip = "สรุปผลงาน วอลเลย์บอลหญิงไทย ชนะ ในศึกชิงแชมป์โลก 2025"
        score = _compute_relevance_score(keywords, query, old_title, old_snip, timeline="2569")
        self.assertLess(score, 30.0)

    def test_exact_match_scores_high(self):
        from core.search import _compute_relevance_score
        query = "ถ่ายทอดสด ไทย U17 พบ โครเอเชีย ชิงอันดับ 7 ชิงแชมป์โลก 2026 คืนนี้"
        keywords = ["ถ่ายทอดสด", "ไทย U17", "โครเอเชีย", "ชิงอันดับ 7", "ชิงแชมป์โลก"]
        
        exact_title = "ถ่ายทอดสด วอลเลย์บอลหญิง U17 ชิงแชมป์โลก 2026 ไทย พบ โครเอเชีย ชิงอันดับ 7"
        exact_snip = "โปรแกรมถ่ายทอดสด วอลเลย์บอลหญิง U17 ชิงแชมป์โลก 2026 ทีมชาติไทย ลงสนามดวล โครเอเชีย รอบจัดอันดับ 7-8"
        score = _compute_relevance_score(keywords, query, exact_title, exact_snip, timeline="2569")
        self.assertGreaterEqual(score, 80.0)


if __name__ == "__main__":
    unittest.main()
