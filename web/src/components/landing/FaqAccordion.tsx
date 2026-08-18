"use client";

import React, { useState } from "react";
import { Fade } from "react-awesome-reveal";
import { CaretDown, Question, Sparkle } from "@phosphor-icons/react";

const faqs = [
  {
    question: "ระบบสามารถตรวจสอบข้อมูลจากแหล่งใดได้บ้าง?",
    answer:
      "ระบบสามารถตรวจสอบได้ทั้งลิงก์โพสต์โซเชียลมีเดียข้อความ (Facebook, X/Twitter, Instagram, Threads, LINE Today) ลิงก์เว็บไซต์ข่าวทั่วไป และข้อความข่าวลือที่คัดลอกมาวางโดยตรง",
  },
  {
    question: "เกณฑ์คะแนนความน่าเชื่อถือ 5 ระดับ ทำงานอย่างไร?",
    answer:
      "ยึดเกณฑ์มาตรฐานสากล: ระดับ 5 (สอดคล้องสมบูรณ์ 100%), ระดับ 4 (สอดคล้องส่วนใหญ่ 75%), ระดับ 3 (ข้อมูลก้ำกึ่ง/ยังไม่มีข้อยุติ 50%), ระดับ 2 (ข้อมูลบิดเบือน 25%), และระดับ 1 (ข้อมูลเท็จ/ข่าวปลอม 0%)",
  },
  {
    question: "การทำงานเป็นแบบ Real-time ใช่หรือไม่?",
    answer:
      "ใช่ครับ ทุกครั้งที่มีการตรวจสอบ ระบบจะยิงค้นหาข้อมูลสด (Live Search) ผ่าน Exa และ Google Serper แบบคู่ขนาน แล้วส่งต่อให้ AI วิเคราะห์ จึงได้ข้อมูลล่าสุดเสมอ",
  },
  {
    question: "ระบบมีความเป็นส่วนตัวและปลอดภัยอย่างไร?",
    answer:
      "ระบบทำงานแบบ Stateless 100% ไม่มีการบันทึกข้อมูลส่วนตัวลงฐานข้อมูล ประวัติการตรวจสอบจะถูกบันทึกไว้ในเบราว์เซอร์ของคุณเท่านั้น (Local Storage) และสามารถลบได้ตลอดเวลา",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-14 sm:py-20">
      <div className="wrapper">
        <Fade triggerOnce direction="up">
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
              <Sparkle size={12} weight="fill" />
              <span>คลายข้อสงสัย</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              คำถามที่พบบ่อย (FAQ)
            </h2>
          </div>
        </Fade>

        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <Fade key={faq.question} triggerOnce direction="up" delay={index * 60}>
                <div className="rounded-2xl glass-panel overflow-hidden transition-all shadow-sm">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-4 sm:p-5 text-left cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Question size={18} weight="duotone" className="text-blue-500 shrink-0" />
                      <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                        {faq.question}
                      </span>
                    </div>
                    <CaretDown
                      size={16}
                      weight="bold"
                      className={`text-slate-400 transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180 text-blue-500" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              </Fade>
            );
          })}
        </div>
      </div>
    </section>
  );
}
