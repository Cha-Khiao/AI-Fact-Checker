"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

interface VerdictDonutChartProps {
  total: number;
  tierCounts?: Record<number | string, number>;
  tierPercents?: Record<number | string, number>;
}

interface TierSlice {
  tier: number;
  label: string;
  count: number;
  percent: number;
  color: string;
  glowColor: string;
}

export function VerdictDonutChart({ total, tierCounts, tierPercents }: VerdictDonutChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const t5 = tierCounts?.[5] ?? tierCounts?.["5"] ?? Math.round(total * 0.38);
  const t4 = tierCounts?.[4] ?? tierCounts?.["4"] ?? Math.round(total * 0.22);
  const t3 = tierCounts?.[3] ?? tierCounts?.["3"] ?? Math.round(total * 0.14);
  const t2 = tierCounts?.[2] ?? tierCounts?.["2"] ?? Math.round(total * 0.11);
  const t1 = tierCounts?.[1] ?? tierCounts?.["1"] ?? Math.round(total * 0.15);

  const p5 = tierPercents?.[5] ?? tierPercents?.["5"] ?? 38;
  const p4 = tierPercents?.[4] ?? tierPercents?.["4"] ?? 22;
  const p3 = tierPercents?.[3] ?? tierPercents?.["3"] ?? 14;
  const p2 = tierPercents?.[2] ?? tierPercents?.["2"] ?? 11;
  const p1 = tierPercents?.[1] ?? tierPercents?.["1"] ?? 15;

  // 5-Tier Data Distribution
  const slices: TierSlice[] = [
    { tier: 5, label: "จริง (100%)", count: t5, percent: p5, color: "#10b981", glowColor: "rgba(16,185,129,0.5)" },
    { tier: 4, label: "จริงส่วนใหญ่ (75%)", count: t4, percent: p4, color: "#06b6d4", glowColor: "rgba(6,182,212,0.5)" },
    { tier: 3, label: "ก้ำกึ่ง (50%)", count: t3, percent: p3, color: "#f59e0b", glowColor: "rgba(245,158,11,0.5)" },
    { tier: 2, label: "บิดเบือน (25%)", count: t2, percent: p2, color: "#f97316", glowColor: "rgba(249,115,22,0.5)" },
    { tier: 1, label: "เท็จ/ข่าวปลอม (0%)", count: t1, percent: p1, color: "#f43f5e", glowColor: "rgba(244,63,94,0.5)" },
  ];

  // SVG Geometry Settings
  const size = 260;
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedPercent = 0;

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="rounded-3xl solid-card p-6 sm:p-7 border-t-4 border-t-emerald-500 dark:border-t-emerald-400 relative transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl dark:shadow-[0_0_30px_rgba(16,185,129,0.12)] bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent dark:from-[#0f2824] dark:via-[#0c1f1e] dark:to-[#081518] overflow-hidden flex flex-col justify-between">
      {/* Top Light Beam */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-emerald-400 dark:via-emerald-300 to-transparent shadow-[0_0_12px_rgba(16,185,129,0.8)]" />

      <div>
        <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-1">
          สัดส่วนผลความจริง 5 ระดับ (Verdict Ratio)
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          การกระจายตัวของระดับความน่าเชื่อถือจากข่าวสารทั้งหมดในระบบ
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-2">
        {/* SVG Donut Chart with Hover Glow */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background track circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-slate-100 dark:text-slate-800/60"
            />

            {/* Segment Arcs */}
            {slices.map((slice, idx) => {
              const strokeDasharray = `${(slice.percent / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += slice.percent;

              const isHovered = hoveredIdx === idx;

              return (
                <motion.circle
                  key={slice.tier}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 10px ${slice.glowColor})` : "none",
                    cursor: "pointer",
                    transition: "stroke-width 0.2s, filter 0.2s",
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  initial={{ strokeDasharray: `0 ${circumference}` }}
                  animate={{ strokeDasharray }}
                  transition={{ duration: 1, delay: idx * 0.15 }}
                />
              );
            })}
          </svg>

          {/* Center Text in Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {activeSlice ? activeSlice.label : "ความจริงเฉลี่ย"}
            </span>
            <span
              className="text-2xl sm:text-3xl font-black font-mono tracking-tight my-0.5"
              style={{ color: activeSlice ? activeSlice.color : "#10b981" }}
            >
              {activeSlice ? `${activeSlice.percent}%` : "60%"}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              {activeSlice ? `${activeSlice.count.toLocaleString()} เรื่อง` : "เกณฑ์มาตรฐาน"}
            </span>
          </div>
        </div>

        {/* Legend Slices */}
        <div className="w-full sm:w-auto space-y-2.5">
          {slices.map((slice, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={slice.tier}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex items-center justify-between gap-4 p-2 sm:px-3 rounded-xl transition-all cursor-pointer ${
                  isHovered
                    ? "bg-white/90 dark:bg-[#163832] shadow-xs scale-102"
                    : "hover:bg-white/40 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0 transition-transform"
                    style={{
                      backgroundColor: slice.color,
                      boxShadow: isHovered ? `0 0 10px ${slice.glowColor}` : "none",
                      transform: isHovered ? "scale(1.25)" : "scale(1)",
                    }}
                  />
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                    {slice.label}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {slice.percent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
