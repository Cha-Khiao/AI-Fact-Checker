"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lottie } from "lottie-react";
import {
  CheckCircle,
  SpinnerGap,
} from "@phosphor-icons/react";
import { NumberTicker } from "./NumberTicker";

interface LoadingStreamProps {
  show: boolean;
  progressPct?: number;
  progressMessage?: string;
}

const PIPELINE_STAGES = [
  {
    id: 1,
    name: "สกัดเนื้อหาและข้อความต้นทาง",
    aiNarrative: "กำลังสกัดเนื้อหาสำคัญจากแหล่งที่มา ล้างข้อความขยะ และจัดเตรียมข้อมูลเพื่อการประมวลผล...",
    threshold: 20,
  },
  {
    id: 2,
    name: "AI วิเคราะห์ประเด็นและวางแผนสืบค้น (5W1H)",
    aiNarrative: "AI กำลังถอดรหัส ใคร ทำอะไร ที่ไหน เมื่อไหร่ เพื่อตั้งหัวข้อการสืบค้นอย่างครอบคลุม...",
    threshold: 40,
  },
  {
    id: 3,
    name: "สืบค้นคู่ขนานสด (Google News & Exa)",
    aiNarrative: "กำลังค้นหาหลักฐานสดผ่าน Search Engine คู่ขนานจากสำนักข่าวที่น่าเชื่อถือ...",
    threshold: 65,
  },
  {
    id: 4,
    name: "เทียบเคียงหลักฐานและคัดกรองข้อขัดแย้ง",
    aiNarrative: "AI กำลังตรวจสอบความสอดคล้อง ตรวจจับจุดที่บิดเบือน และวิเคราะห์ข้อหักล้างอย่างละเอียด...",
    threshold: 85,
  },
  {
    id: 5,
    name: "ประเมินและสรุปผลตามมาตรฐาน IFCN",
    aiNarrative: "กำลังคำนวณระดับความน่าเชื่อถือ และจัดทำรายงานผลการตรวจสอบขั้นสุดท้าย...",
    threshold: 100,
  },
];

function cleanLoadingMessage(text: string): string {
  if (!text) return "";
  return text
    .replace(/\s*\(\s*\d+%\s*\)/g, "")
    .replace(/\s*\(\s*%\s*\)/g, "")
    .replace(/\s*\[\s*\d+%\s*\]/g, "")
    .replace(/\s+\d+%\s*/g, " ")
    .replace(/\s*\(?\s*%\s*\)?/g, "")
    .replace(/\s*\(\s*\)/g, "")
    .trim();
}

export function LoadingStream({
  show,
  progressPct = 0,
  progressMessage = "",
}: LoadingStreamProps) {
  const [simulatedProgress, setSimulatedProgress] = useState(12);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    if (!show) {
      setElapsedSeconds(0);
      setSimulatedProgress(12);
      setTypedText("");
      return;
    }

    const startTimestamp = Date.now();
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTimestamp) / 1000;
      setElapsedSeconds(elapsed);
      const simulated = Math.min(94, Math.round(12 + Math.log10(1 + elapsed * 3.2) * 55));
      setSimulatedProgress(simulated);
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, [show]);

  const currentPct = Math.max(progressPct > 0 ? progressPct : simulatedProgress, 12);
  const activeStageIdx = PIPELINE_STAGES.findIndex((s) => currentPct <= s.threshold);
  const effectiveStageIdx = activeStageIdx === -1 ? PIPELINE_STAGES.length - 1 : activeStageIdx;
  const currentStage = PIPELINE_STAGES[effectiveStageIdx];

  useEffect(() => {
    if (!show || !currentStage) return;

    const rawText = progressMessage || currentStage.aiNarrative;
    const targetText = cleanLoadingMessage(rawText);
    setTypedText("");
    let charIndex = 0;

    const typeTimer = setInterval(() => {
      if (charIndex <= targetText.length) {
        setTypedText(targetText.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typeTimer);
      }
    }, 22);

    return () => {
      clearInterval(typeTimer);
    };
  }, [effectiveStageIdx, progressMessage, show]);

  if (!show) return null;

  return (
    <div className="w-full max-w-5xl lg:max-w-6xl mx-auto my-6 px-3 sm:px-4 flex flex-col items-center">
      <div className="w-full rounded-3xl solid-card p-8 sm:p-12 md:p-14 relative overflow-hidden transition-all duration-300 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-center">
          <div className="md:col-span-5 flex flex-col items-center justify-center text-center">
            <div className="relative w-full max-w-[240px] sm:max-w-[280px] aspect-square flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-cyan-400/25 dark:bg-cyan-400/35 blur-3xl pointer-events-none -z-10 animate-pulse" />
              <div className="absolute inset-4 rounded-full bg-blue-500/25 dark:bg-blue-600/35 blur-2xl pointer-events-none -z-10" />

              <div
                id="loading-animation-slot"
                className="relative z-10 w-full h-full flex items-center justify-center dark:brightness-110 dark:drop-shadow-[0_0_20px_rgba(56,189,248,0.35)]"
              >
                <Lottie
                  src="/loading-animation.json"
                  className="w-full h-full object-contain"
                  autoplay
                  loop
                />
              </div>
            </div>

            <div className="mt-4 flex flex-col items-center">
              <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-blue-600 dark:text-cyan-400">
                <NumberTicker value={currentPct} suffix="%" />
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs sm:text-sm font-mono text-slate-500 dark:text-slate-400">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>กำลังประมวลผล · {elapsedSeconds.toFixed(1)} วินาที</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 flex flex-col justify-center">
            <div className="flex flex-col">
              {PIPELINE_STAGES.map((stage, idx) => {
                const isCompleted = currentPct > stage.threshold || (idx < effectiveStageIdx);
                const isActive = idx === effectiveStageIdx && !isCompleted;
                const isLast = idx === PIPELINE_STAGES.length - 1;

                return (
                  <div key={stage.id} className="flex items-start gap-4 sm:gap-5">
                    <div className="flex flex-col items-center shrink-0 self-stretch">
                      <div
                        className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-300 z-10 ${
                          isCompleted
                            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/40"
                            : isActive
                            ? "bg-blue-600 dark:bg-cyan-500 text-white ring-4 ring-blue-500/20 dark:ring-cyan-500/30 animate-pulse"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle size={18} weight="bold" />
                        ) : isActive ? (
                          <SpinnerGap size={18} weight="bold" className="animate-spin" />
                        ) : (
                          <span className="text-xs font-mono font-bold">{stage.id}</span>
                        )}
                      </div>

                      {!isLast && (
                        <div
                          className={`w-0.5 flex-1 min-h-[24px] my-1 transition-colors duration-300 ${
                            isCompleted
                              ? "bg-emerald-500/70 dark:bg-emerald-500/50"
                              : "bg-slate-200 dark:bg-slate-800"
                          }`}
                        />
                      )}
                    </div>

                    <div
                      className={`flex-1 min-w-0 pb-4 sm:pb-5 rounded-2xl transition-all duration-300 ${
                        isActive
                          ? "p-4 bg-blue-50/80 dark:bg-slate-800/80 border border-blue-200 dark:border-cyan-500/40 shadow-md mb-2"
                          : isCompleted
                          ? "p-1.5 opacity-80"
                          : "p-1.5 opacity-35"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h4
                          className={`text-sm sm:text-base font-bold tracking-tight ${
                            isActive
                              ? "text-blue-900 dark:text-cyan-200"
                              : isCompleted
                              ? "text-slate-800 dark:text-slate-200"
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          ขั้นตอนที่ {stage.id}: {stage.name}
                        </h4>

                        {isCompleted && (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                            เสร็จสิ้น
                          </span>
                        )}
                        {isActive && (
                          <span className="text-xs font-bold text-blue-600 dark:text-cyan-400 shrink-0 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60">
                            กำลังดำเนินการ
                          </span>
                        )}
                      </div>

                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-2.5 text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed font-medium"
                        >
                          <span className="text-blue-600 dark:text-cyan-400 font-bold mr-1.5">AI:</span>
                          {typedText}
                          <span className="inline-block w-2 h-4 ml-1.5 bg-blue-600 dark:bg-cyan-400 animate-pulse align-middle" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
