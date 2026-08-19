"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { VantaBirdsBackground } from "@/components/VantaBirdsBackground";
import { LoadingStream } from "@/components/LoadingStream";
import { ScoreMeter } from "@/components/ScoreMeter";
import { EvidenceCards } from "@/components/EvidenceCards";
import { ReferenceList } from "@/components/ReferenceList";
import { SystemAuditCard } from "@/components/SystemAuditCard";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { ExpandableText } from "@/components/ExpandableText";
import Footer from "@/components/landing/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import {
  ArrowCounterClockwise,
  WarningCircle,
  Quotes,
  Info,
  Globe,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { HistoryItem, FactCheckResult } from "@/types";
import { useFactCheck } from "@/hooks/useFactCheck";
import { cleanFactText } from "@/lib/utils";
import { SystemAlertModal } from "@/components/SystemAlertModal";
import { resolveSystemAlert } from "@/lib/errorResolver";

const RESULT_CACHE_KEY = "factcheck_cached_result";

function parseInputContent(rawContent: string = "", explicitUrl?: string) {
  const urlRegex = /(https?:\/\/[^\s]+|(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;
  const urls: string[] = [];

  if (explicitUrl && explicitUrl.trim()) {
    urls.push(explicitUrl.trim());
  }

  const matches = rawContent.match(urlRegex) || [];
  for (const m of matches) {
    let clean = m.trim().replace(/[.,;!?)"'“”]+$/, "");
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      clean = `https://${clean}`;
    }
    if (!urls.some((u) => u.toLowerCase() === clean.toLowerCase())) {
      urls.push(clean);
    }
  }

  let text = rawContent;
  for (const m of matches) {
    text = text.replace(m, "");
  }
  if (explicitUrl) {
    text = text.replace(explicitUrl, "");
  }
  text = text.replace(/^[“"']+|[”"']+$/g, "").replace(/\s+/g, " ").trim();

  return { urls, text };
}

export default function ResultPage() {
  const router = useRouter();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const isStarted = useRef(false);

  const {
    loading,
    progressPct,
    progressMessage,
    result,
    error,
    history,
    checkNews,
    restoreResult,
    clearHistory,
  } = useFactCheck();

  useEffect(() => {
    if (isStarted.current) return;
    isStarted.current = true;

    try {
      const cachedResultJson = sessionStorage.getItem(RESULT_CACHE_KEY);
      if (cachedResultJson) {
        const cachedResult = JSON.parse(cachedResultJson) as FactCheckResult;
        if (cachedResult?.verdict) {
          restoreResult(cachedResult);
          return;
        }
      }

      const pendingQuery = sessionStorage.getItem("factcheck_pending_query");
      if (!pendingQuery || !pendingQuery.trim()) {
        router.replace("/");
        return;
      }

      checkNews(pendingQuery);
    } catch {
      router.replace("/");
    }
  }, [checkNews, restoreResult, router]);

  useEffect(() => {
    if (result) {
      try {
        sessionStorage.setItem(RESULT_CACHE_KEY, JSON.stringify(result));
      } catch {}
    }
  }, [result]);

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setIsHistoryOpen(false);
    sessionStorage.removeItem(RESULT_CACHE_KEY);
    sessionStorage.setItem("factcheck_pending_query", item.input_text);
    checkNews(item.input_text);
  };

  const handleNewCheck = () => {
    sessionStorage.removeItem("factcheck_pending_query");
    sessionStorage.removeItem(RESULT_CACHE_KEY);
    router.push("/#checker");
  };

  const handleAcknowledgeAndGoHome = () => {
    sessionStorage.removeItem("factcheck_pending_query");
    sessionStorage.removeItem(RESULT_CACHE_KEY);
    router.replace("/#checker");
  };

  const systemAlert = !loading ? resolveSystemAlert(error, result) : null;

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden text-slate-900 dark:text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-600 dark:selection:text-cyan-300">
      <VantaBirdsBackground />

      {/* Unified System Alert & Incident Modal */}
      <SystemAlertModal
        isOpen={Boolean(systemAlert)}
        alert={systemAlert}
        onAcknowledge={handleAcknowledgeAndGoHome}
      />

      {!loading && (
        <Navbar
          onOpenHistory={() => setIsHistoryOpen(true)}
          historyCount={history.length}
          onReset={handleNewCheck}
        />
      )}

      <main className="flex-1 w-full flex flex-col">
        {loading && (
          <section className="w-full max-w-5xl lg:max-w-6xl mx-auto px-4 min-h-screen flex items-center justify-center py-6">
            <motion.div
              key="loading-stream"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <LoadingStream
                show={loading}
                progressPct={progressPct}
                progressMessage={progressMessage}
              />
            </motion.div>
          </section>
        )}

        {!loading && !systemAlert && result && (
          <section className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center">
            <motion.div
              key="results-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col w-full"
            >
              <ScoreMeter
                score={result.verdict.score}
                summary={result.verdict.summary}
              />

              <div className="rounded-3xl solid-card p-5 sm:p-7 mb-6 border-t-4 border-t-slate-400 dark:border-t-slate-600 relative transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-500/15 dark:bg-blue-500/25 text-blue-600 dark:text-cyan-400 ring-1 ring-blue-500/40">
                    <Quotes size={20} weight="fill" />
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    ข้อมูลที่ส่งตรวจสอบ
                  </h4>
                </div>

                {(() => {
                  const { urls: inputUrls, text: inputText } = parseInputContent(
                    result.input?.content || "",
                    result.input?.original_url
                  );

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
                      <div className="flex flex-col justify-start items-stretch gap-3">
                        {inputUrls.map((url, idx) => (
                          <div
                            key={url + idx}
                            className="p-3.5 sm:p-4 rounded-2xl bg-blue-50/70 dark:bg-[#152e4d] border border-blue-200/80 dark:border-blue-800/80 flex items-center justify-between gap-3 text-xs sm:text-sm shadow-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Globe size={18} className="text-blue-600 dark:text-cyan-400 shrink-0" />
                              <span className="truncate font-mono font-medium text-blue-950 dark:text-cyan-200">
                                {url}
                              </span>
                            </div>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 inline-flex items-center gap-1.5 font-bold text-xs text-blue-600 dark:text-cyan-300 hover:underline bg-white dark:bg-[#1e3b63] px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-700 shadow-xs transition-transform active:scale-95"
                            >
                              <span>เปิดลิงก์</span>
                              <ArrowSquareOut size={13} weight="bold" />
                            </a>
                          </div>
                        ))}

                        {inputText && (
                          <ExpandableText
                            maxLines={4}
                            expandLabel="ดูเนื้อหาเต็ม"
                            collapseLabel="ย่อเนื้อหา"
                            className="w-full"
                          >
                            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-[#13253d] border border-slate-200 dark:border-[#2b446b] text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-relaxed font-medium">
                              &ldquo;{inputText}&rdquo;
                            </div>
                          </ExpandableText>
                        )}
                      </div>

                      <div className="flex flex-col justify-start">
                        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 dark:bg-[#26241b] border border-amber-200/80 dark:border-amber-700/50">
                          <div className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                            <Info size={15} weight="bold" />
                            <span>สรุปสาระสำคัญเบื้องต้น</span>
                          </div>
                          <ExpandableText
                            maxLines={4}
                            expandLabel="ดูสรุปทั้งหมด"
                            collapseLabel="ย่อสรุป"
                          >
                            <p className="text-sm sm:text-base text-slate-800 dark:text-amber-50 leading-relaxed font-medium">
                              {cleanFactText(result.verdict?.summary || "ไม่มีข้อมูลสรุป")}
                            </p>
                          </ExpandableText>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <EvidenceCards verdict={result.verdict} />
              <ReferenceList references={result.references} />
              <SystemAuditCard result={result} />

              <div className="flex items-center justify-center my-8 pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
                <button
                  type="button"
                  onClick={handleNewCheck}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-9 py-3.5 text-sm sm:text-base font-bold shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <ArrowCounterClockwise size={18} weight="bold" />
                  <span>ตรวจสอบข้อเท็จจริงเรื่องใหม่</span>
                </button>
              </div>
            </motion.div>
          </section>
        )}
      </main>

      {!loading && <Footer />}

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={history}
        onSelect={handleSelectHistoryItem}
        onClear={clearHistory}
      />

      <ScrollToTop hidden={loading} />
    </div>
  );
}
