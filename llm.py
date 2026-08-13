import requests
import json
import os
import re
import time
from datetime import datetime
from dotenv import load_dotenv
import pytz

from evaluation import apply_evidence_policy, normalize_reference_ids
from http_client import get_session, split_timeout

load_dotenv()

HOST_URL = "https://openrouter.ai"
API_URL = HOST_URL + "/api/v1/chat/completions"


def _bounded_float_env(name: str, default: float, minimum: float, maximum: float) -> float:
    """Read numeric runtime settings without letting a malformed env break imports."""
    try:
        value = float(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        value = default
    return min(maximum, max(minimum, value))

DEFAULT_AI_MODEL = "qwen/qwen3-30b-a3b"
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
AI_MODEL = os.getenv("AI_MODEL", DEFAULT_AI_MODEL).strip()
PLANNER_MODEL = os.getenv("PLANNER_MODEL", AI_MODEL).strip()
ANALYZER_MODEL = os.getenv("ANALYZER_MODEL", AI_MODEL).strip()
OPENROUTER_PROVIDER_SORT = os.getenv("OPENROUTER_PROVIDER_SORT", "throughput").strip().lower()
if OPENROUTER_PROVIDER_SORT not in {"price", "throughput", "latency"}:
    OPENROUTER_PROVIDER_SORT = "throughput"
PLANNER_PROVIDER_SORT = os.getenv("PLANNER_PROVIDER_SORT", "latency").strip().lower()
ANALYZER_PROVIDER_SORT = os.getenv(
    "ANALYZER_PROVIDER_SORT", OPENROUTER_PROVIDER_SORT
).strip().lower()
if PLANNER_PROVIDER_SORT not in {"price", "throughput", "latency"}:
    PLANNER_PROVIDER_SORT = "latency"
if ANALYZER_PROVIDER_SORT not in {"price", "throughput", "latency"}:
    ANALYZER_PROVIDER_SORT = "throughput"
PLANNER_TIMEOUT_SECONDS = _bounded_float_env("PLANNER_TIMEOUT_SECONDS", 12.0, 3.0, 30.0)
ANALYZER_TIMEOUT_SECONDS = _bounded_float_env("ANALYZER_TIMEOUT_SECONDS", 20.0, 5.0, 45.0)
ANALYZER_REFERENCE_CHARACTERS = int(
    _bounded_float_env("ANALYZER_REFERENCE_CHARACTERS", 1200.0, 500.0, 1800.0)
)
ANALYZER_TOP_REFERENCE_CHARACTERS = int(
    _bounded_float_env("ANALYZER_TOP_REFERENCE_CHARACTERS", 2500.0, 1200.0, 3500.0)
)

PLANNER_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "action": {"type": "string", "enum": ["SEARCH", "DROP"]},
        "search_query": {"type": "string"},
        "locations": {"type": "array", "items": {"type": "string"}},
        "core_keywords": {"type": "array", "items": {"type": "string"}},
        "target_year": {"type": "string"},
        "topic_summary": {"type": "string"},
    },
    "required": ["action", "search_query", "locations", "core_keywords", "target_year", "topic_summary"],
    "additionalProperties": False,
}

ANALYSIS_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "verdict_summary": {"type": "string"},
        "supported_points": {"type": "array", "items": {"type": "string"}},
        "conflicting_points": {"type": "array", "items": {"type": "string"}},
        "comparative_analysis": {"type": "string"},
        "claim_assessments": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "properties": {
                    "claim_text": {"type": "string"},
                    "verdict": {
                        "type": "string",
                        "enum": [
                            "SUPPORTED", "MOSTLY_SUPPORTED", "MIXED",
                            "MOSTLY_CONTRADICTED", "CONTRADICTED", "INSUFFICIENT_EVIDENCE",
                        ],
                    },
                    "supporting_ref_ids": {
                        "type": "array", "items": {"type": "integer", "minimum": 1},
                    },
                    "conflicting_ref_ids": {
                        "type": "array", "items": {"type": "integer", "minimum": 1},
                    },
                    "explanation": {"type": "string"},
                },
                "required": [
                    "claim_text", "verdict", "supporting_ref_ids",
                    "conflicting_ref_ids", "explanation",
                ],
                "additionalProperties": False,
            },
        },
        "relevant_ref_ids": {"type": "array", "items": {"type": "integer", "minimum": 1}},
        "verdict": {
            "type": "string",
            "enum": [
                "SUPPORTED", "MOSTLY_SUPPORTED", "MIXED",
                "MOSTLY_CONTRADICTED", "CONTRADICTED", "INSUFFICIENT_EVIDENCE",
            ],
        },
        "score": {"type": ["integer", "null"], "minimum": 1, "maximum": 5},
    },
    "required": [
        "verdict_summary", "supported_points", "conflicting_points",
        "comparative_analysis", "claim_assessments", "relevant_ref_ids", "verdict", "score",
    ],
    "additionalProperties": False,
}

try:
    import streamlit as st
    if "OPENROUTER_API_KEY" in st.secrets: OPENROUTER_API_KEY = st.secrets["OPENROUTER_API_KEY"].strip()
    if "AI_MODEL" in st.secrets: AI_MODEL = st.secrets["AI_MODEL"].strip()
    if "PLANNER_MODEL" in st.secrets: PLANNER_MODEL = st.secrets["PLANNER_MODEL"].strip()
    if "ANALYZER_MODEL" in st.secrets: ANALYZER_MODEL = st.secrets["ANALYZER_MODEL"].strip()
except Exception: pass


def get_runtime_config() -> dict:
    """Return non-secret runtime settings for diagnostics and reproducibility."""
    return {
        "planner_model": PLANNER_MODEL,
        "analyzer_model": ANALYZER_MODEL,
        "provider_sort": OPENROUTER_PROVIDER_SORT,
        "planner_provider_sort": PLANNER_PROVIDER_SORT,
        "analyzer_provider_sort": ANALYZER_PROVIDER_SORT,
        "planner_timeout_seconds": PLANNER_TIMEOUT_SECONDS,
        "analyzer_timeout_seconds": ANALYZER_TIMEOUT_SECONDS,
        "analyzer_reference_characters": ANALYZER_REFERENCE_CHARACTERS,
        "analyzer_top_reference_characters": ANALYZER_TOP_REFERENCE_CHARACTERS,
    }


def is_openrouter_configured() -> bool:
    return bool(OPENROUTER_API_KEY)

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


def _find_invalid_reference_ids(values, reference_count):
    invalid = []
    if not isinstance(values, list):
        return invalid
    for value in values:
        if not isinstance(value, int) or isinstance(value, bool):
            invalid.append(value)
        elif value < 1 or (reference_count is not None and value > reference_count):
            invalid.append(value)
    return invalid


_VERDICT_TO_SCORE = {
    "SUPPORTED": 5,
    "MOSTLY_SUPPORTED": 4,
    "MIXED": 3,
    "MOSTLY_CONTRADICTED": 2,
    "CONTRADICTED": 1,
    "INSUFFICIENT_EVIDENCE": None,
}


def _reconcile_claim_verdict(claim_verdict, supporting_ids, conflicting_ids):
    """Ensure a claim label cannot be stronger than its cited evidence IDs."""
    if supporting_ids and conflicting_ids:
        return "MIXED"
    if supporting_ids:
        if claim_verdict == "MOSTLY_SUPPORTED":
            return claim_verdict
        return "SUPPORTED"
    if conflicting_ids:
        if claim_verdict == "MOSTLY_CONTRADICTED":
            return claim_verdict
        return "CONTRADICTED"
    return "INSUFFICIENT_EVIDENCE"


def _derive_overall_verdict(claims):
    """Aggregate claim labels deterministically so the summary cannot contradict them."""
    verdicts = [claim.get("verdict") for claim in claims]
    evidenced = [value for value in verdicts if value != "INSUFFICIENT_EVIDENCE"]
    if not evidenced:
        return "INSUFFICIENT_EVIDENCE"
    support = any(value in {"SUPPORTED", "MOSTLY_SUPPORTED"} for value in evidenced)
    conflict = any(value in {"CONTRADICTED", "MOSTLY_CONTRADICTED"} for value in evidenced)
    if "MIXED" in evidenced or (support and conflict):
        return "MIXED"
    incomplete_coverage = len(evidenced) != len(verdicts)
    if support:
        if incomplete_coverage or "MOSTLY_SUPPORTED" in evidenced:
            return "MOSTLY_SUPPORTED"
        return "SUPPORTED"
    if incomplete_coverage or "MOSTLY_CONTRADICTED" in evidenced:
        return "MOSTLY_CONTRADICTED"
    return "CONTRADICTED"


def _request_error_code(error: Exception) -> str:
    if isinstance(error, requests.Timeout):
        return "TIMEOUT"
    if isinstance(error, requests.HTTPError):
        response = getattr(error, "response", None)
        status_code = getattr(response, "status_code", None)
        return f"HTTP_{status_code}" if status_code else "HTTP_ERROR"
    if isinstance(error, requests.RequestException):
        return "NETWORK_ERROR"
    if isinstance(error, (KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError)):
        return "INVALID_RESPONSE"
    return type(error).__name__

def validate_ai_response(
    parsed_dict: dict, raw_output: str = "", reference_count=None, references=None
) -> dict:
    if references is not None:
        reference_count = len(references)
    template = {
        "verdict_summary": "ไม่สามารถเปรียบเทียบข้อมูลได้",
        "supported_points": ["ไม่พบข้อมูลที่สอดคล้องกับแหล่งอ้างอิง"],
        "conflicting_points": ["ไม่พบข้อมูลที่ขัดแย้ง หรือแหล่งอ้างอิงไม่เพียงพอต่อการเปรียบเทียบ"],
        "comparative_analysis": "ระบบไม่สามารถวิเคราะห์เปรียบเทียบเชิงลึกได้อย่างสมบูรณ์",
        "claim_assessments": [],
        "score": None,
        "verdict": "INSUFFICIENT_EVIDENCE",
        "evidence_sufficiency": "INSUFFICIENT",
        "relevant_ref_ids": [],
        "system_status": "OK",
    }

    request_meta = parsed_dict.get("_request_meta", {}) if isinstance(parsed_dict, dict) else {}
    if request_meta and request_meta.get("success") is False:
        template["system_status"] = "MODEL_ERROR"
        template["comparative_analysis"] = (
            "เกิดข้อผิดพลาดในขั้นวิเคราะห์ จึงยังไม่สามารถออกผลตรวจสอบได้"
        )
        template["_request_meta"] = request_meta
        return apply_evidence_policy(template, reference_count or 0, references=references)

    if not isinstance(parsed_dict, dict) or not parsed_dict:
        template["system_status"] = "INVALID_OUTPUT"
        if raw_output:
            template["comparative_analysis"] = "โครงสร้างผลวิเคราะห์ไม่ถูกต้อง จึงงดออกคำตัดสิน"
        return apply_evidence_policy(template, reference_count or 0, references=references)

    parsed_dict = dict(parsed_dict)
    for key in template.keys():
        if key not in parsed_dict or parsed_dict[key] in [None, ""]: parsed_dict[key] = template[key]
            
    score_str = str(parsed_dict.get("score", ""))
    numbers = re.findall(r'\d+', score_str)
    parsed_dict["score"] = max(1, min(5, int(numbers[0]))) if numbers else None
    raw_relevant_ref_ids = parsed_dict.get("relevant_ref_ids", [])
    invalid_reference_ids = _find_invalid_reference_ids(
        raw_relevant_ref_ids, reference_count
    )
    parsed_dict["relevant_ref_ids"] = normalize_reference_ids(
        raw_relevant_ref_ids, reference_count=reference_count
    )

    normalized_claims = []
    claim_reference_ids = []
    conflict_detected = False
    for claim in parsed_dict.get("claim_assessments", []):
        if not isinstance(claim, dict) or not str(claim.get("claim_text", "")).strip():
            continue
        claim_verdict = str(claim.get("verdict", "INSUFFICIENT_EVIDENCE")).upper()
        if claim_verdict not in {
            "SUPPORTED", "MOSTLY_SUPPORTED", "MIXED", "MOSTLY_CONTRADICTED",
            "CONTRADICTED", "INSUFFICIENT_EVIDENCE",
        }:
            claim_verdict = "INSUFFICIENT_EVIDENCE"
        raw_supporting_ids = claim.get("supporting_ref_ids", [])
        raw_conflicting_ids = claim.get("conflicting_ref_ids", [])
        invalid_reference_ids.extend(
            _find_invalid_reference_ids(raw_supporting_ids, reference_count)
        )
        invalid_reference_ids.extend(
            _find_invalid_reference_ids(raw_conflicting_ids, reference_count)
        )
        supporting_ids = normalize_reference_ids(
            raw_supporting_ids, reference_count=reference_count
        )
        conflicting_ids = normalize_reference_ids(
            raw_conflicting_ids, reference_count=reference_count
        )
        for ref_id in supporting_ids + conflicting_ids:
            if ref_id not in claim_reference_ids:
                claim_reference_ids.append(ref_id)
        reconciled_claim_verdict = _reconcile_claim_verdict(
            claim_verdict, supporting_ids, conflicting_ids
        )
        if reconciled_claim_verdict in {"MIXED", "MOSTLY_CONTRADICTED", "CONTRADICTED"}:
            conflict_detected = True
        normalized_claims.append({
            "claim_text": str(claim["claim_text"]).strip(),
            "verdict": reconciled_claim_verdict,
            "supporting_ref_ids": supporting_ids,
            "conflicting_ref_ids": conflicting_ids,
            "explanation": str(claim.get("explanation", "")).strip(),
        })
    parsed_dict["claim_assessments"] = normalized_claims
    # Evidence must always be traceable to a claim-level support/conflict decision.
    # Do not preserve broad contextual IDs when claims are absent or malformed.
    parsed_dict["relevant_ref_ids"] = claim_reference_ids

    validation_checks = dict(parsed_dict.get("validation_checks", {}))
    validation_checks["claim_reference_ids_in_range"] = True
    validation_checks["relevant_ids_derived_from_claims"] = True
    validation_checks["invalid_reference_id_count"] = len(invalid_reference_ids)
    validation_checks["overall_conflict_guard_applied"] = False
    validation_checks["overall_verdict_reconciled"] = False
    derived_verdict = _derive_overall_verdict(normalized_claims)
    model_verdict = str(parsed_dict.get("verdict", "")).upper().strip()
    if model_verdict != derived_verdict:
        parsed_dict["verdict"] = derived_verdict
        parsed_dict["score"] = _VERDICT_TO_SCORE[derived_verdict]
        validation_checks["overall_verdict_reconciled"] = True
    if conflict_detected and model_verdict in {"SUPPORTED", "MOSTLY_SUPPORTED"}:
        validation_checks["overall_conflict_guard_applied"] = True
        parsed_dict["verdict_summary"] = (
            "พบหลักฐานทั้งสนับสนุนและขัดแย้ง จึงไม่สามารถสรุปว่าสนับสนุนทั้งหมดได้"
        )
    parsed_dict["validation_checks"] = validation_checks
    parsed_dict.pop("thought", None)

    if reference_count is not None:
        return apply_evidence_policy(parsed_dict, reference_count, references=references)
    return parsed_dict

def call_openrouter(
    prompt: str,
    system_msg: str,
    model: str = None,
    timeout: float = 20,
    max_tokens: int = 700,
    response_schema: dict = None,
    schema_name: str = "structured_response",
    provider_sort: str = None,
    retry_on_length: bool = True,
) -> dict:
    selected_model = model or AI_MODEL
    headers = {"Authorization": f"Bearer {OPENROUTER_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": selected_model,
        "messages": [{"role": "system", "content": system_msg}, {"role": "user", "content": prompt}],
        "temperature": 0.0,
        "max_tokens": max_tokens,
    }
    provider_preferences = {}
    selected_provider_sort = provider_sort or OPENROUTER_PROVIDER_SORT
    if selected_provider_sort in {"price", "throughput", "latency"}:
        provider_preferences["sort"] = selected_provider_sort
    if response_schema:
        payload["response_format"] = {
            "type": "json_schema",
            "json_schema": {"name": schema_name, "strict": True, "schema": response_schema},
        }
        provider_preferences["require_parameters"] = True
    if provider_preferences:
        payload["provider"] = provider_preferences
    started_at = time.perf_counter()
    base_meta = {
        "requested_model": selected_model,
        "served_model": None,
        "elapsed_seconds": 0.0,
        "prompt_tokens": None,
        "completion_tokens": None,
        "total_tokens": None,
        "cost": None,
        "success": False,
        "error_code": None,
    }
    if not OPENROUTER_API_KEY:
        base_meta["error_code"] = "NOT_CONFIGURED"
        return {"_request_meta": base_meta}
    try:
        res = get_session().post(
            API_URL, headers=headers, json=payload, timeout=split_timeout(timeout)
        )
        res.raise_for_status()
        response_data = res.json()
        choice = response_data["choices"][0]
        content = choice["message"]["content"]
        finish_reason = choice.get("finish_reason")
        if not isinstance(content, str):
            raise ValueError("OpenRouter content is not text")
        parsed = parse_json_safely(content)
        if not parsed:
            if finish_reason == "length" and retry_on_length:
                first_attempt_elapsed = time.perf_counter() - started_at
                retry_timeout = max(0.0, float(timeout) - first_attempt_elapsed)
                if retry_timeout < 2.0:
                    base_meta.update({
                        "served_model": response_data.get("model", selected_model),
                        "elapsed_seconds": round(first_attempt_elapsed, 3),
                        "error_code": "TRUNCATED_OUTPUT",
                        "finish_reason": finish_reason,
                        "attempts": 1,
                        "retry_skipped": "deadline_budget",
                    })
                    return {"_request_meta": base_meta}
                retried = call_openrouter(
                    prompt,
                    system_msg,
                    model=selected_model,
                    timeout=retry_timeout,
                    max_tokens=max(1600, int(max_tokens * 1.5)),
                    response_schema=response_schema,
                    schema_name=schema_name,
                    provider_sort=selected_provider_sort,
                    retry_on_length=False,
                )
                retried_meta = dict(retried.get("_request_meta", {}))
                retried_meta["attempts"] = 2
                retried_meta["retried_after_finish_reason"] = "length"
                retried_meta["elapsed_seconds"] = round(
                    first_attempt_elapsed + float(retried_meta.get("elapsed_seconds") or 0.0),
                    3,
                )
                retried["_request_meta"] = retried_meta
                return retried
            base_meta.update({
                "served_model": response_data.get("model", selected_model),
                "elapsed_seconds": round(time.perf_counter() - started_at, 3),
                "error_code": "TRUNCATED_OUTPUT" if finish_reason == "length" else "INVALID_JSON",
                "finish_reason": finish_reason,
                "attempts": 1,
            })
            return {"_request_meta": base_meta}
        usage = response_data.get("usage", {})
        parsed["_request_meta"] = {
            "requested_model": selected_model,
            "served_model": response_data.get("model", selected_model),
            "elapsed_seconds": round(time.perf_counter() - started_at, 3),
            "prompt_tokens": usage.get("prompt_tokens"),
            "completion_tokens": usage.get("completion_tokens"),
            "total_tokens": usage.get("total_tokens"),
            "cost": usage.get("cost"),
            "success": True,
            "error_code": None,
            "finish_reason": finish_reason,
            "attempts": 1,
        }
        return parsed
    except Exception as error:
        base_meta["elapsed_seconds"] = round(time.perf_counter() - started_at, 3)
        base_meta["error_code"] = _request_error_code(error)
        return {"_request_meta": base_meta}

# =========================================================
# ⚡ STEP 1: Search Planner (บังคับสร้างคีย์เวิร์ดราชการ + แบนภาษาอื่น)
# =========================================================
def analyze_intent_and_plan_search_with_diagnostics(
    news_text: str, model: str = None, timeout_seconds: float = None
) -> dict:
    """Plan retrieval and expose whether the model or deterministic fallback was used."""
    text_for_analysis = news_text
    if "]:\n" in news_text: 
        text_for_analysis = news_text.split("]:\n")[-1] 
        
    text_chunk = sanitize_for_api(text_for_analysis[:1500])
    
    prompt = f"""ข้อความที่ต้องการตรวจสอบ: 
"{text_chunk}"

หน้าที่: สกัด "ข้อมูลสำหรับค้นหา" (Optimized for Search Engine)
กฎ:
1. `search_query`: สร้างกลุ่มคำสั้นๆ สำหรับสืบค้น (ห้ามแต่งเป็นประโยคยาว ห้ามใส่เลขปี)
2. `locations`: สกัด "สถานที่" (ชื่อจังหวัด, อำเภอ) 
3. `core_keywords`: ⚠️ สำคัญมาก! ให้ดึงแก่นเรื่อง และ **"แปลเป็นคำพ้องความหมายที่เป็นภาษาราชการ/ทางการ"** แนบมาด้วยเสมอ (เช่น ถ้าเจอคำว่า "สายไฟลงดิน" ให้ใส่ "สายไฟฟ้าใต้ดิน" หรือ "ระบบจำหน่ายไฟฟ้า" มาด้วย, ถ้าเจอ "แจกเงิน" ให้ใส่ "มาตรการกระตุ้นเศรษฐกิจ") รวม 3-5 คำ เพื่อให้ระบบหาเว็บหน่วยงานรัฐ (go.th) เจอ!
4. `target_year`: สกัด "ปี พ.ศ." (ตัวเลข 4 หลัก) ถ้าข้อความไม่ได้ระบุปีให้คืนสตริงว่าง ห้ามเดาปีปัจจุบัน เพราะอาจทำให้ระบบตัดข่าวเก่าที่เกี่ยวข้องทิ้ง
5. หากข้อความไม่มีเนื้อหาสาระ ให้ action = "DROP"

⚠️ คำเตือนขั้นเด็ดขาด: ห้ามสร้างข้อความภาษาจีน (Chinese) หรือภาษาอื่นที่ไม่ใช่ภาษาไทยเด็ดขาด! ตอบกลับเป็นภาษาไทยและอังกฤษตามความจำเป็นเท่านั้น!

ตอบกลับเป็น JSON รูปแบบนี้เท่านั้น:
{{
    "action": "SEARCH หรือ DROP",
    "search_query": "กลุ่มคำสั้นๆ",
    "locations": ["จังหวัด"],
    "core_keywords": ["คำพูดทั่วไป", "คำศัพท์ราชการ/ทางการ"],
    "target_year": "2569",
    "topic_summary": "สรุปประเด็นหลัก 1 ประโยค"
}}"""
    res_data = call_openrouter(
        prompt,
        "Extract SEO keywords including formal official synonyms for gov sites. STRICTLY THAI LANGUAGE ONLY. NO CHINESE ALLOWED. Output strictly in JSON format.",
        model=model or PLANNER_MODEL,
        timeout=min(PLANNER_TIMEOUT_SECONDS, timeout_seconds) if timeout_seconds else PLANNER_TIMEOUT_SECONDS,
        max_tokens=350,
        response_schema=PLANNER_RESPONSE_SCHEMA,
        schema_name="search_plan",
        provider_sort=PLANNER_PROVIDER_SORT,
    )

    request_meta = dict(res_data.get("_request_meta", {}))
    fallback_used = request_meta.get("success") is False
    if fallback_used:
        fallback_query = re.sub(r'https?://\S+', ' ', text_chunk)
        fallback_query = re.sub(r'[^0-9A-Za-zก-๙\s]', ' ', fallback_query)
        fallback_query = re.sub(r'\s+', ' ', fallback_query).strip()[:160]
        try:
            from search import _meaningful_terms

            fallback_keywords = [
                term for term in _meaningful_terms(fallback_query)
                if len(term) >= 3 and not term.isdigit()
            ][:5]
        except (ImportError, RuntimeError):
            fallback_keywords = []
        res_data = {
            "action": "SEARCH" if len(fallback_query) >= 5 else "DROP",
            "search_query": fallback_query,
            "locations": [],
            "core_keywords": fallback_keywords,
            "target_year": "",
            "topic_summary": "ใช้ข้อความต้นฉบับค้นหาโดยตรง เนื่องจากขั้นวางแผนไม่สำเร็จ",
            "_request_meta": request_meta,
        }

    action = str(res_data.get("action", "SEARCH")).upper()
    
    raw_query = res_data.get("search_query", text_chunk[:80])
    if isinstance(raw_query, list):
        raw_query = " ".join([str(q) for q in raw_query])
    raw_query = str(raw_query)
    
    clean_query = re.sub(r'(?i)(facebook|fb|twitter|x|tiktok|youtube|ข่าวล่าสุด|รัฐบาลไทย|\||\.\.\.)', '', raw_query).strip()
    
    locations = res_data.get("locations", [])
    if isinstance(locations, str): locations = [locations]
    
    core_keywords = res_data.get("core_keywords", [])
    if isinstance(core_keywords, str): core_keywords = [core_keywords]
        
    target_year = str(res_data.get("target_year", "")).strip()
    topic_summary = str(res_data.get("topic_summary", "เปรียบเทียบและวิเคราะห์เนื้อหา")).strip()

    if action == "DROP":
        return {
            "status": "DROP",
            "completed": not fallback_used,
            "fallback_used": fallback_used,
            "action": "DROP",
            "search_query": "",
            "topic_summary": res_data.get("reason", "ไม่ใช่เนื้อหาที่สามารถเปรียบเทียบได้"),
            "locations": [],
            "core_keywords": [],
            "target_year": "",
            "request_meta": request_meta,
        }
    return {
        "status": "DEGRADED" if fallback_used else "OK",
        "completed": True,
        "fallback_used": fallback_used,
        "action": "SEARCH",
        "search_query": clean_query,
        "topic_summary": topic_summary,
        "locations": locations,
        "core_keywords": core_keywords,
        "target_year": target_year,
        "request_meta": request_meta,
    }


def analyze_intent_and_plan_search(news_text: str, model: str = None) -> tuple:
    """Backward-compatible tuple contract used by the current Streamlit UI."""
    report = analyze_intent_and_plan_search_with_diagnostics(news_text, model=model)
    return (
        report["action"], report["search_query"], report["topic_summary"],
        report["locations"], report["core_keywords"], report["target_year"],
    )

# =========================================================
# ⚖️ STEP 2: The Analyzer (กฎเหล็กแบนภาษาจีน)
# =========================================================
def analyze_news_with_qwen(
    news_text: str,
    references: list,
    current_date: str,
    source_url: str = "",
    model: str = None,
    timeout_seconds: float = None,
) -> dict:
    if not references:
        return validate_ai_response(
            {
                "verdict_summary": "ยังไม่พบแหล่งอ้างอิงที่เกี่ยวข้องเพียงพอ",
                "supported_points": [],
                "conflicting_points": [],
                "comparative_analysis": "ระบบงดเรียกโมเดลตัดสินเมื่อไม่มีหลักฐานจากการค้นหา",
                "claim_assessments": [],
                "relevant_ref_ids": [],
                "verdict": "INSUFFICIENT_EVIDENCE",
                "score": None,
                "system_status": "NO_EVIDENCE",
                "_request_meta": {
                    "requested_model": model or ANALYZER_MODEL,
                    "served_model": None,
                    "elapsed_seconds": 0.0,
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "total_tokens": 0,
                    "cost": 0,
                    "success": True,
                    "error_code": None,
                    "skipped": True,
                },
            },
            references=[],
        )
    clean_claim = sanitize_for_api(news_text[:2000])
    ref_text = "\n\n".join([
        f"[อ้างอิง {i+1}]: {r['title']} | วันที่: {r.get('pub_date', 'ไม่ระบุ')}\n"
        f"ระดับแหล่งข้อมูล: {r.get('source_tier', 'ไม่ระบุ')} — {r.get('source_tier_label', 'ยังไม่ได้จัดประเภท')} | "
        f"โดเมน: {r.get('source_domain', 'ไม่ระบุ')}\n"
        f"เนื้อหา: {str(r.get('snippet', ''))[:(ANALYZER_TOP_REFERENCE_CHARACTERS if i < 3 else ANALYZER_REFERENCE_CHARACTERS)]}"
        for i, r in enumerate(references)
    ]) if references else "ไม่มีอ้างอิง"
    
    is_official_source = bool(source_url and (".go.th" in source_url.lower() or ".gov" in source_url.lower() or 'antifakenewscenter.com' in source_url.lower()))
    origin_info = f"ดึงมาจากเว็บไซต์ทางการ (Official Source): {source_url}" if is_official_source else "ข้อความทั่วไป / โซเชียลมีเดีย"
    current_time_context = str(current_date or "").strip() or get_current_thai_time()

    prompt = f"""คุณคือ AI ผู้เชี่ยวชาญด้านการวิเคราะห์และเปรียบเทียบเนื้อหาข่าว (Comparative Analyst)

เวลาปัจจุบัน: {current_time_context}
[ข้อความต้นฉบับ]: "{clean_claim}"
[แหล่งที่มา]: {origin_info}

[แหล่งข้อมูลอ้างอิงที่ระบบคัดกรองมาให้]:
{ref_text}

กระบวนการเปรียบเทียบเนื้อหา:
1. แยกข้อความต้นฉบับเป็นข้อกล่าวอ้างย่อยที่ตรวจสอบได้ แล้วประเมินแต่ละข้อใน claim_assessments
2. ตรวจ subject + predicate/action + quantity/measurement + place + time ของแต่ละแหล่ง แค่มีคำนามหรือสถานที่เดียวกันยังไม่ถือว่าเกี่ยวข้อง
3. supporting_ref_ids/conflicting_ref_ids ใส่เฉพาะแหล่งที่มีข้อความยืนยันหรือหักล้างข้อกล่าวอ้างนั้นโดยตรง ห้ามใช้บทความที่พูดคนละตัวชี้วัด เช่น “จำนวนประชากร” เป็นหลักฐานของ “จำนวนจังหวัด”
4. ตรวจทุกแหล่งอย่างเป็นธรรม ห้ามเลือกเฉพาะหลักฐานที่สนับสนุนข้อสรุป แต่แหล่งบริบทกว้างๆ ที่ไม่ยืนยัน/หักล้างโดยตรงต้องไม่ใส่ ID
5. relevant_ref_ids ต้องเท่ากับผลรวมของ supporting_ref_ids และ conflicting_ref_ids จาก claim_assessments เท่านั้น
6. หากมีหลักฐานขัดแย้งอย่างมีสาระ ห้ามให้ผลรวมเป็น SUPPORTED
7. เมื่อมีหลายสำนักข่าวหรือหน่วยงานที่ยืนยัน/หักล้างข้อกล่าวอ้างเดียวกันโดยตรง ให้ใช้อ้างอิงจากผู้เผยแพร่อิสระ 3-5 แหล่ง แต่ห้ามเติมแหล่งที่เพียงกล่าวถึงหัวข้อหรือไม่ตอบข้อกล่าวอ้างเพื่อให้ครบจำนวน
7. หากต้นฉบับพูดกว้างๆ แต่อ้างอิงให้รายละเอียดที่ไม่เปลี่ยนสาระหลัก ไม่ถือว่าเป็นความขัดแย้ง
8. ให้พิจารณาว่าแหล่งข้อมูลเป็นหน่วยงานปฐมภูมิที่รับผิดชอบเรื่องนั้นโดยตรงหรือไม่ ห้ามถือว่าเว็บไซต์รัฐบาลน่าเชื่อถือสูงสุดในทุกหัวข้อโดยอัตโนมัติ

⚠️ คำเตือนขั้นเด็ดขาด: ห้ามสร้างข้อความ หรือ Thought process เป็นภาษาจีน (Chinese) หรือภาษาอื่นที่ไม่ใช่ภาษาไทยเด็ดขาด! ตอบกลับเป็นภาษาไทยเท่านั้น!

เกณฑ์ผลตรวจสอบ:
- SUPPORTED = หลักฐานสนับสนุน
- MOSTLY_SUPPORTED = หลักฐานสนับสนุนเป็นส่วนใหญ่
- MIXED = มีทั้งหลักฐานสนับสนุนและขัดแย้ง
- MOSTLY_CONTRADICTED = หลักฐานขัดแย้งเป็นส่วนใหญ่
- CONTRADICTED = หลักฐานขัดแย้ง
- INSUFFICIENT_EVIDENCE = ไม่มีแหล่งอ้างอิงเกี่ยวข้องเพียงพอ ห้ามสรุปว่าเป็นข่าวเท็จ

คะแนน 1-5 เป็นเพียงรหัสภายในเพื่อความเข้ากันได้ ไม่ใช่เปอร์เซ็นต์ความจริง หากไม่มีอ้างอิงที่เกี่ยวข้องให้ score เป็น null

ตอบกลับเป็น JSON รูปแบบนี้เท่านั้น:
{{
    "verdict_summary": "สรุปผลการเปรียบเทียบ 1 ประโยค",
    "supported_points": ["ประเด็นที่สอดคล้องกับแหล่งอ้างอิง"],
    "conflicting_points": ["ประเด็นที่ขัดแย้งอย่างชัดเจน (หากไม่มี ให้เว้นว่าง)"],
    "comparative_analysis": "อธิบายผลการเปรียบเทียบอย่างเป็นเหตุเป็นผล",
    "claim_assessments": [
        {{
            "claim_text": "ข้อกล่าวอ้างย่อยที่ตรวจสอบ",
            "verdict": "SUPPORTED",
            "supporting_ref_ids": [1],
            "conflicting_ref_ids": [],
            "explanation": "เหตุผลจากหลักฐานที่อ้างถึง"
        }}
    ],
    "relevant_ref_ids": [ระบุรหัสอ้างอิงของข่าวที่เกี่ยวข้องจริงๆ],
    "verdict": "SUPPORTED, MOSTLY_SUPPORTED, MIXED, MOSTLY_CONTRADICTED, CONTRADICTED หรือ INSUFFICIENT_EVIDENCE",
    "score": 1
}}"""
    
    final_result = call_openrouter(
        prompt,
        "You are a Comparative Analyst. STRICTLY THAI LANGUAGE ONLY. DO NOT OUTPUT CHINESE CHARACTERS. Output strictly in JSON format in THAI.",
        model=model or ANALYZER_MODEL,
        timeout=min(ANALYZER_TIMEOUT_SECONDS, timeout_seconds) if timeout_seconds else ANALYZER_TIMEOUT_SECONDS,
        max_tokens=1600,
        response_schema=ANALYSIS_RESPONSE_SCHEMA,
        schema_name="fact_check_analysis",
        provider_sort=ANALYZER_PROVIDER_SORT,
    )
    validated = validate_ai_response(final_result, references=references)
    if validated.get("verdict") in {"MIXED", "MOSTLY_CONTRADICTED", "CONTRADICTED"}:
        return critic_review_analysis(news_text, references, validated)
    return validated

def critic_review_analysis(news_text: str, references: list, initial_analysis: dict) -> dict:
    reviewed = validate_ai_response(initial_analysis, references=references)
    validation_checks = dict(reviewed.get("validation_checks", {}))
    validation_checks["critic_review_applied"] = True
    validation_checks["critic_review_method"] = "deterministic_claim_evidence_consistency"
    reviewed["validation_checks"] = validation_checks
    return reviewed
