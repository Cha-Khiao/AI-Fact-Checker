"use client";

import React from "react";
import { motion } from "framer-motion";

interface FadeProps {
  children: React.ReactNode;
  triggerOnce?: boolean;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  cascade?: boolean;
  damping?: number;
  className?: string;
}

export function Fade({
  children,
  triggerOnce = true,
  direction = "up",
  delay = 0,
  duration,
  className = "",
}: FadeProps) {
  const getOffset = () => {
    switch (direction) {
      case "up":
        return { y: 20, x: 0 };
      case "down":
        return { y: -20, x: 0 };
      case "left":
        return { x: 20, y: 0 };
      case "right":
        return { x: -20, y: 0 };
      default:
        return { x: 0, y: 0 };
    }
  };

  const offset = getOffset();

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: triggerOnce, margin: "-40px" }}
      transition={{ duration: duration ? duration / 1000 : 0.45, delay: delay / 1000, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default Fade;
