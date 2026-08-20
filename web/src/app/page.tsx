"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { VantaBirdsBackground } from "@/components/VantaBirdsBackground";
import { SearchHero } from "@/components/SearchHero";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { HistoryItem } from "@/types";
import { useFactCheck } from "@/hooks/useFactCheck";

import CoreFeatures from "@/components/landing/CoreFeatures";
import TrustedSources from "@/components/landing/TrustedSources";
import HowItWorks from "@/components/landing/HowItWorks";
import BenefitsGrid from "@/components/landing/BenefitsGrid";
import FaqAccordion from "@/components/landing/FaqAccordion";
import Footer from "@/components/landing/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import GuardrailModal from "@/components/GuardrailModal";
import { WelcomeModal } from "@/components/WelcomeModal";
<<<<<<< HEAD
import { SecretTeamModal } from "@/components/SecretTeamModal";
=======
>>>>>>> origin/dev
import { validateFactCheckInput, GuardrailViolation } from "@/lib/guardrail";

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"url" | "text">("url");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
<<<<<<< HEAD
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
=======
>>>>>>> origin/dev
  const [guardrailViolation, setGuardrailViolation] = useState<GuardrailViolation | null>(null);
  const [inputQuery, setInputQuery] = useState("");

  const { history, clearHistory } = useFactCheck();

  useEffect(() => {
    try {
      sessionStorage.removeItem("factcheck_cached_result");
      sessionStorage.removeItem("factcheck_pending_query");
    } catch {}
  }, []);

  const handleSearchSubmit = (query?: string, mode?: "url" | "text") => {
    const raw = query !== undefined ? query : inputQuery;
    if (mode) setActiveTab(mode);
    if (!raw.trim()) return;

    const violation = validateFactCheckInput(raw);
    if (violation) {
      setGuardrailViolation(violation);
      return;
    }

    sessionStorage.setItem("factcheck_pending_query", raw);
    router.push("/result");
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setIsHistoryOpen(false);

    const violation = validateFactCheckInput(item.input_text);
    if (violation) {
      setGuardrailViolation(violation);
      return;
    }

    sessionStorage.setItem("factcheck_pending_query", item.input_text);
    router.push("/result");
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden text-slate-900 dark:text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-600 dark:selection:text-cyan-300">
      <VantaBirdsBackground />

      <Navbar
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
<<<<<<< HEAD
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
=======
>>>>>>> origin/dev
        onReset={() => {
          setInputQuery("");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <main className="flex-1 w-full flex flex-col">
        <section
          id="checker"
          className="w-full max-w-5xl mx-auto px-4 py-8 sm:py-14"
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full"
          >
            <SearchHero
              activeTab={activeTab}
              onTabChange={setActiveTab}
              input={inputQuery}
              onInputChange={setInputQuery}
              onSubmit={handleSearchSubmit}
              loading={false}
            />
          </motion.div>
        </section>

        <HowItWorks />
        <CoreFeatures />
        <TrustedSources />
        <BenefitsGrid />
        <FaqAccordion />
      </main>

      <Footer />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={history}
        onSelect={handleSelectHistoryItem}
        onClear={clearHistory}
      />

      {guardrailViolation && (
        <GuardrailModal
          isOpen={!!guardrailViolation}
          onClose={() => setGuardrailViolation(null)}
          violation={guardrailViolation}
        />
      )}

<<<<<<< HEAD
      <SecretTeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
      />

=======
>>>>>>> origin/dev
      <WelcomeModal />
      <ScrollToTop />
    </div>
  );
}
