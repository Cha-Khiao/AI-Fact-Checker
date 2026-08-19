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
        className={`rounded-3xl solid-card border-t-4 border-t-emerald-500 relative flex flex-col transition-all duration-300 ease-out hover:-translate-y-1 hover:border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] dark:hover:border-emerald-400 dark:hover:shadow-[0_0_25px_2px_rgba(16,185,129,0.45)] ${
          supported.length > 0 ? "p-5 sm:p-6" : "p-4 sm:p-4.5"
        }`}
      >
        <div className={`flex items-center justify-between gap-3 ${supported.length > 0 ? "mb-4" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/40">
              <CheckCircle size={22} weight="fill" />
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
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-[#132c30] border border-emerald-300/40 dark:border-emerald-600/30 text-sm text-slate-900 dark:text-emerald-50 leading-relaxed font-medium transition-colors hover:bg-emerald-50/90 dark:hover:bg-[#17383e]"
              >
                <CheckCircle size={18} weight="fill" className="text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{point}</span>
              </li>
            )}
          />
        )}
      </div>

      <div
        className={`rounded-3xl solid-card border-t-4 border-t-rose-500 relative flex flex-col transition-all duration-300 ease-out hover:-translate-y-1 hover:border-rose-500 hover:shadow-[0_0_20px_rgba(244,63,94,0.35)] dark:hover:border-rose-400 dark:hover:shadow-[0_0_25px_2px_rgba(244,63,94,0.45)] ${
          conflicting.length > 0 ? "p-5 sm:p-6" : "p-4 sm:p-4.5"
        }`}
      >
        <div className={`flex items-center justify-between gap-3 ${conflicting.length > 0 ? "mb-4" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-500/15 dark:bg-rose-500/25 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/40">
              <XCircle size={22} weight="fill" />
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
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-50/60 dark:bg-[#331824] border border-rose-300/40 dark:border-rose-600/30 text-sm text-slate-900 dark:text-rose-50 leading-relaxed font-medium transition-colors hover:bg-rose-50/90 dark:hover:bg-[#401e2e]"
              >
                <XCircle size={18} weight="fill" className="text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
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
    <div className="rounded-3xl solid-card p-6 sm:p-8 mb-6 border-t-4 border-t-cyan-500 relative transition-all duration-300 ease-out hover:-translate-y-1 hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.35)] dark:hover:border-cyan-400 dark:hover:shadow-[0_0_25px_2px_rgba(6,182,212,0.45)]">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-500/15 dark:bg-cyan-500/25 text-cyan-600 dark:text-cyan-400 ring-1 ring-cyan-500/40">
          <Scales size={22} weight="duotone" />
        </div>
        <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          บทวิเคราะห์เปรียบเทียบเชิงลึก (Comparative Analysis)
        </h4>
      </div>

      <ExpandableText
        maxLines={4}
        expandLabel="ดูบทวิเคราะห์ทั้งหมด"
        collapseLabel="ย่อบทวิเคราะห์"
      >
        <div className="text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-relaxed space-y-3.5">
          {analysis.split("\n\n").map((para, i) => (
            <p key={i} className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#13253d] border border-slate-200 dark:border-[#2b446b] font-medium leading-relaxed">
              {para}
            </p>
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
