"use client";

import Link from "next/link";
import { ShieldCheckered } from "@phosphor-icons/react";

export default function Footer() {
  return (
    <footer className="glass-panel py-10 text-xs text-slate-500 dark:text-slate-400 mt-10">
      <div className="wrapper flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400">
            <ShieldCheckered size={18} weight="duotone" />
          </div>
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">AI Fact-Checker</span>
            <p className="text-[11px] text-slate-500">Stateless Realtime Fact-Checking Platform</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-6 font-medium">
          <Link href="/#checker" className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">ตรวจสอบข่าว</Link>
          <Link href="/#features" className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">ฟีเจอร์</Link>
          <Link href="/#how-it-works" className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">วิธีใช้งาน</Link>
          <Link href="/#benefits" className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">ประโยชน์</Link>
          <Link href="/#faq" className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">คำถามที่พบบ่อย</Link>
        </div>

        <div className="text-center sm:text-right">
          <p>© {new Date().getFullYear()} AI Fact-Checker. All rights reserved.</p>
          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-center sm:justify-end gap-1">
            <span>ขับเคลื่อนด้วยพลัง AI & Open Data</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
