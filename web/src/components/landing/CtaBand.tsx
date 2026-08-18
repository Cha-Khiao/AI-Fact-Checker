"use client";

import React from "react";
import { Fade } from "react-awesome-reveal";
import { ArrowRight, Sparkle, ShieldCheckered } from "@phosphor-icons/react";

export default function CtaBand() {
  return (
    <section className="py-14 sm:py-20">
      <div className="wrapper">
        <Fade triggerOnce direction="up">
          <div className="max-w-3xl mx-auto text-center p-8 sm:p-12 rounded-3xl glass-panel relative overflow-hidden shadow-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-cyan-400 mb-4">
              <ShieldCheckered size={16} weight="duotone" />
              <span>เริ่มใช้งานได้ทันที</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              พร้อมแยกแยะข้อเท็จจริง{" "}
              <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 dark:from-blue-400 dark:via-cyan-300 dark:to-indigo-400 bg-clip-text text-transparent">
                ด้วยความมั่นใจ?
              </span>
            </h2>

            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
              เริ่มต้นตรวจสอบข่าวแรกของคุณได้ทันที รวดเร็ว โปร่งใส และไม่มีค่าใช้จ่าย
            </p>

            <a
              href="#checker"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all cursor-pointer hover:scale-105"
            >
              <Sparkle size={16} weight="fill" />
              <span>ตรวจสอบข่าวสารเลย</span>
              <ArrowRight size={16} weight="bold" />
            </a>
          </div>
        </Fade>
      </div>
    </section>
  );
}
