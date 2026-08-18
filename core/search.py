import json
import os
import re
import logging
import concurrent.futures
from datetime import datetime, timedelta
from urllib.parse import urlparse
from dotenv import load_dotenv

try:
    from . import http_client
except ImportError:
    import http_client

logger = logging.getLogger(__name__)

load_dotenv()


INTERNATIONAL_AUTHORITY_DOMAINS = {
    'mfa.go.th', 'thaiembassy.org', 'thaiembassy.com', 'thaiembassy.de',
    'thaiembassy.fr', 'thaiembassy.jp', 'thaiembassy.sg', 'usembassy.gov',
    'un.org', 'who.int', 'asean.org', 'unicef.org', 'unesco.org',
    'worldbank.org', 'imf.org', 'interpol.int', 'redcross.org',
    'bot.or.th', 'sec.or.th', 'oic.or.th', 'nhso.go.th', 'sso.go.th',
    'antifakenewscenter.com', 'sure.factcheckthailand.org', 'cofact.org'
}

def _is_authority_domain(domain: str) -> bool:
    if not domain:
        return False
    dom = str(domain).lower().replace('www.', '')
    if dom.endswith('.go.th') or dom.endswith('.gov'):
        return True
    if dom in INTERNATIONAL_AUTHORITY_DOMAINS:
        return True
    for auth in INTERNATIONAL_AUTHORITY_DOMAINS:
        if dom.endswith('.' + auth):
            return True
    return False

def _max_ref_age_days() -> int:
    """ข่าวขุด/ข่าวติดตาม/ข่าวภายใน 1 ปี → ให้โอกาสค้นหาเจอ (default 365 วัน)."""
    try:
        return max(30, int(os.getenv("MAX_REF_AGE_DAYS", "365")))
    except ValueError:
        return 365


def _get_planner_timeout() -> float:
    try:
        return float(os.getenv("PLANNER_TIMEOUT_SECONDS", "45"))
    except ValueError:
        return 45.0


_THAI_MONTHS_MAP = {
    'ม.ค.': 1, 'มกราคม': 1, 'ก.พ.': 2, 'กุมภาพันธ์': 2, 'มี.ค.': 3, 'มีนาคม': 3,
    'เม.ย.': 4, 'เมษายน': 4, 'พ.ค.': 5, 'พฤษภาคม': 5, 'มิ.ย.': 6, 'มิถุนายน': 6,
    'ก.ค.': 7, 'กรกฎาคม': 7, 'ส.ค.': 8, 'สิงหาคม': 8, 'ก.ย.': 9, 'กันยายน': 9,
    'ต.ค.': 10, 'ตุลาคม': 10, 'พ.ย.': 11, 'พฤศจิกายน': 11, 'ธ.ค.': 12, 'ธันวาคม': 12,
    'jan': 1, 'january': 1, 'feb': 2, 'february': 2, 'mar': 3, 'march': 3,
    'apr': 4, 'april': 4, 'may': 5, 'jun': 6, 'june': 6, 'jul': 7, 'july': 7,
    'aug': 8, 'august': 8, 'sep': 9, 'september': 9, 'oct': 10, 'october': 10,
    'nov': 11, 'november': 11, 'dec': 12, 'december': 12
}


def _parse_pub_date(pub_date, title: str = "", url: str = "", snippet: str = "") -> tuple:
    """
    Universal Parser for any date/time string:
    Supports Thai & English absolute formats, ISO formats, and relative expressions:
    - วันนี้, เมื่อวาน, 1 วันก่อน, 1 วันที่แล้ว, 1 วันที่ผ่านมา
    - 1 ชั่วโมงก่อน, 1 ชม. ที่แล้ว, 30 นาทีที่แล้ว
    - 1 สัปดาห์ก่อน, 1 สัปดาห์ที่ผ่านมา
    - 1 เดือนก่อน, 1 เดือนที่แล้ว, 1 เดือนที่ผ่านมา
    - 1 ปีก่อน, 1 ปีที่แล้ว, 1 ปีที่ผ่านมา, 2 ปีก่อน, 3 ปีที่ผ่านมา
    - 2 days ago, 3 weeks ago, 1 month ago, 2 years ago
    - Fallback detection from title/url/snippet years.
    Returns: (year_ce, days_old)
    """
    if not pub_date or str(pub_date).strip() in ("", "ไม่ระบุ", "None", "null", "N/A"):
        text = f"{title} {url} {snippet}"
    else:
        text = str(pub_date).strip()

    now = datetime.now()
    text_clean = text.strip()
    if not text_clean:
        return None, None

    # 1. ISO format: YYYY-MM-DD
    m_iso = re.search(r'(20\d{2}|25\d{2})[-/](\d{1,2})[-/](\d{1,2})', text_clean)
    if m_iso:
        y_val = int(m_iso.group(1))
        year_ce = y_val - 543 if y_val > 2500 else y_val
        m_val = int(m_iso.group(2))
        d_val = int(m_iso.group(3))
        try:
            dt = datetime(year_ce, m_val, d_val)
            days = (now - dt).days
            return dt.year, max(0, days)
        except ValueError:
            pass

    # 2. Thai & English relative dates
    # 2.1 วันนี้ / เมื่อวาน / เมื่อวานนี้ / เมื่อคืน / เมื่อสักครู่ / today / yesterday
    if any(w in text_clean.lower() for w in ['วันนี้', 'เมื่อสักครู่', 'เมื่อกี้', 'คืนนี้', 'today', 'just now']):
        return now.year, 0
    if any(w in text_clean.lower() for w in ['เมื่อวานนี้', 'เมื่อวาน', 'เมื่อคืน', 'yesterday']):
        dt = now - timedelta(days=1)
        return dt.year, 1
    if 'เมื่อวานซืน' in text_clean:
        dt = now - timedelta(days=2)
        return dt.year, 2

    # 2.2 Relative units (Thai & English) with or without explicit digit (e.g. 1 วันก่อน, ปีก่อน, เดือนที่แล้ว)
    rel_match = re.search(
        r'(\d+)?\s*(วินาที|วิ|นาที|น\.|ชั่วโมง|ชม\.|วัน|สัปดาห์|อาทิตย์|เดือน|ปี|sec|second|seconds|min|minute|minutes|hour|hours|hr|hrs|day|days|d|week|weeks|wk|wks|month|months|mo|mos|year|years|yr|yrs)\s*(ที่แล้ว|ที่ผ่านมา|ก่อน|ago)?',
        text_clean,
        re.IGNORECASE
    )
    if rel_match and (rel_match.group(1) or rel_match.group(3) or any(u in rel_match.group(2) for u in ['ชม.', 'น.', 'sec', 'min', 'hr', 'wk', 'mo', 'yr', 'ago'])):
        val = int(rel_match.group(1)) if rel_match.group(1) else 1
        unit = rel_match.group(2).lower()
        if any(u in unit for u in ['วินาที', 'วิ', 'sec', 'นาที', 'min', 'ชั่วโมง', 'ชม', 'hour', 'hr']):
            return now.year, 0
        elif any(u in unit for u in ['วัน', 'day', 'd']):
            dt = now - timedelta(days=val)
            return dt.year, val
        elif any(u in unit for u in ['สัปดาห์', 'อาทิตย์', 'week', 'wk']):
            days = val * 7
            dt = now - timedelta(days=days)
            return dt.year, days
        elif any(u in unit for u in ['เดือน', 'month', 'mo']):
            days = val * 30
            dt = now - timedelta(days=days)
            return dt.year, days
        elif any(u in unit for u in ['ปี', 'year', 'yr']):
            days = val * 365
            dt = now - timedelta(days=days)
            return dt.year, days

    # 3. Thai absolute date: "16 ส.ค. 2569", "16 สิงหาคม 2569 เวลา 21.00 น."
    thai_date_match = re.search(
        r'(?:((?:คืน)?วัน(?:จันทร์|อังคาร|พุธ|พฤหัสบดี|พฤหัส|ศุกร์|เสาร์|อาทิตย์))\s*(?:ที่)?)?\s*(\d{1,2})\s*(ม\.ค\.|มกราคม|ก\.พ\.|กุมภาพันธ์|มี\.ค\.|มีนาคม|เม\.ย\.|เมษายน|พ\.ค\.|พฤษภาคม|มิ\.ย\.|มิถุนายน|ก\.ค\.|กรกฎาคม|ส\.ค\.|สิงหาคม|ก\.ย\.|กันยายน|ต\.ค\.|ตุลาคม|พ\.ย\.|พฤศจิกายน|ธ\.ค\.|ธันวาคม)\s*(\d{2,4})(?:\s*เวลา\s*(\d{1,2}[\.:]\d{2})\s*(?:น\.|น)?)?',
        text_clean
    )
    if thai_date_match:
        day = int(thai_date_match.group(2))
        month_str = thai_date_match.group(3)
        year_raw = int(thai_date_match.group(4))
        month = _THAI_MONTHS_MAP.get(month_str, 1)
        if year_raw < 100:
            year = year_raw + 2500 - 543
        elif year_raw > 2400:
            year = year_raw - 543
        else:
            year = year_raw
        try:
            dt = datetime(year, month, day)
            days = (now - dt).days
            return dt.year, max(0, days)
        except ValueError:
            pass

    # 4. English absolute date: "Jun 9, 2026", "16 Aug 2026", "August 16, 2026"
    en_match1 = re.search(r'([a-zA-Z]{3,9})\s+(\d{1,2}),?\s+(\d{4})', text_clean)
    if en_match1:
        m_str = en_match1.group(1).lower()
        day = int(en_match1.group(2))
        y_val = int(en_match1.group(3))
        m_val = _THAI_MONTHS_MAP.get(m_str)
        if m_val:
            try:
                dt = datetime(y_val, m_val, day)
                return dt.year, max(0, (now - dt).days)
            except ValueError:
                pass

    en_match2 = re.search(r'(\d{1,2})\s+([a-zA-Z]{3,9}),?\s+(\d{4})', text_clean)
    if en_match2:
        day = int(en_match2.group(1))
        m_str = en_match2.group(2).lower()
        y_val = int(en_match2.group(3))
        m_val = _THAI_MONTHS_MAP.get(m_str)
        if m_val:
            try:
                dt = datetime(y_val, m_val, day)
                return dt.year, max(0, (now - dt).days)
            except ValueError:
                pass

    # 5. Year in URL / Title / Snippet fallback (e.g. /2025/11/ or 2568)
    y_in_text = re.search(r'\b(25\d{2}|20\d{2})\b', f"{title} {url} {snippet}")
    if y_in_text:
        y_val = int(y_in_text.group(1))
        year_ce = y_val - 543 if y_val > 2500 else y_val
        est_days = max(0, (now.year - year_ce) * 365)
        return year_ce, est_days

    return None, None


def _format_pub_date_display(pub_date: str, title: str = "", url: str = "", snippet: str = "") -> str:
    if not pub_date or pub_date == "ไม่ระบุ":
        yr_ce, _ = _parse_pub_date("ไม่ระบุ", title=title, url=url, snippet=snippet)
        if yr_ce:
            return f"ปี {yr_ce + 543} ({yr_ce})"
        return "ไม่ระบุ"
    p_clean = str(pub_date).strip()
    
    # 1. ISO format: 2026-08-16T... or 2026-08-16
    iso_match = re.match(r'^(\d{4})-(\d{1,2})-(\d{1,2})', p_clean)
    if iso_match:
        y, m, d = int(iso_match.group(1)), int(iso_match.group(2)), int(iso_match.group(3))
        months_th = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
        m_str = months_th[m - 1] if 1 <= m <= 12 else str(m)
        y_th = y + 543 if y < 2500 else y
        return f"{d} {m_str} {y_th}"
        
    # 2. Thai explicit date: 16 ส.ค. 2569
    th_date_match = re.search(r'(\d{1,2})\s*([^\d\s]+)\s*(25\d{2}|20\d{2})', p_clean)
    if th_date_match:
        return th_date_match.group(0)

    # 3. Clean relative phrases without trailing cutoffs
    return re.sub(r'[\s•·|,-]+$', '', p_clean)


def _ref_too_old(pub_date, max_days: int, query: str = "", timeline: str = "", title: str = "", url: str = "", snippet: str = "") -> bool:
    """Age of News (Recency): Day-based and context-based calculation."""
    year_ce, days_old = _parse_pub_date(pub_date, title=title, url=url, snippet=snippet)
    if days_old is None:
        return False
    current_year = datetime.now().year

    # 1. Detect if the query is about tonight / today / live / current events / this year
    combined_query = f"{query} {timeline}".lower()
    is_live_current = any(w in combined_query for w in ['คืนนี้', 'วันนี้', 'สด', 'ดูสด', 'ถ่ายทอดสด', 'โปรแกรมแข่ง', 'ชิงอันดับ', 'ชิงชนะเลิศ', 'ผลแข่ง', 'ล่าสุด', 'ด่วน'])

    # 2. Extract target year (if specified in query or timeline)
    target_year_ce = None
    y_match = re.search(r'\b(25\d{2}|20\d{2})\b', combined_query)
    if y_match:
        y_val = int(y_match.group(1))
        target_year_ce = y_val - 543 if y_val > 2500 else y_val
    elif is_live_current:
        target_year_ce = current_year

    # If the target year is current year (or future) and the article is from a PAST calendar year (e.g. 2025, 2024, 2023):
    if target_year_ce and year_ce:
        if target_year_ce <= current_year and year_ce < target_year_ce:
            return True
        elif target_year_ce > current_year and year_ce < current_year:
            return True

    # If it is a live event (คืนนี้ / วันนี้), reject articles older than 60 days
    if is_live_current and days_old > 60:
        return True

    if year_ce and year_ce >= current_year:
        return False
    return days_old > max_days


def _ref_age_penalty(pub_date, max_days: int, title: str = "", url: str = "", snippet: str = "") -> int:
    """ให้คะแนนโบนัสแก่ข่าวสดใหม่ และลดคะแนนสำหรับข่าวเก่า."""
    _year_ce, days_old = _parse_pub_date(pub_date, title=title, url=url, snippet=snippet)
    if days_old is None:
        return 0
    if days_old <= 7:
        return 15  # ข่าวสดใหม่มากใน 1 สัปดาห์
    elif days_old <= 30:
        return 10  # ข่าวสดใหม่ใน 1 เดือน
    elif days_old <= 90:
        return 5   # ข่าว 1-3 เดือน
    elif days_old > 365:
        return -20 # ข่าวเก่าเกิน 1 ปี
    return 0

_EXA_DISABLED = False

def fetch_exa_api(payload, api_key, timeout=25):
    global _EXA_DISABLED
    if _EXA_DISABLED or not api_key:
        return []
    url = "https://api.exa.ai/search"
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "x-api-key": api_key
    }
    try:
        response = http_client.wall_clock_request(
            "POST", url, json=payload, headers=headers,
            timeout=http_client.split_timeout(timeout),
        )
        if response.status_code in (401, 402):
            if not _EXA_DISABLED:
                logger.warning("Exa API credit exhausted (Status %s) - Switched to Serper fallback.", response.status_code)
                _EXA_DISABLED = True
            return []
        response.raise_for_status()
        data = response.json()
        return data.get("results", [])
    except Exception as e:
        err_str = str(e)
        if "402" in err_str or "Payment Required" in err_str or "401" in err_str:
            _EXA_DISABLED = True
        logger.warning("Exa API unavailable: %s - Falling back to Serper.", e)
        return []

def fetch_serper_api(query, api_key, num_results=10, timeout=15, tbs=""):
    """Fetch from Google Organic Search (/search)."""
    url = "https://google.serper.dev/search"
    headers = {"X-API-KEY": api_key, "Content-Type": "application/json"}
    payload = {"q": query, "gl": "th", "hl": "th", "num": num_results}
    if tbs:
        payload["tbs"] = tbs
    try:
        response = http_client.wall_clock_request(
            "POST", url, json=payload, headers=headers,
            timeout=http_client.split_timeout(timeout),
        )
        response.raise_for_status()
        data = response.json()
        results = []
        for item in data.get("organic", []):
            results.append({
                "title": item.get("title", ""),
                "url": item.get("link", ""),
                "text": item.get("snippet", ""),
                "publishedDate": item.get("date", "ไม่ระบุ"),
            })
        return results
    except Exception as e:
        logger.error("Serper API Error: %s", e)
        return []


def fetch_serper_news_api(query, api_key, num_results=10, timeout=15):
    """Fetch from Google News tab (/news) — ดีสำหรับข่าวสด/ข่าวที่ยังไม่ติดหน้าแรก Google Search."""
    url = "https://google.serper.dev/news"
    headers = {"X-API-KEY": api_key, "Content-Type": "application/json"}
    payload = {"q": query, "gl": "th", "hl": "th", "num": num_results}
    try:
        response = http_client.wall_clock_request(
            "POST", url, json=payload, headers=headers,
            timeout=http_client.split_timeout(timeout),
        )
        response.raise_for_status()
        data = response.json()
        results = []
        for item in data.get("news", []):
            results.append({
                "title": item.get("title", ""),
                "url": item.get("link", ""),
                "text": item.get("snippet", ""),
                "publishedDate": item.get("date", "ไม่ระบุ"),
            })
        return results
    except Exception as e:
        logger.error("Serper News API Error: %s", e)
        return []

def is_actual_article(url: str, title: str) -> bool:
    """ตรวจสอบว่าเป็นบทความข่าวเดี่ยวจริง ไม่ใช่หน้าแรก, หมวดหมู่, หรือหน้าลิสต์ข่าวรวม.
    
    - ตัดทิ้ง: หน้าหมวดหมู่, หน้าแรก, หน้าค้นหา, ไฟล์รูปภาพ, อัลบั้มภาพ
    - ยอมรับ: ข่าวสรุปประเด็น/สรุปเหตุการณ์ประจำปี
    """
    parsed = urlparse(url.lower())
    path = parsed.path.rstrip('/')
    path_parts = [p for p in path.split('/') if p]
    title_lower = title.lower().strip()

    # 1. Non-article file formats (PDFs, Documents, Images, Media)
    if re.search(r'\.(pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|webp|gif|svg|bmp|tiff|avif|ico|mp4|avi|mov|mp3|wav)($|\?)', url.lower()):
        return False

    # 1.1 Injected SEO parasite scripts / spam gateways (e.g. bangkokviews.asp, /view.asp?id=, /slot/)
    if 'bangkokview' in url.lower() or 'bangkokviews' in url.lower():
        return False
    if re.search(r'(\.asp\?|\.php\?id=.*(slot|bet|casino|view|news|id=))', url.lower()):
        if not any(dom in parsed.netloc for dom in ['thairath.co.th', 'dailynews.co.th', 'matichon.co.th', 'khaosod.co.th', 'mgronline.com', 'bangkokbiznews.com']):
            return False

    gallery_title_patterns = [
        r'\bphoto[\s_-]*gallery\b', r'\bgallery\b', r'\bphoto[\s_-]*album\b', r'\balbum\b', r'\bwallpaper(s)?\b',
        r'\[pdf\]', r'\[ภาพชุด', r'\[รวมภาพ', r'\[ประมวลภาพ', r'\[อัลบั้มภาพ', 
        r'\[รวมรูปภาพ', r'\[รวมรูป', r'\[ชุดภาพ', r'\[photo', r'\[gallery',
        r'รวมรูปภาพ', r'รวมรูป', r'รวมภาพ', r'ภาพชุด', r'ประมวลภาพ', r'อัลบั้มภาพ', r'อัลบั้มรูป', r'ชุดภาพ',
        r'รูปที่\s*\d+\s*จาก\s*\d+', r'ภาพที่\s*\d+\s*จาก\s*\d+',
        r'แกลเลอรี', r'แกลเลอรี่', r'แกลเลอรีย์', r'วอลเปเปอร์', r'วอลเปเป้อร์'
    ]
    if any(re.search(pat, title_lower) for pat in gallery_title_patterns):
        return False

    # 2. Empty or root homepage paths
    if not path_parts:
        return False
    if path in ['/', '/th', '/en', '/th/', '/en/', '/index.html', '/index.php', '/default.aspx', '/home']:
        return False

    # 3. Pure Photo / Gallery / Video Clip / Audio Path Filter (Strict Rejection if ANY segment matches)
    media_path_regex = r'(gallery|galleries|photo|photos|album|albums|image|images|picture|pictures|wallpaper|wallpapers|pic\b|pics\b|video|videos|clip|clips|reel|reels|shorts|podcast|podcasts)'
    for seg in path_parts:
        seg_normalized = seg.replace('-', '').replace('_', '')
        if re.search(media_path_regex, seg_normalized):
            return False

    if any(sub in parsed.netloc for sub in ['video.', 'gallery.', 'photo.', 'photos.', 'podcast.', 'audio.', 'wallpaper.', 'picture.']):
        return False

    # 3.1 Pure Photo Hosting Domains
    photo_hosting_domains = [
        'pinterest.com', 'flickr.com', 'imgur.com', 'shutterstock.com',
        'gettyimages.com', 'freepik.com', 'unsplash.com', 'pixabay.com'
    ]
    if any(ph in parsed.netloc for ph in photo_hosting_domains):
        return False

    # 3.2 Aggregator / Category / Tag / Archive / Section Listing Filter
    listing_keywords = {
        'category', 'categories', 'topic', 'topics', 'tag', 'tags',
        'author', 'authors', 'page', 'search', 'archive', 'archives',
        'calendar', 'sitemap', 'section', 'sections', 'feed', 'rss'
    }
    if any(k in path_parts for k in listing_keywords):
        last_part = path_parts[-1]
        if last_part in listing_keywords or (len(path_parts) >= 2 and path_parts[-2] in listing_keywords and not re.search(r'\d{4,}', last_part) and len(last_part) < 15):
            return False

    # 4. Common News CMS Section Index Paths (e.g. /news/politic, /news/crime, /news/society)
    section_names = {
        'politic', 'politics', 'society', 'crime', 'foreign', 'international',
        'economy', 'economic', 'business', 'entertainment', 'entertain', 'sport',
        'sports', 'tech', 'technology', 'lifestyle', 'health', 'travel', 'auto',
        'local', 'regional', 'general', 'opinion', 'editorial', 'special',
        'breaking', 'latest', 'news', 'hot', 'viral', 'celebrity'
    }
    if len(path_parts) == 1:
        single_path = path_parts[0]
        if single_path in section_names or single_path in ['news', 'latest', 'pr', 'article', 'articles', 'update', 'ข่าวด่วน', 'ข่าว']:
            return False
        if len(single_path) < 10 and not re.search(r'\.(html|htm|php|aspx)', single_path) and not re.search(r'\d+', single_path):
            return False

    if len(path_parts) == 2:
        p0, p1 = path_parts[0], path_parts[1]
        if (p0 in ['news', 'lifestyle', 'section', 'category', 'topic', 'th', 'en'] or p0 in section_names) and (p1 in section_names or p1 in ['all', 'latest', 'index']):
            return False

    # 5. Generic Title Filter
    exact_generic_titles = [
        'หน้าแรก', 'หน้าหลัก', 'ข่าววันนี้', 'ข่าวล่าสุด', 'ข่าวด่วน', 'รวมข่าว',
        'ข่าวทั้งหมด', 'home', 'official website', 'เว็บไซต์ทางการ', 'สารบัญ'
    ]
    if title_lower in exact_generic_titles:
        return False

    if any(title_lower.startswith(g) for g in exact_generic_titles) and len(title_lower) < 20 and not re.search(r'\b(25\d{2}|20\d{2})\b', title_lower):
        return False

    # 6. Academic Thesis Filter
    academic_path_patterns = ['/handle/', '/bitstream/', '/thesis', '/dissertation', '/dspace', '/repository', '/ethesis', '/tci-thaijo', '/e-journal']
    if any(pat in path for pat in academic_path_patterns):
        return False
    if any(d in parsed.netloc for d in ['cuir.car.chula.ac.th', 'repository.', 'dspace.', 'thailis.or.th', 'thaijo.org']):
        return False
    academic_title_keywords = ['วิทยานิพนธ์', 'สารนิพนธ์', 'ดุษฎีนิพนธ์', 'งานวิจัยเรื่อง', 'วารสารวิชาการ', 'บทความวิจัย', 'master thesis', 'doctoral dissertation']
    if any(ak in title_lower for ak in academic_title_keywords):
        return False

    if len(title.strip()) < 8:
        return False

    return True


def _text_has_query_overlap(query: str, text: str, min_chars: int = 5) -> bool:
    q = query.lower().strip()
    t = text.lower()
    if not q or not t:
        return False
    if q in t:
        return True
    for i in range(len(q) - min_chars + 1):
        if q[i:i + min_chars] in t:
            return True
    return False


_GENERIC_QUERY_WORDS = {
    'เพื่อนรัก', 'เพื่อน', 'แฟน', 'เมีย', 'ผัว', 'สามี', 'ภรรยา', 'หนุ่ม',
    'สาว', 'รัก', 'เงิน', 'ลูก', 'ครอบครัว', 'คนรัก', 'แฟนเก่า', 'แม่',
    'พ่อ', 'น้อง', 'พี่', 'ลุง', 'ป้า', 'ตา', 'ยาย', 'ให้', 'ข่าว', 'ด่วน',
    'ล่าสุด', 'เปิดใจ', 'เผย', 'เจอ', 'พบ', 'ช็อก', 'สุด', 'มาก',
}


def _query_overlap_specific(fallback_query: str, text: str, min_chars: int = 6) -> bool:
    """fallback overlap ที่กรองคำสามัญออก."""
    if not fallback_query:
        return False
    specific = " ".join(w for w in fallback_query.split() if w not in _GENERIC_QUERY_WORDS)
    return _text_has_query_overlap(specific, text, min_chars)


def _match_single_kw(kw_str: str, text_lower: str) -> tuple:
    """Helper to check if a keyword matches text strictly."""
    if not kw_str:
        return False, False
    kw_clean = kw_str.strip().lower()
    
    # 1. Numeric keyword
    nums = re.findall(r'\d+', kw_clean.replace(',', ''))
    if nums:
        text_no_commas = re.sub(r'(?<=\d),(?=\d)', '', text_lower)
        if not all(num in text_no_commas for num in nums):
            return False, False
        th_words = [w for w in re.findall(r'[\u0E00-\u0E7F]+', kw_clean) if len(w) > 1]
        if th_words and not any(w in text_lower for w in th_words):
            return False, False
        return True, True

    # 2. Non-numeric keyword
    if kw_clean in text_lower:
        return True, False
    subwords = [w for w in kw_clean.split() if len(w) > 2]
    if subwords and all(w in text_lower for w in subwords):
        return True, False
    return False, False


def _keyword_partial_match(keywords: list, text: str) -> tuple:
    if not keywords:
        return False, 0, [], False
    
    text_lower = text.lower()
    matched = []
    total_score = 0
    has_numeric_exact = False
    
    for kw in keywords:
        is_match, is_num = _match_single_kw(kw, text_lower)
        if is_match:
            matched.append(kw)
            total_score += 15 if is_num else 10
            if is_num:
                has_numeric_exact = True
    
    return len(matched) > 0, total_score, matched, has_numeric_exact


ACTION_KEYWORDS = {
    'เด้ง', 'สั่งย้าย', 'ย้าย', 'สั่งฟาด', 'ฟาด', 'จับ', 'บุกจับ', 'จับกุม', 'ทลาย',
    'ทุจริต', 'โกง', 'สแกมเมอร์', 'หลอก', 'ดูดเงิน', 'ยึดทรัพย์', 'ไฟไหม้', 'เพลิงไหม้',
    'แผ่นดินไหว', 'น้ำท่วม', 'ชน', 'รถชน', 'อุบัติเหตุ', 'ตาย', 'เสียชีวิต', 'ฆ่า',
    'ยิง', 'ฟ้อง', 'หย่า', 'แต่งงาน', 'แถลง', 'ประชุม', 'อนุมัติ', 'เคาะ', 'แจก',
    'โอน', 'ปรับลด', 'ขึ้นภาษี', 'ลดราคา', 'อัดงบ', 'กู้', 'ช่วยเหลือ', 'ออม', 'สกัดจับ'
}

GENERIC_FILLER_KEYWORDS = {
    'ข่าว', 'ล่าสุด', 'ด่วน', 'วันนี้', 'คืนนี้', 'พรุ่งนี้', 'เมื่อวาน',
    'ถ่ายทอดสด', 'ดูสด', 'ลิงก์ดูสด', 'ลิงค์ดูสด', 'คลิป', 'พรีวิว', 'ไฮไลท์',
    'ตารางแข่ง', 'โปรแกรม', 'เช็ก', 'เตือนภัย', 'แชร์ว่อน', 'ความจริง', 'เตือน'
}

def _extract_tri_anchors(keywords: list, query: str = "") -> tuple:
    """Classify keywords into Tri-Anchor dimensions: (Entities, Actions, Metrics)."""
    entities = []
    actions = []
    metrics = []

    combined = list(dict.fromkeys([str(k).strip().lower() for k in (keywords or []) if str(k).strip()]))
    for kw in combined:
        if re.search(r'^\d+(\.\d+)?\s*(บาท|%|เปอร์เซ็นต์|ล้าน|หมื่น|พัน|แสน|ริกเตอร์|แมกนิจูด|กม\.|เมตร|องศา|ราย|คน|แต้ม|เซต|คดี)$', kw):
            metrics.append(kw)
            continue
        if any(act in kw for act in ACTION_KEYWORDS):
            actions.append(kw)
            continue
        if kw in GENERIC_FILLER_KEYWORDS:
            continue
        entities.append(kw)

    return entities, actions, metrics


def _compute_relevance_score(keywords: list, query: str, title: str, snippet: str,
                             locations: list = None, timeline: str = None) -> float:
    """คำนวณค่าความสัมพันธ์แบบ Universal Tri-Anchor Precision (0-100%)."""
    if not keywords and not query:
        return 50.0

    content = f"{title} {snippet}".lower()
    title_lower = title.lower()
    entities, actions, metrics = _extract_tri_anchors(keywords, query)
    all_kws = list(dict.fromkeys(entities + actions + metrics))
    if not all_kws:
        all_kws = [k.lower() for k in (keywords or []) if k.lower() not in GENERIC_FILLER_KEYWORDS]
    if not all_kws:
        all_kws = [query.lower()] if query else []

    title_hits = sum(1 for kw in all_kws if _match_single_kw(kw, title_lower)[0])
    title_score = 35.0 * (title_hits / len(all_kws)) if all_kws else 0.0

    content_hits = sum(1 for kw in all_kws if _match_single_kw(kw, content)[0])
    content_score = 45.0 * (content_hits / len(all_kws)) if all_kws else 0.0

    query_terms = [w for w in re.findall(r'[\u0E00-\u0E7F\w]+', (query or "").lower()) if len(w) > 2 and w not in GENERIC_FILLER_KEYWORDS]
    q_score = 0.0
    if query_terms:
        q_hits = sum(1 for w in query_terms if w in content)
        q_score = 20.0 * (q_hits / len(query_terms))

    score = title_score + content_score + q_score

    # -------------------------------------------------------------------------
    # 0. Zero-Tolerance Cross-Topic & Sport Mismatch Filter
    # -------------------------------------------------------------------------
    combined_query_kws = f"{query} {' '.join(keywords or [])}".lower()
    
    SPORTS_CONFLICTS = [
        ({'วอลเลย์บอล', 'volleyball', 'ลูกยาง'}, {'ฟุตบอล', 'football', 'บอลสด', 'บอลไทย', 'ฟุตซอล', 'บาสเกตบอล', 'แบดมินตัน', 'มวย', 'เทนนิส'}),
        ({'ฟุตบอล', 'football', 'บอลสด', 'บอลไทย'}, {'วอลเลย์บอล', 'ลูกยาง', 'ฟุตซอล', 'บาสเกตบอล', 'แบดมินตัน', 'มวย'}),
        ({'แบดมินตัน', 'badminton'}, {'ฟุตบอล', 'วอลเลย์บอล', 'เทนนิส', 'บาสเกตบอล'}),
        ({'บาสเกตบอล', 'basketball'}, {'ฟุตบอล', 'วอลเลย์บอล', 'แบดมินตัน'}),
    ]
    for target_sport, conflict_sport in SPORTS_CONFLICTS:
        if any(t in combined_query_kws for t in target_sport):
            has_conflict = any(c in content for c in conflict_sport)
            has_target = any(t in content for t in target_sport)
            if has_conflict and not has_target:
                return 0.0

    COUNTRIES = ['โครเอเชีย', 'เมียนมา', 'พม่า', 'เวียดนาม', 'กัมพูชา', 'อินโดนีเซีย', 'ฟิลิปปินส์', 'มาเลเซีย', 'สิงคโปร์', 'ลาว', 'จีน', 'ญี่ปุ่น', 'เกาหลีใต้', 'ไต้หวัน', 'สหรัฐ', 'อิตาลี', 'บราซิล', 'โปแลนด์', 'ตุรกี']
    target_opponents = [c for c in COUNTRIES if c in combined_query_kws and c != 'ไทย']
    if len(target_opponents) == 1:
        opp = target_opponents[0]
        other_opps = [c for c in COUNTRIES if c != opp and c != 'ไทย' and c in title_lower]
        if other_opps and opp not in content:
            return 0.0

    e_hits = sum(1 for k in entities if _match_single_kw(k, content)[0]) if entities else 0
    e_ratio = (e_hits / len(entities)) if entities else 1.0
    
    a_hit = any(_match_single_kw(k, content)[0] for k in actions) if actions else True
    m_hit = any(_match_single_kw(k, content)[0] for k in metrics) if metrics else True

    if actions and not a_hit:
        score *= 0.25
        
    GENERIC_BROAD_ENTITIES = {
        'ไทย', 'ประเทศไทย', 'รัฐบาล', 'ตำรวจ', 'ศาล', 'ประชาชน', 'คนไทย', 'กรุงเทพ', 'ทั่วประเทศ', 'เจ้าหน้าที่', 'ข่าว', 'ทีมชาติไทย',
        'อีจัน', 'ejan', 'ไทยรัฐ', 'thairath', 'เดลินิวส์', 'dailynews', 'ข่าวสด', 'khaosod',
        'มติชน', 'matichon', 'กรุงเทพธุรกิจ', 'bangkokbiznews', 'pptv', 'pptvhd36',
        'ไทยพีบีเอส', 'thaipbs', 'tnn', 'tnn16', 'one31', 'ch7hd', 'ch3plus', 'workpoint',
        'sanook', 'สนุก', 'kapook', 'กระปุก', 'mgronline', 'ผู้จัดการ', 'thestandard',
        'thethaiger', 'thaiger', 'monomax', 'mono29', 'amarintv', 'อมรินทร์', 'เนชั่น', 'nation'
    }

    loc_set = set([str(l).lower().strip() for l in (locations or []) if l])

    RELATION_DESCRIPTORS = {
        'เพื่อน', 'เพื่อนรัก', 'เพื่อนสนิท', 'คนรัก', 'แฟน', 'สามี', 'ภรรยา', 'แม่', 'พ่อ', 'ลูก', 'ญาติ', 'คนรู้จัก'
    }

    # Extract distinct specific discriminative entities (Proper nouns, specific opponents, unique subjects)
    specific_entities = []
    for k in (keywords or []):
        k_clean = str(k).strip()
        k_lower = k_clean.lower()
        if k_lower in GENERIC_FILLER_KEYWORDS or k_lower in GENERIC_BROAD_ENTITIES or k_lower in loc_set or k_lower in RELATION_DESCRIPTORS:
            continue
        if re.search(r'^\d+(\.\d+)?\s*(บาท|%|เปอร์เซ็นต์|ล้าน|หมื่น|พัน|แสน|ปี|วัน|เดือน|ชม|นาที|เซต)?$', k_clean):
            continue
        # If keyword contains 'ไทย' alongside another word (e.g. 'ไทย U17'), extract the non-generic part ('u17')
        if 'ไทย' in k_lower and len(k_lower) > 4:
            sub = k_lower.replace('ทีมชาติไทย', '').replace('ประเทศไทย', '').replace('ไทย', '').strip()
            if len(sub) >= 2:
                specific_entities.append(sub)
        elif len(k_clean) >= 2:
            specific_entities.append(k_lower)

    specific_entities = list(dict.fromkeys(specific_entities))

    if specific_entities:
        spec_hits = sum(1 for k in specific_entities if _match_single_kw(k, content)[0])
        spec_ratio = spec_hits / len(specific_entities)
        # If candidate reference misses specific discriminators (e.g. missed 'โครเอเชีย'):
        if len(specific_entities) >= 2 and spec_hits < 2:
            score *= 0.1
        elif spec_ratio < 0.6:
            score *= 0.15
    elif entities:
        if len(entities) >= 2 and e_hits < 2 and e_ratio < 0.5:
            score *= 0.25
        elif e_hits == 0:
            score *= 0.15

    # Check Year Mismatch
    target_year = None
    if timeline and str(timeline).isdigit():
        target_year = int(timeline)
    else:
        y_match = re.search(r'\b(25\d{2}|20\d{2})\b', query or "")
        if y_match:
            y_val = int(y_match.group(1))
            target_year = y_val if y_val > 2500 else y_val + 543

    if target_year:
        ty_th = str(target_year)
        ty_en = str(target_year - 543)
        has_correct_year = ty_th in content or ty_en in content
        
        # Check if text prominently has an OLD/DIFFERENT year (e.g. 2025 when target is 2026)
        content_years = re.findall(r'\b(25\d{2}|20\d{2})\b', content)
        if content_years and not has_correct_year:
            old_years = [y for y in content_years if (int(y) < target_year and int(y) > 2500) or (int(y) < (target_year - 543) and int(y) > 2000)]
            if old_years:
                score *= 0.3  # Severe penalty for wrong/old year

    if (not entities or e_ratio >= 0.5) and (not actions or a_hit):
        if specific_entities and spec_ratio >= 1.0 and len(specific_entities) >= 2:
            score = min(100.0, score + 25.0)
        elif m_hit or not metrics:
            score = min(100.0, score + 15.0)
        else:
            score = min(100.0, score + 5.0)

    return max(0.0, min(100.0, round(score, 1)))


def _keyword_gate_passed(keywords: list, text_content: str, title: str, pub_date: str = "ไม่ระบุ",
                         is_trusted_domain: bool = False, fallback_query: str = "",
                         is_emergency_fallback: bool = False) -> tuple:
    if not keywords:
        return True, 0

    has_core, kw_score, matched_kws, has_numeric_exact = _keyword_partial_match(keywords, text_content)
    if not has_core:
        if fallback_query and _query_overlap_specific(fallback_query, text_content):
            return True, 5
        return False, 0

    GENERIC_BROAD_ENTITIES = {
        'ไทย', 'ประเทศไทย', 'รัฐบาล', 'ตำรวจ', 'ศาล', 'ประชาชน', 'คนไทย', 'กรุงเทพ', 'ทั่วประเทศ', 'เจ้าหน้าที่', 'ข่าว', 'ทีมชาติไทย',
        'อีจัน', 'ejan', 'ไทยรัฐ', 'thairath', 'เดลินิวส์', 'dailynews', 'ข่าวสด', 'khaosod',
        'มติชน', 'matichon', 'กรุงเทพธุรกิจ', 'bangkokbiznews', 'pptv', 'pptvhd36',
        'ไทยพีบีเอส', 'thaipbs', 'tnn', 'tnn16', 'one31', 'ch7hd', 'ch3plus', 'workpoint',
        'sanook', 'สนุก', 'kapook', 'กระปุก', 'mgronline', 'ผู้จัดการ', 'thestandard',
        'thethaiger', 'thaiger', 'monomax', 'mono29', 'amarintv', 'อมรินทร์', 'เนชั่น', 'nation'
    }
    # If all matched keywords are purely generic words (e.g. only 'ไทย' or only year number)
    non_generic_matched = [k for k in matched_kws if str(k).lower() not in GENERIC_BROAD_ENTITIES and not str(k).isdigit()]
    if not non_generic_matched and not has_numeric_exact:
        return False, 0

    title_lower = title.lower()
    title_hit = any(_match_single_kw(str(k), title_lower)[0] for k in matched_kws)
    distinct_matched = len(set(str(k).lower() for k in matched_kws))

    req_distinct = min(2, len(keywords)) if keywords else 1

    if has_numeric_exact:
        return True, kw_score + 15
    if title_hit and distinct_matched >= 1:
        return True, kw_score + 10
    if is_trusted_domain and distinct_matched >= req_distinct:
        return True, kw_score
    if distinct_matched >= req_distinct:
        return True, kw_score
    if is_emergency_fallback and distinct_matched >= 1:
        return True, kw_score

    if fallback_query and _query_overlap_specific(fallback_query, text_content):
        return True, kw_score + 5
    return False, 0


def _filter_serper_results(raw_results, core_keywords, timeline, locations,
                           clean_source_url, urls_seen, blacklisted_domains_or_set, trusted_media,
                           search_query="", is_emergency_fallback=False,
                           min_relevance_pct: float = 50.0,
                           is_domain_blocked_fn=None):
    filtered = []
    trusted_media_set = set(trusted_media) if not isinstance(trusted_media, set) else trusted_media
    factcheck_domains = {'antifakenewscenter.com', 'sure.factcheckthailand.org', 'cofact.org'}

    spam_indicators = [
        'slot', 'casino', 'bet365', 'poker', 'pgslot', 'joker123',
        'ufa', 'gambling', 'porn', 'xxx', 'sexy', 'เว็บพนัน',
    ]

    def _blocked(dom):
        if is_domain_blocked_fn is not None:
            return is_domain_blocked_fn(dom)
        bl_set = blacklisted_domains_or_set if isinstance(blacklisted_domains_or_set, (set, frozenset)) else set(blacklisted_domains_or_set)
        if dom in bl_set:
            return True
        for bl in bl_set:
            if dom.endswith('.' + bl):
                return True
        for kw in spam_indicators:
            if kw in dom:
                return True
        return False

    for item in raw_results:
        title = item.get("title", "").strip() or "ข่าวที่เกี่ยวข้อง"
        link = item.get("url", "")
        snippet = item.get("text", "")[:500]
        pub_date = item.get("publishedDate", "ไม่ระบุ")

        if not link:
            continue

        parsed_url = urlparse(link.lower())
        domain = parsed_url.netloc.replace('www.', '')
        link_clean = link.lower().split('?')[0].rstrip('/')

        if re.search(r'\.(pdf|doc|docx|xls|xlsx|ppt|pptx)($|\?)', link.lower()):
            continue
        if '[pdf]' in title.lower() or 'pdf' in title.lower():
            continue
        if clean_source_url and clean_source_url == link_clean:
            continue
        if link in urls_seen:
            continue
        if _blocked(domain):
            continue

        if any(s in title.lower() for s in ['porn', 'xxx', 'sexy', 'เว็บพนัน']):
            continue

        if _ref_too_old(pub_date, _max_ref_age_days(), query=search_query, timeline=timeline, title=title, url=link, snippet=snippet):
            continue

        is_factcheck = domain in factcheck_domains
        is_gov = _is_authority_domain(domain)
        is_tier1 = domain in trusted_media_set

        if not is_gov and not is_factcheck:
            if not is_actual_article(link, title):
                continue

        text_content = (title + " " + snippet).lower()
        match_score = 0

        gate_pass, gate_score = _keyword_gate_passed(
            core_keywords, text_content, title, pub_date=pub_date,
            is_trusted_domain=(is_gov or is_factcheck or is_tier1),
            fallback_query=search_query,
            is_emergency_fallback=is_emergency_fallback,
        )
        if not gate_pass:
            continue
        match_score += gate_score
        match_score += _ref_age_penalty(pub_date, _max_ref_age_days(), title=title, url=link, snippet=snippet)

        relevance_pct = _compute_relevance_score(
            core_keywords, search_query, title, snippet, locations, timeline
        )
        actual_threshold = min_relevance_pct if not is_emergency_fallback else max(30.0, min_relevance_pct - 20)
        
        # Strict equality: Relevance threshold is mandatory for ALL domains without exception
        if relevance_pct < actual_threshold:
            continue

        match_score += int(relevance_pct)
        if is_tier1 or is_gov or is_factcheck:
            match_score += 20  # Credibility bonus for ranking order among relevant articles only

        if locations:
            if any(loc.lower() in text_content for loc in locations):
                match_score += 20

        # Target Year Matching and Old-Year Exclusion
        current_year_ce = datetime.now().year
        current_year_th = current_year_ce + 543
        target_year_ce = None
        target_year_th = None

        combined_context = f"{search_query} {timeline}".lower()
        is_live_event = any(w in combined_context for w in ['คืนนี้', 'วันนี้', 'สด', 'ดูสด', 'ถ่ายทอดสด', 'โปรแกรมแข่ง', 'ชิงอันดับ', 'ชิงชนะเลิศ', 'ผลแข่ง'])
        
        y_match = re.search(r'\b(25\d{2}|20\d{2})\b', combined_context)
        if y_match:
            y_val = int(y_match.group(1))
            target_year_ce = y_val - 543 if y_val > 2500 else y_val
            target_year_th = target_year_ce + 543
        elif is_live_event:
            target_year_ce = current_year_ce
            target_year_th = current_year_th

        if target_year_ce:
            has_timeline = str(target_year_th) in text_content or str(target_year_ce) in text_content
            years_in_text = re.findall(r'\b(25\d{2}|20\d{2})\b', text_content)
            cutoff_th = min(current_year_th, target_year_th)
            cutoff_ce = min(current_year_ce, target_year_ce)
            if years_in_text and not has_timeline:
                old_years = [y for y in years_in_text
                             if (int(y) < cutoff_th and int(y) > 2500)
                             or (int(y) < cutoff_ce and int(y) > 2000)]
                if old_years:
                    continue
            if has_timeline:
                match_score += 20

        tier = 2
        if is_factcheck:
            tier = 0
            match_score += 30
        elif is_gov:
            tier = 0
            match_score += 20
        elif is_tier1:
            tier = 1
            match_score += 10

        urls_seen.add(link)
        filtered.append({
            'title': title,
            'url': link,
            'href': link,
            'pub_date': _format_pub_date_display(pub_date, title=title, url=link, snippet=snippet),
            'snippet': snippet,
            'tier': tier,
            'match_score': match_score,
            'relevance_pct': relevance_pct,
            'source': domain,
            'search_provider': 'serper',
        })

    return filtered


def _build_channel_queries(clean_query: str, core_keywords: list, core_keywords_formal: list = None, exact_quote: str = "") -> tuple:
    formal_kws = [k for k in (core_keywords_formal or []) if k]
    exa_gov_query = " ".join(formal_kws[:3]) if formal_kws else clean_query
    exa_media_query = exact_quote if exact_quote and len(exact_quote.split()) >= 4 else clean_query
    
    kw_punchy = " ".join((core_keywords or [])[:5]).strip()
    if kw_punchy and len(kw_punchy) >= 4:
        serper_query = kw_punchy
        serper_news_query = f"{clean_query} {kw_punchy}".strip()[:200]
    else:
        serper_query = clean_query
        serper_news_query = clean_query

    return exa_gov_query, exa_media_query, serper_query, serper_news_query


def search_news_references(query: str, locations: list, core_keywords: list, timeline: str, num_results: int = 20, source_url: str = "", timeout: float = 25, core_keywords_formal: list = None, content_type: str = "NEWS_CLAIM", exact_quote: str = "") -> list:
    if not query.strip() or query == "SKIP_SEARCH": return []

    core_keywords_formal = [k for k in (core_keywords_formal or []) if k]
    core_keywords = [k for k in (core_keywords or []) if k]
    all_keywords = list(dict.fromkeys(core_keywords + core_keywords_formal))
    
    exa_api_key = os.getenv("EXA_API_KEY", "").strip()
    if not exa_api_key:
        try:
            import streamlit as st
            exa_api_key = st.secrets.get("EXA_API_KEY", "").strip()
        except Exception: pass

    serper_api_key = os.getenv("SERPER_API_KEY", "").strip()
    if not serper_api_key:
        try:
            import streamlit as st
            if "SERPER_API_KEY" in st.secrets:
                serper_api_key = st.secrets["SERPER_API_KEY"].strip()
        except Exception: pass

    if not exa_api_key and not serper_api_key:
        logger.error("No search API key found (EXA / SERPER)")
        return []

    clean_query = query.replace('"', '').replace("'", "")
    clean_source_url = source_url.split('?')[0].rstrip('/').lower() if source_url else ""

    factcheck_domains = [
        'antifakenewscenter.com', 'sure.factcheckthailand.org', 'cofact.org',
    ]

    tier1_media = [
        'thaipbs.or.th', 'mcot.net', 'tna.mcot.net', 'nbtworld.prd.go.th',
        'pptvhd36.com', 'ch7.com', 'news.ch7.com', 'ch3plus.com', '3plusnews.com',
        'one31.net', 'amarintv.com', 'nationtv.tv', 'tnnthailand.com', 'springnews.co.th',
        'workpointtoday.com', 'thaich8.com', 'trueid.net',
        'thairath.co.th', 'khaosod.co.th', 'matichon.co.th', 'dailynews.co.th',
        'thaipost.net', 'komchadluek.net', 'naewna.com', 'siamrath.co.th',
        'bangkokpost.com', 'nationthailand.com', 'khaosodenglish.com',
        'bangkokbiznews.com', 'prachachat.net', 'thansettakij.com', 'posttoday.com',
        'mgronline.com', 'moneyandbanking.co.th', 'efinancethai.com',
        'prachatai.com', 'isranews.org', 'thestandard.co', 'thematter.co', 'the101.world',
        'thaipublica.org', 'voicetv.co.th',
        'sanook.com', 'kapook.com', 'today.line.me', 'livenews365.com',
        'thethaiger.com', 'aseannow.com',
        'chiangmainews.co.th', 'phuketnews.com', 'siamnews.com',
        'bbc.com', 'bbc.co.uk', 'reuters.com', 'apnews.com', 'bloomberg.com',
        'channelnewsasia.com', 'cna.asia', 'asia.nikkei.com', 'nikkei.com',
        'scmp.com', 'aljazeera.com', 'voanews.com', 'voathai.com',
        'dw.com', 'rfi.fr', 'afp.com', 'straitstimes.com',
        'theguardian.com', 'washingtonpost.com', 'nytimes.com',
        'un.org', 'who.int', 'worldbank.org', 'imf.org', 'unesco.org',
        'tdri.or.th', 'nesdc.go.th', 'nso.go.th',
    ]
    tier1_media_set = set(tier1_media)
    factcheck_set = set(factcheck_domains)

    whitelist_exceptions = {
        'today.line.me', 'liff.line.me', 'news.line.me',
    }

    blacklisted_exact = {
        'youtube.com', 'youtu.be', 'tiktok.com',
        'facebook.com', 'fb.com', 'instagram.com',
        'x.com', 'twitter.com',
        'vimeo.com', 'dailymotion.com',
        'line.me', 'blockdit.com', 'pantip.com',
        'wikipedia.org', 'wiktionary.org', 'longdo.com', 'thai-language.com',
        'pinterest.com', 'reddit.com', 'quora.com',
        'npnt.prd.go.th', 'app.mhs-pao.go.th', 'portal.disaster.go.th',
        'office.phatthalung2.go.th', 'fossil.dmr.go.th',
    }
    spam_keywords_in_domain = [
        'slot', 'casino', 'bet365', 'poker', 'pgslot', 'joker123',
        'ufa', 'bangkokviews', 'gambling',
    ]

    def _is_domain_blocked(dom: str) -> bool:
        if dom in whitelist_exceptions:
            return False
        if dom in blacklisted_exact:
            return True
        for bl in blacklisted_exact:
            if dom.endswith('.' + bl):
                return True
        for kw in spam_keywords_in_domain:
            if kw in dom:
                return True
        return False

    exa_gov_query, exa_media_query, serper_query, serper_news_query = _build_channel_queries(
        clean_query, core_keywords, core_keywords_formal=core_keywords_formal, exact_quote=exact_quote
    )
    
    exa_search_query = exa_gov_query
    
    payload_gov = {
        "query": exa_search_query,
        "type": "auto",
        "useAutoprompt": False,
        "numResults": 25,
        "includeDomains": [
            "antifakenewscenter.com", "sure.factcheckthailand.org", "cofact.org",
            "thaigov.go.th", "spm.thaigov.go.th", "opm.go.th",
            "prd.go.th", "nbtworld.prd.go.th", "thainews.prd.go.th",
            "mfa.go.th", "mof.go.th", "most.go.th", "moc.go.th", "mol.go.th",
            "moi.go.th", "moj.go.th", "moe.go.th", "moph.go.th", "moit.go.th",
            "mot.go.th", "mua.go.th", "mscr.go.th", "moac.go.th", "dmcr.go.th",
            "mnre.go.th", "mi.go.th", "mde.go.th", "m-society.go.th",
            "royalthaipolice.go.th", "police.go.th", "rtarf.mi.th", "army.mi.th",
            "navy.mi.th", "rtaf.mi.th", "isoc.go.th", "parliament.go.th", "senate.go.th",
            "court.go.th", "admincourt.go.th", "constitutionalcourt.or.th", "ect.go.th",
            "ombudsman.go.th", "nacc.go.th", "pacc.go.th", "oag.go.th", "nhrc.or.th",
            "nbtc.go.th", "bot.or.th", "sec.or.th", "fpo.go.th", "set.or.th", "dbd.go.th",
            "dmsc.moph.go.th", "ddc.moph.go.th", "fda.moph.go.th", "siriraj.mahidol.ac.th",
            "si.mahidol.ac.th", "ramathibodi.mahidol.ac.th", "chulalongkornhospital.go.th",
            "dsi.go.th", "narcotics.go.th", "sac.go.th", "rd.go.th", "customs.go.th",
            "sat.or.th", "egat.co.th", "pea.co.th", "mea.or.th", "pwa.co.th",
            "ptt.com", "pttplc.com", "tot.co.th", "nesdc.go.th", "nso.go.th", "tdri.or.th",
            "chula.ac.th", "mahidol.ac.th", "tu.ac.th", "cmu.ac.th", "ku.ac.th",
            "psu.ac.th", "kku.ac.th", "sut.ac.th",
        ],
        "contents": { "text": { "maxCharacters": 1500 } }
    }

    payload_media = {
        "query": exa_media_query,
        "type": "auto",
        "useAutoprompt": False,
        "numResults": 20,
        "excludeDomains": [
            'youtube.com', 'youtu.be', 'tiktok.com', 'facebook.com', 'instagram.com',
            'x.com', 'twitter.com', 'vimeo.com', 'dailymotion.com', 'liff.line.me',
            'blockdit.com', 'pantip.com', 'wikipedia.org', 'wiktionary.org',
            'pinterest.com', 'reddit.com', 'quora.com',
        ],
        "contents": { "text": { "maxCharacters": 1500 } }
    }

    exa_raw = []
    serper_raw = []
    serper_news_raw = []
    exa_broad_raw_fallback = []
    serper_raw_fallback = []

    is_personal = (content_type or "").upper() == "PERSONAL_STORY"
    media_num = 30 if is_personal else 25
    serper_num = 20 if is_personal else 15
    serper_news_num = 15
    broad_num = 25

    try:
        min_refs = max(1, int(os.getenv("MIN_REFERENCES_REQUIRED", "3")))
    except ValueError:
        min_refs = 3
    try:
        default_min_relevance = max(20.0, float(os.getenv("DEFAULT_MIN_RELEVANCE_PCT", "55.0")))
    except ValueError:
        default_min_relevance = 55.0

    max_age = _max_ref_age_days()

    sq_clean = (serper_query or "").strip()[:200].replace('"', '')
    if not sq_clean:
        sq_clean = (query or "").strip()[:200].replace('"', '')
    serper_query_clean = sq_clean
    
    snq_clean = (serper_news_query or "").strip()[:200].replace('"', '')
    serper_news_query_clean = snq_clean if snq_clean else serper_query_clean

    payload_broad = {
        "query": exa_media_query,
        "type": "auto",
        "useAutoprompt": False,
        "numResults": broad_num,
        "contents": { "text": { "maxCharacters": 1500 } },
        "excludeDomains": [
            'youtube.com', 'youtu.be', 'tiktok.com', 'facebook.com', 'instagram.com',
            'x.com', 'twitter.com', 'vimeo.com', 'dailymotion.com', 'line.me',
            'blockdit.com', 'pantip.com', 'wikipedia.org', 'wiktionary.org',
            'pinterest.com', 'reddit.com', 'quora.com',
        ],
    }

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = {}
        if exa_api_key:
            if not is_personal:
                futures['exa_gov'] = executor.submit(fetch_exa_api, payload_gov, exa_api_key, timeout)
            payload_media["numResults"] = media_num
            futures['exa_media'] = executor.submit(fetch_exa_api, payload_media, exa_api_key, timeout)
        if serper_api_key and serper_query_clean:
            futures['serper'] = executor.submit(fetch_serper_api, serper_query_clean, serper_api_key, serper_num, timeout)
            futures['serper_news'] = executor.submit(fetch_serper_news_api, serper_news_query_clean, serper_api_key, serper_news_num, timeout)

        if 'exa_gov' in futures: exa_raw.extend(futures['exa_gov'].result())
        if 'exa_media' in futures: exa_raw.extend(futures['exa_media'].result())
        if 'serper' in futures: serper_raw = futures['serper'].result()
        if 'serper_news' in futures: serper_news_raw = futures['serper_news'].result()

    urls_seen = set()
    processed_results = []

    for item in exa_raw:
        title = item.get("title", "").strip() if item.get("title") else "ข่าวที่เกี่ยวข้อง"
        link = item.get("url", "")
        content = item.get("text", "")[:1500]
        pub_date = item.get("publishedDate", "ไม่ระบุ")

        parsed_url = urlparse(link.lower())
        domain = parsed_url.netloc.replace('www.', '')
        link_clean = link.lower().split('?')[0].rstrip('/')

        if re.search(r'\.(pdf|doc|docx|xls|xlsx|ppt|pptx)($|\?)', link.lower()): continue
        if '[pdf]' in title.lower() or 'pdf' in title.lower(): continue
        if clean_source_url and (clean_source_url == link_clean): continue
        if link in urls_seen or _is_domain_blocked(domain): continue

        if _ref_too_old(pub_date, max_age, query=clean_query, timeline=timeline, title=title, url=link, snippet=content):
            continue

        text_content = (title + " " + content).lower()
        match_score = 0

        is_factcheck = domain in factcheck_set
        is_gov = _is_authority_domain(domain)
        is_tier1 = domain in tier1_media_set
        is_gov_or_factcheck = is_factcheck or is_gov

        gate_pass, gate_score = _keyword_gate_passed(
            all_keywords, text_content, title,
            is_trusted_domain=(is_gov_or_factcheck or is_tier1),
            fallback_query=clean_query,
            is_emergency_fallback=False,
        )
        if not gate_pass:
            continue
        match_score += gate_score
        match_score += _ref_age_penalty(pub_date, max_age, title=title, url=link, snippet=content)

        relevance_pct = _compute_relevance_score(
            all_keywords, clean_query, title, content, locations, timeline
        )
        if relevance_pct < default_min_relevance:
            continue
        match_score += int(relevance_pct)

        if is_gov_or_factcheck or is_tier1:
            match_score += 20  # Credibility bonus for ranking order among relevant articles only

        if locations:
            if any(loc.lower() in text_content for loc in locations):
                match_score += 20

        # Target Year Matching and Old-Year Exclusion
        current_year_ce = datetime.now().year
        current_year_th = current_year_ce + 543
        target_year_ce = None
        target_year_th = None

        combined_context = f"{clean_query} {timeline}".lower()
        is_live_event = any(w in combined_context for w in ['คืนนี้', 'วันนี้', 'สด', 'ดูสด', 'ถ่ายทอดสด', 'โปรแกรมแข่ง', 'ชิงอันดับ', 'ชิงชนะเลิศ', 'ผลแข่ง'])
        
        y_match = re.search(r'\b(25\d{2}|20\d{2})\b', combined_context)
        if y_match:
            y_val = int(y_match.group(1))
            target_year_ce = y_val - 543 if y_val > 2500 else y_val
            target_year_th = target_year_ce + 543
        elif is_live_event:
            target_year_ce = current_year_ce
            target_year_th = current_year_th

        if target_year_ce:
            has_timeline = str(target_year_th) in text_content or str(target_year_ce) in text_content
            years_in_text = re.findall(r'\b(25\d{2}|20\d{2})\b', text_content)
            cutoff_th = min(current_year_th, target_year_th)
            cutoff_ce = min(current_year_ce, target_year_ce)
            if years_in_text and not has_timeline:
                old_years = [y for y in years_in_text
                             if (int(y) < cutoff_th and int(y) > 2500)
                             or (int(y) < cutoff_ce and int(y) > 2000)]
                if old_years:
                    continue
            if has_timeline:
                match_score += 20

        if not is_gov_or_factcheck:
            if not is_actual_article(link, title):
                continue

        tier = 2
        if is_factcheck:
            tier = 0
            match_score += 30
        elif is_gov:
            tier = 0
            match_score += 20
        elif is_tier1:
            tier = 1
            match_score += 10

        urls_seen.add(link)
        processed_results.append({
            'title': title,
            'href': link,
            'pub_date': _format_pub_date_display(pub_date, title=title, url=link, snippet=content),
            'snippet': content,
            'tier': tier,
            'match_score': match_score,
            'relevance_pct': relevance_pct,
            'source': domain,
            'search_provider': 'exa',
        })

    if serper_raw:
        serper_filtered = _filter_serper_results(
            serper_raw, all_keywords, timeline, locations,
            clean_source_url, urls_seen, blacklisted_exact, tier1_media,
            search_query=clean_query,
            is_emergency_fallback=False,
            min_relevance_pct=default_min_relevance,
            is_domain_blocked_fn=_is_domain_blocked,
        )
        processed_results.extend(serper_filtered)

    if serper_news_raw:
        serper_news_filtered = _filter_serper_results(
            serper_news_raw, all_keywords, timeline, locations,
            clean_source_url, urls_seen, blacklisted_exact, tier1_media,
            search_query=clean_query,
            is_emergency_fallback=False,
            min_relevance_pct=default_min_relevance,
            is_domain_blocked_fn=_is_domain_blocked,
        )
        processed_results.extend(serper_news_filtered)

    high_quality_r1 = [r for r in processed_results if r.get('relevance_pct', 0) >= 55.0]
    if len(high_quality_r1) < min_refs:
        logger.info(f"[Search] High-quality refs after round 1 = {len(high_quality_r1)} < {min_refs} → Trigger Targeted Expansion")

        entities, actions, metrics = _extract_tri_anchors(core_keywords, clean_query)
        permutation_queries = []
        if entities and actions:
            permutation_queries.append(" ".join(entities[:2] + actions[:2]))
        if entities and metrics:
            permutation_queries.append(" ".join(entities[:2] + metrics[:2]))
        if actions and metrics:
            permutation_queries.append(" ".join(actions[:2] + metrics[:2]))

        kw_only_query = (permutation_queries[0] if permutation_queries else " ".join(core_keywords[:4])).strip() or clean_query
        kw_only_query = kw_only_query[:200].replace('"', '')
        broad_search_query = (permutation_queries[1] if len(permutation_queries) > 1 else " ".join(core_keywords[:3] + [clean_query])).strip()

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            fb_futures = {}
            if exa_api_key:
                payload_broad["query"] = broad_search_query
                fb_futures['exa_broad'] = executor.submit(fetch_exa_api, payload_broad, exa_api_key, timeout)
            if serper_api_key and kw_only_query:
                fb_futures['serper_fb'] = executor.submit(
                    fetch_serper_api, kw_only_query, serper_api_key, serper_num, timeout
                )
            if 'exa_broad' in fb_futures:
                exa_broad_raw_fallback = fb_futures['exa_broad'].result()
            if 'serper_fb' in fb_futures:
                serper_raw_fallback = fb_futures['serper_fb'].result()

        for item in exa_broad_raw_fallback:
            title = item.get("title", "").strip() if item.get("title") else "ข่าวที่เกี่ยวข้อง"
            link = item.get("url", "")
            content = item.get("text", "")[:1500]
            pub_date = item.get("publishedDate", "ไม่ระบุ")

            parsed_url = urlparse(link.lower())
            domain = parsed_url.netloc.replace('www.', '')
            link_clean = link.lower().split('?')[0].rstrip('/')

            if re.search(r'\.(pdf|doc|docx|xls|xlsx|ppt|pptx)($|\?)', link.lower()): continue
            if '[pdf]' in title.lower() or 'pdf' in title.lower(): continue
            if clean_source_url and (clean_source_url == link_clean): continue
            if link in urls_seen or _is_domain_blocked(domain): continue
            if _ref_too_old(pub_date, max_age, query=clean_query, timeline=timeline, title=title, url=link, snippet=content): continue

            text_content = (title + " " + content).lower()
            match_score = 0
            is_factcheck = domain in {'antifakenewscenter.com', 'sure.factcheckthailand.org', 'cofact.org'}
            is_gov = domain.endswith('.go.th') or domain.endswith('.gov')
            is_tier1 = domain in tier1_media_set
            is_gov_or_factcheck = is_factcheck or is_gov

            gate_pass, gate_score = _keyword_gate_passed(
                all_keywords, text_content, title,
                is_trusted_domain=(is_gov_or_factcheck or is_tier1),
                fallback_query=clean_query,
                is_emergency_fallback=True,
            )
            if not gate_pass: continue
            match_score += gate_score
            match_score += _ref_age_penalty(pub_date, max_age, title=title, url=link, snippet=content)

            relevance_pct = _compute_relevance_score(
                all_keywords, clean_query, title, content, locations, timeline
            )
            fb_threshold = max(30.0, default_min_relevance - 15)
            if is_gov_or_factcheck:
                fb_threshold = max(20.0, fb_threshold - 5)
            if relevance_pct < fb_threshold:
                continue
            match_score += int(relevance_pct) - 5

            if locations:
                if any(loc.lower() in text_content for loc in locations):
                    match_score += 20

            # Target Year Matching and Old-Year Exclusion
            current_year_ce = datetime.now().year
            current_year_th = current_year_ce + 543
            target_year_ce = None
            target_year_th = None

            combined_context = f"{clean_query} {timeline}".lower()
            is_live_event = any(w in combined_context for w in ['คืนนี้', 'วันนี้', 'สด', 'ดูสด', 'ถ่ายทอดสด', 'โปรแกรมแข่ง', 'ชิงอันดับ', 'ชิงชนะเลิศ', 'ผลแข่ง'])
            
            y_match = re.search(r'\b(25\d{2}|20\d{2})\b', combined_context)
            if y_match:
                y_val = int(y_match.group(1))
                target_year_ce = y_val - 543 if y_val > 2500 else y_val
                target_year_th = target_year_ce + 543
            elif is_live_event:
                target_year_ce = current_year_ce
                target_year_th = current_year_th

            if target_year_ce:
                has_timeline = str(target_year_th) in text_content or str(target_year_ce) in text_content
                years_in_text = re.findall(r'\b(25\d{2}|20\d{2})\b', text_content)
                cutoff_th = min(current_year_th, target_year_th)
                cutoff_ce = min(current_year_ce, target_year_ce)
                if years_in_text and not has_timeline:
                    old_years = [y for y in years_in_text
                                 if (int(y) < cutoff_th and int(y) > 2500)
                                 or (int(y) < cutoff_ce and int(y) > 2000)]
                    if old_years:
                        continue
                if has_timeline:
                    match_score += 20

            if not is_gov_or_factcheck:
                if not is_actual_article(link, title): continue

            tier = 2
            if is_factcheck:
                tier = 0
                match_score += 30
            elif is_gov:
                tier = 0
                match_score += 20
            elif is_tier1:
                tier = 1
                match_score += 10

            urls_seen.add(link)
            processed_results.append({
                'title': title,
                'href': link,
                'pub_date': _format_pub_date_display(pub_date, title=title, url=link, snippet=content),
                'snippet': content,
                'tier': tier,
                'match_score': match_score,
                'relevance_pct': relevance_pct,
                'source': domain,
                'search_provider': 'exa',
            })

        if serper_raw_fallback:
            serper_fb_filtered = _filter_serper_results(
                serper_raw_fallback, all_keywords, timeline, locations,
                clean_source_url, urls_seen, blacklisted_exact, tier1_media,
                search_query=kw_only_query,
                is_emergency_fallback=True,
                min_relevance_pct=default_min_relevance,
                is_domain_blocked_fn=_is_domain_blocked,
            )
            processed_results.extend(serper_fb_filtered)

    processed_results.sort(key=lambda x: (-(x.get('relevance_pct', 0) * 0.7 + x.get('match_score', 0)), x.get('tier', 2)))
    
    high_quality = [r for r in processed_results if r.get('relevance_pct', 0) >= 35.0]
    final_sorted = high_quality
    
    final_cleaned = []
    for r in final_sorted:
        raw_u = str(r.get('url') or r.get('href') or '')
        raw_t = str(r.get('title') or '')
        if not is_actual_article(raw_u, raw_t):
            continue
        r['url'] = raw_u
        r['href'] = raw_u
        dom = urlparse(raw_u.lower()).netloc.replace('www.', '')
        is_t1 = (dom in tier1_media_set) or any(dom.endswith('.' + t) for t in tier1_media_set)
        r['tier_label'] = "Tier 0 (ทางการ/สถานทูต)" if _is_authority_domain(dom) else ("Tier 1 (สื่อหลัก)" if is_t1 else "Tier 2 (สื่อทั่วไป)")
        r.pop('tier', None)
        final_cleaned.append(r)

    # =========================================================================
    # FINAL ZERO-TOLERANCE INTEGRITY GATE:
    # Drops ANY reference from a past calendar year (2025, 2024, 2023) when
    # the target claim is current, live, or specifies a specific year.
    # =========================================================================
    final_sanitized = []
    combined_query_context = f"{clean_query} {timeline}".lower()
    is_live_or_current = any(w in combined_query_context for w in ['คืนนี้', 'วันนี้', 'สด', 'ดูสด', 'ถ่ายทอดสด', 'โปรแกรมแข่ง', 'ชิงอันดับ', 'ชิงชนะเลิศ', 'ผลแข่ง', 'ล่าสุด', 'ด่วน'])

    final_target_year_ce = None
    final_target_year_th = None
    y_match = re.search(r'\b(25\d{2}|20\d{2})\b', combined_query_context)
    if y_match:
        y_val = int(y_match.group(1))
        final_target_year_ce = y_val - 543 if y_val > 2500 else y_val
        final_target_year_th = final_target_year_ce + 543
    elif is_live_or_current:
        final_target_year_ce = datetime.now().year
        final_target_year_th = final_target_year_ce + 543

    SPORTS_CONFLICTS = [
        ({'วอลเลย์บอล', 'volleyball', 'ลูกยาง'}, {'ฟุตบอล', 'football', 'บอลสด', 'บอลไทย', 'ฟุตซอล', 'บาสเกตบอล', 'แบดมินตัน', 'มวย', 'เทนนิส'}),
        ({'ฟุตบอล', 'football', 'บอลสด', 'บอลไทย'}, {'วอลเลย์บอล', 'ลูกยาง', 'ฟุตซอล', 'บาสเกตบอล', 'แบดมินตัน', 'มวย'}),
        ({'แบดมินตัน', 'badminton'}, {'ฟุตบอล', 'วอลเลย์บอล', 'เทนนิส', 'บาสเกตบอล'}),
        ({'บาสเกตบอล', 'basketball'}, {'ฟุตบอล', 'วอลเลย์บอล', 'แบดมินตัน'}),
    ]
    COUNTRIES = ['โครเอเชีย', 'เมียนมา', 'พม่า', 'เวียดนาม', 'กัมพูชา', 'อินโดนีเซีย', 'ฟิลิปปินส์', 'มาเลเซีย', 'สิงคโปร์', 'ลาว', 'จีน', 'ญี่ปุ่น', 'เกาหลีใต้', 'ไต้หวัน', 'สหรัฐ', 'อิตาลี', 'บราซิล', 'โปแลนด์', 'ตุรกี']
    target_opponents = [c for c in COUNTRIES if c in combined_query_context and c != 'ไทย']

    for r in final_cleaned:
        p_date = r.get('pub_date', '')
        t_title = r.get('title', '')
        u_url = r.get('href', r.get('url', ''))
        s_snip = r.get('snippet', '')
        
        yr_ce, d_old = _parse_pub_date(p_date, title=t_title, url=u_url, snippet=s_snip)
        
        # 1. Past year check
        if final_target_year_ce and yr_ce:
            if final_target_year_ce <= datetime.now().year and yr_ce < final_target_year_ce:
                continue
            elif final_target_year_ce > datetime.now().year and yr_ce < datetime.now().year:
                continue
                
        # 2. Live event age check (cannot be > 60 days)
        if is_live_or_current and d_old is not None and d_old > 60:
            continue
            
        # 4. Cross-Topic & Sport Conflict Check
        article_full_text = f"{t_title} {s_snip}".lower()
        has_sport_mismatch = False
        for target_sport, conflict_sport in SPORTS_CONFLICTS:
            if any(t in combined_query_context for t in target_sport):
                if any(c in article_full_text for c in conflict_sport) and not any(t in article_full_text for t in target_sport):
                    has_sport_mismatch = True
                    break
        if has_sport_mismatch:
            continue

        # 5. Opponent Matchup Mismatch Check
        if len(target_opponents) == 1:
            opp = target_opponents[0]
            other_opps = [c for c in COUNTRIES if c != opp and c != 'ไทย' and c in t_title.lower()]
            if other_opps and opp not in article_full_text:
                continue

        final_sanitized.append(r)

    return final_sanitized[:num_results]


def build_fast_search_query(value: str, max_chars: int = 140) -> str:
    text = re.sub(r"https?://\S+", " ", str(value or ""))
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"^\[.*?\][:：]?\s*", "", text)
    text = re.sub(
        r"^(โพสต์จาก|แคปชั่น|ล่าสุด|ตามที่มีการแชร์|ข่าวลวง|เตือนภัย|พรีวิวจากโซเชียล)[:：]?\s*"
        r"(?:Instagram|Facebook|FB|X|Twitter|TikTok|YouTube)?[:：]?\s*",
        "",
        text,
        flags=re.IGNORECASE
    )
    text = re.sub(r"^(?:Instagram|Facebook|FB|X|Twitter|TikTok|YouTube)[:：]?\s*", "", text, flags=re.IGNORECASE)
    return text[:max_chars].strip()


def merge_search_reports(wave0_refs: list, planned_refs: list, core_keywords: list, limit: int = 20, search_query: str = "") -> list:
    seen = set()
    merged = []
    for ref in planned_refs:
        href = str(ref.get("href", "") or "").lower()
        if href and href in seen:
            continue
        if href:
            seen.add(href)
        merged.append(ref)
    for ref in wave0_refs:
        href = str(ref.get("href", "") or "").lower()
        if href and href in seen:
            continue
        if core_keywords:
            text = (str(ref.get("title") or "") + " " + str(ref.get("snippet") or "")).lower()
            gate_pass, _score = _keyword_gate_passed(
                core_keywords, text, str(ref.get("title") or ""),
                is_trusted_domain=False,
                fallback_query=search_query,
                is_emergency_fallback=True,
            )
            if not gate_pass:
                continue
        if href:
            seen.add(href)
        merged.append(ref)
    return merged[:limit]