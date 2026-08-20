"""FastAPI Headless REST & Streaming API Server for Fact-Checker.

Ready for Next.js, Mobile Apps, or Cloud Deployment (Docker / Cloud Run).
Run with: uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
"""

import sys
import os

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

import json
import queue
import threading
import time
from typing import Optional, Generator

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from core.pipeline import run_factcheck_api, run_factcheck_pipeline, get_anonymous_threat_trends

app = FastAPI(
    title="AI Fact-Checker API",
    description="Stateless Headless Fact-Checking Engine for Thai News & Claims with Realtime SSE Streaming",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.middleware("http")
async def add_authorship_watermark_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Author"] = "Computer Science, Sisaket Rajabhat University"
    response.headers["X-Project"] = "AI Fact-Checker (Senior Capstone Project)"
    response.headers["X-Affiliation"] = "Sisaket Rajabhat University"
    return response


class FactCheckRequest(BaseModel):
    input: str = Field(..., description="Text claim or URL to fact-check (Max 1,500 chars, up to 3 URLs)", min_length=1, max_length=1500)

class FactCheckResponse(BaseModel):
    status: str
    input: dict
    verdict: dict
    references: list
    timing: dict
    execution_time_seconds: float

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "AI Fact-Checker API",
        "version": "2.0.0",
        "docs_url": "/docs"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "engine": "stateless_factchecker"
    }

@app.get("/api/trends")
def trends():
    """Return anonymous aggregate disinformation category intelligence and threat trends."""
    return get_anonymous_threat_trends()

@app.get("/api/team")
@app.get("/api/credits")
def team_credits():
    """Secret Easter Egg endpoint containing project creators and affiliation."""
    return {
        "project": "AI Fact-Checker",
        "repository": "https://github.com/Cha-Khiao/AI-Fact-Checker.git",
        "description": "Stateless Real-time Multi-Agent Fact-Checking Engine",
        "institution": "Sisaket Rajabhat University (มหาวิทยาลัยราชภัฏศรีสะเกษ)",
        "department": "Computer Science (สาขาวิชาวิทยาการคอมพิวเตอร์)",
        "academic_year": "2569 (2026)",
        "developers": [
            {
                "id": "Prasopphol18",
                "role": "ผู้ออกแบบสถาปัตยกรรม พัฒนาระบบเต็มรูปแบบ และควบคุมการส่งมอบ",
                "title": "Lead System Architect & Full-Stack Engineer"
            },
            {
                "id": "Thanasuk13",
                "role": "ผู้ร่วมทดสอบระบบ รวบรวมข้อมูลกรณีศึกษา และสนับสนุนทีม",
                "title": "Quality Assurance & Research Supporter"
            },
            {
                "id": "Kunlanat38",
                "role": "ผู้ร่วมทดสอบระบบ รวบรวมข้อมูลกรณีศึกษา และสนับสนุนทีม",
                "title": "Quality Assurance & Research Supporter"
            }
        ]
    }


@app.post("/api/factcheck", response_model=FactCheckResponse)
def factcheck(request: FactCheckRequest):
    try:
        result = run_factcheck_api(request.input)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error_code": "INTERNAL_PIPELINE_ERROR", "message": str(e)})

@app.post("/api/factcheck/stream")
async def factcheck_stream(request: FactCheckRequest):
    """Server-Sent Events (SSE) stream for real-time progress and final verdict."""
    input_text = request.input

    def event_generator() -> Generator[str, None, None]:
        q = queue.Queue()

        def progress_cb(pct, msg):
            q.put({"type": "progress", "pct": pct, "message": msg})

        def worker():
            try:
                res = run_factcheck_pipeline(input_text, progress_callback=progress_cb)

                import datetime

                result_dict = res.get("result", {})
                score_val = result_dict.get("score", "N/A")
                score_num = int(score_val) if str(score_val).isdigit() else 3

                now = datetime.datetime.now()
                months_th = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
                now_thai = f"{now.day} {months_th[now.month - 1]} {now.year + 543} เวลา {now.strftime('%H:%M')} น."

                debug_info = res.get("debug", {})
                timeline_str = result_dict.get("content_timeline") or result_dict.get("timeline") or debug_info.get("content_timeline") or debug_info.get("timeline") or ""
                publish_date_str = result_dict.get("publish_date_context") or debug_info.get("publish_date_context") or ""

                api_formatted = {
                    "status": "success",
                    "input": {
                        "content": input_text,
                        "method": "Direct Text" if not input_text.startswith("http") else "URL Link",
                        "original_url": input_text if input_text.startswith("http") else "",
                        "timeline": timeline_str,
                        "publish_date": publish_date_str,
                        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
                        "timestamp_display": now_thai
                    },
                    "verdict": {
                        "score": score_num,
                        "summary": result_dict.get("verdict_summary", "ไม่มีข้อสรุป"),
                        "supported_points": result_dict.get("supported_points", []),
                        "conflicting_points": result_dict.get("conflicting_points", []),
                        "comparative_analysis": result_dict.get("comparative_analysis", ""),
                        "disinformation_category": result_dict.get("disinformation_category", "GENERAL_MISINFO"),
                        "disinformation_category_label": result_dict.get("disinformation_category_label", "ข่าวสารทั่วไป / ข่าวลือโซเชียล"),
                        "sub_claims": result_dict.get("sub_claims", []),
                        "security_warning": result_dict.get("security_warning"),
                        "is_error": result_dict.get("is_error", False),
                        "is_rejected": result_dict.get("is_rejected", False),
                        "timeline": timeline_str,
                        "publish_date": publish_date_str,
                        "timestamp_display": now_thai
                    },
                    "references": res.get("references", []),
                    "timing": res.get("debug", {}).get("timing_breakdown", {}),
                    "execution_time_seconds": res.get("time_taken", 0.0)
                }
                q.put({"type": "complete", "data": api_formatted})
            except Exception as e:
                q.put({"type": "error", "message": str(e)})

        t = threading.Thread(target=worker, daemon=True)
        t.start()

        while True:
            try:
                item = q.get(timeout=35)
                yield f"data: {json.dumps(item, ensure_ascii=False)}\n\n"
                if item.get("type") in ("complete", "error"):
                    break
            except queue.Empty:
                yield f"data: {json.dumps({'type': 'ping'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("api.main:app", host="0.0.0.0", port=port, reload=False)
