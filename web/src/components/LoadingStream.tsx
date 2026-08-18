"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkle, SpinnerGap } from "@phosphor-icons/react";

interface LoadingStreamProps {
  show: boolean;
  progressPct?: number;
  progressMessage?: string;
}

const PIPELINE_STAGES = [
  { id: 1, title: "สกัดเนื้อหาต้นทาง", threshold: 20 },
  { id: 2, title: "AI วางแผนคีย์เวิร์ด", threshold: 40 },
  { id: 3, title: "สืบค้นคู่ขนานสด (Exa + Serper)", threshold: 65 },
  { id: 4, title: "เทียบเคียงข้อเท็จจริง (AI Analyzer)", threshold: 85 },
  { id: 5, title: "ประมวลผลคะแนน 5 ระดับ", threshold: 100 },
];

export function LoadingStream({
  show,
  progressPct = 0,
  progressMessage = "",
}: LoadingStreamProps) {
  const [simulatedProgress, setSimulatedProgress] = useState(10);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!show) {
      setElapsedSeconds(0);
      setSimulatedProgress(10);
      return;
    }

    const startTimestamp = Date.now();
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTimestamp) / 1000;
      setElapsedSeconds(elapsed);
      const simulated = Math.min(92, Math.round(10 + Math.log10(1 + elapsed * 3.5) * 56));
      setSimulatedProgress(simulated);
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, [show]);

  if (!show) return null;

  const currentPct = Math.max(progressPct > 0 ? progressPct : simulatedProgress, 10);
  const activeStageIdx = PIPELINE_STAGES.findIndex((s) => currentPct <= s.threshold);
  const effectiveStageIdx = activeStageIdx === -1 ? PIPELINE_STAGES.length - 1 : activeStageIdx;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="w-full max-w-2xl mx-auto my-8 p-6 sm:p-8 rounded-2xl glass-panel shadow-lg text-center relative overflow-hidden"
    >
      {/* Animated Glowing AI Pulse */}
      <div className="flex items-center justify-center gap-2.5 mb-4 text-blue-600 dark:text-cyan-400">
        <SpinnerGap size={24} weight="bold" className="animate-spin text-cyan-500" />
        <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          {progressMessage || "กำลังวิเคราะห์ข้อเท็จจริงด้วย AI..."}
        </span>
        <Sparkle size={18} weight="fill" className="text-cyan-500 animate-pulse" />
      </div>

      {/* Progress Track */}
      <div className="w-full h-2.5 rounded-full bg-slate-200/80 dark:bg-slate-800/80 overflow-hidden my-5 p-0.5">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 shadow-sm shadow-cyan-500/50"
          style={{ width: `${currentPct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Progress Stage Tracker */}
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-cyan-500 animate-ping" />
          <span>ขั้นตอนที่ {effectiveStageIdx + 1}/{PIPELINE_STAGES.length}: {PIPELINE_STAGES[effectiveStageIdx].title}</span>
        </span>
        <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{currentPct}% ({elapsedSeconds.toFixed(1)}s)</span>
      </div>
    </motion.div>
  );
}
