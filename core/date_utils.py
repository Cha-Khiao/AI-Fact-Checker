"""Comprehensive Universal Date & Time Extraction Engine
Handles all Thai, Global, Social Media, and Metadata Date/Time Formats.
"""

import re
import json
from datetime import datetime, timedelta
import pytz

BANGKOK_TZ = pytz.timezone('Asia/Bangkok')

THAI_MONTHS_MAP = {
    'ม.ค.': 1, 'มกราคม': 1, 'มกรา': 1,
    'ก.พ.': 2, 'กุมภาพันธ์': 2, 'กุมภา': 2,
    'มี.ค.': 3, 'มีนาคม': 3, 'มีนา': 3,
    'เม.ย.': 4, 'เมษายน': 4, 'เมษา': 4,
    'พ.ค.': 5, 'พฤษภาคม': 5, 'พฤษภา': 5,
    'มิ.ย.': 6, 'มิถุนายน': 6, 'มิถุนา': 6,
    'ก.ค.': 7, 'กรกฎาคม': 7, 'กรกฎา': 7,
    'ส.ค.': 8, 'สิงหาคม': 8, 'สิงหา': 8,
    'ก.ย.': 9, 'กันยายน': 9, 'กันยา': 9,
    'ต.ค.': 10, 'ตุลาคม': 10, 'ตุลา': 10,
    'พ.ย.': 11, 'พฤศจิกายน': 11, 'พฤศจิกา': 11,
    'ธ.ค.': 12, 'ธันวาคม': 12, 'ธันวา': 12,
}

ENGLISH_MONTHS_MAP = {
    'jan': 1, 'january': 1,
    'feb': 2, 'february': 2,
    'mar': 3, 'march': 3,
    'apr': 4, 'april': 4,
    'may': 5,
    'jun': 6, 'june': 6,
    'jul': 7, 'july': 7,
    'aug': 8, 'august': 8,
    'sep': 9, 'september': 9, 'sept': 9,
    'oct': 10, 'october': 10,
    'nov': 11, 'november': 11,
    'dec': 12, 'december': 12,
}

THAI_MONTH_NAMES_SHORT = [
    "", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
]

NOISE_PATTERNS = [
    r'อ่านล่าสุด',
    r'ผู้เข้าชม',
    r'ยอดวิว',
    r'ความคิดเห็นเมื่อ',
    r'ข่าวแนะนำ',
    r'ข่าวยอดนิยม',
    r'อัปเดตระบบ',
    r'เวอร์ชัน\s*\d+',
    r'copyright',
    r'สงวนลิขสิทธิ์',
    r'โทร\s*\d+',
]

def format_thai_date(dt: datetime, include_time: bool = True) -> str:
    """Format datetime object into official Thai Buddhist Era string."""
    year_th = dt.year + 543 if dt.year < 2400 else dt.year
    month_name = THAI_MONTH_NAMES_SHORT[dt.month]
    if include_time and (dt.hour > 0 or dt.minute > 0):
        return f"{dt.day} {month_name} {year_th} เวลา {dt.strftime('%H:%M')} น."
    return f"{dt.day} {month_name} {year_th}"

def compute_relative_thai_time(target_dt: datetime, now_dt: datetime = None) -> tuple:
    """Compute human-friendly Thai relative time string from datetime.
    
    Returns (relative_display_str, is_fresh)
    """
    if now_dt is None:
        now_dt = datetime.now(BANGKOK_TZ)

    # Ensure timezone aware
    if target_dt.tzinfo is None:
        target_dt = BANGKOK_TZ.localize(target_dt)

    diff = now_dt - target_dt
    total_seconds = diff.total_seconds()

    if total_seconds < 0:
        return "เมื่อสักครู่นี้", True

    if total_seconds < 60:
        return "เมื่อสักครู่นี้", True

    total_minutes = int(total_seconds / 60)
    if total_minutes < 60:
        return f"{total_minutes} นาทีที่แล้ว", True

    total_hours = int(total_seconds / 3600)
    if total_hours < 24:
        return f"{total_hours} ชั่วโมงที่ผ่านมา", True

    total_days = diff.days
    if total_days == 1:
        if target_dt.hour > 0 or target_dt.minute > 0:
            return f"เมื่อวานนี้ เวลา {target_dt.strftime('%H:%M')} น.", True
        return "เมื่อวานนี้", True

    if total_days < 7:
        return f"{total_days} วันก่อน", total_days <= 1

    total_weeks = int(total_days / 7)
    if total_weeks < 5:
        return f"{total_weeks} สัปดาห์ก่อน", False

    total_months = int(total_days / 30)
    if total_months < 12:
        exact_str = format_thai_date(target_dt, include_time=False)
        return f"{total_months} เดือนก่อน ({exact_str})", False

    total_years = int(total_days / 365)
    exact_str = format_thai_date(target_dt, include_time=False)
    return f"{total_years} ปีก่อน ({exact_str})", False

def parse_iso_or_structured_date(raw_date_str: str) -> datetime:
    """Parse ISO-8601, RFC-2822, or Unix timestamp into timezone-aware datetime."""
    if not raw_date_str:
        return None
    raw_str = str(raw_date_str).strip()

    # 1. Unix timestamp (seconds or milliseconds)
    if re.match(r'^\d{10}(\d{3})?$', raw_str):
        try:
            ts = int(raw_str)
            if len(raw_str) == 13:
                ts = ts / 1000.0
            return datetime.fromtimestamp(ts, BANGKOK_TZ)
        except Exception:
            pass

    # 2. ISO 8601 variations
    clean_iso = raw_str.replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(clean_iso)
        if dt.tzinfo is None:
            return BANGKOK_TZ.localize(dt)
        return dt.astimezone(BANGKOK_TZ)
    except Exception:
        pass

    # 3. Common date formats
    date_formats = [
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S.%f%z",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
        "%Y/%m/%d %H:%M:%S",
        "%Y/%m/%d",
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y %H:%M",
        "%d/%m/%Y",
        "%d-%m-%Y %H:%M:%S",
        "%d-%m-%Y",
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M:%S GMT",
        "%d %b %Y %H:%M:%S",
        "%d %B %Y",
        "%B %d, %Y",
        "%b %d, %Y",
    ]
    for fmt in date_formats:
        try:
            dt = datetime.strptime(raw_str[:30].strip(), fmt)
            if dt.tzinfo is None:
                return BANGKOK_TZ.localize(dt)
            return dt.astimezone(BANGKOK_TZ)
        except Exception:
            continue

    return None

def parse_thai_and_global_date(text: str, metadata_date: str = "") -> tuple:
    """Universal Date & Time Parser for Thai & Global Web/Social Media Content.
    
    Returns: (iso_date_str, display_thai_str, is_fresh_news)
    """
    now = datetime.now(BANGKOK_TZ)

    # 1. Check metadata structured date first (highest accuracy)
    if metadata_date:
        parsed_dt = parse_iso_or_structured_date(metadata_date)
        if parsed_dt:
            rel_display, is_fresh = compute_relative_thai_time(parsed_dt, now)
            return parsed_dt.strftime("%Y-%m-%d"), rel_display, is_fresh

    text_clean = str(text or "").strip()
    if not text_clean:
        return None, "ไม่ระบุในข้อความ", False

    # Explicit metadata header from scraper (highest accuracy)
    meta_header = re.search(r'\[เวลาเผยแพร่ของข่าว/โพสต์\]:\s*([^\n\r]+)', text_clean)
    if meta_header:
        meta_val = meta_header.group(1).strip()
        parsed_dt = parse_iso_or_structured_date(meta_val)
        if parsed_dt:
            rel_display, is_fresh = compute_relative_thai_time(parsed_dt, now)
            return parsed_dt.strftime("%Y-%m-%d"), rel_display, is_fresh
        # If not direct ISO, try parsing it as date string
        sub_iso, sub_display, sub_fresh = parse_thai_and_global_date(meta_val)
        if sub_iso or (sub_display and sub_display != "ไม่ระบุในข้อความ"):
            return sub_iso, sub_display, sub_fresh

    # Check for direct ISO string in text if length is suitable (supporting milliseconds .000)
    iso_match = re.search(r'\b(20\d{2}-\d{2}-\d{2}(?:T|\s)\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)\b', text_clean)
    if iso_match:
        parsed_dt = parse_iso_or_structured_date(iso_match.group(1))
        if parsed_dt:
            rel_display, is_fresh = compute_relative_thai_time(parsed_dt, now)
            return parsed_dt.strftime("%Y-%m-%d"), rel_display, is_fresh

    # Clean out obvious noise patterns that could cause false positive matches
    for np in NOISE_PATTERNS:
        text_clean = re.sub(np, ' ', text_clean, flags=re.IGNORECASE)

    # 2. Explicit Post Header prefixes (e.g. โพสต์เมื่อ: 9 ชม. ที่ผ่านมา, เผยแพร่เมื่อ: 19 ส.ค. 2569)
    explicit_post = re.search(r'(?:โพสต์เมื่อ|เผยแพร่เมื่อ|อัปเดตเมื่อ|ลงข่าวเมื่อ|ข่าวประจำวันที่|รายงานเมื่อ)\s*[:：]?\s*([^\n\r,]{3,45})', text_clean, re.IGNORECASE)
    if explicit_post:
        header_text = explicit_post.group(1).strip()
        sub_iso, sub_display, sub_fresh = parse_thai_and_global_date(header_text)
        if sub_iso or (sub_display and sub_display != "ไม่ระบุในข้อความ"):
            return sub_iso, sub_display, sub_fresh

    # 3. Thai Explicit Calendar Date (e.g. 19 ส.ค. 2569, วันที่ 19 สิงหาคม พ.ศ. 2569 เวลา 14:30 น.)
    thai_date_match = re.search(
        r'(?:((?:คืน)?วัน(?:จันทร์|อังคาร|พุธ|พฤหัสบดี|พฤหัส|ศุกร์|เสาร์|อาทิตย์))\s*(?:ที่)?)?\s*(\d{1,2})\s*(ม\.ค\.|มกราคม|ก\.พ\.|กุมภาพันธ์|มี\.ค\.|มีนาคม|เม\.ย\.|เมษายน|พ\.ค\.|พฤษภาคม|มิ\.ย\.|มิถุนายน|ก\.ค\.|กรกฎาคม|ส\.ค\.|สิงหาคม|ก\.ย\.|กันยายน|ต\.ค\.|ตุลาคม|พ\.ย\.|พฤศจิกายน|ธ\.ค\.|ธันวาคม)\s*(?:พ\.ศ\.|ค\.ศ\.)?\s*(\d{2,4})(?:\s*เวลา\s*(\d{1,2}[\.:]\d{2})\s*(?:น\.|น)?)?',
        text_clean
    )
    if thai_date_match:
        dow = (thai_date_match.group(1) or "").strip()
        day = int(thai_date_match.group(2))
        month_str = thai_date_match.group(3)
        year_raw = int(thai_date_match.group(4))
        time_str = (thai_date_match.group(5) or "").strip().replace(".", ":")
        month = THAI_MONTHS_MAP.get(month_str, 1)

        if year_raw < 100:
            year = year_raw + 2500 - 543
        elif year_raw > 2400:
            year = year_raw - 543
        else:
            year = year_raw

        try:
            hour = 0
            minute = 0
            if time_str and ":" in time_str:
                parts = time_str.split(":")
                hour = int(parts[0])
                minute = int(parts[1])
            dt = datetime(year, month, day, hour, minute)
            dt_aware = BANGKOK_TZ.localize(dt)
            rel_display, is_fresh = compute_relative_thai_time(dt_aware, now)
            if (now.date() - dt.date()).days > 7:
                dow_str = f"{dow}ที่ " if dow else ""
                time_display = f" เวลา {time_str} น." if time_str else ""
                display_text = f"{dow_str}{day} {month_str} {year+543}{time_display}"
                return dt.strftime("%Y-%m-%d"), display_text, is_fresh
            return dt.strftime("%Y-%m-%d"), rel_display, is_fresh
        except Exception:
            pass

    # 4. English Explicit Dates (e.g. August 19, 2026 or 19 Aug 2026)
    eng_date1 = re.search(r'(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?[,\s]+(\d{4})', text_clean, re.IGNORECASE)
    if eng_date1:
        month_name = eng_date1.group(1).lower()
        month = ENGLISH_MONTHS_MAP.get(month_name[:3], 1)
        day = int(eng_date1.group(2))
        year = int(eng_date1.group(3))
        try:
            dt = datetime(year, month, day)
            dt_aware = BANGKOK_TZ.localize(dt)
            rel_display, is_fresh = compute_relative_thai_time(dt_aware, now)
            if (now.date() - dt.date()).days > 7:
                return dt.strftime("%Y-%m-%d"), f"{day} {THAI_MONTH_NAMES_SHORT[month]} {year+543}", is_fresh
            return dt.strftime("%Y-%m-%d"), rel_display, is_fresh
        except Exception:
            pass

    eng_date2 = re.search(r'(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[,\s]+(\d{4})', text_clean, re.IGNORECASE)
    if eng_date2:
        day = int(eng_date2.group(1))
        month_name = eng_date2.group(2).lower()
        month = ENGLISH_MONTHS_MAP.get(month_name[:3], 1)
        year = int(eng_date2.group(3))
        try:
            dt = datetime(year, month, day)
            dt_aware = BANGKOK_TZ.localize(dt)
            rel_display, is_fresh = compute_relative_thai_time(dt_aware, now)
            if (now.date() - dt.date()).days > 7:
                return dt.strftime("%Y-%m-%d"), f"{day} {THAI_MONTH_NAMES_SHORT[month]} {year+543}", is_fresh
            return dt.strftime("%Y-%m-%d"), rel_display, is_fresh
        except Exception:
            pass

    # 5. Keywords: "เมื่อวานนี้" / "วันนี้"
    if re.search(r'เมื่อวาน(นี้)?', text_clean):
        time_match = re.search(r'เมื่อวาน(?:นี้)?(?:\s*เวลา)?\s*(\d{1,2}[:.]\d{2})', text_clean)
        if time_match:
            return (now - timedelta(days=1)).strftime("%Y-%m-%d"), f"เมื่อวานนี้ เวลา {time_match.group(1).replace('.', ':')} น.", True
        return (now - timedelta(days=1)).strftime("%Y-%m-%d"), "เมื่อวานนี้", True

    if re.search(r'(?:โพสต์เมื่อ|เผยแพร่|อัปเดต)\s*:\s*วันนี้|วันนี้', text_clean):
        time_match = re.search(r'วันนี้(?:\s*เวลา)?\s*(\d{1,2}[:.]\d{2})', text_clean)
        if time_match:
            return now.strftime("%Y-%m-%d"), f"วันนี้ เวลา {time_match.group(1).replace('.', ':')} น.", True
        return now.strftime("%Y-%m-%d"), "วันนี้", True

    # 6. Thai Relative Time with "ที่ผ่านมา / ที่แล้ว / ก่อน"
    # Matches: 9 ชั่วโมงที่ผ่านมา, 9 ชม.ที่ผ่านมา, 15 นาทีที่แล้ว, 3 วันก่อน, 2 สัปดาห์ก่อน, 1 ปีที่แล้ว
    rel_thai_match = re.search(
        r'(\d{1,3})\s*(วินาที|วิ\.|นาที|ชั่วโมง|ชม\.|ช\.ม\.|วัน|ว\.|สัปดาห์|อาทิตย์|เดือน|ปี)\s*(ที่ผ่านมา|ที่แล้ว|ก่อน|ago)?',
        text_clean,
        re.IGNORECASE
    )
    if rel_thai_match:
        val = int(rel_thai_match.group(1))
        unit = rel_thai_match.group(2)
        suffix = rel_thai_match.group(3) or ("ที่ผ่านมา" if "ชม" in unit else "ที่แล้ว")

        if 'วินาที' in unit or 'วิ.' in unit:
            return now.strftime("%Y-%m-%d"), f"{val} วินาทีที่แล้ว", True
        elif 'นาที' in unit:
            dt = now - timedelta(minutes=val)
            return dt.strftime("%Y-%m-%d"), f"{val} นาทีที่แล้ว", True
        elif 'ชั่วโมง' in unit or 'ชม' in unit:
            dt = now - timedelta(hours=val)
            return dt.strftime("%Y-%m-%d"), f"{val} ชั่วโมงที่ผ่านมา", True
        elif 'วัน' in unit or unit == 'ว.':
            dt = now - timedelta(days=val)
            return dt.strftime("%Y-%m-%d"), f"{val} วันก่อน", val <= 1
        elif 'สัปดาห์' in unit or 'อาทิตย์' in unit:
            dt = now - timedelta(weeks=val)
            return dt.strftime("%Y-%m-%d"), f"{val} สัปดาห์ก่อน", False
        elif 'เดือน' in unit:
            dt = now - timedelta(days=val * 30)
            return dt.strftime("%Y-%m-%d"), f"{val} เดือนก่อน", False
        elif 'ปี' in unit:
            dt = now - timedelta(days=val * 365)
            return dt.strftime("%Y-%m-%d"), f"{val} ปีก่อน", False

    # 7. Social Media Dot & Short Relative Timestamp (e.g. · 9 ชม., · 2 วัน, · 15 นาที)
    social_dot = re.search(r'(?:·|•|\s|^)(\d{1,3})\s*(ชม\.|ชั่วโมง|นาที|วัน|ว\.|สัปดาห์|เดือน|ปี)(?:\s*(ที่ผ่านมา|ที่แล้ว|ก่อน))?', text_clean)
    if social_dot:
        val = int(social_dot.group(1))
        unit = social_dot.group(2)
        if 'ชม' in unit or 'ชั่วโมง' in unit:
            dt = now - timedelta(hours=val)
            return dt.strftime("%Y-%m-%d"), f"{val} ชั่วโมงที่ผ่านมา", True
        elif 'นาที' in unit:
            dt = now - timedelta(minutes=val)
            return dt.strftime("%Y-%m-%d"), f"{val} นาทีที่แล้ว", True
        elif 'วัน' in unit or unit == 'ว.':
            dt = now - timedelta(days=val)
            return dt.strftime("%Y-%m-%d"), f"{val} วันก่อน", val <= 1
        elif 'สัปดาห์' in unit:
            dt = now - timedelta(weeks=val)
            return dt.strftime("%Y-%m-%d"), f"{val} สัปดาห์ก่อน", False

    # 8. English Relative Timestamps (e.g. 9 hours ago, 15 mins ago, 3 days ago, 2 weeks ago)
    eng_rel = re.search(r'(\d{1,3})\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|wk|wks|week|weeks|mo|mos|month|months|y|yr|yrs|year|years)\s*ago', text_clean, re.IGNORECASE)
    if eng_rel:
        val = int(eng_rel.group(1))
        unit = eng_rel.group(2).lower()
        if unit in ['s', 'sec', 'secs', 'second', 'seconds']:
            return now.strftime("%Y-%m-%d"), "เมื่อสักครู่นี้", True
        elif unit in ['m', 'min', 'mins', 'minute', 'minutes']:
            dt = now - timedelta(minutes=val)
            return dt.strftime("%Y-%m-%d"), f"{val} นาทีที่แล้ว", True
        elif unit in ['h', 'hr', 'hrs', 'hour', 'hours']:
            dt = now - timedelta(hours=val)
            return dt.strftime("%Y-%m-%d"), f"{val} ชั่วโมงที่ผ่านมา", True
        elif unit in ['d', 'day', 'days']:
            dt = now - timedelta(days=val)
            return dt.strftime("%Y-%m-%d"), f"{val} วันก่อน", val <= 1
        elif unit in ['w', 'wk', 'wks', 'week', 'weeks']:
            dt = now - timedelta(weeks=val)
            return dt.strftime("%Y-%m-%d"), f"{val} สัปดาห์ก่อน", False
        elif unit in ['mo', 'mos', 'month', 'months']:
            dt = now - timedelta(days=val * 30)
            return dt.strftime("%Y-%m-%d"), f"{val} เดือนก่อน", False
        elif unit in ['y', 'yr', 'yrs', 'year', 'years']:
            dt = now - timedelta(days=val * 365)
            return dt.strftime("%Y-%m-%d"), f"{val} ปีก่อน", False

    return None, "ไม่ระบุในข้อความ", False
