"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  VideoCamera,
  Prohibit,
  ShieldWarning,
  UserCircle,
  GlobeHemisphereWest,
  X,
  Lightbulb,
} from "@phosphor-icons/react";
import { GuardrailViolation } from "../lib/guardrail";

interface GuardrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  violation: GuardrailViolation | null;
}

export default function GuardrailModal({
  isOpen,
  onClose,
  violation,
}: GuardrailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!violation) return null;

  const getCategoryIconDetails = () => {
    switch (violation.category) {
      case "multimedia":
        return {
          icon: <VideoCamera size={30} weight="duotone" className="text-blue-500 dark:text-cyan-400" />,
          bg: "bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-indigo-500/20 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/20",
        };
      case "gambling":
        return {
          icon: <Prohibit size={30} weight="duotone" className="text-rose-500 dark:text-rose-400" />,
          bg: "bg-gradient-to-br from-rose-500/20 via-pink-500/20 to-amber-500/20 ring-2 ring-rose-500/40 shadow-lg shadow-rose-500/20",
        };
      case "illegal":
        return {
          icon: <ShieldWarning size={30} weight="duotone" className="text-red-500 dark:text-red-400" />,
          bg: "bg-gradient-to-br from-red-500/20 via-orange-500/20 to-rose-500/20 ring-2 ring-red-500/40 shadow-lg shadow-red-500/20",
        };
      case "personal":
        return {
          icon: <UserCircle size={30} weight="duotone" className="text-purple-500 dark:text-purple-400" />,
          bg: "bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-indigo-500/20 ring-2 ring-purple-500/40 shadow-lg shadow-purple-500/20",
        };
      case "homepage":
        return {
          icon: <GlobeHemisphereWest size={30} weight="duotone" className="text-blue-500 dark:text-cyan-400" />,
          bg: "bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-indigo-500/20 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/20",
        };
      default:
        return {
          icon: <ShieldWarning size={30} weight="duotone" className="text-amber-500" />,
          bg: "bg-amber-500/20 ring-2 ring-amber-500/40",
        };
    }
  };

  const iconDetails = getCategoryIconDetails();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`relative w-full max-w-lg rounded-3xl solid-card border-t-4 ${violation.borderColor} p-6 sm:p-8 shadow-2xl z-10`}
          >
            <button
              type="button"
              onClick={onClose}
              className="group absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-500/15 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.35)] hover:bg-rose-600 hover:text-white hover:border-rose-500 hover:shadow-[0_0_22px_rgba(244,63,94,0.7)] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
              title="ปิดหน้าต่าง"
              aria-label="ปิดหน้าต่าง"
            >
              <X size={18} weight="bold" className="transition-transform duration-200 group-hover:rotate-90" />
            </button>

            <div className="flex items-center gap-4 mb-3 pr-8">
              <div className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl ${iconDetails.bg}`}>
                {iconDetails.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                  {violation.title}
                </h3>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                {violation.reason}
              </p>
            </div>

            <div className="mt-3.5 p-4 rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <Lightbulb size={18} weight="fill" className="text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-blue-700 dark:text-cyan-300 mb-0.5">
                    คำแนะนำในการตรวจสอบ:
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    {violation.suggestion}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/25 transition-all duration-200 cursor-pointer active:scale-98"
              >
                <span>รับทราบ</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
