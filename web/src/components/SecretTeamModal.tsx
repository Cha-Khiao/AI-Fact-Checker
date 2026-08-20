"use client";

import React, { useEffect } from "react";
import { X, Crown, Heart, GraduationCap, UsersThree, GithubLogo, ArrowSquareOut } from "@phosphor-icons/react";

interface SecretTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SecretTeamModal({ isOpen, onClose }: SecretTeamModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const team = [
    {
      id: "Prasopphol18",
      role: "ผู้ออกแบบสถาปัตยกรรม พัฒนาระบบเต็มรูปแบบ และควบคุมการส่งมอบ",
      title: "Lead System Architect & Full-Stack Engineer",
      icon: Crown,
      cardStyle:
        "bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-transparent dark:from-cyan-950/60 dark:via-blue-950/40 dark:to-slate-900/60 border-cyan-500/40 dark:border-cyan-400/50 shadow-md shadow-cyan-500/10 hover:border-cyan-400 dark:hover:border-cyan-300 hover:shadow-cyan-500/25",
      avatarBg: "bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/35 ring-2 ring-cyan-300/60 dark:ring-cyan-400/40",
      idBadge: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    },
    {
      id: "Thanasuk13",
      role: "ผู้ร่วมทดสอบระบบ รวบรวมข้อมูลกรณีศึกษา และสนับสนุนทีม",
      title: "Quality Assurance & Research Supporter",
      icon: Heart,
      cardStyle:
        "bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent dark:from-amber-950/50 dark:via-orange-950/30 dark:to-slate-900/60 border-amber-500/35 dark:border-amber-400/40 shadow-md shadow-amber-500/10 hover:border-amber-400 dark:hover:border-amber-300 hover:shadow-amber-500/20",
      avatarBg: "bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/35 ring-2 ring-amber-300/60 dark:ring-amber-400/40",
      idBadge: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
    },
    {
      id: "Kunlanat38",
      role: "ผู้ร่วมทดสอบระบบ รวบรวมข้อมูลกรณีศึกษา และสนับสนุนทีม",
      title: "Quality Assurance & Research Supporter",
      icon: Heart,
      cardStyle:
        "bg-gradient-to-br from-rose-500/15 via-pink-500/10 to-transparent dark:from-rose-950/50 dark:via-pink-950/30 dark:to-slate-900/60 border-rose-500/35 dark:border-rose-400/40 shadow-md shadow-rose-500/10 hover:border-rose-400 dark:hover:border-rose-300 hover:shadow-rose-500/20",
      avatarBg: "bg-gradient-to-br from-rose-400 via-pink-500 to-purple-600 text-white shadow-lg shadow-rose-500/35 ring-2 ring-rose-300/60 dark:ring-rose-400/40",
      idBadge: "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop with Dynamic Glassmorphism Blur */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Main Modal Card with Cyber Glassmorphism & Soft Light Beam */}
      <div className="relative w-full max-w-lg rounded-3xl bg-white/95 dark:bg-[#0a1526]/95 backdrop-blur-2xl border border-cyan-500/30 dark:border-cyan-400/40 shadow-[0_25px_60px_-15px_rgba(6,182,212,0.35)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] overflow-hidden p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Soft Micro Light Beam (Plays with light gracefully like other cards) */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 dark:via-cyan-300 to-transparent" />

        {/* Ambient Top Glow Aura */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-32 bg-cyan-500/15 dark:bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400/40 shrink-0">
              <UsersThree size={24} weight="bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Core Engineering Team
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                ทีมผู้พัฒนาและสถาปัตยกรรมระบบ AI Fact-Checker
              </p>
            </div>
          </div>

          {/* Close Button X (Red Theme with Neon Glow) */}
          <button
            type="button"
            onClick={onClose}
            className="group flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-500/15 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.35)] hover:bg-rose-600 hover:text-white hover:border-rose-500 hover:shadow-[0_0_22px_rgba(244,63,94,0.7)] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
            title="ปิดหน้าต่าง"
            aria-label="ปิดหน้าต่าง"
          >
            <X size={18} weight="bold" className="transition-transform duration-200 group-hover:rotate-90" />
          </button>
        </div>

        {/* Team Members List */}
        <div className="relative mt-4.5 space-y-3.5">
          {team.map((member) => {
            const Icon = member.icon;
            return (
              <div
                key={member.id}
                className={`p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 ${member.cardStyle}`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 ${member.avatarBg}`}>
                    <Icon size={24} weight="fill" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-mono font-black tracking-wider border shadow-2xs ${member.idBadge}`}>
                        {member.id}
                      </span>
                    </div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100 mt-1 truncate">
                      {member.title}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-0.5 leading-relaxed">
                      {member.role}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Academic Affiliation Footer */}
        <div className="relative mt-4.5 p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800/90 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <GraduationCap size={18} weight="duotone" className="text-cyan-500 shrink-0" />
            <span>สาขาวิชาวิทยาการคอมพิวเตอร์ (Computer Science)</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            มหาวิทยาลัยราชภัฏศรีสะเกษ (Sisaket Rajabhat University) • ปีการศึกษา 2569 (2026)
          </p>
        </div>

        {/* Prominent Glowing Cyber GitHub Button */}
        <div className="relative mt-4">
          <a
            href="https://github.com/Cha-Khiao/AI-Fact-Checker.git"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 dark:from-[#0b1b33] dark:via-[#0e274d] dark:to-[#08172c] text-white font-bold text-xs sm:text-sm border-2 border-cyan-400/60 dark:border-cyan-400/70 shadow-[0_10px_30px_rgba(6,182,212,0.3)] hover:shadow-[0_15px_40px_rgba(6,182,212,0.5)] hover:border-cyan-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer overflow-hidden"
          >
            {/* Animated Shimmer Sweep */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" />

            {/* Glowing GitHub Icon */}
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/10 group-hover:bg-cyan-500 text-white shadow-md transition-colors duration-200 shrink-0">
              <GithubLogo size={18} weight="fill" className="group-hover:rotate-12 transition-transform duration-200" />
            </div>

            <span className="tracking-wide">
              สำรวจซอร์สโค้ดบน <span className="text-cyan-400 font-black">GitHub Repository</span>
            </span>

            <ArrowSquareOut size={16} weight="bold" className="text-cyan-400 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-200 ml-1" />
          </a>
        </div>

      </div>
    </div>
  );
}
