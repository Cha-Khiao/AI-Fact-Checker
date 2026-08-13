"""Low-latency, source-aware retrieval across Exa and Serper.

`search_news_references` keeps the legacy list return type used by Streamlit.
Backend/API callers should prefer `search_news_references_with_diagnostics` so a
provider failure is not confused with a valid search that found no evidence.
"""

from __future__ import annotations

import concurrent.futures
import os
import re
import time
import unicodedata
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

import requests
from dotenv import load_dotenv

os.environ.setdefault(
    "PYTHAINLP_DATA", os.path.join(os.path.dirname(__file__), ".pythainlp-data")
)
try:
    from pythainlp.tokenize import word_tokenize as thai_word_tokenize
except (ImportError, OSError):  # deterministic n-gram fallback keeps the system usable
    thai_word_tokenize = None

from http_client import get_session, split_timeout
from source_policy import (
    FACT_CHECK_DOMAINS,
    FOREIGN_GOVERNMENT_DOMAINS,
    INTERNATIONAL_ORGANIZATION_DOMAINS,
    REGULATORY_ORGANIZATION_DOMAINS,
    TRUSTED_MEDIA_DOMAINS,
    classify_source,
)


load_dotenv()

EXA_SEARCH_URL = "https://api.exa.ai/search"
EXA_CONTENTS_URL = "https://api.exa.ai/contents"
SERPER_SEARCH_URL = "https://google.serper.dev/search"
SERPER_NEWS_URL = "https://google.serper.dev/news"
DEFAULT_SEARCH_TIMEOUT_SECONDS = 8.0
MAX_SNIPPET_CHARACTERS = 1800

DOCUMENT_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx",
    ".csv", ".rtf", ".odt", ".ods", ".odp", ".zip", ".rar", ".7z", ".gz",
}

# Query-string keys whose value, when it points at a document, means the link is a
# download/viewer wrapper rather than a readable HTML page.
DOCUMENT_QUERY_KEYS = {
    "file", "filename", "document", "attachment", "url", "target", "src",
    "download", "path", "fileurl", "docurl",
}

# Path segments that unambiguously serve a file rather than an HTML article, even
# when the URL carries no file extension (common on Thai government CMS portals).
# Kept strict so ordinary slugs like ".../how-to-download-the-app" are not caught.
FILE_ENDPOINT_SEGMENTS = {
    "getfile", "get_file", "filedownload", "file_download", "downloadfile",
    "download_file", "servefile", "serve_file", "viewfile", "view_file",
    "openfile", "fetchfile", "download.php", "download.aspx", "download.jsp",
    "getfile.php", "getfile.aspx", "file.aspx", "showfile", "getdoc",
    "getattachment", "download.do", "attachment.php",
}

# Document/flipbook platforms that only ever host a file inside an in-page viewer
# — the user cannot read them as an ordinary HTML article, and many wrap a PDF.
DOCUMENT_VIEWER_HOSTS = {
    "issuu.com", "anyflip.com", "fliphtml5.com", "online.fliphtml5.com",
    "pubhtml5.com", "online.pubhtml5.com", "calameo.com", "scribd.com",
    "slideshare.net", "flippingbook.com", "flowpaper.com", "yumpu.com",
}

# Substrings that mark an in-browser PDF viewer regardless of host (Google gview,
# Mozilla pdf.js, generic web/viewer.html shells). These serve a PDF, not an HTML
# article, so the reference would open as a file the user must scroll inside.
PDF_VIEWER_MARKERS = (
    "/gview", "web/viewer.html", "pdfjs", "pdf.js", "/flipbook", "/flippingbook",
)

BLACKLISTED_DOMAINS = (
    "youtube.com", "youtu.be", "tiktok.com", "facebook.com", "instagram.com",
    "x.com", "twitter.com", "vimeo.com", "dailymotion.com", "line.me",
    "blockdit.com", "pantip.com", "wikipedia.org", "wiktionary.org",
    "longdo.com", "thai-language.com",
)

TRACKING_QUERY_PARAMETERS = {
    "fbclid", "gclid", "dclid", "msclkid", "mc_cid", "mc_eid", "ref",
    "ref_src", "source", "igshid", "srsltid",
}

QUERY_STOPWORDS = {
    "การ", "ของ", "และ", "หรือ", "ที่", "ใน", "เป็น", "จาก", "ให้", "ว่า",
    "the", "a", "an", "and", "or", "of", "in", "on", "to", "for",
}

QUANTITY_INTENT_PATTERN = re.compile(
    r"(จำนวน|กี่|เท่าไร|ทั้งหมด|รวมทั้งสิ้น|อัตรา|ร้อยละ|เปอร์เซ็นต์|มูลค่า|ราคา|ยอด|สถิติ)",
    re.IGNORECASE,
)

# Minimum relevance a candidate must earn from claim wording alone (keyword/query
# overlap, coverage, location, before any provenance/provider bonus). This stops a
# high-tier source from being ranked as evidence when it is off-topic.
TOPICAL_RELEVANCE_FLOOR = 20


def _get_api_key(name: str) -> str:
    """Read a key without logging its value; explicit empty env disables fallback."""
    if name in os.environ:
        return os.environ.get(name, "").strip()
    try:
        import streamlit as st

        return str(st.secrets.get(name, "")).strip()
    except (ImportError, FileNotFoundError, KeyError, AttributeError):
        return ""


def _search_timeout_seconds() -> float:
    raw_value = os.getenv("SEARCH_TIMEOUT_SECONDS", "").strip()
    try:
        value = float(raw_value) if raw_value else DEFAULT_SEARCH_TIMEOUT_SECONDS
    except ValueError:
        value = DEFAULT_SEARCH_TIMEOUT_SECONDS
    return min(15.0, max(2.0, value))


def fetch_exa_api(payload, api_key, timeout=DEFAULT_SEARCH_TIMEOUT_SECONDS):
    """Call Exa and raise on failure so the orchestrator can report diagnostics."""
    response = get_session().post(
        EXA_SEARCH_URL,
        json=payload,
        headers={
            "accept": "application/json",
            "content-type": "application/json",
            "x-api-key": api_key,
        },
        timeout=split_timeout(timeout),
    )
    response.raise_for_status()
    data = response.json()
    if not isinstance(data, dict):
        raise ValueError("Exa returned a non-object response")
    results = data.get("results", [])
    return results if isinstance(results, list) else []


def fetch_serper_api(payload, api_key, timeout=DEFAULT_SEARCH_TIMEOUT_SECONDS):
    """Call Serper's Google Search endpoint and return organic results."""
    response = get_session().post(
        SERPER_SEARCH_URL,
        json=payload,
        headers={
            "accept": "application/json",
            "content-type": "application/json",
            "X-API-KEY": api_key,
        },
        timeout=split_timeout(timeout),
    )
    response.raise_for_status()
    data = response.json()
    if not isinstance(data, dict):
        raise ValueError("Serper returned a non-object response")
    results = data.get("organic", [])
    return results if isinstance(results, list) else []


def fetch_serper_news(payload, api_key, timeout=DEFAULT_SEARCH_TIMEOUT_SECONDS):
    """Call Serper News for the adaptive second wave."""
    response = get_session().post(
        SERPER_NEWS_URL,
        json=payload,
        headers={
            "accept": "application/json",
            "content-type": "application/json",
            "X-API-KEY": api_key,
        },
        timeout=split_timeout(timeout),
    )
    response.raise_for_status()
    data = response.json()
    if not isinstance(data, dict):
        raise ValueError("Serper News returned a non-object response")
    results = data.get("news", [])
    return results if isinstance(results, list) else []


def fetch_exa_contents(urls, api_key, timeout=5.0):
    """Batch-hydrate Serper-only discoveries through Exa's contents endpoint."""
    response = get_session().post(
        EXA_CONTENTS_URL,
        json={
            "urls": urls,
            "text": {"maxCharacters": MAX_SNIPPET_CHARACTERS},
            "maxAgeHours": 24,
            "livecrawlTimeout": 2500,
        },
        headers={
            "accept": "application/json",
            "content-type": "application/json",
            "x-api-key": api_key,
        },
        timeout=split_timeout(timeout),
    )
    response.raise_for_status()
    data = response.json()
    return data if isinstance(data, dict) else {}


def canonicalize_url(url: str) -> str:
    """Normalize URLs for cross-provider deduplication without losing article IDs."""
    value = str(url or "").strip()
    if not value:
        return ""
    parsed = urlparse(value)
    scheme = parsed.scheme.lower() if parsed.scheme else "https"
    hostname = (parsed.hostname or "").lower().removeprefix("www.")
    if not hostname:
        return ""
    try:
        port = parsed.port
    except ValueError:
        return ""
    netloc = hostname if not port else f"{hostname}:{port}"
    path = re.sub(r"/{2,}", "/", parsed.path or "/")
    if path != "/":
        path = path.rstrip("/")
    clean_query = []
    for key, query_value in parse_qsl(parsed.query, keep_blank_values=False):
        key_lower = key.lower()
        if key_lower.startswith("utm_") or key_lower in TRACKING_QUERY_PARAMETERS:
            continue
        clean_query.append((key, query_value))
    clean_query.sort(key=lambda pair: (pair[0].lower(), pair[1]))
    return urlunparse((scheme, netloc, path, "", urlencode(clean_query), ""))


def _domain_matches(domain: str, candidate: str) -> bool:
    return domain == candidate or domain.endswith(f".{candidate}")


def _is_blocklisted(url: str) -> bool:
    domain = (urlparse(url).hostname or "").lower().removeprefix("www.")
    return any(_domain_matches(domain, item) for item in BLACKLISTED_DOMAINS)


def _is_document_result(url: str, title: str = "", snippet: str = "") -> bool:
    """Reject downloadable documents while allowing an HTML landing page about one.

    The user must be able to click every reference and read it in the browser, so a
    link that forces a file download is never a valid HTML source. Detection covers
    the file extension anywhere in the path (``/report.pdf/view``), download/viewer
    query wrappers, and known viewer hosts that serve a file without an extension.
    """
    value = str(url or "").strip().lower()
    parsed = urlparse(value)
    path = parsed.path.rstrip("/")

    # A document extension on any path segment, not only the final one.
    for segment in path.split("/"):
        if any(segment.endswith(extension) for extension in DOCUMENT_EXTENSIONS):
            return True

    # Download/viewer wrappers that carry the real file in a query parameter.
    for key, parameter_value in parse_qsl(parsed.query, keep_blank_values=True):
        parameter_lower = parameter_value.lower()
        if key.lower() in DOCUMENT_QUERY_KEYS and any(
            extension in parameter_lower for extension in DOCUMENT_EXTENSIONS
        ):
            return True

    # Path endpoints that serve a file with no extension (CMS download handlers).
    path_segments = [segment for segment in path.split("/") if segment]
    if any(segment in FILE_ENDPOINT_SEGMENTS for segment in path_segments):
        return True

    # Known viewer / forced-download / document hosts that emit a file rather than a
    # readable news article, with or without a clean extension.
    host = (parsed.hostname or "").removeprefix("www.")
    query_lower = parsed.query.lower()
    if host == "docs.google.com" and any(
        marker in path for marker in ("/viewer", "/document/d", "/spreadsheets/d", "/presentation/d")
    ):
        return True
    if host == "drive.google.com" and (
        path.startswith("/file/") or path.startswith("/uc") or "export=download" in query_lower
    ):
        return True

    # A PDF opened inside an in-page viewer/flipbook still forces the user to read a
    # file rather than an article — reject the viewer hosts and viewer URL shells.
    if any(host == viewer or host.endswith(f".{viewer}") for viewer in DOCUMENT_VIEWER_HOSTS):
        return True
    full_url = f"{path}?{query_lower}"
    if any(marker in full_url for marker in PDF_VIEWER_MARKERS):
        return True

    title_text = str(title or "").lower()
    explicit_markers = (
        "[pdf]", "ไฟล์ pdf", "ดาวน์โหลด pdf", "เอกสาร pdf",
        "ไฟล์ word", "ไฟล์ excel", "ไฟล์ powerpoint",
    )
    return any(marker in title_text for marker in explicit_markers) or bool(
        re.search(r"\b(?:pdf|docx?|xlsx?|pptx?)\b", title_text)
    )


def is_actual_article(url, title, snippet=""):
    parsed = urlparse(str(url or "").lower())
    path = parsed.path
    path_parts = [part for part in path.split("/") if part]
    title_lower = str(title or "").lower()

    if _is_document_result(url, title, snippet):
        return False
    if not path_parts:
        return False
    if path in ("/", "/th", "/en", "/th/", "/en/", "/index.html", "/index.php", "/default.aspx", "/home"):
        return False

    aggregator_keywords = {
        "category", "topic", "tag", "tags", "author", "page", "search",
        "archive", "archives", "gallery", "calendar", "sitemap",
    }
    if any(keyword in path_parts for keyword in aggregator_keywords):
        return False

    if len(path_parts) == 1:
        single_path = path_parts[0]
        if single_path in {"news", "latest", "pr", "article", "articles", "update", "ข่าวด่วน", "ข่าว"}:
            return False
        if len(single_path) < 10 and not re.search(r"\.(html|htm|php|aspx)$", single_path):
            return False

    generic_titles = (
        "หน้าแรก", "หน้าหลัก", "รวมข่าว", "ข่าวล่าสุด", "ข่าวด่วน", "home",
        "official website", "เว็บไซต์ทางการ", "ข่าวที่เกี่ยวข้อง",
    )
    if any(generic_title in title_lower for generic_title in generic_titles) and len(title_lower) < 30:
        return False
    if len(str(title or "").strip().split()) <= 2 and len(str(title or "")) < 20:
        return False
    return True


def _normalize_publication_date(value) -> tuple[str, str]:
    raw_value = str(value or "").strip()
    match = re.search(r"\b(20\d{2}|25\d{2})[-/](\d{1,2})[-/](\d{1,2})\b", raw_value)
    if not match:
        return "ไม่ระบุ", raw_value
    year, month, day = match.groups()
    return f"{int(year):04d}-{int(month):02d}-{int(day):02d}", raw_value


def _normalize_exa_results(results, query_kind: str) -> list[dict]:
    normalized = []
    for index, item in enumerate(results or [], start=1):
        if not isinstance(item, dict):
            continue
        published_date, published_raw = _normalize_publication_date(item.get("publishedDate"))
        highlights = item.get("highlights") or []
        highlight_text = "\n".join(
            str(highlight).strip() for highlight in highlights
            if str(highlight).strip()
        )
        raw_text = str(item.get("text") or "").strip()
        combined_text = "\n".join(
            part for part in (highlight_text, raw_text) if part
        )[:MAX_SNIPPET_CHARACTERS]
        normalized.append({
            "title": str(item.get("title") or "ข่าวที่เกี่ยวข้อง").strip(),
            "href": str(item.get("url") or "").strip(),
            "pub_date": published_date,
            "published_raw": published_raw,
            "snippet": combined_text,
            "content_source": "exa_highlights" if highlight_text else "exa_text",
            "providers": ["exa"],
            "provider_ranks": {"exa": index},
            "query_kinds": [query_kind],
        })
    return normalized


def _normalize_serper_results(results, query_kind: str) -> list[dict]:
    normalized = []
    for index, item in enumerate(results or [], start=1):
        if not isinstance(item, dict):
            continue
        published_date, published_raw = _normalize_publication_date(item.get("date"))
        position = item.get("position")
        rank = position if isinstance(position, int) and position > 0 else index
        normalized.append({
            "title": str(item.get("title") or "ข่าวที่เกี่ยวข้อง").strip(),
            "href": str(item.get("link") or "").strip(),
            "pub_date": published_date,
            "published_raw": published_raw,
            "snippet": str(item.get("snippet") or "")[:MAX_SNIPPET_CHARACTERS].strip(),
            "content_source": "serper_snippet",
            "providers": ["serper"],
            "provider_ranks": {"serper": rank},
            "query_kinds": [query_kind],
        })
    return normalized


def _merge_duplicate(existing: dict, candidate: dict) -> None:
    existing["providers"] = sorted(set(existing["providers"] + candidate["providers"]))
    existing["provider_ranks"].update(candidate["provider_ranks"])
    existing["query_kinds"] = sorted(set(existing["query_kinds"] + candidate["query_kinds"]))
    if len(candidate.get("snippet", "")) > len(existing.get("snippet", "")):
        existing["snippet"] = candidate["snippet"]
        existing["content_source"] = candidate.get("content_source", existing.get("content_source"))
    if existing.get("pub_date") == "ไม่ระบุ" and candidate.get("pub_date") != "ไม่ระบุ":
        existing["pub_date"] = candidate["pub_date"]
        existing["published_raw"] = candidate.get("published_raw", "")
    if existing.get("title") == "ข่าวที่เกี่ยวข้อง" and candidate.get("title"):
        existing["title"] = candidate["title"]


def _meaningful_terms(value: str) -> list[str]:
    normalized = unicodedata.normalize("NFKC", str(value or "")).lower()
    normalized = normalized.replace("\u200b", " ").replace("\ufeff", " ")
    if thai_word_tokenize is not None and re.search(r"[ก-๙]", normalized):
        raw_terms = thai_word_tokenize(normalized, engine="newmm", keep_whitespace=False)
        terms = [re.sub(r"[^a-zA-Z0-9ก-๙]", "", term) for term in raw_terms]
    else:
        terms = re.findall(r"[a-zA-Z0-9]+", normalized)
        for thai_chunk in re.findall(r"[ก-๙]{3,}", normalized):
            if len(thai_chunk) <= 6:
                terms.append(thai_chunk)
            else:
                terms.extend(thai_chunk[index:index + 3] for index in range(len(thai_chunk) - 2))
    return list(dict.fromkeys(
        term for term in terms
        if len(term) >= 2 and term not in QUERY_STOPWORDS and not term.isspace()
    ))


def build_fast_search_query(value: str, max_terms: int = 12) -> str:
    """Build a bounded deterministic query for the planner-parallel Wave-0 search."""
    try:
        term_limit = min(20, max(4, int(max_terms)))
    except (TypeError, ValueError):
        term_limit = 12
    terms = _meaningful_terms(value)
    if terms:
        return " ".join(terms[:term_limit])[:320].strip()
    return re.sub(r"\s+", " ", str(value or "")).strip()[:320]


def _minimum_relevance_score() -> int:
    try:
        value = int(os.getenv("MIN_RELEVANCE_SCORE", "22"))
    except ValueError:
        value = 22
    return min(60, max(5, value))


def _numeric_evidence_values(text: str) -> list[tuple[int, int, str]]:
    values = []
    for match in re.finditer(r"(?<![\wก-๙])[0-9๐-๙][0-9๐-๙,.]*(?![\wก-๙])", text):
        raw_value = match.group(0).replace(",", "")
        ascii_value = raw_value.translate(str.maketrans("๐๑๒๓๔๕๖๗๘๙", "0123456789"))
        digits = re.sub(r"\D", "", ascii_value)
        if len(digits) == 4 and (digits.startswith(("19", "20", "24", "25"))):
            continue
        values.append((match.start(), match.end(), match.group(0)))
    return values


def _direct_quantity_signals(text: str, core_phrases: list[str]) -> list[str]:
    """Find a number close to the entity being measured, not merely anywhere on the page."""
    numeric_values = _numeric_evidence_values(text)
    if not numeric_values:
        return []
    entity_phrases = [
        phrase for phrase in core_phrases
        if len(phrase) >= 3 and not QUANTITY_INTENT_PATTERN.fullmatch(phrase)
    ]
    signals = []
    for phrase in entity_phrases:
        for entity_match in re.finditer(re.escape(phrase), text):
            for number_start, number_end, raw_number in numeric_values:
                number_before_gap = text[number_end:entity_match.start()] if number_end <= entity_match.start() else ""
                entity_before_gap = text[entity_match.end():number_start] if entity_match.end() <= number_start else ""
                pair_start = min(entity_match.start(), number_start)
                pair_end = max(entity_match.end(), number_end)
                pair_context = text[max(0, pair_start - 80):min(len(text), pair_end + 40)]
                number_pattern = re.escape(raw_number)
                phrase_pattern = re.escape(phrase)
                relation_pattern = (
                    r"(?:จำนวน|ทั้งหมด|รวมทั้งสิ้น|มี(?:จำนวน)?|ประกอบด้วย|แบ่งเป็น|"
                    r"อยู่ที่|เท่ากับ|คิดเป็น|เพิ่มเป็น|ลดเหลือ|แตะ|สูงถึง|ต่ำถึง|ประมาณ)"
                )
                direct_measurement_pattern = re.compile(
                    rf"{relation_pattern}"
                    rf"\s*{number_pattern}\s*{phrase_pattern}"
                    rf"|(?:รายชื่อ|บัญชีรายชื่อ)[^.!?\n]{{0,70}}{number_pattern}\s*{phrase_pattern}"
                    rf"|{phrase_pattern}[^.!?\n]{{0,28}}"
                    rf"{relation_pattern}"
                    rf"\s*{number_pattern}"
                    rf"|{number_pattern}\s*{phrase_pattern}\s*(?:ทั้งหมด|ทั่วประเทศ|รวมทั้งสิ้น)",
                    re.IGNORECASE,
                )
                number_directly_labels_entity = (
                    number_end <= entity_match.start()
                    and len(number_before_gap) <= 16
                    and not re.search(r"[a-zA-Zก-๙]{3,}", number_before_gap)
                    and bool(direct_measurement_pattern.search(pair_context))
                )
                entity_has_quantity_predicate = (
                    entity_match.end() <= number_start
                    and len(entity_before_gap) <= 32
                    and bool(direct_measurement_pattern.search(pair_context))
                )
                if number_directly_labels_entity or entity_has_quantity_predicate:
                    signals.append(f"{raw_number}↔{phrase}")
                    break
            if signals:
                break
        if len(signals) >= 3:
            break
    return signals


def build_verification_query(clean_query: str) -> str:
    """Challenge numeric claims without repeating the proposed answer verbatim."""
    value = str(clean_query or "").strip()
    number_neutral = re.sub(r"(?<![\wก-๙])\d[\d,.]*(?![\wก-๙])", " ", value)
    number_neutral = re.sub(r"\s+", " ", number_neutral).strip()
    if number_neutral and number_neutral != value:
        return f"{number_neutral} จำนวนเท่าไร ข้อมูลที่ถูกต้อง แหล่งทางการ"
    return f"{value} จริงหรือไม่ ตรวจสอบข้อเท็จจริง ข้อมูลที่ถูกต้อง"


def _compose_enhanced_query(clean_query, core_keywords, locations, max_characters=240):
    """Add planner context without repeating phrases already present in the query."""
    parts = [str(clean_query or "").strip()]
    combined_lower = parts[0].lower()
    for value in list(core_keywords or []) + list(locations or []):
        phrase = re.sub(r"\s+", " ", str(value or "")).strip()
        if not phrase or phrase.lower() in combined_lower:
            continue
        candidate = " ".join(parts + [phrase]).strip()
        if len(candidate) > max_characters:
            continue
        parts.append(phrase)
        combined_lower = candidate.lower()
    return " ".join(parts).strip()


def _recency_adjustment(pub_date, now_year: int) -> tuple[int, str]:
    """Score freshness when the claim itself does not pin a year.

    Users flagged that off-topic results were mostly old articles that shared only
    a few words. When no target year is requested, reward recent reporting and
    penalize stale pages so age becomes part of ranking (and can drop a marginally
    relevant old page below the minimum score). Buddhist-era years are converted.
    """
    match = re.match(r"(\d{4})", str(pub_date or "").strip())
    if not match:
        return 0, "unknown"
    year = int(match.group(1))
    if year >= 2400:  # Buddhist era → Gregorian
        year -= 543
    age = now_year - year
    if age < 0:
        return 0, "unknown"
    if age <= 1:
        return 6, "fresh"
    if age <= 3:
        return 2, "recent"
    if age <= 5:
        return -4, "aging"
    return -10, "stale"


def _target_year_forms(target_year: str) -> set[str]:
    raw_year = str(target_year or "").strip()
    if not re.fullmatch(r"\d{4}", raw_year):
        return set()
    numeric_year = int(raw_year)
    if numeric_year >= 2400:
        return {str(numeric_year), str(numeric_year - 543)}
    if numeric_year >= 1900:
        return {str(numeric_year), str(numeric_year + 543)}
    return {raw_year}


def _score_candidate(candidate, clean_query, locations, core_keywords, target_year):
    title_lower = candidate["title"].lower()
    snippet_lower = candidate["snippet"].lower()
    text_content = f"{title_lower} {snippet_lower}"
    query_terms = _meaningful_terms(clean_query)
    core_phrases = [str(keyword).strip().lower() for keyword in core_keywords or [] if str(keyword).strip()]

    matched_keywords = [keyword for keyword in core_phrases if keyword in text_content]
    matched_query_terms = [term for term in query_terms if term in text_content]

    query_coverage = len(matched_query_terms) / max(1, len(query_terms))
    core_coverage = len(matched_keywords) / max(1, len(core_phrases)) if core_phrases else 0.0

    # A candidate is topically relevant only when the claim's own wording appears —
    # not when a single incidental term coincides. Requiring a core keyword, at least
    # two query terms, or meaningful coverage keeps off-topic pages out before any
    # provenance bonus can rescue them.
    strong_topical_match = (
        bool(matched_keywords)
        or len(matched_query_terms) >= 2
        or query_coverage >= 0.34
    )
    if not strong_topical_match:
        candidate["_rejection_reason"] = "not_relevant"
        return None

    quantity_signals = []
    if QUANTITY_INTENT_PATTERN.search(clean_query):
        entity_phrases = list(dict.fromkeys(core_phrases + matched_query_terms))
        quantity_signals = _direct_quantity_signals(text_content, entity_phrases)
        if not quantity_signals:
            candidate["_rejection_reason"] = "not_direct_evidence"
            return None

    # Topical score is earned only from claim↔candidate overlap (keywords, query
    # terms, coverage, location). Provenance and provider bonuses are added *after*
    # the topical floor so a high-tier but off-topic page can never qualify.
    topical_score = 0
    for keyword in matched_keywords:
        topical_score += 28 if keyword in title_lower else 16
    topical_score += min(30, sum(9 if term in title_lower else 4 for term in matched_query_terms))
    topical_score += round((query_coverage * 12) + (core_coverage * 10))

    normalized_locations = [str(location).strip().lower() for location in locations or [] if str(location).strip()]
    if normalized_locations and any(location in text_content for location in normalized_locations):
        topical_score += 14

    year_forms = _target_year_forms(target_year)
    temporal_alignment = "NOT_REQUESTED"
    temporal_adjustment = 0
    recency_label = "not_applicable"
    if year_forms:
        if any(year in text_content or candidate.get("pub_date", "").startswith(year) for year in year_forms):
            temporal_adjustment = 10
            temporal_alignment = "MATCH"
        elif candidate.get("pub_date") not in {"", "ไม่ระบุ", None}:
            temporal_adjustment = -3
            temporal_alignment = "REVIEW_REQUIRED"
        else:
            temporal_alignment = "UNKNOWN"
    else:
        # No year in the claim: fall back to a freshness preference so results are
        # not dominated by old articles that merely share a few words.
        temporal_adjustment, recency_label = _recency_adjustment(
            candidate.get("pub_date"), time.localtime().tm_year
        )
        temporal_alignment = f"RECENCY_{recency_label.upper()}"

    if topical_score < TOPICAL_RELEVANCE_FLOOR:
        candidate["_rejection_reason"] = "not_relevant"
        return None

    score = topical_score + temporal_adjustment
    source_info = classify_source(candidate["href"])
    score += min(16, source_info["source_weight"])
    authority_matches = [
        topic for topic in source_info.get("source_topics", [])
        if topic.lower() in " ".join([clean_query, *core_phrases]).lower()
    ]
    if authority_matches:
        score += min(12, 4 * len(authority_matches))
    if len(candidate["providers"]) > 1:
        score += 12
    if "verification" in candidate.get("query_kinds", []):
        score += 5
    best_provider_rank = min(candidate["provider_ranks"].values(), default=20)
    score += max(0, 11 - min(best_provider_rank, 11))
    if len(candidate["snippet"]) >= 300:
        score += 4

    candidate.update(source_info)
    candidate["authority_topic_matches"] = authority_matches
    candidate["matched_keywords"] = matched_keywords
    candidate["matched_query_terms"] = matched_query_terms
    candidate["query_term_count"] = len(query_terms)
    candidate["topical_score"] = topical_score
    candidate["lexical_coverage"] = round(max(query_coverage, core_coverage), 3)
    candidate["direct_evidence_signals"] = quantity_signals
    candidate["temporal_alignment"] = temporal_alignment
    candidate["recency"] = recency_label
    candidate["relevance_score"] = min(100, score)
    if candidate["relevance_score"] < _minimum_relevance_score():
        candidate["_rejection_reason"] = "not_relevant"
        return None
    return candidate


def _select_diverse_results(scored_results, num_results, excluded_counts):
    """Preserve relevance order while reserving room for provenance and challenge evidence."""
    limit = min(20, max(1, int(num_results)))
    if not scored_results:
        return []
    selected_urls = set()
    selected_reasons = {}
    domain_counts = {}

    def add_candidate(candidate, reason):
        url = candidate["href"]
        domain = candidate["source_domain"]
        if url in selected_urls or len(selected_urls) >= limit:
            return False
        if domain_counts.get(domain, 0) >= 2:
            return False
        selected_urls.add(url)
        selected_reasons.setdefault(url, []).append(reason)
        domain_counts[domain] = domain_counts.get(domain, 0) + 1
        return True

    top_score = scored_results[0]["relevance_score"]
    add_candidate(scored_results[0], "top_relevance")
    special_groups = [
        (
            "authoritative_or_fact_check",
            lambda item: item["source_tier"] in {"A", "B", "D"},
            25,
        ),
        (
            "verification_query",
            lambda item: "verification" in item.get("query_kinds", []),
            20,
        ),
        (
            "cross_provider",
            lambda item: len(item.get("providers", [])) > 1,
            20,
        ),
    ]
    for reason, predicate, score_margin in special_groups:
        candidate = next(
            (
                item for item in scored_results
                if predicate(item) and item["relevance_score"] >= top_score - score_margin
            ),
            None,
        )
        if candidate:
            add_candidate(candidate, reason)

    for candidate in scored_results:
        add_candidate(candidate, "ranked_relevance")
        if len(selected_urls) >= limit:
            break

    for candidate in scored_results:
        if candidate["href"] not in selected_urls and domain_counts.get(candidate["source_domain"], 0) >= 2:
            excluded_counts["domain_limit"] += 1

    selected = [item for item in scored_results if item["href"] in selected_urls]
    for item in selected:
        item["selection_reasons"] = selected_reasons[item["href"]]
    return selected


def _process_results(raw_candidates, clean_query, locations, core_keywords, target_year, num_results, source_url):
    clean_source_url = canonicalize_url(source_url)
    merged_by_url = {}
    excluded_counts = {
        "missing_url": 0,
        "source_url": 0,
        "blacklisted": 0,
        "document": 0,
        "not_article": 0,
        "not_relevant": 0,
        "not_direct_evidence": 0,
        "duplicate": 0,
        "domain_limit": 0,
    }

    for candidate in raw_candidates:
        canonical_url = canonicalize_url(candidate.get("href", ""))
        if not canonical_url:
            excluded_counts["missing_url"] += 1
            continue
        if clean_source_url and canonical_url == clean_source_url:
            excluded_counts["source_url"] += 1
            continue
        if _is_blocklisted(canonical_url):
            excluded_counts["blacklisted"] += 1
            continue
        candidate["href"] = canonical_url
        if _is_document_result(
            canonical_url, candidate.get("title", ""), candidate.get("snippet", "")
        ):
            excluded_counts["document"] += 1
            continue
        if not is_actual_article(
            canonical_url, candidate.get("title", ""), candidate.get("snippet", "")
        ):
            excluded_counts["not_article"] += 1
            continue
        if canonical_url in merged_by_url:
            excluded_counts["duplicate"] += 1
            _merge_duplicate(merged_by_url[canonical_url], candidate)
            continue
        merged_by_url[canonical_url] = candidate

    scored_results = []
    for candidate in merged_by_url.values():
        scored = _score_candidate(candidate, clean_query, locations, core_keywords, target_year)
        if scored is None:
            reason = candidate.pop("_rejection_reason", "not_relevant")
            excluded_counts[reason] = excluded_counts.get(reason, 0) + 1
            continue
        scored_results.append(scored)

    scored_results.sort(key=lambda item: (
        -item["relevance_score"],
        -len(item["providers"]),
        item["source_tier"],
        min(item["provider_ranks"].values(), default=99),
        item["href"],
    ))

    diverse_results = _select_diverse_results(scored_results, num_results, excluded_counts)

    return diverse_results, excluded_counts, len(merged_by_url), len(scored_results)


def _serper_enrich_limit() -> int:
    # Disabled by default: live measurements showed no extra content for some
    # sites while adding multiple seconds. Backends can opt in to quality mode.
    raw_value = os.getenv("SERPER_ENRICH_LIMIT", "0").strip()
    try:
        value = int(raw_value)
    except ValueError:
        value = 4
    return min(8, max(0, value))


def _enrich_serper_only_references(references, exa_api_key, timeout):
    """Add bounded article text to high-ranked Serper-only results in one request."""
    limit = _serper_enrich_limit()
    targets = [
        reference for reference in references
        if reference.get("providers") == ["serper"]
    ][:limit]
    diagnostic = {
        "configured": bool(exa_api_key),
        "attempted": bool(exa_api_key and targets),
        "status": "not_needed",
        "requested": len(targets),
        "enriched": 0,
        "elapsed_seconds": 0.0,
        "error": None,
    }
    if not targets:
        return diagnostic
    if not exa_api_key:
        diagnostic["status"] = "not_configured"
        return diagnostic

    started = time.perf_counter()
    try:
        data = fetch_exa_contents(
            [target["href"] for target in targets],
            exa_api_key,
            timeout=min(5.0, timeout),
        )
        content_by_url = {}
        for item in data.get("results", []):
            if not isinstance(item, dict):
                continue
            content = str(item.get("text") or "").strip()[:MAX_SNIPPET_CHARACTERS]
            if not content:
                continue
            for url_value in (item.get("url"), item.get("id")):
                canonical_url = canonicalize_url(url_value)
                if canonical_url:
                    content_by_url[canonical_url] = content

        for target in targets:
            content = content_by_url.get(canonicalize_url(target["href"]))
            if not content:
                continue
            target["snippet"] = content
            target["content_source"] = "exa_contents"
            diagnostic["enriched"] += 1
        diagnostic["status"] = "success"
    except Exception as error:  # optional hydration must not discard valid search results
        diagnostic["status"] = "error"
        diagnostic["error"] = _safe_error_code(error)
    diagnostic["elapsed_seconds"] = round(time.perf_counter() - started, 3)
    return diagnostic


def hydrate_references_with_jina(
    references: list[dict], max_results: int = 6, budget_seconds: float = 3.0
) -> dict:
    """Best-effort full-text hydration for thin HTML evidence without reordering IDs."""
    enabled = os.getenv("ENABLE_JINA_HYDRATION", "1").strip().lower() not in {"0", "false", "no"}
    targets = [
        reference for reference in references
        if (
            len(str(reference.get("snippet", ""))) < 1200
            or reference.get("content_source") == "serper_snippet"
        )
        and not _is_document_result(
            reference.get("href", ""), reference.get("title", ""), reference.get("snippet", "")
        )
    ][:max(0, int(max_results))]
    diagnostic = {
        "enabled": enabled,
        "attempted": False,
        "status": "not_needed",
        "requested": len(targets),
        "hydrated": 0,
        "elapsed_seconds": 0.0,
        "errors": [],
    }
    if not enabled or not targets or budget_seconds < 0.5:
        diagnostic["status"] = "disabled" if not enabled else "skipped_budget" if targets else "not_needed"
        return diagnostic

    diagnostic["attempted"] = True
    started = time.perf_counter()
    timeout = min(3.0, max(0.5, float(budget_seconds)))

    def hydrate(reference):
        request_started = time.perf_counter()
        try:
            response = get_session().get(
                f"https://r.jina.ai/{reference['href']}",
                headers={"Accept": "text/plain", "X-Retain-Images": "none"},
                timeout=split_timeout(timeout),
            )
            response.raise_for_status()
            content = str(response.text or "")
            content = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", content)
            content = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", content)
            content = re.sub(r"\s+", " ", content).strip()[:3000]
            if len(content) < 200:
                return reference, None, time.perf_counter() - request_started, "EMPTY_CONTENT"
            return reference, content, time.perf_counter() - request_started, None
        except Exception as error:
            return reference, None, time.perf_counter() - request_started, _safe_error_code(error)

    with concurrent.futures.ThreadPoolExecutor(max_workers=min(6, len(targets))) as executor:
        futures = [executor.submit(hydrate, reference) for reference in targets]
        for future in concurrent.futures.as_completed(futures):
            reference, content, elapsed, error_code = future.result()
            if error_code:
                diagnostic["errors"].append(error_code)
                continue
            if len(content) > len(str(reference.get("snippet", ""))):
                reference["snippet_original_length"] = len(str(reference.get("snippet", "")))
                reference["snippet"] = content
                reference["content_source"] = "jina_reader"
                reference["hydration_seconds"] = round(elapsed, 3)
                diagnostic["hydrated"] += 1

    diagnostic["elapsed_seconds"] = round(time.perf_counter() - started, 3)
    if diagnostic["hydrated"]:
        diagnostic["status"] = "success"
    elif diagnostic["errors"]:
        diagnostic["status"] = "error"
    else:
        diagnostic["status"] = "no_improvement"
    return diagnostic


def rerank_references_for_analysis(references: list[dict], claim: str, limit: int = 8) -> tuple[list[dict], dict]:
    """Fast lexical/provenance reranker that reduces analyzer context without another model call."""
    started = time.perf_counter()
    claim_terms = set(_meaningful_terms(claim))
    ranked = []
    tier_bonus = {"A": 12, "B": 9, "C": 5, "D": 6, "E": 0}
    for original_rank, reference in enumerate(references, start=1):
        text = f"{reference.get('title', '')} {reference.get('snippet', '')}"
        reference_terms = set(_meaningful_terms(text))
        overlap = claim_terms & reference_terms
        coverage = len(overlap) / max(1, len(claim_terms))
        score = float(reference.get("relevance_score", 0))
        score += min(28.0, coverage * 28.0)
        score += tier_bonus.get(str(reference.get("source_tier", "E")), 0)
        score += min(8, len(reference.get("direct_evidence_signals", [])) * 4)
        score += min(6, len(reference.get("authority_topic_matches", [])) * 3)
        score += 3 if len(str(reference.get("snippet", ""))) >= 800 else 0
        reference["rerank_score"] = round(score, 3)
        reference["rerank_matched_terms"] = sorted(overlap)[:12]
        reference["retrieval_rank"] = original_rank
        ranked.append(reference)

    ranked.sort(key=lambda item: (
        -item["rerank_score"],
        item.get("retrieval_rank", 999),
        item.get("href", ""),
    ))
    selected = []
    domain_counts = {}
    for reference in ranked:
        domain = reference.get("source_domain", "")
        if domain_counts.get(domain, 0) >= 2:
            continue
        domain_counts[domain] = domain_counts.get(domain, 0) + 1
        selected.append(reference)
        if len(selected) >= max(1, int(limit)):
            break
    return selected, {
        "input_count": len(references),
        "output_count": len(selected),
        "elapsed_seconds": round(time.perf_counter() - started, 3),
        "method": "thai_token_overlap_plus_provenance",
    }


def _safe_error_code(error: Exception) -> str:
    if isinstance(error, requests.Timeout):
        return "TIMEOUT"
    if isinstance(error, requests.HTTPError):
        response = getattr(error, "response", None)
        status_code = getattr(response, "status_code", None)
        return f"HTTP_{status_code}" if status_code else "HTTP_ERROR"
    if isinstance(error, requests.RequestException):
        return "NETWORK_ERROR"
    if isinstance(error, ValueError):
        return "INVALID_RESPONSE"
    return type(error).__name__


def _new_provider_status(configured: bool, request_count: int) -> dict:
    return {
        "configured": configured,
        "attempted": bool(configured and request_count),
        "status": "pending" if configured else "not_configured",
        "request_count": request_count,
        "successful_requests": 0,
        "failed_requests": 0,
        "optional_request_count": 0,
        "optional_successful_requests": 0,
        "optional_failed_requests": 0,
        "raw_result_count": 0,
        "elapsed_seconds": 0.0,
        "errors": [],
        "request_details": [],
    }


def _adaptive_search_enabled() -> bool:
    return os.getenv("ENABLE_ADAPTIVE_SEARCH", "1").strip().lower() not in {"0", "false", "no"}


def search_news_references_with_diagnostics(
    query: str,
    locations: list,
    core_keywords: list,
    target_year: str,
    num_results: int = 10,
    source_url: str = "",
    deadline_seconds: float = None,
    allow_adaptive: bool | None = None,
) -> dict:
    """Search both providers and return references plus machine-readable status."""
    total_started = time.perf_counter()
    clean_query = str(query or "").replace('"', "").replace("'", "").strip()
    adaptive_enabled = _adaptive_search_enabled() if allow_adaptive is None else bool(allow_adaptive)
    if not clean_query or clean_query == "SKIP_SEARCH":
        return {
            "status": "SKIPPED",
            "completed": clean_query == "SKIP_SEARCH",
            "full_provider_coverage": False,
            "references": [],
            "provider_status": {},
            "content_enrichment": {
                "configured": False, "attempted": False, "status": "not_needed",
                "requested": 0, "enriched": 0, "elapsed_seconds": 0.0, "error": None,
            },
            "adaptive_search": {
                "enabled": adaptive_enabled, "attempted": False,
                "status": "not_needed", "trigger": None, "raw_result_count": 0,
                "elapsed_seconds": 0.0, "error": None,
            },
            "counts": {"raw": 0, "deduplicated": 0, "relevant": 0, "returned": 0},
            "query_plan": [],
            "excluded_counts": {},
            "elapsed_seconds": round(time.perf_counter() - total_started, 3),
        }

    exa_api_key = _get_api_key("EXA_API_KEY")
    serper_api_key = _get_api_key("SERPER_API_KEY")
    timeout = _search_timeout_seconds()
    if deadline_seconds is not None:
        timeout = min(timeout, max(2.0, float(deadline_seconds)))
    enhanced_query = _compose_enhanced_query(clean_query, core_keywords, locations)

    exa_official_payload = {
        "query": enhanced_query,
        "type": "fast",
        "numResults": 20,
        "includeDomains": list(dict.fromkeys([
            "go.th", "*.go.th", "ac.th", "*.ac.th",
            *FACT_CHECK_DOMAINS,
            *FOREIGN_GOVERNMENT_DOMAINS,
            *INTERNATIONAL_ORGANIZATION_DOMAINS,
            *REGULATORY_ORGANIZATION_DOMAINS,
        ])),
        "contents": {
            "highlights": True,
            "text": {"maxCharacters": MAX_SNIPPET_CHARACTERS},
        },
    }
    exa_media_payload = {
        "query": clean_query,
        "type": "fast",
        "numResults": 30,
        "includeDomains": TRUSTED_MEDIA_DOMAINS,
        "contents": {
            "highlights": True,
            "text": {"maxCharacters": MAX_SNIPPET_CHARACTERS},
        },
    }
    serper_payload = {
        # Keep the domain-restricted query compact: Serper/Google rejected
        # longer formal-synonym expansions combined with the site operator.
        "q": f"{clean_query} site:go.th",
        "gl": "th",
        "hl": "th",
        "num": 10,
    }
    serper_verify_payload = {
        "q": build_verification_query(clean_query),
        "gl": "th",
        "hl": "th",
        "num": 20,
    }
    serper_news_payload = {
        "q": clean_query,
        "gl": "th",
        "hl": "th",
        "num": 20,
    }
    query_plan = [
        {"provider": "exa", "kind": "official", "query": enhanced_query, "configured": bool(exa_api_key)},
        {"provider": "exa", "kind": "media", "query": clean_query, "configured": bool(exa_api_key)},
        {"provider": "serper", "kind": "official", "query": serper_payload["q"], "configured": bool(serper_api_key)},
        {
            "provider": "serper", "kind": "verification",
            "query": serper_verify_payload["q"], "configured": bool(serper_api_key),
        },
    ]
    if adaptive_enabled:
        query_plan.append({
            "provider": "serper", "kind": "news",
            "query": serper_news_payload["q"], "configured": bool(serper_api_key),
        })

    tasks = []
    if exa_api_key:
        tasks.extend([
            ("exa", "official", fetch_exa_api, exa_official_payload, exa_api_key),
            ("exa", "media", fetch_exa_api, exa_media_payload, exa_api_key),
        ])
    if serper_api_key:
        tasks.extend([
            ("serper", "official", fetch_serper_api, serper_payload, serper_api_key),
            ("serper", "verification", fetch_serper_api, serper_verify_payload, serper_api_key),
        ])
        if adaptive_enabled:
            tasks.append(
                ("serper", "news", fetch_serper_news, serper_news_payload, serper_api_key)
            )

    provider_status = {
        "exa": _new_provider_status(bool(exa_api_key), 2 if exa_api_key else 0),
        "serper": _new_provider_status(
            bool(serper_api_key),
            (2 + int(adaptive_enabled)) if serper_api_key else 0,
        ),
    }
    raw_candidates = []

    def execute_task(provider, query_kind, function, payload, api_key):
        started = time.perf_counter()
        try:
            results = function(payload, api_key, timeout=timeout)
            return provider, query_kind, results, time.perf_counter() - started, None
        except Exception as error:  # convert provider failures into safe diagnostics
            return provider, query_kind, [], time.perf_counter() - started, error

    if tasks:
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(tasks)) as executor:
            future_map = {
                executor.submit(execute_task, *task): (task[0], task[1])
                for task in tasks
            }
            for future in concurrent.futures.as_completed(future_map):
                provider, query_kind = future_map[future]
                try:
                    _, _, results, elapsed, error = future.result()
                    provider_status[provider]["elapsed_seconds"] = max(
                        provider_status[provider]["elapsed_seconds"], elapsed
                    )
                    if error is not None:
                        error_code = _safe_error_code(error)
                        provider_status[provider]["failed_requests"] += 1
                        provider_status[provider]["errors"].append(error_code)
                        provider_status[provider]["request_details"].append({
                            "kind": query_kind, "status": "error",
                            "elapsed_seconds": round(elapsed, 3), "error": error_code,
                            "raw_result_count": 0,
                        })
                        continue
                    provider_status[provider]["successful_requests"] += 1
                    provider_status[provider]["raw_result_count"] += len(results)
                    provider_status[provider]["request_details"].append({
                        "kind": query_kind, "status": "success",
                        "elapsed_seconds": round(elapsed, 3), "error": None,
                        "raw_result_count": len(results),
                    })
                    if provider == "exa":
                        raw_candidates.extend(_normalize_exa_results(results, query_kind))
                    else:
                        raw_candidates.extend(_normalize_serper_results(results, query_kind))
                except Exception as error:  # provider boundary: diagnostics must survive any client failure
                    error_code = _safe_error_code(error)
                    provider_status[provider]["failed_requests"] += 1
                    provider_status[provider]["errors"].append(error_code)
                    provider_status[provider]["request_details"].append({
                        "kind": query_kind, "status": "error",
                        "elapsed_seconds": 0.0, "error": error_code,
                        "raw_result_count": 0,
                    })

    initial_successful_requests = sum(
        status["successful_requests"] for status in provider_status.values()
    )
    adaptive_search = {
        "enabled": adaptive_enabled,
        "attempted": False,
        "status": "not_needed",
        "trigger": None,
        "raw_result_count": 0,
        "elapsed_seconds": 0.0,
        "error": None,
    }
    if initial_successful_requests > 0:
        preliminary_refs, _, _, _ = _process_results(
            raw_candidates, clean_query, locations, core_keywords, target_year,
            num_results, source_url,
        )
        top_score = preliminary_refs[0]["relevance_score"] if preliminary_refs else 0
        preliminary_domains = {
            reference.get("source_domain") for reference in preliminary_refs
            if reference.get("source_domain")
        }
        needs_second_wave = (
            len(preliminary_refs) < 8
            or len(preliminary_domains) < 3
            or top_score < 45
        )
        deadline_allows = (
            deadline_seconds is None
            or (deadline_seconds - (time.perf_counter() - total_started)) >= 2.0
        )
        if adaptive_enabled and serper_api_key and needs_second_wave and deadline_allows:
            adaptive_search["attempted"] = True
            if len(preliminary_refs) < 8:
                adaptive_search["trigger"] = "low_result_count"
            elif len(preliminary_domains) < 3:
                adaptive_search["trigger"] = "low_publisher_diversity"
            else:
                adaptive_search["trigger"] = "low_top_score"
            broad_payload = {"q": enhanced_query, "gl": "th", "hl": "th", "num": 20}
            query_plan.append({
                "provider": "serper", "kind": "broad", "query": enhanced_query,
                "configured": True,
            })
            provider_status["serper"]["optional_request_count"] += 1
            started = time.perf_counter()
            try:
                broad_results = fetch_serper_api(
                    broad_payload, serper_api_key, timeout=min(timeout, 4.0)
                )
                elapsed = time.perf_counter() - started
                normalized_broad = _normalize_serper_results(broad_results, "broad")
                raw_candidates.extend(normalized_broad)
                provider_status["serper"]["optional_successful_requests"] += 1
                provider_status["serper"]["raw_result_count"] += len(broad_results)
                provider_status["serper"]["elapsed_seconds"] = max(
                    provider_status["serper"]["elapsed_seconds"], elapsed
                )
                provider_status["serper"]["request_details"].append({
                    "kind": "broad", "status": "success",
                    "elapsed_seconds": round(elapsed, 3), "error": None,
                    "raw_result_count": len(broad_results),
                })
                adaptive_search.update({
                    "status": "success", "raw_result_count": len(broad_results),
                    "elapsed_seconds": round(elapsed, 3),
                })
            except Exception as error:
                elapsed = time.perf_counter() - started
                error_code = _safe_error_code(error)
                provider_status["serper"]["optional_failed_requests"] += 1
                provider_status["serper"]["errors"].append(error_code)
                provider_status["serper"]["request_details"].append({
                    "kind": "broad", "status": "error",
                    "elapsed_seconds": round(elapsed, 3), "error": error_code,
                    "raw_result_count": 0,
                })
                adaptive_search.update({
                    "status": "error", "elapsed_seconds": round(elapsed, 3),
                    "error": error_code,
                })
        elif needs_second_wave and not deadline_allows:
            adaptive_search.update({"status": "skipped_deadline", "trigger": "deadline"})

    for status in provider_status.values():
        if not status["configured"]:
            continue
        if status["successful_requests"] == status["request_count"]:
            status["status"] = "success"
        elif status["successful_requests"] > 0:
            status["status"] = "partial"
        else:
            status["status"] = "error"
        status["elapsed_seconds"] = round(status["elapsed_seconds"], 3)

    successful_requests = sum(status["successful_requests"] for status in provider_status.values())
    full_provider_coverage = all(
        provider_status[provider]["status"] == "success" for provider in ("exa", "serper")
    )

    if successful_requests == 0:
        references = []
        excluded_counts = {}
        deduplicated_count = 0
        relevant_count = 0
        search_status = "SEARCH_ERROR"
        completed = False
        content_enrichment = {
            "configured": bool(exa_api_key), "attempted": False, "status": "not_needed",
            "requested": 0, "enriched": 0, "elapsed_seconds": 0.0, "error": None,
        }
    else:
        references, excluded_counts, deduplicated_count, relevant_count = _process_results(
            raw_candidates,
            clean_query,
            locations,
            core_keywords,
            target_year,
            num_results,
            source_url,
        )
        completed = True
        content_enrichment = _enrich_serper_only_references(references, exa_api_key, timeout)
        if content_enrichment["enriched"]:
            rescored_references = [
                _score_candidate(reference, clean_query, locations, core_keywords, target_year)
                for reference in references
            ]
            references = [reference for reference in rescored_references if reference is not None]
            references.sort(key=lambda item: (
                -item["relevance_score"],
                -len(item["providers"]),
                item["source_tier"],
                min(item["provider_ranks"].values(), default=99),
                item["href"],
            ))
        if not full_provider_coverage:
            search_status = "DEGRADED"
        elif not references:
            search_status = "NO_RESULTS"
        else:
            search_status = "OK"

    return {
        "status": search_status,
        "completed": completed,
        "full_provider_coverage": full_provider_coverage,
        "references": references,
        "provider_status": provider_status,
        "content_enrichment": content_enrichment,
        "adaptive_search": adaptive_search,
        "query_plan": query_plan,
        "counts": {
            "raw": len(raw_candidates),
            "deduplicated": deduplicated_count,
            "relevant": relevant_count,
            "returned": len(references),
        },
        "excluded_counts": excluded_counts,
        "elapsed_seconds": round(time.perf_counter() - total_started, 3),
    }


def search_news_references(
    query: str,
    locations: list,
    core_keywords: list,
    target_year: str,
    num_results: int = 10,
    source_url: str = "",
) -> list:
    """Backward-compatible retrieval entry point used by the current UI."""
    return search_news_references_with_diagnostics(
        query,
        locations,
        core_keywords,
        target_year,
        num_results=num_results,
        source_url=source_url,
    )["references"]
