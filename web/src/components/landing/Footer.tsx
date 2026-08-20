"use client";

<<<<<<< HEAD
import React from "react";
import { GraduationCap, Buildings, Sparkle, ShieldCheck } from "@phosphor-icons/react";
=======
import { GraduationCap } from "@phosphor-icons/react";
>>>>>>> origin/dev
import { Logo } from "@/components/Logo";

export default function Footer() {
  return (
<<<<<<< HEAD
    <footer className="glass-panel py-10 text-xs text-slate-500 dark:text-slate-400 mt-14 border-t border-slate-200/80 dark:border-[#2b446b]/80">
      <div className="wrapper flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 text-center lg:text-left">
        {/* Left: Brand Logo & Short Slogan */}
        <div className="flex flex-col items-center lg:items-start gap-2 max-w-xs">
          <Logo size="lg" />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
            ระบบตรวจสอบและเทียบเคียงข้อเท็จจริงข่าวสาร ด้วยขุมพลังปัญญาประดิษฐ์และสถาปัตยกรรมไร้ฐานข้อมูล
=======
    <footer className="glass-panel py-10 text-xs text-slate-500 dark:text-slate-400 mt-12 border-t border-slate-200/80 dark:border-[#2b446b]/80">
      <div className="wrapper flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <Logo size="lg" />

        <div className="flex flex-col items-center md:items-start max-w-md bg-slate-100/70 dark:bg-slate-800/50 p-3.5 px-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 mb-1">
            <GraduationCap size={18} weight="duotone" className="text-blue-600 dark:text-cyan-400 shrink-0" />
            <span>โครงงานนักศึกษา: <span className="text-blue-600 dark:text-cyan-400">AI Fact-Checker</span></span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            พัฒนาขึ้นเพื่อการศึกษาและการวิจัยทางวิชาการ (Senior Project) ด้วยเทคโนโลยี AI และสถาปัตยกรรม Stateless Real-time RAG
          </p>
        </div>

        <div className="text-center md:text-right max-w-xs">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            © {new Date().getFullYear()} AI Fact-Checker (Student Project)
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            **ข้อจำกัดความรับผิดชอบ:** ระบบเป็นเครื่องมือ AI เพื่อการศึกษาวิจัยและช่วยวิเคราะห์ข้อมูลเบื้องต้นเท่านั้น ไม่สามารถใช้แทนการตัดสินทางกฎหมายได้
>>>>>>> origin/dev
          </p>
        </div>

        {/* Center: Structured Academic Project Card */}
        <div className="flex flex-col items-center lg:items-start max-w-sm w-full bg-slate-50/80 dark:bg-[#0c182a]/80 p-3.5 px-4 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs relative overflow-hidden">
          {/* Top Subtle Light Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

          {/* Line 1: Project Title */}
          <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
            <GraduationCap size={16} weight="duotone" className="text-blue-600 dark:text-cyan-400 shrink-0" />
            <span>โครงงานนักศึกษา: <span className="text-blue-600 dark:text-cyan-400">AI Fact-Checker</span></span>
          </div>

          {/* Line 2: Department */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
            <span className="text-cyan-500 font-bold shrink-0">•</span>
            <span>สาขาวิชาวิทยาการคอมพิวเตอร์ (Computer Science)</span>
          </div>

          {/* Line 3: University */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">
            <span className="text-blue-500 font-bold shrink-0">•</span>
            <span>มหาวิทยาลัยราชภัฏศรีสะเกษ (Sisaket Rajabhat University)</span>
          </div>
        </div>

        {/* Right: Copyright & Legal Disclaimer */}
        <div className="flex flex-col items-center lg:items-end text-center lg:text-right max-w-xs">
          <p className="font-bold text-xs text-slate-700 dark:text-slate-300">
            © {new Date().getFullYear()} AI Fact-Checker Project
          </p>
          <div className="mt-1.5 p-2.5 rounded-xl bg-slate-100/60 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed text-left lg:text-right">
            <span className="font-semibold text-slate-600 dark:text-slate-300">ข้อจำกัดความรับผิดชอบ:</span>{" "}
            ระบบเป็นเครื่องมือ AI ช่วยประมวลผลเชิงวิจัยเบื้องต้น ไม่สามารถใช้แทนการตัดสินทางกฎหมายได้
          </div>
        </div>
      </div>
    </footer>
  );
}
