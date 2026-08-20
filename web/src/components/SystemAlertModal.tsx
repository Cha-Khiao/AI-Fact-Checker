"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  WarningCircle,
  GearSix,
  Prohibit,
  LinkBreak,
  ShieldWarning,
  VideoCamera,
  X,
  ArrowCounterClockwise,
  Lightbulb,
  CloudSlash,
  Cpu,
} from "@phosphor-icons/react";

export type SystemAlertCategory =
  | "server_error"
  | "ai_maintenance"
  | "link_404"
  | "platform_blocked"
  | "multimedia"
  | "gambling"
  | "network_error"
  | "general_error";

export interface SystemAlertInfo {
  category: SystemAlertCategory;
  source: "backend" | "link" | "platform" | "network" | "guardrail";
  title: string;
  badge?: string;
  reason: string;
  suggestion: string;
}

interface SystemAlertModalProps {
  isOpen: boolean;
  onAcknowledge: () => void;
  alert: SystemAlertInfo | null;
}

export function SystemAlertModal({
  isOpen,
  onAcknowledge,
  alert,
}: SystemAlertModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onAcknowledge();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onAcknowledge]);

  if (!alert) return null;

  const getVisualDetails = () => {
    switch (alert.category) {
      case "server_error":
      case "ai_maintenance":
        return {
          icon: <Cpu size={32} weight="duotone" className="text-amber-500 dark:text-amber-400 animate-pulse" />,
          bg: "bg-amber-500/15 dark:bg-amber-500/25 ring-2 ring-amber-500/40 text-amber-600 dark:text-amber-300",
          borderTop: "border-t-amber-500",
          badgeColor: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
          buttonColor: "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-500/25",
        };
      case "link_404":
        return {
          icon: <LinkBreak size={32} weight="duotone" className="text-rose-500 dark:text-rose-400" />,
          bg: "bg-rose-500/15 dark:bg-rose-500/25 ring-2 ring-rose-500/40 text-rose-600 dark:text-rose-300",
          borderTop: "border-t-rose-500",
          badgeColor: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
          buttonColor: "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-500/25",
        };
      case "platform_blocked":
        return {
          icon: <Prohibit size={32} weight="duotone" className="text-purple-500 dark:text-purple-400" />,
          bg: "bg-purple-500/15 dark:bg-purple-500/25 ring-2 ring-purple-500/40 text-purple-600 dark:text-purple-300",
          borderTop: "border-t-purple-500",
          badgeColor: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
          buttonColor: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/25",
        };
      case "network_error":
        return {
          icon: <CloudSlash size={32} weight="duotone" className="text-cyan-500 dark:text-cyan-400" />,
          bg: "bg-cyan-500/15 dark:bg-cyan-500/25 ring-2 ring-cyan-500/40 text-cyan-600 dark:text-cyan-300",
          borderTop: "border-t-cyan-500",
          badgeColor: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
          buttonColor: "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-cyan-500/25",
        };
      case "multimedia":
        return {
          icon: <VideoCamera size={32} weight="duotone" className="text-blue-500 dark:text-cyan-400" />,
          bg: "bg-blue-500/15 dark:bg-blue-500/25 ring-2 ring-blue-500/40 text-blue-600 dark:text-cyan-300",
          borderTop: "border-t-blue-500",
          badgeColor: "bg-blue-500/15 text-blue-700 dark:text-cyan-300 border-blue-500/30",
          buttonColor: "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-blue-500/25",
        };
      case "gambling":
        return {
          icon: <ShieldWarning size={32} weight="duotone" className="text-red-500 dark:text-red-400" />,
          bg: "bg-red-500/15 dark:bg-red-500/25 ring-2 ring-red-500/40 text-red-600 dark:text-red-300",
          borderTop: "border-t-red-500",
          badgeColor: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
          buttonColor: "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-500/25",
        };
      default:
        return {
          icon: <WarningCircle size={32} weight="duotone" className="text-slate-500 dark:text-slate-400" />,
          bg: "bg-slate-500/15 dark:bg-slate-500/25 ring-2 ring-slate-500/40 text-slate-600 dark:text-slate-300",
          borderTop: "border-t-slate-500",
          badgeColor: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
          buttonColor: "bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black shadow-slate-500/25",
        };
    }
  };

  const visual = getVisualDetails();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
            onClick={onAcknowledge}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`relative w-full max-w-lg rounded-3xl solid-card border-t-4 ${visual.borderTop} p-6 sm:p-8 shadow-2xl z-10 bg-white dark:bg-[#0a1220]`}
          >
            {/* Close X button */}
            <button
              type="button"
              onClick={onAcknowledge}
              className="group absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 transition-all cursor-pointer"
              title="ปิดและกลับสู่หน้าหลัก"
              aria-label="ปิดและกลับสู่หน้าหลัก"
            >
              <X size={18} weight="bold" className="transition-transform duration-200 group-hover:rotate-90" />
            </button>

            {/* Header section without sub-header badge */}
            <div className="flex items-center gap-4 mb-4 pr-8">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${visual.bg}`}>
                {visual.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                  {alert.title}
                </h3>
              </div>
            </div>

            {/* Reason Box */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-start gap-2.5">
                <WarningCircle size={18} weight="duotone" className="text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                    สาเหตุที่ตรวจพบ:
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {alert.reason}
                  </p>
                </div>
              </div>
            </div>

            {/* Suggestion Box */}
            <div className="mt-3.5 p-4 rounded-2xl bg-blue-500/10 dark:bg-cyan-500/10 border border-blue-500/20 dark:border-cyan-500/20">
              <div className="flex items-start gap-2.5">
                <Lightbulb size={18} weight="fill" className="text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-blue-700 dark:text-cyan-300 mb-0.5">
                    คำแนะนำในการดำเนินการ:
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    {alert.suggestion}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button: Acknowledge and return to home immediately */}
            <div className="mt-6">
              <button
                type="button"
                onClick={onAcknowledge}
                className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl text-white font-bold text-sm sm:text-base transition-all duration-200 cursor-pointer shadow-lg active:scale-98 ${visual.buttonColor}`}
              >
                <ArrowCounterClockwise size={18} weight="bold" />
                <span>รับทราบ และกลับสู่หน้าหลัก</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
