"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  X,
  Copy,
  Check,
  DownloadSimple,
  ShieldCheckered,
  Sparkle,
} from "@phosphor-icons/react";
import { toPng } from "html-to-image";
import { FactCheckResult } from "@/types";
import { cleanForCaption, getScoreMetadata } from "@/lib/utils";

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: FactCheckResult;
}

export function ShareCardModal({ isOpen, onClose, result }: ShareCardModalProps) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const meta = getScoreMetadata(result.verdict.score);

  const handleCopy = async () => {
    try {
      const text = `[ผลตรวจสอบข้อเท็จจริง AI]\nประเด็น: "${result.input?.content || ''}"\nคะแนน: ${result.verdict.score}/5 (${meta.label})\nสรุป: ${cleanForCaption(result.verdict.summary)}\nอ้างอิง: ${result.references?.length || 0} แหล่ง`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn("Copy failed", e);
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsDownloading(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `factcheck-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.warn("Download image failed", e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => {
        setCopied(false);
        onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl glass-panel p-5 sm:p-6 shadow-2xl border border-slate-200/80 dark:border-slate-700/80"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <Sparkle size={16} weight="fill" className="text-cyan-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              แชร์การ์ดผลการตรวจสอบ
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Card for Image Export */}
        <div
          ref={cardRef}
          className="mt-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-[#0b1120] dark:to-[#0f172a] text-slate-900 dark:text-white shadow-sm"
        >
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200/80 dark:border-slate-800/80 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-cyan-400">
              <ShieldCheckered size={18} weight="duotone" />
              <span>AI Fact-Checker</span>
            </div>
            <span className="text-[10px] text-slate-400">Stateless RAG</span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold">{result.verdict.score}/5</span>
            <span className="text-xs font-bold text-blue-600 dark:text-cyan-400">{meta.label}</span>
          </div>

          <p className="text-[11px] text-slate-500 mb-1">ประเด็นที่ตรวจสอบ:</p>
          <h4 className="text-sm font-semibold mb-2.5 line-clamp-2 leading-snug">
            “{result.input?.content || ''}”
          </h4>

          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
            {cleanForCaption(result.verdict.summary)}
          </p>

          <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span>แหล่งอ้างอิง {result.references?.length || 0} แหล่ง</span>
            <span>ตรวจสอบเมื่อ {new Date().toLocaleDateString('th-TH')}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <DownloadSimple size={16} weight="bold" />
            <span>{isDownloading ? "กำลังบันทึกรูป..." : "บันทึกรูปภาพ"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={16} weight="bold" className="text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">คัดลอกแล้ว</span>
              </>
            ) : (
              <>
                <Copy size={16} weight="bold" />
                <span>คัดลอก</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
