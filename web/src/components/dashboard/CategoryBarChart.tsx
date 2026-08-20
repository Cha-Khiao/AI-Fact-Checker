"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

interface CategoryBarChartProps {
  categories: Record<string, number>;
  total: number;
  categoryPercents?: Record<string, number>;
}

interface CategoryInfo {
  key: string;
  name: string;
  icon: string;
  count: number;
  pct: number;
  gradient: string;
  glow: string;
  textColor: string;
}

export function CategoryBarChart({ categories, total, categoryPercents }: CategoryBarChartProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const rawList = [
    {
      key: "FINANCIAL_SCAM",
      name: "การเงิน / หลอกลงทุน / กู้เงิน",
      icon: "💰",
      count: categories?.FINANCIAL_SCAM ?? 0,
      gradient: "from-amber-500 via-orange-500 to-rose-500",
      glow: "rgba(245,158,11,0.5)",
      textColor: "text-amber-500 dark:text-amber-400"
    },
    {
      key: "HEALTH_MEDICINE",
      name: "สุขภาพ / ยา / อาหารเสริม",
      icon: "💊",
      count: categories?.HEALTH_MEDICINE ?? 0,
      gradient: "from-emerald-500 via-teal-500 to-cyan-500",
      glow: "rgba(16,185,129,0.5)",
      textColor: "text-emerald-500 dark:text-emerald-400"
    },
    {
      key: "PUBLIC_POLICY_GOV",
      name: "นโยบายรัฐ / สวัสดิการ / กฎหมาย",
      icon: "🏛️",
      count: categories?.PUBLIC_POLICY_GOV ?? 0,
      gradient: "from-blue-500 via-indigo-500 to-purple-500",
      glow: "rgba(59,130,246,0.5)",
      textColor: "text-blue-500 dark:text-cyan-400"
    },
    {
      key: "DISASTER_SAFETY",
      name: "ภัยพิบัติ / อุบัติภัย / เตือนภัย",
      icon: "🌪️",
      count: categories?.DISASTER_SAFETY ?? 0,
      gradient: "from-rose-500 via-red-500 to-orange-500",
      glow: "rgba(244,63,94,0.5)",
      textColor: "text-rose-500 dark:text-rose-400"
    },
    {
      key: "CELEBRITY_SOCIAL",
      name: "ข่าวบันเทิง / บุคคลสาธารณะ",
      icon: "🎭",
      count: categories?.CELEBRITY_SOCIAL ?? 0,
      gradient: "from-purple-500 via-fuchsia-500 to-pink-500",
      glow: "rgba(168,85,247,0.5)",
      textColor: "text-purple-500 dark:text-purple-400"
    },
    {
      key: "GENERAL_MISINFO",
      name: "ข่าวสารทั่วไป / ข่าวลือโซเชียล",
      icon: "📢",
      count: categories?.GENERAL_MISINFO ?? 0,
      gradient: "from-slate-500 via-slate-600 to-slate-700",
      glow: "rgba(100,116,139,0.5)",
      textColor: "text-slate-500 dark:text-slate-400"
    },
  ];

  const sumAll = rawList.reduce((acc, c) => acc + c.count, 0) || 1;
  const list: CategoryInfo[] = rawList.map((item) => ({
    ...item,
    pct: categoryPercents?.[item.key] ?? (sumAll > 0 ? Math.round((item.count / sumAll) * 100) : 0)
  }));

  return (
    <div className="rounded-3xl solid-card p-6 sm:p-7 border-t-4 border-t-amber-500 dark:border-t-amber-400 relative transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl dark:shadow-[0_0_30px_rgba(245,158,11,0.12)] bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent dark:from-[#26241a] dark:via-[#1f1d15] dark:to-[#12120e] overflow-hidden flex flex-col justify-between">
      {/* Top Amber Light Beam */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-amber-400 dark:via-yellow-300 to-transparent shadow-[0_0_12px_rgba(245,158,11,0.8)]" />

      <div>
        <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-1">
          การจัดอันดับ 6 หมวดหมู่ข้อมูลเท็จ (Threat Taxonomy)
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          สถิติการพบข้อมูลเท็จและข่าวลวงแยกตามกลุ่มประเด็นในสังคมไทย
        </p>
      </div>

      <div className="space-y-4">
        {list.map((item, idx) => {
          const isHovered = hoveredKey === item.key;

          return (
            <div
              key={item.key}
              onMouseEnter={() => setHoveredKey(item.key)}
              onMouseLeave={() => setHoveredKey(null)}
              className="space-y-1.5 cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{item.icon}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {item.count.toLocaleString()} เรื่อง
                  </span>
                  <span className="font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-white w-10 text-right">
                    {item.pct}%
                  </span>
                </div>
              </div>

              {/* Progress Bar Container with Glowing Gradient */}
              <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800/80 p-0.5 overflow-hidden shadow-inner">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${item.gradient}`}
                  initial={{ width: "0%" }}
                  animate={{ width: `${item.pct}%` }}
                  transition={{ duration: 0.9, delay: idx * 0.1, ease: "easeOut" }}
                  style={{
                    boxShadow: isHovered ? `0 0 12px ${item.glow}` : "none",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
