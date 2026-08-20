"use client";

import { useState, useCallback, useRef } from "react";
import { FactCheckResult, HistoryItem } from "@/types";
import { getDemoFactCheckResult } from "@/lib/demoData";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

<<<<<<< HEAD
=======
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

>>>>>>> origin/dev
const HISTORY_KEY = "ai_factcheck_history_v1";

export function useFactCheck() {
  const [loading, setLoading] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      return saved ? (JSON.parse(saved) as HistoryItem[]) : [];
    } catch (e) {
      console.error("Failed to load local history", e);
      return [];
    }
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const saveToHistory = useCallback((res: FactCheckResult, rawInput: string) => {
    try {
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        input_text: rawInput.length > 80 ? rawInput.slice(0, 80) + "..." : rawInput,
        score: res.verdict.score,
        summary: res.verdict.summary,
        ref_count: res.references?.length || 0,
      };

      setHistory((prev) => {
        const filtered = prev.filter((item) => item.input_text !== newItem.input_text);
        const updated = [newItem, ...filtered].slice(0, 15);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error("Failed to save history", e);
    }
  }, []);

  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(HISTORY_KEY);
      setHistory([]);
    } catch (e) {
      console.error("Failed to clear history", e);
    }
  }, []);

  const runDemoSimulation = useCallback(
    async (demoData: FactCheckResult, rawInput: string) => {
      setProgressPct(20);
      setProgressMessage("กำลังสกัดประเด็นและคัดกรองเนื้อหา (Demo Mode)...");
      await new Promise((r) => setTimeout(r, 250));

      setProgressPct(55);
      setProgressMessage("กำลังสืบค้นสื่อหลักและฐานข้อมูลทางการ...");
      await new Promise((r) => setTimeout(r, 300));

      setProgressPct(85);
      setProgressMessage("กำลังประเมินหลักฐานและเรียบเรียงบทวิเคราะห์...");
      await new Promise((r) => setTimeout(r, 250));

      setProgressPct(100);
      setProgressMessage("วิเคราะห์เสร็จสมบูรณ์!");
      const finalDemoResult: FactCheckResult = {
        ...demoData,
        is_demo_mode: true,
      };
      setResult(finalDemoResult);
      saveToHistory(finalDemoResult, rawInput);
      setError(null);
      setLoading(false);
    },
    [saveToHistory]
  );

  const checkNews = useCallback(
    async (inputText: string) => {
      const cleanInput = inputText.trim();
      if (!cleanInput) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);
      setResult(null);
      setProgressPct(5);
      setProgressMessage("กำลังเริ่มต้นเชื่อมต่อระบบ AI...");

      let streamSucceeded = false;

<<<<<<< HEAD
      // 1. Try Live SSE Stream API from Backend
=======
>>>>>>> origin/dev
      try {
        const response = await fetch(`${API_BASE}/api/factcheck/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: cleanInput }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP Error ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body for streaming");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              const jsonStr = trimmed.slice(6);
              try {
                const payload = JSON.parse(jsonStr);
                if (payload.type === "progress") {
                  setProgressPct(payload.pct || 10);
                  setProgressMessage(payload.message || "กำลังประมวลผล...");
                } else if (payload.type === "complete") {
                  streamSucceeded = true;
                  const finalData = payload.data as FactCheckResult;
                  setProgressPct(100);
                  setProgressMessage("วิเคราะห์เสร็จสมบูรณ์!");
                  setResult(finalData);
                  saveToHistory(finalData, cleanInput);
                  break;
                } else if (payload.type === "error") {
                  throw new Error(payload.message || "เกิดข้อผิดพลาดในการวิเคราะห์");
                }
              } catch (parseErr) {
                console.warn("SSE JSON parse error:", parseErr);
              }
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        console.warn("Streaming mode failed, attempting REST fallback...", err);
      }

<<<<<<< HEAD
      // 2. Try REST Fallback API from Backend
=======
>>>>>>> origin/dev
      if (!streamSucceeded && !controller.signal.aborted) {
        try {
          setProgressPct(50);
          setProgressMessage("กำลังประมวลผลผ่านช่องทางสำรอง...");

          const res = await fetch(`${API_BASE}/api/factcheck`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: cleanInput }),
            signal: controller.signal,
          });

          if (!res.ok) {
            throw new Error(`ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (Code ${res.status})`);
          }

          const data = (await res.json()) as FactCheckResult;
          setProgressPct(100);
          setProgressMessage("วิเคราะห์เสร็จสมบูรณ์!");
          setResult(data);
          saveToHistory(data, cleanInput);
<<<<<<< HEAD
          setLoading(false);
          return;
        } catch {
          // Check if input matches one of the 10 rich demo presets
          const demoFallback = getDemoFactCheckResult(cleanInput);
          if (demoFallback && !controller.signal.aborted) {
            await runDemoSimulation(demoFallback, cleanInput);
            return;
          }

          if (!controller.signal.aborted) {
            const errorMsg = `ไม่สามารถเชื่อมต่อไปยัง Backend (${API_BASE}) ได้ในขณะนี้\n💡 คุณสามารถคลิกเลือก "ตัวอย่างประเด็นทดสอบ (10 ตัวเลือก)" เพื่อทดลองระบบในโหมด Demo แบบออฟไลน์ได้ทันที 100% โดยไม่ต้องพึ่งพาเซิร์ฟเวอร์!`;
=======
        } catch (restErr: unknown) {
          if (!(restErr instanceof Error) || restErr.name !== "AbortError") {
            const errorMsg =
              restErr instanceof Error && restErr.message !== "Failed to fetch"
                ? restErr.message
                : `ไม่สามารถเชื่อมต่อไปยัง Backend (${API_BASE}) ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์ Render ทำงานอยู่ หรือตรวจสอบตัวแปร NEXT_PUBLIC_API_URL ใน Vercel`;
>>>>>>> origin/dev
            setError(errorMsg);
          }
        }
      }

      setLoading(false);
    },
    [saveToHistory, runDemoSimulation]
  );

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
    setProgressPct(0);
    setProgressMessage("");
    setResult(null);
    setError(null);
  }, []);

  const restoreResult = useCallback((cached: FactCheckResult) => {
    setLoading(false);
    setError(null);
    setProgressPct(100);
    setProgressMessage("วิเคราะห์เสร็จสมบูรณ์!");
    setResult(cached);
  }, []);

  return {
    loading,
    progressPct,
    progressMessage,
    result,
    error,
    history,
    checkNews,
    reset,
    restoreResult,
    clearHistory,
  };
}
