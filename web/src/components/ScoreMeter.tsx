"use client";

import React from "react";
import { ScoreLevel } from "@/types";
import {
  CheckCircle,
  Warning,
  XCircle,
} from "@phosphor-icons/react";
import { getScoreMetadata } from "@/lib/utils";
import { NumberTicker } from "./NumberTicker";

interface ScoreMeterProps {
  score: ScoreLevel;
  summary?: string;
}

function getBacklightColor(score: ScoreLevel) {
  switch (score) {
    case 5:
    case 4:
      return "bg-emerald-400/30 dark:bg-emerald-500/35";
    case 3:
      return "bg-amber-400/30 dark:bg-amber-500/35";
    case 2:
      return "bg-orange-400/30 dark:bg-orange-500/35";
    case 1:
    default:
      return "bg-rose-400/30 dark:bg-rose-500/35";
  }
}

function getVerdictIcon(score: ScoreLevel) {
  switch (score) {
    case 5:
    case 4:
      return <CheckCircle size={56} weight="fill" className="text-emerald-500 drop-shadow-md" />;
    case 3:
      return <Warning size={56} weight="fill" className="text-amber-500 drop-shadow-md" />;
    case 2:
      return <Warning size={56} weight="fill" className="text-orange-500 drop-shadow-md" />;
    case 1:
    default:
      return <XCircle size={56} weight="fill" className="text-rose-500 drop-shadow-md" />;
  }
}

function getVerdictDirectText(score: ScoreLevel) {
  switch (score) {
    case 5:
      return "ข้อมูลถูกต้องและสอดคล้องกับข้อเท็จจริง";
    case 4:
      return "ข้อมูลถูกต้องเป็นส่วนใหญ่";
    case 3:
      return "ข้อมูลก้ำกึ่ง / ยังไม่มีข้อยุติแน่ชัด";
    case 2:
      return "ข้อมูลบิดเบือน / ไม่ตรงกับข้อเท็จจริง";
    case 1:
    default:
      return "ข้อมูลเท็จ / ข่าวปลอม";
  }
}

export function ScoreMeter({ score }: ScoreMeterProps) {
  const meta = getScoreMetadata(score);
  const backlightColor = getBacklightColor(score);
  const directText = getVerdictDirectText(score);

  return (
    <div className="relative w-full py-6 sm:py-10 my-2 flex flex-col items-center justify-center text-center select-none">
      <div
        className={`absolute w-60 h-60 sm:w-80 sm:h-80 rounded-full ${backlightColor} blur-3xl pointer-events-none -z-10 animate-pulse`}
      />

      <div className="flex flex-col items-center justify-center">
        <div className="mb-2">
          {getVerdictIcon(score)}
        </div>

        <div
          className={`text-7xl sm:text-8xl md:text-9xl font-black font-mono tracking-tight ${meta.color} drop-shadow-sm`}
        >
          <NumberTicker value={meta.percentage} suffix="%" />
        </div>

        <h2 className="mt-3 text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {directText}
        </h2>
      </div>
    </div>
  );
}
