"use client";

import React, { useState } from "react";
import { Fade } from "react-awesome-reveal";
import { LinkSimple, ChatText, Sparkle } from "@phosphor-icons/react";

const modes = [
  {
    id: "url",
    label: "โหมดลิงก์โซเชียล (URL)",
    icon: <LinkSimple size={16} weight="bold" />,
    title: "ตรวจสอบข่าวจาก URL โซเชียลมีเดีย",
    description:
      "วางลิงก์จาก X, Facebook, Instagram, Threads หรือเว็บไซต์ข่าว ระบบจะสกัดเนื้อหาและสืบค้นหลักฐานให้อัตโนมัติ",
    steps: [
      {
        num: "01",
        title: "วางลิงก์โพสต์หรือข่าว",
        detail: "คัดลอก URL จากโพสต์โซเชียลหรือสำนักข่าวมาวางในช่องค้นหา",
      },
      {
        num: "02",
        title: "AI สกัดเนื้อหา & สืบค้นคู่ขนาน",
        detail: "ระบบดึงข้อความจริงจากลิงก์ แล้วค้นหาหลักฐานอ้างอิงสดผ่าน Exa และ Google Serper",
      },
      {
        num: "03",
        title: "รับคะแนน & แหล่งอ้างอิงโปร่งใส",
        detail: "แสดงคะแนนความน่าเชื่อถือ 5 ระดับ พร้อมจุดยืนยันและจุดขัดแย้งที่ตรวจสอบได้",
      },
    ],
  },
  {
    id: "text",
    label: "โหมดข้อความข่าว (Text)",
    icon: <ChatText size={16} weight="bold" />,
    title: "ตรวจสอบจากข้อความโดยตรง",
    description:
      "เจอข้อความที่ส่งต่อกันในแชทกลุ่มหรือข่าวลือ? คัดลอกข้อความมาวางตรวจสอบได้ทันที",
    steps: [
      {
        num: "01",
        title: "วางข้อความที่น่าสงสัย",
        detail: "วางข้อความข่าวลือหรือประเด็นที่ต้องการตรวจสอบลงในช่องข้อความ",
      },
      {
        num: "02",
        title: "AI Planner วางแผนสืบค้น",
        detail: "AI แยกแยะคีย์เวิร์ดสำคัญและสืบค้นหาข้อเท็จจริงจากฐานข้อมูลข่าวทางการ",
      },
      {
        num: "03",
        title: "รับบทวิเคราะห์เปรียบเทียบ",
        detail: "รับบทวิเคราะห์เชิงลึกและสามารถดาวน์โหลดหรือแชร์การ์ดสรุปผลได้ทันที",
      },
    ],
  },
];

export default function HowItWorks() {
  const [activeId, setActiveId] = useState("url");
  const active = modes.find((m) => m.id === activeId) || modes[0];

  return (
    <section id="how-it-works" className="py-14 sm:py-20">
      <div className="wrapper">
        <Fade triggerOnce direction="up">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mb-3">
              <Sparkle size={12} weight="fill" />
              <span>ขั้นตอนง่ายๆ 3 ขั้นตอน</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              วิธีใช้งานระบบ
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              เลือกรูปแบบที่คุณต้องการตรวจสอบเพื่อดูขั้นตอนการทำงาน
            </p>
          </div>
        </Fade>

        {/* Mode Switch Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {modes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setActiveId(mode.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeId === mode.id
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20"
                  : "glass-panel text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {mode.icon}
              <span>{mode.label}</span>
            </button>
          ))}
        </div>

        {/* Card Display */}
        <Fade key={active.id} triggerOnce direction="up" duration={400}>
          <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-2xl glass-panel shadow-md">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
              {active.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              {active.description}
            </p>

            <div className="space-y-3.5">
              {active.steps.map((step) => (
                <div
                  key={step.title}
                  className="flex items-start gap-4 p-4 rounded-xl bg-slate-100/50 dark:bg-slate-800/40"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400 font-mono text-xs font-bold">
                    {step.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {step.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Fade>
      </div>
    </section>
  );
}
