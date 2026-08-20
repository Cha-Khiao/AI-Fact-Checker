"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lottie } from "lottie-react";
import {
  ShieldCheck,
  VideoCameraSlash,
  LockKey,
  Info,
  ArrowRight,
  ArrowLeft,
  Article,
} from "@phosphor-icons/react";

const WELCOME_STORAGE_KEY = "ai_factcheck_welcome_seen_v2";

interface WelcomeModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export function WelcomeModal({ forceOpen, onClose }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (forceOpen !== undefined) {
      setIsOpen(forceOpen);
      return;
    }

    try {
      const hasSeen = localStorage.getItem(WELCOME_STORAGE_KEY);
      if (!hasSeen) {
        const timer = setTimeout(() => setIsOpen(true), 500);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, [forceOpen]);

  useEffect(() => {
    if (isOpen && currentStep === 1) {
      autoAdvanceTimerRef.current = setTimeout(() => {
        setCurrentStep(2);
      }, 2800);
    }
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, [isOpen, currentStep]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(WELCOME_STORAGE_KEY, "true");
    } catch {}
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    setIsOpen(false);
    onClose?.();
  };

  const handleNext = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    if (currentStep === 1) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(3);
    else handleDismiss();
  };

  const handlePrev = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          onClick={handleDismiss}
        />

        <motion.div
          key="welcome-modal-card"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl rounded-3xl solid-card border-t-4 border-t-cyan-500 p-6 sm:p-8 shadow-2xl z-10 max-h-[92vh] overflow-y-auto overflow-x-hidden flex flex-col justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center text-center py-8 sm:py-10"
            >
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="absolute -inset-5 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 opacity-50 blur-2xl animate-pulse" />
                <motion.div
                  initial={{ rotate: -12, scale: 0.7 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-2xl shadow-cyan-500/40 ring-4 ring-cyan-400/30"
                >
                  <ShieldCheck size={60} weight="duotone" className="drop-shadow-lg" />
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
                  <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 bg-clip-text text-transparent">
                    AI Fact-Checker
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium max-w-md mx-auto leading-relaxed mt-2">
                  ระบบผู้ช่วยอัจฉริยะตรวจสอบข้อเท็จจริงข่าวสารและข้อมูลออนไลน์ ด้วยสถาปัตยกรรม Stateless Real-time RAG
                </p>
              </motion.div>

              <div className="w-full max-w-xs mt-10 space-y-2">
                <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.6, ease: "linear" }}
                    className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 shadow-sm"
                  />
                </div>
                <div className="text-[11px] text-slate-400 font-mono text-center">
                  กำลังโหลดคำแนะนำการใช้งาน...
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="py-1"
            >
              <div className="mb-5 pb-3 border-b border-slate-200/80 dark:border-slate-800/80 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  วิธีการใช้งานระบบ
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  3 ขั้นตอนง่ายๆ ในการตรวจสอบข้อเท็จจริงแบบ Real-time
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                <div className="md:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-blue-50/80 to-cyan-50/40 dark:from-[#102238] dark:to-[#0c1829] border border-blue-200/80 dark:border-[#22395d] text-center shadow-xs">
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-cyan-400/25 dark:bg-cyan-400/35 blur-xl animate-pulse" />
                    <Lottie
                      src="/loading-animation.json"
                      className="w-full h-full object-contain relative z-10 dark:brightness-110 drop-shadow-md"
                      autoplay
                      loop
                    />
                  </div>
                  <div className="mt-2 font-bold text-xs text-blue-600 dark:text-cyan-300">
                    ระบบสืบค้นข้อมูลสดคู่ขนาน
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    เทียบเคียงสำนักข่าวและหน่วยงานทางการ 60+ แห่ง
                  </span>
                </div>

                <div className="md:col-span-7 space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-[#13253d] border border-slate-200/90 dark:border-[#2b446b] flex items-start gap-3 shadow-xs">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white font-bold text-xs shadow-xs">
                      1
                    </div>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        วางลิงก์ หรือพิมพ์ข้อความ
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        รองรับ URL โซเชียล/เว็บข่าว (จำกัด 1 ลิงก์) หรือข้อความข่าวสาร
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-[#13253d] border border-slate-200/90 dark:border-[#2b446b] flex items-start gap-3 shadow-xs">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-white font-bold text-xs shadow-xs">
                      2
                    </div>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        AI ค้นหาหลักฐานสดคู่ขนาน
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        ดึงหลักฐานจาก Exa Semantic + Google Serper ทันที
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-[#13253d] border border-slate-200/90 dark:border-[#2b446b] flex items-start gap-3 shadow-xs">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-500 text-white font-bold text-xs shadow-xs">
                      3
                    </div>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        รับผลคะแนน IFCN 5 ระดับ
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        สรุปความน่าเชื่อถือ (0-100%) พร้อมแสดงหลักฐานโปร่งใส
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="py-1"
            >
              <div className="mb-5 pb-3 border-b border-slate-200/80 dark:border-slate-800/80 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  ข้อจำกัดการใช้งานของระบบ
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  ข้อกำหนดและข้อแนะนำเพื่อความปลอดภัยและแม่นยำ
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-[#1a1218] border border-rose-200/80 dark:border-rose-900/50 space-y-1 shadow-xs">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm">
                    <VideoCameraSlash size={18} weight="duotone" />
                    <span>ไม่รองรับวิดีโอ / คลิปเสียง</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    ระบบเน้นตรวจเนื้อหาตัวอักษร หากมีคลิปวิดีโอแนะนำให้พิมพ์หรือสรุปใจความสำคัญมาตรวจแทน
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-[#0c1e17] border border-emerald-200/80 dark:border-emerald-900/50 space-y-1 shadow-xs">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm">
                    <LockKey size={18} weight="duotone" />
                    <span>Stateless 100% (PDPA)</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    ไร้ฐานข้อมูล ไม่บันทึก IP หรือข้อมูลส่วนตัวใดๆ ประวัติจะถูกเก็บเฉพาะในเครื่องของคุณ
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-[#201b12] border border-amber-200/80 dark:border-amber-900/50 space-y-1 shadow-xs">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs sm:text-sm">
                    <Article size={18} weight="duotone" />
                    <span>จำกัด 1 ลิงก์ / 1,500 ตัวอักษร</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    เพื่อความรวดเร็วและความแม่นยำสูงสุด หากเนื้อหายาวแนะนำให้แยกตรวจทีละ 1 ประเด็น
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-[#101e30] border border-blue-200/80 dark:border-blue-900/50 space-y-1 shadow-xs">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-cyan-400 font-bold text-xs sm:text-sm">
                    <Info size={18} weight="duotone" />
                    <span>เครื่องมือช่วยวิเคราะห์เบื้องต้น</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    พัฒนาขึ้นเพื่อการศึกษาและการวิจัย (Senior Project) ไม่สามารถใช้แทนคำตัดสินทางกฎหมายได้
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="pt-5 mt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => {
                    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
                    setCurrentStep(step as 1 | 2 | 3);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    currentStep === step
                      ? "w-6 bg-gradient-to-r from-blue-600 to-cyan-400"
                      : "w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
                  }`}
                  title={`ไปหน้าที่ ${step}`}
                />
              ))}
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 ml-1">
                {currentStep}/3
              </span>
            </div>

            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft size={14} weight="bold" />
                  <span>ย้อนกลับ</span>
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95"
                >
                  <span>ถัดไป</span>
                  <ArrowRight size={14} weight="bold" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95"
                >
                  <span>เริ่มต้นใช้งาน</span>
                  <ArrowRight size={15} weight="bold" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default WelcomeModal;
