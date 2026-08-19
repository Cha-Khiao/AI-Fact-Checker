"use client";

import React, { useState, useEffect } from "react";
import { Fade } from "react-awesome-reveal";
import { Lottie } from "lottie-react";
import {
  CheckCircle,
  XCircle,
  Quotes,
  Article,
  SpinnerGap,
  ArrowRight,
  LinkSimple,
  ClipboardText,
  TrashSimple,
} from "@phosphor-icons/react";
import { NumberTicker } from "../NumberTicker";

interface StepData {
  id: number;
  title: string;
  subtitle: string;
  description: string[];
}

const steps: StepData[] = [
  {
    id: 1,
    title: "1. วางลิงก์ หรือพิมพ์ข้อความข่าวสาร",
    subtitle: "รองรับการกรอกข้อมูลทั้งรูปแบบลิงก์และข้อความในช่องเดียว",
    description: [
      "ไม่ว่าจะวางในแท็บใด ระบบจะแยกแยะประเภทข้อมูลและคัดกรองให้อัตโนมัติ เพื่อความสะดวกในการใช้งาน",
      "รองรับลิงก์โซเชียลมีเดีย (Facebook, X/Twitter, Instagram, LINE Today) หรือเว็บไซต์ข่าวทั่วไป โดยจำกัด 1 ลิงก์ต่อครั้งเพื่อประสิทธิภาพความแม่นยำ (และมีแผนรองรับเพิ่มขึ้นในอนาคต)",
      "หรือคัดลอกข้อความข่าวลือ ข้อความส่งต่อจากแชทกลุ่ม มาวางตรวจสอบได้ยาวสูงสุด 1,500 ตัวอักษร",
    ],
  },
  {
    id: 2,
    title: "2. AI สกัดเนื้อหาและสืบค้นคู่ขนานสด",
    subtitle: "กระบวนการสืบค้นข้อมูลแบบ Real-time Dual-Search Engine",
    description: [
      "ระบบดึงข้อความสำคัญจากลิงก์ ล้างข้อความขยะ และวิเคราะห์ 5W1H (ใคร ทำอะไร ที่ไหน เมื่อไหร่) เพื่อวางแผนการสืบค้น",
      "สืบค้นหลักฐานสดผ่าน Exa Semantic Search และ Google Serper โดยอ้างอิงจากรายชื่อสำนักข่าวและหน่วยงานทางการกว่า 60+ แห่ง",
      "AI Analyzer เทียบเคียงข้อมูลรอบด้าน พร้อมตรวจสอบ 'Anti-Debunk Gate' ดักจับข่าวที่ถูกหน่วยงานทางการชี้แจงหักล้างแล้ว",
    ],
  },
  {
    id: 3,
    title: "3. ตรวจสอบคะแนนและหลักฐานโปร่งใส",
    subtitle: "รายงานผลลัพธ์ตามเกณฑ์มาตรฐาน IFCN 5 ระดับ พร้อมแสดงแหล่งอ้างอิง",
    description: [
      "แสดงคะแนนความน่าเชื่อถือ (%) พร้อมคำอธิบายระดับผลการตรวจสอบที่เข้าใจง่าย",
      "จัดวางแบบ 2 คอลัมน์คู่ขนาน: ฝั่งซ้ายคือข้อความข่าวต้นฉบับ ฝั่งขวาคือใจความสำคัญของประเด็นข่าว",
      "แสดงหลักฐานอย่างโปร่งใส: ระบุทั้งข้อเท็จจริงที่สอดคล้อง (สีเขียว) และจุดขัดแย้ง/ข้อหักล้าง (สีแดง) พร้อมลิงก์เปิดอ่านแหล่งข่าวต้นฉบับ",
    ],
  },
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isHovered, setIsHovered] = useState(false);
  const current = steps.find((s) => s.id === activeStep) || steps[0];

  useEffect(() => {
    if (isHovered) return;

    const timer = setInterval(() => {
      setActiveStep((prev) => (prev % 3) + 1);
    }, 4000);

    return () => clearInterval(timer);
  }, [activeStep, isHovered]);

  const handleStepClick = (stepNum: number) => {
    setActiveStep(stepNum);
  };

  return (
    <section id="how-it-works" className="py-14 sm:py-20">
      <div className="wrapper">
        <Fade triggerOnce direction="up">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              วิธีใช้งานระบบตรวจสอบข้อเท็จจริง
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              ระบบรองรับทั้งลิงก์โซเชียล เว็บไซต์ข่าว และข้อความข่าวสาร พร้อมประมวลผลและเทียบเคียงข้อมูลตามขั้นตอน
            </p>
          </div>
        </Fade>

        <div className="flex justify-center items-center gap-3 sm:gap-4 mb-8">
          {[1, 2, 3].map((stepNum) => {
            const isActive = activeStep === stepNum;
            return (
              <button
                key={stepNum}
                type="button"
                onClick={() => handleStepClick(stepNum)}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-bold text-sm sm:text-base transition-all duration-300 cursor-pointer ${isActive
                  ? "bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400 scale-110"
                  : "solid-card text-slate-700 dark:text-slate-200 hover:border-blue-400 hover:text-blue-600 dark:hover:text-cyan-300"
                  }`}
                title={`ดูขั้นตอนที่ ${stepNum}`}
              >
                <span>{stepNum}</span>
              </button>
            );
          })}
        </div>

        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Fade key={current.id} triggerOnce direction="up" duration={350}>
            <div className="max-w-5xl mx-auto rounded-3xl solid-card border-t-4 border-t-blue-500 p-6 sm:p-9 md:p-10 shadow-lg">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 flex flex-col justify-center space-y-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                      {current.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-500 dark:text-cyan-300 font-medium mt-1.5 mb-4">
                      {current.subtitle}
                    </p>
                  </div>

                  <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {current.description.map((desc, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:text-cyan-400 mt-0.5 font-bold text-[11px]">
                          {idx + 1}
                        </div>
                        <span>{desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="lg:col-span-6">

                  {activeStep === 1 && (
                    <div className="rounded-2xl solid-card border-t-4 border-t-blue-500 p-4 sm:p-5 shadow-md">
                      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-[#2b446b]">
                        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-xs font-semibold">
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold">
                            <LinkSimple size={14} weight="bold" />
                            <span>ลิงก์โซเชียล</span>
                          </span>
                          <span className="flex items-center gap-1 px-2.5 py-1 text-slate-600 dark:text-slate-400">
                            <span>ข้อความข่าว</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-[#331824] border border-rose-200/80 dark:border-rose-500/40">
                            <TrashSimple size={12} weight="bold" />
                            <span>ล้าง</span>
                          </span>
                          <span className="flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-cyan-300 bg-blue-50 dark:bg-[#193254] border border-blue-200/80 dark:border-cyan-500/40">
                            <ClipboardText size={12} weight="bold" />
                            <span>วาง</span>
                          </span>
                        </div>
                      </div>

                      <div className="py-2.5 text-xs text-slate-800 dark:text-slate-100 font-medium leading-relaxed min-h-[75px]">
                        <p className="text-blue-600 dark:text-cyan-400 font-mono text-[11px] mb-1">
                          https://www.facebook.com/share/p/18x9Y...
                        </p>
                        <p className="text-slate-700 dark:text-slate-300">
                          &quot;แชร์ด่วน! รัฐบาลแจกเงินดิจิทัลรอบพิเศษ 5,000 บาท ให้ผู้สูงอายุลงทะเบียนผ่านลิงก์นี้...&quot;
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-200 dark:border-[#2b446b] text-xs">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-blue-600 dark:text-cyan-300">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-[#193254] border border-blue-200 dark:border-cyan-500/30">
                            Facebook
                          </span>
                          <span>128/1500 ตัวอักษร</span>
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 text-white text-xs font-bold shadow-sm flex items-center gap-1 animate-pulse">
                          <span>เริ่มตรวจสอบ</span>
                          <ArrowRight size={13} weight="bold" />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="rounded-2xl solid-card p-4 sm:p-5 shadow-md">
                      <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-5 flex flex-col items-center justify-center text-center border-r border-slate-200 dark:border-[#2b446b] pr-3">
                          <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full bg-cyan-400/30 dark:bg-cyan-400/40 blur-xl animate-pulse" />
                            <Lottie
                              src="/loading-animation.json"
                              className="w-full h-full object-contain relative z-10 dark:brightness-110 drop-shadow-md"
                              autoplay
                              loop
                            />
                          </div>

                          <div className="text-2xl sm:text-3xl font-black font-mono text-blue-600 dark:text-cyan-400 mt-1">
                            <NumberTicker value={65} suffix="%" />
                          </div>

                          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>กำลังประมวลผล · 1.8s</span>
                          </div>
                        </div>

                        <div className="col-span-7 space-y-2 text-xs font-medium pl-1">
                          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle size={16} weight="bold" className="shrink-0" />
                            <span className="truncate text-[11px] sm:text-xs">1. สกัดเนื้อหาต้นทาง (เสร็จสิ้น)</span>
                          </div>
                          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle size={16} weight="bold" className="shrink-0" />
                            <span className="truncate text-[11px] sm:text-xs">2. AI วางแผน 5W1H (เสร็จสิ้น)</span>
                          </div>
                          <div className="flex items-center gap-2 text-blue-600 dark:text-cyan-400 font-bold p-1.5 rounded-lg bg-blue-50/80 dark:bg-[#13253d] border border-blue-200 dark:border-[#2b446b]">
                            <SpinnerGap size={15} weight="bold" className="animate-spin text-blue-500 shrink-0" />
                            <span className="truncate text-[11px] sm:text-xs">3. สืบค้นสด (Exa + Google)</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[11px] sm:text-xs opacity-60">
                            <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] font-mono shrink-0">4</span>
                            <span className="truncate">4. เทียบเคียงและสรุปผล IFCN</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 3 && (
                    <div className="space-y-3">
                      <div className="text-center py-2 relative">
                        <div className="absolute inset-x-1/4 top-1/2 -translate-y-1/2 h-10 bg-rose-500/20 dark:bg-rose-500/30 blur-2xl pointer-events-none rounded-full" />
                        <div className="text-4xl font-black font-mono tracking-tight text-rose-500 dark:text-rose-400 relative z-10">
                          <NumberTicker value={25} suffix="%" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block mt-0.5 relative z-10">
                          ข้อมูลบิดเบือน (Mostly False)
                        </span>
                      </div>

                      {/* Split 2-Column: Original vs Core Thesis */}
                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div className="p-3 rounded-2xl solid-card border-t-4 border-t-blue-500 shadow-xs">
                          <div className="flex items-center gap-1.5 text-blue-600 dark:text-cyan-400 font-bold text-[11px] mb-1">
                            <Quotes size={14} weight="fill" />
                            <span>ข้อความต้นฉบับ</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-200 line-clamp-2 text-[11px] font-medium leading-relaxed">
                            “อ้างรัฐบาลแจกเงินดิจิทัล 5,000 บาท”
                          </p>
                        </div>

                        <div className="p-3 rounded-2xl solid-card border-t-4 border-t-indigo-500 shadow-xs">
                          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] mb-1">
                            <Article size={14} weight="fill" />
                            <span>ใจความสำคัญ</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-200 line-clamp-2 text-[11px] font-medium leading-relaxed">
                            เป็นข่าวลวง ไม่มีนโยบายดังกล่าว
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-medium">
                        <div className="p-2.5 rounded-xl solid-card border-t-4 border-t-emerald-500 text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5 shadow-xs">
                          <CheckCircle size={14} weight="fill" className="text-emerald-500 shrink-0" />
                          <span className="truncate">ยืนยัน: กระทรวงการคลังไม่มีโครงการนี้</span>
                        </div>
                        <div className="p-2.5 rounded-xl solid-card border-t-4 border-t-rose-500 text-rose-800 dark:text-rose-200 flex items-center gap-1.5 shadow-xs">
                          <XCircle size={14} weight="fill" className="text-rose-500 shrink-0" />
                          <span className="truncate">ขัดแย้ง: ศูนย์ต่อต้านชี้แจงข่าวปลอม</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </Fade>
        </div>
      </div>
    </section>
  );
}
