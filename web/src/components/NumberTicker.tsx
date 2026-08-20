"use client";

import React, { useEffect, useState } from "react";
import { useSpring, useTransform } from "framer-motion";

interface NumberTickerProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
}

export function NumberTicker({
  value,
  className = "",
  suffix = "",
}: NumberTickerProps) {
  const spring = useSpring(0, {
    mass: 0.8,
    stiffness: 60,
    damping: 14,
  });

  const display = useTransform(spring, (current) => Math.round(current));
  const [val, setVal] = useState(0);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    return display.on("change", (latest) => {
      setVal(latest);
    });
  }, [display]);

  return (
    <span className={`inline-block tabular-nums ${className}`}>
      {val}
      {suffix}
    </span>
  );
}
