"use client";

import React, { useState } from "react";
import {
  MagnifyingGlass,
  ArrowSquareOut,
  CaretDown,
  CalendarBlank,
  Buildings,
} from "@phosphor-icons/react";
import { ReferenceItem } from "@/types";

interface ReferenceListProps {
  references: ReferenceItem[];
}

function refUrl(ref: ReferenceItem): string {
  return ref.url || ref.href || ref.link || "";
}

function refTitle(ref: ReferenceItem): string {
  return ref.title || refUrl(ref);
}

function extractDomain(url: string, source?: string): string {
  if (source && source.includes(".") && !["serper", "exa", "exa_broad", "google", "search"].includes(source.toLowerCase())) {
    return source.replace(/^www\./, "").toLowerCase();
  }
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "").toLowerCase();
  }
}

export function ReferenceList({ references = [] }: ReferenceListProps) {
  const [collapsed, setCollapsed] = useState(false);
  const refList = references || [];
  const hasRefs = refList.length > 0;

  return (
    <div
      className={`rounded-3xl solid-card border-t-4 border-t-blue-500 dark:border-t-cyan-500 relative transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl dark:shadow-[0_0_30px_rgba(59,130,246,0.12)] dark:hover:shadow-[0_0_35px_rgba(59,130,246,0.22)] bg-gradient-to-br from-blue-500/5 via-sky-500/5 to-transparent dark:from-[#0d2238] dark:via-[#0c1a2e] dark:to-[#081220] overflow-hidden mb-6 ${
        hasRefs ? "p-6 sm:p-7" : "p-4 sm:p-5"
      }`}
    >
      {/* Top Blue Light Beam */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-blue-400 dark:via-cyan-400 to-transparent shadow-[0_0_12px_rgba(59,130,246,0.8)]" />

      <div className={`flex items-center justify-between gap-3 ${hasRefs ? "pb-3 border-b border-blue-200/40 dark:border-blue-800/40" : ""}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400/40 shrink-0">
            <MagnifyingGlass size={22} weight="bold" />
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              แหล่งข้อมูลอ้างอิงและข่าวที่เกี่ยวข้อง
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              สืบค้นและเทียบเคียงจากฐานข้อมูลข่าวสารและสื่อมวลชนที่เชื่อถือได้
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/15 text-blue-700 dark:text-cyan-300 border border-blue-500/30">
            {refList.length} แหล่ง
          </span>

          {hasRefs && (
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer px-2.5 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1a2d48] transition-colors"
            >
              <span>{collapsed ? "ขยาย" : "ย่อ"}</span>
              <CaretDown size={14} weight="bold" className={`transition-transform ${collapsed ? "-rotate-90" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {hasRefs && !collapsed && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
          {refList.map((ref, idx) => {
            const url = refUrl(ref);
            const domain = extractDomain(url, ref.source);
            const hasValidDate = ref.pub_date && ref.pub_date !== "ไม่ระบุ";

            return (
              <div
                key={(url || ref.title) + idx}
                className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white/95 via-blue-50/60 to-indigo-50/40 dark:from-[#152e4d] dark:via-[#132845] dark:to-[#0f2038] border border-blue-200/90 dark:border-blue-500/40 hover:border-blue-400 dark:hover:border-cyan-400 shadow-xs dark:shadow-[0_4px_20px_rgba(59,130,246,0.12)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden flex flex-col justify-between gap-3"
              >
                {/* Inner Top Micro Light Beam */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-400/70 dark:via-cyan-300/50 to-transparent" />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {ref.is_official_authority && (
                        <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/80 px-2.5 py-1 rounded-lg shadow-2xs">
                          <span>🛡️</span>
                          <span>{ref.authority_name || "สื่อหลัก / หน่วยงานทางการ"}</span>
                        </span>
                      )}

                      {ref.is_suspicious && (
                        <span className="inline-flex items-center gap-1 font-bold text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/80 px-2.5 py-1 rounded-lg shadow-2xs">
                          <span>⚠️ โดเมนเสี่ยงสูง</span>
                        </span>
                      )}

                      {domain && (
                        <span className="inline-flex items-center gap-1.5 font-mono font-bold text-xs text-blue-800 dark:text-cyan-200 bg-white/90 dark:bg-[#1c3a66] border border-blue-200/80 dark:border-cyan-500/40 px-2.5 py-1 rounded-lg shadow-2xs truncate max-w-[170px]">
                          <Buildings size={13} weight="duotone" className="text-blue-600 dark:text-cyan-400 shrink-0" />
                          <span className="truncate">{domain}</span>
                        </span>
                      )}
                      
                      {hasValidDate && (
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-mono text-[11px] bg-white/60 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                          <CalendarBlank size={12} weight="regular" />
                          <span>{ref.pub_date}</span>
                        </span>
                      )}
                    </div>

                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-xs font-bold text-white transition-all shadow-xs shadow-blue-500/25 active:scale-95 shrink-0"
                      >
                        <span>เปิดอ่าน</span>
                        <ArrowSquareOut size={13} weight="bold" />
                      </a>
                    )}
                  </div>

                  <h5 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug pt-0.5">
                    {refTitle(ref)}
                  </h5>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
