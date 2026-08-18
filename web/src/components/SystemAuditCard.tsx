"use client";

import React, { useState } from "react";
import {
  Cpu,
  CaretDown,
  Timer,
  Article,
  CubeTransparent,
  Lightning,
} from "@phosphor-icons/react";
import { FactCheckResult, ScoreLevel } from "@/types";

interface SystemAuditCardProps {
  result: FactCheckResult;
}

export function SystemAuditCard({ result }: SystemAuditCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const timeSeconds = result.execution_time_seconds || 0;
  const method = result.input?.method || "Direct Text";
  const refCount = result.references?.length || 0;
  const timing = result.timing || {};
  const currentScore = (result.verdict?.score || 3) as ScoreLevel;

  return (
    <div className="rounded-2xl glass-panel mb-6 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Cpu size={18} weight="duotone" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              ความโปร่งใสและสถิติเชิงระบบ (System Telemetry & Audit)
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              เวลาประมวลผล, สถาปัตยกรรมไร้ฐานข้อมูล, และประสิทธิภาพรายโมดูล
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <span>{isOpen ? "ย่อ" : "ดูข้อมูลเชิงลึก"}</span>
          <CaretDown size={14} weight="bold" className={`transition-transform duration-200 ${isOpen ? "-rotate-90" : ""}`} />
        </div>
      </button>

      {isOpen && (
        <div className="p-5 pt-0 border-t border-slate-200/80 dark:border-slate-800/80 space-y-4 text-xs sm:text-sm">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/60 dark:bg-slate-900/60">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <Timer size={14} weight="bold" className="text-blue-500" />
                <span>เวลาประมวลผล</span>
              </div>
              <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                {timeSeconds > 0 ? `${timeSeconds.toFixed(2)}s` : "-"}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/60 dark:bg-slate-900/60">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <Article size={14} weight="bold" className="text-cyan-500" />
                <span>แหล่งข่าวเทียบเคียง</span>
              </div>
              <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                {refCount} แหล่ง
              </span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/60 dark:bg-slate-900/60">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <Lightning size={14} weight="bold" className="text-amber-500" />
                <span>รูปแบบอินพุต</span>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {method}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/60 dark:bg-slate-900/60">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <CubeTransparent size={14} weight="bold" className="text-indigo-500" />
                <span>สถาปัตยกรรม</span>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Stateless RAG
              </span>
            </div>
          </div>

          {/* Module Latency Breakdown */}
          {(timing.planner_ms || timing.search_ms || timing.analyzer_ms) && (
            <div className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
              <span className="font-bold block mb-2 text-slate-700 dark:text-slate-300">
                เวลาการทำงานรายโมดูล (Latency Breakdown):
              </span>
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80">AI Planner: {timing.planner_ms || 0}ms</div>
                <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80">Parallel Search: {timing.search_ms || 0}ms</div>
                <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80">AI Analyzer: {timing.analyzer_ms || 0}ms</div>
              </div>
            </div>
          )}

          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>ระดับคะแนนที่ประเมิน: <strong>ระดับ {currentScore}/5</strong></span>
            <span>ไม่มีการเก็บข้อมูลส่วนบุคคล (PDPA Compliant)</span>
          </div>
        </div>
      )}
    </div>
  );
}
