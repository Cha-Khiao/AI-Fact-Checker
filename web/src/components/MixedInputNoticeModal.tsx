"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LinkSimple,
  Article,
  CheckCircle,
  ArrowRight,
  Sparkle,
  X,
  ArrowsClockwise,
} from "@phosphor-icons/react";

interface MixedInputNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedUrl?: string;
}

export function MixedInputNoticeModal({
  isOpen,
  onClose,
  detectedUrl,
}: MixedInputNoticeModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-lg rounded-3xl solid-card border-t-4 border-t-cyan-500 p-6 sm:p-7 shadow-2xl z-10 bg-white dark:bg-[#0a1220] border border-slate-200/90 dark:border-slate-800/90 text-slate-900 dark:text-white"
          >
            <button
              type="button"
              onClick={onClose}
              className="group absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X size={18} weight="bold" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 ring-2 ring-cyan-500/30">
                <Sparkle size={26} weight="duotone" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  ตรวจพบทั้งลิงก์และข้อความ
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              ระบบตรวจพบว่ามีทั้ง <strong className="text-blue-600 dark:text-cyan-300">ลิงก์ URL</strong> และ <strong className="text-slate-800 dark:text-slate-200">ข้อความเพิ่มเติม</strong> ในอินพุตเดียวกัน เพื่อความแม่นยำสูงสุด ระบบจะดำเนินการตามลำดับดังนี้:
            </p>

            <div className="space-y-2.5 mb-5 text-xs sm:text-sm">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs">
                  1
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <LinkSimple size={15} weight="bold" className="text-blue-500" />
                    <span>ตรวจสอบเนื้อหาจากลิงก์เป็นหลักก่อน</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 leading-relaxed">
                    ระบบจะดึงเนื้อหาจากลิงก์ต้นฉบับมาตรวจสอบและเทียบเคียงข้อเท็จจริงเป็นอันดับแรก
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  2
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle size={15} weight="bold" className="text-emerald-500" />
                    <span>หากลิงก์ผ่าน จะตรวจสอบเฉพาะลิงก์</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 leading-relaxed">
                    เมื่อดึงข้อมูลจากลิงก์สำเร็จ ระบบจะตรวจสอบเฉพาะเนื้อหาข่าวของลิงก์ ไม่นำข้อความอื่นมาปะปน
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs">
                  3
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ArrowsClockwise size={15} weight="bold" className="text-amber-500" />
                    <span>หากลิงก์เข้าถึงไม่ได้ สลับใช้ข้อความแทน</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 leading-relaxed">
                    หากลิงก์ติดล็อก ติดสิทธิ์ส่วนตัว หรือ 404 ระบบจะสลับไปตรวจสอบข้อความที่แนบมาแทนโดยอัตโนมัติ
                  </p>
                </div>
              </div>
            </div>

            {detectedUrl && (
              <div className="p-2.5 mb-5 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 truncate">
                <LinkSimple size={14} className="shrink-0 text-cyan-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300 shrink-0">ลิงก์ที่ตรวจพบ:</span>
                <span className="truncate font-mono">{detectedUrl}</span>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-2.5 px-4 text-xs sm:text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition-all cursor-pointer active:scale-95"
              >
                <span>เข้าใจแล้ว ดำเนินการต่อ</span>
                <ArrowRight size={15} weight="bold" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
