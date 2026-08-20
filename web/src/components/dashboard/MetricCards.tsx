"use client";

import React from "react";
import {
  MagnifyingGlass,
  ShieldWarning,
  ShieldCheck,
  Timer,
  TrendUp,
} from "@phosphor-icons/react";
import { NumberTicker } from "@/components/NumberTicker";

interface MetricCardsProps {
  totalChecks: number;
  threatsDetected: number;
  verifiedAuthorities: number;
  avgLatency: number;
}

export function MetricCards({
  totalChecks,
  threatsDetected,
  verifiedAuthorities,
  avgLatency,
}: MetricCardsProps) {
  const threatRate = totalChecks > 0 ? Math.round((threatsDetected / totalChecks) * 100) : 40;
  const trustRate = totalChecks > 0 ? Math.round((verifiedAuthorities / totalChecks) * 100) : 60;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {/* 1. Total Fact Checks */}
      <div className="rounded-3xl solid-card p-5 sm:p-6 border-t-4 border-t-blue-500 relative transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl dark:shadow-[0_0_25px_rgba(59,130,246,0.12)] bg-gradient-to-br from-blue-500/5 via-sky-500/5 to-transparent dark:from-[#0d2238] dark:via-[#0c1a2e] dark:to-[#081220] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400 dark:via-cyan-400 to-transparent shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400/40 shrink-0">
            <MagnifyingGlass size={24} weight="bold" />
          </div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono text-slate-900 dark:text-white tracking-tight text-right">
            <NumberTicker value={totalChecks} />
            <span className="text-sm sm:text-base font-bold text-slate-400 dark:text-slate-500 ml-1">ครั้ง</span>
          </div>
        </div>
        <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
          การตรวจสอบทั้งหมด
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          ประมวลผลผ่าน RAG & AI Orchestrator
        </p>
      </div>

      {/* 2. Threats Detected */}
      <div className="rounded-3xl solid-card p-5 sm:p-6 border-t-4 border-t-rose-500 relative transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl dark:shadow-[0_0_25px_rgba(244,63,94,0.12)] bg-gradient-to-br from-rose-500/5 via-red-500/5 to-transparent dark:from-[#2d141e] dark:via-[#220f17] dark:to-[#160a0f] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-400 to-transparent shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-400/40 shrink-0">
            <ShieldWarning size={24} weight="bold" />
          </div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono text-rose-600 dark:text-rose-400 tracking-tight text-right">
            <NumberTicker value={threatsDetected} />
            <span className="text-sm sm:text-base font-bold text-rose-400/80 ml-1">เรื่อง</span>
          </div>
        </div>
        <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
          ตรวจพบข่าวปลอม/บิดเบือน
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          จำแนกและแจ้งเตือนผู้ใช้งานทันที
        </p>
      </div>

      {/* 3. Verified Media & Authorities */}
      <div className="rounded-3xl solid-card p-5 sm:p-6 border-t-4 border-t-emerald-500 relative transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl dark:shadow-[0_0_25px_rgba(160,185,129,0.12)] bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent dark:from-[#0f2824] dark:via-[#0c1f1e] dark:to-[#081518] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 dark:via-emerald-300 to-transparent shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/40 shrink-0">
            <ShieldCheck size={24} weight="bold" />
          </div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight text-right">
            <NumberTicker value={verifiedAuthorities} />
            <span className="text-sm sm:text-base font-bold text-emerald-400/80 ml-1">เรื่อง</span>
          </div>
        </div>
        <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
          ข้อมูลจริง / สื่อหลักยืนยัน
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          เทียบเคียงตรงกับสำนักข่าวและภาครัฐ
        </p>
      </div>

      {/* 4. Average AI Latency */}
      <div className="rounded-3xl solid-card p-5 sm:p-6 border-t-4 border-t-purple-500 relative transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl dark:shadow-[0_0_25px_rgba(168,85,247,0.12)] bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-transparent dark:from-[#1c1335] dark:via-[#160e2a] dark:to-[#0e081c] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400 dark:via-fuchsia-400 to-transparent shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30 ring-2 ring-purple-400/40 shrink-0">
            <Timer size={24} weight="bold" />
          </div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono text-purple-600 dark:text-purple-400 tracking-tight text-right">
            {avgLatency.toFixed(2)}
            <span className="text-sm sm:text-base font-bold text-purple-400/80 ml-1">วินาที</span>
          </div>
        </div>
        <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
          ความเร็วเฉลี่ยของระบบ
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          ประมวลผลคู่ขนานแบบ Concurrency
        </p>
      </div>
    </div>
  );
}
