"""Reusable UI components and presentation helpers."""

import os
import datetime
import threading
import requests

def load_custom_css() -> str:
    """Read styles.css content to inject into frontend."""
    css_path = os.path.join(os.path.dirname(__file__), "styles.css")
    if os.path.exists(css_path):
        with open(css_path, "r", encoding="utf-8") as f:
            return f"<style>{f.read()}</style>"
    return ""


def get_score_ui_config(level):
    """Map 1-5 score to Thai label, color, background, and percentage."""
    try:
        level = int(level)
    except (ValueError, TypeError):
        return "N/A", "#94a3b8", "rgba(148, 163, 184, 0.1)", "rgba(148, 163, 184, 0.4)", "ไม่สามารถประเมินได้"
        
    if level == 5:
        return "100%", "#10b981", "rgba(16, 185, 129, 0.1)", "rgba(16, 185, 129, 0.4)", "🟢 สอดคล้องสมบูรณ์ (ข้อเท็จจริงจริง)"
    elif level == 4:
        return "75%", "#10b981", "rgba(16, 185, 129, 0.1)", "rgba(16, 185, 129, 0.4)", "🟢 สอดคล้องส่วนใหญ่ (มีเค้าความจริงสูง)"
    elif level == 3:
        return "50%", "#f59e0b", "rgba(245, 158, 11, 0.1)", "rgba(245, 158, 11, 0.4)", "🟡 ข้อมูลก้ำกึ่ง / อยู่ระหว่างตรวจสอบ / ไม่เพียงพอ"
    elif level == 2:
        return "25%", "#f97316", "rgba(249, 115, 22, 0.1)", "rgba(249, 115, 22, 0.4)", "🟠 ข้อมูลบิดเบือน / คลาดเคลื่อน / ชี้นำผิดบริบท"
    elif level == 1:
        return "0%", "#ef4444", "rgba(239, 68, 68, 0.1)", "rgba(239, 68, 68, 0.4)", "🔴 ข้อมูลเท็จ / ข่าวปลอม / ขัดแย้งสิ้นเชิง"
    return "N/A", "#94a3b8", "rgba(148, 163, 184, 0.1)", "rgba(148, 163, 184, 0.4)", "ไม่สามารถประเมินได้"


def send_telemetry_log(input_type: str, input_data: str, search_query: str, references: list, ai_result_dict: dict, process_time: float, webhook_url: str = ""):
    """Send anonymized telemetry to Google Sheets webhook asynchronously."""
    if not webhook_url:
        webhook_url = os.getenv("GSHEETS_WEBHOOK_URL", "")
    if not webhook_url:
        return

    level = str(ai_result_dict.get("score", "N/A"))
    pct_map = {"5": "95%", "4": "75%", "3": "50%", "2": "25%", "1": "10%"}
    score_log = f"ระดับ {level} ({pct_map.get(level, 'N/A')})" if level in pct_map else "N/A"
        
    short_input = input_data[:200].replace('\n', ' ') + "..." if len(input_data) > 200 else input_data.replace('\n', ' ')
    ref_details = " | ".join([f"{idx+1}. {r.get('title', '')} ({r.get('href', r.get('url', ''))})" for idx, r in enumerate(references)]) if references else "ไม่พบอ้างอิงสืบค้น"
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    payload = {
        "timestamp": current_time,
        "input_type": input_type,
        "short_input": short_input,
        "search_query": search_query,
        "ref_count": len(references),
        "ref_details": ref_details,
        "score": score_log,
        "process_time": round(process_time, 2)
    }
    threading.Thread(
        target=lambda: requests.post(webhook_url, json=payload, timeout=10, allow_redirects=True) if webhook_url else None,
        daemon=True
    ).start()
