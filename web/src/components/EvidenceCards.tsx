"use client";

import React, { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Copy,
  Check,
  Scales,
  Sparkle,
} from "@phosphor-icons/react";
import { VerdictData } from "@/types";
import { cleanFactText } from "@/lib/utils";

interface EvidenceCardsProps {
  verdict: VerdictData;
}

export function EvidenceCards({ verdict }: EvidenceCardsProps) {
  const supported = (verdict.supported_points || []).map(cleanFactText).filter(Boolean);
  const conflicting = (verdict.conflicting_points || []).map(cleanFactText).filter(Boolean);
  const analysis = cleanFactText(verdict.comparative_analysis || "");

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch (e) {
      console.warn("Copy failed", e);
    }
  };

  const hasPoints = supported.length > 0 || conflicting.length > 0;

  return (
    <div className="mb-6 space-y-4">
      {hasPoints && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Supported points column */}
          <div className="rounded-2xl glass-panel p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle size={18} weight="fill" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  ข้อเท็จจริงที่ได้รับการยืนยัน ({supported.length})
                </h4>
              </div>
            </div>

            {supported.length > 0 ? (
              <ul className="space-y-2.5">
                {supported.map((point, idx) => {
                  const key = `supp-${idx}`;
                  const isCopied = copiedKey === key;

                  return (
                    <li
                      key={idx}
                      className="flex items-start justify-between gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="flex-1">• {point}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(point, key)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer shrink-0 pt-0.5"
                        title="คัดลอกข้อความ"
                      >
                        {isCopied ? <Check size={14} weight="bold" className="text-emerald-500" /> : <Copy size={14} weight="bold" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 py-3">ไม่มีข้อมูลที่ยืนยัน</p>
            )}
          </div>

          {/* Conflicting points column */}
          <div className="rounded-2xl glass-panel p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <XCircle size={18} weight="fill" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  จุดขัดแย้ง / ข้อมูลบิดเบือน ({conflicting.length})
                </h4>
              </div>
            </div>

            {conflicting.length > 0 ? (
              <ul className="space-y-2.5">
                {conflicting.map((point, idx) => {
                  const key = `conf-${idx}`;
                  const isCopied = copiedKey === key;

                  return (
                    <li
                      key={idx}
                      className="flex items-start justify-between gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="flex-1">• {point}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(point, key)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer shrink-0 pt-0.5"
                        title="คัดลอกข้อความ"
                      >
                        {isCopied ? <Check size={14} weight="bold" className="text-emerald-500" /> : <Copy size={14} weight="bold" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 py-3">ไม่พบจุดขัดแย้งหรือบิดเบือน</p>
            )}
          </div>

        </div>
      )}

      {/* Comparative Analysis Memo */}
      {analysis && analysis !== "N/A" && (
        <div className="rounded-2xl glass-panel p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400">
                <Scales size={18} weight="duotone" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>บทวิเคราะห์เปรียบเทียบเชิงลึก</span>
                <Sparkle size={12} weight="fill" className="text-cyan-500" />
              </h4>
            </div>

            <button
              type="button"
              onClick={() => handleCopyText(analysis, "editorial-full")}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {copiedKey === "editorial-full" ? (
                <>
                  <Check size={14} weight="bold" className="text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy size={14} weight="bold" />
                  <span>คัดลอกบทวิเคราะห์</span>
                </>
              )}
            </button>
          </div>
          <div className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
            {analysis}
          </div>
        </div>
      )}
    </div>
  );
}
