# AGENTS.md — AI Implementation Guidelines

คู่มือและข้อตกลงการพัฒนาโค้ดสำหรับ AI Agents ในโปรเจกต์ **AI Fact-Checker**

---

## 1. Core Mandates (ข้อกำหนดห้ามฝ่าฝืนเด็ดขาด)

1. **ห้ามใช้ Database:** ห้ามเพิ่มการเชื่อมต่อ Database ใดๆ (SQLite, PostgreSQL, MongoDB, Prisma ORM, etc.) ข้อมูลทั้งหมดทำงานแบบ **Stateless** และถูกทิ้งทันทีหลังส่งผลลัพธ์ ยกเว้นการบันทึก Telemetry log แบบไม่ระบุตัวตน
2. **ห้ามมีระบบ Login / Session / Cookies:** ระบบเป็นสาธารณะ (Public Access) ห้ามสร้างระบบ User Management หรือบังคับล็อกอิน
3. **Single LLM Model:** ห้ามแยก `PLANNER_MODEL` หรือ `ANALYZER_MODEL` ให้ใช้ค่า `AI_MODEL` เพียงค่าเดียวจากสภาพแวดล้อม (Environment Variable) ในการเรียกใช้ LLM ผ่าน OpenRouter
4. **Social URL เป็น First-Class Citizen:** การสกัดข้อมูล URL โซเชียลที่เป็นข้อความ (Facebook, X/Twitter, Instagram, Threads, LINE Today) ห้ามพัง และต้องมี **Parallel Redundancy Fallback** เสมอ (ห้ามมี Single Point of Failure)
5. **ไม่รองรับคลิป/วิดีโอ/ไฟล์เสียง:** ระบบเน้นการตรวจสอบข้อเท็จจริงของเนื้อหาข้อความและบทความข่าวสารเท่านั้น หากตรวจพบ URL วิดีโอ (เช่น TikTok, YouTube) ระบบจะแจ้งปฏิเสธการประมวลผลวิดีโอทันที
6. **Decoupled Architecture:** สถาปัตยกรรมแบ่งแยกชัดเจนระหว่าง **FastAPI Backend (`api/` + `core/`)** และ **Next.js Frontend (`web/`)** โดยสื่อสารผ่าน REST API และ Real-time Server-Sent Events (SSE)

---

## 2. Architecture & File Structure

```
Final-Project-dev/
├── api/
│   └── main.py              # FastAPI Server (REST /api/factcheck & SSE /api/factcheck/stream)
├── core/
│   ├── pipeline.py          # Core Stateless RAG Orchestrator (run_factcheck_pipeline, run_factcheck_api)
│   ├── scraper.py           # Multi-path social & web scraper (curl_cffi, fxtwitter, ddinstagram, Jina)
│   ├── search.py            # Dual-channel search (Exa Semantic + Serper Google) + Parallel Filters
│   ├── llm.py               # OpenRouter LLM Client (Planner & Analyzer Prompts)
│   ├── http_client.py       # Shared HTTP Session with pooled connections and strict timeouts
│   └── config.py            # Centralized settings & environment loader (.env)
├── web/                     # Next.js 16 (App Router) + Tailwind CSS v4 + Three.js + Vanta.js Birds
│   ├── src/
│   │   ├── app/             # App Router (layout.tsx, page.tsx, globals.css, providers.tsx)
│   │   ├── components/      # UI Components (VantaBirdsBackground, SearchHero, ScoreMeter, etc.)
│   │   │   └── landing/     # Landing page sections (CoreFeatures, HowItWorks, BenefitsGrid, etc.)
│   │   ├── hooks/           # useFactCheck (SSE stream + REST fallback), useHealthCheck
│   │   ├── lib/             # utils.ts (Text sanitizer, 5-tier scoring, publisher resolver)
│   │   └── types/           # TypeScript interfaces (FactCheckResult, VerdictData, vanta.d.ts)
│   ├── package.json
│   └── Dockerfile           # Multi-stage standalone Next.js container
├── tests/                   # Automated reliability & unit test suites
├── Dockerfile               # Backend Python 3.11 container
├── docker-compose.yml       # Full-stack container compose
├── Procfile                 # PaaS runtime definition
├── DEPLOYMENT.md            # Complete deployment guide
├── requirements.txt         # Python dependencies (fastapi, uvicorn, curl_cffi, etc.)
├── .env                     # API keys & configurations (ห้าม commit)
├── CONTEXT.md               # รายละเอียดบริบทระบบและกฎเกณฑ์ทางธุรกิจ
├── AGENTS.md                # ไฟล์นี้ (Implementation Rules สำหรับ AI)
└── CLAUDE.md                # Architecture overview & developer cheat sheet
```

---

## 3. Input Guardrails & Accuracy Rules (กฎความแม่นยำและการป้องกันอินพุต)

เพื่อความแม่นยำสูงสุดในการสืบค้นและเทียบเคียงข้อมูล (เนื่องจากแสดงแหล่งอ้างอิงสูงสุด 6 แหล่ง):
1. **Strict 3-URL Limit:** จำกัดสูงสุดไม่เกิน **3 ลิงก์** ต่อการตรวจสอบหนึ่งครั้ง
   - ฝั่ง Frontend ควบคุมอินพุตอย่างชาญฉลาด (แยกแยะระหว่างการพิมพ์ URL ทีละตัว กับการคัดลอกข้อความยาวมาวาง) หากวางข้อความที่มีหลายลิงก์ จะรับเฉพาะ 3 ลิงก์แรก
   - ฝั่ง Backend ประมวลผลคู่ขนานสูงสุด 3 ลิงก์ (Concurrency Max 3 Workers)
2. **Max Prompt Length (1,500 Characters):** จำกัดความยาวเนื้อหาไม่เกิน **1,500 ตัวอักษร**
   - มี Real-time Character Counter แสดงสถานะ
   - แจ้งเตือนเมื่อเนื้อหายาวเกิน 1,000 ตัวอักษร ให้แยกตรวจทีละ 1 ประเด็น

---

## 4. Reliability & Security Guidelines

- **Timeout:** ห้าม Hardcode ค่า timeout ในโค้ด ให้ใช้จากตัวแปร `config.py` หรือ Environment Variables เช่น `SCRAPER_TIMEOUT`, `FACTCHECK_DEADLINE_SECONDS`
- **Exceptions:** ห้ามใช้ `except:` หรือ `except Exception: pass` ลอยๆ ต้องระบุชนิดของ Exception ให้ชัดเจนเสมอ
- **SSRF Protection:** ตรวจสอบ URL เสมอด้วย `_is_safe_url` เพื่อป้องกันการเข้าถึง Private IP / Internal Network
- **Error Response:** ข้อความ Error ที่ส่งกลับไปยัง Client/User **ห้ามเปิดเผยข้อมูลทางเทคนิค** (เช่น Traceback, API Key, Header, Server Paths) ให้ส่งเป็น Error Code และคำอธิบายที่ปลอดภัย
- **Telemetry & Logging:** ส่ง log แบบ Async ผ่าน Webhook (Google Sheets) โดยต้องปฏิบัติตาม PDPA (ไม่เก็บ IP, ไม่เก็บข้อมูลส่วนบุคคล, ตัดทอนข้อความยาวเกิน 200-500 ตัวอักษร)

---

## 5. Fact-Checking Business Rules

1. **Rule of Transparency (ความโปร่งใส):** หากพบหลักฐานหรือแหล่งข่าวที่หักล้าง (Contradicting Refs) **ต้องแสดงให้ผู้ใช้เห็นเสมอ** ห้ามซ่อนข้อมูลที่ขัดแย้ง เพราะเป็นหลักฐานสำคัญในการจำแนกข่าวปลอม
2. **Gambling Rules (กฎเว็บพนัน):** บล็อก URL ที่เป็นเว็บพนันโดยตรง แต่ **ห้ามบล็อกข่าวที่รายงานเกี่ยวกับการบุกจับหรือเตือนภัยพนัน** (แยกแยะด้วย News Whitelist และ Keyword Density)
3. **Recency (ความสดใหม่):** คำนวณอายุข่าวเป็นรายวัน `(today - published_date).days > max_days` ไม่ใช้การเปรียบเทียบแค่ปี พ.ศ./ค.ศ.
4. **5-Tier Scoring Standards:** ยึดเกณฑ์คะแนน 5 ระดับตามมาตรฐานสากล:
   - **5 (100%):** สอดคล้องสมบูรณ์ (True)
   - **4 (75%):** สอดคล้องส่วนใหญ่ (Mostly True)
   - **3 (50%):** ข้อมูลก้ำกึ่ง / ยังไม่มีข้อยุติ (Inconclusive)
   - **2 (25%):** ข้อมูลบิดเบือน (Mostly False)
   - **1 (0%):** ข้อมูลเท็จ / ข่าวปลอม (False / Debunked)

---

## 6. Frontend Guidelines (Next.js + Tailwind CSS)

- **Vanta.js 3D Birds Background:** ใช้ `VantaBirdsBackground` ขับเคลื่อนด้วย Vanta.js Birds (Three.js WebGL 60fps) จำลองฝูงนกพลังงานไซเบอร์ที่บินทะยานอย่างมีชีวิตชีวา ตอบสนองต่อเมาส์ และรองรับทั้ง Light/Dark Mode
- **Typography:** ใช้ฟอนต์ **Prompt** เป็นฟอนต์หลักทั้งระบบ (รองรับภาษาไทยและอังกฤษอย่างสวยงาม)
- **Centered Action Flow:** ปุ่ม Action ตรวจสอบวางไว้ใต้การ์ดกึ่งกลางอย่างโดดเด่น และจัดพื้นที่ภายในการ์ดให้โปร่งสบาย ไม่เบียดเสียด
- **Stateless Client:** ใช้ `useFactCheck` hook สำหรับเชื่อมต่อ SSE stream (`/api/factcheck/stream`) พร้อม REST fallback (`/api/factcheck`) อัตโนมัติ
- **Local Persistence Only:** ประวัติการตรวจสอบล่าสุดจัดเก็บใน Local Storage ของเบราว์เซอร์ผู้ใช้เท่านั้น (`ai_factcheck_history_v1`)
