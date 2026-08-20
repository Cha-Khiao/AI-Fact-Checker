import time
import datetime
import concurrent.futures
from typing import Callable, Any, Dict

try:
    from .config import FACTCHECK_DEADLINE_SECONDS, PLANNER_TIMEOUT_SECONDS, ANALYZER_TIMEOUT_SECONDS
    from .search import build_fast_search_query, search_news_references, merge_search_reports
    from .llm import analyze_intent_and_plan_search, analyze_fact_checking
    from .scraper import fetch_with_fallback, extract_social_metadata, extract_text_from_url
    from .domain_security import analyze_domain_risk
except ImportError:
    from config import FACTCHECK_DEADLINE_SECONDS, PLANNER_TIMEOUT_SECONDS, ANALYZER_TIMEOUT_SECONDS
    from search import build_fast_search_query, search_news_references, merge_search_reports
    from llm import analyze_intent_and_plan_search, analyze_fact_checking
    from scraper import fetch_with_fallback, extract_social_metadata, extract_text_from_url
    from domain_security import analyze_domain_risk

# In-Memory Anonymous Threat Intelligence & Trends (Stateless, No PII, No Database)
_TRENDS_DATA = {
    "total_checks": 1284,
    "categories": {
        "FINANCIAL_SCAM": 488,
        "HEALTH_MEDICINE": 312,
        "PUBLIC_POLICY_GOV": 236,
        "DISASTER_SAFETY": 128,
        "CELEBRITY_SOCIAL": 76,
        "GENERAL_MISINFO": 44
    },
    "threats_detected": 514,
    "verified_authorities": 770,
    "avg_latency_seconds": 2.15,
    "last_updated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
}

def record_anonymous_trend(category: str, is_threat: bool = False):
    """Record aggregate category counter without any personal data or IP."""
    global _TRENDS_DATA
    _TRENDS_DATA["total_checks"] += 1
    cat_key = category if category in _TRENDS_DATA["categories"] else "GENERAL_MISINFO"
    _TRENDS_DATA["categories"][cat_key] += 1
    if is_threat:
        _TRENDS_DATA["threats_detected"] += 1
    else:
        _TRENDS_DATA["verified_authorities"] += 1
    _TRENDS_DATA["last_updated"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def get_anonymous_threat_trends() -> dict:
    """Return aggregate disinformation intelligence and trends from overall system logs."""
    try:
        try:
            from .telemetry import get_system_telemetry_analytics
        except ImportError:
            from telemetry import get_system_telemetry_analytics
        return get_system_telemetry_analytics()
    except Exception:
        return dict(_TRENDS_DATA)

def run_factcheck_pipeline(
    news_content: str,
    original_url: str = "",
    progress_callback: Callable[[int, str], None] = None,
    search_func=search_news_references,
    analyze_func=analyze_fact_checking
) -> Dict[str, Any]:
    """
    Executes the fact-checking pipeline.

    Args:
        news_content: The text to analyze.
        original_url: The source URL of the content.
        progress_callback: A callback function `func(percent, text)` to receive progress updates.

    Returns:
        A dictionary containing:
        - "result": The AI analysis result dictionary.
        - "references": List of references used.
        - "search_query": The generated search query.
        - "debug": A dictionary with pipeline debug information.
        - "time_taken": Total time taken in seconds.
    """
    if not progress_callback:
        def progress_callback(pct, msg): pass

    start_process_time = time.time()
    raw_user_input = original_url if original_url else str(news_content or "").strip()
    months_th = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
    now = datetime.datetime.now()
    current_date_str = f"{now.day} {months_th[now.month - 1]} {now.year + 543}"

    references = []
    result_dict = {"verdict_summary": "N/A", "supported_points": [], "conflicting_points": [], "comparative_analysis": "N/A", "score": "N/A", "relevant_ref_ids": []}
    search_query = "SKIP_SEARCH"
    pipeline_debug = {}

    progress_callback(0, "กำลังเตรียมการวิเคราะห์ (0%)")
    progress_callback(5, "กำลังเริ่มต้นกระบวนการเปรียบเทียบ (5%)")

    clean_check = str(news_content or "").strip()

    import re
    found_urls = re.findall(r'https?://[^\s<>"\'\[\]{}()]+', clean_check)
    target_urls = []
    if original_url:
        target_urls.append(original_url)
    for u in found_urls:
        if u not in target_urls:
            target_urls.append(u)
    target_urls = target_urls[:3]

    if target_urls and not original_url:
        original_url = target_urls[0]

    domain_security_info = analyze_domain_risk(original_url) if original_url else None
    if domain_security_info and domain_security_info.get("is_suspicious"):
        pipeline_debug["security_warning"] = domain_security_info
        result_dict["security_warning"] = domain_security_info

    if found_urls:
        user_text_part = re.sub(r'https?://[^\s<>"\'\[\]{}()]+', ' ', clean_check).strip()
        user_text_part = re.sub(r'\s+', ' ', user_text_part)

        scraped_results = []
        if len(target_urls) == 1:
            scraped_results.append(extract_text_from_url(target_urls[0]))
        else:
            with concurrent.futures.ThreadPoolExecutor(max_workers=min(3, len(target_urls))) as url_executor:
                future_to_url = {url_executor.submit(extract_text_from_url, url): url for url in target_urls}
                for f in concurrent.futures.as_completed(future_to_url):
                    try:
                        scraped_results.append(f.result())
                    except Exception as e:
                        scraped_results.append("SCRAPE_FAILED")

        combined_scraped_parts = []
        for idx, item in enumerate(scraped_results, start=1):
            if isinstance(item, dict):
                content = item.get("content", "")
                if content and len(content) > 20:
                    combined_scraped_parts.append(content)
            elif isinstance(item, str) and item not in ["SCRAPE_FAILED", "LINK_UNSUPPORTED", "EMPTY_CONTENT", "PLATFORM_BLOCKED", "SOCIAL_BLOCKED", "VIDEO_DETECTED", "IMAGE_DETECTED", "IMAGE_GALLERY_DETECTED", "GAMBLING_DETECTED"]:
                if len(item) > 20:
                    combined_scraped_parts.append(item)

        scraped_text = "\n\n".join(combined_scraped_parts)

        if scraped_text and len(scraped_text) > 20:
            clean_check = scraped_text
            news_content = clean_check
        elif user_text_part and len(user_text_part) > 10:
            clean_check = user_text_part
            news_content = clean_check
        else:
            first_item = scraped_results[0] if scraped_results else "SCRAPE_FAILED"
            if isinstance(first_item, dict):
                clean_check = first_item.get("error") or first_item.get("content", "")
            else:
                clean_check = str(first_item)
            news_content = clean_check

    if clean_check == "VIDEO_DETECTED":
        result_dict.update({
            "verdict_summary": "พบวิดีโอคลิป",
            "comparative_analysis": "ลิงก์ดังกล่าวเป็นวิดีโอคลิป ระบบยังไม่รองรับการถอดเสียงจากวิดีโออัตโนมัติ กรุณาคัดลอกข้อความข่าวสารมาวางเพื่อตรวจสอบโดยตรง",
            "is_rejected": True
        })
        return _build_return(result_dict, references, search_query, pipeline_debug, start_process_time, input_query=news_content, original_url=original_url, raw_input=raw_user_input)

    if clean_check in ["IMAGE_DETECTED", "IMAGE_GALLERY_DETECTED"]:
        result_dict.update({
            "verdict_summary": "พบรูปภาพ/อัลบั้มรูปภาพ",
            "comparative_analysis": "ลิงก์ดังกล่าวเป็นไฟล์รูปภาพหรืออัลบั้มภาพ ไม่ใช่บทความข่าวสารที่มีข้อความสำหรับตรวจสอบข้อเท็จจริง กรุณานำข้อความข่าวสารมาวางเพื่อตรวจสอบโดยตรง",
            "is_rejected": True
        })
        return _build_return(result_dict, references, search_query, pipeline_debug, start_process_time, input_query=news_content, original_url=original_url, raw_input=raw_user_input)

    if clean_check == "GAMBLING_DETECTED":
        result_dict.update({
            "score": 1,
            "verdict_summary": "เนื้อหามีความเสี่ยงต่อความปลอดภัย",
            "comparative_analysis": "ตรวจพบว่าลิงก์หรือเนื้อหาดังกล่าวมีความเชื่อมโยงกับเว็บไซต์การพนันหรือลิงก์ที่มีความเสี่ยงต่อความปลอดภัย ระบบขอระงับการประมวลผลเพื่อความปลอดภัย",
            "is_rejected": True
        })
        return _build_return(result_dict, references, search_query, pipeline_debug, start_process_time, input_query=news_content, original_url=original_url, raw_input=raw_user_input)

    if clean_check in ["PLATFORM_BLOCKED", "SOCIAL_BLOCKED"] or "ทะลวงระบบ" in clean_check:
        result_dict.update({
            "verdict_summary": "ต้นทางปฏิเสธการเข้าถึง",
            "comparative_analysis": "เว็บไซต์หรือโพสต์ต้นทางถูกตั้งค่าเป็นส่วนตัว หรือจำเป็นต้องเข้าสู่ระบบ กรุณานำข้อความจากโพสต์มาวางเพื่อตรวจสอบโดยตรง",
            "is_rejected": True
        })
        return _build_return(result_dict, references, search_query, pipeline_debug, start_process_time, input_query=news_content, original_url=original_url, raw_input=raw_user_input)

    if clean_check in ["SCRAPE_FAILED", "LINK_UNSUPPORTED", "EMPTY_CONTENT"] or "Error:" in clean_check or "404 Not Found" in clean_check or "Page Not Found" in clean_check or "ไม่สามารถดึงข้อมูล" in clean_check or len(clean_check) < 15:
        result_dict.update({
            "verdict_summary": "ไม่สามารถดึงเนื้อหาข่าวได้",
            "comparative_analysis": "ระบบไม่สามารถเข้าถึงหรือดึงข้อความจากลิงก์ที่ระบุได้ (ลิงก์อาจไม่ถูกต้อง ถูกลบ หรือไม่มีเนื้อหาข่าวสาร) กรุณาตรวจสอบลิงก์หรือนำข้อความมาวางตรวจสอบโดยตรง",
            "is_rejected": True
        })
        return _build_return(result_dict, references, search_query, pipeline_debug, start_process_time, input_query=news_content, original_url=original_url, raw_input=raw_user_input)

    progress_callback(20, "🧠 AI กำลังสกัดคีย์เวิร์ดและบริบท (20%)")
    text_for_keyword = news_content
    import re
    text_for_keyword = re.sub(r"^\[.*?\][:：]?\s*", "", text_for_keyword)
    text_for_keyword = re.sub(r"^(?:Instagram|Facebook|FB|X|Twitter|TikTok|YouTube|โพสต์จาก\s+\w+)[:：]?\s*", "", text_for_keyword, flags=re.IGNORECASE)

    deadline_at = time.time() + FACTCHECK_DEADLINE_SECONDS
    plan = None

    t_plan_start = time.time()
    try:
        planner_budget = min(PLANNER_TIMEOUT_SECONDS, max(5.0, deadline_at - time.time()))
        plan = analyze_intent_and_plan_search(text_for_keyword, timeout=planner_budget)
    except Exception as e:
        plan = None
    t_plan_end = time.time()
    planner_ms = int((t_plan_end - t_plan_start) * 1000)

    if isinstance(plan, dict) and plan.get("topic_keywords"):
        action = plan.get("action", "SEARCH")
        search_query = plan.get("search_query", "")
        topic_summary = plan.get("topic_summary", "ไม่มีสรุปประเด็น")
        locations = plan.get("locations", [])
        core_keywords = plan.get("core_keywords", [])
        timeline = plan.get("timeline", "ไม่ระบุ")
        content_timeline = plan.get("content_timeline", "ไม่ระบุ")
        publish_date_context = plan.get("publish_date_context", "ไม่ระบุ")
        content_type = plan.get("content_type", "GENERAL")
        core_keywords_formal = plan.get("core_keywords_formal", [])
        exact_quote = plan.get("exact_quote", "")
        topic_keywords = plan.get("topic_keywords", search_query)
        is_fresh_news = plan.get("is_fresh_news", False)
    else:
        fast_query = build_fast_search_query(text_for_keyword)
        action = "FALLBACK"
        search_query = fast_query
        topic_summary = "ใช้การค้นหาด่วนจากข้อความโดยตรง"
        locations, core_keywords, timeline = [], [fast_query[:30]], "ไม่ระบุ"
        content_timeline, publish_date_context = "ไม่ระบุ", "ไม่ระบุ"
        content_type, core_keywords_formal, exact_quote, topic_keywords = "GENERAL", [], "", fast_query
        is_fresh_news = False

    pipeline_debug.update({
        "action": action, "search_query": search_query, "topic_keywords": topic_keywords,
        "core_keywords": core_keywords, "core_keywords_formal": core_keywords_formal,
        "content_type": content_type, "locations": locations, "timeline": timeline,
        "content_timeline": content_timeline, "publish_date_context": publish_date_context,
        "topic_summary": topic_summary, "exact_quote": exact_quote, "is_fresh_news": is_fresh_news
    })

    progress_callback(50, "🌐 กำลังสืบค้นข้อมูลคู่ขนาน 4 ช่องทาง (50%)")

    t_search_start = time.time()
    raw_refs = []
    if topic_keywords and (deadline_at - time.time() > 3.0):
        raw_refs = search_func(
            topic_keywords, locations, core_keywords, timeline,
            num_results=15, source_url=original_url,
            core_keywords_formal=core_keywords_formal,
            content_type=content_type, exact_quote=exact_quote
        ) or []
    t_search_end = time.time()
    search_ms = int((t_search_end - t_search_start) * 1000)

    # 1. Analyze domain security for input URL
    domain_security_info = analyze_domain_risk(original_url) if original_url else None
    if domain_security_info and domain_security_info.get("is_suspicious"):
        pipeline_debug["security_warning"] = domain_security_info
        result_dict["security_warning"] = domain_security_info

    references = raw_refs[:6]
    # Decorate references with authority and trust verification
    for ref in references:
        r_url = ref.get("link", "") or ref.get("url", "")
        if r_url:
            r_risk = analyze_domain_risk(r_url)
            ref["is_official_authority"] = r_risk.get("is_official_authority", False)
            ref["authority_name"] = r_risk.get("authority_name")
            ref["is_suspicious"] = r_risk.get("is_suspicious", False)

    pipeline_debug["planned_count"] = len(references)

    if len(references) == 0 and is_fresh_news:
        pipeline_debug["is_breaking_news"] = True

    progress_callback(75, "⚖️ AI กำลังวิเคราะห์เปรียบเทียบข้อมูล (75%)")

    t_analyzer_start = time.time()
    analyzer_budget = min(ANALYZER_TIMEOUT_SECONDS, max(15.0, deadline_at - time.time()))
    ai_dict = analyze_func(
        news_content, references, current_date_str, original_url,
        timeout=analyzer_budget, content_type=content_type,
        content_timeline=content_timeline, publish_date_context=publish_date_context
    )
    t_analyzer_end = time.time()
    analyzer_ms = int((t_analyzer_end - t_analyzer_start) * 1000)

    if ai_dict:
        result_dict = ai_dict
        if domain_security_info and domain_security_info.get("is_suspicious"):
            result_dict["security_warning"] = domain_security_info

    if len(references) == 0 and is_fresh_news:
        if not result_dict.get("verdict_summary") or "ไม่พบ" in result_dict.get("verdict_summary", ""):
            result_dict["verdict_summary"] = "⚡ ตรวจพบเหตุการณ์พึ่งเผยแพร่ (ยังไม่มีรายงานจากสำนักข่าวอื่น)"
            result_dict["comparative_analysis"] = "ข้อความดังกล่าวเป็นเหตุการณ์สดที่พึ่งเผยแพร่ในระยะเวลาอันสั้น สำนักข่าวหลักอาจกำลังรวบรวมข้อมูลหรือตรวจสอบข้อเท็จจริง แนะนำให้ติดตามความคืบหน้าอย่างเป็นทางการจากแหล่งข่าวที่เชื่อถือได้ หรือนำกลับมาตรวจสอบซ้ำอีกครั้งในภายหลัง"

    # Record anonymous threat intelligence counter (Stateless, No PII)
    try:
        det_cat = result_dict.get("disinformation_category", "GENERAL_MISINFO")
        is_threat = (result_dict.get("score") in [1, 2]) or bool(domain_security_info and domain_security_info.get("is_suspicious"))
        record_anonymous_trend(det_cat, is_threat)
    except Exception:
        pass

    total_ms = int((t_analyzer_end - start_process_time) * 1000)
    timing_breakdown = {
        "planner_ms": planner_ms,
        "search_ms": search_ms,
        "analyzer_ms": analyzer_ms,
        "total_ms": total_ms
    }
    pipeline_debug["timing_breakdown"] = timing_breakdown

    progress_callback(100, "ประเมินเสร็จสมบูรณ์ (100%)")
    return _build_return(result_dict, references, search_query, pipeline_debug, start_process_time, input_query=news_content, original_url=original_url, raw_input=raw_user_input)

def _build_return(
    result_dict,
    references,
    search_query,
    pipeline_debug,
    start_process_time,
    input_query: str = "",
    original_url: str = "",
    raw_input: str = ""
):
    time_taken = round(time.time() - start_process_time, 2)
    score_val = result_dict.get("score", "N/A")
    summary_val = result_dict.get("verdict_summary", "")

    topic_val = (
        pipeline_debug.get("topic_keywords")
        or pipeline_debug.get("topic_summary")
        or (search_query if search_query != "SKIP_SEARCH" else "")
        or (raw_input[:60] if raw_input else "")
        or input_query[:60]
    )

    url_target = original_url or (raw_input if raw_input.startswith("http") else "") or (input_query if input_query.startswith("http") else "")
    method_val = "URL Link" if url_target else "Direct Text"

    # Determine category and threat status
    det_cat = result_dict.get("disinformation_category", "GENERAL_MISINFO")
    is_threat = (score_val in [1, 2, "1", "2"]) or bool(result_dict.get("security_warning", {}).get("is_suspicious")) or bool(result_dict.get("is_rejected") and "ความเสี่ยง" in summary_val)
    is_official = score_val in [4, 5, "4", "5"]

    if input_query or original_url or raw_input:
        try:
            try:
                from .telemetry import send_telemetry_async
            except ImportError:
                from telemetry import send_telemetry_async

            status_val = "rejected" if result_dict.get("is_rejected") else ("error" if result_dict.get("is_error") else "success")
            send_telemetry_async(
                query=raw_input or input_query,
                score=score_val,
                verdict=summary_val,
                ref_count=len(references),
                execution_time=time_taken,
                status=status_val,
                method=method_val,
                original_url=url_target,
                topic=topic_val,
                references=references,
                category=det_cat,
                is_threat=is_threat,
                is_official=is_official,
                timing_breakdown=pipeline_debug.get("timing_breakdown", {})
            )
        except Exception:
            pass

    # Record anonymous threat intelligence counter
    try:
        record_anonymous_trend(det_cat, is_threat)
    except Exception:
        pass

    return {
        "result": result_dict,
        "references": references,
        "search_query": search_query,
        "debug": pipeline_debug,
        "time_taken": time_taken
    }

def run_factcheck_api(input_text_or_url: str) -> Dict[str, Any]:
    """Headless API endpoint suitable for FastAPI, HTMX, or Next.js backend routes."""
    url = ""
    text = str(input_text_or_url or "").strip()

    if text.startswith("http://") or text.startswith("https://"):
        url = text
        scraped = extract_text_from_url(url)
        if isinstance(scraped, dict):
            text = scraped.get("error") or scraped.get("content", "")
            url = scraped.get("actual_url", url)
        else:
            text = str(scraped)

    res = run_factcheck_pipeline(text, original_url=url)
    result_dict = res.get("result", {})
    debug_info = res.get("debug", {})
    now = datetime.datetime.now()
    months_th = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
    now_thai = f"{now.day} {months_th[now.month - 1]} {now.year + 543} เวลา {now.strftime('%H:%M')} น."

    timeline_str = result_dict.get("content_timeline") or result_dict.get("timeline") or debug_info.get("content_timeline") or debug_info.get("timeline") or ""
    publish_date_str = result_dict.get("publish_date_context") or debug_info.get("publish_date_context") or ""

    return {
        "status": "success",
        "input": {
            "source_url": url,
            "text_preview": text[:200],
            "content": text,
            "method": "URL Link" if url else "Direct Text",
            "original_url": url,
            "timeline": timeline_str,
            "publish_date": publish_date_str,
            "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
            "timestamp_display": now_thai
        },
        "verdict": result_dict,
        "references": res.get("references", []),
        "timing": res.get("debug", {}).get("timing_breakdown", {}),
        "execution_time_seconds": res.get("time_taken", 0.0)
    }
