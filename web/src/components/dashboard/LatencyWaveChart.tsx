"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lightning, Cpu, MagnifyingGlass, ShieldCheck } from "@phosphor-icons/react";

interface LatencyWaveChartProps {
  timingAverages?: {
    planner_ms: number;
    scraper_ms: number;
    search_ms: number;
    analyzer_ms: number;
    total_ms: number;
  };
}

interface PipelineStep {
  name: string;
  sub: string;
  ms: number;
  pct: number;
  color: string;
  icon: string;
}

export function LatencyWaveChart({ timingAverages }: LatencyWaveChartProps) {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const pl = timingAverages?.planner_ms || 150;
  const sc = timingAverages?.scraper_ms || 420;
  const se = timingAverages?.search_ms || 680;
  const an = timingAverages?.analyzer_ms || 900;
  const sumMs = pl + sc + se + an;

  const steps: PipelineStep[] = [
    { name: "Intent Planner", sub: "สกัดคีย์เวิร์ด & บริบท", ms: pl, pct: Math.round((pl / sumMs) * 100), color: "#8b5cf6", icon: "🧠" },
    { name: "Parallel Scraper", sub: "สกัดเนื้อหาโซเชียล & เว็บ", ms: sc, pct: Math.round((sc / sumMs) * 100), color: "#06b6d4", icon: "⚡" },
    { name: "Dual Search", sub: "สืบค้น Exa + Google Serper", ms: se, pct: Math.round((se / sumMs) * 100), color: "#3b82f6", icon: "🔍" },
    { name: "AI Fact Analyzer", sub: "เทียบเคียง & ฟันธงข้อเท็จจริง", ms: an, pct: Math.round((an / sumMs) * 100), color: "#10b981", icon: "⚖️" },
  ];

  const totalMs = sumMs;

  return (
    <div className="rounded-3xl solid-card p-6 sm:p-8 mb-8 border-t-4 border-t-purple-500 dark:border-t-purple-400 relative transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl dark:shadow-[0_0_30px_rgba(168,85,247,0.12)] bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-transparent dark:from-[#1c1335] dark:via-[#160e2a] dark:to-[#0e081c] overflow-hidden">
      {/* Top Purple Light Beam */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-purple-400 dark:via-fuchsia-400 to-transparent shadow-[0_0_12px_rgba(168,85,247,0.8)]" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-purple-200/40 dark:border-purple-800/40">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              ประสิทธิภาพความเร็วรายโมดูล (RAG Latency Wave & Pipeline Trace)
            </h4>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
              Avg ~{(totalMs / 1000).toFixed(2)}s
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            เวลาประมวลผลจริงในแต่ละขั้นตอนของสถาปัตยกรรม Stateless Orchestrator
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800/60 shadow-2xs">
            รวมทั้งระบบ: {totalMs} ms
          </span>
        </div>
      </div>

      {/* Multi-Segment Interactive Wave Flow Bar */}
      <div className="mb-6 space-y-2">
        <div className="h-6 w-full rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 flex items-center gap-1.5 shadow-inner overflow-hidden">
          {steps.map((step, idx) => {
            const isHovered = activeStep === idx;
            return (
              <motion.div
                key={step.name}
                onMouseEnter={() => setActiveStep(idx)}
                onMouseLeave={() => setActiveStep(null)}
                className="h-full rounded-xl cursor-pointer relative transition-all"
                style={{
                  width: `${step.pct}%`,
                  backgroundColor: step.color,
                  boxShadow: isHovered ? `0 0 15px ${step.color}` : "none",
                  filter: activeStep !== null && !isHovered ? "opacity(0.4)" : "opacity(1)",
                }}
                initial={{ width: "0%" }}
                animate={{ width: `${step.pct}%` }}
                transition={{ duration: 0.8, delay: idx * 0.15 }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500 px-1">
          <span>0ms (เริ่มคำขอ)</span>
          <span>{totalMs}ms (ส่งผลลัพธ์ผ่าน SSE Stream)</span>
        </div>
      </div>

      {/* 4 Detailed Step Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {steps.map((step, idx) => {
          const isHovered = activeStep === idx;

          return (
            <div
              key={step.name}
              onMouseEnter={() => setActiveStep(idx)}
              onMouseLeave={() => setActiveStep(null)}
              className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 shadow-2xs relative overflow-hidden ${
                isHovered
                  ? "bg-white dark:bg-[#1f1738] border-purple-400 dark:border-purple-400 scale-102 shadow-md"
                  : "bg-slate-50/70 dark:bg-[#13253d]/70 border-slate-200/50 dark:border-slate-700/40 hover:bg-white dark:hover:bg-[#162b47]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{step.icon}</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {step.name}
                  </span>
                </div>
                <span
                  className="text-xs font-mono font-black px-2 py-0.5 rounded-lg"
                  style={{
                    backgroundColor: `${step.color}20`,
                    color: step.color,
                  }}
                >
                  {step.ms}ms
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                {step.sub}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
