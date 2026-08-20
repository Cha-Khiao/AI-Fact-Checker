"use client";

import React from "react";
import { Fade } from "@/components/Fade";
import {
  LinkSimple,
  Brain,
  MagnifyingGlass,
  ShieldCheck,
  Scales,
  LockKey,
} from "@phosphor-icons/react";

const mergedFeatures = [
  {
    icon: LinkSimple,
    title: "สกัดข้อมูลทั้ง URL โซเชียล & ข้อความ",
    description:
      "รองรับทั้งลิงก์โซเชียล (Facebook, X/Twitter, Instagram, LINE Today), เว็บไซต์ข่าว และข้อความข่าวลือโดยตรง พร้อมระบบสกัดและคัดกรองเฉพาะเนื้อหาสำคัญ",
    borderTop: "border-t-blue-500",
    iconTheme: "bg-blue-500/15 dark:bg-blue-500/25 text-blue-600 dark:text-cyan-400 ring-1 ring-blue-500/40",
    hoverAura: "hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.35)] dark:hover:border-blue-400 dark:hover:shadow-[0_0_25px_2px_rgba(59,130,246,0.45)]",
  },
  {
    icon: Brain,
    title: "AI Planner วางแผนสืบค้น 5W1H",
    description:
      "วิเคราะห์และถอดรหัสบริบท ใคร ทำอะไร ที่ไหน เมื่อไหร่ เพื่อกำหนดหัวข้อการค้นหาอย่างเป็นระบบ ป้องกันการอนุมานเองและควบคุมการสืบค้นให้ตรงประเด็น",
    borderTop: "border-t-cyan-500",
    iconTheme: "bg-cyan-500/15 dark:bg-cyan-500/25 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/40",
    hoverAura: "hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.35)] dark:hover:border-cyan-400 dark:hover:shadow-[0_0_25px_2px_rgba(6,182,212,0.45)]",
  },
  {
    icon: MagnifyingGlass,
    title: "Dual-Search Live Engine",
    description:
      "สืบค้นหลักฐานสดแบบคู่ขนานผ่าน Exa Semantic Search และ Google Serper โดยอ้างอิงจากรายชื่อสำนักข่าวและหน่วยงานทางการกว่า 60+ แห่ง พร้อมกรองโดเมนขยะอัตโนมัติ",
    borderTop: "border-t-indigo-500",
    iconTheme: "bg-indigo-500/15 dark:bg-indigo-500/25 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/40",
    hoverAura: "hover:border-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.35)] dark:hover:border-indigo-400 dark:hover:shadow-[0_0_25px_2px_rgba(99,102,241,0.45)]",
  },
  {
    icon: ShieldCheck,
    title: "เทียบเคียงประเด็น & Anti-Debunk Gate",
    description:
      "AI Analyzer เทียบเคียงข้อมูลสดกับข้อกล่าวอ้าง พร้อมตรวจสอบระบบ 'Anti-Debunk Gate' ดักจับข่าวที่ถูกศูนย์ต่อต้านข่าวปลอมหรือหน่วยงานทางการชี้แจงหักล้างแล้ว",
    borderTop: "border-t-amber-500",
    iconTheme: "bg-amber-500/15 dark:bg-amber-500/25 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/40",
    hoverAura: "hover:border-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] dark:hover:border-amber-400 dark:hover:shadow-[0_0_25px_2px_rgba(245,158,11,0.45)]",
  },
  {
    icon: Scales,
    title: "ประเมินคะแนนมาตรฐาน IFCN 5 ระดับ",
    description:
      "รายงานผลลัพธ์เป็นระดับความน่าเชื่อถือ 5 ระดับ (ตั้งแต่ 0% ถึง 100%) พร้อมเปิดเผยหลักฐานอย่างโปร่งใส ทั้งจุดที่ยืนยันและจุดที่ขัดแย้ง โดยไม่ซ่อนข้อมูลหักล้าง",
    borderTop: "border-t-purple-500",
    iconTheme: "bg-purple-500/15 dark:bg-purple-500/25 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/40",
    hoverAura: "hover:border-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.35)] dark:hover:border-purple-400 dark:hover:shadow-[0_0_25px_2px_rgba(168,85,247,0.45)]",
  },
  {
    icon: LockKey,
    title: "Stateless Architecture ไร้การเก็บข้อมูล",
    description:
      "สถาปัตยกรรมไร้ฐานข้อมูล (No DB) ประมวลผลบน RAM ชั่วคราวและทิ้งทันที บันทึกประวัติเฉพาะใน Local Storage ของผู้ใช้เพื่อความเป็นส่วนตัวสูงสุดตามกฎหมาย PDPA",
    borderTop: "border-t-emerald-500",
    iconTheme: "bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/40",
    hoverAura: "hover:border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] dark:hover:border-emerald-400 dark:hover:shadow-[0_0_25px_2px_rgba(16,185,129,0.45)]",
  },
];

export default function CoreFeatures() {
  return (
    <section id="features" className="py-14 sm:py-20">
      <div className="wrapper">
        <Fade triggerOnce direction="up">
          <div className="mb-12 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-snug">
              ฟีเจอร์และกระบวนการทำงานที่เป็นระบบ
              <span className="block text-base sm:text-xl font-bold text-blue-600 dark:text-cyan-400 mt-1">
                (Stateless RAG Architecture)
              </span>
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              AI Fact-Checker ผสานเทคโนโลยีการสืบค้นสดและการวิเคราะห์ข้อเท็จจริงอย่างเป็นขั้นตอน เพื่อผลลัพธ์ที่แม่นยำ โปร่งใส และตรวจสอบได้จริง
            </p>
          </div>
        </Fade>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {mergedFeatures.map((feat, idx) => (
            <Fade key={feat.title} triggerOnce direction="up" delay={idx * 70}>
              <div
                className={`h-full p-6 sm:p-7 rounded-3xl solid-card border-t-4 ${feat.borderTop} relative flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1.5 ${feat.hoverAura} shadow-md group`}
              >
                <div>
                  <div className="flex items-center gap-3.5 mb-3.5">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${feat.iconTheme} group-hover:scale-110 transition-transform`}>
                      <feat.icon size={24} weight="duotone" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                      {feat.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {feat.description}
                  </p>
                </div>
              </div>
            </Fade>
          ))}
        </div>
      </div>
    </section>
  );
}
