"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export type ServerStatus = "checking" | "online" | "demo_offline";

interface HealthState {
  status: ServerStatus;
  lastCheck: number;
}

let globalState: HealthState = {
  status: "checking",
  lastCheck: 0,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

let isCheckingInProgress = false;

export async function checkServerHealth(): Promise<ServerStatus> {
  if (isCheckingInProgress) return globalState.status;
  isCheckingInProgress = true;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${API_BASE}/health`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.status === "healthy" || data.status === "online") {
        globalState = { status: "online", lastCheck: Date.now() };
      } else {
        globalState = { status: "online", lastCheck: Date.now() };
      }
    } else {
      globalState = { status: "demo_offline", lastCheck: Date.now() };
    }
  } catch {
    globalState = { status: "demo_offline", lastCheck: Date.now() };
  } finally {
    isCheckingInProgress = false;
    notify();
  }

  return globalState.status;
}

// Initial health check on client load
if (typeof window !== "undefined") {
  checkServerHealth();
  setInterval(checkServerHealth, 10000);
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): HealthState {
  return globalState;
}

const SERVER_SNAPSHOT: HealthState = { status: "checking", lastCheck: 0 };

function getServerSnapshot(): HealthState {
  return SERVER_SNAPSHOT;
}

export function useHealthCheck() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    status: state.status,
    isOnline: state.status === "online",
    isDemoOffline: state.status === "demo_offline",
    isChecking: state.status === "checking",
    checkHealth: checkServerHealth,
    lastCheck: state.lastCheck,
  };
}
