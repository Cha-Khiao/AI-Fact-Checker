# 🌐 AI Fact-Checker — Frontend Web Application

> **ส่วนติดต่อผู้ใช้งาน (Frontend Web Client)** ของโครงการ **AI Fact-Checker**  
> พัฒนาด้วย **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4** และ **Three.js WebGL**

---

## 🎨 คุณลักษณะการออกแบบและส่วนติดต่อผู้ใช้งาน (UI/UX Features)

- 🦅 **3D WebGL Background (Vanta.js):** พื้นหลังกราฟิกแอนิเมชัน 3D ตอบสนองต่อการเลื่อนเมาส์ พร้อมรองรับโหมดสว่างและโหมดมืด (Light/Dark Mode)
- 🧭 **Connection Status Indicator:** ตรวจจับสถานะการเชื่อมต่อกับเซิร์ฟเวอร์แบบเรียลไทม์ (โหมดออนไลน์เชื่อมต่อสด / โหมดสาธิต)
- 💡 **10 Demo Presets:** ตัวเลือกกรณีศึกษา 10 ตัวอย่างสำหรับทดสอบการแสดงผลหน้าบ้าน
- 🛡️ **Input Guardrails:** ตรวจสอบความถูกต้องของลิงก์และคัดกรองเนื้อหาก่อนส่งประมวลผล
- ⚡ **Dual Communication Client (`useFactCheck`):** รับข้อมูลผลลัพธ์ผ่าน Server-Sent Events (SSE) พร้อมระบบสลับใช้ REST API สำรอง
- 📊 **Data Visualizations:**
  - มาตรวัดคะแนนความน่าเชื่อถือ 5 ระดับ (5-Tier Score Meter)
  - การ์ดแจกแจงประเด็นย่อยและแหล่งอ้างอิง
  - แดชบอร์ดสรุปสถิติในรูปแบบกราฟโดนัทและกราฟแท่ง

---

## 📂 โครงสร้างโฟลเดอร์หน้าบ้าน (Frontend Architecture)

```
web/
├── src/
│   ├── app/                         # Next.js App Router Pages
│   │   ├── layout.tsx               # Root Layout, Metadata, Theme Provider
│   │   ├── page.tsx                 # หน้าหลักระบบตรวจสอบ (Home Page)
│   │   ├── globals.css              # Tailwind CSS v4 & Theme Rules
│   │   ├── providers.tsx            # Theme Provider (next-themes)
│   │   ├── dashboard/page.tsx       # หน้าแดชบอร์ดแสดงสถิติ
│   │   └── result/page.tsx          # หน้ารายงานผลการวิเคราะห์ข้อเท็จจริง
│   │
│   ├── components/                  # ส่วนประกอบ UI ทั้งหมด
│   │   ├── Navbar.tsx               # แถบเมนูนำทาง สถานะระบบ และปุ่มสลับธีม
│   │   ├── SearchHero.tsx           # กล่องรับข้อความ/ลิงก์
│   │   ├── ScoreMeter.tsx           # มาตรวัดคะแนนความน่าเชื่อถือ
│   │   ├── EvidenceCards.tsx        # การ์ดแสดงประเด็นย่อย
│   │   ├── ReferenceList.tsx        # รายการแหล่งข่าวและหลักฐานอ้างอิง
│   │   ├── SystemAuditCard.tsx      # ข้อมูลเวลาประมวลผลและการทำงาน
│   │   ├── TrendingChips.tsx        # ตัวเลือกกรณีศึกษาตัวอย่าง
│   │   ├── OfflineDemoAlertModal.tsx# การแจ้งเตือนเมื่ออยู่ในโหมดสาธิต
│   │   ├── GuardrailModal.tsx       # การแจ้งเตือนข้อกำหนดอินพุต
│   │   ├── MixedInputNoticeModal.tsx# การแจ้งเตือนเมื่อพบเนื้อหาผสม
│   │   ├── HistoryDrawer.tsx        # แถบประวัติการตรวจล่าสุด (LocalStorage)
│   │   ├── VantaBirdsBackground.tsx # คอมโพเนนต์พื้นหลัง 3D WebGL
│   │   └── landing/                 # ส่วนประกอบ Landing Page (Features, FAQ ฯลฯ)
│   │
│   ├── hooks/                       # Custom React Hooks
│   │   ├── useFactCheck.ts          # จัดการการส่งตรวจ SSE / REST / Demo
│   │   └── useHealthCheck.ts        # ตรวจสอบสถานะการเชื่อมต่อเซิร์ฟเวอร์
│   │
│   ├── lib/                         # ยูทิลิตี้และข้อมูลตัวอย่าง
│   │   ├── demoData.ts              # ข้อมูลตัวอย่าง 10 กรณีศึกษา
│   │   ├── guardrail.ts             # ตรรกะตรวจสอบ URL และคัดกรองอินพุต
│   │   └── utils.ts                 # ฟังก์ชันตัดแต่งข้อความและยูทิลิตี้ทั่วไป
│   │
│   └── types/                       # TypeScript Interface Definitions
│       ├── index.ts                 # FactCheckResult, VerdictData ฯลฯ
│       └── vanta.d.ts               # Type Definition สำหรับ Vanta.js
│
├── public/                          # ไฟล์ Static Assets
├── package.json                     # รายการ Dependencies และ Scripts
├── tsconfig.json                    # การตั้งค่า TypeScript Compiler
└── next.config.ts                   # การตั้งค่า Next.js
```

---

## 💻 คำสั่งสำหรับการพัฒนาและการรันระบบ (Commands)

```bash
# 1. ติดตั้ง Dependencies
npm install

# 2. รันเซิร์ฟเวอร์สำหรับการพัฒนา (พอร์ต 3000)
npm run dev

# 3. Build สำหรับ Production
npm run build

# 4. เริ่มรัน Production Server
npm start

# 5. ตรวจสอบ Linting
npm run lint
```

---

## 🌐 ตัวแปรสภาพแวดล้อม (Environment Variables)

กำหนดค่าในไฟล์ `web/.env.local`:

```env
# URL ของเซิร์ฟเวอร์หลังบ้าน FastAPI
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 👥 ข้อมูลผู้จัดทำและสถาบันการศึกษา (Academic Information)

- **โครงงาน:** AI Fact-Checker (Senior Capstone Project)
- **สาขาวิชา (Department):** สาขาวิชาวิทยาการคอมพิวเตอร์ (Department of Computer Science)
- **สถาบันการศึกษา (University):** มหาวิทยาลัยราชภัฏศรีสะเกษ (Sisaket Rajabhat University)
- **ปีการศึกษา (Academic Year):** 2569 (2026)
- **สิทธิ์การใช้งาน (License):** [MIT License](../LICENSE)

---

## 🤖 คำชี้แจงการพัฒนาด้วยปัญญาประดิษฐ์ (AI-Assisted Development Statement)

ส่วนติดต่อผู้ใช้งาน (Frontend Web Client) นี้ได้รับการพัฒนาโดยใช้ AI เป็นเครื่องมือสนับสนุนในการเขียนโค้ดและจัดโครงสร้างระบบ (AI-Assisted Development) ทั้งการวางโครงสร้าง Next.js 16 App Router, การเขียน TypeScript Interfaces, การปรับแต่งสไตล์ Tailwind CSS v4 และการจัดการ State
