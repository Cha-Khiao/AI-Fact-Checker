"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { VantaBirdsBackground } from "@/components/VantaBirdsBackground";
import { SearchHero } from "@/components/SearchHero";
import { LoadingStream } from "@/components/LoadingStream";
import { ScoreMeter } from "@/components/ScoreMeter";
import { EvidenceCards } from "@/components/EvidenceCards";
import { ReferenceList } from "@/components/ReferenceList";
import { SystemAuditCard } from "@/components/SystemAuditCard";
import { ShareCardModal } from "@/components/ShareCardModal";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { ShareNetwork, ArrowCounterClockwise, WarningCircle } from "@phosphor-icons/react";
import { HistoryItem } from "@/types";
import { useFactCheck } from "@/hooks/useFactCheck";

import CoreFeatures from "@/components/landing/CoreFeatures";
import HowItWorks from "@/components/landing/HowItWorks";
import BenefitsGrid from "@/components/landing/BenefitsGrid";
import FaqAccordion from "@/components/landing/FaqAccordion";
import CtaBand from "@/components/landing/CtaBand";
import Footer from "@/components/landing/Footer";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"url" | "text">("url");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState("");

  const {
    loading,
    progressPct,
    progressMessage,
    result,
    error,
    history,
    checkNews,
    reset,
  } = useFactCheck();

  const handleSearchSubmit = (query?: string, mode?: "url" | "text") => {
    const raw = query !== undefined ? query : inputQuery;
    if (mode) setActiveTab(mode);
    if (!raw.trim()) return;
    checkNews(raw);
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    const isUrl = item.input_text.startsWith("http://") || item.input_text.startsWith("https://");
    setActiveTab(isUrl ? "url" : "text");
    setInputQuery(item.input_text);
    checkNews(item.input_text);
  };

  const handleFullReset = () => {
    reset();
    setInputQuery("");
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden text-slate-900 dark:text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-600 dark:selection:text-cyan-300">
      {/* Living Vanta 3D Birds Interactive Background */}
      <VantaBirdsBackground />

      {/* Header Navigation */}
      <Navbar
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
        onReset={handleFullReset}
      />

      <main className="flex-1">
        <section id="checker" className="w-full max-w-5xl mx-auto px-4 py-8 sm:py-14">
          <AnimatePresence mode="wait">
            {!loading && !result && (
              <motion.div
                key="search-hero"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="w-full"
              >
                <SearchHero
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  input={inputQuery}
                  onInputChange={setInputQuery}
                  onSubmit={handleSearchSubmit}
                  loading={loading}
                />

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 max-w-2xl mx-auto flex items-center gap-3 rounded-2xl bg-rose-500/10 p-4 text-xs sm:text-sm text-rose-700 dark:text-rose-300 backdrop-blur-md shadow-sm"
                  >
                    <WarningCircle size={20} weight="fill" className="text-rose-500 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {loading && (
              <motion.div
                key="loading-stream"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <LoadingStream
                  show={loading}
                  progressPct={progressPct}
                  progressMessage={progressMessage}
                />
              </motion.div>
            )}

            {!loading && result && (
              <motion.div
                key="results-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col w-full"
              >
                {/* Result Header & Action Bar without harsh borders */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                      ผลการวิเคราะห์ ({activeTab === "url" ? "ลิงก์โซเชียลมีเดีย" : "ข้อความข่าว"})
                    </span>
                    <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white line-clamp-2 mt-1 tracking-tight">
                      “{result.input.content}”
                    </h2>
                  </div>

                  <div className="flex items-center gap-2.5 self-stretch sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsShareModalOpen(true)}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all cursor-pointer hover:scale-105"
                    >
                      <ShareNetwork size={16} weight="bold" />
                      <span>แชร์การ์ด</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleFullReset}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-sm"
                    >
                      <ArrowCounterClockwise size={16} weight="bold" />
                      <span>ตรวจใหม่</span>
                    </button>
                  </div>
                </div>

                {/* Score & Verdict Meter */}
                <ScoreMeter
                  score={result.verdict.score}
                  summary={result.verdict.summary}
                />

                {/* Evidence Comparison Bento */}
                <EvidenceCards verdict={result.verdict} />

                {/* News References */}
                <ReferenceList references={result.references} />

                {/* Telemetry & Audit */}
                <SystemAuditCard result={result} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Informative Landing Sections — Seamless Borderless Flow */}
        <CoreFeatures />
        <HowItWorks />
        <BenefitsGrid />
        <FaqAccordion />
        <CtaBand />
      </main>

      <Footer />

      {/* History Slide-over Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={history}
        onSelect={handleSelectHistoryItem}
      />

      {/* Shareable Card Modal */}
      {result && (
        <ShareCardModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          result={result}
        />
      )}
    </div>
  );
}
