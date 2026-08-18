# DEPLOYMENT.md — คู่มือการนำระบบขึ้นใช้งานจริง (Production Deployment Guide)

คู่มือฉบับสมบูรณ์สำหรับการ Deploy ระบบ **AI Fact-Checker** ด้วย **Frontend (Vercel) + Backend (Render) + Keep-Alive (cron-job.org / Better Stack)**

---

## 📋 1. ข้อมูลจำเป็นสำหรับ Environment Variables

ก่อนเริ่ม Deploy ให้เตรียมค่า API Key ต่อไปนี้:

| ตัวแปร (Variable) | ฝั่งที่ใช้ | คำอธิบาย | ตัวอย่างค่า |
|:---|:---|:---|:---|
| `AI_MODEL` | Backend | โมเดล LLM หลักที่ใช้ตลอดระบบ | `google/gemini-2.5-flash` |
| `OPENROUTER_API_KEY` | Backend | API Key สำหรับเรียกใช้ LLM ผ่าน OpenRouter | `sk-or-v1-...` |
| `EXA_API_KEY` | Backend | API Key สำหรับ Exa Semantic Search | `...` |
| `SERPER_API_KEY` | Backend | API Key สำหรับ Google Live Search | `...` |
| `GSHEETS_WEBHOOK_URL` | Backend | (ไม่บังคับ) URL ส่ง Telemetry Log ลง Google Sheets | `https://script.google.com/...` |
| `FACTCHECK_DEADLINE_SECONDS` | Backend | เพดานเวลารวมสูงสุดต่อการตรวจสอบ 1 ครั้ง | `45` |
| `NEXT_PUBLIC_API_URL` | Frontend | URL ของ Backend Render (ไม่มี `/` ท้าย) | `https://factcheck-api.onrender.com` |

---

## 🚀 2. ขั้นตอนการ Deploy ทีละสเต็ป (Step-by-Step)

### 🔹 สเต็ปที่ 1: Deploy Backend บน Render.com (ฟรี 100%)

1. เข้าเว็บไซต์ [Render.com](https://render.com) $\rightarrow$ กด **New +** $\rightarrow$ เลือก **Web Service**
2. เชื่อมต่อ Git Repository โปรเจกต์นี้
3. ตั้งค่าบริการ:
   - **Name:** `factcheck-api` (หรือชื่อที่คุณต้องการ)
   - **Region:** `Singapore` (ใกล้ไทยที่สุดและเร็วที่สุด)
   - **Branch:** `main` หรือ `dev`
   - **Root Directory:** *(เว้นว่างไว้)*
   - **Runtime:** `Python 3` (หรือเลือก `Docker` ก็ได้เพราะมี Dockerfile ในตัว)
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`
4. เพิ่ม **Environment Variables** ในหน้าตั้งค่า:
   - `AI_MODEL` = `google/gemini-2.5-flash`
   - `OPENROUTER_API_KEY` = *(คีย์ของคุณ)*
   - `EXA_API_KEY` = *(คีย์ของคุณ)*
   - `SERPER_API_KEY` = *(คีย์ของคุณ)*
   - `GSHEETS_WEBHOOK_URL` = *(URL เว็ปฮุก ถ้ามี)*
   - `FACTCHECK_DEADLINE_SECONDS` = `45`
5. กด **Create Web Service** $\rightarrow$ รอประมาณ 2–3 นาทีจนสถานะขึ้น **Live**
6. ทดสอบความพร้อม: เปิดเบราว์เซอร์ไปที่ `https://<ชื่อแอปของคุณ>.onrender.com/health` จะต้องขึ้นข้อความ:
   ```json
   {"status":"healthy","timestamp":17...}
   ```
7. คัดลอก URL ของ Backend เก็บไว้ เช่น `https://factcheck-api.onrender.com`

---

### 🔹 สเต็ปที่ 2: ตั้งค่า Keep-Alive Ping (ป้องกันเซิร์ฟเวอร์หลับ 100%)

เพื่อป้องกันไม่ให้ Render สั่งเซิร์ฟเวอร์หลับระหว่างการนำเสนอโปรเจกต์:

#### เลือกใช้ **cron-job.org** (แนะนำ - ฟรี & ง่ายมาก):
1. เข้า [cron-job.org](https://cron-job.org) แล้วสมัครสมาชิกฟรี
2. กด **Create Cronjob**
3. ตั้งค่า:
   - **Title:** `FactCheck Keep-Alive`
   - **URL:** `https://<ชื่อแอปของคุณ>.onrender.com/health` (URL Backend จากสเต็ปที่ 1)
   - **Execution Schedule:** เลือก **Every 5 minutes** (หรือ Every 2 minutes)
4. กด **Save**
5. **ผลลัพธ์:** ระบบจะยิงทักทายทุก 5 นาที ทำให้ Backend บน Render **ตื่นตลอด 24 ชั่วโมง ไม่มีหลับ ไม่มี Cold Start**

*(หรือใช้ [Better Stack Uptime](https://betterstack.com/uptime) เพื่อมอนิเตอร์สถานะแบบ Real-time พร้อมแจ้งเตือนเข้าเมลได้เช่นกัน)*

---

### 🔹 สเต็ปที่ 3: Deploy Frontend บน Vercel (ฟรี 100%)

1. เข้า [Vercel.com](https://vercel.com) $\rightarrow$ กด **Add New...** $\rightarrow$ **Project**
2. เลือก Repository นี้
3. ตั้งค่าโปรเจกต์:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** ให้กด Edit แล้วเลือกโฟลเดอร์ **`web`**
4. ในหัวข้อ **Environment Variables** ให้เพิ่มตัวแปร:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://<ชื่อแอปของคุณ>.onrender.com` *(URL Backend จากสเต็ปที่ 1 โดยไม่ต้องใส่ slash ปิดท้าย)*
5. กด **Deploy** $\rightarrow$ รอประมาณ 1–2 นาที Vercel จะสร้างลิงก์เว็บไซต์ให้คุณพร้อมใช้งานทันที (เช่น `https://factcheck-web.vercel.app`)

---

## 💻 3. แผนสำรองสำหรับวันนำเสนอ (Offline / Local Backup)

ในวันสอบหรือนำเสนอ หากระบบเครือข่ายห้องสอบขัดข้อง คุณสามารถรันระบบสำรองในเครื่องตัวเองได้ทันที:

```bash
# 1. เปิด Terminal ในโฟลเดอร์โปรเจกต์
docker compose up -d

# 2. เปิดเบราว์เซอร์ใช้งานได้ทันทีที่:
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
```

---

## ✅ Checklist ตรวจสอบความพร้อม

- [x] Backend ทำงานปกติ ตอบกลับ `/health` ได้รวดเร็ว
- [x] Cron-job / Keep-Alive ตั้งเวลายิง Ping สม่ำเสมอ เซิร์ฟเวอร์ไม่หลับ
- [x] Frontend บน Vercel มีตัวแปร `NEXT_PUBLIC_API_URL` ชี้ไปที่ Render Backend อย่างถูกต้อง
- [x] ทดสอบการค้นหาทั้งแบบวางลิงก์และพิมพ์ข้อความ ส่งผลลัพธ์ SSE Stream ลื่นไหล
- [x] ไฟล์ `.gitignore` บล็อกไฟล์ `.env` และข้อมูลส่วนบุคคล ปลอดภัย 100%
