"use client";

import React from "react";
import {
  CheckCircle,
  XCircle,
  Scales,
} from "@phosphor-icons/react";
import { VerdictData } from "@/types";
import { cleanFactText } from "@/lib/utils";
import { ExpandableList, ExpandableText } from "@/components/ExpandableText";

interface EvidenceCardsProps {
  verdict: VerdictData;
}

function isRealEvidencePoint(text: string): boolean {
  if (!text) return false;
  const t = text.trim();
  if (t.length < 4) return false;

  const lower = t.toLowerCase();

  const negativePrefixes = [
    "ไม่พบ",
    "ไม่มี",
    "ไม่ปรากฏ",
    "ตรวจไม่พบ",
    "ยังไม่พบ",
    "ยังไม่มี",
    "ไม่สามารถ",
    "none",
    "n/a",
    "null",
    "nil",
    "-",
    "no conflicting",
    "no evidence",
    "not found",
  ];

  for (const prefix of negativePrefixes) {
    if (lower.startsWith(prefix) || lower === prefix) {
      return false;
    }
  }

  const negativePatterns = [
    "ไม่พบจุดขัดแย้ง",
    "ไม่พบข้อหักล้าง",
    "ไม่มีจุดขัดแย้ง",
    "ไม่มีข้อหักล้าง",
    "ไม่พบข้อมูลขัดแย้ง",
    "ไม่พบข้อมูลที่ขัดแย้ง",
    "ไม่มีข้อมูลขัดแย้ง",
    "ไม่มีข้อมูลที่ขัดแย้ง",
    "ไม่พบประเด็นขัดแย้ง",
    "ไม่มีประเด็นขัดแย้ง",
    "ไม่พบข้อขัดแย้ง",
    "ไม่มีข้อขัดแย้ง",
    "ไม่พบหลักฐานขัดแย้ง",
    "ไม่พบหลักฐานที่ขัดแย้ง",
    "ไม่พบเนื้อหาที่ขัดแย้ง",
    "ไม่มีเนื้อหาที่ขัดแย้ง",
    "ไม่พบข้อเท็จจริงที่สอดคล้อง",
    "ไม่พบข้อมูลที่สอดคล้อง",
    "ไม่มีข้อมูลที่ยืนยัน",
    "ไม่มีหลักฐานยืนยัน",
    "ไม่พบหลักฐานยืนยัน",
  ];

  for (const pattern of negativePatterns) {
    if (lower.includes(pattern)) {
      return false;
    }
  }

  return true;
}

export function EvidencePointsCard({ verdict }: EvidenceCardsProps) {
  const rawSupported = (verdict.supported_points || []).map(cleanFactText).filter(Boolean);
  const rawConflicting = (verdict.conflicting_points || []).map(cleanFactText).filter(Boolean);

  const supported = rawSupported.filter(isRealEvidencePoint);
  const conflicting = rawConflicting.filter(isRealEvidencePoint);

  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start">
      <div
        className={`rounded-3xl solid-card border-t-4 border-t-emerald-500 relative flex flex-col transition-all duration-300 ease-out hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl dark:shadow-[0_0_25px_rgba(16,185,129,0.12)] dark:hover:shadow-[0_0_30px_rgba(16,185,129,0.25)] bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent dark:from-[#0f2824] dark:via-[#0c1f1e] dark:to-[#081518] overflow-hidden ${
          supported.length > 0 ? "p-5 sm:p-6" : "p-4 sm:p-4.5"
        }`}
      >
        {/* Top Emerald Light Beam */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 dark:via-emerald-300 to-transparent shadow-[0_0_10px_rgba(16,185,129,0.8)]" />

        <div className={`flex items-center justify-between gap-3 ${supported.length > 0 ? "mb-4" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/40">
              <CheckCircle size={20} weight="fill" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              ข้อเท็จจริงที่ได้รับการยืนยัน
            </h4>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            {supported.length} ประเด็น
          </span>
        </div>

        {supported.length > 0 && (
          <ExpandableList
            items={supported}
            initialCount={3}
            expandLabel={(n) => `ดูเพิ่มเติม (+${n} ประเด็น)`}
            collapseLabel="ย่อรายการ"
            listClassName="space-y-3"
            renderItem={(point, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-white/95 via-emerald-50/70 to-teal-50/50 dark:from-[#153833] dark:via-[#122e2b] dark:to-[#0d2220] border border-emerald-300/90 dark:border-emerald-500/50 hover:border-emerald-500 dark:hover:border-emerald-400 text-sm text-slate-900 dark:text-emerald-50 leading-relaxed font-medium transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 shadow-xs dark:shadow-[0_4px_20px_rgba(16,185,129,0.12)] relative overflow-hidden"
              >
                {/* Inner Emerald Light Beam */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400/70 dark:via-emerald-300/50 to-transparent" />
                <CheckCircle size={19} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{point}</span>
              </li>
            )}
          />
        )}
      </div>

      <div
        className={`rounded-3xl solid-card border-t-4 border-t-rose-500 relative flex flex-col transition-all duration-300 ease-out hover:-translate-y-1 hover:border-rose-400 hover:shadow-xl dark:shadow-[0_0_25px_rgba(244,63,94,0.12)] dark:hover:shadow-[0_0_30px_rgba(244,63,94,0.25)] bg-gradient-to-br from-rose-500/5 via-red-500/5 to-transparent dark:from-[#2a131c] dark:via-[#200f16] dark:to-[#140a10] overflow-hidden ${
          conflicting.length > 0 ? "p-5 sm:p-6" : "p-4 sm:p-4.5"
        }`}
      >
        {/* Top Rose Light Beam */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-400 dark:via-rose-300 to-transparent shadow-[0_0_10px_rgba(244,63,94,0.8)]" />

        <div className={`flex items-center justify-between gap-3 ${conflicting.length > 0 ? "mb-4" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/30 ring-2 ring-rose-400/40">
              <XCircle size={20} weight="fill" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              จุดขัดแย้ง / ข้อหักล้าง
            </h4>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            {conflicting.length} ประเด็น
          </span>
        </div>

        {conflicting.length > 0 && (
          <ExpandableList
            items={conflicting}
            initialCount={3}
            expandLabel={(n) => `ดูเพิ่มเติม (+${n} ประเด็น)`}
            collapseLabel="ย่อรายการ"
            listClassName="space-y-3"
            renderItem={(point, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-white/95 via-rose-50/70 to-red-50/50 dark:from-[#3a1b2a] dark:via-[#301623] dark:to-[#220e18] border border-rose-300/90 dark:border-rose-500/50 hover:border-rose-500 dark:hover:border-rose-400 text-sm text-slate-900 dark:text-rose-50 leading-relaxed font-medium transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 shadow-xs dark:shadow-[0_4px_20px_rgba(244,63,94,0.12)] relative overflow-hidden"
              >
                {/* Inner Rose Light Beam */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-rose-400/70 dark:via-rose-300/50 to-transparent" />
                <XCircle size={19} weight="fill" className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{point}</span>
              </li>
            )}
          />
        )}
      </div>
    </div>
  );
}

export function ComparativeAnalysisCard({ verdict }: EvidenceCardsProps) {
  const analysis = cleanFactText(verdict.comparative_analysis || "");
  if (!analysis) return null;

  return (
    <div className="rounded-3xl solid-card p-6 sm:p-8 mb-6 border-t-4 border-t-cyan-500 dark:border-t-cyan-400 relative transition-all duration-300 ease-out hover:-translate-y-1 hover:border-cyan-400 hover:shadow-xl dark:shadow-[0_0_30px_rgba(6,182,212,0.12)] dark:hover:shadow-[0_0_35px_rgba(6,182,212,0.25)] bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-transparent dark:from-[#0d2238] dark:via-[#0c1a2e] dark:to-[#081220] overflow-hidden">
      {/* Ambient Top Light Beam Effect */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-cyan-400 dark:via-cyan-300 to-transparent shadow-[0_0_12px_rgba(6,182,212,0.8)]" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-cyan-200/40 dark:border-cyan-800/40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30 ring-2 ring-cyan-400/40 shrink-0">
            <Scales size={22} weight="bold" />
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              บทวิเคราะห์เปรียบเทียบเชิงลึก (Comparative Analysis)
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              การประมวลผลเทียบเคียงหลักฐานและข้อเท็จจริงจากหลายแหล่งข้อมูล
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
            <span>AI Synthesized Analysis</span>
          </span>
        </div>
      </div>

      <ExpandableText
        maxLines={4}
        expandLabel="ดูบทวิเคราะห์ทั้งหมด"
        collapseLabel="ย่อบทวิเคราะห์"
      >
        <div className="text-sm sm:text-base leading-relaxed space-y-4">
          {analysis.split("\n\n").map((para, i) => (
            <div
              key={i}
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white/95 via-sky-50/50 to-cyan-50/40 dark:from-[#152e4d] dark:via-[#132845] dark:to-[#0f2038] border border-cyan-200/90 dark:border-cyan-500/40 hover:border-cyan-400 dark:hover:border-cyan-400 shadow-xs dark:shadow-[0_4px_20px_rgba(6,182,212,0.1)] hover:shadow-md transition-all duration-200 relative overflow-hidden text-slate-900 dark:text-slate-100 font-medium leading-relaxed"
            >
              {/* Inner Top Micro Light Beam */}
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/70 dark:via-cyan-300/50 to-transparent" />
              {para}
            </div>
          ))}
        </div>
      </ExpandableText>
    </div>
  );
}

export function EvidenceCards({ verdict }: EvidenceCardsProps) {
  return (
    <>
      <EvidencePointsCard verdict={verdict} />
      <ComparativeAnalysisCard verdict={verdict} />
    </>
  );
}
