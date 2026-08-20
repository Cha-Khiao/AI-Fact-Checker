import os
import json
import time
import datetime
import threading
import requests
from typing import Optional, List, Dict, Any, Union

try:
    from .config import GSHEETS_WEBHOOK_URL, get_ai_model
except ImportError:
    from config import GSHEETS_WEBHOOK_URL, get_ai_model

def _send_telemetry_worker(
    query: str,
    score: Union[int, str],
    verdict: str,
    ref_count: int = 0,
    execution_time: float = 0.0,
    status: str = "success",
    method: str = "",
    original_url: str = "",
    topic: str = "",
    references: Optional[List[Any]] = None,
    score_formatted: str = ""
):
    """Worker function to send telemetry payload directly matching Apps Script doPost(e) schema."""
    webhook_url = GSHEETS_WEBHOOK_URL.strip(' "\'')
    if not webhook_url or not webhook_url.startswith("http"):
        return

    try:

        utc_now = datetime.datetime.now(datetime.timezone.utc)
        bkk_tz = datetime.timezone(datetime.timedelta(hours=7))
        bkk_now = utc_now.astimezone(bkk_tz)
        timestamp_str = bkk_now.strftime("%Y-%m-%d %H:%M:%S")

        raw_query_str = str(query or "").strip()
        url_candidate = str(original_url or "").strip()
        if not url_candidate and (raw_query_str.startswith("http://") or raw_query_str.startswith("https://")):
            url_candidate = raw_query_str

        input_type_val = method or ("URL Link" if url_candidate else "Direct Text")

        if url_candidate:
            short_input_val = f"[{url_candidate}]({url_candidate})"
        else:
            clean_q = raw_query_str.replace("\n", " ").strip()
            if len(clean_q) > 200:
                clean_q = clean_q[:197] + "..."
            short_input_val = clean_q

        clean_topic = str(topic or "").strip().replace("\n", " ")
        if not clean_topic or clean_topic in ["SKIP_SEARCH", "ไม่มีสรุปประเด็น", "ใช้การค้นหาด่วนจากข้อความโดยตรง"]:
            clean_topic = raw_query_str.replace("\n", " ").strip()
        if len(clean_topic) > 150:
            clean_topic = clean_topic[:147] + "..."
        search_query_val = clean_topic

        if isinstance(references, list) and references:
            ref_count_val = len(references)
        else:
            ref_count_val = int(ref_count) if str(ref_count).isdigit() else 0

        ref_strings = []
        if isinstance(references, list) and references:
            for idx, ref in enumerate(references[:6], start=1):
                if isinstance(ref, dict):
                    title = ref.get("title") or ref.get("name") or "แหล่งข่าวอ้างอิง"
                    link = ref.get("url") or ref.get("href") or ref.get("link") or ""
                    clean_title = str(title).strip().replace("\n", " ")
                    if len(clean_title) > 75:
                        clean_title = clean_title[:72] + "..."
                    if link:
                        ref_strings.append(f"{idx}. {clean_title} ({link})")
                    else:
                        ref_strings.append(f"{idx}. {clean_title}")
                elif isinstance(ref, str) and ref.strip():
                    ref_strings.append(f"{idx}. {ref.strip()}")
        ref_details_val = " | ".join(ref_strings)

        score_5tier_map = {
            5: "ระดับ 5 (100%)",
            4: "ระดับ 4 (75%)",
            3: "ระดับ 3 (50%)",
            2: "ระดับ 2 (25%)",
            1: "ระดับ 1 (0%)"
        }
        if score_formatted:
            score_val = score_formatted
        elif str(score).isdigit():
            score_val = score_5tier_map.get(int(score), f"ระดับ {score}")
        elif isinstance(score, str) and "ระดับ" in score:
            score_val = score
        else:
            score_num = int(score) if str(score).isdigit() else 3
            score_val = score_5tier_map.get(score_num, f"ระดับ {score_num}")

        dur = round(float(execution_time), 2)

        payload = {
            "timestamp": timestamp_str,
            "input_type": input_type_val,
            "short_input": short_input_val,
            "search_query": search_query_val,
            "ref_count": ref_count_val,
            "ref_details": ref_details_val,
            "score": score_val,
            "process_time": dur,

            "method": input_type_val,
            "url": short_input_val,
            "original_url": url_candidate,
            "topic": search_query_val,
            "references": ref_details_val,
            "execution_time": dur,
            "status": status
        }

        requests.post(
            webhook_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=12
        )
    except Exception:

        pass

def send_telemetry_async(
    query: str,
    score: Union[int, str],
    verdict: str,
    ref_count: int = 0,
    execution_time: float = 0.0,
    status: str = "success",
    method: str = "",
    original_url: str = "",
    topic: str = "",
    references: Optional[List[Any]] = None,
    score_formatted: str = ""
):
    """Fire-and-forget asynchronous telemetry logger for Google Sheets."""
    webhook_url = GSHEETS_WEBHOOK_URL.strip(' "\'')
    if not webhook_url:
        return

    t = threading.Thread(
        target=_send_telemetry_worker,
        args=(query, score, verdict, ref_count, execution_time, status, method, original_url, topic, references, score_formatted),
        daemon=True
    )
    t.start()
