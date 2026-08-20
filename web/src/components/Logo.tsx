"use client";

import React from "react";
import { ShieldCheck } from "@phosphor-icons/react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}

export function Logo({ size = "md", showTagline = true, className = "" }: LogoProps) {
  const iconSize = size === "sm" ? 18 : size === "lg" ? 28 : 22;
  const boxSize =
    size === "sm"
      ? "h-7 w-7 rounded-lg"
      : size === "lg"
      ? "h-11 w-11 rounded-2xl"
      : "h-9 w-9 rounded-xl";
  const titleSize =
    size === "sm" ? "text-sm" : size === "lg" ? "text-lg sm:text-xl" : "text-base";

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div
        className={`relative flex ${boxSize} items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-md shadow-blue-500/25 ring-2 ring-cyan-400/30 overflow-hidden shrink-0 group-hover:scale-105 transition-transform`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-transparent pointer-events-none" />
        <ShieldCheck
          size={iconSize}
          weight="fill"
          className="relative z-10 text-cyan-200 drop-shadow-sm"
        />
      </div>

      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-extrabold tracking-tight text-slate-900 dark:text-white ${titleSize}`}
          >
            AI Fact-Checker
          </span>
        </div>
        {showTagline && (
          <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 tracking-tight hidden xs:inline-block">
            ระบบตรวจสอบข้อเท็จจริงข่าวสารอัจฉริยะ
          </span>
        )}
      </div>
    </div>
  );
}

export default Logo;
