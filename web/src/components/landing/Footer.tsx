"use client";

import { GraduationCap } from "@phosphor-icons/react";
import { Logo } from "@/components/Logo";

export default function Footer() {
  return (
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
          </p>
        </div>
      </div>
    </footer>
  );
}
