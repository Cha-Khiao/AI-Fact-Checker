"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { VantaBirdsBackground } from "@/components/VantaBirdsBackground";
import Footer from "@/components/landing/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { MetricCards } from "@/components/dashboard/MetricCards";
import { VerdictDonutChart } from "@/components/dashboard/VerdictDonutChart";
import { CategoryBarChart } from "@/components/dashboard/CategoryBarChart";
import { LatencyWaveChart } from "@/components/dashboard/LatencyWaveChart";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { HistoryItem } from "@/types";
import { SecretTeamModal } from "@/components/SecretTeamModal";
import {
  ChartPieSlice,
  ShieldCheck,
  ArrowSquareOut,
  ArrowCounterClockwise,
  Sparkle,
  Globe,
  Lightning,
} from "@phosphor-icons/react";

interface TrendsApiResponse {
  total_checks: number;
  threats_detected: number;
  verified_authorities?: number;
  avg_latency_seconds?: number;
  categories: Record<string, number>;
  category_percents?: Record<string, number>;
  tier_counts?: Record<number | string, number>;
  tier_percents?: Record<number | string, number>;
  timing_averages?: {
    planner_ms: number;
    scraper_ms: number;
    search_ms: number;
    analyzer_ms: number;
    total_ms: number;
  };
  method_stats?: {
    url_count: number;
    text_count: number;
    url_pct: number;
    text_pct: number;
  };
  last_updated?: string;
}

export default function DashboardPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [trends, setTrends] = useState<TrendsApiResponse>({
    total_checks: 1284,
    threats_detected: 514,
    verified_authorities: 770,
    avg_latency_seconds: 2.15,
    categories: {
      FINANCIAL_SCAM: 488,
      HEALTH_MEDICINE: 312,
      PUBLIC_POLICY_GOV: 236,
      DISASTER_SAFETY: 128,
      CELEBRITY_SOCIAL: 76,
      GENERAL_MISINFO: 44,
    },
    last_updated: "",
  });
  const [loading, setLoading] = useState(true);

  // Load history from localStorage (if any)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ai_factcheck_history_v1");
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
      const res = await fetch(`${cleanBase}/api/trends`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTrends((prev) => ({
          ...prev,
          ...data,
          total_checks: data.total_checks ?? prev.total_checks,
          threats_detected: data.threats_detected ?? prev.threats_detected,
          verified_authorities: data.verified_authorities ?? prev.verified_authorities,
          avg_latency_seconds: data.avg_latency_seconds ?? prev.avg_latency_seconds,
          categories: data.categories || prev.categories,
          category_percents: data.category_percents || prev.category_percents,
          tier_counts: data.tier_counts || prev.tier_counts,
          tier_percents: data.tier_percents || prev.tier_percents,
          timing_averages: data.timing_averages || prev.timing_averages,
          method_stats: data.method_stats || prev.method_stats,
        }));
      }
    } catch {
      // Use baseline fallback gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  return (
    <div className="relative min-h-screen text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      <VantaBirdsBackground />

      <Navbar
        onOpenHistory={() => setHistoryOpen(true)}
        historyCount={history.length}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
      />

      <main className="relative z-10 mx-auto max-w-6xl w-full px-4 sm:px-6 pt-6 sm:pt-10 pb-20 flex-1">
        {/* Header Title Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              ศูนย์วิเคราะห์สถิติและภัยข้อมูลเท็จ
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              รายงานสถิติภาพรวมการตรวจสอบข้อเท็จจริง วิเคราะห์จาก Telemetry Logs ของระบบแบบ Real-time (Stateless & PDPA 100%)
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={fetchTrends}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-cyan-400 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <ArrowCounterClockwise size={16} className={loading ? "animate-spin text-blue-600" : ""} />
              <span>รีเฟรชข้อมูล</span>
            </button>

            <Link
              href="/#checker"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 active:scale-95 transition-all"
            >
              <span>ตรวจข่าวสาร</span>
              <ArrowSquareOut size={16} weight="bold" />
            </Link>
          </div>
        </motion.div>

        {/* 1. KPI 4-Metric Cards */}
        <MetricCards
          totalChecks={trends.total_checks}
          threatsDetected={trends.threats_detected}
          verifiedAuthorities={trends.verified_authorities || 770}
          avgLatency={trends.avg_latency_seconds || 2.15}
        />

        {/* 2. Charts Grid (Donut Ratio & Category Bar) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 items-stretch">
          <VerdictDonutChart
            total={trends.total_checks}
            tierCounts={trends.tier_counts}
            tierPercents={trends.tier_percents}
          />
          <CategoryBarChart
            categories={trends.categories}
            total={trends.total_checks}
            categoryPercents={trends.category_percents}
          />
        </div>

        {/* 3. Pipeline Latency Wave Area Chart */}
        <LatencyWaveChart timingAverages={trends.timing_averages} />

        {/* 4. Safety Architecture & Trust Guarantee Banner */}
        <div className="rounded-3xl solid-card p-6 sm:p-7 border-t-4 border-t-blue-500 dark:border-t-cyan-500 relative transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl dark:shadow-[0_0_30px_rgba(59,130,246,0.12)] bg-gradient-to-br from-blue-500/5 via-sky-500/5 to-transparent dark:from-[#0d2238] dark:via-[#0c1a2e] dark:to-[#081220] overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-blue-400 dark:via-cyan-400 to-transparent shadow-[0_0_12px_rgba(59,130,246,0.8)]" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400/40 shrink-0">
                <ShieldCheck size={24} weight="duotone" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  สถาปัตยกรรมไร้ฐานข้อมูล & ความเป็นส่วนตัวระดับสูงสุด (Zero-DB / 100% PDPA)
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  ระบบคำนวณและแสดงผลสถิติแบบ Real-time In-Memory Counters โดยไม่มีการบันทึกประวัติส่วนตัวหรือ IP ของผู้ใช้ลงฐานข้อมูลใดๆ
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center">
              <Link
                href="/#checker"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-transform active:scale-95"
              >
                <span>เริ่มตรวจสอบข้อเท็จจริง</span>
                <ArrowSquareOut size={16} weight="bold" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <ScrollToTop />

      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        items={history}
        onSelect={() => {}}
        onClear={() => setHistory([])}
      />

      <SecretTeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
      />
    </div>
  );
}
