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
  WarningCircle,
} from "@phosphor-icons/react";
import { DEMO_TOPICS_10, DemoTopicItem } from "@/lib/demoData";

export type TopicVerdict = "real" | "fake";
export type TopicFormat = "text" | "url" | "mixed";

export interface SampleTopic {
  id: string;
  verdict: TopicVerdict;
  format: TopicFormat;
  label: string;
  content: string;
  score?: number;
  categoryLabel?: string;
}

export const SAMPLE_TOPICS: SampleTopic[] = DEMO_TOPICS_10.map((item) => ({
  id: item.id,
  verdict: item.verdict,
  format: item.format,
  label: item.label,
  content: item.content,
  score: item.score,
  categoryLabel: item.categoryLabel,
}));

interface TrendingChipsProps {
  onSelect: (content: string, format: TopicFormat) => void;
  disabled?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type FilterType = "all" | "real" | "fake" | "text" | "url" | "mixed";

export function TrendingChips({
  onSelect,
  disabled,
  isOpen: controlledIsOpen,
  onOpenChange,
}: TrendingChipsProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (open: boolean) => {
    setInternalIsOpen(open);
    onOpenChange?.(open);
  };
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
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 sm:p-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/30">
                    <Sparkle size={18} weight="fill" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      ตัวอย่างประเด็นทดสอบข้อเท็จจริง (10 ตัวเลือก Demo)
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                      คลิกเลือกเพื่อทดสอบระบบได้ทันที 100% แม้เซิร์ฟเวอร์คลาวด์จะออฟไลน์
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

              {/* Filter Tabs */}
              <div className="px-4 sm:px-5 py-2.5 bg-slate-50/60 dark:bg-slate-900/30">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      filter === "all"
                        ? "bg-slate-900 text-white dark:bg-cyan-500 dark:text-slate-950 shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    ทั้งหมด ({countAll})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilter("real")}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      filter === "real"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60"
                    }`}
                  >
                    <CheckCircle size={14} weight="bold" />
                    <span>ข่าวจริง ({countReal})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilter("fake")}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      filter === "fake"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60"
                    }`}
                  >
                    <XCircle size={14} weight="bold" />
                    <span>ข่าวปลอม/บิดเบือน ({countFake})</span>
                  </button>

                  <div className="hidden sm:block h-4 w-[1px] bg-slate-200 dark:bg-slate-800 my-auto mx-1" />

                  <button
                    type="button"
                    onClick={() => setFilter("text")}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                      filter === "text"
                        ? "bg-blue-600 text-white shadow-xs font-bold"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <Article size={13} />
                    <span>ข้อความ ({countText})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilter("url")}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                      filter === "url"
                        ? "bg-cyan-600 text-white shadow-xs font-bold"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <LinkSimple size={13} />
                    <span>ลิงก์ URL ({countUrl})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilter("mixed")}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                      filter === "mixed"
                        ? "bg-purple-600 text-white shadow-xs font-bold"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <Funnel size={13} />
                    <span>ผสม ({countMixed})</span>
                  </button>
                </div>
              </div>

              {/* Topics List */}
              <div className="p-4 sm:p-5 overflow-y-auto max-h-[50vh] space-y-2.5">
                {filteredTopics.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs sm:text-sm">
                    ไม่พบตัวอย่างประเด็นตามหมวดหมู่ที่เลือก
                  </div>
                ) : (
                  filteredTopics.map((topic) => {
                    const isReal = topic.verdict === "real";
                    const isUrl = topic.format === "url";
                    const isMixed = topic.format === "mixed";

                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => handleChoose(topic)}
                        className="w-full text-left p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800/80 hover:border-cyan-400/80 dark:hover:border-cyan-500/80 hover:shadow-md hover:shadow-cyan-500/5 transition-all duration-150 group cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                              {/* Verdict Badge */}
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  isReal
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                }`}
                              >
                                {isReal ? <CheckCircle size={12} weight="bold" /> : <XCircle size={12} weight="bold" />}
                                <span>{isReal ? "ข่าวจริง" : "ข่าวปลอม/บิดเบือน"}</span>
                              </span>

                              {/* Category Badge */}
                              {topic.categoryLabel && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  {topic.categoryLabel}
                                </span>
                              )}

                              {/* Format Badge */}
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                {isUrl ? <LinkSimple size={11} /> : isMixed ? <Funnel size={11} /> : <Article size={11} />}
                                <span>{isUrl ? "URL" : isMixed ? "Mixed" : "Text"}</span>
                              </span>
                            </div>

                            <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors leading-snug">
                              {topic.label}
                            </h4>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                              {topic.content}
                            </p>
                          </div>

                          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all shrink-0 mt-1">
                            <ArrowRight size={14} weight="bold" />
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 text-center text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                <Sparkle size={13} weight="fill" className="text-cyan-500 shrink-0" />
                <span>รองรับการกดส่งตรวจทันที หรือแก้ไขเนื้อหาก่อนวิเคราะห์ได้ตามต้องการ</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
