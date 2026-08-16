import streamlit as st
import re
import datetime
import time
import threading
import requests 

from config import (
    OPENROUTER_API_KEY, EXA_API_KEY, SERPER_API_KEY, GSHEETS_WEBHOOK_URL,
    RATE_LIMIT_MAX, RATE_LIMIT_WINDOW, MAX_TEXT_INPUT_LENGTH, VIDEO_PATTERNS,
    FACTCHECK_DEADLINE_SECONDS
)
from scraper import extract_text_from_url
from search import search_news_references
from llm import analyze_fact_checking
from pipeline import run_factcheck_pipeline
import llm

# ================= 1. ตั้งค่า Cache =================
def cached_extract_text(url): return extract_text_from_url(url)

# หมายเหตุ: ไม่มี cache ให้ planner — มันถูกเรียกจาก background thread (Wave-0 ขนาน)
# ซึ่ง st.cache_data ไม่รับประกัน thread-safety; ใช้ฟังก์ชันดิบและมันวิ่งซ่อนอยู่
# หลัง search อยู่แล้ว ผลต่อเวลาที่ผู้ใช้รับรู้จึงเป็นศูนย์
#
# ⚠️ CACHE_VERSION: บังคับ cache bust เมื่อเปลี่ยน logic filter/search
# (มิฉะนั้น user ที่ลองลิงก์เดิมซ้ำจะได้ผลลัพธ์แคชเก่า = "คีย์เวิร์ดเหมือนเดิม
# แต่ผลลัพธ์แย่ลง" ทั้งที่โค้ดแก้แล้ว) — เพิ่มเลขทุกครั้งที่แก้ search logic
CACHE_VERSION = 25

@st.cache_data(ttl=3600, show_spinner=False)
def cached_search(query, locations, core_keywords, timeline, num_results=20, source_url="", timeout=25, core_keywords_formal=None, content_type="NEWS_CLAIM", exact_quote="", _cache_v=CACHE_VERSION, **kwargs):
    return search_news_references(query, locations, core_keywords, timeline, num_results=num_results, source_url=source_url, timeout=timeout, core_keywords_formal=core_keywords_formal, content_type=content_type, exact_quote=exact_quote)

@st.cache_data(ttl=3600, show_spinner=False)
def cached_analyze(news_text, references, current_date, source_url="", timeout=None, content_type="NEWS_CLAIM", content_timeline="ไม่ระบุ", publish_date_context="ไม่ระบุ", _cache_v=CACHE_VERSION, **kwargs):
    return analyze_fact_checking(news_text, references, current_date, source_url, timeout=timeout, content_type=content_type, content_timeline=content_timeline, publish_date_context=publish_date_context)

def smooth_progress(progress_bar, start_val, end_val, text_label, delay=0.001):
    for i in range(start_val, end_val + 1):
        progress_bar.progress(i, text=text_label)
        if delay > 0: time.sleep(delay)

def _check_rate_limit() -> bool:
    """Return True if request is allowed, False if rate limited."""
    now = time.time()
    if "rate_timestamps" not in st.session_state:
        st.session_state.rate_timestamps = []
    st.session_state.rate_timestamps = [
        t for t in st.session_state.rate_timestamps if now - t < RATE_LIMIT_WINDOW
    ]
    if len(st.session_state.rate_timestamps) >= RATE_LIMIT_MAX:
        return False
    st.session_state.rate_timestamps.append(now)
    return True

# ================= 2. ตั้งค่าหน้าจอ & CSS =================
st.set_page_config(page_title="AI Fact-Checker", page_icon="🛡️", layout="centered")

st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');
    h1, h2, h3, h4, h5, h6, p, a, button, input, textarea, label, li { font-family: 'Prompt', sans-serif !important; }
    footer {visibility: hidden;} 
    .stAlert {border-radius: 12px;}
    .stButton>button { border-radius: 8px !important; font-weight: 500 !important; padding: 0.5rem 2rem !important; }
    div[data-testid="stButton"] button[kind="primary"] { background-color: #1e3a8a !important; color: #ffffff !important; border: none !important; transition: all 0.3s; }
    div[data-testid="stButton"] button[kind="primary"]:hover { background-color: #2563eb !important; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .stMarkdown a { word-wrap: break-word; color: #2563eb !important; text-decoration: none !important; font-weight: 500 !important; }
    .stMarkdown a:hover { text-decoration: underline !important; }
    </style>
""", unsafe_allow_html=True)


# ================= 4. ฟังก์ชันจัดการคะแนน =================
def get_score_ui_config(level):
    try: level = int(level)
    except (ValueError, TypeError): return "N/A", "#94a3b8", "rgba(148, 163, 184, 0.1)", "rgba(148, 163, 184, 0.4)", "ไม่สามารถประเมินได้"
        
    if level == 5: return "100%", "#10b981", "rgba(16, 185, 129, 0.1)", "rgba(16, 185, 129, 0.4)", "🟢 สอดคล้องสมบูรณ์ (ข้อเท็จจริงจริง)"
    elif level == 4: return "75%", "#10b981", "rgba(16, 185, 129, 0.1)", "rgba(16, 185, 129, 0.4)", "🟢 สอดคล้องส่วนใหญ่ (มีเค้าความจริงสูง)"
    elif level == 3: return "50%", "#f59e0b", "rgba(245, 158, 11, 0.1)", "rgba(245, 158, 11, 0.4)", "🟡 ข้อมูลก้ำกึ่ง / อยู่ระหว่างตรวจสอบ / ไม่เพียงพอ"
    elif level == 2: return "25%", "#f97316", "rgba(249, 115, 22, 0.1)", "rgba(249, 115, 22, 0.4)", "🟠 ข้อมูลบิดเบือน / คลาดเคลื่อน / ชี้นำผิดบริบท"
    elif level == 1: return "0%", "#ef4444", "rgba(239, 68, 68, 0.1)", "rgba(239, 68, 68, 0.4)", "🔴 ข้อมูลเท็จ / ข่าวปลอม / ขัดแย้งสิ้นเชิง"
    return "N/A", "#94a3b8", "rgba(148, 163, 184, 0.1)", "rgba(148, 163, 184, 0.4)", "ไม่สามารถประเมินได้"

def save_system_log(input_type, input_data, search_query, references, ai_result_dict, process_time):
    webhook_url = os.getenv("GSHEETS_WEBHOOK_URL", "")
    if "GSHEETS_WEBHOOK_URL" in st.secrets: webhook_url = st.secrets.get("GSHEETS_WEBHOOK_URL", webhook_url)
    if not webhook_url: return 
    
    level = str(ai_result_dict.get("score", "N/A"))
    pct_map = {"5": "95%", "4": "75%", "3": "50%", "2": "25%", "1": "10%"}
    score_log = f"ระดับ {level} ({pct_map.get(level, 'N/A')})" if level in pct_map else "N/A"
        
    short_input = input_data[:200].replace('\n', ' ') + "..." if len(input_data) > 200 else input_data.replace('\n', ' ')
    ref_details = " | ".join([f"{idx+1}. {r['title']} ({r['href']})" for idx, r in enumerate(references)]) if references else "ไม่พบอ้างอิงสืบค้น"
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    payload = {
        "timestamp": current_time, "input_type": input_type, "short_input": short_input,
        "search_query": search_query, "ref_count": len(references), "ref_details": ref_details,
        "score": score_log, "process_time": round(process_time, 2)
    }
    threading.Thread(target=lambda: requests.post(webhook_url, json=payload, timeout=10, allow_redirects=True) if webhook_url else None, daemon=True).start()

# ================= 5. ส่วนแสดงผล UI =================
st.markdown("""<div style='text-align: center; margin-bottom: 1rem;'>
    <h1 style='font-size: 2.5rem; margin-bottom: 0px; color: #1e3a8a;'>🛡️ AI Fact-Checker</h1>
    <p style='font-size: 1.1rem; opacity: 0.8; margin-top: 5px;'>ระบบวิเคราะห์และเปรียบเทียบความน่าเชื่อถือของข่าวออนไลน์</p>
    </div>""", unsafe_allow_html=True)
_cc1, _cc2 = st.columns([6, 1])
with _cc2:
    if st.button("🗑️ ล้างแคช", help="ล้างข้อมูลแคชของระบบ"):
        st.cache_data.clear()
        st.rerun()

tab1, tab2 = st.tabs(["🌐 ตรวจสอบจากลิงก์ (URL)", "📄 ตรวจสอบจากข้อความ"])

news_content, original_url, url_input, input_method_used = "", "", "", ""
VIDEO_PATTERNS = [r'youtube\.com/watch', r'youtu\.be', r'youtube\.com/shorts', r'tiktok\.com', r'vt\.tiktok\.com', r'vm\.tiktok\.com', r'fb\.watch', r'facebook\.com/.*/videos/', r'/share/v/', r'/share/r/', r'vimeo\.com', r'dailymotion\.com']

with tab1:
    st.write("")
    url_input = st.text_input("🔗 วางลิงก์ข่าว หรือ โพสต์จากโซเชียลมีเดีย:", placeholder="ตัวอย่าง: https://www.facebook.com/...")
    st.write("") 
    col_l, col_btn, col_r = st.columns([1, 1, 1])
    with col_btn: btn_url = st.button("🔍 เริ่มการประเมิน", key="btn_url", type="primary", use_container_width=True)
        
    if btn_url:
        if url_input:
            if not _check_rate_limit():
                st.error("⚠️ คุณใช้งานเกินโควตาที่กำหนด กรุณารอสักครู่แล้วลองใหม่อีกครั้ง")
            else:
                input_method_used = "URL Link"
                url_match = re.search(r'(https?://[a-zA-Z0-9./?=_%&+\-#]+)', url_input)
                clean_url = url_match.group(1).rstrip('.,;!?)\'"]') if url_match else url_input.strip()
                if not re.match(r'^https?://', clean_url):
                    st.warning("⚠️ รองรับเฉพาะลิงก์ http:// หรือ https:// เท่านั้น")
                elif any(re.search(p, clean_url.lower()) for p in VIDEO_PATTERNS):
                    news_content = "VIDEO_DETECTED"
                    original_url = clean_url
                else:
                    with st.spinner("⏳ กำลังเชื่อมต่อและสกัดเนื้อหาจากเว็บไซต์ปลายทาง..."):
                        extracted_data = cached_extract_text(clean_url)
                        if isinstance(extracted_data, dict):
                            news_content = extracted_data.get("error", extracted_data.get("content", ""))
                            original_url = extracted_data.get("actual_url", clean_url)
                        else: news_content = str(extracted_data)
                        if not news_content or str(news_content).strip() == "": news_content = "EMPTY_CONTENT"
        else: st.warning("⚠️ กรุณาระบุ URL ก่อนทำการวิเคราะห์")

with tab2:
    st.write("") 
    text_input = st.text_area("📄 วางข้อความ ข่าวลือ หรือเนื้อหาที่ต้องการตรวจสอบ:", height=150, placeholder="วางเนื้อหาที่น่าสงสัยที่นี่...")
    st.write("") 
    col_l2, col_btn2, col_r2 = st.columns([1, 1, 1])
    with col_btn2: btn_text = st.button("🔍 เริ่มการประเมิน", key="btn_text", type="primary", use_container_width=True)
        
    if btn_text:
        if text_input.strip():
            if not _check_rate_limit():
                st.error("⚠️ คุณใช้งานเกินโควตาที่กำหนด กรุณารอสักครู่แล้วลองใหม่อีกครั้ง")
            elif len(text_input) > MAX_TEXT_INPUT_LENGTH:
                st.warning(f"⚠️ ข้อความยาวเกินไป (สูงสุด {MAX_TEXT_INPUT_LENGTH:,} ตัวอักษร)")
            else:
                input_method_used = "Direct Text"
                news_content = text_input
        else: st.warning("⚠️ กรุณาระบุเนื้อหาก่อนทำการวิเคราะห์")

# ================= 6. ส่วนประมวลผลหลัก =================
if news_content:
    if not OPENROUTER_API_KEY:
        st.error("❌ ไม่พบ OPENROUTER_API_KEY ในระบบ — กรุณาตั้งค่าใน .env")
        st.stop()
    if not EXA_API_KEY and not SERPER_API_KEY:
        st.error("❌ ไม่พบ API Key สำหรับค้นหา (EXA_API_KEY หรือ SERPER_API_KEY)")
        st.stop()
        
    st.divider()
    
    progress_bar = st.progress(0, text="กำลังเตรียมการวิเคราะห์ (0%)")
    
    def progress_callback(pct, msg):
        progress_bar.progress(pct, text=msg)
    
    with st.container(border=True):
        st.markdown("### ⚙️ กระบวนการทำงานของระบบ")
        
        # Call the separated pipeline logic with global exception handler
        try:
            out = run_factcheck_pipeline(
                news_content=news_content,
                original_url=original_url,
                progress_callback=progress_callback,
                search_func=cached_search,
                analyze_func=cached_analyze
            )
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            out = {
                "result": {
                    "verdict_summary": "ระบบขัดข้อง",
                    "supported_points": ["ไม่พบข้อมูลเนื่องจากระบบขัดข้อง"],
                    "conflicting_points": ["ไม่พบข้อมูลเนื่องจากระบบขัดข้อง"],
                    "comparative_analysis": f"เกิดข้อผิดพลาดภายในระบบ: {str(e)}\n\n[Developer Details (Hidden from users in UI)]",
                    "score": 3,
                    "relevant_ref_ids": [],
                    "is_error": True
                },
                "references": [],
                "search_query": "",
                "debug": {"action": "ERROR", "content_type": "ERROR"},
                "time_taken": 0.0
            }
        
        result_dict = out["result"]
        references = out["references"]
        search_query = out["search_query"]
        pipeline_debug = out["debug"]
        total_time_taken = out["time_taken"]
        
        if result_dict.get("verdict_summary") == "พบวิดีโอคลิป":
            st.markdown("🛡️ **ตรวจพบวิดีโอคลิป**\n\nระบบยังไม่รองรับการถอดเสียงอัตโนมัติ กรุณาคัดลอกข้อความมาวางแทน")
        elif result_dict.get("verdict_summary") == "เนื้อหามีความเสี่ยงต่อความปลอดภัย":
            st.markdown("🚫 **ระงับการเชื่อมต่อ**\n\nตรวจพบความเสี่ยงจากลิงก์อันตราย")
        elif result_dict.get("verdict_summary") == "ไม่สามารถดึงข้อมูลได้":
            st.markdown("⚠️ **ต้นทางปฏิเสธการเข้าถึง**\n\nเว็บไซต์หรือโพสต์ถูกตั้งเป็นส่วนตัว กรุณานำข้อความมาวางตรวจสอบโดยตรง")
        elif result_dict.get("verdict_summary") == "ไม่มีเนื้อหา":
            st.markdown("⚠️ **ไม่พบเนื้อหา**\n\nลิงก์ดังกล่าวไม่มีข้อความข่าวสารที่สามารถตรวจสอบได้")
        elif result_dict.get("verdict_summary") == "เนื้อหาทั่วไป/เรื่องส่วนตัว":
            st.markdown(f"⏭️ **ยุติการตรวจสอบ:** {search_query}")
        else:
            st.markdown(f"📌 **ประเด็นที่วิเคราะห์:** {pipeline_debug.get('topic_summary', 'N/A')}")
            if pipeline_debug.get("action") == "TIMEOUT":
                st.info("⏱️ ตัววางแผนค้นหาใช้เวลานานเกินกำหนด ระบบใช้ผลค้นหาเบื้องต้น (Wave-0) ในการวิเคราะห์")
            else:
                loc_str = ", ".join(pipeline_debug.get("locations", [])) if pipeline_debug.get("locations") else "ไม่ระบุ"
                kw_str = ", ".join(pipeline_debug.get("core_keywords", [])) if pipeline_debug.get("core_keywords") else "ไม่ระบุ"
                
                raw_pub_date = pipeline_debug.get('publish_date_context', 'ไม่ระบุ')
                if original_url:
                    post_time_display = f"🕒 **เวลาเผยแพร่ (ต้นทาง):** `{raw_pub_date}`"
                else:
                    if raw_pub_date in ["ไม่ระบุ", "ไม่ระบุในข้อความ", "N/A", ""]:
                        post_time_display = "🕒 **เวลาโพสต์:** `ไม่ระบุ (ตรวจสอบจากข้อความโดยตรง)`"
                    else:
                        post_time_display = f"🕒 **เวลาที่ระบุในข้อความ:** `{raw_pub_date}`"

                st.info(
                    f"🏷️ **ประเภทเนื้อหา:** `{pipeline_debug.get('content_type', 'N/A')}`\n"
                    f"📰 **พาดหัวข่าว:** `{pipeline_debug.get('topic_keywords', 'N/A')}`\n"
                    f"🔑 **คีย์เวิร์ดสำคัญ:** `{kw_str}`\n"
                    f"📍 **พื้นที่:** `{loc_str}`\n"
                    f"{post_time_display} | "
                    f"📅 **ไทม์ไลน์เหตุการณ์:** `{pipeline_debug.get('content_timeline', 'ไม่ระบุ')}`"
                )
            if pipeline_debug.get("is_breaking_news"):
                st.warning("⚡ **ตรวจพบเหตุการณ์พึ่งเกิดขึ้นสดใหม่ (Developing / Breaking News):** ข้อความหรือข่าวดังกล่าวพึ่งเผยแพร่ในระยะเวลาอันสั้น สำนักข่าวอื่นอาจกำลังอยู่ระหว่างการรวบรวมข้อมูล แนะนำให้ติดตามการรายงานอย่างเป็นทางการหรือนำกลับมาตรวจสอบซ้ำอีกครั้งในภายหลัง")
            st.markdown(f"🔎 **ดึงแหล่งข้อมูลมาได้ {len(references)} แหล่ง เพื่อทำการเปรียบเทียบ**")
            st.markdown("⚖️ **กำลังประเมินความสอดคล้อง/ความขัดแย้งของข้อมูล...**")
            st.markdown("✨ **การเปรียบเทียบเสร็จสมบูรณ์!**")

        # ================= 7. การแสดงผลลัพธ์ =================
    has_system_error = result_dict.get("is_error", False)
    
    if has_system_error:
        st.error("⚠️ **ระบบวิเคราะห์ขัดข้อง:** โมเดล AI ประมวลผลผิดพลาดหรือไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่อีกครั้ง")
        raw_err = result_dict.get("comparative_analysis", "")
        safe_err = re.sub(r'(sk-or-v1-[a-zA-Z0-9]+|Bearer [^\s]+|api[_-]?key[=:]\s*\S+)', '[REDACTED]', str(raw_err), flags=re.IGNORECASE)
        safe_err = re.sub(r'(Traceback \(most recent call last\)[\s\S]*?)(?=\n\n|\Z)', '[internal error]', safe_err)
        with st.expander("ดูข้อมูลข้อผิดพลาด"): st.write(safe_err)
    else:
        pct, color, bg_color, border_color, label = get_score_ui_config(result_dict.get("score"))
        score_card_html = f"""
        <div style="text-align: center; padding: 30px; background-color: {bg_color}; border-radius: 16px; margin-bottom: 30px; border: 2px solid {border_color}; margin-top: 20px;">
            <p style="margin: 0; font-size: 1.2rem; font-weight: 500; opacity: 0.8; color: #334155;">ความสอดคล้องเมื่อเทียบกับแหล่งอ้างอิง</p>
            <h1 style="margin: 15px 0; font-size: 6rem; color: {color}; font-weight: 700; line-height: 1;">{pct}</h1>
            <span style="background-color: {color}; color: white; padding: 8px 24px; border-radius: 30px; font-weight: 500; font-size: 1.15rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">{label}</span>
        </div>
        """
        st.markdown(score_card_html, unsafe_allow_html=True)

        st.markdown(f"### 🎯 สรุปผลการเปรียบเทียบ\n**{result_dict.get('verdict_summary', 'ไม่มีข้อมูลสรุป')}**")
        st.write("")

        col1, col2 = st.columns(2)
        with col1:
            with st.container(border=True):
                st.markdown("<h4 style='color: #15803d;'>✅ ประเด็นที่สอดคล้องกับสื่อหลัก</h4>", unsafe_allow_html=True)
                facts = result_dict.get("supported_points", [])
                if facts and isinstance(facts, list) and facts[0] != "ไม่พบข้อมูลที่สอดคล้องกับแหล่งอ้างอิง":
                    for f in facts: st.markdown(f"- {f}")
                else: st.markdown("- *ไม่พบประเด็นที่สอดคล้องกับแหล่งอ้างอิง*")
                
        with col2:
            with st.container(border=True):
                st.markdown("<h4 style='color: #b91c1c;'>❌ ประเด็นที่ขัดแย้ง</h4>", unsafe_allow_html=True)
                dists = result_dict.get("conflicting_points", [])
                if dists and isinstance(dists, list) and dists[0] != "ไม่พบข้อมูลที่ขัดแย้ง หรือแหล่งอ้างอิงไม่เพียงพอต่อการเปรียบเทียบ":
                    for d in dists: st.markdown(f"- {d}")
                else: st.markdown("- *ไม่พบประเด็นที่ขัดแย้งอย่างชัดเจน*")

        st.write("")
        
        with st.container(border=True):
            st.markdown("### 📊 บทวิเคราะห์การเปรียบเทียบเชิงลึกจาก AI")
            st.markdown(result_dict.get('comparative_analysis', 'ไม่มีบทวิเคราะห์เพิ่มเติม'))

        with st.container(border=True):
            st.subheader("📚 แหล่งข้อมูลอ้างอิงที่ค้นพบ")
            if references:
                rel_ids = result_dict.get("relevant_ref_ids", [])
                for idx, ref in enumerate(references):
                    is_used = any(str(idx + 1) == str(rel_id) for rel_id in rel_ids)
                    source_tag = ref.get('source', '')
                    source_badge = f" `{source_tag.upper()}`" if source_tag else ""
                    prefix = "⭐" if is_used else "📄"
                    pub_date = ref.get('pub_date', '')
                    date_str = f" | {pub_date}" if pub_date and pub_date != "ไม่ระบุ" else ""
                    st.markdown(f"{prefix} {idx+1}. [{ref.get('title', 'ลิงก์อ้างอิง')}]({ref.get('href', '#')}){date_str}{source_badge}")
                if rel_ids:
                    st.caption("⭐ = แหล่งที่ AI ใช้วิเคราะห์โดยตรง")
            else:
                st.info("ไม่พบแหล่งข้อมูลอ้างอิงจากการค้นหา")

    if pipeline_debug:
        with st.expander("🔍 Pipeline Debug — รายละเอียดกระบวนการทั้งหมด"):
            dbg_c1, dbg_c2 = st.columns(2)
            with dbg_c1:
                st.markdown("**🤖 Models**")
                st.code(f"Backend:  {llm.LLM_BACKEND}\nAI Model: {llm.AI_MODEL}", language=None)
            with dbg_c2:
                st.markdown("**⏱️ Timing**")
                st.code(f"Total: {total_time_taken}s\nDeadline: {FACTCHECK_DEADLINE_SECONDS}s", language=None)
            _pd = pipeline_debug
            st.markdown("**🔑 Planner Output**")
            st.code(f"Action: {_pd.get('action', 'N/A')}\nContent Type: {_pd.get('content_type', 'N/A')}\nSearch Query: {_pd.get('search_query', 'N/A')}\nCore Keywords (ทั่วไป): {', '.join(_pd.get('core_keywords', []))}\nCore Keywords (ทางการ): {', '.join(_pd.get('core_keywords_formal', []))}\nLocations: {', '.join(_pd.get('locations', []))}\nTarget Year: {_pd.get('target_year', 'N/A')}", language=None)
            st.markdown("**🌐 Search Queries Sent**")
            _sq = _pd.get('search_query', '')
            st.code(
                f"Wave-0 (raw text): {_pd.get('wave0_query', '')[:120]}\n"
                f"Base Query: {_sq}\n"
                f"(Exa Gov/Media & Serper Google automatically optimize their queries using Quotes & Keywords during execution)",
                language=None
            )
            st.markdown("**📊 Results Breakdown**")
            _ec = sum(1 for r in references if r.get('source') == 'exa')
            _sc = sum(1 for r in references if r.get('source') == 'serper')
            st.code(f"Wave-0: {_pd.get('wave0_count', 0)} refs\nPlanned: {_pd.get('planned_count', 0)} refs\nAfter merge: Exa={_ec} | Serper={_sc} | Total={len(references)}", language=None)
            st.markdown("**🧠 AI Response (raw)**")
            st.json(result_dict)

    try:
        log_input_data = original_url if original_url else news_content
        save_system_log(input_method_used, log_input_data, search_query, references, result_dict, total_time_taken)
    except Exception: pass