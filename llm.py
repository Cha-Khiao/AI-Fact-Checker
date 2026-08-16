import json
import os
import re
import time
import logging
from datetime import datetime
from dotenv import load_dotenv
import pytz

import http_client

logger = logging.getLogger(__name__)

load_dotenv()

API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
AI_MODEL = os.getenv("AI_MODEL", "").strip()
LLM_BACKEND = os.getenv("LLM_BACKEND", "openrouter").strip()

def _planner_timeout() -> float:
    try:
        return float(os.getenv("PLANNER_TIMEOUT_SECONDS", "45"))
    except ValueError:
        return 45.0


def _analyzer_default_timeout() -> float:
    try:
        return float(os.getenv("ANALYZER_TIMEOUT_SECONDS", "45"))
    except ValueError:
        return 45.0


try:
    import streamlit as st
    if "OPENROUTER_API_KEY" in st.secrets: OPENROUTER_API_KEY = st.secrets["OPENROUTER_API_KEY"].strip()
    if "AI_MODEL" in st.secrets: AI_MODEL = st.secrets["AI_MODEL"].strip()
    if "LLM_BACKEND" in st.secrets: LLM_BACKEND = st.secrets["LLM_BACKEND"].strip()
except Exception: pass

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
        try: return json.loads(match.group(1))
        except Exception: pass
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        try: return json.loads(match.group(0))
        except Exception: pass
    return {}

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
        
    for key in template.keys():
        if key not in parsed_dict or parsed_dict[key] in [None, ""]: parsed_dict[key] = template[key]
            
    try:
        score_str = str(parsed_dict["score"])
        numbers = re.findall(r'\d+', score_str)
        parsed_dict["score"] = max(1, min(5, int(numbers[0]))) if numbers else 3
    except (ValueError, TypeError, IndexError, KeyError): parsed_dict["score"] = 3
        
    try:
        rel_val = parsed_dict.get("relevant_ref_ids", "")
        if isinstance(rel_val, list):
            parsed_dict["relevant_ref_ids"] = [int(x) for x in rel_val if str(x).isdigit() and int(x) != 0]
        else:
            numbers = re.findall(r'\d+', str(rel_val))
            parsed_dict["relevant_ref_ids"] = [int(n) for n in numbers if int(n) != 0]
    except (ValueError, TypeError, KeyError): parsed_dict["relevant_ref_ids"] = []
        
    return parsed_dict

def call_openrouter(prompt: str, system_msg: str, timeout: float = None, model: str = None, max_tokens: int = None) -> dict:
    parsed, _meta = _call_openrouter_with_meta(prompt, system_msg, timeout=timeout, model=model, max_tokens=max_tokens)
    return parsed


def _call_openrouter_with_meta(prompt: str, system_msg: str, timeout: float = None, model: str = None, max_tokens: int = None):
    """Call OpenRouter; return ``(parsed_dict, meta_dict)``.

    ``meta`` carries ``finish_reason``/``truncated`` so callers can retry with a
    smaller context when the model ran out of tokens instead of finishing.
    Uses a true wall-clock deadline (``http_client.wall_clock_request``) so a
    slow generation cannot run past the caller's budget, and caps ``max_tokens``
    so runaway output cannot make one call "คิดนาน" without bound.
    """
    if timeout is None:
        timeout = _analyzer_default_timeout()
    if max_tokens is None:
        try:
            max_tokens = int(os.getenv("LLM_MAX_TOKENS", "2048"))
        except ValueError:
            max_tokens = 2048
    headers = {"Authorization": f"Bearer {OPENROUTER_API_KEY}", "Content-Type": "application/json"}
    provider_sort = os.getenv("OPENROUTER_PROVIDER_SORT", "throughput")
    target_model = model or AI_MODEL
    
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
    import time
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
            
            # If it's a payment error, don't retry
            if "402" in err_str or "Payment Required" in err_str:
                return {}, {"error": err_str, "truncated": False, "payment_required": True}
            
            # Exponential backoff for 502, 504, 429 or Timeout
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # 1s, 2s
                
    err_str = str(last_error)
    return {}, {"error": err_str, "truncated": False, "payment_required": False}

# =========================================================
THAI_MONTHS_MAP = {
    'ม.ค.': 1, 'มกราคม': 1, 'ก.พ.': 2, 'กุมภาพันธ์': 2, 'มี.ค.': 3, 'มีนาคม': 3,
    'เม.ย.': 4, 'เมษายน': 4, 'พ.ค.': 5, 'พฤษภาคม': 5, 'มิ.ย.': 6, 'มิถุนายน': 6,
    'ก.ค.': 7, 'กรกฎาคม': 7, 'ส.ค.': 8, 'สิงหาคม': 8, 'ก.ย.': 9, 'กันยายน': 9,
    'ต.ค.': 10, 'ตุลาคม': 10, 'พ.ย.': 11, 'พฤศจิกายน': 11, 'ธ.ค.': 12, 'ธันวาคม': 12
}

def parse_relative_or_explicit_date(text: str) -> tuple:
    """Parse relative timestamps or explicit dates from Thai news text.
    
    Returns (iso_date_str, display_thai_str, is_fresh_news)
    """
    from datetime import datetime, timedelta
    import pytz
    tz = pytz.timezone('Asia/Bangkok')
    now = datetime.now(tz)
    text_clean = str(text or "").strip()
    if not text_clean:
        return None, "ไม่ระบุในข้อความ", False

    # 1. Thai explicit date (e.g. "25 มิถุนายน 2569", "25 มิ.ย. 69", "25 June 2026") - CHECK FIRST!
    thai_date_match = re.search(r'(\d{1,2})\s*(ม\.ค\.|มกราคม|ก\.พ\.|กุมภาพันธ์|มี\.ค\.|มีนาคม|เม\.ย\.|เมษายน|พ\.ค\.|พฤษภาคม|มิ\.ย\.|มิถุนายน|ก\.ค\.|กรกฎาคม|ส\.ค\.|สิงหาคม|ก\.ย\.|กันยายน|ต\.ค\.|ตุลาคม|พ\.ย\.|พฤศจิกายน|ธ\.ค\.|ธันวาคม)\s*(\d{2,4})', text_clean)
    if thai_date_match:
        day = int(thai_date_match.group(1))
        month_str = thai_date_match.group(2)
        year_raw = int(thai_date_match.group(3))
        month = THAI_MONTHS_MAP.get(month_str, 1)
        if year_raw < 100:
            year = year_raw + 2500 - 543
        elif year_raw > 2400:
            year = year_raw - 543
        else:
            year = year_raw
        try:
            dt = datetime(year, month, day)
            delta_days = (now.date() - dt.date()).days
            is_fresh = delta_days <= 1
            return dt.strftime("%Y-%m-%d"), f"{day} {month_str} {year+543}", is_fresh
        except Exception:
            pass

    # 2. Specific Relative Time (e.g. "5 นาทีที่แล้ว", "2 ชั่วโมงก่อน", "3 วันที่แล้ว")
    rel_match = re.search(r'(\d+)\s*(วินาที|นาที|ชั่วโมง|ชม\.|วัน|สัปดาห์|เดือน|ปี)\s*(ที่แล้ว|ก่อน)', text_clean, re.IGNORECASE)
    if rel_match:
        val = int(rel_match.group(1))
        unit = rel_match.group(2)
        if 'วินาที' in unit or 'นาที' in unit or 'ชั่วโมง' in unit or 'ชม.' in unit:
            dt = now - timedelta(hours=val if ('ชั่วโมง' in unit or 'ชม.' in unit) else 0)
            return dt.strftime("%Y-%m-%d"), f"{val} {unit}ที่แล้ว", True
        elif 'วัน' in unit:
            dt = now - timedelta(days=val)
            return dt.strftime("%Y-%m-%d"), f"{val} วันก่อน", val <= 1
        elif 'สัปดาห์' in unit:
            dt = now - timedelta(weeks=val)
            return dt.strftime("%Y-%m-%d"), f"{val} สัปดาห์ก่อน", False

    # 3. Relative "เมื่อวาน" or explicit post marker for "วันนี้"
    if re.search(r'เมื่อวาน(นี้)?', text_clean):
        dt = now - timedelta(days=1)
        return dt.strftime("%Y-%m-%d"), "เมื่อวานนี้", True

    if re.search(r'(โพสต์เมื่อ|เผยแพร่|อัปเดต)\s*:\s*วันนี้', text_clean):
        return now.strftime("%Y-%m-%d"), "วันนี้", True

    return None, "ไม่ระบุในข้อความ", False

# =========================================================
# ⚡ STEP 1: Search Planner (บังคับสร้างคีย์เวิร์ดราชการ + แบนภาษาอื่น)
# =========================================================
def analyze_intent_and_plan_search(news_text: str, timeout: float = None) -> tuple:
    text_for_analysis = news_text
    if "]:\n" in news_text: 
        text_for_analysis = news_text.split("]:\n")[-1] 
        
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

ขั้นตอนที่ 2 — สกัดข้อมูลค้นหา ตามกฎห้ามสมมติ (สำคัญมาก!):
⚠️ ห้ามเพิ่มคำที่ "ไม่มีอยู่ในข้อความ" เป็นอันขาด!

⚠️ **คำแนะนำสำคัญเพื่อให้ค้นหาพบแหล่งอ้างอิงตรงประเด็น 100%:**
1. `topic_keywords`: สกัด "กลุ่มคำที่เป็นแก่นของข่าว" (Headline Keyword Cluster) ที่คาดว่าสำนักข่าวทุกสำนักจะต้องใช้พาดหัว (เช่น "อิงฟ้า แฟนคลับให้เงิน 350 บาท", "อนุทิน สั่งเด้งอธิบดี เสียหาย 4.5 พันล้าน")
2. `core_entities`: สกัดคำนามสำคัญ ตัวเลข สถานที่ ชื่อคน หรือสิ่งของ (เช่น ["อนุทิน", "เด้งอธิบดี", "4.5 พันล้าน"]) เพื่อใช้บังคับให้หน้าเว็บต้องมีคำเหล่านี้
3. `exact_quote`: คัดลอกประโยคเด็ด หรือใจความสำคัญที่สุดจากข้อความต้นฉบับมาตรงๆ (ห้ามดัดแปลง) เพื่อใช้ค้นหาแบบ Exact Match
4. `publish_date_context`: เวลาที่โพสต์หรือเผยแพร่ข่าว (หากในข้อความมีระบุ เช่น "25 มิถุนายน 2569", "2 ชั่วโมงที่แล้ว" ให้ใช้ค่านั้น ห้ามเอาเวลาระบบปัจจุบันมาใส่แทนเด็ดขาด)
5. `content_timeline`: โครงสร้าง 5W1H (ใคร ทำอะไร ที่ไหน เมื่อไหร่ ผลเป็นอย่างไร) ของเหตุการณ์ในข่าว แยกออกจากเวลาที่โพสต์

ตอบกลับเป็น JSON รูปแบบนี้เท่านั้น:
{{
    "action": "SEARCH",
    "content_type": "PERSONAL_STORY หรือ NEWS_CLAIM หรือ POLICY_ANNOUNCEMENT หรือ GENERAL",
    "topic_keywords": "กลุ่มคำพาดหัวข่าว/แก่นเรื่องหลัก",
    "exact_quote": "ประโยคที่คัดลอกมาจากต้นฉบับเป๊ะๆ",
    "core_entities": ["คำนามสำคัญ", "ตัวเลข", "สถานที่", "ชื่อคน", "กริยาหลัก"],
    "locations": ["จังหวัด", "สถานที่"],
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
        model=AI_MODEL,
        max_tokens=planner_max_tokens,
    )
    return _normalize_planner_response(res_data, text_chunk, current_year_th)


# =========================================================
# 🧹 Keyword sanitize & validate (Task 6 — กัน hallucinate keyword)
# =========================================================
_PLATFORM_WORDS = {
    'facebook', 'fb', 'instagram', 'ig', 'tiktok', 'twitter', 'x', 'youtube',
    'line', 'threads', 't.me', 'telegram', 'wechat', 'snapchat', 'pinterest',
    'reddit', 'blockdit', 'pantip', 'quora', 'viber', 'whatsapp',
    'เฟซบุ๊ก', 'เฟสบุ๊ก', 'เฟสบุค', 'อินสตาแกรม', 'ติ๊กต็อก', 'ติ๊กต๊อก',
    'ทวิตเตอร์', 'ยูทูป', 'ไลน์', 'วิดีโอ', 'คลิป', 'แชท', 'แฮชแท็ก',
}

_NOISE_WORDS = {
    'ข่าว', 'ข่าวล่าสุด', 'ล่าสุด', 'วันนี้', 'ด่วน', 'ร้อนแรง', 'ไวรัล',
    'viral', 'โพสต์', 'แคปชั่น', 'caption', 'แชร์', 'แชร์ต่อ', 'status',
    'คลิป', 'รูป', 'ภาพ', 'เรื่อง', 'ประเด็น', 'ตรวจสอบ', 'จริงไหม',
    'จริงหรือ', 'ความจริง', 'ชัดเจน', 'น่ารัก', 'สุดยอด', 'รายงาน',
}

# คำสามัญที่ขึ้นหัวข่าวหลากเรื่องมากเกินไป (ข่าวฆาตกรรม/บันเทิง/อาชญากรรม)
# → ถ้าเป็นคีย์เวิร์ด/title hit จะปล่อยขยะผ่าน gate (เช่น "เพื่อนรัก" ปรากฏ
# ในหัวข่าว "เพื่อนรักหักเหลี่ยมโหด", "เพื่อนรักทวงเงินไม่คืน" ที่ไม่เกี่ยวกับเรื่องนี้)
_GENERIC_WORDS = {
    'เพื่อนรัก', 'เพื่อน', 'แฟน', 'เมีย', 'ผัว', 'สามี', 'ภรรยา', 'หนุ่ม',
    'สาว', 'รัก', 'เงิน', 'ลูก', 'ครอบครัว', 'คนรัก', 'แฟนเก่า', 'แม่',
    'พ่อ', 'น้อง', 'พี่', 'ลุง', 'ป้า', 'ตา', 'ยาย',
}


def _sanitize_keywords(keywords: list) -> list:
    """Remove platform words, noise words, and junk from a keyword list.

    ก่อนหน้านี้ลบแค่จาก search_query — ตอนนี้ลบจาก core_keywords ด้วย
    (กันคำว่า "Facebook" เข้ามาในคีย์เวิร์ดค้นหา)
    """
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
        # ห้าม keyword ที่ยาวเกินไป (เป็นประโยค ไม่ใช่คำ)
        if len(k) > 30:
            continue
        if k_lower in seen:
            continue
        seen.add(k_lower)
        cleaned.append(k)
    return cleaned


def _validate_keywords_against_text(keywords: list, text: str) -> list:
    """Keep only keywords that actually appear in the source text.

    กัน hallucinate: ถ้าโมเดลสร้างคำที่ไม่มีในข้อความ (เช่น "เงินดิจิทัล"
    ในเรื่องส่วนตัว) → ตัดทิ้ง ไม่งั้น search จะไปคนละประเด็น
    """
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
    """Extract number+unit patterns (เช่น "350 บาท") from text — มักเป็นหลักฐานสำคัญ."""
    nums = re.findall(r'(\d[\d,]*\s*(?:บาท|%|ปี|วัน|เดือน|ล้าน|พัน|หมื่น|แสน|ครั้ง|คน|ราย|จุด|ดอลลาร์|เหรียญ|ล้านบาท))', text, re.IGNORECASE)
    return [n.strip() for n in dict.fromkeys(nums)]


def _fallback_keywords(text: str, current_keywords: list, exact_quote: str = "") -> list:
    """Fallback keyword extraction when planner fails or returns too few."""
    result = list(current_keywords)
    seen = {k.lower() for k in result}
    
    # ถ้ามี exact_quote ที่ยาวพอ ใช้คำจาก exact_quote เป็นหลักดีกว่า เพราะตรงตามข้อความจริง
    if exact_quote and len(exact_quote) > 10:
        text_clean = re.sub(r'https?://\S+', ' ', exact_quote)
    else:
        text_clean = re.sub(r'https?://\S+', ' ', text)

    for num in _extract_numeric_keywords(text_clean):
        if num.lower() not in seen:
            result.append(num)
            seen.add(num.lower())
            
    noise_set = _PLATFORM_WORDS | _NOISE_WORDS | _GENERIC_WORDS
    
    # 2) regex: Thai words 4-30 chars (no spaces)
    if len(result) < 8:
        thai_re = re.compile(r'[\u0E00-\u0E7F]{4,30}')
        for m in thai_re.findall(text_clean):
            if m.lower() in seen or m.lower() in noise_set:
                continue
            result.append(m)
            seen.add(m.lower())
            if len(result) >= 8:
                break
    return result[:10]


def _normalize_planner_response(res_data: dict, text_chunk: str, current_year_th: str) -> dict:
    """Normalize planner LLM JSON into a standard dict."""
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

    if not topic_keywords.strip() or len(topic_keywords.split()) > 15:
        topic_keywords = exact_quote[:60]
    
    clean_query = re.sub(r'(?i)(facebook|fb|twitter|\bx\b|x\.com|tiktok|youtube|ข่าวล่าสุด|รัฐบาลไทย|\||\.\.\.)', '', topic_keywords).strip()
    
    locations = res_data.get("locations", [])
    if isinstance(locations, str): locations = [locations]
    locations = [str(l).strip() for l in locations if str(l).strip()]
    
    core_entities = res_data.get("core_entities", res_data.get("core_keywords", []))
    if isinstance(core_entities, str): core_entities = [core_entities]
    core_entities = [k.replace('"', '').replace("'", "").strip() for k in core_entities if k.strip()]
    core_entities = _sanitize_keywords(core_entities)
    core_entities = _validate_keywords_against_text(core_entities, text_chunk)
    if len(core_entities) < 2:
        core_entities = _fallback_keywords(text_chunk, core_entities, exact_quote)
    
    content_timeline = str(res_data.get("content_timeline", res_data.get("timeline", "ไม่ระบุ"))).strip()
    publish_date_context = str(res_data.get("publish_date_context", "ไม่ระบุ")).strip()
    topic_summary = str(res_data.get("topic_summary", "เปรียบเทียบและวิเคราะห์เนื้อหา")).strip()
    
    # 🕒 Deterministic date resolution (แยกเวลาระบบออกจากเวลาข่าวจริง)
    det_iso, det_display, is_fresh = parse_relative_or_explicit_date(text_chunk)
    if det_display and (publish_date_context in ["ไม่ระบุ", ""] or "วันนี้" in publish_date_context):
        publish_date_context = det_display
    
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
        "core_keywords_formal": [],
        "exact_quote": exact_quote,
        "is_fresh_news": is_fresh
    }

# =========================================================
# ⚖️ STEP 2: The Analyzer (กฎเหล็กแบนภาษาจีน)
# =========================================================
def _build_analyzer_ref_text(references: list, max_refs: int = 10, max_chars: int = 1000) -> str:
    """Build the compact reference block for the analyzer prompt.

    Slices each snippet to ``max_chars`` so the model context stays small — the
    dominant cost of the analyzer call is the 15K-char context it used to send.
    """
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
    system_msg = "You are an Elite Fact-Checking Comparative Analyst. STRICTLY THAI LANGUAGE ONLY. DO NOT OUTPUT CHINESE CHARACTERS. Output strictly valid JSON in THAI. Be highly objective, evidence-based, and rigorous."
    content_type_label = {
        "PERSONAL_STORY": "เรื่องราวส่วนตัว / ประสบการณ์ / โซเชียลไวรัล",
        "NEWS_CLAIM": "ข่าว / ข้อกล่าวอ้างเหตุการณ์สาธารณะ",
        "POLICY_ANNOUNCEMENT": "ประกาศนโยบาย / มาตรการของหน่วยงานรัฐ",
        "GENERAL": "เรื่องทั่วไป",
    }.get(content_type, "เรื่องทั่วไป")
    prompt = f"""คุณคือ AI ผู้เชี่ยวชาญด้านการตรวจสอบและประเมินความสอดคล้องของข้อเท็จจริง (Fact-Checking & Truth Verification Analyst)

เวลาปัจจุบัน: {current_time_context}
[ประเภทเนื้อหาที่ตรวจสอบ]: {content_type_label}
[ข้อความที่ต้องการตรวจสอบ]: "{clean_claim}"
[แหล่งที่มา]: {origin_info}
[ไทม์ไลน์โพสต์]: {publish_date_context}
[ไทม์ไลน์เนื้อหา (5W1H)]: {content_timeline}

[แหล่งข้อมูลอ้างอิงจากสื่อหลักและหน่วยงานทางการ]:
{ref_text}

⭐ **ระเบียบวิธีประเมินระดับความสอดคล้องและความถูกต้อง (Truth & Consistency Rubric):**

1. 🎯 **เปรียบเทียบ "สิ่งที่ข้อความต้นฉบับกล่าวอ้าง" กับ "ข้อเท็จจริงในแหล่งอ้างอิง":**
   - **สอดคล้อง (Supported):** แหล่งอ้างอิงยืนยันว่าสิ่งที่ข้อความต้นฉบับกล่าวอ้าง **"เป็นเรื่องจริง/เกิดขึ้นจริง"**
   - **บิดเบือน (Distorted / Misleading):** ข้อความต้นฉบับมีเค้าโครงจริงบางส่วน แต่แต่งเติมตัวเลข, เปลี่ยนแปลงเจตนา, ตัดต่อบริบท, หรือชี้นำสังคมผิดทาง
   - **ขัดแย้ง / เป็นเท็จ (Contradicted / Debunked):** แหล่งอ้างอิงระบุว่าเป็น **"ข่าวปลอม"**, "ไม่มีจริง", "เตือนภัย", "ปฏิเสธ", หรือรายงานสิ่งที่ตรงกันข้ามกับข้อความต้นฉบับอย่างสิ้นเชิง

2. 🚨 **กฎเหล็กการตรวจจับข่าวปลอม/การหักล้าง (Anti-Fake & Debunk Detection):**
   - ถ้าแหล่งอ้างอิงมีคำว่า 'ข่าวปลอม', 'เตือนภัย', 'ชี้แจงไม่จริง', 'ปฏิเสธ', 'ไม่มีนโยบาย', 'แอบอ้าง' หรือเนื้อหาข่าวปฏิเสธข้อความของผู้ใช้ → ต้องให้ **คะแนน 1 (0% ข้อมูลเท็จ)** หรือ **2 (25% บิดเบือน)** ทันที! ห้ามมองว่าสอดคล้องเพียงเพราะมีคีย์เวิร์ดเรื่องเดียวกันเด็ดขาด!
   - หากข้อความต้นฉบับไม่มีหลักฐานยืนยันจากสื่อหลักเลย และเป็นข่าวลือไร้ที่มา ให้คะแนน 1 หรือ 2 ตามระดับความเสียหาย

3. ⚖️ **เกณฑ์การให้คะแนนความสอดคล้อง (Score 1-5):**
   - **5 (100% สอดคล้องสมบูรณ์):** สื่อหลักหรือหน่วยงานทางการ >= 2 แห่ง ยืนยันว่าข้อความต้นฉบับเป็นความจริง ถูกต้องทุกรายละเอียด
   - **4 (75% สอดคล้องส่วนใหญ่):** ประเด็นหลักเป็นความจริง แต่อาจมีรายละเอียดปลีกย่อยหรือตัวเลขคลาดเคลื่อนเล็กน้อย
   - **3 (50% ก้ำกึ่ง / ไม่สามารถสรุปได้):** สื่อหลักรายงานข้อมูลขัดแย้งกันเอง หรือหลักฐานยังไม่เพียงพอต่อการยืนยัน (เช่น ข่าวด่วนพึ่งเกิด)
   - **2 (25% บิดเบือนบางส่วน):** มีความจริงบางส่วน แต่ส่วนสำคัญ (ตัวเลข, วันเวลา, บทบาทบุคคล) ถูกบิดเบือนไปจากข้อเท็จจริงของสื่อ
   - **1 (0% ข้อมูลเท็จ / ขัดแย้งสิ้นเชิง):** ข้อความเป็นข่าวปลอม ถูกหักล้างโดยสิ้นเชิง หรือไม่มีข้อมูลความจริงตามที่อ้างเลย

4. 📋 **กฎเหล็กการกรอกข้อมูลใน JSON:**
   - `"supported_points"`: ระบุเฉพาะประเด็นในข้อความต้นฉบับที่ **"ได้รับการยืนยันว่าเป็นความจริงจากสื่อ"** (หากข้อความเป็นเท็จทั้งหมด ให้ใส่ `["ไม่พบประเด็นที่สอดคล้องกับข้อเท็จจริงของสื่อหลัก"]`)
   - `"conflicting_points"`: ระบุประเด็นที่ **"เป็นเท็จ บิดเบือน หรือถูกสื่อหลักหักล้าง/เตือนภัย"** พร้อมอ้างอิง เช่น `[อ้างอิง 1]` (หากไม่มีข้อมูลขัดแย้ง ให้ใส่ `["ไม่พบประเด็นที่ขัดแย้งกับแหล่งอ้างอิงหลัก"]`)
   - `"verdict_summary"`: สรุปผลชัดเจนตรงไปตรงมา เช่น "ข้อความดังกล่าวเป็นข่าวปลอม โดยศูนย์ต่อต้านข่าวปลอมและสื่อหลักยืนยันตรงกันว่าเป็นข้อมูลเท็จ" หรือ "ข้อความดังกล่าวสอดคล้องกับรายงานข่าวของสื่อหลัก"

5. 🧭 **น้ำหนักหลักฐานตามระดับความน่าเชื่อถือ (Tier):**
   - 🏛️ **Tier 0:** หน่วยงานรัฐบาลไทย (.go.th) / ศูนย์ตรวจสอบข่าวลวง (antifakenewscenter, cofact, sure.factcheckthailand) → น้ำหนักสูงสุด
   - 📰 **Tier 1:** สื่อหลักของไทย (ThaiPBS, ไทยรัฐ, ข่าวสด, มติชน, ช่อง 7, The Thaiger, LINE TODAY) และสำนักข่าวต่างประเทศระดับโลก (BBC, Reuters, AP, Bloomberg, CNA, Nikkei Asia) → น้ำหนักสูง
   - 🌐 **Tier 2:** สื่ออิสระออนไลน์ / สื่อท้องถิ่น → น้ำหนักปานกลาง

⚠️ คำเตือนขั้นเด็ดขาด: ห้ามสร้างข้อความ หรือ Thought process เป็นภาษาจีน (Chinese) หรือภาษาอื่นที่ไม่ใช่ภาษาไทยเด็ดขาด! ตอบกลับเป็นภาษาไทยเท่านั้น!

ตอบกลับเป็น JSON รูปแบบนี้เท่านั้น:
{{
    "thought": "วิเคราะห์เปรียบเทียบเป็นภาษาไทยสั้นๆ",
    "verdict_summary": "สรุปผล 1 ประโยคชัดเจน (ระบุจำนวนแหล่งที่สอดคล้อง/ขัดแย้ง)",
    "supported_points": ["ประเด็นที่ได้รับการยืนยันว่าเป็นความจริง (พร้อมระบุ [อ้างอิง X])"],
    "conflicting_points": ["ประเด็นที่เป็นเท็จ บิดเบือน หรือถูกหักล้าง (พร้อมระบุ [อ้างอิง X])"],
    "comparative_analysis": "บทวิเคราะห์เปรียบเทียบเชิงลึกอย่างเป็นเหตุเป็นผล อ้างอิงหมายเลขแหล่ง [อ้างอิง X] เสมอ",
    "relevant_ref_ids": [รหัสตัวเลขของอ้างอิงที่เกี่ยวข้องจริง เช่น 1, 2],
    "score": ตัวเลข 1-5 ตามเกณฑ์ความถูกต้องจริง
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
        ref_chars = int(os.getenv("ANALYZER_REFERENCE_CHARACTERS", "600"))
    except ValueError:
        ref_chars = 600

    try:
        analyzer_max_tokens = int(os.getenv("ANALYZER_MAX_TOKENS", "1024"))
    except ValueError:
        analyzer_max_tokens = 1024

    clean_claim = sanitize_for_api(news_text[:2000])
    ref_text = _build_analyzer_ref_text(references, max_refs=max_refs, max_chars=ref_chars)

    is_official_source = bool(source_url and (".go.th" in source_url.lower() or ".gov" in source_url.lower() or 'antifakenewscenter.com' in source_url.lower()))
    origin_info = f"ดึงมาจากเว็บไซต์ทางการ (Official Source): {source_url}" if is_official_source else "ข้อความทั่วไป / โซเชียลมีเดีย"
    current_time_context = get_current_thai_time()

    system_msg, prompt = _build_analyzer_prompt(clean_claim, origin_info, ref_text, current_time_context, content_type, content_timeline, publish_date_context)
    _attempt_start = time.time()
    final_result, meta = _call_openrouter_with_meta(prompt, system_msg, timeout=timeout, model=AI_MODEL, max_tokens=analyzer_max_tokens)
    _attempt_elapsed = time.time() - _attempt_start

    if meta.get("payment_required"):
        return validate_ai_response({"comparative_analysis": "Error 402: OpenRouter API เครดิตหมด (Payment Required) — กรุณาเติมเครดิตที่ openrouter.ai แล้วลองใหม่"}, force_error=True)

    # Retry ครั้งเดียวด้วย context ที่เล็กลง (6 refs x 600 ตัวอักษร) เฉพาะเมื่อ
    # รอบแรกล้มเร็ว (JSON เสีย/ถูกตัด) ภายใน 60% ของงบ — ถ้ารอบแรกโดนตัดเพราะ
    # หมดงบช้า ๆ แปลว่าไม่มีงบเหลือให้ retry แล้ว จะได้ไม่ยืดเลย deadline
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
        retry_result, _retry_meta = _call_openrouter_with_meta(compact_prompt, compact_system, timeout=retry_budget, model=AI_MODEL, max_tokens=analyzer_max_tokens)
        if _retry_meta.get("payment_required"):
            return validate_ai_response({"comparative_analysis": "Error 402: OpenRouter API เครดิตหมด (Payment Required) — กรุณาเติมเครดิตที่ openrouter.ai แล้วลองใหม่"}, force_error=True)
        if retry_result:
            final_result = retry_result

    if not final_result:
        return validate_ai_response({"comparative_analysis": "❌ Error: AI ไม่สามารถประมวลผลการเปรียบเทียบได้"}, force_error=True)

    return validate_ai_response(final_result)

def critic_review_analysis(news_text: str, references: list, initial_analysis: dict) -> dict:
    return validate_ai_response(initial_analysis)