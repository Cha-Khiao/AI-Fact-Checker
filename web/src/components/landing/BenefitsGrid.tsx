"use client";

import React from "react";
import { Fade } from "react-awesome-reveal";
import {
  LockKey,
  ShieldCheckered,
  Certificate,
  Brain,
} from "@phosphor-icons/react";

const securityStandards = [
  {
    icon: LockKey,
    title: (
      <>
        Stateless & ไร้การบันทึกข้อมูล
        <span className="block text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
          (PDPA Compliance)
        </span>
      </>
    ),
    description:
      "สถาปัตยกรรมทำงานแบบ Stateless 100% ไร้การเชื่อมต่อฐานข้อมูล (No Database) ข้อมูลที่ส่งเข้ามาจะถูกประมวลผลบนหน่วยความจำชั่วคราวและทิ้งทันทีหลังส่งผลลัพธ์ ไม่มีการจัดเก็บ IP Address หรือข้อมูลส่วนบุคคลใดๆ ประวัติการตรวจถูกบันทึกเฉพาะใน Local Storage ของคุณเท่านั้น",
    borderTop: "border-t-emerald-500",
    iconTheme: "bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/40",
    hoverAura: "hover:border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] dark:hover:border-emerald-400 dark:hover:shadow-[0_0_25px_2px_rgba(16,185,129,0.45)]",
  },
  {
    icon: ShieldCheckered,
    title: (
      <>
        ระบบคัดกรองลิงก์ & ป้องกัน SSRF
        <span className="block text-xs sm:text-sm font-semibold text-blue-600 dark:text-cyan-400 mt-0.5">
          (Network Security)
        </span>
      </>
    ),
    description:
      "ปกป้องความปลอดภัยด้วย URL Sanitizer และ Private Network Isolation เพื่อป้องกันการเข้าถึงเครือข่ายภายใน (Internal IP) สกัดเฉพาะเนื้อหาข่าวที่ปลอดภัย พร้อมระบบสำรองคู่ขนาน (Parallel Fallback) ช่วยให้การดึงข้อมูลทำงานได้อย่างราบรื่นและต่อเนื่อง",
    borderTop: "border-t-blue-500",
    iconTheme: "bg-blue-500/15 dark:bg-blue-500/25 text-blue-600 dark:text-cyan-400 ring-1 ring-blue-500/40",
    hoverAura: "hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.35)] dark:hover:border-blue-400 dark:hover:shadow-[0_0_25px_2px_rgba(59,130,246,0.45)]",
  },
  {
    icon: Certificate,
    title: (
      <>
        อ้างอิงมาตรฐานสากล IFCN 5 ระดับ
        <span className="block text-xs sm:text-sm font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
          (Global Fact-Checking Standard)
        </span>
      </>
    ),
    description:
      "ยึดแนวทางการประเมินตามมาตรฐาน International Fact-Checking Network (IFCN) โดยจำแนกระดับความน่าเชื่อถือ 5 ระดับ (ตั้งแต่ False/0%, Mostly False/25%, Inconclusive/50%, Mostly True/75% จนถึง True/100%) พร้อมแสดงหลักฐานอ้างอิงอย่างโปร่งใส",
    borderTop: "border-t-purple-500",
    iconTheme: "bg-purple-500/15 dark:bg-purple-500/25 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/40",
    hoverAura: "hover:border-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.35)] dark:hover:border-purple-400 dark:hover:shadow-[0_0_25px_2px_rgba(168,85,247,0.45)]",
  },
  {
    icon: Brain,
    title: (
      <>
        กลไกป้องกันการสร้างข้อมูลเท็จ
        <span className="block text-xs sm:text-sm font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
          (Anti-Hallucination RAG)
        </span>
      </>
    ),
    description:
      "ออกแบบกระบวนการ Grounded RAG ให้ระบบวิเคราะห์และสรุปผลจากหลักฐานที่สืบค้นได้จริงเท่านั้น เพื่อลดโอกาสการสร้างข้อมูลที่ไม่ตรงกับความเป็นจริง พร้อมระบบ 'Anti-Debunk Gate' ช่วยตรวจจับข่าวที่ถูกหน่วยงานทางการหรือศูนย์ต่อต้านข่าวปลอมชี้แจงหักล้างแล้ว",
    borderTop: "border-t-amber-500",
    iconTheme: "bg-amber-500/15 dark:bg-amber-500/25 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/40",
    hoverAura: "hover:border-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] dark:hover:border-amber-400 dark:hover:shadow-[0_0_25px_2px_rgba(245,158,11,0.45)]",
  },
];

export default function BenefitsGrid() {
  return (
    <section id="security" className="py-14 sm:py-20">
      <div className="wrapper">
        <Fade triggerOnce direction="up">
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              ความปลอดภัยและมาตรฐานที่ระบบเลือกใช้
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              ออกแบบสถาปัตยกรรมและมาตรฐานความปลอดภัยตามหลักสากล เพื่อความโปร่งใสและคุ้มครองความเป็นส่วนตัวของผู้ใช้
            </p>
          </div>
        </Fade>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {securityStandards.map((item, i) => (
            <Fade key={i} triggerOnce direction="up" delay={i * 80}>
              <div
                className={`h-full p-7 sm:p-8 rounded-3xl solid-card border-t-4 ${item.borderTop} relative flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1.5 ${item.hoverAura} shadow-md group`}
              >
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.iconTheme} group-hover:scale-110 transition-transform mt-0.5`}>
                      <item.icon size={24} weight="duotone" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {item.description}
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
