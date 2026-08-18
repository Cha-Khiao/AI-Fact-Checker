"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ShieldCheckered,
  WarningCircle,
  XCircle,
  Sparkle,
} from "@phosphor-icons/react";

export type MascotState = "idle" | "searching" | "true" | "warning" | "fake";

interface MascotProps {
  state?: MascotState;
  className?: string;
  size?: number;
}

export function Mascot({ state = "idle", className = "", size = 64 }: MascotProps) {
  switch (state) {
    case "true":
      return (
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/10 ${className}`}
          style={{ width: size, height: size }}
        >
          <ShieldCheckered size={size * 0.6} weight="duotone" />
        </motion.div>
      );
    case "warning":
      return (
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-md shadow-amber-500/10 ${className}`}
          style={{ width: size, height: size }}
        >
          <WarningCircle size={size * 0.6} weight="duotone" />
        </motion.div>
      );
    case "fake":
      return (
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, -3, 3, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-red-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-md shadow-rose-500/10 ${className}`}
          style={{ width: size, height: size }}
        >
          <XCircle size={size * 0.6} weight="duotone" />
        </motion.div>
      );
    default:
      return (
        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-cyan-400 border border-blue-500/30 shadow-md shadow-blue-500/10 ${className}`}
          style={{ width: size, height: size }}
        >
          <Sparkle size={size * 0.6} weight="duotone" />
        </motion.div>
      );
  }
}
