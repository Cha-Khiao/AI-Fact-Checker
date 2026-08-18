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

export function ReferenceList({ references }: ReferenceListProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (!references || references.length === 0) return null;

  return (
    <div className="rounded-2xl glass-panel p-5 sm:p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400">
            <MagnifyingGlass size={18} weight="bold" />
          </div>
          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            แหล่งข้อมูลอ้างอิงและสำนักข่าว ({references.length} แหล่ง)
          </h4>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span>{collapsed ? "ขยาย" : "ย่อ"}</span>
          <CaretDown size={14} weight="bold" className={`transition-transform ${collapsed ? "-rotate-90" : ""}`} />
        </button>
      </div>

      {!collapsed && (
        <div className="mt-4 space-y-3">
          {references.map((ref, idx) => {
            const url = refUrl(ref);
            const domain = extractDomain(url, ref.source);
            const hasValidDate = ref.pub_date && ref.pub_date !== "ไม่ระบุ";

            return (
              <div
                key={(url || ref.title) + idx}
                className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/60 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1.5">
                      {domain && (
                        <span className="inline-flex items-center gap-1 font-mono font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          <Buildings size={12} weight="duotone" />
                          <span>{domain}</span>
                        </span>
                      )}
                      {hasValidDate && (
                        <span className="flex items-center gap-1">
                          <CalendarBlank size={12} weight="regular" />
                          <span>{ref.pub_date}</span>
                        </span>
                      )}
                    </div>

                    <h5 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                      {refTitle(ref)}
                    </h5>

                    {ref.snippet && (
                      <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {ref.snippet}
                      </p>
                    )}
                  </div>

                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline shrink-0 self-start mt-1 sm:mt-0 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                    >
                      <span>เปิดแหล่งข่าว</span>
                      <ArrowSquareOut size={13} weight="bold" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
