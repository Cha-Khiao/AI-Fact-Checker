# 🛡️ AI Fact-Checker — ระบบตรวจสอบและเทียบเคียงข้อเท็จจริงข่าวสารด้วย AI

<p align="center">
  <strong>ระบบตรวจสอบข้อเท็จจริงของข้อความและลิงก์ข่าวสารบนโซเชียลมีเดียด้วยโมเดลภาษาขนาดใหญ่ (LLM) และสถาปัตยกรรม Stateless Real-time RAG</strong>
</p>

<p align="center">
  <a href="https://www.python.org/" target="_blank"><img src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" /></a>
  <a href="https://fastapi.tiangolo.com/" target="_blank"><img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://nextjs.org/" target="_blank"><img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" /></a>
  <a href="https://tailwindcss.com/" target="_blank"><img src="https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" /></a>
  <a href="https://openrouter.ai/" target="_blank"><img src="https://img.shields.io/badge/AI_Engine-OpenRouter-7C3AED?style=for-the-badge" alt="AI Engine" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" /></a>
</p>

---

## 📌 1. บทคัดย่อและข้อมูลโครงงาน (Project Overview & Academic Information)

ในปัจจุบัน ปัญหา **ข่าวปลอม (Fake News)**, **ข้อมูลบิดเบือน (Disinformation/Misinformation)** และ **กลลวงมิจฉาชีพทางไซเบอร์ (Scams/Phishing)** แพร่กระจายอย่างรวดเร็วบนแพลตฟอร์มโซเชียลมีเดีย ส่งผลกระทบต่อการรับรู้ข้อมูลข่าวสารของประชาชน

โครงงาน **AI Fact-Checker** พัฒนาขึ้นเพื่อเป็นเครื่องมือช่วย **ตรวจสอบ เทียบเคียง และวิเคราะห์ข้อเท็จจริงของข้อความข่าวสารและลิงก์จากโซเชียลมีเดีย** โดยใช้เทคนิคการสืบค้นข้อมูลเชิงความหมายร่วมกับโมเดลภาษาขนาดใหญ่ (Stateless Multi-Agent Verification Pipeline) โดยให้ความสำคัญกับ **ความโปร่งใสของแหล่งอ้างอิง การประมวลผลแบบไม่จัดเก็บข้อมูลส่วนบุคคล (Zero-DB) และการปฏิบัติตามแนวทาง PDPA**

### 🎓 ข้อมูลโครงงานและการศึกษา (Academic Information)
- **ประเภทโครงงาน:** โครงงานพิเศษระดับปริญญาตรี (Senior Capstone Project)
- **สาขาวิชา (Department):** สาขาวิชาวิทยาการคอมพิวเตอร์ (Department of Computer Science)
- **สถาบันการศึกษา (University):** มหาวิทยาลัยราชภัฏศรีสะเกษ (Sisaket Rajabhat University)
- **ปีการศึกษา (Academic Year):** 2569 (2026)
- **สิทธิ์การใช้งาน (License):** [MIT License](LICENSE) (Open-source เพื่อการศึกษาและประโยชน์สาธารณะ)

---

## 🤖 2. คำชี้แจงการพัฒนาด้วยปัญญาประดิษฐ์ (AI-Assisted Development Statement)

โครงงานนี้ได้รับการ **ออกแบบ พัฒนา และทดสอบระบบโดยใช้ AI เป็นเครื่องมือสนับสนุนในกระบวนการทำงาน (AI-Assisted Engineering):**

1. **System Architecture & Pipeline:** การวางโครงสร้าง Stateless RAG, ตัวควบคุมขั้นตอนการทำงาน (Pipeline Orchestrator) และการจัดการคำขอ
2. **Backend & Scraper Engine:** การพัฒนา FastAPI Server, ระบบดึงข้อมูลข้อความจากแพลตฟอร์มโซเชียลที่รองรับ (Facebook, X, IG, LINE Today) และระบบสืบค้นข้อมูลคู่ขนาน
3. **Frontend Web Client:** การพัฒนาส่วนติดต่อผู้ใช้ด้วย Next.js 16 (App Router), Tailwind CSS v4 และ Three.js WebGL
4. **Automated Testing:** การจัดทำชุดทดสอบอัตโนมัติ (71 Test Cases) ครอบคลุมตรรกะการคำนวณคะแนนและการป้องกันข้อผิดพลาด
5. **Documentation & Deployment:** การจัดทำเอกสารประกอบโครงงาน และไฟล์คอนฟิกสำหรับการนำระบบขึ้นทำงาน (Docker)

---

## 🏗️ 3. สถาปัตยกรรมระบบ (System Architecture)

```
[ ผู้ใช้งาน / Client Web Browser ]
              │
              ▼
   ┌──────────────────────────────────────────────────────────┐
   │                  Next.js 16 (Frontend)                   │
   │  - Three.js + Vanta Birds WebGL Background               │
   │  - Connection Status Indicator (Live / Demo)             │
   │  - Input Guardrails & URL Validation                     │
   │  - 10-Preset Instant Demo Selector                       │
   │  - EventSource SSE Stream Reader & REST Fallback         │
   └────────────────────────────┬─────────────────────────────┘
                                │ HTTP REST / Server-Sent Events (SSE)
                                ▼
   ┌──────────────────────────────────────────────────────────┐
   │                  FastAPI (Backend Server)                │
   │  - Rate Limiter & Concurrency Manager (3 Workers Max)   │
   │  - Multi-Platform Scraper (curl_cffi + Jina Fallback)    │
   │  - Dual Search Engine (Exa Semantic + Serper Search)     │
   │  - OpenRouter Single LLM Client (Planner & Analyzer)     │
   │  - Anonymous Telemetry Webhook (Google Sheets)           │
   └──────────────────────────────────────────────────────────┘
```

---

## ✨ 4. คุณสมบัติการทำงานของระบบ (System Features)

### 1. 🚀 การประมวลผลแบบไร้ฐานข้อมูล (Stateless Architecture)
- **ไม่บันทึกข้อมูลลง Database:** ระบบประมวลผลข้อมูลในหน่วยความจำชั่วคราวและส่งผลลัพธ์กลับทันที โดยไม่มีการจัดเก็บข้อความของผู้ใช้ลงในฐานข้อมูล
- **ไม่ใช้ระบบสมาชิกหรือคุกกี้ติดตามตัว:** ประวัติการตรวจสอบล่าสุดจะถูกบันทึกไว้ในเบราว์เซอร์ของผู้ใช้เองเท่านั้น (Client-side LocalStorage)
- **การจัดเก็บสถิติแบบนิรนาม:** จัดส่งเฉพาะข้อมูลสถิติเชิงภาพรวม (Anonymous Telemetry) โดยไม่มีการระบุตัวตนผู้ใช้งาน

### 2. 📱 การดึงข้อมูลจากโซเชียลมีเดีย (Social Media Scraper)
- รองรับการดึงเนื้อหาข้อความจากลิงก์: **Facebook** (โพสต์สาธารณะและลิงก์แชร์), **X (Twitter)**, **Instagram**, **Threads**, **LINE Today** และ **เว็บไซต์ข่าวสารทั่วไป**
- มีกลไกการสลับช่องทางสำรอง (Direct Scraper $\rightarrow$ Alternative Resolvers $\rightarrow$ Reader API) เพื่อลดโอกาสเกิดข้อผิดพลาดในการดึงข้อมูล

### 3. 🔎 การสืบค้นและเทียบเคียงข้อมูล 2 ช่องทาง (Dual-Channel Search)
- **Exa Semantic Search:** สืบค้นบทความและเนื้อหาเชิงความหมาย
- **Serper Google Search:** สืบค้นข้อมูลปัจจุบัน ประกาศทางการ และรายงานข่าวจากสำนักข่าว
- ระบบคัดกรองเบื้องต้นเพื่อตัดโดเมนที่ไม่เกี่ยวข้องและเว็บไซต์ที่มีความเสี่ยง

### 4. ⚖️ เกณฑ์การประเมินคะแนน 5 ระดับ (5-Tier Evaluation Standard)
ระบบจำแนกผลการตรวจสอบตามแนวทางการตรวจสอบข้อเท็จจริง:
- 🟢 **ระดับ 5 (100%): สอดคล้องสมบูรณ์ (True)** — ข้อมูลสอดคล้องกับหลักฐานและแหล่งอ้างอิงทางการ
- 🟢 **ระดับ 4 (75%): สอดคล้องส่วนใหญ่ (Mostly True)** — ประเด็นหลักถูกต้อง แต่อาจมีรายละเอียดปลีกย่อยคลาดเคลื่อนเล็กน้อย
- 🟡 **ระดับ 3 (50%): ข้อมูลก้ำกึ่ง / ยังไม่มีข้อยุติ (Inconclusive)** — ข้อมูลอยู่ระหว่างการตรวจสอบ หรือหลักฐานยังไม่เพียงพอต่อการสรุปผล
- 🟠 **ระดับ 2 (25%): ข้อมูลบิดเบือน (Mostly False)** — มีการนำข้อเท็จจริงบางส่วนมาเรียบเรียงใหม่จนทำให้เข้าใจผิด
- 🔴 **ระดับ 1 (0%): ข้อมูลเท็จ / ข่าวปลอม (False / Debunked)** — ข้อมูลไม่ตรงกับความเป็นจริง หรือมีรายงานชี้แจงหักล้างแล้ว

### 5. 🛡️ การจัดหมวดหมู่ประเด็นข่าว (6 Information Categories)
1. 💰 **การเงินและการลงทุน (Financial & Investment)**
2. 💊 **สุขภาพและผลิตภัณฑ์ทางการแพทย์ (Health & Medical)**
3. 🌪️ **ภัยพิบัติและเหตุฉุกเฉิน (Disaster & Public Safety)**
4. 🏛️ **นโยบายและระเบียบภาครัฐ (Public Policy & Regulation)**
5. 🛡️ **ความปลอดภัยทางไซเบอร์และมิจฉาชีพ (Cybersecurity & Fraud)**
6. 📢 **ข้อมูลและข่าวสารทั่วไป (General News & Rumors)**

### 6. 💡 ชุดข้อมูลตัวอย่างสำหรับสาธิต (10 Demo Presets)
- มีชุดตัวอย่างข่าว 10 กรณีศึกษา (ข่าวจริง 5 กรณี / ข้อมูลคลาดเคลื่อน 5 กรณี)
- สามารถใช้ทดสอบและสาธิตการแสดงผลหน้าบ้านได้ทันที โดยไม่ต้องรอการเชื่อมต่อจากระบบหลังบ้าน

### 7. 📊 แดชบอร์ดแสดงผลสถิติ (Statistical Dashboard)
- แสดงผลสรุปสัดส่วนผลการตรวจสอบในรูปแบบแผนภูมิโดนัท (Verdict Distribution)
- แสดงการจัดอันดับหมวดหมู่ข้อมูลในรูปแบบแผนภูมิแท่ง (Category Distribution)

---

## 🛠️ 5. เครื่องมือและเทคโนโลยีที่ใช้ (Technology Stack)

| ส่วนของระบบ | เทคโนโลยี / ไลบรารี | หน้าที่การทำงาน |
| :--- | :--- | :--- |
| **Backend Framework** | **Python 3.11 + FastAPI** | ให้บริการ API สำหรับการประมวลผลแบบ REST และ SSE |
| **Server Runtime** | **Uvicorn (ASGI)** | จัดการการทำงานของเซิร์ฟเวอร์แบบ Asynchronous |
| **AI / LLM Engine** | **OpenRouter API (`AI_MODEL`)** | โมเดลภาษาสำหรับวางแผนการสืบค้นและวิเคราะห์เปรียบเทียบข้อมูล |
| **Search Engines** | **Exa API & Serper API** | ให้บริการสืบค้นข้อมูลเชิงความหมายและผลการค้นหาจากเว็บ |
| **Scraper & Parser** | **curl_cffi + BeautifulSoup4** | ดึงเนื้อหาข้อความจากหน้าเว็บและโซเชียลมีเดีย |
| **Frontend Framework** | **Next.js 16 (App Router) + TypeScript** | โครงสร้างเว็บแอปพลิเคชันฝั่งหน้าบ้าน |
| **Styling & Icons** | **Tailwind CSS v4 + Phosphor Icons** | จัดการสไตล์และส่วนติดต่อผู้ใช้งาน รองรับ Light/Dark Mode |
| **3D Graphic** | **Three.js + Vanta.js (WebGL)** | พื้นหลังกราฟิกแอนิเมชัน 3D |
| **Telemetry Logger** | **Google Apps Script Webhook** | จัดเก็บข้อมูลสถิติเชิงภาพรวมแบบไม่ระบุตัวตน |

---

## 📂 6. โครงสร้างโฟลเดอร์ของโครงการ (Project Structure)

```
Final-Project-dev/
├── api/
│   └── main.py              # FastAPI Server (REST /api/factcheck & SSE /api/factcheck/stream)
├── core/
│   ├── pipeline.py          # Stateless RAG Orchestrator (run_factcheck_pipeline)
│   ├── scraper.py           # Social & Web scraper module
│   ├── search.py            # Dual-channel search module (Exa + Serper)
│   ├── llm.py               # OpenRouter LLM Client
│   ├── telemetry.py         # Anonymous Telemetry Forwarder
│   ├── http_client.py       # Shared HTTP Session
│   └── config.py            # Centralized settings & environment loader
├── web/                     # Next.js 16 Frontend Web Application
│   ├── src/
│   │   ├── app/             # App Router (page.tsx, /dashboard, /result)
│   │   ├── components/      # UI Components (Navbar, ScoreMeter, EvidenceCards, etc.)
│   │   ├── hooks/           # Custom React hooks (useFactCheck, useHealthCheck)
│   │   ├── lib/             # Utility functions, Demo data, Guardrails
│   │   └── types/           # TypeScript Type Definitions
│   └── package.json
├── tests/                   # Automated Unit Test Suite
├── server.py                # Backend server entrypoint script
├── requirements.txt         # Python dependencies
├── Dockerfile               # Backend Dockerfile
├── docker-compose.yml       # Docker compose configuration
├── .env.example             # Example environment variables template
├── LICENSE                  # MIT License
└── README.md                # Project documentation
```

---

## 🚀 7. ขั้นตอนการติดตั้งและการใช้งาน (Installation & Setup)

### ข้อกำหนดเบื้องต้น (Prerequisites)
- **Python:** เวอร์ชัน 3.10 ขึ้นไป (แนะนำ 3.11)
- **Node.js:** เวอร์ชัน 18.17 ขึ้นไป (แนะนำ Node.js 20 LTS)
- **Package Managers:** `pip` สำหรับ Python และ `npm` สำหรับ Node.js

---

### 1. การติดตั้งระบบหลังบ้าน (Backend Setup)

1. **สร้างและเปิดใช้งาน Virtual Environment:**
   ```bash
   # สำหรับ Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # สำหรับ macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **ติดตั้ง Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **ตั้งค่า Environment Variables (`.env`):**
   สร้างไฟล์ `.env` ตามตัวอย่างใน `.env.example`:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key
   AI_MODEL=google/gemini-2.5-flash
   EXA_API_KEY=your_exa_api_key
   SERPER_API_KEY=your_serper_api_key
   GSHEETS_WEBHOOK_URL=your_google_sheets_webhook_url
   SCRAPER_TIMEOUT=8
   FACTCHECK_DEADLINE_SECONDS=25
   ```

4. **เริ่มรันเซิร์ฟเวอร์:**
   ```bash
   python server.py
   # หรือรันผ่าน uvicorn:
   # uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *เซิร์ฟเวอร์จะทำงานที่ `http://localhost:8000` (API Docs: `http://localhost:8000/docs`)*

---

### 2. การติดตั้งระบบหน้าบ้าน (Frontend Setup)

1. **เข้าไปยังโฟลเดอร์ `web/` และติดตั้งแพ็กเกจ:**
   ```bash
   cd web
   npm install
   ```

2. **ตั้งค่า Environment Variables (`web/.env.local`):**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **รันเซิร์ฟเวอร์สำหรับการพัฒนา:**
   ```bash
   npm run dev
   ```
   *เปิดใช้งานผ่านเบราว์เซอร์ที่ `http://localhost:3000`*

4. **การ Build สำหรับนำไปใช้งาน (Production Build):**
   ```bash
   npm run build
   npm start
   ```

---

---

## 📡 8. เอกสารประกอบระบบ API หลังบ้าน (Backend API Documentation)

FastAPI ให้บริการเอกสาร API แบบ Interactive อัตโนมัติตามมาตรฐาน OpenAPI:

- 📖 **Swagger UI (Interactive API Docs):** `http://localhost:8000/docs`
- 📑 **ReDoc (Detailed Schema Reference):** `http://localhost:8000/redoc`
- 📄 **OpenAPI Specification (JSON):** `http://localhost:8000/openapi.json`

### สรุปรายการ Endpoints หลัก (API Endpoints Summary)

| Method | Endpoint | คำอธิบาย | ตัวอย่างการใช้งาน |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/factcheck` | ตรวจสอบข้อเท็จจริงแบบ REST JSON | `{"text": "...", "explicit_url": "..."}` |
| `GET` | `/api/factcheck/stream` | ตรวจสอบข้อเท็จจริงแบบ Real-time Server-Sent Events (SSE) | `?query=...&explicit_url=...` |
| `GET` | `/health` | ตรวจสอบสถานะการทำงานและความพร้อมของเซิร์ฟเวอร์ | ตอบกลับ `{"status": "healthy"}` |
| `GET` | `/api/trends` | ดึงข้อมูลสถิติภาพรวมสำหรับแสดงบนแดชบอร์ด | ข้อมูลสัดส่วนคะแนนและหมวดหมู่ภัยคุกคาม |
| `GET` | `/api/team` | ข้อมูลทีมผู้พัฒนาและสถาบันการศึกษา | ข้อมูลรายชื่อและบทบาทของผู้จัดทำ |

#### ตัวอย่างการเรียกใช้งาน API ผ่าน cURL:

```bash
# ตรวจสอบข้อเท็จจริงผ่าน REST API
curl -X POST "http://localhost:8000/api/factcheck" \
     -H "Content-Type: application/json" \
     -d '{"text": "ดื่มน้ำอุ่นช่วยรักษาโรคมะเร็งได้จริงหรือไม่"}'
```

---

## 🧪 9. การทดสอบการทำงานของระบบ (Testing Suite)

ระบบมีชุดการทดสอบอัตโนมัติ (Automated Unit Tests) เพื่อตรวจสอบความถูกต้องของฟังก์ชันการทำงานหลักและตรรกะการประมวลผล:

- 🛡️ **Backend Unit Tests (71 Test Cases):** ทดสอบกระบวนการทำงานของ Pipeline, การคำนวณคะแนน 5 ระดับ, การตรวจสอบความปลอดภัยของ URL (SSRF Prevention), การคัดกรองลิงก์ที่ไม่รองรับ, การแตกประเด็นย่อย (Sub-claims), การคำนวณอายุข่าว และการจัดการกรณี Timeout
  ```bash
  python -m unittest discover -s tests
  ```
- 🌐 **Frontend Build & Type Verification:** ตรวจสอบความถูกต้องของ Type Safety และการ Compile ของหน้าบ้าน
  ```bash
  cd web && npm run build
  ```
- 💡 **Demo Presets Verification:** ทดสอบการทำงานของชุดข้อมูลตัวอย่าง 10 รายการสำหรับการสาธิต

---

## 🔒 10. ข้อจำกัดและข้อควรทราบ (Limitations & Disclaimer)

1. **ขอบเขตการใช้งาน:** ระบบนี้พัฒนาขึ้นเพื่อเป็นเครื่องมือช่วยสืบค้น เทียบเคียง และวิเคราะห์ข้อเท็จจริงเบื้องต้นสำหรับงานวิชาการและการศึกษา ผลลัพธ์ที่ได้จากการประมวลผลของโมเดลภาษาอาจมีข้อจำกัด และไม่สามารถนำไปใช้อ้างอิงเป็นข้อชี้ขาดทางกฎหมายได้
2. **การป้องกันอินพุตที่ไม่รองรับ:** ระบบรองรับเฉพาะข้อความและบทความข่าวสาร ไม่รองรับการประมวลผลไฟล์เสียงหรือวิดีโอโดยตรง
3. **ความเป็นส่วนตัวของผู้ใช้:** ระบบไม่มีการจัดเก็บข้อมูลส่วนบุคคล ประวัติการตรวจสอบจะถูกเก็บไว้ที่ LocalStorage บนอุปกรณ์ของผู้ใช้เท่านั้น

---

## 📄 11. สัญญาอนุญาต (License)

โครงงานนี้เผยแพร่ภายใต้สัญญาอนุญาต **[MIT License](LICENSE)** สามารถนำไปศึกษา ใช้งาน และพัฒนาต่อยอดได้โดยไม่มีค่าใช้จ่ายเพื่อประโยชน์ทางการศึกษาและสาธารณะ
