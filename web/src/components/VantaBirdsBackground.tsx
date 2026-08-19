"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useTheme } from "next-themes";

interface VantaEffect {
  destroy: () => void;
  setOptions: (options: Record<string, unknown>) => void;
}

export function VantaBirdsBackground() {
  const vantaRef = useRef<HTMLDivElement | null>(null);
  const vantaEffect = useRef<VantaEffect | null>(null);
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (typeof window === "undefined" || !vantaRef.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    (window as unknown as { THREE: typeof THREE }).THREE = THREE;

    let activeEffect: VantaEffect | null = null;
    let isCancelled = false;
    let animationFrameId: number;

    const initVanta = async () => {
      try {
        const vantaModule = await import("vanta/dist/vanta.birds.min");
        const BIRDS = vantaModule.default || vantaModule;

        if (isCancelled || !vantaRef.current) return;

        const width = vantaRef.current.clientWidth || window.innerWidth;
        const height = vantaRef.current.clientHeight || window.innerHeight;

        if (width === 0 || height === 0) {
          animationFrameId = requestAnimationFrame(initVanta);
          return;
        }

        if (vantaEffect.current) {
          vantaEffect.current.destroy();
          vantaEffect.current = null;
        }

        const isMobile = width < 768;

        activeEffect = BIRDS({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: !isMobile,
          touchControls: false,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          backgroundColor: isDark ? 0x070b14 : 0xf8fafc,
          color1: isDark ? 0x00b8e6 : 0x0369a1,
          color2: isDark ? 0x4f46e5 : 0x1d4ed8,
          colorMode: "lerpGradient",
          birdSize: isMobile ? 0.75 : 0.9,
          wingSpan: isMobile ? 16.0 : 20.0,
          speedLimit: isMobile ? 2.0 : 2.6,
          separation: isMobile ? 50.0 : 60.0,
          alignment: 20.0,
          cohesion: 20.0,
          quantity: isMobile ? 1.5 : 2.2,
        });

        vantaEffect.current = activeEffect;
      } catch (err) {
        console.warn("Vanta Birds initialization error:", err);
      }
    };

    animationFrameId = requestAnimationFrame(initVanta);

    return () => {
      isCancelled = true;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (activeEffect) {
        activeEffect.destroy();
      }
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!vantaEffect.current) return;

    vantaEffect.current.setOptions({
      backgroundColor: isDark ? 0x070b14 : 0xf8fafc,
      color1: isDark ? 0x00b8e6 : 0x0369a1,
      color2: isDark ? 0x4f46e5 : 0x1d4ed8,
    });
  }, [isDark]);

  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      <div
        ref={vantaRef}
        className="absolute inset-0 w-full h-full opacity-40 sm:opacity-45 dark:opacity-30 transition-opacity duration-700 transform-gpu will-change-transform"
      />
      <div className="absolute inset-0 bg-slate-900/5 dark:bg-[#070b14]/50 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/30 to-slate-50/80 dark:via-[#070b14]/40 dark:to-[#070b14]/90 pointer-events-none" />
    </div>
  );
}
