"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ScoreLevel } from "@/types";
import { Mascot } from "./Mascot";
import {
  ShieldCheckered,
  Copy,
  Check,
  Sparkle,
} from "@phosphor-icons/react";
import { cleanFactText, getScoreMetadata } from "@/lib/utils";

interface ScoreMeterProps {
  score: ScoreLevel;
  summary: string;
}

export function ScoreMeter({ score, summary }: ScoreMeterProps) {
  const cleanSummary = cleanFactText(summary);
  const [copied, setCopied] = useState(false);
  const meta = getScoreMetadata(score);

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(cleanSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn("Clipboard failed", e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl glass-panel p-5 sm:p-7 mb-6 shadow-md"
    >
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        
        {/* Score Radial Indicator */}
        <div className="flex flex-col items-center justify-center shrink-0 w-32 text-center p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            ความน่าเชื่อถือ
          </span>
          <div className={`text-4xl sm:text-5xl font-extrabold tracking-tight ${meta.color}`}>
            {meta.score}<span className="text-xl text-slate-400 dark:text-slate-500 font-medium">/5</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${meta.percentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: meta.gaugeColor }}
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 font-mono">{meta.percentage}%</span>
        </div>

        {/* Verdict Content */}
        <div className="flex-1 min-w-0 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2.5">
            <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold border ${meta.badgeBg}`}>
              <ShieldCheckered size={16} weight="duotone" />
              <span>{meta.label}</span>
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              ({meta.standardLabel})
            </span>
          </div>

          <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white leading-snug tracking-tight">
            {cleanSummary}
          </h3>

          <div className="mt-4 pt-3.5 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex items-center gap-1.5">
              <Sparkle size={14} weight="fill" className="text-cyan-500 shrink-0" />
              <span>{meta.subLabel}</span>
            </p>

            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              {copied ? (
                <>
                  <Check size={14} weight="bold" className="text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy size={14} weight="bold" />
                  <span>คัดลอกสรุป</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mascot Character */}
        <div className="hidden lg:flex shrink-0">
          <Mascot state={meta.mascotState} size={75} />
        </div>

      </div>
    </motion.div>
  );
}
