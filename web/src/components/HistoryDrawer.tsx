"use client";

import React, { useSyncExternalStore } from "react";
import { X, ClockCounterClockwise, Trash } from "@phosphor-icons/react";
import { HistoryItem } from "@/types";
import { getScoreColor } from "@/lib/utils";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}

const emptySubscribe = () => () => {};

export function HistoryDrawer({ isOpen, onClose, items, onSelect }: HistoryDrawerProps) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isOpen || !mounted) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-sm flex-col border-l border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400">
              <ClockCounterClockwise size={18} weight="bold" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              ประวัติการตรวจสอบ ({items.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <ClockCounterClockwise size={32} weight="duotone" className="mx-auto mb-2 opacity-50" />
              <p className="text-xs">ยังไม่มีประวัติการตรวจสอบ</p>
              <p className="text-[10px] text-slate-500 mt-1">ประวัติจะถูกจัดเก็บในเครื่องของคุณโดยอัตโนมัติ</p>
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
                className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 p-3 text-left hover:border-cyan-500/50 dark:hover:border-cyan-500/50 transition-all cursor-pointer shadow-sm group"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getScoreColor(item.score)}`}>
                    คะแนน {item.score}/5
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                </div>
                <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {item.input_text}
                </p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
