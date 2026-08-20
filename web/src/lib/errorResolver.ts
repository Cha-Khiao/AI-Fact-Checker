import { SystemAlertInfo } from "@/components/SystemAlertModal";
import { FactCheckResult } from "@/types";

export function resolveSystemAlert(
  errorMsg: string | null,
  result?: FactCheckResult | null
): SystemAlertInfo | null {
  // 1. Check direct error message from useFactCheck or HTTP
  if (errorMsg) {
    const err = errorMsg.toLowerCase();

    if (
      err.includes("ไม่สามารถเชื่อมต่อ") ||
      err.includes("failed to fetch") ||
      err.includes("network") ||
      err.includes("backend") ||
      err.includes("econnrefused") ||
      err.includes("fetch failed")
    ) {
      return {
        category: "server_error",
        source: "backend",
        title: "ระบบประมวลผลหลังบ้านขัดข้องชั่วคราว",
        badge: "Backend Incident / Server Down",
        reason:
          "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ประมวลผล (Backend) ได้ในขณะนี้ ระบบอาจกำลังอยู่ในระหว่างการรีสตาร์ต ปรับปรุงระบบ หรือเซิร์ฟเวอร์ขัดข้องชั่วคราว",
        suggestion:
          "กรุณาลองใหม่อีกครั้งในอีกสักครู่ หากปัญหายังคงอยู่ ระบบกำลังอยู่ในระหว่างการซ่อมแซมและตรวจสอบของทีมพัฒนา",
      };
    }

    if (
      err.includes("500") ||
      err.includes("502") ||
      err.includes("503") ||
      err.includes("504") ||
      err.includes("internal server") ||
      err.includes("pipeline_error")
    ) {
      return {
        category: "server_error",
        source: "backend",
        title: "ระบบกำลังซ่อมแซม / บริการไม่พร้อมใช้งาน",
        badge: "Server 500 / Maintenance",
        reason:
          "เซิร์ฟเวอร์ประมวลผลหลังบ้านเกิดข้อผิดพลาดภายใน (Internal Server Error) หรือระบบ AI และเครื่องมือค้นหากำลังอยู่ระหว่างการซ่อมบำรุง",
        suggestion:
          "ขออภัยในความไม่สะดวก กรุณากดปุ่มรับทราบเพื่อกลับสู่หน้าหลัก และลองตรวจสอบใหม่อีกครั้งในภายหลัง",
      };
    }

    if (
      err.includes("quota") ||
      err.includes("credit") ||
      err.includes("402") ||
      err.includes("429") ||
      err.includes("rate limit") ||
      err.includes("timeout") ||
      err.includes("deadline")
    ) {
      return {
        category: "ai_maintenance",
        source: "backend",
        title: "โควตาการให้บริการของระบบ AI เต็มชั่วคราว",
        badge: "AI Service Busy / Quota Exhausted",
        reason:
          "โควตาการสืบค้นข้อมูลหรือโมเดล AI ในระบบขณะนี้มีผู้ใช้งานพร้อมกันเป็นจำนวนมาก หรือโควตา API กำลังอยู่ในรอบการรีเซ็ตระบบ",
        suggestion:
          "กรุณารอสักครู่แล้วลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบเพื่อเติมโควตาเครดิตการสืบค้น",
      };
    }

    return {
      category: "general_error",
      source: "backend",
      title: "เกิดข้อผิดพลาดในการประมวลผล",
      badge: "Processing Error",
      reason: errorMsg,
      suggestion: "กรุณากดรับทราบเพื่อกลับสู่หน้าหลักและลองตรวจสอบข้อความใหม่อีกครั้ง",
    };
  }

  // 2. Check rejected or special verdicts from backend result
  if (result && result.verdict) {
    const summary = result.verdict.summary || "";
    const comparative = result.verdict.comparative_analysis || "";
    const isRejected = result.verdict.is_rejected || result.verdict.is_error;

    if (
      summary.includes("ไม่สามารถดึงเนื้อหา") ||
      summary.includes("SCRAPE_FAILED") ||
      summary.includes("404") ||
      comparative.includes("ไม่สามารถเข้าถึงหรือดึงข้อความจากลิงก์") ||
      comparative.includes("404 Not Found")
    ) {
      return {
        category: "link_404",
        source: "link",
        title: "ไม่สามารถเข้าถึงลิงก์ปลายทางได้ (404 / Link Error)",
        badge: "Broken Link / 404 Not Found",
        reason:
          "ระบบไม่สามารถดึงข้อมูลจากลิงก์ที่ระบุได้ หน้าเว็บปลายทางอาจถูกลบไปแล้ว, ลิงก์สะกดผิด, เกิดข้อผิดพลาด 404 Not Found, หรือเว็บไซต์ปลายทางปิดปรับปรุง",
        suggestion:
          "กรุณาตรวจสอบ URL ให้ถูกต้อง หรือใช้วิธีคัดลอกเนื้อหาข้อความข่าวสารมาวางลงในช่องตรวจสอบโดยตรง",
      };
    }

    if (
      summary.includes("ต้นทางปฏิเสธ") ||
      summary.includes("PLATFORM_BLOCKED") ||
      summary.includes("SOCIAL_BLOCKED") ||
      comparative.includes("ตั้งค่าเป็นส่วนตัว") ||
      comparative.includes("เข้าสู่ระบบ")
    ) {
      return {
        category: "platform_blocked",
        source: "platform",
        title: "แพลตฟอร์มต้นทางจำกัดการเข้าถึง (Private / Blocked)",
        badge: "Social Platform Restricted",
        reason:
          "โพสต์บนโซเชียลมีเดียต้นทางถูกตั้งค่าเป็นส่วนตัว (Private Account), ต้องเข้าสู่ระบบสมาชิก, หรือแพลตฟอร์มป้องกันการอ่านข้อมูลอัตโนมัติ",
        suggestion:
          "กรุณาคัดลอกเนื้อหาข้อความจากโพสต์นั้น แล้วนำมาวางในช่องตรวจสอบข้อความโดยตรง ระบบจะสามารถสืบค้นข้อเท็จจริงได้ตามปกติ",
      };
    }

    if (
      summary.includes("พบวิดีโอ") ||
      summary.includes("VIDEO_DETECTED") ||
      summary.includes("MULTIMEDIA_DETECTED") ||
      comparative.includes("วิดีโอคลิป")
    ) {
      return {
        category: "multimedia",
        source: "guardrail",
        title: "ระบบไม่รองรับไฟล์วิดีโอและคลิปเสียง",
        badge: "Multimedia Not Supported",
        reason:
          "ระบบ AI Fact-Checker เน้นการตรวจสอบและเทียบเคียงบทความข่าวสารและข้อความ ไม่รองรับการถอดเสียงหรือวิเคราะห์คลิปวิดีโอจาก TikTok / YouTube",
        suggestion:
          "กรุณาสรุปหรือคัดลอกข้อความประเด็นสำคัญที่ต้องการตรวจสอบมาวางในระบบเพื่อทำการเทียบเคียงข้อเท็จจริง",
      };
    }

    if (
      summary.includes("พบรูปภาพ") ||
      summary.includes("IMAGE_DETECTED") ||
      comparative.includes("รูปภาพ")
    ) {
      return {
        category: "multimedia",
        source: "guardrail",
        title: "ระบบไม่รองรับไฟล์รูปภาพ",
        badge: "Image Link Detected",
        reason:
          "ลิงก์ที่ระบุเป็นไฟล์รูปภาพ (JPG, PNG, WebP) ไม่ใช่บทความข่าวสารที่มีข้อความสำหรับตรวจสอบข้อเท็จจริง",
        suggestion:
          "กรุณาคัดลอกข้อความข่าวสารหรือพาดหัวข่าวที่ปรากฏในรูปภาพมาวางตรวจสอบโดยตรง",
      };
    }

    if (
      summary.includes("ความเสี่ยงต่อความปลอดภัย") ||
      summary.includes("GAMBLING_DETECTED") ||
      comparative.includes("การพนัน")
    ) {
      return {
        category: "gambling",
        source: "guardrail",
        title: "ตรวจพบเนื้อหาที่ไม่อนุญาต / มีความเสี่ยง",
        badge: "Security Risk / Gambling Link",
        reason:
          "ลิงก์หรือเนื้อหาดังกล่าวมีความเชื่อมโยงกับเว็บไซต์การพนันออนไลน์หรือลิงก์ที่มีความเสี่ยงต่อความปลอดภัยทางไซเบอร์",
        suggestion:
          "ระบบขอระงับการประมวลผลเพื่อความปลอดภัยของผู้ใช้งาน กรุณาตรวจสอบเฉพาะเนื้อหาข่าวสารที่เป็นประโยชน์ต่อสาธารณะ",
      };
    }

    // If result is rejected
    if (isRejected) {
      return {
        category: "general_error",
        source: "link",
        title: "ไม่สามารถประมวลผลข้อมูลที่ระบุได้",
        badge: "Verification Incomplete",
        reason: summary || comparative || "ข้อมูลที่ส่งเข้ามาไม่สามารถนำไปเทียบเคียงกับฐานข้อมูลข่าวสารได้",
        suggestion: "กรุณาตรวจสอบความถูกต้องของข้อมูล หรือคัดลอกข้อความข่าวมาวางตรวจสอบใหม่อีกครั้ง",
      };
    }
  }

  return null;
}
