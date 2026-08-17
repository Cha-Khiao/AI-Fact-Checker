import json
import os
import re
import logging
import concurrent.futures
from datetime import datetime, timedelta
from urllib.parse import urlparse
from dotenv import load_dotenv

import http_client

logger = logging.getLogger(__name__)

load_dotenv()


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


def _parse_pub_date(pub_date) -> tuple:
    """Parse publishedDate → (year_ce, days_old). คืน (None, None) ถ้า parse ไม่ได้."""
    if not pub_date or str(pub_date).strip() in ("", "ไม่ระบุ"):
        return None, None
    text = str(pub_date).strip()
    m = re.match(r'(\d{4})-(\d{2})-(\d{2})', text)
    if m:
        try:
            dt = datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)))
            return dt.year, (datetime.now() - dt).days
        except ValueError:
            return None, None
    # ฟอร์แมตไทย: "14 ส.ค. 2569" / "14 สิงหาคม 2569"
    m = re.search(r'(\d{1,2})\s+([^\s]+)\s+(\d{4})', text)
    if m:
        th_months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
                     'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
        month_str = m.group(2).strip()
        if month_str in th_months:
            idx = th_months.index(month_str) % 12
            year_raw = int(m.group(3))
            year_ce = year_raw - 543 if year_raw > 2500 else year_raw
            try:
                dt = datetime(year_ce, idx + 1, int(m.group(1)))
                return dt.year, (datetime.now() - dt).days
            except ValueError:
                return None, None
    return None, None


def _ref_too_old(pub_date, max_days: int) -> bool:
    """Age of News (Recency): ใช้ Day-based calculation (default 365 วัน หรือ ข้ามปีเกินไป)."""
    year_ce, days_old = _parse_pub_date(pub_date)
    if days_old is None:
        return False
    # ถ้าเป็นข่าวในปีปัจจุบัน (CE Year) ไม่เตะทิ้งเด็ดขาด เพื่อรองรับข่าวขุด/ข่าวติดตาม
    current_year = datetime.now().year
    if year_ce and year_ce >= current_year:
        return False
    return days_old > max_days


def _ref_age_penalty(pub_date, max_days: int) -> int:
    """ให้คะแนนโบนัสแก่ข่าวสดใหม่ และลดคะแนนเล็กน้อยสำหรับข่าวเก่าข้ามปี (ไม่เตะทิ้ง)."""
    _year_ce, days_old = _parse_pub_date(pub_date)
    if days_old is None:
        return 0
    if days_old <= 14:
        return 10  # ข่าวสดใหม่มาก (2 สัปดาห์)
    elif days_old <= 90:
        return 5   # ข่าว 1-3 เดือน
    elif days_old > 365:
        return -10 # ข่าวเก่าเกิน 1 ปี
    return 0

def fetch_exa_api(payload, api_key, timeout=25):
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
        response.raise_for_status()
        data = response.json()
        return data.get("results", [])
    except Exception as e:
        logger.error("Exa API Error: %s", e)
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
    
    - ตัดทิ้ง: หน้าหมวดหมู่ (e.g. /news/politic, /category/foreign, /tag/...), หน้าแรก, หน้าค้นหา
    - ยอมรับ: ข่าวสรุปประเด็น/สรุปเหตุการณ์ประจำปี (e.g. สรุป 10 ข่าวใหญ่รอบปี 2025, รวมเหตุการณ์สำคัญปี 2025)
    """
    parsed = urlparse(url.lower())
    path = parsed.path.rstrip('/')
    path_parts = [p for p in path.split('/') if p]
    title_lower = title.lower().strip()

    # 1. Non-article file formats
    if re.search(r'\.(pdf|doc|docx|xls|xlsx|ppt|pptx)($|\?)', url.lower()):
        return False
    if '[pdf]' in title_lower or 'pdf' in title_lower:
        return False

    # 2. Empty or root homepage paths
    if not path_parts:
        return False
    if path in ['/', '/th', '/en', '/th/', '/en/', '/index.html', '/index.php', '/default.aspx', '/home']:
        return False

    # 3. Explicit Category/Tag/Archive indicators in path
    aggregator_keywords = [
        'category', 'categories', 'topic', 'topics', 'tag', 'tags',
        'author', 'page', 'search', 'archive', 'archives', 'gallery',
        'calendar', 'sitemap', 'section', 'sections', 'feed', 'rss'
    ]
    if any(k in path_parts for k in aggregator_keywords):
        last_part = path_parts[-1]
        if last_part in aggregator_keywords or (len(path_parts) >= 2 and path_parts[-2] in aggregator_keywords and not re.search(r'\d{4,}', last_part) and len(last_part) < 15):
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
        if len(single_path) < 10 and not re.search(r'\.(html|htm|php|aspx)', single_path):
            return False

    if len(path_parts) == 2:
        # e.g. /news/politic, /news/society, /lifestyle/travel
        p0, p1 = path_parts[0], path_parts[1]
        if (p0 in ['news', 'lifestyle', 'section', 'category', 'topic', 'th', 'en'] or p0 in section_names) and (p1 in section_names or p1 in ['all', 'latest', 'index']):
            return False

    # 5. Generic Title Filter (หน้าแรก, รวมข่าวล่าสุด) vs Recap Articles (สรุปข่าวปี 2025)
    exact_generic_titles = [
        'หน้าแรก', 'หน้าหลัก', 'ข่าววันนี้', 'ข่าวล่าสุด', 'ข่าวด่วน', 'รวมข่าว',
        'ข่าวทั้งหมด', 'home', 'official website', 'เว็บไซต์ทางการ', 'สารบัญ'
    ]
    if title_lower in exact_generic_titles:
        return False

    # Titles that start with generic labels and have no specific subject/year
    if any(title_lower.startswith(g) for g in exact_generic_titles) and len(title_lower) < 20 and not re.search(r'\b(25\d{2}|20\d{2})\b', title_lower):
        return False

    # 6. Academic Thesis / Dissertation / Institutional Repository Filter (ตัดวิทยานิพนธ์/คลังวิจัยมหาวิทยาลัยที่ไม่ใช่ข่าว)
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


# คำสามัญที่ขึ้นหัวข่าวหลากเรื่องมากเกินไป — ห้ามใช้เป็น fallback overlap
_GENERIC_QUERY_WORDS = {
    'เพื่อนรัก', 'เพื่อน', 'แฟน', 'เมีย', 'ผัว', 'สามี', 'ภรรยา', 'หนุ่ม',
    'สาว', 'รัก', 'เงิน', 'ลูก', 'ครอบครัว', 'คนรัก', 'แฟนเก่า', 'แม่',
    'พ่อ', 'น้อง', 'พี่', 'ลุง', 'ป้า', 'ตา', 'ยาย', 'ให้', 'ข่าว', 'ด่วน',
    'ล่าสุด', 'เปิดใจ', 'เผย', 'เจอ', 'พบ', 'ช็อก', 'สุด', 'มาก',
}


def _query_overlap_specific(fallback_query: str, text: str, min_chars: int = 6) -> bool:
    """fallback overlap ที่กรองคำสามัญออก — กันขยะผ่านด้วยคำอย่าง "เพื่อนรัก"."""
    if not fallback_query:
        return False
    specific = " ".join(w for w in fallback_query.split() if w not in _GENERIC_QUERY_WORDS)
    return _text_has_query_overlap(specific, text, min_chars)


def _match_single_kw(kw_str: str, text_lower: str) -> tuple:
    """Helper to check if a keyword matches text strictly.
    
    Returns (is_match, is_numeric_exact)
    """
    if not kw_str:
        return False, False
    kw_clean = kw_str.strip().lower()
    
    # 1. Numeric keyword (เช่น "350 บาท", "10,000 บาท", "5 แสน")
    nums = re.findall(r'\d+', kw_clean.replace(',', ''))
    if nums:
        # Normalize commas in text so "10,000" matches "10000"
        text_no_commas = re.sub(r'(?<=\d),(?=\d)', '', text_lower)
        if not all(num in text_no_commas for num in nums):
            return False, False
        # ถ้ามีคำไทยประกอบ (เช่น "บาท", "ล้าน", "เฟส") ต้องมีในข้อความด้วย
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
    """Check if any keyword strictly matches text.

    Returns (has_match, match_score, matched_keywords, has_numeric_exact)
    """
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

def _extract_tri_anchors(keywords: list, query: str = "") -> tuple:
    """Classify keywords into Tri-Anchor dimensions: (Entities, Actions, Metrics)."""
    entities = []
    actions = []
    metrics = []

    combined = list(dict.fromkeys([str(k).strip().lower() for k in (keywords or []) if str(k).strip()]))
    for kw in combined:
        # 1. Metric / Number / Unit
        if re.search(r'\d', kw) or re.search(r'(?:บาท|%|เปอร์เซ็นต์|ริกเตอร์|แมกนิจูด)', kw):
            metrics.append(kw)
            continue
        # 2. Action / Predicate / Event
        if any(act in kw for act in ACTION_KEYWORDS):
            actions.append(kw)
            continue
        # 3. Entity (Person, Org, Location, Object)
        entities.append(kw)

    return entities, actions, metrics


def _compute_relevance_score(keywords: list, query: str, title: str, snippet: str,
                             locations: list = None, timeline: str = None) -> float:
    """คำนวณค่าความสัมพันธ์แบบ Universal Tri-Anchor Precision (0-100%).

    - 3 มิติ: Entity (ใคร/หน่วยงาน/ที่ไหน) + Action (เกิดอะไร/ทำอะไร) + Metric (ตัวเลข/ขนาด)
    - ป้องกันการหลุดรอดของข่าวที่ติดเฉพาะชื่อคน หรือติดเฉพาะตัวเลข แต่คนละคดี/คนละเรื่อง
    """
    if not keywords and not query:
        return 50.0

    content = f"{title} {snippet}".lower()
    title_lower = title.lower()
    entities, actions, metrics = _extract_tri_anchors(keywords, query)
    all_kws = list(dict.fromkeys(entities + actions + metrics))
    if not all_kws:
        all_kws = [query.lower()] if query else []

    # 1. Coverage Scores
    title_hits = sum(1 for kw in all_kws if _match_single_kw(kw, title_lower)[0])
    title_score = 35.0 * (title_hits / len(all_kws)) if all_kws else 0.0

    content_hits = sum(1 for kw in all_kws if _match_single_kw(kw, content)[0])
    content_score = 45.0 * (content_hits / len(all_kws)) if all_kws else 0.0

    query_terms = [w for w in re.findall(r'[\u0E00-\u0E7F\w]+', (query or "").lower()) if len(w) > 2]
    q_score = 0.0
    if query_terms:
        q_hits = sum(1 for w in query_terms if w in content)
        q_score = 20.0 * (q_hits / len(query_terms))

    score = title_score + content_score + q_score

    # 2. Dimension hit verification
    e_hit = any(_match_single_kw(k, content)[0] for k in entities) if entities else True
    a_hit = any(_match_single_kw(k, content)[0] for k in actions) if actions else True
    m_hit = any(_match_single_kw(k, content)[0] for k in metrics) if metrics else True

    # 3. Precision Co-occurrence & Penalties
    # Action mismatch (e.g. Loan aid instead of Disciplinary Firing) -> Penalty
    if actions and not a_hit:
        score *= 0.25
    # Entity mismatch (e.g. Earthquake in Japan instead of Sumatra Indonesia) -> Penalty
    if entities and not e_hit:
        score *= 0.20
    # Full or Strong Multi-Anchor Hit Bonus
    if (not entities or e_hit) and (not actions or a_hit):
        if m_hit or not metrics:
            score = min(100.0, score + 15.0)
        else:
            score = min(100.0, score + 5.0)

    return max(0.0, min(100.0, round(score, 1)))


def _keyword_gate_passed(keywords: list, text_content: str, title: str, pub_date: str = "ไม่ระบุ",
                         is_trusted_domain: bool = False, fallback_query: str = "",
                         is_emergency_fallback: bool = False) -> tuple:
    """Precision Keyword Gate — คัดกรองข่าวขยะตั้งแต่ด่านแรก."""
    if not keywords:
        return True, 0

    has_core, kw_score, matched_kws, has_numeric_exact = _keyword_partial_match(keywords, text_content)
    if not has_core:
        if fallback_query and _query_overlap_specific(fallback_query, text_content):
            return True, 5
        return False, 0

    title_lower = title.lower()
    title_hit = any(_match_single_kw(str(k), title_lower)[0] for k in matched_kws)
    distinct_matched = len(set(str(k).lower() for k in matched_kws))

    # มีตัวเลข exact match ในเนื้อหา
    if has_numeric_exact:
        return True, kw_score + 15
    if title_hit and distinct_matched >= 1:
        return True, kw_score + 10
    if is_trusted_domain:
        return True, kw_score
    if distinct_matched >= 2:
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
    """Filter Serper/Google results — credibility gate + relevance gate + Tiered Trust.

    ต่างจาก Exa filter เพราะ:
    - ผลมาจาก Google ทั้ง internet → ต้องตรวจ domain credibility
    - snippet สั้น (~160 chars) → ให้น้ำหนัก title มากกว่า
    - เว็บนอก Whitelist ยังผ่านได้เป็น Tier 2 (Open Web) ถ้าเนื้อหาตรง
    """
    filtered = []
    trusted_media_set = set(trusted_media) if not isinstance(trusted_media, set) else trusted_media
    factcheck_domains = {'antifakenewscenter.com', 'sure.factcheckthailand.org', 'cofact.org'}

    # ถ้าไม่แพส์ fn ให้ → fallback: exact match กับ blacklisted list
    def _blocked(dom):
        if is_domain_blocked_fn is not None:
            return is_domain_blocked_fn(dom)
        bl_set = blacklisted_domains_or_set if isinstance(blacklisted_domains_or_set, (set, frozenset)) else set(blacklisted_domains_or_set)
        if dom in bl_set:
            return True
        for bl in bl_set:
            if dom.endswith('.' + bl):
                return True
        return False

    spam_indicators = [
        'slot', 'casino', 'bet365', 'poker', 'pgslot', 'joker123',
        'ufa', 'gambling', 'porn', 'xxx', 'sexy', 'เว็บพนัน',
    ]

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

        # ตรวจ spam keyword ใน title (ไม่ใช่ domain แล้ว)
        if any(s in title.lower() for s in ['porn', 'xxx', 'sexy', 'เว็บพนัน']):
            continue

        # ⏰ ข่าวปีก่อน (ปีเก่าจริง) → เตะทิ้ง; ข่าวเดือนเก่าในปีเดียวกัน → ลดคะแนน
        if _ref_too_old(pub_date, _max_ref_age_days()):
            continue

        is_factcheck = domain in factcheck_domains
        is_gov = domain.endswith('.go.th') or domain.endswith('.gov')
        is_tier1 = domain in trusted_media_set

        text_content = (title + " " + snippet).lower()
        match_score = 0

        # ⚠️ ด่านแก่นเรื่อง (Task 6): ต้อง title hit หรือ >=2 คำ หรือ trusted domain
        # หรือ numeric exact 1 คำ หรือ emergency fallback (1 คำก็ผ่าน)
        gate_pass, gate_score = _keyword_gate_passed(
            core_keywords, text_content, title, pub_date=pub_date,
            is_trusted_domain=(is_gov or is_factcheck),
            fallback_query=search_query,
            is_emergency_fallback=is_emergency_fallback,
        )
        if not gate_pass:
            continue
        match_score += gate_score
        match_score += _ref_age_penalty(pub_date, _max_ref_age_days())

        # Relevance Score (0-100%): บังคับ ≥ min_relevance_pct
        relevance_pct = _compute_relevance_score(
            core_keywords, search_query, title, snippet, locations, timeline
        )
        # Emergency mode: ลดเกณฑ์ลงเล็กน้อยเพื่อให้ได้ refs มากพอ
        actual_threshold = min_relevance_pct if not is_emergency_fallback else max(30.0, min_relevance_pct - 20)
        # Tier 0/1: ลดเกณฑ์เพราะผ่าน credibility check แล้ว
        if is_gov or is_factcheck or is_tier1:
            actual_threshold = max(35.0, actual_threshold - 20)
        # Open Web (Tier 2):
        else:
            actual_threshold = max(40.0, actual_threshold - 15)
        
        if relevance_pct < actual_threshold:
            continue
        match_score += int(relevance_pct)  # น้ำหนักเข้มงวด: relevance สูง = คะแนนสูง

        if locations:
            if any(loc.lower() in text_content for loc in locations):
                match_score += 20

        if timeline:
            try:
                ty_th = str(timeline).strip()
                ty_en = str(int(ty_th) - 543)
                has_timeline = ty_th in text_content or ty_en in text_content
                is_current_year = int(ty_th) == datetime.now().year + 543
                years_in_text = re.findall(r'\b(25\d{2}|20\d{2})\b', text_content)
                # ข่าวปีปัจจุบัน + มีปีเก่าชัดเจนในข้อความ + ไม่มี publishedDate → เตะ
                if years_in_text and not has_timeline and is_current_year:
                    old_years = [y for y in years_in_text
                                 if (int(y) < int(ty_th) and int(y) > 2500)
                                 or (int(y) < int(ty_en) and int(y) > 2000)]
                    if old_years:
                        continue
                if has_timeline:
                    match_score += 20
            except Exception:
                pass

        tier = 2  # Open Web / Niche / Independent / Foreign Media (Tier 2)
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
            'href': link,
            'pub_date': pub_date[:10] if pub_date != "ไม่ระบุ" else pub_date,
            'snippet': snippet,
            'tier': tier,
            'match_score': match_score,
            'relevance_pct': relevance_pct,
            'source': 'serper',
        })

    return filtered


def _build_channel_queries(clean_query: str, core_keywords: list, core_keywords_formal: list = None, exact_quote: str = "") -> tuple:
    """Build channel-specific queries.

    - clean_query (topic_keywords) is already a simulated headline phrase from the LLM.
    - Exa Gov: uses formal keywords if available, else clean_query.
    - Exa Media: uses exact quote or colloquial semantic phrase.
    - Serper Web: uses clean_query.
    - Serper News: uses punchy entity cluster (top core keywords) for highest news recall.
    """
    formal_kws = [k for k in (core_keywords_formal or []) if k]
    exa_gov_query = " ".join(formal_kws[:3]) if formal_kws else clean_query
    
    exa_media_query = exact_quote if exact_quote and len(exact_quote.split()) >= 4 else clean_query

    serper_query = clean_query
    
    # News tab works best with punchy 2-4 core keywords
    kw_punchy = " ".join((core_keywords or [])[:4]).strip()
    serper_news_query = kw_punchy if kw_punchy and len(kw_punchy) >= 4 else clean_query

    return exa_gov_query, exa_media_query, serper_query, serper_news_query


def search_news_references(query: str, locations: list, core_keywords: list, timeline: str, num_results: int = 20, source_url: str = "", timeout: float = 25, core_keywords_formal: list = None, content_type: str = "NEWS_CLAIM", exact_quote: str = "") -> list:
    if not query.strip() or query == "SKIP_SEARCH": return []

    # สองกลุ่มคีย์เวิร์ด: colloquial (คำพูด/ชื่อคน/ตัวเลข) + formal (คำราชการ/นโยบาย)
    # ใช้แยกช่องทางค้นหาให้ตรงภาษาของแต่ละช่องทาง และใช้รวมกันตอน filter
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

    # ─── Tier 0: หน่วยงานรัฐ + ศูนย์ตรวจสอบข่าวลวง ───────────────────────────
    # (Exa Gov payload ใช้ includeDomains ซึ่งครอบคลุม .go.th ทั้งหมดอยู่แล้ว)
    factcheck_domains = [
        'antifakenewscenter.com', 'sure.factcheckthailand.org', 'cofact.org',
    ]

    # ─── Tier 1: สื่อหลักไทย + สำนักข่าวต่างประเทศที่รายงานข่าวไทย ─────────────
    # ใช้สำหรับ: เพิ่มคะแนนความน่าเชื่อถือ (Trust Score Boost)
    # ไม่ใช่ประตูปิดกั้น — เว็บข่าวทั่วไปที่อยู่นอกรายการนี้ยังสามารถผ่านเข้ามาเป็น Tier 2 ได้
    tier1_media = [
        # สื่อโทรทัศน์/วิทยุหลักของรัฐ
        'thaipbs.or.th', 'mcot.net', 'tna.mcot.net', 'nbtworld.prd.go.th',
        # สื่อโทรทัศน์เอกชนหลัก
        'pptvhd36.com', 'ch7.com', 'news.ch7.com', 'ch3plus.com', '3plusnews.com',
        'one31.net', 'amarintv.com', 'nationtv.tv', 'tnnthailand.com', 'springnews.co.th',
        'workpointtoday.com', 'thaich8.com', 'trueid.net',
        # สื่อพิมพ์/ออนไลน์ใหญ่
        'thairath.co.th', 'khaosod.co.th', 'matichon.co.th', 'dailynews.co.th',
        'thaipost.net', 'komchadluek.net', 'naewna.com', 'siamrath.co.th',
        'bangkokpost.com', 'nationthailand.com', 'khaosodenglish.com',
        # สื่อเศรษฐกิจ/ธุรกิจ
        'bangkokbiznews.com', 'prachachat.net', 'thansettakij.com', 'posttoday.com',
        'mgronline.com', 'moneyandbanking.co.th', 'efinancethai.com',
        # สื่อออนไลน์อิสระที่น่าเชื่อถือ
        'prachatai.com', 'isranews.org', 'thestandard.co', 'thematter.co', 'the101.world',
        'thaipublica.org', 'voicetv.co.th',
        # พอร์ทัลข่าวออนไลน์ยอดนิยม
        'sanook.com', 'kapook.com', 'today.line.me', 'livenews365.com',
        'thethaiger.com', 'aseannow.com',
        # สื่อท้องถิ่น/ภูมิภาค
        'chiangmainews.co.th', 'phuketnews.com', 'siamnews.com',
        # ─── สำนักข่าวต่างประเทศระดับโลกที่รายงานข่าวไทย/เอเชีย ─────────────────
        'bbc.com', 'bbc.co.uk',                           # BBC
        'reuters.com',                                     # Reuters
        'apnews.com',                                      # AP News
        'bloomberg.com',                                   # Bloomberg
        'channelnewsasia.com', 'cna.asia',                 # Channel News Asia (CNA)
        'asia.nikkei.com', 'nikkei.com',                   # Nikkei Asia
        'scmp.com',                                        # South China Morning Post
        'aljazeera.com',                                   # Al Jazeera
        'voanews.com', 'voathai.com',                      # VOA
        'dw.com',                                          # Deutsche Welle
        'rfi.fr',                                          # RFI
        'afp.com',                                         # AFP
        'straitstimes.com',                                # Straits Times
        'bangkokbiznews.com',                              # (ซ้ำ — ป้องกัน)
        'theguardian.com',                                 # The Guardian (เมื่อรายงานข่าวไทย)
        'washingtonpost.com',                              # Washington Post
        'nytimes.com',                                     # NYT
        # ─── องค์กรระหว่างประเทศ / สถาบันวิจัย ───────────────────────────────────
        'un.org', 'who.int', 'worldbank.org', 'imf.org', 'unesco.org',
        'tdri.or.th', 'nesdc.go.th', 'nso.go.th',
    ]
    # ใช้ set เพื่อ lookup เร็ว
    tier1_media_set = set(tier1_media)
    factcheck_set = set(factcheck_domains)

    # ─── Whitelist Exception List ─────────────────────────────────────────────
    # โดเมนเหล่านี้มีสิทธิ์เหนือ Blacklist เสมอ (Whitelist Priority)
    # ป้องกัน substring-match ของ Blacklist เหมารวม subdomain ที่ถูกต้อง
    whitelist_exceptions = {
        'today.line.me',    # LINE TODAY — สำนักข่าวออนไลน์ aggregate
        'liff.line.me',     # LINE LIFF article links
        'news.line.me',     # LINE News portal
    }

    # ─── Blacklist: กรองเฉพาะ Spam / แพลตฟอร์มวิดีโอ / โซเชียล / เว็บพนัน ────
    # ⚠️ ใช้ EXACT domain matching เท่านั้น ห้าม substring เพื่อป้องกันการเหมารวม
    blacklisted_exact = {
        'youtube.com', 'youtu.be', 'tiktok.com',
        'facebook.com', 'fb.com', 'instagram.com',
        'x.com', 'twitter.com',
        'vimeo.com', 'dailymotion.com',
        'line.me',           # แชท LINE ส่วนตัว (ไม่ใช่ today.line.me)
        'blockdit.com', 'pantip.com',
        'wikipedia.org', 'wiktionary.org', 'longdo.com', 'thai-language.com',
        'pinterest.com', 'reddit.com', 'quora.com',
        # เว็บ .go.th SEO ขยะ
        'npnt.prd.go.th', 'app.mhs-pao.go.th', 'portal.disaster.go.th',
        'office.phatthalung2.go.th', 'fossil.dmr.go.th',
    }
    spam_keywords_in_domain = [
        'slot', 'casino', 'bet365', 'poker', 'pgslot', 'joker123',
        'ufa', 'bangkokviews', 'gambling',
    ]

    def _is_domain_blocked(dom: str) -> bool:
        """ตรวจสอบ Blacklist ด้วย Whitelist Exception Priority:
        1. ถ้าอยู่ใน whitelist_exceptions → ไม่บล็อกเด็ดขาด
        2. ถ้า exact match กับ blacklisted_exact → บล็อก
        3. ถ้ามีคีย์เวิร์ดสแปมใน domain → บล็อก
        """
        if dom in whitelist_exceptions:
            return False  # Whitelist has priority!
        if dom in blacklisted_exact:
            return True
        # ตรวจ subdomain: e.g. 'm.facebook.com', 'static.youtube.com'
        for bl in blacklisted_exact:
            if dom.endswith('.' + bl):
                return True
        for kw in spam_keywords_in_domain:
            if kw in dom:
                return True
        return False

    # backward-compat alias (ใช้ใน _filter_serper_results)
    trusted_media = tier1_media

    # แยก query ตามช่องทาง: gov ใช้คำทางการ, media ใช้คำพูดทั่วไป, serper ใช้ exact keyword, news ใช้ punchy entities
    exa_gov_query, exa_media_query, serper_query, serper_news_query = _build_channel_queries(
        clean_query, core_keywords, core_keywords_formal=core_keywords_formal, exact_quote=exact_quote
    )
    
    # useAutoprompt=False: ปิด LLM query-rewrite ฝั่ง Exa
    exa_search_query = exa_gov_query
    
    payload_gov = {
        "query": exa_search_query,
        "type": "auto",
        "useAutoprompt": False,
        "numResults": 25,
        "includeDomains": [
            # ─── ศูนย์ตรวจสอบข่าวลวง / Fact-Check ──────────────────────────────
            "antifakenewscenter.com", "sure.factcheckthailand.org", "cofact.org",
            # ─── สำนักนายกรัฐมนตรี ─────────────────────────────────────────────
            "thaigov.go.th", "spm.thaigov.go.th", "opm.go.th",
            "prd.go.th", "nbtworld.prd.go.th", "thainews.prd.go.th",
            # ─── กระทรวงต่างๆ ครบทุกกระทรวง ────────────────────────────────────
            "mfa.go.th",          # กระทรวงการต่างประเทศ
            "mof.go.th",          # กระทรวงการคลัง
            "most.go.th",         # กระทรวงการอุดมศึกษา วิทยาศาสตร์ฯ
            "moc.go.th",          # กระทรวงพาณิชย์
            "mol.go.th",          # กระทรวงแรงงาน
            "moi.go.th",          # กระทรวงมหาดไทย
            "moj.go.th",          # กระทรวงยุติธรรม
            "moe.go.th",          # กระทรวงศึกษาธิการ
            "moph.go.th",         # กระทรวงสาธารณสุข
            "moit.go.th",         # กระทรวงดิจิทัลเพื่อเศรษฐกิจและสังคม
            "mot.go.th",          # กระทรวงคมนาคม
            "mua.go.th",          # กระทรวงการอุดมศึกษา
            "mscr.go.th",         # กระทรวงวัฒนธรรม
            "moac.go.th",         # กระทรวงเกษตรและสหกรณ์
            "dmcr.go.th",         # กระทรวงทรัพยากรธรรมชาติและสิ่งแวดล้อม
            "mnre.go.th",         # (เดิมชื่อ ทส.)
            "mi.go.th",           # กระทรวงอุตสาหกรรม
            "mde.go.th",          # กระทรวงพัฒนาสังคมและความมั่นคงของมนุษย์
            "m-society.go.th",    # (อีกโดเมน พม.)
            # ─── ตำรวจ / ทหาร / ความมั่นคง ─────────────────────────────────────
            "royalthaipolice.go.th", "police.go.th",
            "rtarf.mi.th",        # กองทัพไทย
            "army.mi.th",         # กองทัพบก
            "navy.mi.th",         # กองทัพเรือ
            "rtaf.mi.th",         # กองทัพอากาศ
            "isoc.go.th",         # กอ.รมน.
            # ─── รัฐสภา / ฝ่ายนิติบัญญัติ ───────────────────────────────────────
            "parliament.go.th",   # รัฐสภา
            "senate.go.th",       # วุฒิสภา
            # ─── ศาล / องค์กรอิสระ / ป้องกันการทุจริต ──────────────────────────
            "court.go.th",        # ศาลยุติธรรม
            "admincourt.go.th",   # ศาลปกครอง
            "constitutionalcourt.or.th",  # ศาลรัฐธรรมนูญ
            "ect.go.th",          # กกต.
            "ombudsman.go.th",    # ผู้ตรวจการแผ่นดิน
            "nacc.go.th",         # ป.ป.ช.
            "pacc.go.th",         # ป.ป.ท.
            "oag.go.th",          # สำนักงานอัยการสูงสุด
            "nhrc.or.th",         # กสม.
            "nbtc.go.th",         # กสทช.
            # ─── สถาบันการเงิน / เศรษฐกิจ ───────────────────────────────────────
            "bot.or.th",          # ธนาคารแห่งประเทศไทย
            "sec.or.th",          # ก.ล.ต.
            "fpo.go.th",          # สำนักงานเศรษฐกิจการคลัง
            "set.or.th",          # ตลาดหลักทรัพย์
            "dbd.go.th",          # กรมพัฒนาธุรกิจการค้า
            # ─── สาธารณสุข / โรงพยาบาลรัฐ ──────────────────────────────────────
            "dmsc.moph.go.th",    # กรมวิทยาศาสตร์การแพทย์
            "ddc.moph.go.th",     # กรมควบคุมโรค
            "fda.moph.go.th",     # อย.
            "siriraj.mahidol.ac.th",
            "si.mahidol.ac.th",
            "ramathibodi.mahidol.ac.th",
            "chulalongkornhospital.go.th",
            # ─── ข่าวสาร รัฐวิสาหกิจ / หน่วยงานสำคัญ ───────────────────────────
            "dsi.go.th",          # กรมสอบสวนคดีพิเศษ (DSI)
            "narcotics.go.th",    # ป.ป.ส.
            "sac.go.th",          # กรมสรรพากร (Revenue Dept)
            "rd.go.th",
            "customs.go.th",      # กรมศุลกากร
            "sat.or.th",          # กีฬาแห่งชาติ (กกท.)
            "egat.co.th",         # กฟผ.
            "pea.co.th",          # กฟภ.
            "mea.or.th",          # กฟน.
            "pwa.co.th",          # ประปา
            "ptt.com", "pttplc.com",
            "tot.co.th",
            # ─── สถาบันข้อมูล วิจัย สถิติ ────────────────────────────────────────
            "nesdc.go.th", "nso.go.th", "tdri.or.th",
            # ─── มหาวิทยาลัยรัฐชั้นนำ ────────────────────────────────────────────
            "chula.ac.th", "mahidol.ac.th", "tu.ac.th", "cmu.ac.th",
            "ku.ac.th", "psu.ac.th", "kku.ac.th", "sut.ac.th",
        ],
        "contents": { "text": { "maxCharacters": 1500 } }
    }

    # Exa Media: เปิดรับสำนักข่าวทั่วโลก (Open Web) — ใช้ excludeDomains แทน includeDomains
    # เพื่อไม่ปิดกั้นสื่ออิสระ/ต่างประเทศที่ไม่ได้อยู่ใน Whitelist
    payload_media = {
        "query": exa_media_query,
        "type": "auto",
        "useAutoprompt": False,
        "numResults": 20,
        "excludeDomains": [
            'youtube.com', 'youtu.be', 'tiktok.com', 'facebook.com', 'instagram.com',
            'x.com', 'twitter.com', 'vimeo.com', 'dailymotion.com', 'line.me',
            'blockdit.com', 'pantip.com', 'wikipedia.org', 'wiktionary.org',
            'pinterest.com', 'reddit.com', 'quora.com',
        ],
        "contents": { "text": { "maxCharacters": 1500 } }
    }

    # === Parallel fetch: Exa (gov + open-media) + Serper Search + Serper News ===
    exa_raw = []
    serper_raw = []
    serper_news_raw = []
    exa_broad_raw_fallback = []
    serper_raw_fallback = []

    # PERSONAL_STORY: เว็บรัฐ (go.th) ไม่น่ามีเรื่องส่วนตัว/โซเชียลไวรัล → ข้ามช่อง gov
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

    # === รอบที่ 1: Search หลัก (gov + open-media + Serper Organic + Serper News) ===
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

    # === Filter รอบที่ 1: เกณฑ์เข้ม (normal mode) ===
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

        # ⏰ ข่าวปีก่อน (ปีเก่าจริง) → เตะทิ้ง; ข่าวเดือนเก่าในปีเดียวกัน → ลดคะแนน
        if _ref_too_old(pub_date, max_age):
            continue

        text_content = (title + " " + content).lower()
        match_score = 0

        is_factcheck = domain in factcheck_set
        is_gov = domain.endswith('.go.th') or domain.endswith('.gov')
        is_tier1 = domain in tier1_media_set
        is_gov_or_factcheck = is_factcheck or is_gov

        # ⚠️ 1. ด่านแก่นเรื่อง (Task 6): title hit / >=2 คำ / trusted domain / numeric exact
        gate_pass, gate_score = _keyword_gate_passed(
            all_keywords, text_content, title,
            is_trusted_domain=is_gov_or_factcheck,
            fallback_query=clean_query,
            is_emergency_fallback=False,
        )
        if not gate_pass:
            continue
        match_score += gate_score
        match_score += _ref_age_penalty(pub_date, max_age)

        # Relevance Score (0-100%): บังคับ ≥ เกณฑ์
        relevance_pct = _compute_relevance_score(
            all_keywords, clean_query, title, content, locations, timeline
        )
        actual_relevance_threshold = default_min_relevance
        if is_gov_or_factcheck or is_tier1:
            actual_relevance_threshold = max(35.0, actual_relevance_threshold - 20)
        # Open Web (Tier 2):
        else:
            actual_relevance_threshold = max(40.0, actual_relevance_threshold - 15)
        if relevance_pct < actual_relevance_threshold:
            continue
        match_score += int(relevance_pct)

        # 2. ให้คะแนนสถานที่
        if locations:
            if any(loc.lower() in text_content for loc in locations):
                match_score += 20

        # 3. ให้คะแนนเวลา (fallback text-based สำหรับผลที่ไม่มี publishedDate)
        if timeline:
            try:
                ty_th = str(timeline).strip()
                ty_en = str(int(ty_th) - 543)
                has_timeline = ty_th in text_content or ty_en in text_content
                is_current_year = int(ty_th) == datetime.now().year + 543

                years_in_text = re.findall(r'\b(25\d{2}|20\d{2})\b', text_content)
                if years_in_text and not has_timeline and is_current_year:
                    old_years = [y for y in years_in_text if (int(y) < int(ty_th) and int(y) > 2500) or (int(y) < int(ty_en) and int(y) > 2000)]
                    if old_years:
                        continue
                if has_timeline:
                    match_score += 20
            except Exception:
                pass

        if not is_gov_or_factcheck:
            if not is_actual_article(link, title):
                continue

        tier = 2  # Open Web / Niche / Independent / Foreign Media
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
            'pub_date': pub_date[:10] if pub_date != "ไม่ระบุ" else pub_date,
            'snippet': content,
            'tier': tier,
            'match_score': match_score,
            'relevance_pct': relevance_pct,
            'source': 'exa',
        })

    # === Filter Serper results (Google Organic → ต้องกรอง credibility + relevance แยก) ===
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

    # === Filter Serper News results (Google News tab) ===
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

    # === รอบที่ 2: Emergency Fallback Search (ถ้า high_quality refs < min_refs หลังรอบแรก) ===
    # สาเหตุ: query แคบ อาจทำให้เจอแค่ 1 แหล่ง → ขยายมุมมองค้นหาเพื่อดึงสื่ออื่น
    high_quality_r1 = [r for r in processed_results if r.get('relevance_pct', 0) >= 55.0]
    if len(high_quality_r1) < min_refs:
        logger.info(f"[Search] High-quality refs after round 1 = {len(high_quality_r1)} < {min_refs} → Trigger Targeted Expansion")

        # สร้าง Query Permutations จาก Tri-Anchor สำหรับ fallback
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

        # Parallel Exa Broad + Serper Fallback
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

        # Filter Exa Broad (emergency mode: ผ่อนคลาย keyword gate + relevance threshold)
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
            if _ref_too_old(pub_date, max_age): continue

            text_content = (title + " " + content).lower()
            match_score = 0
            is_factcheck = domain in {'antifakenewscenter.com', 'sure.factcheckthailand.org', 'cofact.org'}
            is_gov = domain.endswith('.go.th') or domain.endswith('.gov')
            is_tier1 = domain in tier1_media_set
            is_gov_or_factcheck = is_factcheck or is_gov

            # Emergency mode: ผ่อนคลาย gate (1 คำก็ผ่าน) แต่ relevance ยังต้องผ่าน
            gate_pass, gate_score = _keyword_gate_passed(
                all_keywords, text_content, title,
                is_trusted_domain=is_gov_or_factcheck,
                fallback_query=clean_query,
                is_emergency_fallback=True,
            )
            if not gate_pass: continue
            match_score += gate_score
            match_score += _ref_age_penalty(pub_date, max_age)

            relevance_pct = _compute_relevance_score(
                all_keywords, clean_query, title, content, locations, timeline
            )
            # Emergency threshold: ลดลง 15% (แต่ไม่ต่ำกว่า 30%)
            fb_threshold = max(30.0, default_min_relevance - 15)
            if is_gov_or_factcheck:
                fb_threshold = max(20.0, fb_threshold - 5)
            if relevance_pct < fb_threshold:
                continue
            match_score += int(relevance_pct) - 5  # หักคะแนนเล็กน้อยเพราะเป็น fallback

            if locations:
                if any(loc.lower() in text_content for loc in locations):
                    match_score += 20
            if timeline:
                try:
                    ty_th = str(timeline).strip()
                    ty_en = str(int(ty_th) - 543)
                    has_timeline = ty_th in text_content or ty_en in text_content
                    is_current_year = int(ty_th) == datetime.now().year + 543
                    years_in_text = re.findall(r'\b(25\d{2}|20\d{2})\b', text_content)
                    if years_in_text and not has_timeline and is_current_year:
                        old_years = [y for y in years_in_text if (int(y) < int(ty_th) and int(y) > 2500) or (int(y) < int(ty_en) and int(y) > 2000)]
                        if old_years: continue
                    if has_timeline: match_score += 20
                except Exception: pass

            if not is_gov_or_factcheck:
                if not is_actual_article(link, title): continue

            tier = 2  # Broad search fallback — Open Web tier
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
                'pub_date': pub_date[:10] if pub_date != "ไม่ระบุ" else pub_date,
                'snippet': content,
                'tier': tier,
                'match_score': match_score,
                'relevance_pct': relevance_pct,
                'source': 'exa_broad',
            })

        # Filter Serper Fallback (emergency mode)
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

    # จัดอันดับด้วยคะแนนความสัมพันธ์ (Relevance) และ Tier ร่วมกัน
    processed_results.sort(key=lambda x: (-(x.get('relevance_pct', 0) * 0.7 + x.get('match_score', 0)), x.get('tier', 2)))
    
    # คัดเฉพาะบทความที่ผ่านเกณฑ์ความเกี่ยวข้อง (Relevance >= 55.0%) อย่างเด็ดขาด (ห้ามเรื่องอื่นหลุดเข้ามา)
    high_quality = [r for r in processed_results if r.get('relevance_pct', 0) >= 55.0]
    final_sorted = high_quality
    
    for r in final_sorted:
        r.pop('tier', None)
        # เก็บ relevance_pct และ match_score ไว้สำหรับการตรวจสอบหรือส่งต่อ
        # r.pop('match_score', None)
        # r.pop('relevance_pct', None)

    return final_sorted[:num_results]


def build_fast_search_query(value: str, max_chars: int = 140) -> str:
    """Build a bounded raw query for the planner-parallel Wave-0 search.

    Removes URLs and leading social/caption framing so the head start searches
    the story, not the wrapper text.
    """
    text = re.sub(r"https?://\S+", " ", str(value or ""))
    text = re.sub(r"\s+", " ", text).strip()
    
    # ตัดแท็กที่ระบบ scraper ใส่เข้ามา เช่น [ดึงด้วย: FB Embed Iframe 🌐] หรือ [ตรวจสอบด้วย: ...] 
    text = re.sub(r"^\[.*?\][:：]?\s*", "", text)
    
    # ตัดคำนำแบบ social/caption framing + ป้ายชื่อแพลตฟอร์ม (Instagram:/Facebook:)
    text = re.sub(
        r"^(โพสต์จาก|แคปชั่น|ล่าสุด|ตามที่มีการแชร์|ข่าวลวง|เตือนภัย|พรีวิวจากโซเชียล)[:：]?\s*"
        r"(?:Instagram|Facebook|FB|X|Twitter|TikTok|YouTube)?[:：]?\s*",
        "",
        text,
        flags=re.IGNORECASE
    )
    # ตัดชื่อแพลตฟอร์มเดี่ยวๆ ที่อาจหลุดมาข้างหน้าสุด
    text = re.sub(r"^(?:Instagram|Facebook|FB|X|Twitter|TikTok|YouTube)[:：]?\s*", "", text, flags=re.IGNORECASE)
    
    return text[:max_chars].strip()


def merge_search_reports(wave0_refs: list, planned_refs: list, core_keywords: list, limit: int = 20, search_query: str = "") -> list:
    """Merge Wave-0 (planner-parallel) refs with planned-search refs.

    Planned refs already passed the keyword gate, so they keep priority. Wave-0
    refs (searched without keywords) only join when they still match at least
    one core keyword in their title/snippet — the same gate applied late — so
    the raw head start cannot pull off-topic pages into the final set.
    """
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
            )
            if not gate_pass:
                continue
        if href:
            seen.add(href)
        merged.append(ref)
    return merged[:limit]