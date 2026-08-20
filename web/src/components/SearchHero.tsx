"use client";

import React, { useMemo, useState, useRef } from "react";
import {
  LinkSimple,
  Article,
  ClipboardText,
  TrashSimple,
  GlobeHemisphereWest,
  Sparkle,
  ArrowRight,
  WarningCircle,
  Info,
} from "@phosphor-icons/react";
import { TrendingChips } from "./TrendingChips";
import { MixedInputNoticeModal } from "./MixedInputNoticeModal";
<<<<<<< HEAD
import { OfflineDemoAlertModal } from "./OfflineDemoAlertModal";
import { SecretTeamModal } from "./SecretTeamModal";
import { useHealthCheck } from "@/hooks/useHealthCheck";
import { getDemoFactCheckResult } from "@/lib/demoData";


=======

>>>>>>> origin/dev
const MAX_URLS = 1;
const MAX_CHARS = 1500;
const OPTIMAL_CHARS_WARN = 1000;

interface SearchHeroProps {
  activeTab: "url" | "text";
  onTabChange: (tab: "url" | "text") => void;
  input: string;
  onInputChange: (val: string) => void;
  onSubmit: (query?: string, mode?: "url" | "text") => void;
  loading: boolean;
}

interface DetectionResult {
  type: "empty" | "url_only" | "text_only" | "mixed";
  urls: string[];
  platforms: { name: string; url: string; badgeStyle: string }[];
  isAtUrlLimit: boolean;
  charCount: number;
}

function extractUniqueUrls(raw: string): string[] {
  if (!raw) return [];
  
  const httpMatches = raw.match(/https?:\/\/[^\s<>"'\[\]{}()]+/gi) || [];

  const bareMatches =
    raw.match(
<<<<<<< HEAD
      /(?:^|[\s(])((?:www\.)?(?:facebook\.com|fb\.watch|fb\.me|fb\.com|x\.com|twitter\.com|t\.co|instagram\.com|instagr\.am|threads\.net|today\.line\.me|line\.me|lin\.ee|[a-zA-Z0-9-]+\.(?:co\.th|or\.th|go\.th|in\.th|ac\.th|com|org|net|news|co|me|today|info|app|tv|io|ai|cc|site|xyz|online))\b[^\s<>"'\[\]{}()]*)/gi
=======
      /(?:^|[\s(])((?:www\.)?(?:facebook\.com|fb\.watch|fb\.me|fb\.com|x\.com|twitter\.com|t\.co|instagram\.com|instagr\.am|today\.line\.me|line\.me|lin\.ee|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:co\.th|or\.th|go\.th|in\.th|ac\.th|com|org|net|news|co|me|today|info|app|tv))\/[^\s<>"'\[\]{}()]*)/gi
>>>>>>> origin/dev
    ) || [];

  const cleanedBare = bareMatches
    .map((m) => m.trim().replace(/^[\s(]+/, ""))
    .filter((m) => !m.startsWith("http://") && !m.startsWith("https://"))
    .map((m) => `https://${m}`);

  const combined = [...httpMatches, ...cleanedBare];
<<<<<<< HEAD
  const unique = Array.from(new Set(combined.map((u) => u.trim())));
  return unique;
=======
  return Array.from(new Set(combined));
>>>>>>> origin/dev
}

function getPlatformDetails(url: string): { name: string; badgeStyle: string } {
  const u = url.toLowerCase();

  if (
    u.includes("facebook.com") ||
    u.includes("fb.watch") ||
    u.includes("fb.me") ||
    u.includes("fb.com")
  ) {
    return {
      name: "Facebook",
      badgeStyle: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25",
    };
  }

  if (
    u.includes("x.com") ||
    u.includes("twitter.com") ||
    u.includes("t.co")
  ) {
    return {
      name: "X (Twitter)",
      badgeStyle: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/25",
    };
  }

  if (
    u.includes("instagram.com") ||
    u.includes("instagr.am")
  ) {
    return {
      name: "Instagram",
      badgeStyle: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/25",
    };
  }

  if (
    u.includes("today.line.me") ||
    u.includes("line.me") ||
    u.includes("lin.ee")
  ) {
    return {
      name: "LINE Today",
      badgeStyle: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    };
  }

  if (u.includes("thairath.co.th")) {
    return { name: "ไทยรัฐ", badgeStyle: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25" };
  }
  if (u.includes("thaipbs.or.th")) {
    return { name: "Thai PBS", badgeStyle: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25" };
  }
  if (u.includes("matichon.co.th")) {
    return { name: "มติชน", badgeStyle: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25" };
  }
  if (u.includes("khaosod.co.th")) {
    return { name: "ข่าวสด", badgeStyle: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25" };
  }
  if (u.includes("dailynews.co.th")) {
    return { name: "เดลินิวส์", badgeStyle: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/25" };
  }
  if (u.includes("bangkokbiznews.com")) {
    return { name: "กรุงเทพธุรกิจ", badgeStyle: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25" };
  }
  if (u.includes("thestandard.co")) {
    return { name: "The Standard", badgeStyle: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25" };
  }
  if (u.includes("pptvhd36.com")) {
    return { name: "PPTV HD 36", badgeStyle: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25" };
  }
  if (u.includes("mcot.net")) {
    return { name: "ชัวร์ก่อนแชร์ (MCOT)", badgeStyle: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25" };
  }
  if (u.includes("antifakenewscenter.com")) {
    return { name: "ศูนย์ต่อต้านข่าวปลอม", badgeStyle: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25" };
  }
  if (u.includes("cofact.org")) {
    return { name: "Cofact", badgeStyle: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25" };
  }

  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = parsed.hostname.replace(/^www\./, "");
    return {
      name: host || "เว็บไซต์ข่าว",
      badgeStyle: "bg-blue-500/10 text-blue-600 dark:text-cyan-300 border-blue-500/25",
    };
  } catch {
    return {
      name: "เว็บไซต์ข่าว",
      badgeStyle: "bg-blue-500/10 text-blue-600 dark:text-cyan-300 border-blue-500/25",
    };
  }
}

function analyzeInput(raw: string): DetectionResult {
  const text = (raw || "").trim();
  const charCount = (raw || "").length;
  if (!text) {
    return { type: "empty", urls: [], platforms: [], isAtUrlLimit: false, charCount };
  }

  const uniqueUrls = extractUniqueUrls(text);
  const platforms = uniqueUrls.map((url) => {
    const details = getPlatformDetails(url);
    return {
      name: details.name,
      url,
      badgeStyle: details.badgeStyle,
    };
  });

  const isAtUrlLimit = uniqueUrls.length >= MAX_URLS;
  const hasUrl = uniqueUrls.length > 0;

  if (hasUrl) {
    // Strip both standard URLs, bare URLs, partial domain prefixes, and punctuation
    let textWithoutUrls = text
      .replace(/https?:\/\/[^\s<>"'\[\]{}()]+/gi, "")
      .replace(/(?:www\.)?(?:facebook\.com|fb\.watch|fb\.me|fb\.com|x\.com|twitter\.com|t\.co|instagram\.com|instagr\.am|threads\.net|today\.line\.me|line\.me|lin\.ee|[a-zA-Z0-9-]+\.(?:co\.th|or\.th|go\.th|in\.th|ac\.th|com|org|net|news|co|me|today|info|app|tv|io|ai|cc|site|xyz|online))\b[^\s<>"'\[\]{}()]*/gi, "")
      .replace(/^https?:?\/?\/?/i, "")
      .replace(/^[“"'\s.,:;!?()\[\]{}]+|[”"'\s.,:;!?()\[\]{}]+$/g, "")
      .trim();

    // Only treat as mixed if there is genuine substantial body text (>= 15 characters of real commentary)
    if (textWithoutUrls.length >= 15) {
      return { type: "mixed", urls: uniqueUrls, platforms, isAtUrlLimit, charCount };
    }
    return { type: "url_only", urls: uniqueUrls, platforms, isAtUrlLimit, charCount };
  }

  // Also check if text is a single bare domain like "facebook.com/..." without scheme
  if (/^(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?$/i.test(text)) {
    const normalized = text.startsWith("http") ? text : `https://${text}`;
    const details = getPlatformDetails(normalized);
    return {
      type: "url_only",
      urls: [normalized],
      platforms: [{ name: details.name, url: normalized, badgeStyle: details.badgeStyle }],
      isAtUrlLimit: false,
      charCount,
    };
  }

  return { type: "text_only", urls: [], platforms: [], isAtUrlLimit: false, charCount };
}

function sanitizeInput(newText: string): { sanitized: string; blockedUrlCount: number } {
  let truncated = newText.slice(0, MAX_CHARS);
  const allUrls = extractUniqueUrls(truncated);

  if (allUrls.length <= MAX_URLS) {
    return { sanitized: truncated, blockedUrlCount: 0 };
  }

  const allowedUrls = allUrls.slice(0, MAX_URLS);
  const blockedUrls = allUrls.slice(MAX_URLS);

  for (const bUrl of blockedUrls) {
    truncated = truncated.replace(bUrl, "").trim();
  }

  return { sanitized: truncated, blockedUrlCount: blockedUrls.length };
}

export function SearchHero({
  activeTab,
  onTabChange,
  input,
  onInputChange,
  onSubmit,
  loading,
}: SearchHeroProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [alertNotice, setAlertNotice] = useState<string | null>(null);
  const [isMixedModalOpen, setIsMixedModalOpen] = useState(false);
  const [hasShownMixedNotice, setHasShownMixedNotice] = useState(false);
<<<<<<< HEAD
  const [isOfflineDemoAlertOpen, setIsOfflineDemoAlertOpen] = useState(false);
  const [isTrendingModalOpen, setIsTrendingModalOpen] = useState(false);
  const [isSecretTeamModalOpen, setIsSecretTeamModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isOnline, isDemoOffline } = useHealthCheck();
=======
  const textareaRef = useRef<HTMLTextAreaElement>(null);
>>>>>>> origin/dev

  const inputMeta = useMemo(() => analyzeInput(input), [input]);

  const showAlert = (msg: string) => {
    setAlertNotice(msg);
    setTimeout(() => setAlertNotice(null), 3500);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawVal = e.target.value;
    const currentUrls = extractUniqueUrls(input);
    const incomingUrls = extractUniqueUrls(rawVal);

    if (currentUrls.length >= MAX_URLS && incomingUrls.length > MAX_URLS) {
      const { sanitized } = sanitizeInput(rawVal);
      onInputChange(sanitized);
      showAlert("จำกัด 1 ลิงก์ต่อการตรวจ เพื่อประสิทธิภาพและความแม่นยำสูงสุด");
      return;
    }

    if (rawVal.length > MAX_CHARS) {
      onInputChange(rawVal.slice(0, MAX_CHARS));
      showAlert(`จำกัดความยาวสูงสุด ${MAX_CHARS} ตัวอักษร`);
      return;
    }

    onInputChange(rawVal);

    // Intercept repeatedly on every character typed ONLY when in offline demo mode
    if (isDemoOffline && rawVal.trim().length > 0) {
      const isPreset = getDemoFactCheckResult(rawVal);
      if (!isPreset) {
        setIsOfflineDemoAlertOpen(true);
      }
    }

    const meta = analyzeInput(rawVal);
<<<<<<< HEAD
    if (meta.type === "mixed" && activeTab !== "url") {
      onTabChange("url");
=======
    if (meta.type === "mixed") {
      if (activeTab !== "url") onTabChange("url");
      setIsMixedModalOpen(true);
>>>>>>> origin/dev
    } else if (meta.type === "url_only" && activeTab !== "url") {
      onTabChange("url");
    } else if (meta.type === "text_only" && activeTab !== "text") {
      onTabChange("text");
    }
  };

  const handleNativeTextareaPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    try {
      const pastedText = e.clipboardData.getData("text");
      if (!pastedText) return;

      const combinedText = input ? `${input}\n${pastedText.trim()}` : pastedText.trim();
      const { sanitized, blockedUrlCount } = sanitizeInput(combinedText);
      const meta = analyzeInput(sanitized);

<<<<<<< HEAD
      // Intercept on paste ONLY when in offline demo mode
      if (isDemoOffline && sanitized.trim().length > 0) {
        const isPreset = getDemoFactCheckResult(sanitized);
        if (!isPreset) {
          setIsOfflineDemoAlertOpen(true);
        }
      }

=======
>>>>>>> origin/dev
      if (meta.type === "mixed") {
        onTabChange("url");
        setIsMixedModalOpen(true);
      } else if (meta.type === "url_only") {
        onTabChange("url");
      } else if (meta.type === "text_only") {
        onTabChange("text");
      }

      if (blockedUrlCount > 0) {
        showAlert("นำเข้าเฉพาะ 1 ลิงก์แรก เพื่อประสิทธิภาพความแม่นยำสูงสุด");
      }
    } catch {
      // default paste fallback
    }
  };

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (!clipText) return;

      const combinedText = input ? `${input}\n${clipText.trim()}` : clipText.trim();
      const { sanitized, blockedUrlCount } = sanitizeInput(combinedText);

      onInputChange(sanitized);

      // Intercept on paste ONLY when in offline demo mode
      if (isDemoOffline && sanitized.trim().length > 0) {
        const isPreset = getDemoFactCheckResult(sanitized);
        if (!isPreset) {
          setIsOfflineDemoAlertOpen(true);
        }
      }

      if (blockedUrlCount > 0) {
        showAlert("นำเข้าเฉพาะ 1 ลิงก์แรก เพื่อประสิทธิภาพความแม่นยำสูงสุด");
      }

      const meta = analyzeInput(sanitized);
      if (meta.type === "mixed") {
        onTabChange("url");
        setIsMixedModalOpen(true);
      } else if (meta.type === "url_only") {
        onTabChange("url");
      } else {
        onTabChange("text");
      }
    } catch (e) {
      console.warn("Clipboard access failed", e);
    }
  };

  const handleClear = () => {
    onInputChange("");
    setAlertNotice(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !input.trim()) return;

    let finalInput = input.trim();
    // Auto-normalize bare URLs (e.g. facebook.com/share/p/... -> https://facebook.com/share/p/...)
    if (
      /^(?:www\.)?(?:facebook\.com|fb\.watch|fb\.me|fb\.com|x\.com|twitter\.com|t\.co|instagram\.com|instagr\.am|threads\.net|today\.line\.me|line\.me|lin\.ee|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})(?:\/[^\s]*)?$/i.test(
        finalInput
      ) &&
      !finalInput.startsWith("http://") &&
      !finalInput.startsWith("https://")
    ) {
      finalInput = `https://${finalInput}`;
    }

    // Secret Easter Egg trigger: View Development Team
    const trimmedLower = finalInput.toLowerCase().trim();
    if (
      [
        "!team",
        "!devs",
        "!credits",
        "!creator",
        "!authors",
        "cs-sskru",
        "sskru",
        "sisaket",
        "วิทยาการคอมพิวเตอร์",
      ].includes(trimmedLower)
    ) {
      setIsSecretTeamModalOpen(true);
      return;
    }

    // Prevent submitting custom un-indexed input ONLY when in offline demo mode
    if (isDemoOffline) {
      const isPreset = getDemoFactCheckResult(finalInput);
      if (!isPreset) {
        setIsOfflineDemoAlertOpen(true);
        return;
      }
    }

    onSubmit(finalInput);
  };

  const handleChipSelect = (content: string, format: "text" | "url" | "mixed") => {
    onInputChange(content);
    if (format === "url" || format === "mixed") {
      onTabChange("url");
      if (format === "mixed") {
        setIsMixedModalOpen(true);
      }
    } else {
      onTabChange("text");
    }
    setAlertNotice(null);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 50);
  };

  const hasContent = input.trim().length > 0;
  const isApproachingCharLimit = input.length >= OPTIMAL_CHARS_WARN;

  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-center mb-7 max-w-xl px-4 flex flex-col items-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 dark:from-white dark:via-cyan-50 dark:to-blue-300 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_4px_18px_rgba(0,210,255,0.22)]">
          AI Fact-Checker
        </h1>
        <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed font-medium">
          ระบบตรวจสอบและเทียบเคียงข้อเท็จจริงจากลิงก์โซเชียลมีเดียและข้อความข่าวสาร
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="relative w-full max-w-2xl px-2 sm:px-0">
        <div className="absolute -inset-0.5 sm:-inset-1 rounded-[2.25rem] bg-gradient-to-b from-cyan-500/20 via-blue-600/15 to-transparent blur-lg opacity-50 dark:opacity-60 pointer-events-none transition-opacity duration-300" />

        <div
          className={`relative rounded-3xl p-[1.5px] overflow-hidden transition-all duration-300 ease-out hover:-translate-y-0.5 shadow-[0_16px_40px_-10px_rgba(15,23,42,0.12),0_0_0_1px_rgba(0,0,0,0.06)] dark:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.1)] ${
            isFocused
              ? "shadow-[0_0_30px_rgba(6,182,212,0.35)] dark:shadow-[0_0_35px_rgba(6,182,212,0.45)]"
              : ""
          }`}
        >
          {/* Subtle Border Track */}
          <div className="absolute inset-0 bg-slate-200/80 dark:bg-[#1a2d4a]/80" />

          {/* Uniform Crisp Running Light Beam */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[240%] aspect-square animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_330deg,rgba(6,182,212,0.3)_345deg,#00f2fe_355deg,#2563eb_360deg)] pointer-events-none" />

          <div className="relative rounded-[22.5px] solid-card p-5 sm:p-6 bg-white dark:bg-[#0a1220] backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90">
            <div className="flex items-center justify-between gap-3 pb-3 mb-2 border-b border-slate-200 dark:border-[#2b446b]">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-[#2b446b]">
              <button
                type="button"
                onClick={() => onTabChange("url")}
                className={`flex items-center gap-1.5 rounded-xl px-3 sm:px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "url"
                    ? "bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/25 ring-1 ring-cyan-300/50"
                    : "text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-300"
                }`}
              >
                <LinkSimple size={15} weight="bold" />
                <span>ลิงก์ URL</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange("text")}
                className={`flex items-center gap-1.5 rounded-xl px-3 sm:px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "text"
                    ? "bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/25 ring-1 ring-cyan-300/50"
                    : "text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-300"
                }`}
              >
                <Article size={15} weight="bold" />
                <span>ข้อความ</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {hasContent ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="group flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/15 dark:bg-rose-500/20 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.35)] hover:bg-rose-600 hover:text-white hover:border-rose-500 hover:shadow-[0_0_18px_rgba(244,63,94,0.7)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                  title="ล้างข้อความทั้งหมด"
                >
                  <TrashSimple size={14} weight="bold" />
                  <span>ล้าง</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePaste}
                  className="group flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-cyan-300 bg-blue-500/15 dark:bg-cyan-500/20 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)] hover:bg-blue-600 hover:text-white hover:border-blue-500 hover:shadow-[0_0_18px_rgba(6,182,212,0.6)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                  title="วางข้อความจากคลิปบอร์ด"
                >
                  <ClipboardText size={14} weight="bold" />
                  <span>วาง</span>
                </button>
              )}
            </div>
          </div>

          <div className="py-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onPaste={handleNativeTextareaPaste}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              maxLength={MAX_CHARS}
              placeholder={
                activeTab === "url"
                  ? "วางลิงก์โพสต์โซเชียล เช่น Facebook, X (Twitter), Instagram, LINE Today หรือเว็บข่าว..."
                  : "พิมพ์หรือวางข้อความข่าวลือ ข้อความส่งต่อ หรือประเด็นที่ต้องการตรวจสอบข้อเท็จจริง..."
              }
              rows={hasContent ? 4 : 3}
              disabled={loading}
              className="w-full resize-none bg-transparent p-2 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none dark:text-white leading-relaxed font-normal"
            />
          </div>

          {alertNotice && (
            <div className="flex items-center gap-2 p-2.5 mb-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs animate-in fade-in duration-200">
              <WarningCircle size={16} weight="fill" className="shrink-0 text-amber-500" />
              <span>{alertNotice}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 mt-1 border-t border-slate-200 dark:border-[#2b446b] text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {inputMeta.type === "empty" && (
                <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 font-medium">
                  <Sparkle size={13} weight="fill" className="text-cyan-500 shrink-0" />
                  <span>รองรับ 1 ลิงก์ หรือข้อความยาวสูงสุด 1,500 ตัวอักษร</span>
                </span>
              )}

              {inputMeta.type === "url_only" && inputMeta.platforms.map((p, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border ${p.badgeStyle}`}
                >
                  <GlobeHemisphereWest size={14} weight="bold" />
                  <span>ตรวจพบ: {p.name}</span>
                </span>
              ))}

              {inputMeta.type === "mixed" && (
                <>
                  {inputMeta.platforms.map((p, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border ${p.badgeStyle}`}
                    >
                      <GlobeHemisphereWest size={14} weight="bold" />
                      <span>ตรวจพบ: {p.name}</span>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsMixedModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all cursor-pointer"
                    title="คลิกเพื่อดูลำดับการตรวจสอบ"
                  >
                    <Article size={14} weight="bold" />
                    <span>+ ข้อความสำรอง (ตรวจลิงก์ก่อน)</span>
                    <Info size={13} weight="fill" className="text-cyan-500 shrink-0" />
                  </button>
                </>
              )}

              {inputMeta.type === "text_only" && (
                <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/25">
                  <Article size={14} weight="bold" />
                  <span>ตรวจพบ: ข้อความ</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-mono font-medium ${
                  input.length >= MAX_CHARS
                    ? "text-rose-500 font-bold"
                    : isApproachingCharLimit
                    ? "text-amber-500 font-semibold"
                    : "text-slate-400"
                }`}
              >
                {input.length.toLocaleString()}/{MAX_CHARS.toLocaleString()} ตัวอักษร
              </span>
            </div>
          </div>
        </div>
      </div>

        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            type="submit"
            disabled={loading || !hasContent}
            className="group relative flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed px-8 py-3.5 text-sm sm:text-base font-bold text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkle size={18} weight="fill" />
            <span>{loading ? "กำลังสืบค้นและเทียบเคียงข้อมูล..." : "เริ่มการตรวจสอบข้อเท็จจริง"}</span>
            <ArrowRight size={16} weight="bold" className="transition-transform group-hover:translate-x-1" />
          </button>

          {isApproachingCharLimit && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 text-center max-w-md font-medium">
              💡 ข้อแนะนำ: หากมีหลายประเด็น ควรแยกตรวจทีละเรื่อง เพื่อให้ระบบสืบค้นหลักฐานได้อย่างแม่นยำ
            </p>
          )}
        </div>
      </form>

<<<<<<< HEAD
      {!loading && (
        <TrendingChips
          onSelect={handleChipSelect}
          disabled={loading}
          isOpen={isTrendingModalOpen}
          onOpenChange={setIsTrendingModalOpen}
        />
      )}

      <OfflineDemoAlertModal
        isOpen={isOfflineDemoAlertOpen}
        onClose={() => setIsOfflineDemoAlertOpen(false)}
        onOpenSampleTopics={() => {
          setIsOfflineDemoAlertOpen(false);
          setIsTrendingModalOpen(true);
        }}
      />
=======
      {!loading && <TrendingChips onSelect={handleChipSelect} disabled={loading} />}
>>>>>>> origin/dev

      <MixedInputNoticeModal
        isOpen={isMixedModalOpen}
        onClose={() => setIsMixedModalOpen(false)}
        detectedUrl={inputMeta.urls[0]}
      />
<<<<<<< HEAD

      <SecretTeamModal
        isOpen={isSecretTeamModalOpen}
        onClose={() => setIsSecretTeamModalOpen(false)}
      />
=======
>>>>>>> origin/dev
    </div>
  );
}

