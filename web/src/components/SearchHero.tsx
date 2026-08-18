"use client";

import React, { useMemo, useState } from "react";
import {
  LinkSimple,
  ChatText,
  ClipboardText,
  TrashSimple,
  GlobeHemisphereWest,
  Sparkle,
  ArrowRight,
  WarningCircle,
} from "@phosphor-icons/react";
import { RiSparklingFill } from "react-icons/ri";
import { TrendingChips } from "./TrendingChips";

const MAX_URLS = 3;
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
  platforms: { name: string; url: string }[];
  isAtUrlLimit: boolean;
  charCount: number;
}

function extractUniqueUrls(raw: string): string[] {
  const matches = (raw || "").match(/https?:\/\/[^\s<>"'\[\]{}()]+/gi) || [];
  return Array.from(new Set(matches));
}

function getPlatformName(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("facebook.com") || u.includes("fb.watch") || u.includes("fb.me")) return "Facebook";
  if (u.includes("x.com") || u.includes("twitter.com")) return "X (Twitter)";
  if (u.includes("instagram.com")) return "Instagram";
  if (u.includes("today.line.me") || u.includes("line.me")) return "LINE Today";
  if (u.includes("threads.net")) return "Threads";
  return "เว็บไซต์ข่าว";
}

function analyzeInput(raw: string): DetectionResult {
  const text = (raw || "").trim();
  const charCount = (raw || "").length;
  if (!text) {
    return { type: "empty", urls: [], platforms: [], isAtUrlLimit: false, charCount };
  }

  const uniqueUrls = extractUniqueUrls(text);
  const platforms = uniqueUrls.map((url) => ({
    name: getPlatformName(url),
    url,
  }));

  const isAtUrlLimit = uniqueUrls.length >= MAX_URLS;
  const hasUrl = uniqueUrls.length > 0;

  if (hasUrl) {
    const textWithoutUrls = text.replace(/https?:\/\/[^\s<>"'\[\]{}()]+/gi, "").trim();
    if (textWithoutUrls.length > 3) {
      return { type: "mixed", urls: uniqueUrls, platforms, isAtUrlLimit, charCount };
    }
    return { type: "url_only", urls: uniqueUrls, platforms, isAtUrlLimit, charCount };
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
      showAlert(`ระบบรับได้สูงสุด ${MAX_URLS} ลิงก์`);
      return;
    }

    if (rawVal.length > MAX_CHARS) {
      onInputChange(rawVal.slice(0, MAX_CHARS));
      showAlert(`จำกัดความยาวสูงสุด ${MAX_CHARS} ตัวอักษร`);
      return;
    }

    onInputChange(rawVal);

    const meta = analyzeInput(rawVal);
    if ((meta.type === "url_only" || meta.type === "mixed") && activeTab !== "url") {
      onTabChange("url");
    } else if (meta.type === "text_only" && activeTab !== "text") {
      onTabChange("text");
    }
  };

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (!clipText) return;

      const combinedText = input ? `${input}\n${clipText.trim()}` : clipText.trim();
      const { sanitized, blockedUrlCount } = sanitizeInput(combinedText);

      onInputChange(sanitized);

      if (blockedUrlCount > 0) {
        showAlert(`นำเข้าเฉพาะ ${MAX_URLS} ลิงก์แรก`);
      }

      const meta = analyzeInput(sanitized);
      if (meta.type === "url_only" || meta.type === "mixed") {
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
    onSubmit();
  };

  const handleChipSelect = (query: string) => {
    onInputChange(query);
    onTabChange("text");
    onSubmit(query, "text");
  };

  const hasContent = input.trim().length > 0;
  const isApproachingCharLimit = input.length >= OPTIMAL_CHARS_WARN;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Title Header */}
      <div className="text-center mb-8 max-w-2xl px-4">
        <div className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mb-4 shadow-sm">
          <RiSparklingFill className="text-cyan-500 animate-pulse text-sm" />
          <span>Stateless Live Fact-Checking</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          ตรวจสอบความจริง{" "}
          <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 dark:from-blue-400 dark:via-cyan-300 dark:to-indigo-400 bg-clip-text text-transparent">
            ด้วยพลัง AI & ข้อมูลสด
          </span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
          วางลิงก์โพสต์โซเชียล หรือพิมพ์ข้อความข่าว AI จะค้นหาและเทียบเคียงหลักฐานจากสำนักข่าวจริงให้อัตโนมัติ
        </p>
      </div>

      {/* Main Command Input Box Form */}
      <form onSubmit={handleFormSubmit} className="w-full max-w-3xl px-2 sm:px-0">
        {/* Spacious, Clean Glass Card */}
        <div
          className={`rounded-2xl glass-panel p-5 sm:p-6 transition-all duration-300 shadow-lg ${
            isFocused
              ? "ring-2 ring-cyan-500/40 shadow-cyan-500/10"
              : "hover:shadow-xl"
          }`}
        >
          {/* Card Top Bar: Mode Switcher & Quick Actions */}
          <div className="flex items-center justify-between gap-3 pb-3 mb-2 border-b border-slate-200/60 dark:border-slate-800/60">
            {/* Mode Switch Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/80">
              <button
                type="button"
                onClick={() => onTabChange("url")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "url"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <LinkSimple size={15} weight="bold" />
                <span>ลิงก์โซเชียล</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange("text")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "text"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ChatText size={15} weight="bold" />
                <span>ข้อความข่าว</span>
              </button>
            </div>

            {/* Quick Actions Top-Right */}
            <div className="flex items-center gap-2">
              {hasContent ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="ล้างข้อความทั้งหมด"
                >
                  <TrashSimple size={14} weight="bold" />
                  <span>ล้าง</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePaste}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="วางข้อความจากคลิปบอร์ด"
                >
                  <ClipboardText size={14} weight="bold" />
                  <span>วาง</span>
                </button>
              )}
            </div>
          </div>

          {/* Comfortable Textarea Area */}
          <div className="py-2">
            <textarea
              value={input}
              onChange={handleTextareaChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              maxLength={MAX_CHARS}
              placeholder={
                activeTab === "url"
                  ? "วางลิงก์โพสต์โซเชียล เช่น Facebook, X (Twitter), Instagram, LINE Today หรือเว็บข่าว..."
                  : "พิมพ์หรือวางเนื้อหาข่าวลือ หรือประเด็นที่ต้องการตรวจสอบข้อเท็จจริง..."
              }
              rows={hasContent ? 4 : 3}
              disabled={loading}
              className="w-full resize-none bg-transparent p-2 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none dark:text-white leading-relaxed font-normal"
            />
          </div>

          {/* Alert Notice Banner */}
          {alertNotice && (
            <div className="flex items-center gap-2 p-2.5 mb-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs animate-in fade-in duration-200">
              <WarningCircle size={16} weight="fill" className="shrink-0 text-amber-500" />
              <span>{alertNotice}</span>
            </div>
          )}

          {/* Card Bottom Meta Bar: Detected Platform Badges & Character Count */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 mt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
            {/* Left: Detected Platform Badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              {inputMeta.platforms.length > 0 && (
                <>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mr-1">
                    ตรวจพบ {inputMeta.platforms.length} ลิงก์:
                  </span>
                  {inputMeta.platforms.map((p, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20"
                    >
                      <GlobeHemisphereWest size={12} weight="bold" />
                      <span>{p.name}</span>
                    </span>
                  ))}
                </>
              )}
            </div>

            {/* Right: Character Counter */}
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-mono font-medium ${
                input.length >= MAX_CHARS
                  ? "text-rose-500 font-bold"
                  : isApproachingCharLimit
                  ? "text-amber-500 font-semibold"
                  : "text-slate-400"
              }`}>
                {input.length.toLocaleString()}/{MAX_CHARS.toLocaleString()} ตัวอักษร
              </span>
            </div>
          </div>
        </div>

        {/* Centered Prominent Fact-Check Submit Button Under the Card */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            type="submit"
            disabled={loading || !hasContent}
            className="group relative flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed px-8 py-3.5 text-sm sm:text-base font-bold text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all cursor-pointer hover:scale-[1.03] active:scale-[0.98]"
          >
            <Sparkle size={18} weight="fill" className="text-cyan-300 animate-pulse" />
            <span>{loading ? "กำลังตรวจสอบข้อเท็จจริง..." : "ตรวจสอบข้อเท็จจริง"}</span>
            <ArrowRight size={16} weight="bold" className="transition-transform group-hover:translate-x-1" />
          </button>

          {isApproachingCharLimit && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 text-center max-w-md">
              💡 แนะนำ: หากมีหลายประเด็น ควรแยกตรวจทีละเรื่อง เพื่อให้ AI สืบค้นหลักฐานได้แม่นยำสูงสุด
            </p>
          )}
        </div>
      </form>

      {/* Trending Sample Topics */}
      {!loading && <TrendingChips onSelect={handleChipSelect} disabled={loading} />}
    </div>
  );
}
