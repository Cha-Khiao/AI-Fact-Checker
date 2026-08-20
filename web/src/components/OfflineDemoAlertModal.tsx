"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  WarningCircle,
  Lightbulb,
  X,
  Sparkle,
  ArrowRight,
  ShieldCheck,
} from "@phosphor-icons/react";

interface OfflineDemoAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSampleTopics: () => void;
}

export function OfflineDemoAlertModal({
  isOpen,
  onClose,
  onOpenSampleTopics,
}: OfflineDemoAlertModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative w-full max-w-lg rounded-3xl solid-card border-t-4 border-t-amber-500 shadow-2xl z-10 overflow-hidden bg-white dark:bg-[#0c1626] p-6 sm:p-7"
        >
          {/* Top Amber Light Beam */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_rgba(245,158,11,0.8)]" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 transition-all cursor-pointer"
            title="ปิดหน้าต่าง"
            aria-label="ปิดหน้าต่าง"
          >
            <X size={16} weight="bold" />
          </button>

          <div className="flex flex-col items-center text-center">
            {/* 3D Icon */}
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl shadow-amber-500/30 ring-4 ring-amber-400/20 mb-4 animate-bounce duration-1000">
              <Lightbulb size={28} weight="fill" />
            </div>

            {/* Title */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 mb-2">
              <Sparkle size={13} weight="fill" />
              <span>แจ้งเตือนสถานะระบบ (Offline Demo Mode)</span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
              ระบบกำลังทำงานในโหมดสาธิต
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed max-w-md">
              ขณะนี้เซิร์ฟเวอร์หลังบ้าน (Backend Server) ปิดอยู่เพื่อประหยัดทรัพยากร จึงไม่สามารถประมวลผลข้อความที่พิมพ์เองสดๆ ได้
            </p>

            {/* Info Box */}
            <div className="w-full mt-4 p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-left text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <ShieldCheck size={16} weight="bold" />
                <span>คำแนะนำสำหรับการทดสอบและสาธิต:</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                โปรดเลือกใช้ <strong>10 ตัวอย่างประเด็นทดสอบมาตรฐาน</strong> (มีทั้งข่าวจริง, ข่าวปลอม, ข้อมูลบิดเบือน ครบทุกหมวดหมู่) เพื่อดูตัวอย่างผลวิเคราะห์ฉบับสมบูรณ์ได้ทันที 100% โดยไม่ต้องพึ่งพาฐานข้อมูล
              </p>
            </div>

            {/* Action Buttons */}
            <div className="w-full mt-6 flex flex-col items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSampleTopics();
                }}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-95 ring-2 ring-amber-400/40"
              >
                <Lightbulb size={18} weight="fill" />
                <span>เปิดดู 10 ตัวอย่างประเด็นทดสอบ</span>
                <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
