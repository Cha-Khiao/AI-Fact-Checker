"use client";

import React from "react";
import { Fade } from "react-awesome-reveal";
import {
  LinkSimple,
  ChatText,
  MagnifyingGlass,
  Gauge,
  Scales,
  ClockCounterClockwise,
  Sparkle,
} from "@phosphor-icons/react";

const features = [
  {
    icon: LinkSimple,
    title: "ตรวจสอบจาก URL ข่าวโซเชียล",
    description:
      "วางลิงก์จาก X (Twitter), Facebook, Instagram, Threads หรือ LINE Today ระบบจะสกัดเนื้อหาและตรวจสอบให้อัตโนมัติ",
    color: "from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-cyan-400",
  },
  {
    icon: ChatText,
    title: "ตรวจสอบจากข้อความข่าว",
    description:
      "คัดลอกข้อความข่าวที่สงสัยมาวางได้ทันที AI แยกประเด็นสำคัญและค้นหาข้อเท็จจริงโดยไม่ต้องมีลิงก์",
    color: "from-cyan-500/20 to-teal-500/20 text-cyan-600 dark:text-teal-400",
  },
  {
    icon: MagnifyingGlass,
    title: "Dual-Search Live Engine",
    description:
      "สืบค้นหลักฐานสดแบบคู่ขนาน (Exa Semantic Search + Google Serper) เพื่อเทียบเคียงข้อเท็จจริงรอบด้าน",
    color: "from-indigo-500/20 to-blue-500/20 text-indigo-600 dark:text-blue-400",
  },
  {
    icon: Gauge,
    title: "คะแนนความน่าเชื่อถือ 5 ระดับ",
    description:
      'สรุปผลลัพธ์เป็นคะแนนมาตรฐานสากล ตั้งแต่ "สอดคล้องสมบูรณ์" ไปจนถึง "ข่าวปลอม / ถูกหักล้าง"',
    color: "from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-pink-400",
  },
  {
    icon: Scales,
    title: "หลักฐานโปร่งใส ไม่ซ่อนข้อมูล",
    description:
      "แสดงทั้งหลักฐานที่สนับสนุนและจุดที่ขัดแย้งเสมอ หากมีแถลงชี้แจงหักล้าง ระบบจะเปิดเผยให้เห็นอย่างตรงไปตรงมา",
    color: "from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-orange-400",
  },
  {
    icon: ClockCounterClockwise,
    title: "ประวัติการตรวจในเครื่อง (PDPA)",
    description:
      "บันทึกประวัติเฉพาะใน Local Storage ของคุณ ไม่เก็บข้อมูลส่วนบุคคล ไม่ต้องลงทะเบียนหรือล็อกอิน",
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400",
  },
];

export default function CoreFeatures() {
  return (
    <section id="features" className="py-14 sm:py-20">
      <div className="wrapper">
        <Fade triggerOnce direction="up" cascade damping={0.1}>
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-cyan-400 mb-3">
              <Sparkle size={12} weight="fill" />
              <span>ความสามารถระดับสูง</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              ฟีเจอร์หลักเพื่อความจริงที่ตรวจสอบได้
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              ชุดเครื่องมือแยกแยะข่าวจริง ข้อมูลบิดเบือน และข่าวปลอมด้วยเทคโนโลยี AI
            </p>
          </div>
        </Fade>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Fade key={feature.title} triggerOnce direction="up" delay={i * 80}>
              <div className="h-full p-6 rounded-2xl glass-panel hover:-translate-y-1 transition-all duration-300 shadow-sm group">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
                  <feature.icon size={22} weight="duotone" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Fade>
          ))}
        </div>
      </div>
    </section>
  );
}
