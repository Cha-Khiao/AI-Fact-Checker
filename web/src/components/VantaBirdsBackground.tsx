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

    // Check if user requested reduced motion (accessibility & low battery mode)
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    // Attach THREE to window globally for Vanta internal geometry constructors
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

        // Adaptive performance scaling for Mobile vs Desktop
        const isMobile = width < 768;

        activeEffect = BIRDS({
          el: vantaRef.current,
          THREE: THREE,
          mouseControls: !isMobile, // Disable mouse tracking overhead on mobile
          touchControls: false,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          backgroundColor: isDark ? 0x070b14 : 0xf8fafc,
          color1: isDark ? 0x00d2ff : 0x0284c7, // Electric Cyan / Sky
          color2: isDark ? 0x6366f1 : 0x2563eb, // Indigo / Royal Blue
          colorMode: "lerpGradient",
          birdSize: isMobile ? 0.9 : 1.15,
          wingSpan: isMobile ? 18.0 : 24.0,
          speedLimit: isMobile ? 2.8 : 3.6,
          separation: isMobile ? 55.0 : 65.0,
          alignment: 25.0,
          cohesion: 25.0,
          quantity: isMobile ? 2.0 : 3.2, // Lightweight 2.0 on mobile to preserve battery
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

  // Seamless in-place color update on Theme toggle without resetting flight physics
  useEffect(() => {
    if (!vantaEffect.current) return;

    vantaEffect.current.setOptions({
      backgroundColor: isDark ? 0x070b14 : 0xf8fafc,
      color1: isDark ? 0x00d2ff : 0x0284c7,
      color2: isDark ? 0x6366f1 : 0x2563eb,
    });
  }, [isDark]);

  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Hardware-accelerated 3D Vanta.js Birds Canvas Layer */}
      <div
        ref={vantaRef}
        className="absolute inset-0 w-full h-full opacity-80 sm:opacity-85 dark:opacity-75 transition-opacity duration-700 transform-gpu will-change-transform"
      />

      {/* Atmospheric Soft Vignette Diffuser */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/15 to-slate-50/60 dark:via-[#070b14]/15 dark:to-[#070b14]/70 pointer-events-none" />
    </div>
  );
}
