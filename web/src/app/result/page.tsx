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
  Clock,
  CalendarDots,
  HourglassSimple,
} from "@phosphor-icons/react";
import { HistoryItem, FactCheckResult } from "@/types";
import { useFactCheck } from "@/hooks/useFactCheck";
import { cleanFactText, extractPublishDateOrRelativeTime } from "@/lib/utils";
import { SystemAlertModal } from "@/components/SystemAlertModal";
import { SecretTeamModal } from "@/components/SecretTeamModal";
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
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
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
      
      <SecretTeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
      />

      {!loading && (
        <Navbar
          onOpenHistory={() => setIsHistoryOpen(true)}
          historyCount={history.length}
          onOpenTeamModal={() => setIsTeamModalOpen(true)}
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

              <div className="rounded-3xl solid-card p-5 sm:p-7 mb-6 border-t-4 border-t-blue-500 dark:border-t-cyan-500 relative transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl dark:shadow-[0_0_30px_rgba(59,130,246,0.12)] dark:hover:shadow-[0_0_35px_rgba(59,130,246,0.22)] bg-gradient-to-br from-blue-500/5 via-sky-500/5 to-transparent dark:from-[#0d2238] dark:via-[#0c1a2e] dark:to-[#081220] overflow-hidden">
                {/* Top Blue Light Beam */}
                <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-blue-400 dark:via-cyan-400 to-transparent shadow-[0_0_12px_rgba(59,130,246,0.8)]" />

                {(() => {
                  const { urls: inputUrls, text: inputText } = parseInputContent(
                    result.input?.content || "",
                    result.input?.original_url
                  );

                  const rawPublishDate =
                    result.input?.publish_date ||
                    result.verdict?.publish_date ||
                    (result.verdict as unknown as Record<string, unknown>)?.publish_date_context?.toString() ||
                    "";

                  const resolvedPublishDate =
                    (rawPublishDate && rawPublishDate !== "ไม่ระบุ" && rawPublishDate !== "ไม่ระบุในข้อความ")
                      ? rawPublishDate
                      : (extractPublishDateOrRelativeTime(result.input?.content || "") ||
                         extractPublishDateOrRelativeTime(inputText) ||
                         "");

                  const timelineText =
                    result.input?.timeline ||
                    result.verdict?.timeline ||
                    (result.verdict as unknown as Record<string, unknown>)?.content_timeline?.toString() ||
                    "";

                  return (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400/40 shrink-0">
                            <Quotes size={22} weight="fill" />
                          </div>
                          <div>
                            <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                              ข้อมูลที่ส่งตรวจสอบ
                            </h4>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Disinformation Category Badge */}
                          {result.verdict?.disinformation_category_label && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 text-xs sm:text-sm font-bold text-indigo-800 dark:text-indigo-300 shrink-0 shadow-xs">
                              <span>📌</span>
                              <span>หมวดหมู่: {result.verdict.disinformation_category_label}</span>
                            </div>
                          )}

                          {/* News / Post Publish Time Badge */}
                          {resolvedPublishDate && (
                            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/30 text-xs sm:text-sm font-bold text-cyan-800 dark:text-cyan-300 shrink-0 shadow-xs">
                              <Clock size={16} weight="bold" className="text-cyan-600 dark:text-cyan-400" />
                              <span>เวลาที่ลงข่าว: {resolvedPublishDate}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Security Warning Banner (if suspicious domain / phishing detected) */}
                      {result.verdict?.security_warning?.is_suspicious && (
                        <div className="mb-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-transparent dark:from-[#2d141e] dark:via-[#220f17] dark:to-[#160a0f] border border-rose-300/80 dark:border-rose-800/80 text-rose-900 dark:text-rose-200 shadow-xs dark:shadow-[0_0_25px_rgba(244,63,94,0.2)] relative overflow-hidden">
                          {/* Top Rose Light Beam */}
                          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-400 to-transparent shadow-[0_0_10px_rgba(244,63,94,0.8)]" />

                          <div className="flex items-center gap-2.5 font-bold text-sm sm:text-base text-rose-700 dark:text-rose-300 mb-1.5">
                            <span className="text-xl">⚠️</span>
                            <span>การแจ้งเตือนความปลอดภัยของลิงก์ (Security Warning)</span>
                            <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                              ระดับความเสี่ยง: {result.verdict.security_warning.risk_level}
                            </span>
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-rose-800 dark:text-rose-300/90 pl-1">
                            {result.verdict.security_warning.reasons.map((reason, rIdx) => (
                              <li key={rIdx}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}

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
                    </>
                  );
                })()}
              </div>

              {/* Multi-Claim Breakdown (if multiple sub-claims detected) */}
              {result.verdict?.sub_claims && result.verdict.sub_claims.length > 1 && (
                <div className="rounded-3xl solid-card p-5 sm:p-7 mb-6 border-t-4 border-t-indigo-500 dark:border-t-indigo-400 relative transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl dark:shadow-[0_0_30px_rgba(99,102,241,0.14)] dark:hover:shadow-[0_0_35px_rgba(99,102,241,0.25)] bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent dark:from-[#141635] dark:via-[#101229] dark:to-[#090b17] overflow-hidden">
                  {/* Top Indigo Light Beam */}
                  <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-indigo-400 dark:via-indigo-300 to-transparent shadow-[0_0_12px_rgba(99,102,241,0.8)]" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-indigo-200/40 dark:border-indigo-800/40">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30 ring-2 ring-indigo-400/40 shrink-0">
                        <span className="text-xl">🧩</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                            การจำแนกผลรายประเด็น (Multi-Claim Breakdown)
                          </h4>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                            {result.verdict.sub_claims.length} ประเด็น
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          ตรวจพบหลายข้ออ้างในข้อความเดียวกัน ระบบแยกประเมินความถูกต้องเป็นรายข้อเพื่อความโปร่งใส
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {result.verdict.sub_claims.map((sub, sIdx) => {
                      const tier = sub.score || sub.verdict_tier || 3;

                      // Theme config for each verdict tier (Colors, Glows, and Icons)
                      const tierConfig = {
                        5: {
                          bg: "from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 dark:via-[#112724] dark:to-[#0f1f22]",
                          border: "border-emerald-300/90 dark:border-emerald-600/70 hover:border-emerald-400 dark:hover:border-emerald-400",
                          glow: "dark:shadow-[0_0_20px_rgba(16,185,129,0.18)] hover:shadow-emerald-500/15",
                          badge: "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 border-emerald-400/50",
                          disc: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white ring-2 ring-emerald-400/40 shadow-emerald-500/25",
                          pill: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
                          dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]",
                          pct: 100,
                          icon: "✅"
                        },
                        4: {
                          bg: "from-teal-500/10 via-teal-500/5 to-transparent dark:from-teal-950/40 dark:via-[#12282c] dark:to-[#0f1d24]",
                          border: "border-teal-300/90 dark:border-teal-600/70 hover:border-teal-400 dark:hover:border-teal-400",
                          glow: "dark:shadow-[0_0_20px_rgba(20,184,166,0.18)] hover:shadow-teal-500/15",
                          badge: "bg-teal-500 text-white shadow-md shadow-teal-500/30 border-teal-400/50",
                          disc: "bg-gradient-to-br from-teal-500 to-cyan-600 text-white ring-2 ring-teal-400/40 shadow-teal-500/25",
                          pill: "bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30",
                          dot: "bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.8)]",
                          pct: 75,
                          icon: "✔️"
                        },
                        3: {
                          bg: "from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-[#26241a] dark:to-[#1a1c24]",
                          border: "border-amber-300/90 dark:border-amber-600/70 hover:border-amber-400 dark:hover:border-amber-400",
                          glow: "dark:shadow-[0_0_20px_rgba(245,158,11,0.18)] hover:shadow-amber-500/15",
                          badge: "bg-amber-500 text-white shadow-md shadow-amber-500/30 border-amber-400/50",
                          disc: "bg-gradient-to-br from-amber-500 to-yellow-600 text-white ring-2 ring-amber-400/40 shadow-amber-500/25",
                          pill: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
                          dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]",
                          pct: 50,
                          icon: "⚖️"
                        },
                        2: {
                          bg: "from-orange-500/10 via-orange-500/5 to-transparent dark:from-orange-950/40 dark:via-[#2b1f1a] dark:to-[#1a1724]",
                          border: "border-orange-300/90 dark:border-orange-600/70 hover:border-orange-400 dark:hover:border-orange-400",
                          glow: "dark:shadow-[0_0_20px_rgba(249,115,22,0.18)] hover:shadow-orange-500/15",
                          badge: "bg-orange-500 text-white shadow-md shadow-orange-500/30 border-orange-400/50",
                          disc: "bg-gradient-to-br from-orange-500 to-red-600 text-white ring-2 ring-orange-400/40 shadow-orange-500/25",
                          pill: "bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/30",
                          dot: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]",
                          pct: 25,
                          icon: "⚠️"
                        },
                        1: {
                          bg: "from-rose-500/12 via-rose-500/6 to-transparent dark:from-rose-950/50 dark:via-[#2d1720] dark:to-[#191426]",
                          border: "border-rose-300/90 dark:border-rose-600/80 hover:border-rose-400 dark:hover:border-rose-400",
                          glow: "dark:shadow-[0_0_24px_rgba(244,63,94,0.22)] hover:shadow-rose-500/20",
                          badge: "bg-rose-600 text-white shadow-md shadow-rose-600/35 border-rose-400/50",
                          disc: "bg-gradient-to-br from-rose-600 to-red-700 text-white ring-2 ring-rose-400/50 shadow-rose-600/30",
                          pill: "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30",
                          dot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse",
                          pct: 0,
                          icon: "🚫"
                        }
                      }[tier as 1|2|3|4|5] || {
                        bg: "from-slate-500/10 to-transparent",
                        border: "border-slate-300 dark:border-slate-700",
                        glow: "",
                        badge: "bg-slate-600 text-white",
                        disc: "bg-slate-600 text-white",
                        pill: "bg-slate-500/15 text-slate-700",
                        dot: "bg-slate-400",
                        pct: 50,
                        icon: "📌"
                      };

                      return (
                        <div
                          key={sIdx}
                          className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${tierConfig.bg} border ${tierConfig.border} ${tierConfig.glow} transition-all duration-200 flex flex-col gap-3 shadow-xs relative overflow-hidden`}
                        >
                          {/* Accent Top Edge Glow */}
                          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent" />

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Clean Step Pill Badge (No duplicate icon number) */}
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-3.5 py-1.5 rounded-xl border text-xs sm:text-sm font-bold shadow-2xs ${tierConfig.pill}`}>
                                <span>ประเด็นที่ {sIdx + 1}</span>
                              </span>
                            </div>

                            {/* Clean Verdict Pill Badge (No emoji checkmarks) */}
                            <div className="shrink-0 flex items-center">
                              <span className={`inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold ${tierConfig.badge} transition-transform active:scale-95`}>
                                <span>{sub.verdict_label}</span>
                              </span>
                            </div>
                          </div>

                          {/* Claim Content & Detail */}
                          <div className="pt-1">
                            <h5 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                              &ldquo;{sub.claim_text}&rdquo;
                            </h5>
                            {sub.detail && (
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-1.5">
                                {sub.detail}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
