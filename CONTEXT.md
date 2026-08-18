# CONTEXT.md — AI Fact-Checker Project Context

เอกสารบริบททางเทคนิคและสถาปัตยกรรมสำหรับระบบ **AI Fact-Checker**

---

## 1. Executive Summary

ระบบ AI Fact-Checker เป็นแพลตฟอร์มตรวจสอบและวิเคราะห์ข้อเท็จจริงของข่าวสารและเนื้อหาบนโลกออนไลน์/โซเชียลมีเดียแบบอัตโนมัติ ออกแบบด้วยสถาปัตยกรรม **Stateless RAG (Retrieval-Augmented Generation)** ความเร็วสูง โดยค้นหาหลักฐานสด (Live Search) และเปรียบเทียบแหล่งข่าวที่น่าเชื่อถือด้วย LLM

- **Decoupled Architecture:** 
  - **Backend:** FastAPI (Python) ให้บริการ REST API (`/api/factcheck`) และ SSE Stream (`/api/factcheck/stream`)
  - **Frontend:** Next.js 16 (React 19 + TypeScript + Tailwind CSS v4 + Three.js + Vanta.js 3D Birds + Framer Motion + GSAP + React Awesome Reveal + Phosphor Icons) พร้อมฟอนต์ **Prompt** และพื้นหลัง 3D **Vanta.js Birds (60fps Optimized)**
- **Core Principle:** ข้อมูลที่มีการยืนยันตรงกันจากหลายสำนักข่าวย่อมมีความน่าเชื่อถือสูง ข้อมูลที่ไร้การรายงานหรือมีแถลงเตือนภัยจะถูกจำแนกเป็นข้อมูลบิดเบือน/ข่าวปลอม
- **ขอบเขต:** รองรับเนื้อหาข้อความและบทความข่าวสาร (Facebook, X, Instagram, Threads, LINE Today, สำนักข่าว) ไม่รองรับคลิปวิดีโอ/ไฟล์เสียง
- **ความพร้อมในการ Deployment:** รองรับทั้ง Docker Compose, Vercel, Railway, Render, และ Cloud Run

---

## 2. Technical Architecture

```
[User Browser]
       │
       ▼ (Next.js 16 Client — Prompt Font + Vanta.js 3D Birds 60fps Background)
┌─────────────────────────────────────────────────────────────┐
│ Components: SearchHero, ScoreMeter, EvidenceCards, etc.     │
│ Hooks: useFactCheck (SSE + REST Fallback), useHealthCheck   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / SSE (/api/factcheck/stream)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ FastAPI Backend Server (api/main.py)                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Stateless Pipeline (core/pipeline.py)                       │
│ ├── 1. Multi-Path Scraper (curl_cffi / Jina / Social APIs) │
│ ├── 2. Wave-0 Fast Search & Keyword Extraction (LLM)        │
│ ├── 3. Dual-Channel Search (Exa Semantic + Serper Google)   │
│ ├── 4. Truth Comparison & Verdict Synthesis (LLM Analyzer)  │
│ └── 5. Anonymous PDPA Telemetry (Google Sheets Webhook)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 5-Tier Verdict Scoring Standards

ระบบประเมินคะแนนความน่าเชื่อถือออกเป็น 5 ระดับตามมาตรฐานสากล:

1. **ระดับ 5 (100%): สอดคล้องสมบูรณ์ (True)** — ข้อมูลเป็นความจริง มีหลักฐานยืนยันตรงกันครบถ้วนจากหลายแหล่ง
2. **ระดับ 4 (75%): สอดคล้องส่วนใหญ่ (Mostly True)** — มีเค้าความจริงสูง รายละเอียดส่วนใหญ่ถูกต้อง อาจมีบริบทปลีกย่อยคลาดเคลื่อนเล็กน้อย
3. **ระดับ 3 (50%): ข้อมูลก้ำกึ่ง / ยังไม่มีข้อยุติ (Inconclusive)** — ข้อมูลยังมีความเห็นหลากหลาย หรือเป็นเหตุการณ์สดที่ยังไม่มีการสรุปข้อเท็จจริง
4. **ระดับ 2 (25%): ข้อมูลบิดเบือน (Mostly False)** — มีการบิดเบือนข้อเท็จจริง นำภาพเก่ามาเล่าใหม่ ตัดต่อเนื้อหา หรือพาดหัวชี้นำ
5. **ระดับ 1 (0%): ข้อมูลเท็จ / ข่าวปลอม (False / Debunked)** — ไม่มีมูลความจริง หรือถูกหน่วยงานทางการ/ศูนย์ต่อต้านข่าวปลอมชี้แจงหักล้างแล้ว

---

## 4. Key Business & Operational Rules

1. **Strict 3-URL Limit & 1,500 Char Prompt Cap:** ป้องกันการป้อนข้อมูลหลายเรื่องปนกันจนทำให้การสืบค้นและเทียบเคียงข้อมูลผิดเพี้ยน
2. **Text-First Content Scope:** ไม่รองรับคลิปวิดีโอหรือไฟล์เสียง
3. **Transparency (ความโปร่งใส):** หากพบหลักฐานหรือแหล่งข่าวที่หักล้าง (Contradicting Points) ต้องแสดงให้ผู้ใช้เห็นอย่างชัดเจนเสมอ ห้ามซ่อนข้อมูล
4. **Gambling Guardrails:** บล็อก URL เว็บพนันโดยตรง แต่ไม่บล็อกข่าวรายงานการบุกจับหรือเตือนภัยพนัน
5. **Strict Statelessness:** ไม่มีการใช้ Database ทุกการทำงานเสร็จสิ้นแล้วจบใน Memory
6. **Single AI Model:** ใช้โมเดล LLM เพียงตัวเดียวตลอด Pipeline เพื่อความเสถียรและความแม่นยำ
