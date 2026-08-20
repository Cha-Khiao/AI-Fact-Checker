import json
import os
import re
import time
import logging
from datetime import datetime
from dotenv import load_dotenv
import pytz

try:
    from . import http_client
except ImportError:
    import http_client

logger = logging.getLogger(__name__)

load_dotenv(override=True)

API_URL = "https://openrouter.ai/api/v1/chat/completions"

def get_ai_model() -> str:
    load_dotenv(override=True)
    return os.getenv("AI_MODEL", "").strip()

def get_openrouter_api_key() -> str:
    load_dotenv(override=True)
    return os.getenv("OPENROUTER_API_KEY", "").strip()

AI_MODEL = get_ai_model()
OPENROUTER_API_KEY = get_openrouter_api_key()
LLM_BACKEND = os.getenv("LLM_BACKEND", "openrouter").strip()

def get_current_thai_time():
    tz = pytz.timezone('Asia/Bangkok')
    now = datetime.now(tz)
    months_th = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"]
    return f"วันที่ {now.day} {months_th[now.month - 1]} พ.ศ. {now.year + 543} (ค.ศ.{now.year})"

def sanitize_for_api(text: str) -> str:
    if not text: return ""
    clean = re.sub(r'[<>{}\\]', ' ', text)
    clean = clean.encode('utf-8', 'ignore').decode('utf-8')
    return re.sub(r'\s+', ' ', clean).strip()

def parse_json_safely(text: str) -> dict:
    if not text: return {}
    match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL | re.IGNORECASE)
    if match:
        raw_match = match.group(1)
        for s in (True, False):
            try: return json.loads(raw_match, strict=s)
            except Exception: pass
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        raw_match = match.group(0)
        for s in (True, False):
            try: return json.loads(raw_match, strict=s)
            except Exception: pass
    return {}

def clean_fact_text(text: str) -> str:
    if not text:
        return ""
    t = str(text)

    t = re.sub(r'(?m)^\s*#{1,6}\s*', '', t)
    t = re.sub(r'#{1,6}\s*', '', t)

    t = re.sub(r'\[\s*(?:แหล่ง)?(?:ข้อมูล)?อ้างอิง(?:ที่)?\s*[\d,\sและ-]+\s*\]', '', t, flags=re.IGNORECASE)
    t = re.sub(r'\(\s*(?:แหล่ง)?(?:ข้อมูล)?อ้างอิง(?:ที่)?\s*[\d,\sและ-]+\s*\)', '', t, flags=re.IGNORECASE)
    t = re.sub(r'\[\s*แหล่งที่\s*[\d,\sและ-]+\s*\]', '', t, flags=re.IGNORECASE)
    t = re.sub(r'\(\s*แหล่งที่\s*[\d,\sและ-]+\s*\)', '', t, flags=re.IGNORECASE)
    t = re.sub(r'\[\s*\d+\s*\]', '', t)

    t = re.sub(r'[ \t]+', ' ', t)
    t = re.sub(r'\n\s*\n+', '\n\n', t)
    return t.strip()

def validate_ai_response(parsed_dict: dict, raw_output: str = "", force_error: bool = False) -> dict:
    template = {
        "verdict_summary": "ไม่สามารถเปรียบเทียบข้อมูลได้",
        "supported_points": ["ไม่พบข้อมูลที่สอดคล้องกับแหล่งอ้างอิง"],
        "conflicting_points": ["ไม่พบข้อมูลที่ขัดแย้ง หรือแหล่งอ้างอิงไม่เพียงพอต่อการเปรียบเทียบ"],
        "comparative_analysis": "ระบบไม่สามารถวิเคราะห์เปรียบเทียบเชิงลึกได้อย่างสมบูรณ์",
        "score": 3,
        "relevant_ref_ids": [],
        "is_error": force_error
    }

    if not isinstance(parsed_dict, dict) or not parsed_dict:
        if raw_output:
            template["comparative_analysis"] = f"❌ โครงสร้างข้อมูลผิดพลาด\n\n[Raw Data]:\n{raw_output[:500]}"
        template["is_error"] = True
        return template

    try:
        score_str = str(parsed_dict.get("score", 3))
        numbers = re.findall(r'\d+', score_str)
        parsed_dict["score"] = max(1, min(5, int(numbers[0]))) if numbers else 3
    except (ValueError, TypeError, IndexError, KeyError):
        parsed_dict["score"] = 3

    try:
        rel_val = parsed_dict.get("relevant_ref_ids", [])
        if isinstance(rel_val, list):
            parsed_dict["relevant_ref_ids"] = [int(x) for x in rel_val if str(x).isdigit() and int(x) != 0]
        else:
            numbers = re.findall(r'\d+', str(rel_val))
            parsed_dict["relevant_ref_ids"] = [int(n) for n in numbers if int(n) != 0]
    except (ValueError, TypeError, KeyError):
        parsed_dict["relevant_ref_ids"] = []

    parsed_dict["verdict_summary"] = clean_fact_text(parsed_dict.get("verdict_summary", ""))
    parsed_dict["comparative_analysis"] = clean_fact_text(parsed_dict.get("comparative_analysis", ""))

    raw_supp = parsed_dict.get("supported_points", [])
    if isinstance(raw_supp, str): raw_supp = [raw_supp]
    cleaned_supp = [clean_fact_text(p) for p in raw_supp if clean_fact_text(p)]
    parsed_dict["supported_points"] = cleaned_supp or ["ไม่พบข้อมูลที่สอดคล้องกับแหล่งอ้างอิง"]

    raw_conf = parsed_dict.get("conflicting_points", [])
    if isinstance(raw_conf, str): raw_conf = [raw_conf]
    cleaned_conf = [clean_fact_text(p) for p in raw_conf if clean_fact_text(p)]
    parsed_dict["conflicting_points"] = cleaned_conf or ["ไม่พบข้อมูลที่ขัดแย้งกับข้อเท็จจริง"]

    score = parsed_dict["score"]
    if score == 5:
        ifcn_rating = "True"
        ifcn_label_th = "จริง / สอดคล้องสมบูรณ์"
        confidence_pct = 98
    elif score == 4:
        ifcn_rating = "Mostly True"
        ifcn_label_th = "จริงเป็นส่วนใหญ่"
        confidence_pct = 85
    elif score == 3:
        ifcn_rating = "Half True"
        ifcn_label_th = "ก้ำกึ่ง / มีเค้าโครงจริงบางส่วน"
        confidence_pct = 50
    elif score == 2:
        ifcn_rating = "Mostly False"
        ifcn_label_th = "บิดเบือน / คลาดเคลื่อนจากข้อเท็จจริง"
        confidence_pct = 25
    else:
        ifcn_rating = "False"
        ifcn_label_th = "เท็จ / ข่าวปลอม / ขัดแย้งสิ้นเชิง"
        confidence_pct = 5

    parsed_dict["ifcn_rating"] = ifcn_rating
    parsed_dict["ifcn_label_th"] = ifcn_label_th
    parsed_dict["confidence_pct"] = confidence_pct

    # Disinformation Category Normalization
    category_map = {
        "FINANCIAL_SCAM": "การเงิน / หลอกลงทุน / กู้เงิน",
        "HEALTH_MEDICINE": "สุขภาพ / ยา / อาหารเสริม",
        "PUBLIC_POLICY_GOV": "นโยบายรัฐ / สวัสดิการ",
        "DISASTER_SAFETY": "ภัยพิบัติ / อุบัติภัย / เตือนภัย",
        "CELEBRITY_SOCIAL": "ข่าวบันเทิง / บุคคลสาธารณะ",
        "GENERAL_MISINFO": "ข่าวสารทั่วไป / ข่าวลือโซเชียล"
    }
    raw_cat = str(parsed_dict.get("disinformation_category", "GENERAL_MISINFO")).upper().strip()
    if raw_cat not in category_map:
        raw_cat = "GENERAL_MISINFO"
    parsed_dict["disinformation_category"] = raw_cat
    parsed_dict["disinformation_category_label"] = category_map[raw_cat]

    # Sub-claims Multi-Claim Breakdown Normalization
    raw_subs = parsed_dict.get("sub_claims", [])
    valid_subs = []
    if isinstance(raw_subs, list):
        for item in raw_subs:
            if isinstance(item, dict) and item.get("claim_text"):
                sub_score = item.get("score", score)
                try:
                    sub_score = max(1, min(5, int(re.findall(r'\d+', str(sub_score))[0])))
                except Exception:
                    sub_score = 3
                
                tier_labels = {
                    5: "จริง (100%)",
                    4: "จริงเป็นส่วนใหญ่ (75%)",
                    3: "ก้ำกึ่ง/ยังไม่มีข้อยุติ (50%)",
                    2: "บิดเบือน (25%)",
                    1: "เท็จ/ข่าวปลอม (0%)"
                }
                valid_subs.append({
                    "claim_text": clean_fact_text(str(item.get("claim_text", ""))),
                    "score": sub_score,
                    "verdict_tier": sub_score,
                    "verdict_label": item.get("verdict_label") or tier_labels.get(sub_score, "ยังไม่มีข้อยุติ"),
                    "detail": clean_fact_text(str(item.get("detail", "")))
                })

    parsed_dict["sub_claims"] = valid_subs

    parsed_dict["claim_review_schema"] = {
        "@context": "https://schema.org",
        "@type": "ClaimReview",
        "reviewRating": {
            "@type": "Rating",
            "ratingValue": score,
            "bestRating": 5,
            "worstRating": 1,
            "alternateName": ifcn_rating
        },
        "headline": parsed_dict.get("verdict_summary", ""),
        "text": parsed_dict.get("comparative_analysis", "")
    }

    return parsed_dict

def call_openrouter(prompt: str, system_msg: str, timeout: float = None, model: str = None, max_tokens: int = None) -> dict:
    parsed, _meta = _call_openrouter_with_meta(prompt, system_msg, timeout=timeout, model=model, max_tokens=max_tokens)
    return parsed

def _call_openrouter_with_meta(prompt: str, system_msg: str, timeout: float = None, model: str = None, max_tokens: int = None):
    if timeout is None:
        timeout = _analyzer_default_timeout()
    if max_tokens is None:
        try:
            max_tokens = int(os.getenv("LLM_MAX_TOKENS", "2048"))
        except ValueError:
            max_tokens = 2048
    api_key = get_openrouter_api_key()
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    provider_sort = os.getenv("OPENROUTER_PROVIDER_SORT", "throughput")
    target_model = model or get_ai_model()

    payload = {
        "model": target_model,
        "messages": [{"role": "system", "content": system_msg}, {"role": "user", "content": prompt}],
        "temperature": 0.0,
        "max_tokens": max_tokens,
        "provider": {
            "sort": provider_sort,
            "allow_fallbacks": True
        }
    }
    max_retries = 3
    last_error = None

    for attempt in range(max_retries):
        try:
            res = http_client.wall_clock_request(
                "POST", API_URL, headers=headers, json=payload,
                timeout=http_client.split_timeout(timeout),
            )
            res.raise_for_status()
            data = res.json()
            if "choices" not in data or not data["choices"]:
                raise ValueError("OpenRouter returned no choices/model available")

            choice = data["choices"][0]
            content = choice.get("message", {}).get("content", "")
            finish_reason = choice.get("finish_reason")
            content = re.sub(r'<think>[\s\S]*?</think>', '', content).strip()
            parsed = parse_json_safely(content)
            return parsed, {
                "finish_reason": finish_reason,
                "content_length": len(content or ""),
                "truncated": (finish_reason in ("length", "max_tokens")) or not parsed,
            }
        except Exception as e:
            last_error = e
            err_str = str(e)
            logger.error(f"OpenRouter API Error (Attempt {attempt+1}/{max_retries}): {e}")

            if "402" in err_str or "Payment Required" in err_str:
                return {}, {"error": err_str, "truncated": False, "payment_required": True}

            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)

    err_str = str(last_error)
    return {}, {"error": err_str, "truncated": False, "payment_required": False}

try:
    from .date_utils import parse_thai_and_global_date as parse_relative_or_explicit_date
except ImportError:
    try:
        from date_utils import parse_thai_and_global_date as parse_relative_or_explicit_date
    except ImportError:
        pass

def analyze_intent_and_plan_search(news_text: str, timeout: float = None) -> tuple:
    text_for_analysis = news_text
    text_chunk = sanitize_for_api(text_for_analysis[:1500])
    tz = pytz.timezone('Asia/Bangkok')
    current_year_th = datetime.now(tz).year + 543
    if timeout is None:
        timeout = _planner_timeout()

    current_date_str = datetime.now(tz).strftime("วันที่ %d %B พ.ศ. %Y เวลา %H:%M น.")
    det_iso, det_display, is_fresh = parse_relative_or_explicit_date(text_chunk)
    post_time_hint = f"ตรวจพบเวลาของโพสต์/ข่าวในข้อความ: {det_display}" if det_display else "เวลาของโพสต์/ข่าว: ไม่ได้ระบุวันที่ชัดเจน (ให้วิเคราะห์จากบริบท)"

    prompt = f"""ข้อความที่ต้องการตรวจสอบ:
"{text_chunk}"

บริบทเวลา:
- [เวลาระบบปัจจุบัน]: {current_date_str}
- [เวลาเผยแพร่ของข่าว/โพสต์]: {post_time_hint}

หน้าที่: จำแนกประเภทเนื้อหา และสกัด "ข้อมูลสำหรับค้นหา" (Optimized for Search Engine)

ขั้นตอนที่ 1 — จำแนกประเภทเนื้อหา (content_type):
- "PERSONAL_STORY": เรื่องราวส่วนตัว/ประสบการณ์/เรื่องเล่า ที่ไม่เกี่ยวกับนโยบายรัฐหรือข่าวสาธารณะ
- "NEWS_CLAIM": ข่าว/ข้อกล่าวอ้าง/เหตุการณ์สาธารณะ/นโยบายที่มีคนแชร์ต่อ
- "POLICY_ANNOUNCEMENT": ประกาศนโยบาย/มาตรการของหน่วยงานรัฐอย่างเป็นทางการ
- "GENERAL": ประเภทอื่น ๆ

ขั้นตอนที่ 2 — สกัดข้อมูลค้นหา ตามกฎความถูกต้องและกรองขยะ (สำคัญมาก!):
⚠️ ห้ามเพิ่มคำที่ "ไม่มีอยู่ในข้อความ" เป็นอันขาด!
🚫 กฎการตัดโฆษณาและเมนูเว็บ (Crucial): หากข้อความมีข้อความเมนู, ปุ่มกด, คำโฆษณา (เช่น "ตรวจหวย", "ดูดวง", "สมัครสมาชิก", "แชร์", "ข่าวด่วนวันนี้", "โปรโมชั่น", "อ่านต่อ", "หน้าหลัก", "ไลฟ์สไตล์") ห้ามนำคำเหล่านี้มาใส่ใน topic_keywords หรือ core_entities เด็ดขาด! ให้เจาะจงเฉพาะ "หัวข้อข่าว ประเด็นหลัก และชื่อบุคคล/หน่วยงาน/เหตุการณ์จริง" เท่านั้น

⚠️ **คำแนะนำสำคัญเพื่อให้ค้นหาพบแหล่งอ้างอิงตรงประเด็น 100%:**
1. `topic_keywords`: สกัด "กลุ่มคำที่เป็นแก่นพาดหัวของข่าว" (Headline Keyword Cluster) ที่สำนักข่าวใช้พาดหัวจริง เช่น "วอลเลย์บอลหญิง U17 ไทย โครเอเชีย ชิงแชมป์โลก 2026", "อนุทิน สั่งเด้งอธิบดี เสียหาย 4.5 พันล้าน"
2. `core_entities`: สกัดคำนามสำคัญ กีฬา/ประเด็นหลัก ชื่อบุคคล องค์กร และประเทศ/คู่แข่งขัน (เช่น ["วอลเลย์บอลหญิง U17", "ชิงแชมป์โลก 2026", "ไทย", "โครเอเชีย"]) ห้ามใส่คำบอกเวลาหรือคำกริยาทั่วไปอย่าง "ถ่ายทอดสด", "คืนนี้", "ชิงอันดับ", "วันนี้"
3. `exact_quote`: คัดลอกประโยคเด็ด หรือใจความสำคัญที่สุดจากข้อความต้นฉบับมาตรงๆ (ห้ามดัดแปลง) เพื่อใช้ค้นหาแบบ Exact Match
4. `publish_date_context`: เวลาที่โพสต์หรือเผยแพร่ข่าว (หากในข้อความมีระบุ เช่น "25 มิถุนายน 2569", "2 ชั่วโมงที่แล้ว" ให้ใช้ค่านั้น ห้ามเอาเวลาระบบปัจจุบันมาใส่แทนเด็ดขาด)
5. `content_timeline`: โครงสร้าง 5W1H (ใคร ทำอะไร ที่ไหน เมื่อไหร่ ผลเป็นอย่างไร) ของเหตุการณ์ในข่าว แยกออกจากเวลาที่โพสต์

ตอบกลับเป็น JSON รูปแบบนี้เท่านั้น:
{{
    "action": "SEARCH",
    "content_type": "PERSONAL_STORY หรือ NEWS_CLAIM หรือ POLICY_ANNOUNCEMENT หรือ GENERAL",
    "topic_keywords": "กลุ่มคำพาดหัวข่าว/แก่นเรื่องหลัก",
    "exact_quote": "ประโยคที่คัดลอกมาจากต้นฉบับเป๊ะๆ",
    "core_entities": ["คำนามสำคัญ", "ตัวเลข", "สถานที่", "ชื่อคน", "ประเด็นหลัก"],
    "locations": ["จังหวัด", "สถานที่", "ประเทศ"],
    "publish_date_context": "เวลาของโพสต์หรือข่าวต้นฉบับ",
    "content_timeline": "เหตุการณ์เกิดขึ้นเมื่อไหร่ ใครทำอะไร",
    "topic_summary": "สรุปประเด็นหลัก 1 ประโยค"
}}"""
    try:
        planner_max_tokens = int(os.getenv("PLANNER_MAX_TOKENS", "300"))
    except ValueError:
        planner_max_tokens = 300

    res_data = call_openrouter(
        prompt,
        "Classify content type (PERSONAL_STORY/NEWS_CLAIM/POLICY_ANNOUNCEMENT/GENERAL) and extract exact quotes and entities. NEVER invent keywords absent from the text. STRICTLY THAI LANGUAGE ONLY. NO CHINESE ALLOWED. Output strictly in JSON format.",
        timeout=timeout,
        model=get_ai_model(),
        max_tokens=planner_max_tokens,
    )
    return _normalize_planner_response(res_data, text_chunk, current_year_th)

_PLATFORM_WORDS = {
    'facebook', 'fb', 'instagram', 'ig', 'tiktok', 'twitter', 'x', 'youtube',
    'line', 'threads', 't.me', 'telegram', 'wechat', 'snapchat', 'pinterest',
    'reddit', 'blockdit', 'pantip', 'quora', 'viber', 'whatsapp', 'linkedin',
    'messenger', 'copylink', 'share',
    'เฟซบุ๊ก', 'เฟสบุ๊ก', 'เฟสบุค', 'อินสตาแกรม', 'ติ๊กต็อก', 'ติ๊กต๊อก',
    'ทวิตเตอร์', 'ยูทูป', 'ไลน์', 'วิดีโอ', 'คลิป', 'แชท', 'แฮชแท็ก',
}

_NOISE_WORDS = {
    'ข่าว', 'ข่าวล่าสุด', 'ล่าสุด', 'วันนี้', 'ด่วน', 'ร้อนแรง', 'ไวรัล',
    'viral', 'โพสต์', 'แคปชั่น', 'caption', 'แชร์', 'แชร์ต่อ', 'status',
    'คลิป', 'รูป', 'ภาพ', 'เรื่อง', 'ประเด็น', 'ตรวจสอบ', 'จริงไหม',
    'จริงหรือ', 'ความจริง', 'ชัดเจน', 'น่ารัก', 'สุดยอด', 'รายงาน',
    'แชร์บทความนี้', 'แชร์บทความ', 'แชร์เรื่องนี้', 'แชร์โพสต์', 'คัดลอกลิงก์', 'แชร์ไปยัง',
    'ตรวจหวย', 'ดูดวง', 'สมัครสมาชิก', 'เข้าสู่ระบบ', 'หน้าหลัก', 'เมนู', 'ไลฟ์สไตล์',
    'ถ่ายทอดสด', 'คืนนี้', 'ชิงอันดับ', 'ดูสด', 'ลิงก์ดูสด', 'ช่องทางถ่ายทอดสด',
    'พบ', 'ดวล', 'ปะทะ', 'เจอกัน', 'นัด', 'รอบ',
}

_GENERIC_WORDS = {
    'เพื่อนรัก', 'เพื่อน', 'แฟน', 'เมีย', 'ผัว', 'สามี', 'ภรรยา', 'หนุ่ม',
    'สาว', 'รัก', 'เงิน', 'ลูก', 'ครอบครัว', 'คนรัก', 'แฟนเก่า', 'แม่',
    'พ่อ', 'น้อง', 'พี่', 'ลุง', 'ป้า', 'ตา', 'ยาย',
}

def _sanitize_keywords(keywords: list) -> list:
    cleaned = []
    seen = set()
    for kw in keywords:
        k = str(kw or "").strip()
        k = re.sub(r'^[\s\'"“”()\[\]|#]+|[\s\'"“”()\[\]|#]+$', '', k)
        if not k:
            continue
        k_lower = k.lower()
        if k_lower in _PLATFORM_WORDS or k_lower in _NOISE_WORDS or k_lower in _GENERIC_WORDS:
            continue
        if any(nw in k_lower for nw in ['แชร์บทความนี้', 'แชร์บทความ', 'คัดลอกลิงก์', 'messenger', 'linkedin', 'whatsapp']):
            continue

        if re.match(r'^\d{1,2}$', k):
            continue
        if len(k) > 30:
            continue
        if k_lower in seen:
            continue
        seen.add(k_lower)
        cleaned.append(k)
    return cleaned

def _validate_keywords_against_text(keywords: list, text: str) -> list:
    if not text:
        return keywords
    text_lower = text.lower()
    valid = []
    for kw in keywords:
        kw_lower = kw.lower().strip()
        if not kw_lower:
            continue
        if kw_lower in text_lower:
            valid.append(kw)
    return valid

def _extract_numeric_keywords(text: str) -> list:
    nums = re.findall(r'(\d[\d,]*\s*(?:บาท|%|ปี|วัน|เดือน|ล้าน|พัน|หมื่น|แสน|ครั้ง|คน|ราย|จุด|ดอลลาร์|เหรียญ|ล้านบาท))', text, re.IGNORECASE)
    return [n.strip() for n in dict.fromkeys(nums)]

def _fallback_keywords(text: str, current_keywords: list, exact_quote: str = "") -> list:
    result = list(current_keywords)
    seen = {k.lower() for k in result}

    if exact_quote and len(exact_quote) > 10:
        text_clean = re.sub(r'https?://\S+', ' ', exact_quote)
    else:
        text_clean = re.sub(r'https?://\S+', ' ', text)

    for num in _extract_numeric_keywords(text_clean):
        if num.lower() not in seen:
            result.append(num)
            seen.add(num.lower())

    noise_set = _PLATFORM_WORDS | _NOISE_WORDS | _GENERIC_WORDS

    if len(result) < 8:
        word_re = re.compile(r'[\u0E00-\u0E7FA-Za-z0-9]{2,30}')
        for m in word_re.findall(text_clean):
            if m.lower() in seen or m.lower() in noise_set or len(m) < 2:
                continue
            result.append(m)
            seen.add(m.lower())
            if len(result) >= 8:
                break
    return result[:10]

def _normalize_planner_response(res_data: dict, text_chunk: str, current_year_th: str) -> dict:
    action = "SEARCH"
    content_type = str(res_data.get("content_type", "NEWS_CLAIM")).upper().strip()
    if content_type not in ("PERSONAL_STORY", "NEWS_CLAIM", "POLICY_ANNOUNCEMENT", "GENERAL"):
        content_type = "NEWS_CLAIM"

    topic_keywords = res_data.get("topic_keywords", "")
    if isinstance(topic_keywords, list):
        topic_keywords = " ".join([str(q) for q in topic_keywords])
    topic_keywords = str(topic_keywords)

    exact_quote = res_data.get("exact_quote", "")
    if not exact_quote.strip() or len(exact_quote) < 5:
        exact_quote = text_chunk[:100].replace('\n', ' ')

    core_entities = res_data.get("core_entities", res_data.get("core_keywords", []))
    if isinstance(core_entities, str): core_entities = [core_entities]
    core_entities = [k.replace('"', '').replace("'", "").strip() for k in core_entities if k.strip()]
    core_entities = _sanitize_keywords(core_entities)
    core_entities = _validate_keywords_against_text(core_entities, text_chunk)
    if len(core_entities) < 2:
        core_entities = _fallback_keywords(text_chunk, core_entities, exact_quote)

    topic_keywords = res_data.get("topic_keywords", "")
    if isinstance(topic_keywords, list):
        topic_keywords = " ".join([str(q) for q in topic_keywords])
    topic_keywords = str(topic_keywords).strip()

    if not topic_keywords or len(topic_keywords.split()) > 15:
        topic_keywords = " ".join(core_entities[:5]) if core_entities else exact_quote

    clean_query = re.sub(r'(?i)(แชร์บทความนี้|แชร์บทความ|แชร์เรื่องนี้|คัดลอกลิงก์|facebook|fb|twitter|\bx\b|x\.com|tiktok|youtube|linkedin|messenger|whatsapp|line|ข่าวล่าสุด|รัฐบาลไทย|\||\.\.\.)', ' ', topic_keywords)
    clean_query = re.sub(r'(\bเวลา\s*)?\d{1,2}[\.:]\d{2}\s*(?:น\.|น)?', ' ', clean_query)
    clean_query = re.sub(r'\b\d{1,2}\b', ' ', clean_query)
    clean_query = re.sub(r'(?:^|\s+)[\u0E00-\u0E7F\w](?:\s+|$)', ' ', clean_query)
    clean_query = re.sub(r'\s+', ' ', clean_query).strip()
    if len(clean_query) < 3 or len(clean_query.split()) > 10:
        clean_query = " ".join(core_entities[:5]) if core_entities else text_chunk[:80]

    locations = res_data.get("locations", [])
    if isinstance(locations, str): locations = [locations]
    locations = [str(l).strip() for l in locations if str(l).strip()]

    content_timeline = str(res_data.get("content_timeline", res_data.get("timeline", "ไม่ระบุ"))).strip()
    publish_date_context = str(res_data.get("publish_date_context", "ไม่ระบุ")).strip()
    topic_summary = str(res_data.get("topic_summary", "เปรียบเทียบและวิเคราะห์เนื้อหา")).strip()

    det_iso, det_display, is_fresh = parse_relative_or_explicit_date(text_chunk)
    if det_display and det_display != "ไม่ระบุในข้อความ":
        publish_date_context = det_display
        if content_timeline in ["ไม่ระบุ", "", "N/A"] or not re.search(r'\b(25\d{2}|20\d{2})\b', content_timeline):
            content_timeline = det_display

    core_keywords_formal = res_data.get("core_keywords_formal", [])
    if isinstance(core_keywords_formal, str): core_keywords_formal = [core_keywords_formal]
    core_keywords_formal = [str(k).strip() for k in core_keywords_formal if str(k).strip()]
    if content_type == "PERSONAL_STORY":
        core_keywords_formal = []

    return {
        "action": action,
        "search_query": clean_query,
        "topic_keywords": clean_query,
        "topic_summary": topic_summary,
        "locations": locations,
        "core_keywords": core_entities,
        "timeline": content_timeline,
        "content_timeline": content_timeline,
        "publish_date_context": publish_date_context,
        "content_type": content_type,
        "core_keywords_formal": core_keywords_formal,
        "exact_quote": exact_quote,
        "is_fresh_news": is_fresh
    }

def _build_analyzer_ref_text(references: list, max_refs: int = 10, max_chars: int = 1000) -> str:
    if not references:
        return "ไม่มีอ้างอิง"
    parts = []
    for i, r in enumerate(references[:max_refs]):
        snippet = str(r.get("snippet", "") or "")
        if len(snippet) > max_chars:
            snippet = snippet[:max_chars]
        parts.append(
            f"[อ้างอิง {i+1}]: {r.get('title', '')} | วันที่: {r.get('pub_date', 'ไม่ระบุ')}\nเนื้อหา: {snippet}"
        )
    return "\n\n".join(parts)

def _build_analyzer_prompt(clean_claim: str, origin_info: str, ref_text: str, current_time_context: str, content_type: str = "NEWS_CLAIM", content_timeline: str = "ไม่ระบุ", publish_date_context: str = "ไม่ระบุ"):
    system_msg = "You are a Senior Fact-Checking Journalist & Ombudsman. STRICTLY THAI LANGUAGE ONLY. DO NOT OUTPUT CHINESE CHARACTERS. Write clear, professional, in-depth, citizen-friendly explanations in THAI. Output strictly valid JSON."
    content_type_label = {
        "PERSONAL_STORY": "เรื่องราวส่วนตัว / ประสบการณ์ / โซเชียลไวรัล",
        "NEWS_CLAIM": "ข่าว / ข้อกล่าวอ้างเหตุการณ์สาธารณะ",
        "POLICY_ANNOUNCEMENT": "ประกาศนโยบาย / มาตรการของหน่วยงานรัฐ",
        "GENERAL": "เรื่องทั่วไป",
    }.get(content_type, "เรื่องทั่วไป")
    prompt = f"""คุณคือ "บรรณาธิการข่าวและผู้เชี่ยวชาญการตรวจสอบข้อเท็จจริงอาวุโส (Senior Fact-Checking Editor & Public Ombudsman)"
ภารกิจของคุณคือ อธิบายข้อเท็จจริงอย่างลึกซึ้ง มีหลักฐานหนักแน่น ใช้ภาษาไทยที่สุภาพ เป็นมืออาชีพ และประชาชนทุกระดับเข้าใจได้ทันที โดยงดใช้คำศัพท์เชิงเทคนิคของโปรแกรมเมอร์ (No Developer Jargon)

เวลาปัจจุบัน: {current_time_context}
[ประเภทเนื้อหาที่ตรวจสอบ]: {content_type_label}
[ข้อความที่ต้องการตรวจสอบ]: "{clean_claim}"
[แหล่งที่มา]: {origin_info}
[ไทม์ไลน์โพสต์]: {publish_date_context}
[ไทม์ไลน์เนื้อหา (5W1H)]: {content_timeline}

[แหล่งข้อมูลอ้างอิงจากสื่อหลักและหน่วยงานทางการ]:
{ref_text}

⭐ **แนวทางการประเมินและเรียบเรียงบทวิเคราะห์ (Editorial Guidelines):**

1. 🎯 **วิเคราะห์เปรียบเทียบอย่างลึกซึ้ง (In-Depth Comparison):**
   - **กรณีเรื่องจริง (True / Mostly True):** อธิบายลำดับเหตุการณ์จริง ใครทำอะไร ที่ไหน ตัวเลขความเสียหายหรือข้อเท็จจริงตามที่สื่อหลักรายงาน
   - **กรณีบิดเบือน (Distorted / Misleading):** แยกแยะให้ชัดว่าส่วนใดเป็นเรื่องจริง และส่วนใดที่ถูกแต่งเติม ตัดต่อบริบท หรือชี้นำผิดทิศทาง
   - **กรณีข่าวปลอม (False / Debunked):** ชี้แจงว่าสื่อหลัก/หน่วยงานทางการได้ออกมาปฏิเสธหรือเตือนภัยอย่างไรบ้าง

2. 🚨 **กฎเหล็กการตรวจจับข่าวปลอมและการประเมินหลักฐาน (Strict Evidence & Debunk Protocol):**
   - **กรณีพบการหักล้าง (Debunked / Contradiction):** ถ้าแหล่งอ้างอิงมีคำว่า 'ข่าวปลอม', 'เตือนภัย', 'ชี้แจงไม่จริง', 'ปฏิเสธ', 'ไม่มีนโยบาย', 'แอบอ้าง' หรือเนื้อหาข่าวปฏิเสธข้อความของผู้ใช้ → ต้องให้ **คะแนน 1 (0% ข้อมูลเท็จ / ข่าวปลอม)** หรือ **2 (25% บิดเบือน)** ทันที! ห้ามมองว่าสอดคล้องเพียงเพราะมีคีย์เวิร์ดเรื่องเดียวกันเด็ดขาด!
   - **กฎข่าวใหม่สดๆ (Absence of Evidence is NOT Evidence of Falsehood):** หากเป็นข่าวด่วนใหม่ล่าสุด (Emerging Breaking News) ที่ยังไม่มีสื่อหลักลงยืนยัน และยังไม่มีหน่วยงานใดออกมาชี้แจงหักล้าง → **ห้ามด่วนตัดสินเป็นคะแนน 1 (ข่าวปลอม) หรือ 5 (จริง)** แต่ให้คะแนน **3 (50% ก้ำกึ่ง / ยังไม่มีข้อยุติ)** พร้อมระบุในบทวิเคราะห์ว่า *"เป็นประเด็นสดใหม่ที่ยังไม่มีการยืนยันหรือปฏิเสธอย่างเป็นทางการ โปรดรอการแถลงจากหน่วยงานที่เกี่ยวข้อง"*
   - **กฎกระแสโซเชียล (Social Volume ≠ Truth):** การที่คนแชร์เยอะบนโซเชียลไม่ได้แปลว่าเป็นความจริง หากไม่มีเอกสาร แถลงการณ์ หรือสื่อหลักยืนยัน ให้จัดเป็นข่าวลือที่ยังไม่มีข้อยุติ (คะแนน 3) และหากหน่วยงานที่ถูกพาดพิงออกมาปฏิเสธ ให้ปรับเป็นคะแนน 1 ทันที

3. ⚖️ **เกณฑ์การให้คะแนนความถูกต้อง 5 ระดับ (Standard 5-Tier Scoring):**
   - **5 (100% จริง / สอดคล้องสมบูรณ์):** สื่อหลักหรือหน่วยงานทางการ >= 2 แห่ง ยืนยันว่าข้อความต้นฉบับเป็นความจริง ถูกต้องทุกรายละเอียด
   - **4 (75% จริงเป็นส่วนใหญ่):** ประเด็นหลักเป็นความจริง แต่อาจมีรายละเอียดปลีกย่อยหรือตัวเลขคลาดเคลื่อนเล็กน้อย
   - **3 (50% ก้ำกึ่ง / ยังไม่มีข้อยุติ / อยู่ระหว่างตรวจสอบ):** เป็นข่าวด่วนสดใหม่ที่ยังไม่มีการแถลงยืนยัน หรือสื่อหลักรายงานข้อมูลขัดแย้งกันเอง หรือหลักฐานยังไม่เพียงพอต่อการชี้ขาด
   - **2 (25% บิดเบือน / คลาดเคลื่อนจากข้อเท็จจริง):** มีความจริงบางส่วน แต่ส่วนสำคัญ (ตัวเลข, วันเวลา, บทบาทบุคคล) ถูกบิดเบือน ตัดต่อบริบท หรือชี้นำผิดทิศทาง
   - **1 (0% เท็จ / ข่าวปลอม / ขัดแย้งสิ้นเชิง):** ข้อความเป็นข่าวปลอม ถูกหักล้างโดยสิ้นเชิง มีแถลงการณ์ปฏิเสธ หรือพิสูจน์แล้วว่าไม่มีมูลความจริงตามที่อ้างเลย

4. 📋 **โครงสร้างการเขียนตอบใน JSON (ห้ามใช้ภาษาหุ่นยนต์):**
   - `"disinformation_category"`: เลือก 1 หมวดหมู่ที่ตรงที่สุดจาก ("FINANCIAL_SCAM" | "HEALTH_MEDICINE" | "PUBLIC_POLICY_GOV" | "DISASTER_SAFETY" | "CELEBRITY_SOCIAL" | "GENERAL_MISINFO")
   - `"verdict_summary"`: สรุปผลฟันธงใน 1-2 ประโยคด้วยภาษาที่เข้าใจง่าย กระชับ ตรงไปตรงมา ชี้ชัดว่า "จริง / เท็จ / บิดเบือน" เพราะเหตุใด
   - `"comparative_analysis"`: เขียนบทวิเคราะห์เชิงลึก 3 มิติให้อ่านง่ายและชัดเจน (1. สิ่งที่เกิดขึ้นจริง 2. ประเด็นที่ต้องจับตา 3. ข้อควรระวัง) โดย **ห้ามใส่เครื่องหมายสัญลักษณ์หัวข้อ เช่น ### หรือ ##** และ **ห้ามใส่ข้อความอ้างอิง เช่น [อ้างอิง X] หรือ (แหล่งอ้างอิงที่ X)** ในข้อความเด็ดขาด
   - `"supported_points"`: รายการประเด็นที่เป็น "ความจริง" เขียนเป็นประโยคที่สมบูรณ์ ชัดเจน (ห้ามใส่ [อ้างอิง X] หรือ แหล่งอ้างอิงที่ X ต่อท้าย)
   - `"conflicting_points"`: รายการประเด็นที่ "เป็นเท็จ บิดเบือน หรือถูกหักล้าง" เขียนเป็นประโยคที่สมบูรณ์และชัดเจน (ห้ามใส่ [อ้างอิง X] หรือ แหล่งอ้างอิงที่ X ต่อท้าย)
   - `"sub_claims"`: การแตกประเด็นย่อย (Multi-Claim Breakdown) แยกตรวจสอบทีละข้อความ (ถ้ามีหลายประเด็นในข้อความเดียว ให้แยก 2-4 ข้อย่อย แต่ละข้อมี claim_text, score 1-5, verdict_label, detail)
   - `"relevant_ref_ids"`: รายการหมายเลขอ้างอิงที่เกี่ยวข้องจริง เช่น [1, 2, 3]

5. 🔗 **กรณีลิงก์และข้อความไม่ตรงกัน (Topic Mismatch Handling):**
   - หากพบว่าเนื้อหาในลิงก์ที่แนบมาเป็นคนละเรื่องกับประเด็นข้อความที่ผู้ใช้ระบุ ให้ยึดการตรวจสอบข้อเท็จจริงตาม **"ประเด็นข้อความที่ผู้ใช้สอบถาม"** เป็นหลักเสมอ และระบุชี้แจงในบทวิเคราะห์อย่างโปร่งใสว่า ลิงก์ที่แนบมามีเนื้อหาไม่ตรงกับประเด็นข้อความที่ส่งตรวจ

⚠️ คำเตือนขั้นเด็ดขาด: ห้ามสร้างข้อความ หรือ Thought process เป็นภาษาจีน (Chinese) หรือภาษาอื่นที่ไม่ใช่ภาษาไทยเด็ดขาด! ตอบกลับเป็นภาษาไทยเท่านั้น!

ตอบกลับเป็น JSON รูปแบบนี้เท่านั้น:
{{
    "thought": "วิเคราะห์ข้อเท็จจริงและลำดับเหตุการณ์เป็นภาษาไทยอย่างละเอียด",
    "disinformation_category": "FINANCIAL_SCAM หรือ HEALTH_MEDICINE หรือ PUBLIC_POLICY_GOV หรือ DISASTER_SAFETY หรือ CELEBRITY_SOCIAL หรือ GENERAL_MISINFO",
    "verdict_summary": "สรุปผลการตรวจสอบฉบับเข้าใจง่ายใน 1-2 ประโยค",
    "supported_points": ["ประเด็นที่ได้รับการยืนยันว่าเป็นความจริงอย่างสมบูรณ์"],
    "conflicting_points": ["ประเด็นที่เป็นเท็จ บิดเบือน หรือถูกหักล้างอย่างสมบูรณ์"],
    "sub_claims": [
        {{
            "claim_text": "ประเด็นย่อยที่ 1",
            "score": 5,
            "verdict_label": "จริง (100%)",
            "detail": "เหตุผลสั้นๆ สำหรับประเด็นย่อยนี้"
        }}
    ],
    "comparative_analysis": "บทวิเคราะห์เชิงลึก 3 มิติ (1. สิ่งที่เกิดขึ้นจริง 2. ประเด็นที่ต้องจับตา 3. สรุปข้อควรระวังและสิ่งที่ควรทราบก่อนแชร์)",
    "relevant_ref_ids": [1, 2],
    "score": ตัวเลข 1-5
}}"""
    return system_msg, prompt

def analyze_fact_checking(news_text: str, references: list, current_date_str: str, source_url: str = "", timeout: float = None, content_type: str = "NEWS_CLAIM", content_timeline: str = "ไม่ระบุ", publish_date_context: str = "ไม่ระบุ") -> dict:
    if timeout is None:
        timeout = _analyzer_default_timeout()
    try:
        max_refs = int(os.getenv("ANALYZER_MAX_REFERENCES", "5"))
    except ValueError:
        max_refs = 5
    try:
        ref_chars = int(os.getenv("ANALYZER_REFERENCE_CHARACTERS", "1200"))
    except ValueError:
        ref_chars = 1200

    try:
        analyzer_max_tokens = int(os.getenv("ANALYZER_MAX_TOKENS", "1800"))
    except ValueError:
        analyzer_max_tokens = 1800

    clean_claim = sanitize_for_api(news_text[:2000])
    ref_text = _build_analyzer_ref_text(references, max_refs=max_refs, max_chars=ref_chars)

    is_official_source = bool(source_url and (".go.th" in source_url.lower() or ".gov" in source_url.lower() or 'antifakenewscenter.com' in source_url.lower()))
    origin_info = f"ดึงมาจากเว็บไซต์ทางการ (Official Source): {source_url}" if is_official_source else "ข้อความทั่วไป / โซเชียลมีเดีย"
    current_time_context = get_current_thai_time()

    system_msg, prompt = _build_analyzer_prompt(clean_claim, origin_info, ref_text, current_time_context, content_type, content_timeline, publish_date_context)
    _attempt_start = time.time()
    final_result, meta = _call_openrouter_with_meta(prompt, system_msg, timeout=timeout, model=get_ai_model(), max_tokens=analyzer_max_tokens)
    _attempt_elapsed = time.time() - _attempt_start

    if meta.get("payment_required"):
        return validate_ai_response({"comparative_analysis": "Error 402: OpenRouter API เครดิตหมด (Payment Required) — กรุณาเติมเครดิตที่ openrouter.ai แล้วลองใหม่"}, force_error=True)

    if (
        (meta.get("truncated") or not final_result)
        and references
        and timeout
        and timeout >= 8
        and _attempt_elapsed < timeout * 0.6
    ):
        retry_budget = max(5.0, timeout - _attempt_elapsed - 1.0)
        compact_ref_text = _build_analyzer_ref_text(references, max_refs=6, max_chars=600)
        compact_system, compact_prompt = _build_analyzer_prompt(clean_claim, origin_info, compact_ref_text, current_time_context, content_type, content_timeline, publish_date_context)
        retry_result, _retry_meta = _call_openrouter_with_meta(compact_prompt, compact_system, timeout=retry_budget, model=get_ai_model(), max_tokens=analyzer_max_tokens)
        if _retry_meta.get("payment_required"):
            return validate_ai_response({"comparative_analysis": "Error 402: OpenRouter API เครดิตหมด (Payment Required) — กรุณาเติมเครดิตที่ openrouter.ai แล้วลองใหม่"}, force_error=True)
        if retry_result:
            final_result = retry_result

    if not final_result:
        return validate_ai_response({"comparative_analysis": "❌ Error: AI ไม่สามารถประมวลผลการเปรียบเทียบได้"}, force_error=True)

    return validate_ai_response(final_result)

def plan_fact_checking(news_text: str, timeout: float = None) -> tuple:
    """Public alias for analyze_intent_and_plan_search."""
    return analyze_intent_and_plan_search(news_text, timeout=timeout)

def critic_review_analysis(news_text: str, references: list, initial_analysis: dict) -> dict:
    return validate_ai_response(initial_analysis)
