"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkle,
  LinkSimple,
  Article,
  CheckCircle,
  XCircle,
  Funnel,
  X,
  ArrowRight,
  Lightbulb,
} from "@phosphor-icons/react";

export type TopicVerdict = "real" | "fake";
export type TopicFormat = "text" | "url" | "mixed";

export interface SampleTopic {
  id: string;
  verdict: TopicVerdict;
  format: TopicFormat;
  label: string;
  content: string;
}

interface TrendingChipsProps {
  onSelect: (content: string, format: TopicFormat) => void;
  disabled?: boolean;
}

export const SAMPLE_TOPICS: SampleTopic[] = [
  {
    id: "real-text-1",
    verdict: "real",
    format: "text",
    label: "สธ. เตือนประชาชนระวังไข้เลือดออก แนะ 3 เก็บป้องกัน 3 โรค",
    content:
      "กรมควบคุมโรค กระทรวงสาธารณสุข เตือนประชาชนระวังโรคไข้เลือดออกระบาดช่วงฤดูฝน โดยแนะให้ปฏิบัติตามมาตรการ 3 เก็บ ป้องกัน 3 โรค ได้แก่ เก็บบ้าน เก็บขยะ และเก็บน้ำ",
  },
  {
    id: "real-text-2",
    verdict: "real",
    format: "text",
    label: "สธ. เตือนถูกสุนัข-แมวกัดข่วน รีบล้างแผลฉีดวัคซีนพิษสุนัขบ้า",
    content:
      "กรมควบคุมโรคเตือนระวังโรคพิษสุนัขบ้า หากถูกสุนัขหรือแมวกัดข่วนให้รีบล้างแผลด้วยน้ำสะอาดและไปพบแพทย์เพื่อรับวัคซีนป้องกันทันที",
  },
  {
    id: "real-url-1",
    verdict: "real",
    format: "url",
    label: "LINE Today: น้ำป่าทะลักท่วม อ.ปัว จ.น่าน เตือน 19-21 ส.ค. ฝนตกหนัก",
    content: "https://today.line.me/th/v2/article/peZQGNq",
  },
  {
    id: "real-url-2",
    verdict: "real",
    format: "url",
    label: "LINE Today: นอนยังไงไม่ให้ป่วย วิธีเปิดแอร์ vs พัดลม ไม่เสี่ยงความดันสวิง",
    content: "https://today.line.me/th/v2/article/ZaRQ0WQ",
  },
  {
    id: "real-mixed-1",
    verdict: "real",
    format: "mixed",
    label: "LINE Today: WHA แจงเหตุเสียงดังคล้ายระเบิด สั่งหยุดงานจุดเกิดเหตุ",
    content:
      "WHA แจงเหตุเสียงดังคล้ายระเบิด สั่งผู้รับเหมาหยุดงานจุดเกิดเหตุ 136 ไร่ ในพื้นที่ระยองเพื่อตรวจสอบความปลอดภัย\nhttps://today.line.me/th/v2/article/VxR3MxV",
  },
  {
    id: "fake-text-1",
    verdict: "fake",
    format: "text",
    label: "กระทรวงการคลังเปิดลงทะเบียนแจกเงินเยียวยาพิเศษ 5,000 บาท",
    content:
      "กระทรวงการคลังเปิดระบบลงทะเบียนรับเงินช่วยเหลือเยียวยาพิเศษ 5,000 บาท สำหรับผู้สูงอายุและผู้ถือบัตรสวัสดิการแห่งรัฐรอบใหม่ทางออนไลน์",
  },
  {
    id: "fake-text-2",
    verdict: "fake",
    format: "text",
    label: "ดื่มน้ำต้มใบมะละกอผสมมะนาวรักษามะเร็งระยะสุดท้ายหายขาด",
    content:
      "มีการแชร์สูตรสมุนไพร ดื่มน้ำต้มใบมะละกอสดผสมน้ำมะนาววันละ 3 เวลา ช่วยฆ่าเซลล์มะเร็งระยะสุดท้ายให้หายขาดได้โดยไม่ต้องทำเคมีบำบัด",
  },
  {
    id: "fake-url-1",
    verdict: "fake",
    format: "url",
    label: "ลิงก์ทดสอบระบบป้องกัน: หน้าเว็บที่ถูกลบ / ลิงก์เสีย (404 Not Found)",
    content: "https://today.line.me/th/v2/article/404-deleted-news-incident-test",
  },
  {
    id: "fake-mixed-1",
    verdict: "fake",
    format: "mixed",
    label: "SMS มิจฉาชีพ: หลอกกดลิงก์รับเงินไทยช่วยไทย 900 บาท",
    content:
      "ข้อความ SMS อ้างชื่อรัฐบาล แจกเงินโครงการไทยช่วยไทย 900 บาทต่อวัน ให้กดลิงก์ลงทะเบียนเพื่อรับเงินเข้าบัญชีทันที\nhttps://line.me/R/ti/p/@fake_digital_wallet",
  },
  {
    id: "fake-mixed-2",
    verdict: "fake",
    format: "mixed",
    label: "เพจปลอมรับทำใบขับขี่: อ้างถูกกฎหมายไม่ต้องไปสอบที่ขนส่ง",
    content:
      "เพจเฟซบุ๊กเปิดรับทำใบอนุญาตขับขี่ด่วนแบบออนไลน์ ถูกกฎหมาย 100% โดยไม่ต้องไปสอบและไม่ต้องไปอบรมที่กรมการขนส่งทางบก\nhttps://today.line.me/th/v2/article/8noPO6K",
  },
];

type FilterType = "all" | "real" | "fake" | "text" | "url" | "mixed";

export function TrendingChips({ onSelect, disabled }: TrendingChipsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const countAll = SAMPLE_TOPICS.length;
  const countReal = SAMPLE_TOPICS.filter((item) => item.verdict === "real").length;
  const countFake = SAMPLE_TOPICS.filter((item) => item.verdict === "fake").length;
  const countText = SAMPLE_TOPICS.filter((item) => item.format === "text").length;
  const countUrl = SAMPLE_TOPICS.filter((item) => item.format === "url").length;
  const countMixed = SAMPLE_TOPICS.filter((item) => item.format === "mixed").length;

  const filteredTopics = SAMPLE_TOPICS.filter((item) => {
    if (filter === "real") return item.verdict === "real";
    if (filter === "fake") return item.verdict === "fake";
    if (filter === "text") return item.format === "text";
    if (filter === "url") return item.format === "url";
    if (filter === "mixed") return item.format === "mixed";
    return true;
  });

  const handleChoose = (sample: SampleTopic) => {
    setIsOpen(false);
    onSelect(sample.content, sample.format);
  };

  return (
    <>
      <div className="mt-5 flex flex-col items-center gap-2 px-4">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={disabled}
          className="group flex items-center gap-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0c1626]/90 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-cyan-500/60 dark:hover:border-cyan-400/60 px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 shadow-xs hover:shadow-md hover:shadow-cyan-500/10 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
            <Lightbulb size={16} weight="duotone" className="transition-transform group-hover:scale-110" />
          </div>
          <span>ตัวอย่างประเด็นทดสอบ ({countAll} ตัวเลือก)</span>
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200 dark:border-slate-800 text-[11px] font-mono">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{countReal} จริง</span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">{countFake} ปลอม</span>
          </div>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl solid-card border-t-4 border-t-cyan-500 shadow-2xl z-10 overflow-hidden bg-white dark:bg-[#0a1220]"
            >
              {/* Modal Header without border-b */}
              <div className="flex items-center justify-between p-4 sm:p-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/30">
                    <Sparkle size={18} weight="fill" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      ตัวอย่างประเด็นทดสอบข้อเท็จจริง
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                      คลิกเลือกเพื่อนำเข้าสู่การ์ดตรวจสอบ
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="group flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 transition-all cursor-pointer"
                  title="ปิดหน้าต่าง"
                  aria-label="ปิดหน้าต่าง"
                >
                  <X size={16} weight="bold" className="transition-transform group-hover:rotate-90" />
                </button>
              </div>

              {/* Filter Tabs without border-b - Fully Responsive & Non-cramped */}
              <div className="px-4 sm:px-5 py-2.5 bg-slate-50/60 dark:bg-slate-900/30">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      filter === "all"
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    ทั้งหมด ({countAll})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("real")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      filter === "real"
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50"
                    }`}
                  >
                    <CheckCircle size={13} weight="fill" />
                    <span>ข่าวจริง ({countReal})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("fake")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      filter === "fake"
                        ? "bg-rose-500 text-white shadow-xs"
                        : "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50"
                    }`}
                  >
                    <XCircle size={13} weight="fill" />
                    <span>ข่าวปลอม ({countFake})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("text")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      filter === "text"
                        ? "bg-slate-700 dark:bg-slate-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <Article size={13} weight="bold" />
                    <span>ข้อความ ({countText})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("url")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      filter === "url"
                        ? "bg-cyan-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/50"
                    }`}
                  >
                    <LinkSimple size={13} weight="bold" />
                    <span>ลิงก์ ({countUrl})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("mixed")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      filter === "mixed"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50"
                    }`}
                  >
                    <Funnel size={12} weight="bold" />
                    <span>ลิงก์+ข้อความ ({countMixed})</span>
                  </button>
                </div>
              </div>

              {/* Topic List - Seamless & Fixed Height Cards */}
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-2.5">
                {filteredTopics.map((sample) => {
                  const isReal = sample.verdict === "real";
                  const isUrl = sample.format === "url";
                  const isMixed = sample.format === "mixed";

                  return (
                    <div
                      key={sample.id}
                      onClick={() => handleChoose(sample)}
                      className={`group h-[76px] sm:h-[72px] flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl border bg-white dark:bg-slate-900/80 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
                        isReal
                          ? "border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-emerald-500/10"
                          : "border-slate-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-400 hover:shadow-rose-500/10"
                      }`}
                    >
                      <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                              isReal
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30"
                                : "bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/30"
                            }`}
                          >
                            {isReal ? (
                              <CheckCircle size={11} weight="fill" className="text-emerald-500 dark:text-emerald-400" />
                            ) : (
                              <XCircle size={11} weight="fill" className="text-rose-500 dark:text-rose-400" />
                            )}
                            <span>{isReal ? "ข่าวจริง" : "ข่าวปลอม"}</span>
                          </span>

                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                            {isMixed ? (
                              <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-300">
                                <Sparkle size={11} weight="fill" />
                                <span>ลิงก์+ข้อความ</span>
                              </span>
                            ) : isUrl ? (
                              <span className="flex items-center gap-0.5 text-blue-600 dark:text-cyan-400">
                                <LinkSimple size={11} weight="bold" />
                                <span>ลิงก์ URL</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5 text-slate-600 dark:text-slate-300">
                                <Article size={11} weight="bold" />
                                <span>ข้อความ</span>
                              </span>
                            )}
                          </span>
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors leading-tight">
                          {sample.label}
                        </h4>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono leading-tight">
                          {sample.content}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-cyan-500 dark:group-hover:text-slate-950 transition-all">
                        <span>เลือก</span>
                        <ArrowRight size={12} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
