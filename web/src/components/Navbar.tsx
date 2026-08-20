"use client";

<<<<<<< HEAD
import React, { useState, useRef, useEffect, useSyncExternalStore } from "react";
=======
import React, { useState, useSyncExternalStore } from "react";
>>>>>>> origin/dev
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ClockCounterClockwise,
  Moon,
  Sun,
  List,
  X,
<<<<<<< HEAD
  CaretDown,
  Sparkle,
  BookOpen,
  ShieldCheck,
  Question,
  Article,
  ChartBar,
  MagnifyingGlass,
  Lightning,
  Code,
  UsersThree,
  GithubLogo,
  ArrowSquareOut,
} from "@phosphor-icons/react";

import { Logo } from "@/components/Logo";
import { useHealthCheck } from "@/hooks/useHealthCheck";
=======
} from "@phosphor-icons/react";

import { Logo } from "@/components/Logo";
>>>>>>> origin/dev

interface NavbarProps {
  onOpenHistory: () => void;
  historyCount: number;
  onReset?: () => void;
<<<<<<< HEAD
  onOpenTeamModal?: () => void;
=======
>>>>>>> origin/dev
}

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

<<<<<<< HEAD
export function Navbar({ onOpenHistory, historyCount, onReset, onOpenTeamModal }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isOnline } = useHealthCheck();

  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isDashboardPage = pathname === "/dashboard";
=======
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
>>>>>>> origin/dev
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useIsClient();
  const currentTheme = mounted ? (resolvedTheme || theme) : "light";
  const isDark = currentTheme === "dark";

  const handleToggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const handleNavLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setMobileMenuOpen(false);
<<<<<<< HEAD
    setOpenDropdown(null);

    if (href === "/dashboard") {
      return;
    }

    if (isHomePage) {
      e.preventDefault();
      if (href === "#checker" || href === "#" || href === "/#checker") {
=======

    if (isHomePage) {
      e.preventDefault();
      if (href === "#checker" || href === "#") {
>>>>>>> origin/dev
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

<<<<<<< HEAD
      const targetId = href.replace("/#", "").replace("#", "");
      const element = document.getElementById(targetId);
=======
      const targetId = href.replace("#", "");
      const element = document.getElementById(targetId) || document.querySelector(href);
>>>>>>> origin/dev
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

<<<<<<< HEAD
  const handleMouseEnter = (menuKey: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setOpenDropdown(menuKey);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

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

        {/* Desktop Navigation Links with Distinct Color Identities */}
        <nav className="hidden lg:flex items-center gap-2 xl:gap-2.5 text-xs font-semibold">
          {/* 1. Core Tool: Checker (Blue / Cyan) */}
          <Link
            href="/#checker"
            onClick={(e) => handleNavLinkClick(e, "#checker")}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-blue-50/90 dark:bg-blue-950/50 text-blue-700 dark:text-cyan-300 border border-blue-200/80 dark:border-blue-700/60 hover:bg-blue-100/90 dark:hover:bg-blue-900/60 hover:border-blue-400 dark:hover:border-cyan-400 transition-all font-bold shadow-2xs"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-2xs">
              <MagnifyingGlass size={12} weight="bold" />
            </div>
            <span>เครื่องมือตรวจสอบ</span>
          </Link>

          {/* 2. Analytics & Dashboard */}
          <Link
            href="/dashboard"
            onClick={(e) => handleNavLinkClick(e, "/dashboard")}
            className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl border transition-all shadow-2xs font-bold ${
              isDashboardPage
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40"
                : "bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/90 dark:border-indigo-700/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 hover:border-indigo-400 dark:hover:border-indigo-400"
            }`}
          >
            <div className={`flex h-5 w-5 items-center justify-center rounded-md ${isDashboardPage ? "bg-white/20 text-white" : "bg-gradient-to-br from-indigo-500 to-blue-600 text-white"} shadow-2xs`}>
              <ChartBar size={12} weight="bold" />
            </div>
            <span>สถิติ & แดชบอร์ด</span>
          </Link>

          {/* 3. Dropdown: Features & Guide (Teal / Sky / Amber) */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("features")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === "features" ? null : "features")}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl border transition-all cursor-pointer font-bold shadow-2xs ${
                openDropdown === "features"
                  ? "bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border-teal-400 dark:border-teal-500 ring-2 ring-teal-400/30"
                  : "bg-teal-50/90 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border-teal-200/80 dark:border-teal-700/60 hover:bg-teal-100/90 dark:hover:bg-teal-900/60 hover:border-teal-400 dark:hover:border-teal-400"
              }`}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-2xs">
                <BookOpen size={12} weight="bold" />
              </div>
              <span>คู่มือและฟีเจอร์</span>
              <CaretDown
                size={12}
                weight="bold"
                className={`transition-transform duration-200 text-teal-600 dark:text-teal-400 ${openDropdown === "features" ? "rotate-180" : ""}`}
              />
            </button>

            {/* Floating Dropdown Menu */}
            {openDropdown === "features" && (
              <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-white/95 dark:bg-[#10243d]/95 backdrop-blur-xl border border-teal-200/90 dark:border-teal-700/80 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                {/* Top Micro Light Beam */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-teal-400 dark:via-teal-300 to-transparent" />

                <Link
                  href="/#how-it-works"
                  onClick={(e) => handleNavLinkClick(e, "#how-it-works")}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/50 border border-transparent hover:border-amber-200 dark:hover:border-amber-800/60 transition-all group"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/20 shrink-0 mt-0.5">
                    <Lightning size={16} weight="bold" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                      วิธีการใช้งาน
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-tight mt-0.5">
                      ขั้นตอนการส่งตรวจ 3 สเต็ปง่ายๆ
                    </div>
                  </div>
                </Link>

                <Link
                  href="/#features"
                  onClick={(e) => handleNavLinkClick(e, "#features")}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-cyan-50 dark:hover:bg-cyan-950/50 border border-transparent hover:border-cyan-200 dark:hover:border-cyan-800/60 transition-all group"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-md shadow-cyan-500/20 shrink-0 mt-0.5">
                    <Sparkle size={16} weight="bold" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                      ฟีเจอร์หลักของระบบ
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-tight mt-0.5">
                      AI สกัดหลายประเด็น & เทียบหลักฐาน
                    </div>
                  </div>
                </Link>

                <Link
                  href="/#sources"
                  onClick={(e) => handleNavLinkClick(e, "#sources")}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/60 transition-all group"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-md shadow-emerald-500/20 shrink-0 mt-0.5">
                    <Article size={16} weight="bold" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                      แหล่งข่าวที่ใช้สืบค้น
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-tight mt-0.5">
                      สื่อหลัก & Whitelist ที่น่าเชื่อถือ
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* 4. Dropdown: Trust & FAQ (Rose / Violet) */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("trust")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === "trust" ? null : "trust")}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl border transition-all cursor-pointer font-bold shadow-2xs ${
                openDropdown === "trust"
                  ? "bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/30"
                  : "bg-rose-50/90 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-700/60 hover:bg-rose-100/90 dark:hover:bg-rose-900/60 hover:border-rose-400 dark:hover:border-rose-400"
              }`}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-rose-500 to-red-500 text-white shadow-2xs">
                <ShieldCheck size={12} weight="bold" />
              </div>
              <span>มาตรฐาน & คำถาม</span>
              <CaretDown
                size={12}
                weight="bold"
                className={`transition-transform duration-200 text-rose-600 dark:text-rose-400 ${openDropdown === "trust" ? "rotate-180" : ""}`}
              />
            </button>

            {/* Floating Dropdown Menu */}
            {openDropdown === "trust" && (
              <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-white/95 dark:bg-[#10243d]/95 backdrop-blur-xl border border-rose-200/90 dark:border-rose-700/80 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                {/* Top Micro Light Beam */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-400 dark:via-rose-300 to-transparent" />

                <Link
                  href="/#security"
                  onClick={(e) => handleNavLinkClick(e, "#security")}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/60 transition-all group"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/20 shrink-0 mt-0.5">
                    <ShieldCheck size={16} weight="bold" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">
                      ความปลอดภัยและมาตรฐาน
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-tight mt-0.5">
                      Zero-DB, PDPA & มาตรฐาน IFCN
                    </div>
                  </div>
                </Link>

                <Link
                  href="/#faq"
                  onClick={(e) => handleNavLinkClick(e, "#faq")}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800/60 transition-all group"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20 shrink-0 mt-0.5">
                    <Question size={16} weight="bold" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                      คำถามที่พบบ่อย (FAQ)
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-tight mt-0.5">
                      ข้อสงสัยและการใช้งานทั่วไป
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Right Side Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Status Indicator Badge */}
          {mounted && (
            <div
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-default select-none shadow-2xs ${
                isOnline
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
              }`}
              title={
                isOnline
                  ? "เซิร์ฟเวอร์คลาวด์เชื่อมต่อสมบูรณ์ (Live AI Engine Online)"
                  : "เซิร์ฟเวอร์ออฟไลน์ — ระบบพร้อมทำงานในโหมดสาธิต (10 Demo Cases Ready)"
              }
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isOnline ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isOnline ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
              </span>
              <span>{isOnline ? "ระบบออนไลน์" : "โหมดสาธิต (Demo)"}</span>
            </div>
          )}

          {/* History Button */}
=======
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
>>>>>>> origin/dev
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

<<<<<<< HEAD
          {/* Theme Toggle Button */}
=======
>>>>>>> origin/dev
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

<<<<<<< HEAD
          {/* Developer / Code Dropdown Menu Button */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("devMenu")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === "devMenu" ? null : "devMenu")}
              className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer shadow-xs ${
                openDropdown === "devMenu"
                  ? "bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 border-cyan-400 dark:border-cyan-500 ring-2 ring-cyan-400/30"
                  : "bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-400/40"
              }`}
              title="ทีมพัฒนา & ซอร์สโค้ด (Developers & GitHub)"
              aria-label="เมนูทีมพัฒนาและ GitHub"
            >
              <Code size={18} weight="bold" />
            </button>

            {/* Dropdown Card */}
            {openDropdown === "devMenu" && (
              <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl bg-white/95 dark:bg-[#10243d]/95 backdrop-blur-xl border border-cyan-200/90 dark:border-cyan-700/80 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                {/* Top Micro Light Beam */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 dark:via-cyan-300 to-transparent" />

                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    onOpenTeamModal?.();
                  }}
                  className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-cyan-50 dark:hover:bg-cyan-950/50 border border-transparent hover:border-cyan-200 dark:hover:border-cyan-800/60 transition-all text-left group cursor-pointer"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <UsersThree size={16} weight="bold" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                      Core Engineering Team
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-tight mt-0.5">
                      ทีมผู้พัฒนาโครงงาน 3 คน
                    </div>
                  </div>
                </button>

                <a
                  href="https://github.com/Cha-Khiao/AI-Fact-Checker.git"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpenDropdown(null)}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-all group cursor-pointer"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-md shadow-slate-700/20 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <GithubLogo size={16} weight="bold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                      <span>GitHub Repository</span>
                      <ArrowSquareOut size={12} weight="bold" className="text-slate-400" />
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-tight mt-0.5">
                      ซอร์สโค้ดและเอกสาร Open-Source
                    </div>
                  </div>
                </a>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger Button */}
=======
>>>>>>> origin/dev
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

<<<<<<< HEAD
      {/* Mobile Menu Drawer with Colors */}
      {mobileMenuOpen && (
        <div className="bg-white/95 dark:bg-[#10243d]/95 backdrop-blur-xl px-4 py-4 lg:hidden space-y-3 border-t border-slate-200/80 dark:border-[#2b446b] animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/#checker"
              onClick={(e) => handleNavLinkClick(e, "#checker")}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-cyan-300 shadow-2xs"
            >
              <MagnifyingGlass size={16} weight="bold" className="text-blue-600 dark:text-cyan-400" />
              <span>ตรวจข้อเท็จจริง</span>
            </Link>

            <Link
              href="/dashboard"
              onClick={(e) => handleNavLinkClick(e, "/dashboard")}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold shadow-2xs ${
                isDashboardPage
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-blue-500/20"
                  : "bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/90 dark:border-indigo-700/80"
              }`}
            >
              <ChartBar size={16} weight="bold" />
              <span>สถิติ & แดชบอร์ด</span>
            </Link>
          </div>

          <div className="pt-1 space-y-1.5">
            <div className="text-[11px] font-bold text-teal-700 dark:text-teal-400 px-2 uppercase tracking-wider flex items-center gap-1">
              <BookOpen size={12} weight="bold" />
              <span>คู่มือและฟีเจอร์</span>
            </div>
            <Link
              href="/#how-it-works"
              onClick={(e) => handleNavLinkClick(e, "#how-it-works")}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40"
            >
              <span>⚡</span>
              <span>วิธีการใช้งาน</span>
            </Link>
            <Link
              href="/#features"
              onClick={(e) => handleNavLinkClick(e, "#features")}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200/60 dark:border-cyan-800/40"
            >
              <span>✨</span>
              <span>ฟีเจอร์หลักของระบบ</span>
            </Link>
            <Link
              href="/#sources"
              onClick={(e) => handleNavLinkClick(e, "#sources")}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40"
            >
              <span>🌐</span>
              <span>แหล่งข่าวที่ใช้สืบค้น</span>
            </Link>
          </div>

          <div className="pt-1 space-y-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400 px-2 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck size={12} weight="bold" />
              <span>มาตรฐานและความน่าเชื่อถือ</span>
            </div>
            <Link
              href="/#security"
              onClick={(e) => handleNavLinkClick(e, "#security")}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40"
            >
              <span>🔒</span>
              <span>ความปลอดภัยและมาตรฐาน</span>
            </Link>
            <Link
              href="/#faq"
              onClick={(e) => handleNavLinkClick(e, "#faq")}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40"
            >
              <span>❓</span>
              <span>คำถามที่พบบ่อย (FAQ)</span>
            </Link>
          </div>

          <div className="pt-1 space-y-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="text-[11px] font-bold text-cyan-700 dark:text-cyan-400 px-2 uppercase tracking-wider flex items-center gap-1">
              <UsersThree size={12} weight="bold" />
              <span>ทีมพัฒนาและโอเพนซอร์ส</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTeamModal?.();
              }}
              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200/60 dark:border-cyan-800/40 text-left cursor-pointer"
            >
              <span>👥</span>
              <span>Core Engineering Team (ทีมผู้พัฒนา)</span>
            </button>
            <a
              href="https://github.com/Cha-Khiao/AI-Fact-Checker.git"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60"
            >
              <div className="flex items-center gap-2">
                <GithubLogo size={15} weight="bold" />
                <span>GitHub Repository</span>
              </div>
              <ArrowSquareOut size={13} weight="bold" className="text-slate-400" />
            </a>
          </div>
=======
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
>>>>>>> origin/dev
        </div>
      )}
    </header>
  );
}
