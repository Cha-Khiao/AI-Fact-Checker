/**
 * Comprehensive Universal Date & Time Extraction & Formatting for Thai & Global Web/Social Media.
 */

const THAI_MONTHS_MAP: Record<string, number> = {
  "ม.ค.": 1, "มกราคม": 1, "มกรา": 1,
  "ก.พ.": 2, "กุมภาพันธ์": 2, "กุมภา": 2,
  "มี.ค.": 3, "มีนาคม": 3, "มีนา": 3,
  "เม.ย.": 4, "เมษายน": 4, "เมษา": 4,
  "พ.ค.": 5, "พฤษภาคม": 5, "พฤษภา": 5,
  "มิ.ย.": 6, "มิถุนายน": 6, "มิถุนา": 6,
  "ก.ค.": 7, "กรกฎาคม": 7, "กรกฎา": 7,
  "ส.ค.": 8, "สิงหาคม": 8, "สิงหา": 8,
  "ก.ย.": 9, "กันยายน": 9, "กันยา": 9,
  "ต.ค.": 10, "ตุลาคม": 10, "ตุลา": 10,
  "พ.ย.": 11, "พฤศจิกายน": 11, "พฤศจิกา": 11,
  "ธ.ค.": 12, "ธันวาคม": 12, "ธันวา": 12,
};

const ENGLISH_MONTHS_MAP: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, september: 9, sept: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

const THAI_MONTHS_SHORT = [
  "", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

const NOISE_PATTERNS = [
  /อ่านล่าสุด/gi,
  /ผู้เข้าชม/gi,
  /ยอดวิว/gi,
  /ความคิดเห็นเมื่อ/gi,
  /ข่าวแนะนำ/gi,
  /ข่าวยอดนิยม/gi,
  /อัปเดตระบบ/gi,
  /เวอร์ชัน\s*\d+/gi,
  /copyright/gi,
  /สงวนลิขสิทธิ์/gi,
  /โทร\s*\d+/gi,
];

export function formatThaiDate(d: Date, includeTime = true): string {
  const yearTh = d.getFullYear() + (d.getFullYear() < 2400 ? 543 : 0);
  const monthName = THAI_MONTHS_SHORT[d.getMonth() + 1];
  const timeStr = includeTime && (d.getHours() > 0 || d.getMinutes() > 0)
    ? ` เวลา ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} น.`
    : "";
  return `${d.getDate()} ${monthName} ${yearTh}${timeStr}`;
}

export function computeRelativeThaiTime(targetDate: Date, nowDate = new Date()): string {
  const diffMs = nowDate.getTime() - targetDate.getTime();
  const totalSec = Math.floor(diffMs / 1000);

  if (totalSec < 60) return "เมื่อสักครู่นี้";

  const totalMin = Math.floor(totalSec / 60);
  if (totalMin < 60) return `${totalMin} นาทีที่แล้ว`;

  const totalHours = Math.floor(totalSec / 3600);
  if (totalHours < 24) return `${totalHours} ชั่วโมงที่ผ่านมา`;

  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (totalDays === 1) {
    if (targetDate.getHours() > 0 || targetDate.getMinutes() > 0) {
      return `เมื่อวานนี้ เวลา ${String(targetDate.getHours()).padStart(2, "0")}:${String(targetDate.getMinutes()).padStart(2, "0")} น.`;
    }
    return "เมื่อวานนี้";
  }

  if (totalDays < 7) return `${totalDays} วันก่อน`;

  const totalWeeks = Math.floor(totalDays / 7);
  if (totalWeeks < 5) return `${totalWeeks} สัปดาห์ก่อน`;

  const totalMonths = Math.floor(totalDays / 30);
  if (totalMonths < 12) {
    const exact = formatThaiDate(targetDate, false);
    return `${totalMonths} เดือนก่อน (${exact})`;
  }

  const totalYears = Math.floor(totalDays / 365);
  const exact = formatThaiDate(targetDate, false);
  return `${totalYears} ปีก่อน (${exact})`;
}

export function parseStructuredOrIsoDate(rawStr: string): Date | null {
  if (!rawStr) return null;
  const s = rawStr.trim();

  // 1. Unix timestamp (seconds or ms)
  if (/^\d{10}(\d{3})?$/.test(s)) {
    const ts = parseInt(s, 10);
    return new Date(s.length === 10 ? ts * 1000 : ts);
  }

  // 2. ISO 8601
  const parsed = Date.parse(s);
  if (!isNaN(parsed)) {
    return new Date(parsed);
  }

  return null;
}

export function extractUniversalPublishDate(text: string, metadataDate?: string): string | null {
  // 1. Metadata check first
  if (metadataDate) {
    const d = parseStructuredOrIsoDate(metadataDate);
    if (d && !isNaN(d.getTime())) {
      return computeRelativeThaiTime(d);
    }
  }

  let clean = (text || "").trim();
  if (!clean) return null;

  // Explicit metadata header from scraper (highest accuracy)
  const metaHeader = clean.match(/\[เวลาเผยแพร่ของข่าว\/โพสต์\]:\s*([^\n\r]+)/);
  if (metaHeader) {
    const metaVal = metaHeader[1].trim();
    const d = parseStructuredOrIsoDate(metaVal);
    if (d && !isNaN(d.getTime())) {
      return computeRelativeThaiTime(d);
    }
  }

  // 2. Direct ISO in text (supporting milliseconds .000)
  const isoMatch = clean.match(/\b(20\d{2}-\d{2}-\d{2}(?:T|\s)\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)\b/);
  if (isoMatch) {
    const d = parseStructuredOrIsoDate(isoMatch[1]);
    if (d && !isNaN(d.getTime())) {
      return computeRelativeThaiTime(d);
    }
  }

  // Remove noise
  for (const np of NOISE_PATTERNS) {
    clean = clean.replace(np, " ");
  }

  // 3. Explicit post header prefix (e.g. โพสต์เมื่อ: 9 ชม. ที่ผ่านมา, เผยแพร่เมื่อ: 19 ส.ค. 2569)
  const explicitPost = clean.match(/(?:โพสต์เมื่อ|เผยแพร่เมื่อ|อัปเดตเมื่อ|ลงข่าวเมื่อ|ข่าวประจำวันที่|รายงานเมื่อ)\s*[:：]?\s*([^\n\r,]{3,45})/i);
  if (explicitPost) {
    const headerDate = extractUniversalPublishDate(explicitPost[1]);
    if (headerDate) return headerDate;
  }

  // 4. Thai relative: 9 ชั่วโมงที่ผ่านมา, 9 ชม.ที่ผ่านมา, 15 นาทีที่แล้ว, 3 วันก่อน, 2 สัปดาห์ก่อน, 1 ปีที่แล้ว
  const relThai = clean.match(/(\d{1,3})\s*(วินาที|วิ\.|นาที|น\.|ชั่วโมง|ชม\.|ช\.ม\.|วัน|ว\.|สัปดาห์|อาทิตย์|เดือน|ปี)\s*(ที่ผ่านมา|ที่แล้ว|ก่อน|ago)?/i);
  if (relThai) {
    const val = parseInt(relThai[1], 10);
    const unit = relThai[2];
    const suffix = relThai[3] || (unit.includes("ชม") ? "ที่ผ่านมา" : "ที่แล้ว");

    if (unit.includes("วินาที") || unit === "วิ.") return `${val} วินาทีที่แล้ว`;
    if (unit.includes("นาที") || unit === "น.") return `${val} นาทีที่แล้ว`;
    if (unit.includes("ชั่วโมง") || unit.includes("ชม")) return `${val} ชั่วโมงที่ผ่านมา`;
    if (unit.includes("วัน") || unit === "ว.") return `${val} วันก่อน`;
    if (unit.includes("สัปดาห์") || unit.includes("อาทิตย์")) return `${val} สัปดาห์ก่อน`;
    if (unit.includes("เดือน")) return `${val} เดือนก่อน`;
    if (unit.includes("ปี")) return `${val} ปีก่อน`;
    return `${val} ${unit} ${suffix}`.replace(/\s+/g, " ").trim();
  }

  // 5. Social media dot / short relative (e.g. · 9 ชม., · 2 วัน, · 15 นาที)
  const socialDot = clean.match(/(?:·|•|\s|^)(\d{1,3})\s*(ชม\.|ชั่วโมง|นาที|น\.|วัน|ว\.|สัปดาห์|เดือน|ปี)(?:\s*(ที่ผ่านมา|ที่แล้ว|ก่อน))?/i);
  if (socialDot) {
    const val = parseInt(socialDot[1], 10);
    const unit = socialDot[2];
    if (unit.includes("ชม") || unit.includes("ชั่วโมง")) return `${val} ชั่วโมงที่ผ่านมา`;
    if (unit.includes("นาที") || unit === "น.") return `${val} นาทีที่แล้ว`;
    if (unit.includes("วัน") || unit === "ว.") return `${val} วันก่อน`;
    if (unit.includes("สัปดาห์")) return `${val} สัปดาห์ก่อน`;
  }

  // 6. Thai explicit date (e.g. 19 ส.ค. 2569, วันที่ 19 สิงหาคม พ.ศ. 2569 เวลา 14:30 น.)
  const thaiDateMatch = clean.match(
    /(?:((?:คืน)?วัน(?:จันทร์|อังคาร|พุธ|พฤหัสบดี|พฤหัส|ศุกร์|เสาร์|อาทิตย์))\s*(?:ที่)?)?\s*(\d{1,2})\s*(ม\.ค\.|มกราคม|ก\.พ\.|กุมภาพันธ์|มี\.ค\.|มีนาคม|เม\.ย\.|เมษายน|พ\.ค\.|พฤษภาคม|มิ\.ย\.|มิถุนายน|ก\.ค\.|กรกฎาคม|ส\.ค\.|สิงหาคม|ก\.ย\.|กันยายน|ต\.ค\.|ตุลาคม|พ\.ย\.|พฤศจิกายน|ธ\.ค\.|ธันวาคม)\s*(?:พ\.ศ\.|ค\.ศ\.)?\s*(\d{2,4})(?:\s*เวลา\s*(\d{1,2}[\.:]\d{2})\s*(?:น\.|น)?)?/i
  );
  if (thaiDateMatch) {
    const day = parseInt(thaiDateMatch[2], 10);
    const monthStr = thaiDateMatch[3];
    const yearRaw = parseInt(thaiDateMatch[4], 10);
    const timeStr = thaiDateMatch[5] ? thaiDateMatch[5].replace(".", ":") : "";
    const month = THAI_MONTHS_MAP[monthStr] || 1;

    let year = yearRaw;
    if (yearRaw < 100) year = yearRaw + 2500 - 543;
    else if (yearRaw > 2400) year = yearRaw - 543;

    try {
      const now = new Date();
      let hour = 0;
      let min = 0;
      if (timeStr && timeStr.includes(":")) {
        const parts = timeStr.split(":");
        hour = parseInt(parts[0], 10);
        min = parseInt(parts[1], 10);
      }
      const d = new Date(year, month - 1, day, hour, min);
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 7) {
        const timeDisplay = timeStr ? ` เวลา ${timeStr} น.` : "";
        return `${day} ${monthStr} ${year + 543}${timeDisplay}`;
      }
      return computeRelativeThaiTime(d, now);
    } catch {
      // Fallback
    }
  }

  // 7. English relative: 9 hours ago, 15 mins ago, 3 days ago
  const engRel = clean.match(/(\d{1,3})\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|wk|wks|week|weeks|mo|mos|month|months|y|yr|yrs|year|years)\s*ago/i);
  if (engRel) {
    const val = parseInt(engRel[1], 10);
    const unit = engRel[2].toLowerCase();
    if (["s", "sec", "secs", "second", "seconds"].includes(unit)) return "เมื่อสักครู่นี้";
    if (["m", "min", "mins", "minute", "minutes"].includes(unit)) return `${val} นาทีที่แล้ว`;
    if (["h", "hr", "hrs", "hour", "hours"].includes(unit)) return `${val} ชั่วโมงที่ผ่านมา`;
    if (["d", "day", "days"].includes(unit)) return `${val} วันก่อน`;
    if (["w", "wk", "wks", "week", "weeks"].includes(unit)) return `${val} สัปดาห์ก่อน`;
    if (["mo", "mos", "month", "months"].includes(unit)) return `${val} เดือนก่อน`;
    if (["y", "yr", "yrs", "year", "years"].includes(unit)) return `${val} ปีก่อน`;
  }

  // 8. Keywords: เมื่อวานนี้ / วันนี้
  if (/เมื่อวาน(นี้)?/i.test(clean)) {
    const timeMatch = clean.match(/เมื่อวาน(?:นี้)?(?:\s*เวลา)?\s*(\d{1,2}[:.]\d{2})/i);
    if (timeMatch) return `เมื่อวานนี้ เวลา ${timeMatch[1].replace(".", ":")} น.`;
    return "เมื่อวานนี้";
  }

  if (/(?:โพสต์เมื่อ|เผยแพร่|อัปเดต)\s*:\s*วันนี้|วันนี้/i.test(clean)) {
    const timeMatch = clean.match(/วันนี้(?:\s*เวลา)?\s*(\d{1,2}[:.]\d{2})/i);
    if (timeMatch) return `วันนี้ เวลา ${timeMatch[1].replace(".", ":")} น.`;
    return "วันนี้";
  }

  // 9. English explicit date: August 19, 2026 / 19 Aug 2026
  const engDate = clean.match(/(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[,\s]+(\d{4})/i);
  if (engDate) {
    const day = parseInt(engDate[1], 10);
    const monthKey = engDate[2].toLowerCase().slice(0, 3);
    const month = ENGLISH_MONTHS_MAP[monthKey] || 1;
    const year = parseInt(engDate[3], 10);
    const d = new Date(year, month - 1, day);
    return computeRelativeThaiTime(d);
  }

  return null;
}
