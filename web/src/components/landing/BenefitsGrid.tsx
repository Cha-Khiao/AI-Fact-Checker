"use client";

import React from "react";
import { Fade } from "react-awesome-reveal";
import {
  Timer,
  ShieldCheckered,
  ShareNetwork,
  Lightning,
  Sparkle,
} from "@phosphor-icons/react";

const benefits = [
  {
    icon: Timer,
    title: "ประหยัดเวลา",
    description: "รับผลการตรวจสอบพร้อมหลักฐานจริงในไม่กี่วินาที แทนการค้นหาและอ่านเทียบเคียงด้วยตนเอง",
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    icon: ShieldCheckered,
    title: "โปร่งใส & ตรวจสอบได้",
    description: "หลักฐานทุกชิ้นเปิดเผยลิงก์ต้นทาง ไม่มีการซ่อนข้อมูลที่ขัดแย้ง ยึดเกณฑ์มาตรฐาน 5 ระดับ",
    color: "text-cyan-500 bg-cyan-500/10",
  },
  {
    icon: ShareNetwork,
    title: "สร้างการ์ดแชร์เตือนภัย",
    description: "แปลงผลการตรวจสอบเป็นรูปภาพการ์ดสรุปผลที่สวยงาม เพื่อแชร์เตือนภัยคนใกล้ตัวได้ทันที",
    color: "text-purple-500 bg-purple-500/10",
  },
  {
    icon: Lightning,
    title: "ใช้งานฟรี 100% (No DB)",
    description: "ระบบเปิดแบบสาธารณะ ไม่ต้องสมัครสมาชิก ไม่เก็บข้อมูลส่วนบุคคล ทำงานแบบ Stateless รวดเร็ว",
    color: "text-amber-500 bg-amber-500/10",
  },
];

export default function BenefitsGrid() {
  return (
    <section id="benefits" className="py-14 sm:py-20">
      <div className="wrapper">
        <Fade triggerOnce direction="up">
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-3">
              <Sparkle size={12} weight="fill" />
              <span>คุณค่าที่ได้รับ</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              ทำไมต้องใช้ AI Fact-Checker
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              สร้างภูมิคุ้มกันทางข้อมูลข่าวสารในยุคดิจิทัลด้วยหลักฐานเชิงประจักษ์
            </p>
          </div>
        </Fade>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b, i) => (
            <Fade key={b.title} triggerOnce direction="up" delay={i * 80}>
              <div className="h-full p-6 rounded-2xl glass-panel hover:-translate-y-1 transition-all duration-300 shadow-sm">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${b.color} mb-4`}>
                  <b.icon size={22} weight="duotone" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-2">
                  {b.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {b.description}
                </p>
              </div>
            </Fade>
          ))}
        </div>
      </div>
    </section>
  );
}
