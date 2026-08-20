"use client";

import React, { useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ClockCounterClockwise, TrashSimple, WarningOctagon } from "@phosphor-icons/react";
import { HistoryItem } from "@/types";
import { getScoreColor } from "@/lib/utils";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear?: () => void;
}

const emptySubscribe = () => () => {};

export function HistoryDrawer({
  isOpen,
  onClose,
  items,
  onSelect,
  onClear,
}: HistoryDrawerProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isOpen || !mounted) return null;

  const handleConfirmClear = () => {
    onClear?.();
    setShowClearConfirm(false);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex h-full w-full max-w-sm flex-col border-l border-slate-200 dark:border-[#2b446b] bg-white dark:bg-[#152238] p-5 shadow-2xl"
        >
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-[#2b446b]">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/15 dark:bg-blue-500/25 text-blue-600 dark:text-cyan-400 ring-1 ring-blue-500/40">
                <ClockCounterClockwise size={18} weight="bold" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                ประวัติการตรวจสอบ ({items.length})
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && onClear && (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 p-1 px-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 transition-all cursor-pointer shadow-xs mr-1"
                  title="ล้างประวัติการตรวจสอบทั้งหมด"
                >
                  <TrashSimple size={13} weight="bold" />
                  <span>ล้าง</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="group flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/15 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.35)] hover:bg-rose-600 hover:text-white hover:border-rose-500 hover:shadow-[0_0_18px_rgba(244,63,94,0.7)] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                title="ปิด"
                aria-label="ปิด"
              >
                <X size={16} weight="bold" className="transition-transform duration-200 group-hover:rotate-90" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
            {items.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ClockCounterClockwise size={32} weight="duotone" className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">ยังไม่มีประวัติการตรวจสอบ</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  ประวัติจะถูกจัดเก็บในเครื่องของคุณโดยอัตโนมัติ (Local Storage)
                </p>
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="w-full rounded-2xl border border-slate-200 dark:border-[#2b446b] bg-slate-50/80 dark:bg-[#13253d] p-3.5 text-left hover:border-blue-400 dark:hover:border-cyan-400 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getScoreColor(item.score)}`}>
                      ความน่าเชื่อถือ {item.score === 5 ? "100%" : item.score === 4 ? "75%" : item.score === 3 ? "50%" : item.score === 2 ? "25%" : "0%"}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 font-mono">{item.timestamp}</span>
                  </div>
                  <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                    {item.input_text}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
              onClick={() => setShowClearConfirm(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-md rounded-3xl solid-card border-t-4 border-t-rose-500 p-6 sm:p-7 shadow-2xl z-10 text-center"
            >
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="absolute top-5 right-5 group flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/15 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.35)] hover:bg-rose-600 hover:text-white hover:border-rose-500 hover:shadow-[0_0_18px_rgba(244,63,94,0.7)] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                title="ปิดหน้าต่าง"
                aria-label="ปิดหน้าต่าง"
              >
                <X size={16} weight="bold" className="transition-transform duration-200 group-hover:rotate-90" />
              </button>

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 via-pink-500/20 to-orange-500/20 ring-2 ring-rose-500/40 shadow-lg shadow-rose-500/20 mb-4 mx-auto text-rose-500 dark:text-rose-400">
                <WarningOctagon size={32} weight="duotone" />
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
                ยืนยันการล้างประวัติการตรวจสอบ?
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                ประวัติการตรวจสอบทั้งหมด{" "}
                <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                  ({items.length} รายการ)
                </span>{" "}
                จะถูกลบออกจากเครื่องของคุณอย่างถาวร และไม่สามารถกู้คืนได้
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClear}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                >
                  ยืนยันลบทั้งหมด
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

