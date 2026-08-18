# CLAUDE.md — AI Fact-Checker (Final-Project-dev)

## Project Overview

ระบบวิเคราะห์และตรวจสอบความน่าเชื่อถือของข่าวสารออนไลน์/โพสต์โซเชียลมีเดียแบบอัตโนมัติ ด้วยเทคนิค **Stateless RAG (Retrieval-Augmented Generation)** และเปรียบเทียบแหล่งข้อมูลหลายแหล่งด้วย LLM

- **Backend:** Python + FastAPI + Exa Semantic Search + Serper (Google Search) + OpenRouter LLM + curl_cffi / Jina / Social Fallbacks
- **Frontend:** Next.js 16 (App Router) + React 19 + Prompt Font + Tailwind CSS v4 + Three.js + Vanta.js 3D Birds + Framer Motion + GSAP + React Awesome Reveal + Phosphor Icons + TypeScript
- **Atmosphere:** Vanta.js 3D Birds WebGL 60fps Smooth Interactive Background with Cyber Sky & Indigo Light Streams
- **Architecture:** No Database, No User Accounts/Cookies — Stateless, Public Access, Speed-First Design with Realtime SSE Streaming
- **Deployment Ready:** Dockerfile, docker-compose.yml, Procfile, and Vercel/Railway/Render guides included

---

## Core Principle

**ระบบเปรียบเทียบแหล่งข่าว — ยิ่งมีแหล่งอ้างอิงที่รายงานเรื่องเดียวกันมากเท่าไหร่ ยิ่งน่าเชื่อถือมากเท่านั้น**
- ข่าวที่มีหลายสำนักยืนยันตรงกัน = น่าเชื่อถือสูง (4-5 ดาว / 75-100%)
- ข่าวที่หาแหล่งอ้างอิงไม่เจอเลย = น่าสงสัย / ก้ำกึ่ง (3 ดาว / 50%)
- ข่าวที่มีหลักฐานหักล้าง / แถลงเตือนภัย = ข้อมูลบิดเบือนหรือข่าวปลอม (1-2 ดาว / 0-25%)
- **ความโปร่งใส (Transparency):** แสดงหลักฐานทั้งในส่วนที่สอดคล้องและขัดแย้งเสมอ (ห้ามซ่อน ref ที่ขัดแย้ง)
- **ข้อความเท่านั้น:** รองรับบทความข่าวและโพสต์ข้อความ (Facebook, X, Instagram, Threads, LINE Today, เว็บข่าว) ไม่รองรับคลิปวิดีโอ/ไฟล์เสียง (TikTok/YouTube triggers rejection)

---

## File Structure

```
Final-Project-dev/
├── api/
│   ├── __init__.py
│   └── main.py              # FastAPI server (Endpoints: /, /health, /api/factcheck, /api/factcheck/stream)
├── core/
│   ├── __init__.py
│   ├── pipeline.py          # Central RAG Orchestrator (run_factcheck_pipeline, run_factcheck_api)
│   ├── scraper.py           # Multi-path social/web scraper (curl_cffi, fxtwitter, ddinstagram, Jina)
│   ├── search.py            # Dual-channel search (Exa Semantic + Serper Google) + Parallel Filters
│   ├── llm.py               # OpenRouter LLM Client (Single AI_MODEL: Planner & Analyzer)
│   ├── http_client.py       # Shared HTTP Session with pooled connections & strict timeouts
│   └── config.py            # Centralized settings & environment variables (.env)
├── web/                     # Next.js 16 (App Router) Frontend
│   ├── src/
│   │   ├── app/             # App Router (layout.tsx, page.tsx, globals.css, providers.tsx)
│   │   ├── components/      # UI Components (VantaBirdsBackground, SearchHero, ScoreMeter, EvidenceCards, etc.)
│   │   │   └── landing/     # Landing sections (CoreFeatures, HowItWorks, BenefitsGrid, FaqAccordion, CtaBand, Footer)
│   │   ├── hooks/           # Custom React hooks (useFactCheck, useHealthCheck)
│   │   ├── lib/             # Shared utilities (utils.ts)
│   │   └── types/           # TypeScript interfaces (FactCheckResult, VerdictData, vanta.d.ts)
│   ├── package.json
│   ├── Dockerfile           # Frontend Dockerfile (Multi-stage standalone build)
│   └── tsconfig.json
├── tests/
│   └── test_reliability_100.py  # Automated reliability test suite
├── Dockerfile               # Backend Dockerfile (Python 3.11-slim)
├── docker-compose.yml       # Unified full-stack docker compose definition
├── Procfile                 # PaaS Process definition for Render / Railway / Heroku
├── requirements.txt         # Python dependencies (fastapi, uvicorn, curl_cffi, requests, etc.)
├── .env                     # API keys & configurations (ห้าม commit)
├── .env.example             # Example environment template
├── DEPLOYMENT.md            # Production deployment guide (Vercel, Railway, Docker, Cloud Run)
├── CONTEXT.md               # รายละเอียดบริบทระบบและกฎเกณฑ์ทางธุรกิจ
├── AGENTS.md                # ข้อตกลงและคู่มือการพัฒนาโค้ดสำหรับ AI Agents
└── CLAUDE.md                # ไฟล์นี้ (Architectural Overview & Commands)
```

---

## Environment Variables (.env)

| Key | Description | Default / Example |
|:---|:---|:---|
| `AI_MODEL` | โมเดล LLM ตัวเดียวที่ใช้ตลอด Pipeline ผ่าน OpenRouter | `google/gemini-2.5-flash` / `qwen/qwen3-8b` |
| `OPENROUTER_API_KEY` | OpenRouter API Key สำหรับเรียกใช้ LLM | `sk-or-v1-...` |
| `EXA_API_KEY` | Exa.ai API Key สำหรับ Semantic Search | `...` |
| `SERPER_API_KEY` | Serper.dev API Key สำหรับ Google Search | `...` |
| `GSHEETS_WEBHOOK_URL` | Webhook URL สำหรับส่ง Telemetry Log ลง Google Sheets | `https://script.google.com/...` |
| `FACTCHECK_DEADLINE_SECONDS` | เวลารวมสูงสุดสำหรับ Pipeline การตรวจสอบ | `45` |
| `NEXT_PUBLIC_API_URL` | URL ของ FastAPI Backend สำหรับ Next.js Frontend | `http://localhost:8000` |

---

## Deployment Commands

### Docker Compose
```bash
docker compose up -d --build
```

### Backend (FastAPI Local)
```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend (Next.js Local)
```bash
cd web
npm run dev
```

---

## Security & Error Handling Guidelines

1. **SSRF Protection:** ตรวจสอบ URL เสมอด้วย `_is_safe_url` เพื่อบล็อก Private IP / Internal Network
2. **No Bare `except:`:** ต้องระบุ Exception Type ให้ชัดเจนเสมอ
3. **Safe Error Responses:** ห้ามแสดง Traceback หรือ API Key ให้ผู้ใช้เห็น ส่งเป็น Error Code เสมอ
4. **PDPA Compliance:** Logging ไม่เก็บ IP และตัดทอนข้อความให้สั้นก่อนส่ง Webhook
