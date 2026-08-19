"use client";

import React, { useState } from "react";
import { Fade } from "react-awesome-reveal";
import { CaretDown, Question } from "@phosphor-icons/react";

const faqs = [
  {
    question: "ระบบสามารถตรวจสอบข้อมูลจากแหล่งใดได้บ้าง?",
    answer:
      "ระบบสามารถตรวจสอบได้ทั้งลิงก์โพสต์โซเชียลมีเดียข้อความ (Facebook, X/Twitter, Instagram, LINE Today) ลิงก์เว็บไซต์ข่าวทั่วไป และข้อความข่าวสารที่คัดลอกมาวางโดยตรง (จำกัด 1 ลิงก์ต่อครั้ง และความยาวไม่เกิน 1,500 ตัวอักษร)",
  },
  {
    question: "เกณฑ์คะแนนความน่าเชื่อถือ 5 ระดับ ทำงานอย่างไร?",
    answer:
      "อ้างอิงตามเกณฑ์มาตรฐานสากล 5 ระดับ: ระดับ 1 ข้อมูลเท็จ/ข่าวปลอม (0%), ระดับ 2 ข้อมูลบิดเบือน (25%), ระดับ 3 ข้อมูลก้ำกึ่ง/ยังไม่มีข้อยุติ (50%), ระดับ 4 ข้อมูลสอดคล้องส่วนใหญ่ (75%), และระดับ 5 ข้อมูลสอดคล้องสมบูรณ์ (100%)",
  },
  {
    question: "การทำงานเป็นแบบ Real-time ใช่หรือไม่?",
    answer:
      "ใช่ครับ ทุกครั้งที่มีการตรวจสอบ ระบบจะค้นหาข้อมูลสด (Live Search) ผ่าน Exa Semantic Search และ Google Serper แบบคู่ขนาน แล้วส่งต่อให้ AI วิเคราะห์ จึงได้ข้อมูลและบริบทล่าสุดเสมอ",
  },
  {
    question: "ระบบมีความเป็นส่วนตัวและปลอดภัยอย่างไร?",
    answer:
      "ระบบทำงานแบบ Stateless 100% ไร้การเชื่อมต่อฐานข้อมูล ไม่มีการบันทึกประวัติหรือข้อมูลส่วนตัวลงเซิร์ฟเวอร์ ประวัติการตรวจสอบจะถูกจัดเก็บเฉพาะในเบราว์เซอร์ของคุณเท่านั้น (Local Storage) และสามารถล้างได้ตลอดเวลา",
  },
  {
    question: "ทำไมระบบถึงไม่รองรับวิดีโอ คลิปสั้น หรือไฟล์เสียง (เช่น TikTok, YouTube)?",
    answer:
      "เนื่องจากระบบได้รับการออกแบบและปรับแต่งให้เชี่ยวชาญการสืบค้นและเทียบเคียงข้อเท็จจริงของเนื้อหาเชิงลึก ข่าวสารตัวอักษร และบทความออนไลน์แบบ Stateless RAG หากต้องการตรวจสอบข้อมูลจากวิดีโอ สามารถพิมพ์หรือคัดลอกใจความสำคัญของเรื่องนั้นมาตรวจสอบได้โดยตรง",
  },
  {
    question: "ระบบมีเกณฑ์คัดเลือกแหล่งข่าวที่น่าเชื่อถืออย่างไร?",
    answer:
      "ระบบจะจัดลำดับความสำคัญของข้อมูลจากสำนักข่าวหลักชั้นนำ หน่วยงานทางการของรัฐ สถาบันการแพทย์ งานวิจัย และศูนย์ตรวจสอบข่าวปลอม (Anti-Fake News Center) ที่ได้รับการรับรอง พร้อมทั้งแสดงแหล่งอ้างอิงและลิงก์ต้นฉบับอย่างโปร่งใส",
  },
  {
    question: "หากผลการตรวจสอบได้ 'ข้อมูลก้ำกึ่ง / ยังไม่มีข้อยุติ (50%)' หมายความว่าอย่างไร?",
    answer:
      "หมายถึงประเด็นดังกล่าวอาจเป็นเหตุการณ์สดที่เพิ่งเกิดขึ้นและข้อมูลยังไม่นิ่ง หรือมีมุมมองและหลักฐานจากผู้เชี่ยวชาญหลายฝ่ายที่ยังไม่มีข้อสรุปชัดเจน ระบบจะแสดงทั้งข้อเท็จจริงที่ตรงกันและจุดที่ยังขัดแย้งเพื่อให้ผู้ใช้นำไปพิจารณาอย่างรอบด้าน",
  },
  {
    question: "สามารถตรวจสอบประวัติการตรวจสอบย้อนหลังได้อย่างไร?",
    answer:
      "คุณสามารถกดปุ่มไอคอน 'ประวัติการตรวจสอบ' ที่แถบเมนูด้านบน (Navbar) เพื่อดูรายการตรวจสอบย้อนหลังที่จัดเก็บไว้เฉพาะในเครื่องของคุณ (Local Storage) และสามารถเลือกล้างประวัติทั้งหมดได้ตลอดเวลา",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-14 sm:py-20">
      <div className="wrapper">
        <Fade triggerOnce direction="up">
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              คำถามที่พบบ่อย (FAQ)
            </h2>
          </div>
        </Fade>

        <div className="max-w-2xl mx-auto space-y-3.5">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <Fade key={faq.question} triggerOnce direction="up" delay={index * 60}>
                <div className="rounded-3xl solid-card overflow-hidden transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-blue-400 dark:hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.25)] shadow-xs">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-5 text-left cursor-pointer hover:bg-slate-50/50 dark:hover:bg-[#1a2d48]/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/15 dark:bg-blue-500/25 text-blue-600 dark:text-cyan-400 ring-1 ring-blue-500/40 shrink-0">
                        <Question size={18} weight="bold" />
                      </div>
                      <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {faq.question}
                      </span>
                    </div>
                    <CaretDown
                      size={16}
                      weight="bold"
                      className={`text-slate-400 dark:text-slate-300 transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180 text-blue-500 dark:text-cyan-400" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#13253d] border border-slate-200 dark:border-[#2b446b]">
                        {faq.answer}
                      </div>
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
