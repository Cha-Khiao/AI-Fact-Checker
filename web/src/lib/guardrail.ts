export interface GuardrailViolation {
  category: "multimedia" | "gambling" | "illegal" | "personal" | "homepage";
  title: string;
  badge: string;
  badgeColor: string;
  borderColor: string;
  reason: string;
  suggestion: string;
}

const VIDEO_PLATFORMS = [
  "youtube.com",
  "youtu.be",
  "tiktok.com",
  "bilibili.com",
  "twitch.tv",
  "vimeo.com",
  "dailymotion.com",
  "soundcloud.com",
  "spotify.com",
];

const VIDEO_URL_PATTERNS = [
  /instagram\.com\/(?:reel|reels)\//i,
  /facebook\.com\/(?:reel|watch)\//i,
  /fb\.watch\//i,
];

const FILE_EXTENSIONS = [
  /\.(mp4|mp3|wav|avi|mov|mkv|flv|webm|m4a|aac|ogg)(?:\?.*)?$/i,
  /\.(jpg|jpeg|png|gif|webp|bmp|svg)(?:\?.*)?$/i,
  /\.(pdf|zip|rar|7z|exe|apk|dmg|iso|docx|xlsx|pptx)(?:\?.*)?$/i,
];

const GAMBLING_KEYWORDS = [
  "สล็อต",
  "slot",
  "pgslot",
  "เว็บตรง",
  "บาคาร่า",
  "แทงบอล",
  "คาสิโนออนไลน์",
  "เครดิตฟรี",
  "ยูสใหม่แตกง่าย",
  "ufa",
  "bet777",
  "888bet",
  "สูตรบาคาร่า",
  "ฝากถอนไม่มีขั้นต่ำ",
  "แจกเครดิต",
  "เว็บหวย",
  "หวยออนไลน์",
  "ปั่นสล็อต",
  "เว็บสล็อต",
  "แจกยูส",
  "เดิมพันออนไลน์",
  "ไฮโลออนไลน์",
];

const ILLEGAL_KEYWORDS = [
  "ขายยาบ้า",
  "ขายยาไอซ์",
  "ขายยาเค",
  "รับเปิดบัญชีม้า",
  "รับจ้างเปิดบัญชี",
  "ขายปืนเถื่อน",
  "ปืนไม่มีทะเบียน",
  "รับแฮก",
  "รับแฮกเฟส",
  "รับทำวุฒิปลอม",
  "ขายพอต",
  "ขายบุหรี่ไฟฟ้า",
  "รับจ้างทวงหนี้",
  "เงินกู้นอกระบบดอกร้อยละ",
  "ขายสารเสพติด",
];

const NEWS_CONTEXT_KEYWORDS = [
  "จับ",
  "ทลาย",
  "เตือนภัย",
  "ตำรวจ",
  "กองปราบ",
  "สืบสวน",
  "แถลง",
  "จับกุม",
  "บุกค้น",
  "คดี",
  "ดำเนินคดี",
  "สอท.",
  "ดีเอสไอ",
  "บช.สอท.",
  "ปอท.",
  "ศปอส.ตร.",
  "ลักลอบ",
  "ศาล",
  "หมายจับ",
  "สอบสวน",
  "รวบ",
  "ยึด",
  "แถลงข่าว",
  "ตรวจค้น",
  "ปปส.",
  "ป.ป.ส.",
  "ปปง.",
  "ป.ป.ง.",
];

const CASUAL_PERSONAL_PHRASES = [
  "วันนี้กินข้าวกับ",
  "คิดถึงเธอจัง",
  "เหนื่อยกับชีวิต",
  "วันนี้ไปเที่ยวไหนดี",
  "สวัสดีวันจันทร์",
  "สวัสดีตอนเช้า",
  "สุขสันต์วันเกิด",
  "ฝันดีนะทุกคน",
  "รักนะจุ๊บๆ",
  "อกหักจัง",
  "เหงาจังเลย",
  "นอนไม่หลับ",
  "หิวข้าวมาก",
  "ไปนอนก่อนนะ",
  "วันนี้ทำอะไรดี",
  "ตื่นสายจังวันนี้",
  "เบื่อจังเลย",
];

export function validateFactCheckInput(text: string): GuardrailViolation | null {
  const trimmed = (text || "").trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();

  const rawUrls =
    trimmed.match(
      /(?:https?:\/\/[^\s<>"'\[\]{}()]+|(?:www\.)?(?:facebook\.com|fb\.com|fb\.me|x\.com|twitter\.com|instagram\.com|today\.line\.me|line\.me|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:co\.th|or\.th|go\.th|com|org|net|news|co|info|app))\/?[^\s<>"'\[\]{}()]*)/gi
    ) || [];

  const textWithoutUrls = trimmed
    .replace(/(?:https?:\/\/[^\s<>"'\[\]{}()]+|(?:www\.)?(?:facebook\.com|fb\.com|fb\.me|x\.com|twitter\.com|instagram\.com|today\.line\.me|line\.me|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:co\.th|or\.th|go\.th|com|org|net|news|co|info|app))\/?[^\s<>"'\[\]{}()]*)/gi, "")
    .trim();

  if (rawUrls.length > 0 && textWithoutUrls.length < 5) {
    for (const rawUrl of rawUrls) {
      try {
        const fullUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
        const parsed = new URL(fullUrl);
        const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
        const path = parsed.pathname.toLowerCase().replace(/\/+$/, "");
        const search = parsed.search.toLowerCase();

        if (
          host === "facebook.com" ||
          host === "m.facebook.com" ||
          host === "web.facebook.com" ||
<<<<<<< HEAD
          host === "fb.com" ||
          host === "fb.watch"
        ) {
          const hasPost =
            path.includes("/share") ||
=======
          host === "fb.com"
        ) {
          const hasPost =
>>>>>>> origin/dev
            path.includes("/posts") ||
            path.includes("/story.php") ||
            path.includes("/permalink") ||
            path.includes("/photos") ||
<<<<<<< HEAD
            path.includes("/photo") ||
            path.includes("/videos") ||
            path.includes("/watch") ||
            path.includes("/groups/") ||
            path.includes("/events/") ||
            search.includes("fbid=") ||
            search.includes("story_fbid=") ||
            search.includes("post_id=") ||
            search.includes("set=");
=======
            search.includes("fbid=") ||
            search.includes("story_fbid=");
>>>>>>> origin/dev

          if (!hasPost || path === "" || path === "/" || path === "/home.php") {
            return {
              category: "homepage",
              title: "กรุณาระบุลิงก์โพสต์ Facebook ที่เจาะจง",
              badge: "หน้าแรกโซเชียล",
              badgeColor: "bg-blue-500/15 text-blue-600 dark:text-cyan-300 ring-1 ring-blue-500/30",
              borderColor: "border-t-blue-500",
              reason:
                "ลิงก์ที่ระบุเป็นหน้าแรกหรือหน้าโปรไฟล์ของ Facebook ซึ่งไม่มีเนื้อหาโพสต์ข่าวสารให้ระบบตรวจสอบ",
              suggestion:
                "กรุณาคัดลอกลิงก์ของ 'โพสต์ที่ต้องการตรวจสอบโดยตรง' (คลิกที่เวลาของโพสต์เพื่อคัดลอกลิงก์) หรือคัดลอกข้อความในโพสต์มาวางแทน",
            };
          }
        }

        if (host === "x.com" || host === "twitter.com" || host === "mobile.twitter.com") {
          const hasTweet = path.includes("/status/");
          if (!hasTweet || path === "" || path === "/" || path === "/home" || path === "/explore") {
            return {
              category: "homepage",
              title: "กรุณาระบุลิงก์โพสต์ X (Twitter) ที่เจาะจง",
              badge: "หน้าแรกโซเชียล",
              badgeColor: "bg-slate-500/15 text-slate-700 dark:text-slate-300 ring-1 ring-slate-500/30",
              borderColor: "border-t-slate-500",
              reason:
                "ลิงก์ที่ระบุเป็นหน้าแรกหรือหน้าบัญชีผู้ใช้ X (Twitter) ซึ่งไม่มีเนื้อหาโพสต์หรือประเด็นข่าวที่สามารถตรวจสอบได้",
              suggestion:
                "กรุณาคัดลอกลิงก์ของทวีต/โพสต์ที่ต้องการตรวจสอบโดยตรง (ที่มี /status/...) หรือพิมพ์ข้อความข่าวสารมาวางแทน",
            };
          }
        }

        if (host === "instagram.com" || host === "instagr.am") {
          const hasPost = path.includes("/p/") || path.includes("/reel/") || path.includes("/tv/");
          if (!hasPost || path === "" || path === "/") {
            return {
              category: "homepage",
              title: "กรุณาระบุลิงก์โพสต์ Instagram ที่เจาะจง",
              badge: "หน้าแรกโซเชียล",
              badgeColor: "bg-rose-500/15 text-rose-600 dark:text-rose-300 ring-1 ring-rose-500/30",
              borderColor: "border-t-rose-500",
              reason:
                "ลิงก์ที่ระบุเป็นหน้าแรกหรือหน้าโปรไฟล์ Instagram ซึ่งไม่มีเนื้อหาโพสต์ที่สามารถตรวจสอบได้",
              suggestion:
                "กรุณาคัดลอกลิงก์โพสต์โดยตรง (ที่มี /p/...) หรือคัดลอกข้อความในโพสต์มาวางแทน",
            };
          }
        }

        if (host === "today.line.me" || host === "line.me") {
          const hasArticle = path.includes("/article/") || path.includes("/v2/article/");
          if (!hasArticle || path === "" || path === "/" || path === "/th" || path === "/th/") {
            return {
              category: "homepage",
              title: "กรุณาระบุลิงก์บทความ LINE Today ที่เจาะจง",
              badge: "หน้าแรกข่าว",
              badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30",
              borderColor: "border-t-emerald-500",
              reason:
                "ลิงก์ที่ระบุเป็นหน้าแรกของ LINE Today ซึ่งไม่มีเนื้อหาบทความข่าวที่เจาะจง",
              suggestion:
                "กรุณาคัดลอกลิงก์ของบทความข่าวที่ต้องการตรวจสอบ (ที่มี /article/...) มาวางตรวจสอบแทน",
            };
          }
        }

        if (path === "" || path === "/") {
          return {
            category: "homepage",
            title: "กรุณาระบุลิงก์บทความข่าวที่เจาะจง",
            badge: "หน้าแรกเว็บไซต์",
            badgeColor: "bg-blue-500/15 text-blue-600 dark:text-cyan-300 ring-1 ring-blue-500/30",
            borderColor: "border-t-blue-500",
            reason:
              `ลิงก์ที่ระบุ (${host}) เป็นหน้าแรกของเว็บไซต์ ซึ่งไม่มีเนื้อหาข่าวสารเฉพาะเจาะจงให้ระบบตรวจสอบ`,
            suggestion:
              "กรุณาคัดลอกลิงก์ของบทความข่าวที่ต้องการตรวจสอบโดยตรง หรือคัดลอกข้อความข่าวมาวางแทน",
          };
        }
      } catch {}
    }
  }

  for (const domain of VIDEO_PLATFORMS) {
    if (lower.includes(domain)) {
      return {
        category: "multimedia",
        title: "ไม่รองรับคลิปหรือวิดีโอ",
        badge: "คลิปวิดีโอ",
        badgeColor: "bg-blue-500/15 text-blue-600 dark:text-cyan-300 ring-1 ring-blue-500/30",
        borderColor: "border-t-blue-500",
        reason:
          "ระบบ AI Fact-Checker ออกแบบมาเพื่อตรวจสอบข้อเท็จจริงของเนื้อหาข้อความและบทความข่าวสารเท่านั้น จึงไม่รองรับการประมวลผลคลิปวิดีโอ ภาพ เสียง หรือไฟล์เอกสารโดยตรง",
        suggestion:
          "กรุณาคัดลอกเนื้อหาข้อความ คำพูด หรือประเด็นสำคัญที่ปรากฏในคลิปวิดีโอ มาวางตรวจสอบแทน",
      };
    }
  }

  for (const pattern of VIDEO_URL_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        category: "multimedia",
        title: "ไม่รองรับลิงก์คลิปวิดีโอ (Reels / Watch)",
        badge: "คลิปวิดีโอ",
        badgeColor: "bg-blue-500/15 text-blue-600 dark:text-cyan-300 ring-1 ring-blue-500/30",
        borderColor: "border-t-blue-500",
        reason:
          "ลิงก์ที่ระบุเป็นคลิปวิดีโอสั้น (Reels/Watch) ซึ่งระบบไม่สามารถวิเคราะห์ข้อมูลเสียงหรือภาพเคลื่อนไหวได้โดยตรง",
        suggestion:
          "กรุณาพิมพ์หรือคัดลอกข้อความประเด็นข่าวที่อยู่ในคลิป มาวางตรวจสอบในรูปแบบข้อความแทน",
      };
    }
  }

  for (const extRegex of FILE_EXTENSIONS) {
    if (extRegex.test(lower)) {
      return {
        category: "multimedia",
        title: "ไม่รองรับไฟล์เอกสารหรือไฟล์สื่อบันทึก",
        badge: "ไฟล์เอกสาร / ไฟล์สื่อ",
        badgeColor: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 ring-1 ring-indigo-500/30",
        borderColor: "border-t-indigo-500",
        reason:
          "ระบบไม่รองรับการอัปโหลดหรือตรวจสอบไฟล์แนบ (เช่น .mp4, .pdf, .zip, .png, .jpg)",
        suggestion:
          "กรุณาคัดลอกเนื้อหาข้อความจากเอกสารหรือภาพ มาวางตรวจสอบเป็นข้อความแทน",
      };
    }
  }

  const hasNewsContext = NEWS_CONTEXT_KEYWORDS.some((kw) => trimmed.includes(kw));

  if (!hasNewsContext) {
    const isGambling = GAMBLING_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
    if (isGambling) {
      return {
        category: "gambling",
        title: "ตรวจพบเนื้อหาหรือลิงก์การพนันออนไลน์",
        badge: "การพนันออนไลน์",
        badgeColor: "bg-rose-500/15 text-rose-600 dark:text-rose-300 ring-1 ring-rose-500/30",
        borderColor: "border-t-rose-500",
        reason:
          "ระบบตรวจพบว่าเป็นลิงก์หรือข้อความโฆษณาชักชวนเล่นการพนันออนไลน์ ซึ่งอยู่นอกเหนือขอบเขตการตรวจสอบข้อเท็จจริง",
        suggestion:
          "หากท่านต้องการตรวจสอบข่าวการปราบปรามหรือเตือนภัยเว็บพนัน กรุณาระบุบริบทของข่าวให้ครบถ้วน",
      };
    }
  }

  if (!hasNewsContext) {
    const isIllegal = ILLEGAL_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
    if (isIllegal) {
      return {
        category: "illegal",
        title: "ตรวจพบเนื้อหาหรือบริการที่ผิดกฎหมาย",
        badge: "สิ่งผิดกฎหมาย",
        badgeColor: "bg-red-500/15 text-red-600 dark:text-red-300 ring-1 ring-red-500/30",
        borderColor: "border-t-red-500",
        reason:
          "ระบบตรวจพบข้อความหรือลิงก์ที่เกี่ยวข้องกับการซื้อขายสิ่งผิดกฎหมาย ซึ่งอยู่นอกเหนือขอบเขตการให้บริการ",
        suggestion:
          "หากท่านต้องการตรวจสอบข่าวสารการจับกุมหรือการเตือนภัย กรุณาใส่เนื้อหาข่าวที่มีรายละเอียดให้ครบถ้วน",
      };
    }
  }

  if (trimmed.length < 150) {
    const isCasualPersonal = CASUAL_PERSONAL_PHRASES.some((phrase) =>
      lower.includes(phrase.toLowerCase())
    );
    if (isCasualPersonal && !hasNewsContext) {
      return {
        category: "personal",
        title: "ตรวจพบโพสต์หรือบทสนทนาส่วนตัว",
        badge: "โพสต์ส่วนตัว / สนทนาทั่วไป",
        badgeColor: "bg-purple-500/15 text-purple-600 dark:text-purple-300 ring-1 ring-purple-500/30",
        borderColor: "border-t-purple-500",
        reason:
          "ข้อความนี้เป็นบทสนทนาหรือโพสต์กิจวัตรส่วนตัว ซึ่งไม่ใช่ประเด็นข่าวสารหรือข้อมูลสาธารณะที่สามารถตรวจสอบข้อเท็จจริงได้",
        suggestion:
          "กรุณากรอกประเด็นข่าว ข่าวลือ นโยบาย หรือข้อกล่าวอ้างสาธารณะที่ต้องการตรวจสอบข้อเท็จจริง",
      };
    }
  }

  return null;
}
