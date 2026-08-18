"use client";

import React from "react";
import { Sparkle } from "@phosphor-icons/react";

interface TrendingChipsProps {
  onSelect: (query: string) => void;
  disabled?: boolean;
}

const SAMPLES = [
  "ข่าวลวง เงินดิจิทัล 10,000 บาท",
  "กัญชาเสรี ทำให้เยาวชนติดยาเพิ่มขึ้น",
  "วัคซีนโควิด ทำให้เกิดโรคหัวใจ",
  "รัฐบาลออกมาตรการผ่อนปรนภาษี 2568",
  "บัตรสวัสดิการแห่งรัฐ รอบใหม่เปิดลงทะเบียน",
];

export function TrendingChips({ onSelect, disabled }: TrendingChipsProps) {
  return (
    <div className="mt-5 flex flex-col items-center gap-2.5 px-4">
      <div className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Sparkle size={12} weight="fill" className="text-cyan-500" />
        <span>ตัวอย่างประเด็นทดสอบด่วน:</span>
      </div>
      <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
        {SAMPLES.map((text) => (
          <button
            key={text}
            onClick={() => !disabled && onSelect(text)}
            disabled={disabled}
            className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
