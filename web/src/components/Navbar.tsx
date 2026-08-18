"use client";

import React, { useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import {
  ShieldCheckered,
  ClockCounterClockwise,
  Moon,
  Sun,
  List,
  X,
  Sparkle,
} from "@phosphor-icons/react";

interface NavbarProps {
  onOpenHistory: () => void;
  historyCount: number;
  onReset: () => void;
}

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

const navLinks = [
  { href: "#checker", label: "เครื่องมือตรวจสอบ" },
  { href: "#features", label: "ฟีเจอร์" },
  { href: "#how-it-works", label: "วิธีใช้งาน" },
  { href: "#benefits", label: "ประโยชน์" },
  { href: "#faq", label: "คำถามที่พบบ่อย" },
];

export function Navbar({ onOpenHistory, historyCount, onReset }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useIsClient();
  const currentTheme = mounted ? (resolvedTheme || theme) : "light";
  const isDark = currentTheme === "dark";

  const handleToggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      setMobileMenuOpen(false);
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel transition-colors">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => {
            onReset();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="group flex items-center gap-2.5 text-left cursor-pointer transition-transform hover:scale-[1.02]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-sm shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
            <ShieldCheckered size={22} weight="duotone" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                AI Fact-Checker
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-600 dark:text-cyan-400">
                <Sparkle size={10} weight="fill" />
                Live RAG
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              ระบบตรวจสอบข้อเท็จจริงอัจฉริยะ
            </span>
          </div>
        </button>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => scrollToSection(e, item.href)}
              className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors py-1"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
            title="ประวัติการตรวจสอบล่าสุด"
          >
            <ClockCounterClockwise size={18} weight="bold" />
            {mounted && historyCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-[10px] font-bold text-white shadow-sm">
                {historyCount > 9 ? "9+" : historyCount}
              </span>
            )}
          </button>

          {/* Theme Switch Button */}
          {mounted ? (
            <button
              type="button"
              onClick={handleToggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
              title={isDark ? "เปลี่ยนเป็นโหมดสว่าง (Light)" : "เปลี่ยนเป็นโหมดมืด (Dark)"}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun size={18} weight="fill" className="text-amber-400 animate-in fade-in zoom-in duration-200" />
              ) : (
                <Moon size={18} weight="fill" className="text-slate-700 animate-in fade-in zoom-in duration-200" />
              )}
            </button>
          ) : (
            <div className="h-9 w-9" />
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 lg:hidden cursor-pointer"
          >
            {mobileMenuOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 lg:hidden space-y-1">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => scrollToSection(e, item.href)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
