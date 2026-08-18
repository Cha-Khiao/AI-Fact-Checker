import { ScoreLevel } from "@/types";

export function stripMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/\[\^?\d+\]/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#+\s+/g, "")
    .replace(/^[*-]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .trim();
}

export function cleanFactText(text: string): string {
  if (!text) return "";
  let clean = stripMarkdown(text);
  clean = clean.replace(/^(สรุปคือ|ข้อเท็จจริงคือ|จากการตรวจสอบพบว่า|ความจริงคือ)[:\s]*/i, "");
  return clean.trim();
}

export function cleanForCaption(text: string): string {
  if (!text) return "";
  return stripMarkdown(text).replace(/\n{3,}/g, "\n\n").trim();
}

export function getScoreColor(score: ScoreLevel | number): string {
  switch (score) {
    case 5:
    case 4:
      return "bg-emerald-500 text-white";
    case 3:
      return "bg-amber-500 text-white";
    case 2:
      return "bg-orange-500 text-white";
    case 1:
      return "bg-rose-500 text-white";
    default:
      return "bg-slate-500 text-white";
  }
}

export function getScoreMetadata(score: ScoreLevel | number) {
  switch (score) {
    case 5:
      return {
        score: 5,
        percentage: 100,
        label: "สอดคล้องสมบูรณ์",
        subLabel: "ข้อมูลเป็นความจริง มีหลักฐานยืนยันตรงกันครบถ้วน",
        standardLabel: "ความจริงสมบูรณ์ (True)",
        color: "text-emerald-600 dark:text-emerald-400",
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
        gaugeColor: "#10b981",
        mascotState: "true" as const,
      };
    case 4:
      return {
        score: 4,
        percentage: 75,
        label: "สอดคล้องส่วนใหญ่",
        subLabel: "มีเค้าความจริงสูง รายละเอียดส่วนใหญ่ถูกต้อง",
        standardLabel: "จริงเป็นส่วนใหญ่ (Mostly True)",
        color: "text-emerald-600 dark:text-emerald-400",
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
        gaugeColor: "#10b981",
        mascotState: "true" as const,
      };
    case 3:
      return {
        score: 3,
        percentage: 50,
        label: "ข้อมูลก้ำกึ่ง / ยังไม่มีข้อยุติ",
        subLabel: "มีข้อมูลหลากหลายมุมมอง หรือเป็นเหตุการณ์สดที่ยังรอหลักฐานเพิ่มเติม",
        standardLabel: "ยังไม่มีข้อยุติ (Inconclusive)",
        color: "text-amber-600 dark:text-amber-400",
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
        gaugeColor: "#f59e0b",
        mascotState: "warning" as const,
      };
    case 2:
      return {
        score: 2,
        percentage: 25,
        label: "ข้อมูลบิดเบือน",
        subLabel: "พบการบิดเบือนข้อเท็จจริง นำภาพเก่ามาเล่าใหม่ หรือตัดต่อเนื้อหา",
        standardLabel: "ข้อมูลบิดเบือน (Mostly False)",
        color: "text-orange-600 dark:text-orange-400",
        badgeBg: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800",
        gaugeColor: "#f97316",
        mascotState: "fake" as const,
      };
    case 1:
    default:
      return {
        score: 1,
        percentage: 0,
        label: "ข้อมูลเท็จ / ข่าวปลอม",
        subLabel: "ไม่มีมูลความจริง หรือถูกแถลงชี้แจงหักล้างอย่างเป็นทางการแล้ว",
        standardLabel: "ข่าวปลอม / ถูกหักล้าง (False / Debunked)",
        color: "text-rose-600 dark:text-rose-400",
        badgeBg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
        gaugeColor: "#f43f5e",
        mascotState: "fake" as const,
      };
  }
}
