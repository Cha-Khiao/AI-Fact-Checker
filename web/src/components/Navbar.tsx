"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ClockCounterClockwise,
  Moon,
  Sun,
  List,
  X,
} from "@phosphor-icons/react";

import { Logo } from "@/components/Logo";

interface NavbarProps {
  onOpenHistory: () => void;
  historyCount: number;
  onReset?: () => void;
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
  { href: "#how-it-works", label: "วิธีการใช้งาน" },
  { href: "#features", label: "ฟีเจอร์หลัก" },
  { href: "#sources", label: "แหล่งข่าวที่ใช้สืบค้น" },
  { href: "#security", label: "ความปลอดภัยและมาตรฐาน" },
  { href: "#faq", label: "คำถามที่พบบ่อย" },
];

export function Navbar({ onOpenHistory, historyCount, onReset }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useIsClient();
  const currentTheme = mounted ? (resolvedTheme || theme) : "light";
  const isDark = currentTheme === "dark";

  const handleToggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const handleNavLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setMobileMenuOpen(false);

    if (isHomePage) {
      e.preventDefault();
      if (href === "#checker" || href === "#") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const targetId = href.replace("#", "");
      const element = document.getElementById(targetId) || document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel transition-colors border-b border-slate-200/80 dark:border-[#2b446b]/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/#checker"
          onClick={(e) => {
            if (isHomePage) {
              e.preventDefault();
              onReset?.();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="group flex items-center text-left cursor-pointer transition-transform hover:scale-[1.02]"
        >
          <Logo size="md" />
        </Link>

        <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-600 dark:text-slate-300">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={`/${item.href}`}
              onClick={(e) => handleNavLinkClick(e, item.href)}
              className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors py-1.5 px-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenHistory}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-cyan-400 transition-all cursor-pointer shadow-xs"
            title="ประวัติการตรวจสอบล่าสุด"
          >
            <ClockCounterClockwise size={18} weight="bold" />
            {mounted && historyCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-[10px] font-bold text-white shadow-sm ring-1 ring-white dark:ring-slate-900">
                {historyCount > 9 ? "9+" : historyCount}
              </span>
            )}
          </button>

          {mounted ? (
            <button
              type="button"
              onClick={handleToggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-xs"
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

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 lg:hidden cursor-pointer"
            aria-label="เมนูหลัก"
          >
            {mobileMenuOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 lg:hidden space-y-1 border-t border-slate-200/80 dark:border-[#2b446b]">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={`/${item.href}`}
              onClick={(e) => handleNavLinkClick(e, item.href)}
              className="block rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
