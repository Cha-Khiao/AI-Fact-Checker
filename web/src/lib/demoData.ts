import { FactCheckResult, ScoreLevel } from "@/types";

export interface DemoTopicItem {
  id: string;
  verdict: "real" | "fake";
  format: "text" | "url" | "mixed";
  score: ScoreLevel;
  category: string;
  categoryLabel: string;
  label: string;
  content: string;
  result: FactCheckResult;
}

export const DEMO_TOPICS_10: DemoTopicItem[] = [
  // 1. Fake - Financial Scam (Score 1)
  {
    id: "demo-fake-1",
    verdict: "fake",
    format: "text",
    score: 1,
    category: "FINANCIAL_SCAM",
    categoryLabel: "การเงิน / หลอกลงทุน",
    label: "กระทรวงการคลังเปิดลงทะเบียนแจกเงินเยียวยาพิเศษ 5,000 บาท ทางไลน์",
    content: "กระทรวงการคลังเปิดระบบลงทะเบียนรับเงินช่วยเหลือเยียวยาพิเศษ 5,000 บาท สำหรับผู้สูงอายุและผู้ถือบัตรสวัสดิการแห่งรัฐรอบใหม่ โดยให้แอดไลน์เพื่อยื่นคำขอรับเงินทันที",
    result: {
      status: "success",
      input: {
        content: "กระทรวงการคลังเปิดระบบลงทะเบียนรับเงินช่วยเหลือเยียวยาพิเศษ 5,000 บาท สำหรับผู้สูงอายุและผู้ถือบัตรสวัสดิการแห่งรัฐรอบใหม่ โดยให้แอดไลน์เพื่อยื่นคำขอรับเงินทันที",
        method: "Direct Text",
        timeline: "2569",
        publish_date: "ล่าสุด",
        timestamp_display: "20 ส.ค. 2569"
      },
      verdict: {
        score: 1,
        summary: "ข่าวปลอมสิ้นเชิง กระทรวงการคลังไม่มีนโยบายแจกเงินเยียวยาพิเศษ 5,000 บาทผ่านทางไลน์ เป็นกลโกงของมิจฉาชีพที่แอบอ้างหน่วยงานรัฐ",
        supported_points: [
          "กระทรวงการคลังและศูนย์ต่อต้านข่าวปลอมยืนยันว่าไม่มีโครงการแจกเงินเยียวยา 5,000 บาทรอบใหม่ผ่านไลน์แต่อย่างใด",
          "การติดต่อราชการของกระทรวงการคลังไม่มีการให้แอดไลน์ส่วนบุคคลเพื่อขอรับเงินหรือส่งข้อมูลบัตรประชาชน"
        ],
        conflicting_points: [
          "ข้อความที่อ้างว่ารัฐบาลเปิดลงทะเบียนแจกเงิน 5,000 บาททางไลน์เป็นข้อมูลเท็จทั้งหมด",
          "ลิงก์ไลน์ที่แนบมาเป็นบัญชีปลอมที่สร้างขึ้นเพื่อหลอกขโมยข้อมูลส่วนบุคคลและรหัส OTP"
        ],
        comparative_analysis: "จากการตรวจสอบเทียบเคียงกับแถลงการณ์อย่างเป็นทางการของกระทรวงการคลัง และศูนย์ต่อต้านข่าวปลอม ประเทศไทย (Anti-Fake News Center Thailand) ยืนยันตรงกันว่าข้อความดังกล่าวเป็น 'ข่าวปลอม (Fake News)' ที่มิจฉาชีพสร้างขึ้นเพื่อแอบอ้างสัญลักษณ์ของกระทรวงการคลัง หวังหลอกลวงให้ประชาชนส่งข้อมูลส่วนบุคคล หมายเลขบัตรประชาชน และรหัสผ่านธนาคาร ซึ่งอาจนำไปสู่การดูดเงินในบัญชีจนหมด ทางการเตือนประชาชนอย่าหลงเชื่อและห้ามกดแอดไลน์หรือส่งข้อมูลส่วนตัวเด็ดขาด",
        disinformation_category: "FINANCIAL_SCAM",
        disinformation_category_label: "การเงิน / หลอกลงทุน",
        sub_claims: [
          {
            claim_text: "กระทรวงการคลังเปิดแจกเงินเยียวยาพิเศษ 5,000 บาท",
            score: 1,
            verdict_label: "เท็จ (0%)",
            detail: "ไม่มีโครงการดังกล่าวในระบบงบประมาณและนโยบายรัฐบาล"
          },
          {
            claim_text: "ลงทะเบียนรับเงินผ่านทาง LINE ได้ทันที",
            score: 1,
            verdict_label: "เท็จ (0%)",
            detail: "ช่องทาง LINE ดังกล่าวเป็นของมิจฉาชีพ ไม่ใช่ช่องทางของรัฐบาล"
          }
        ],
        security_warning: {
          is_suspicious: true,
          risk_level: "HIGH",
          reasons: ["ตรวจพบการแอบอ้างชื่อกระทรวงการคลังเพื่อชักชวนเข้ากลุ่ม LINE ปลอม", "พฤติกรรมเข้าข่ายฟิชชิ่งหลอกลวงทางการเงิน"],
          clean_domain: "direct-text"
        },
        timeline: "2569",
        publish_date: "ล่าสุด"
      },
      references: [
        {
          title: "ข่าวปลอม! กระทรวงการคลังเปิดลงทะเบียนรับเงินเยียวยา 5,000 บาท ผ่านไลน์",
          url: "https://www.antifakenewscenter.com/financial/fake-news-mof-5000-line/",
          pub_date: "20 ส.ค. 2569",
          snippet: "ศูนย์ต่อต้านข่าวปลอมชี้แจง กระทรวงการคลังไม่มีการเปิดรับลงทะเบียนแจกเงินเยียวยา 5,000 บาททาง LINE ขอประชาชนอย่าแชร์ข้อมูลเท็จ",
          match_score: 0.98,
          relevance_pct: 98,
          source: "Anti-Fake News Center",
          is_official_authority: true,
          authority_name: "ศูนย์ต่อต้านข่าวปลอม ประเทศไทย"
        },
        {
          title: "กระทรวงการคลัง เตือนภัยมิจฉาชีพระบาดหนัก แอบอ้างแจกเงินเยียวยาทางโซเชียล",
          url: "https://www.mof.go.th/th/news-detail/2026-scam-warning",
          pub_date: "19 ส.ค. 2569",
          snippet: "โฆษกกระทรวงการคลังย้ำ ไม่มีนโยบายให้เจ้าหน้าที่ติดต่อประชาชนทาง LINE เพื่อโอนเงินเยียวยาใดๆ ทั้งสิ้น",
          match_score: 0.95,
          relevance_pct: 95,
          source: "Ministry of Finance",
          is_official_authority: true,
          authority_name: "กระทรวงการคลัง"
        },
        {
          title: "เตือนภัยแอดไลน์รับเงิน 5,000 บาท ตร.ไซเบอร์ชี้เป็นกลโกงดูดเงินบัญชี",
          url: "https://www.thairath.co.th/news/crime/2789123",
          pub_date: "18 ส.ค. 2569",
          snippet: "ตำรวจไซเบอร์เตือนระวังข้อความชวนแอดไลน์รับเงินเยียวยา พบเหยื่อถูกหลอกติดตั้งแอปดูดเงินหลายราย",
          match_score: 0.91,
          relevance_pct: 91,
          source: "ไทยรัฐออนไลน์",
          is_official_authority: false
        }
      ],
      timing: { planner_ms: 210, scraper_ms: 0, search_ms: 450, analyzer_ms: 680, total_ms: 1340 },
      execution_time_seconds: 1.34
    }
  },

  // 2. Fake - Health Miracle Cure (Score 1)
  {
    id: "demo-fake-2",
    verdict: "fake",
    format: "text",
    score: 1,
    category: "HEALTH_MEDICINE",
    categoryLabel: "สุขภาพ / การแพทย์",
    label: "ดื่มน้ำมะนาวผสมโซดารักษามะเร็งระยะสุดท้ายหายขาดไม่ต้องพึ่งเคมีบำบัด",
    content: "มีการแชร์สูตรสมุนไพร ดื่มน้ำมะนาวสดผสมโซดาทุกเช้าตอนท้องว่าง ช่วยปรับค่าความเป็นด่างในเลือด ฆ่าเซลล์มะเร็งระยะสุดท้ายให้ฝ่อหายขาดได้ 100% โดยไม่ต้องไปรับเคมีบำบัดที่โรงพยาบาล",
    result: {
      status: "success",
      input: {
        content: "มีการแชร์สูตรสมุนไพร ดื่มน้ำมะนาวสดผสมโซดาทุกเช้าตอนท้องว่าง ช่วยปรับค่าความเป็นด่างในเลือด ฆ่าเซลล์มะเร็งระยะสุดท้ายให้ฝ่อหายขาดได้ 100% โดยไม่ต้องไปรับเคมีบำบัดที่โรงพยาบาล",
        method: "Direct Text",
        timeline: "2569",
        publish_date: "ล่าสุด",
        timestamp_display: "20 ส.ค. 2569"
      },
      verdict: {
        score: 1,
        summary: "ข้อมูลเท็จทางการแพทย์ สถาบันมะเร็งแห่งชาติยืนยัน น้ำมะนาวผสมโซดาไม่สามารถรักษามะเร็งได้ และการงดรับเคมีบำบัดอาจทำให้โรคเข้าสู่ภาวะวิกฤต",
        supported_points: [
          "มะนาวมีวิตามินซีและสารต้านอนุมูลอิสระที่มีประโยชน์ต่อร่างกายทั่วไป",
          "การรับประทานอาหารให้ถูกสุขลักษณะช่วยเสริมสร้างภูมิคุ้มกันได้"
        ],
        conflicting_points: [
          "ไม่มีงานวิจัยทางวิทยาศาสตร์หรือการแพทย์ใดๆ ยืนยันว่าน้ำมะนาวผสมโซดาสามารถฆ่าเซลล์มะเร็งในมนุษย์ได้",
          "อาหารหรือเครื่องดื่มไม่สามารถเปลี่ยนค่าความเป็นกรด-ด่าง (pH) ของกระแสเลือดในร่างกายมนุษย์ได้ เนื่องจากมีระบบบัฟเฟอร์ควบคุมตามธรรมชาติ",
          "การปฏิเสธการรักษามาตรฐานทางการแพทย์ทำให้ผู้ป่วยเสียโอกาสในการรอดชีวิต"
        ],
        comparative_analysis: "สถาบันมะเร็งแห่งชาติ กรมการแพทย์ กระทรวงสาธารณสุข ได้ออกมาชี้แจงอย่างต่อเนื่องว่า ข้อมูลเรื่อง 'น้ำมะนาวผสมโซดารักษามะเร็ง' เป็นข่าวปลอมทางสุขภาพที่แชร์วนซ้ำในโซเชียลมาอย่างยาวนาน แม้น้ำมะนาวจะมีประโยชน์ทางโภชนาการ แต่ไม่มีฤทธิ์ในการทำลายหรือยับยั้งเซลล์มะเร็งระยะสุดท้าย และร่างกายมนุษย์มีกลไกไตและปอดในการควบคุมสมดุลกรดด่างในเลือดให้คงที่เสมอ การหลงเชื่อสูตรดังกล่าวแล้วปฏิเสธการรักษาทางการแพทย์อาจทำให้เซลล์มะเร็งลุกลามจนไม่สามารถรักษาได้ทันเวลา",
        disinformation_category: "HEALTH_MEDICINE",
        disinformation_category_label: "สุขภาพ / การแพทย์",
        sub_claims: [
          {
            claim_text: "น้ำมะนาวผสมโซดาฆ่าเซลล์มะเร็งระยะสุดท้ายหายขาด",
            score: 1,
            verdict_label: "เท็จ (0%)",
            detail: "ไม่มีหลักฐานทางวิทยาศาสตร์การแพทย์รองรับ"
          },
          {
            claim_text: "การดื่มน้ำด่างช่วยเปลี่ยนความเป็นกรดด่างในเลือดได้",
            score: 1,
            verdict_label: "เท็จ (0%)",
            detail: "ระบบร่างกายควบคุมสมดุลกรดด่างในเลือดคงที่เสมอ อาหารไม่สามารถเปลี่ยนได้"
          }
        ],
        security_warning: {
          is_suspicious: false,
          risk_level: "SAFE",
          reasons: [],
          clean_domain: "direct-text"
        },
        timeline: "2569",
        publish_date: "ล่าสุด"
      },
      references: [
        {
          title: "สถาบันมะเร็งแห่งชาติ ย้ำชัด! น้ำมะนาวโซดาไม่ช่วยรักษามะเร็ง อย่าหลงเชื่อข่าวปลอม",
          url: "https://www.nci.go.th/th/New_Nci/lemon-soda-cancer-debunk.html",
          pub_date: "20 ส.ค. 2569",
          snippet: "ผู้อำนวยการสถาบันมะเร็งแห่งชาติยืนยัน น้ำมะนาวผสมโซดาไม่สามารถรักษาโรคมะเร็งได้ แนะผู้ป่วยเข้ารับการรักษามาตรฐาน",
          match_score: 0.99,
          relevance_pct: 99,
          source: "National Cancer Institute",
          is_official_authority: true,
          authority_name: "สถาบันมะเร็งแห่งชาติ"
        },
        {
          title: "อย. เตือนแชร์ว่อน ดื่มน้ำมะนาวผสมโซดาฆ่าเซลล์มะเร็ง เสี่ยงอันตรายถึงชีวิต",
          url: "https://oryor.com/media/checkSureShare/detail/all/1942",
          pub_date: "15 ส.ค. 2569",
          snippet: "สำนักงานคณะกรรมการอาหารและยา (อย.) ชี้แจง น้ำมะนาวโซดาเป็นเพียงเครื่องดื่มดับกระหาย ไม่ใช่ยารักษาโรคมะเร็ง",
          match_score: 0.94,
          relevance_pct: 94,
          source: "อย. Check Sure Share",
          is_official_authority: true,
          authority_name: "สำนักงานคณะกรรมการอาหารและยา (อย.)"
        }
      ],
      timing: { planner_ms: 190, scraper_ms: 0, search_ms: 420, analyzer_ms: 710, total_ms: 1320 },
      execution_time_seconds: 1.32
    }
  },

  // 3. True - Disaster Warning (Score 5)
  {
    id: "demo-real-1",
    verdict: "real",
    format: "text",
    score: 5,
    category: "DISASTER_SAFETY",
    categoryLabel: "ภัยพิบัติ / อุบัติภัย",
    label: "กรมอุตุนิยมวิทยาเตือนพายุฤดูร้อนถล่ม 45 จังหวัด ฝนฟ้าคะนอง-ลมกระโชกแรง",
    content: "กรมอุตุนิยมวิทยาออกประกาศเตือนภัย เรื่อง พายุฤดูร้อนบริเวณประเทศไทยตอนบน มีผลกระทบตั้งแต่วันที่ 20-22 สิงหาคม 2569 เตือน 45 จังหวัดในภาคเหนือ ภาคตะวันออกเฉียงเหนือ และภาคกลาง ระวังอันตรายจากพายุฝนฟ้าคะนอง ลมกระโชกแรง และลูกเห็บตกบางแห่ง",
    result: {
      status: "success",
      input: {
        content: "กรมอุตุนิยมวิทยาออกประกาศเตือนภัย เรื่อง พายุฤดูร้อนบริเวณประเทศไทยตอนบน มีผลกระทบตั้งแต่วันที่ 20-22 สิงหาคม 2569 เตือน 45 จังหวัดในภาคเหนือ ภาคตะวันออกเฉียงเหนือ และภาคกลาง ระวังอันตรายจากพายุฝนฟ้าคะนอง ลมกระโชกแรง และลูกเห็บตกบางแห่ง",
        method: "Direct Text",
        timeline: "20-22 สิงหาคม 2569",
        publish_date: "20 ส.ค. 2569",
        timestamp_display: "20 ส.ค. 2569"
      },
      verdict: {
        score: 5,
        summary: "ข้อมูลจริง 100% กรมอุตุนิยมวิทยาได้ออกประกาศเตือนภัยพายุฤดูร้อนครอบคลุมพื้นที่ 45 จังหวัดจริง เพื่อให้ประชาชนเตรียมความพร้อมรับมือ",
        supported_points: [
          "กรมอุตุนิยมวิทยาออกประกาศเตือนภัยฉบับล่าสุด เรื่อง พายุฤดูร้อนบริเวณประเทศไทยตอนบนจริง",
          "พื้นที่เสี่ยงภัยครอบคลุม 45 จังหวัดในภาคเหนือ ภาคอีสาน ภาคกลาง รวมถึงกรุงเทพมหานครและปริมณฑล",
          "ข้อควรระวังคือหลีกเลี่ยงการอยู่ในที่โล่งแจ้ง ใต้ต้นไม้ใหญ่ และป้ายโฆษณาที่ไม่แข็งแรง"
        ],
        conflicting_points: [
          "ไม่พบข้อมูลที่ขัดแย้งกับประกาศของทางการ ข้อมูลสอดคล้องกับรายงานสภาพอากาศของกรมอุตุนิยมวิทยาทุกประการ"
        ],
        comparative_analysis: "จากการตรวจสอบข้อมูลเปรียบเทียบกับเว็บไซต์ทางการของกรมอุตุนิยมวิทยา (tmd.go.th) และกรมป้องกันและบรรเทาสาธารณภัย (ปภ.) พบว่าประกาศเตือนภัยพายุฤดูร้อนดังกล่าวเป็น 'เรื่องจริง (True)' โดยเป็นประกาศแจ้งเตือนอย่างเป็นทางการเนื่องจากมวลอากาศเย็นจากประเทศจีนแผ่ลงมาปกคลุมประเทศไทยตอนบนและทะเลจีนใต้ ส่งผลให้เกิดพายุฝนฟ้าคะนอง ลมกระโชกแรง และลูกเห็บตกบางพื้นที่ ประชาชนในพื้นที่เสี่ยงควรติดตามข่าวสารพยากรณ์อากาศอย่างใกล้ชิด",
        disinformation_category: "DISASTER_SAFETY",
        disinformation_category_label: "ภัยพิบัติ / อุบัติภัย",
        sub_claims: [
          {
            claim_text: "กรมอุตุนิยมวิทยาประกาศเตือนพายุฤดูร้อน 20-22 สิงหาคม 2569",
            score: 5,
            verdict_label: "จริง (100%)",
            detail: "มีประกาศอย่างเป็นทางการผ่านเว็บไซต์และสื่อหลัก"
          },
          {
            claim_text: "มีพื้นที่เสี่ยงภัย 45 จังหวัด มีฝนฟ้าคะนองและลมกระโชกแรง",
            score: 5,
            verdict_label: "จริง (100%)",
            detail: "รายละเอียดจังหวัดตรงตามประกาศเตือนภัยของ ปภ. และกรมอุตุฯ"
          }
        ],
        security_warning: {
          is_suspicious: false,
          risk_level: "SAFE",
          reasons: [],
          clean_domain: "direct-text"
        },
        timeline: "20-22 สิงหาคม 2569",
        publish_date: "20 ส.ค. 2569"
      },
      references: [
        {
          title: "ประกาศกรมอุตุนิยมวิทยา ฉบับที่ 3 เรื่อง พายุฤดูร้อนบริเวณประเทศไทยตอนบน",
          url: "https://www.tmd.go.th/warning/weather-warning-august-2026",
          pub_date: "20 ส.ค. 2569",
          snippet: "กรมอุตุนิยมวิทยาเตือน 45 จังหวัดรับมือพายุฤดูร้อน ฝนฟ้าคะนองและลมกระโชกแรงช่วง 20-22 ส.ค. 69",
          match_score: 0.99,
          relevance_pct: 99,
          source: "Thai Meteorological Department",
          is_official_authority: true,
          authority_name: "กรมอุตุนิยมวิทยา"
        },
        {
          title: "ปภ. ประสาน 45 จังหวัด เฝ้าระวังพายุฝนฟ้าคะนองและลมกระโชกแรง 20-22 ส.ค.",
          url: "https://www.disaster.go.th/th/news/warning-storm-2026",
          pub_date: "20 ส.ค. 2569",
          snippet: "กรมป้องกันและบรรเทาสาธารณภัยสั่งการศูนย์ ปภ. เขต เตรียมความพร้อมเจ้าหน้าที่และเครื่องจักรกลช่วยเหลือประชาชน 24 ชม.",
          match_score: 0.96,
          relevance_pct: 96,
          source: "Department of Disaster Prevention and Mitigation",
          is_official_authority: true,
          authority_name: "กรมป้องกันและบรรเทาสาธารณภัย"
        },
        {
          title: "เช็กเลย 45 จังหวัด กรมอุตุฯ เตือนพายุฤดูร้อนถล่ม ลมกระโชกแรง ลูกเห็บตก",
          url: "https://www.matichon.co.th/local/weather-news-warning-aug2026",
          pub_date: "20 ส.ค. 2569",
          snippet: "มติชนออนไลน์ รายงานรายชื่อ 45 จังหวัดเสี่ยงพายุฝนฟ้าคะนองตามประกาศเตือนภัยของกรมอุตุนิยมวิทยา",
          match_score: 0.92,
          relevance_pct: 92,
          source: "มติชนออนไลน์",
          is_official_authority: false
        }
      ],
      timing: { planner_ms: 180, scraper_ms: 0, search_ms: 390, analyzer_ms: 610, total_ms: 1180 },
      execution_time_seconds: 1.18
    }
  },

  // 4. Distorted - Government Policy (Score 2)
  {
    id: "demo-distort-1",
    verdict: "fake",
    format: "text",
    score: 2,
    category: "PUBLIC_POLICY_GOV",
    categoryLabel: "นโยบายรัฐ / สวัสดิการ",
    label: "รัฐบาลแจกเงินดิจิทัล 10,000 บาทรอบ 2 ให้ทุกคนทุกเพศทุกวัยไม่มีเงื่อนไข",
    content: "รัฐบาลเคาะแจกเงินดิจิทัลวอลเล็ต 10,000 บาท รอบ 2 แล้ว โดยโอนเข้าบัญชีพร้อมเพย์ให้คนไทยทุกคนที่มีอายุเกิน 18 ปี โดยไม่มีการคัดกรองฐานเงินเดือนหรือเงินฝากในบัญชีใดๆ ทั้งสิ้น",
    result: {
      status: "success",
      input: {
        content: "รัฐบาลเคาะแจกเงินดิจิทัลวอลเล็ต 10,000 บาท รอบ 2 แล้ว โดยโอนเข้าบัญชีพร้อมเพย์ให้คนไทยทุกคนที่มีอายุเกิน 18 ปี โดยไม่มีการคัดกรองฐานเงินเดือนหรือเงินฝากในบัญชีใดๆ ทั้งสิ้น",
        method: "Direct Text",
        timeline: "2569",
        publish_date: "ล่าสุด",
        timestamp_display: "20 ส.ค. 2569"
      },
      verdict: {
        score: 2,
        summary: "ข้อมูลบิดเบือน รัฐบาลมีโครงการดิจิทัลวอลเล็ตจริง แต่ยังคงมีเกณฑ์คัดกรองรายได้และเงินฝาก ไม่ได้แจกทุกคนโดยไม่มีเงื่อนไขตามที่กล่าวอ้าง",
        supported_points: [
          "รัฐบาลมีการดำเนินโครงการเติมเงิน 10,000 บาทผ่าน Digital Wallet จริง",
          "ผู้มีสิทธิ์ต้องเป็นบุคคลสัญชาติไทยที่มีอายุ 18 ปีบริบูรณ์ขึ้นไป"
        ],
        conflicting_points: [
          "ข้อความที่อ้างว่า 'ไม่มีการคัดกรองเงินเดือนและเงินฝาก' เป็นความเท็จ",
          "โครงการมีเกณฑ์กำหนดชัดเจนว่าต้องมีรายได้พึงประเมินไม่เกิน 840,000 บาท/ปี และมีเงินฝากรวมทุกบัญชีไม่เกิน 500,000 บาท"
        ],
        comparative_analysis: "จากการตรวจสอบมติคณะรัฐมนตรีและแถลงการณ์ของกระทรวงการคลัง พบว่าข้อความนี้ 'บิดเบือนตัดต่อข้อเท็จจริง (Mostly False)' โดยนำเรื่องการดำเนินโครงการดิจิทัลวอลเล็ตมาผสมกับข้อมูลที่คลาดเคลื่อน เพื่อสร้างความเข้าใจผิดว่าทุกคนจะได้รับเงินโดยไม่มีเงื่อนไข ในความเป็นจริงโครงการยังคงยึดหลักเกณฑ์ความจำเป็น โดยตัดสิทธิ์กลุ่มผู้มีรายได้เกินเกณฑ์และกลุ่มผู้มีเงินฝากเกิน 500,000 บาทอย่างชัดเจน",
        disinformation_category: "PUBLIC_POLICY_GOV",
        disinformation_category_label: "นโยบายรัฐ / สวัสดิการ",
        sub_claims: [
          {
            claim_text: "รัฐบาลมีโครงการแจกเงินดิจิทัล 10,000 บาท",
            score: 5,
            verdict_label: "จริง (100%)",
            detail: "เป็นนโยบายกระตุ้นเศรษฐกิจของรัฐบาล"
          },
          {
            claim_text: "แจกให้ทุกคนโดยไม่มีการตรวจสอบรายได้หรือเงินฝาก",
            score: 1,
            verdict_label: "เท็จ (0%)",
            detail: "มีเกณฑ์ตัดสิทธิ์ผู้มีรายได้และเงินฝากเกินเพดานที่กำหนด"
          }
        ],
        security_warning: {
          is_suspicious: false,
          risk_level: "SAFE",
          reasons: [],
          clean_domain: "direct-text"
        },
        timeline: "2569",
        publish_date: "ล่าสุด"
      },
      references: [
        {
          title: "กระทรวงการคลัง ชี้แจงเงื่อนไขสิทธิ์ Digital Wallet 10,000 บาท ยันมีเกณฑ์คัดกรองรายได้",
          url: "https://www.mof.go.th/th/news/digital-wallet-criteria-clarification",
          pub_date: "19 ส.ค. 2569",
          snippet: "กระทรวงการคลังย้ำ โครงการดิจิทัลวอลเล็ตกำหนดเกณฑ์รายได้ไม่เกิน 840,000 บาทต่อปี และเงินฝากไม่เกิน 5 แสนบาท ไม่ได้แจกทุกคน",
          match_score: 0.97,
          relevance_pct: 97,
          source: "Ministry of Finance",
          is_official_authority: true,
          authority_name: "กระทรวงการคลัง"
        },
        {
          title: "เช็กเงื่อนไขล่าสุด เงินดิจิทัล 10,000 บาท ใครได้-ใครหมดสิทธิ์",
          url: "https://www.bangkokbiznews.com/business/economic/1098234",
          pub_date: "18 ส.ค. 2569",
          snippet: "กรุงเทพธุรกิจ สรุปเงื่อนไขและเกณฑ์การคัดกรองผู้มีสิทธิ์เข้าร่วมโครงการเงินดิจิทัลวอลเล็ต",
          match_score: 0.93,
          relevance_pct: 93,
          source: "กรุงเทพธุรกิจ",
          is_official_authority: false
        }
      ],
      timing: { planner_ms: 220, scraper_ms: 0, search_ms: 410, analyzer_ms: 690, total_ms: 1320 },
      execution_time_seconds: 1.32
    }
  },

  // 5. True - Public Health Dengue Advisory (Score 5)
  {
    id: "demo-real-2",
    verdict: "real",
    format: "text",
    score: 5,
    category: "HEALTH_MEDICINE",
    categoryLabel: "สุขภาพ / การแพทย์",
    label: "สธ. เตือนประชาชนระวังไข้เลือดออก แนะ 3 เก็บป้องกัน 3 โรค",
    content: "กรมควบคุมโรค กระทรวงสาธารณสุข เตือนประชาชนระวังโรคไข้เลือดออกระบาดช่วงฤดูฝน โดยแนะให้ปฏิบัติตามมาตรการ 3 เก็บ ป้องกัน 3 โรค ได้แก่ เก็บบ้าน เก็บขยะ และเก็บน้ำ เพื่อกำจัดแหล่งเพาะพันธุ์ยุงลาย",
    result: {
      status: "success",
      input: {
        content: "กรมควบคุมโรค กระทรวงสาธารณสุข เตือนประชาชนระวังโรคไข้เลือดออกระบาดช่วงฤดูฝน โดยแนะให้ปฏิบัติตามมาตรการ 3 เก็บ ป้องกัน 3 โรค ได้แก่ เก็บบ้าน เก็บขยะ และเก็บน้ำ เพื่อกำจัดแหล่งเพาะพันธุ์ยุงลาย",
        method: "Direct Text",
        timeline: "ฤดูฝน 2569",
        publish_date: "20 ส.ค. 2569",
        timestamp_display: "20 ส.ค. 2569"
      },
      verdict: {
        score: 5,
        summary: "ข้อมูลจริง 100% กรมควบคุมโรค กระทรวงสาธารณสุข ได้ออกคำเตือนและแนะนำมาตรการ 3 เก็บป้องกัน 3 โรค เพื่อตัดวงจรยุงลายพาหะนำโรคไข้เลือดออกจริง",
        supported_points: [
          "กรมควบคุมโรค กระทรวงสาธารณสุข ออกประกาศเตือนสถานการณ์โรคไข้เลือดออกช่วงฤดูฝนจริง",
          "มาตรการ 3 เก็บ ป้องกัน 3 โรค (เก็บบ้าน, เก็บขยะ, เก็บน้ำ) เป็นแนวทางหลักของกระทรวงสาธารณสุขในการป้องกันโรคไข้เลือดออก โรคติดเชื้อไวรัสซิกา และโรคไข้ปวดข้อยุงลาย (ชิคุนกุนยา)",
          "แนะนำให้ประชาชนตรวจดูภาชนะขังน้ำรอบบ้านทุกสัปดาห์เพื่อกำจัดลูกน้ำยุงลาย"
        ],
        conflicting_points: [
          "ไม่พบข้อมูลที่ขัดแย้ง ข้อมูลถูกต้องตามหลักเวชศาสตร์ป้องกันและนโยบายสาธารณสุข"
        ],
        comparative_analysis: "จากการตรวจสอบกับข้อมูลเผยแพร่ของกรมควบคุมโรค กระทรวงสาธารณสุข (ddc.moph.go.th) พบว่าเป็น 'ข้อมูลจริง (True)' โดยมาตรการ '3 เก็บ ป้องกัน 3 โรค' เป็นรณรงค์ระดับชาติเพื่อป้องกันโรคที่มียุงลายเป็นพาหะ ได้แก่ ไข้เลือดออก, ไวรัสซิกา, และไข้ปวดข้อยุงลาย การกำจัดแหล่งเพาะพันธุ์ลูกน้ำยุงลายในบ้านและชุมชนเป็นวิธีป้องกันที่มีประสิทธิภาพสูงสุด",
        disinformation_category: "HEALTH_MEDICINE",
        disinformation_category_label: "สุขภาพ / การแพทย์",
        sub_claims: [
          {
            claim_text: "สธ. เตือนระวังโรคไข้เลือดออกช่วงฤดูฝน",
            score: 5,
            verdict_label: "จริง (100%)",
            detail: "มีการแถลงข่าวเตือนภัยประชาชนอย่างเป็นทางการ"
          },
          {
            claim_text: "แนะมาตรการ 3 เก็บ ป้องกัน 3 โรค (เก็บบ้าน เก็บขยะ เก็บน้ำ)",
            score: 5,
            verdict_label: "จริง (100%)",
            detail: "เป็นแนวทางปฏิบัติมาตรฐานของกรมควบคุมโรค"
          }
        ],
        security_warning: {
          is_suspicious: false,
          risk_level: "SAFE",
          reasons: [],
          clean_domain: "direct-text"
        },
        timeline: "ฤดูฝน 2569",
        publish_date: "20 ส.ค. 2569"
      },
      references: [
        {
          title: "กรมควบคุมโรค เตือนระวังไข้เลือดออกช่วงหน้าฝน แนะประชาชนใช้มาตรการ 3 เก็บ ป้องกัน 3 โรค",
          url: "https://ddc.moph.go.th/brc/news.php?news=38192",
          pub_date: "20 ส.ค. 2569",
          snippet: "อธิบดีกรมควบคุมโรคเน้นย้ำ ประชาชนร่วมมือกันเก็บบ้าน เก็บขยะ เก็บน้ำ ป้องกันโรคไข้เลือดออกระบาด",
          match_score: 0.99,
          relevance_pct: 99,
          source: "Department of Disease Control",
          is_official_authority: true,
          authority_name: "กรมควบคุมโรค กระทรวงสาธารณสุข"
        },
        {
          title: "สธ. เผยสถานการณ์ไข้เลือดออกปี 2569 ย้ำป้องกันยุงกัด สำรวจแหล่งน้ำขังรอบบ้าน",
          url: "https://pr.moph.go.th/?url=pr/detail/2/04/218932",
          pub_date: "19 ส.ค. 2569",
          snippet: "สำนักสารนิเทศ กระทรวงสาธารณสุข เผยแพร่ข้อแนะนำการดูแลสุขภาพและป้องกันยุงลาย",
          match_score: 0.95,
          relevance_pct: 95,
          source: "กระทรวงสาธารณสุข",
          is_official_authority: true,
          authority_name: "กระทรวงสาธารณสุข"
        }
      ],
      timing: { planner_ms: 170, scraper_ms: 0, search_ms: 380, analyzer_ms: 590, total_ms: 1140 },
      execution_time_seconds: 1.14
    }
  },

  // 6. Inconclusive - Science Discovery (Score 3)
  {
    id: "demo-inconclusive-1",
    verdict: "real",
    format: "text",
    score: 3,
    category: "GENERAL_MISINFO",
    categoryLabel: "ข่าวสารทั่วไป / ดาราศาสตร์",
    label: "นักดาราศาสตร์ค้นพบดาวเคราะห์ดวงใหม่ที่มีชั้นบรรยากาศและน้ำคล้ายโลก",
    content: "นักวิจัยค้นพบดาวเคราะห์นอกระบบสุริยะดวงใหม่ชื่อ LHS 1140 b โดยใช้กล้องโทรทรรศน์อวกาศเจมส์ เวบบ์ คาดว่าอาจมีมหาสมุทรน้ำเหลวและชั้นบรรยากาศที่เอื้อต่อการอยู่อาศัยของสิ่งมีชีวิตเหมือนโลก",
    result: {
      status: "success",
      input: {
        content: "นักวิจัยค้นพบดาวเคราะห์นอกระบบสุริยะดวงใหม่ชื่อ LHS 1140 b โดยใช้กล้องโทรทรรศน์อวกาศเจมส์ เวบบ์ คาดว่าอาจมีมหาสมุทรน้ำเหลวและชั้นบรรยากาศที่เอื้อต่อการอยู่อาศัยของสิ่งมีชีวิตเหมือนโลก",
        method: "Direct Text",
        timeline: "2569",
        publish_date: "ล่าสุด",
        timestamp_display: "20 ส.ค. 2569"
      },
      verdict: {
        score: 3,
        summary: "ข้อมูลก้ำกึ่ง/อยู่ระหว่างการศึกษาวิจัย มีการค้นพบสัญญาณบรรยากาศของดาวเคราะห์ LHS 1140 b จริง แต่นักวิทยาศาสตร์ยังต้องรวบรวมข้อมูลยืนยันเรื่องการมีน้ำเหลวและสิ่งมีชีวิต",
        supported_points: [
          "ทีมนักดาราศาสตร์นานาชาติใช้ข้อมูลจากกล้อง James Webb ตรวจวิเคราะห์ดาวเคราะห์นอกระบบ LHS 1140 b จริง",
          "ผลวิเคราะห์สเปกตรัมเบื้องต้นบ่งชี้ว่าดาวเคราะห์ดวงนี้อาจมีชั้นบรรยากาศที่มีไนโตรเจนเป็นองค์ประกอบหลัก และอาจเป็นดาวเคราะห์ที่มีน้ำแข็งหรือน้ำ (Water World)"
        ],
        conflicting_points: [
          "ยังไม่มีข้อสรุปชี้ขาด 100% ว่ามีมหาสมุทรน้ำเหลวหรือมีสิ่งมีชีวิตจริง เป็นเพียงข้อสันนิษฐานทางวิทยาศาสตร์ที่ต้องรอผลตรวจยืนยันเพิ่มเติม",
          "การพาดหัวข่าวในโซเชียลบางแห่งระบุว่า 'ค้นพบโลกใบที่สองแล้ว' ซึ่งเป็นการด่วนสรุปเกินจริงกว่าหลักฐานทางวิชาการปัจจุบัน"
        ],
        comparative_analysis: "จากการตรวจสอบรายงานวิจัยในวารสารดาราศาสตร์ (The Astrophysical Journal Letters) และองค์การ NASA พบว่าประเด็นนี้เป็น 'ข้อค้นพบทางวิทยาศาสตร์ที่อยู่ระหว่างการตรวจสอบ (Inconclusive / Emerging Research)' โดยดาวเคราะห์ LHS 1140 b เป็นเป้าหมายที่มีศักยภาพสูงในการศึกษาชั้นบรรยากาศ แต่ออสโมซิสและข้อมูลสเปกโทรสโกปียังต้องการเวลาสังเกตการณ์เพิ่มเติมเพื่อตัดสัญญาณรบกวนจากดาวฤกษ์แม่ การสรุปว่า 'มีมหาสมุทรและเหมือนโลกแล้ว' จึงยังเร็วเกินไปในทางวิทยาศาสตร์",
        disinformation_category: "GENERAL_MISINFO",
        disinformation_category_label: "ข่าวสารทั่วไป / ดาราศาสตร์",
        sub_claims: [
          {
            claim_text: "นักดาราศาสตร์วิเคราะห์ดาวเคราะห์ LHS 1140 b ด้วยกล้อง James Webb",
            score: 5,
            verdict_label: "จริง (100%)",
            detail: "มีการเผยแพร่งานวิจัยและข้อมูลทางดาราศาสตร์จริง"
          },
          {
            claim_text: "ยืนยันแล้วว่ามีมหาสมุทรน้ำเหลวและสิ่งมีชีวิตเหมือนโลก 100%",
            score: 2,
            verdict_label: "บิดเบือน/ยังไม่ยืนยัน",
            detail: "เป็นเพียงแบบจำลองทางฟิสิกส์ดาราศาสตร์ ยังไม่มีข้อพิสูจน์ชี้ขาด"
          }
        ],
        security_warning: {
          is_suspicious: false,
          risk_level: "SAFE",
          reasons: [],
          clean_domain: "direct-text"
        },
        timeline: "2569",
        publish_date: "ล่าสุด"
      },
      references: [
        {
          title: "NASA Webb Data Suggests Habitable Zone Exoplanet LHS 1140 b May Be An Ice Or Water World",
          url: "https://science.nasa.gov/missions/webb/exoplanet-lhs-1140b-atmosphere/",
          pub_date: "18 ส.ค. 2569",
          snippet: "NASA รายงานผลวิเคราะห์เบื้องต้นจากกล้องโทรทรรศน์อวกาศเจมส์ เวบบ์ ระบุดาวเคราะห์ LHS 1140 b อาจมีชั้นบรรยากาศหนาแน่น",
          match_score: 0.98,
          relevance_pct: 98,
          source: "NASA Science",
          is_official_authority: true,
          authority_name: "NASA"
        },
        {
          title: "NARIT สดร. ชวนทำความเข้าใจ ข้อมูลใหม่ดาวเคราะห์นอกระบบ LHS 1140 b โลกใบใหม่จริงหรือ?",
          url: "https://www.narit.or.th/index.php/news/exoplanet-lhs-1140b",
          pub_date: "19 ส.ค. 2569",
          snippet: "สถาบันวิจัยดาราศาสตร์แห่งชาติ ชี้แจงข้อมูลทางวิชาการ ระบุยังต้องรอข้อมูลยืนยันการมีอยู่ของน้ำเหลว",
          match_score: 0.96,
          relevance_pct: 96,
          source: "National Astronomical Research Institute of Thailand",
          is_official_authority: true,
          authority_name: "สถาบันวิจัยดาราศาสตร์แห่งชาติ (สดร.)"
        }
      ],
      timing: { planner_ms: 240, scraper_ms: 0, search_ms: 460, analyzer_ms: 720, total_ms: 1420 },
      execution_time_seconds: 1.42
    }
  },

  // 7. Fake URL - SMS Phishing Scam (Score 1)
  {
    id: "demo-fake-url-1",
    verdict: "fake",
    format: "url",
    score: 1,
    category: "FINANCIAL_SCAM",
    categoryLabel: "การเงิน / ภัยไซเบอร์",
    label: "SMS มิจฉาชีพ: หลอกกดลิงก์รับเงินไทยช่วยไทย 900 บาท",
    content: "https://today.line.me/th/v2/article/fake-sms-scam-reward-claim",
    result: {
      status: "success",
      input: {
        content: "https://today.line.me/th/v2/article/fake-sms-scam-reward-claim",
        method: "URL Link",
        original_url: "https://today.line.me/th/v2/article/fake-sms-scam-reward-claim",
        timeline: "2569",
        publish_date: "20 ส.ค. 2569",
        timestamp_display: "20 ส.ค. 2569"
      },
      verdict: {
        score: 1,
        summary: "ข่าวปลอมและกลโกงฟิชชิ่ง มิจฉาชีพส่ง SMS อ้างชื่อโครงการรัฐ แจกเงิน 900 บาท หลอกให้กดลิงก์ติดตั้งแอปดูดเงิน",
        supported_points: [
          "หน่วยงานรัฐและธนาคารพาณิชย์ไม่มีการส่ง SMS แนบลิงก์แจกเงินให้ประชาชนโดยตรง"
        ],
        conflicting_points: [
          "โครงการ 'ไทยช่วยไทย แจกเงิน 900 บาทต่อวัน' ไม่มีอยู่จริงในสารบบราชการ",
          "ลิงก์ที่แนบมาเป็นเว็บไซต์หลอกลวง (Phishing) ปลอมแปลงหน้าเว็บให้ดูเหมือนแอปธนาคาร"
        ],
        comparative_analysis: "กองบัญชาการตำรวจสืบสวนสอบสวนอาชญากรรมทางเทคโนโลยี (บช.สอท. หรือ ตำรวจไซเบอร์) ได้ออกประกาศเตือนภัยด่วน ระบุว่ามิจฉาชีพกำลังใช้วิธีการส่ง SMS ปลอมแปลง Sender Name อ้างเป็นหน่วยงานรัฐ เช่น กรมบัญชีกลาง กระทรวงการคลัง หรือธนาคาร แจ้งสิทธิ์รับเงินเยียวยา 900 บาท เมื่อเหยื่อหลงเชื่อกดลิงก์ จะถูกหลอกให้ดาวน์โหลดไฟล์ติดตั้ง APK ที่แฝงโปรแกรมควบคุมหน้าจอระยะไกล (Remote Access Trojan) และดูดเงินออกจากบัญชีธนาคารทั้งหมด",
        disinformation_category: "FINANCIAL_SCAM",
        disinformation_category_label: "การเงิน / ภัยไซเบอร์",
        sub_claims: [
          {
            claim_text: "รัฐบาลแจกเงินไทยช่วยไทย 900 บาทผ่าน SMS",
            score: 1,
            verdict_label: "เท็จ (0%)",
            detail: "เป็นข้อความหลอกลวงของแก๊งคอลเซ็นเตอร์"
          }
        ],
        security_warning: {
          is_suspicious: true,
          risk_level: "HIGH",
          reasons: ["URL หรือข้อความแอบอ้างสิทธิ์ทางการเงินของภาครัฐ", "เสี่ยงต่อการถูกหลอกติดตั้งมัลแวร์ควบคุมเครื่อง"],
          clean_domain: "today.line.me"
        },
        timeline: "2569",
        publish_date: "20 ส.ค. 2569"
      },
      references: [
        {
          title: "ตำรวจไซเบอร์เตือนภัย SMS อ้างแจกเงิน 900 บาท ห้ามกดลิงก์เด็ดขาด เสี่ยงโดนดูดเงิน",
          url: "https://www.thaipoliceonline.go.th/warning/sms-fake-900-scam",
          pub_date: "20 ส.ค. 2569",
          snippet: "บช.สอท. ย้ำเตือนประชาชน ธนาคารและหน่วยงานรัฐยกเลิกการส่ง SMS แนบลิงก์ทุกกรณี หากพบเห็นให้ลบทิ้งทันที",
          match_score: 0.99,
          relevance_pct: 99,
          source: "Thai Police Online",
          is_official_authority: true,
          authority_name: "ตำรวจไซเบอร์ (บช.สอท.)"
        }
      ],
      timing: { planner_ms: 190, scraper_ms: 320, search_ms: 410, analyzer_ms: 640, total_ms: 1560 },
      execution_time_seconds: 1.56
    }
  },

  // 8. True URL - Flash Flood News (Score 5)
  {
    id: "demo-real-url-1",
    verdict: "real",
    format: "url",
    score: 5,
    category: "DISASTER_SAFETY",
    categoryLabel: "ภัยพิบัติ / อุบัติภัย",
    label: "LINE Today: น้ำป่าทะลักท่วม อ.ปัว จ.น่าน เตือน 19-21 ส.ค. ฝนตกหนัก",
    content: "https://today.line.me/th/v2/article/peZQGNq",
    result: {
      status: "success",
      input: {
        content: "https://today.line.me/th/v2/article/peZQGNq",
        method: "URL Link",
        original_url: "https://today.line.me/th/v2/article/peZQGNq",
        timeline: "19-21 สิงหาคม 2569",
        publish_date: "20 ส.ค. 2569",
        timestamp_display: "20 ส.ค. 2569"
      },
      verdict: {
        score: 5,
        summary: "ข้อมูลจริง 100% สื่อหลักและ ปภ. ยืนยันเหตุน้ำป่าไหลหลากเข้าท่วมบ้านเรือนประชาชนใน อ.ปัว จ.น่าน พร้อมระดมกำลังเข้าช่วยเหลือ",
        supported_points: [
          "เกิดเหตุน้ำป่าไหลหลากจากอุทยานแห่งชาติดอยภูคาเข้าท่วมบ้านเรือนในพื้นที่ อ.ปัว จ.น่าน จริง",
          "จังหวัดน่านและหน่วยงาน ปภ. ลงพื้นที่ให้ความช่วยเหลือประชาชนและติดตั้งเครื่องสูบน้ำเร่งระบาย",
          "มีการแจ้งเตือนประชาชนริมตลิ่งให้ยกของขึ้นที่สูงเฝ้าระวังมวลน้ำระลอกใหม่"
        ],
        conflicting_points: [
          "ไม่พบข้อมูลขัดแย้ง เหตุการณ์และพื้นที่เกิดเหตุตรงตามรายงานข้อเท็จจริงของสื่อมวลชนและฝ่ายปกครอง"
        ],
        comparative_analysis: "จากการตรวจสอบเนื้อหาข่าวในลิงก์ LINE Today และเทียบเคียงกับรายงานสถานการณ์สาธารณภัยของกรมป้องกันและบรรเทาสาธารณภัย (ปภ.) รวมถึงสำนักข่าวไทยรัฐและมติชน ยืนยันตรงกันว่าเป็น 'ข่าวจริง (True)' โดยฝนที่ตกสะสมต่อเนื่องบนเทือกเขาดอยภูคาได้ทำให้ลำน้ำปัวเอ่อล้นเข้าท่วมพื้นที่ลุ่มต่ำในหลายตำบลของ อ.ปัว เจ้าหน้าที่ฝ่ายปกครองและทหารได้เข้าช่วยอพยพผู้สูงอายุและขนย้ายสิ่งของเรียบร้อยแล้ว",
        disinformation_category: "DISASTER_SAFETY",
        disinformation_category_label: "ภัยพิบัติ / อุบัติภัย",
        sub_claims: [
          {
            claim_text: "น้ำป่าไหลหลากท่วม อ.ปัว จ.น่าน",
            score: 5,
            verdict_label: "จริง (100%)",
            detail: "เกิดขึ้นจริงตามรายงานของฝ่ายปกครองและ ปภ. น่าน"
          }
        ],
        security_warning: {
          is_suspicious: false,
          risk_level: "SAFE",
          reasons: [],
          clean_domain: "today.line.me"
        },
        timeline: "19-21 สิงหาคม 2569",
        publish_date: "20 ส.ค. 2569"
      },
      references: [
        {
          title: "น่านวิกฤต! น้ำป่าทะลักท่วมบ้านเรือน อ.ปัว เจ้าหน้าที่เร่งอพยพชาวบ้าน",
          url: "https://www.thairath.co.th/news/local/north/2798124",
          pub_date: "20 ส.ค. 2569",
          snippet: "ไทยรัฐออนไลน์ รายงานสถานการณ์น้ำท่วมฉับพลันในพื้นที่ อ.ปัว จ.น่าน หลังฝนตกหนักสะสม",
          match_score: 0.98,
          relevance_pct: 98,
          source: "ไทยรัฐออนไลน์",
          is_official_authority: false
        },
        {
          title: "ปภ.น่าน รายงานสถานการณ์น้ำหลาก อ.ปัว ระดับน้ำเริ่มทรงตัว สั่งเฝ้าระวัง 24 ชม.",
          url: "https://www.disaster.go.th/th/news/nan-flood-august-2026",
          pub_date: "20 ส.ค. 2569",
          snippet: "สำนักงานป้องกันและบรรเทาสาธารณภัยจังหวัดน่าน รายงานสรุปสถานการณ์น้ำท่วมและการให้ความช่วยเหลือ",
          match_score: 0.96,
          relevance_pct: 96,
          source: "Disaster Prevention Nan",
          is_official_authority: true,
          authority_name: "ปภ. จังหวัดน่าน"
        }
      ],
      timing: { planner_ms: 180, scraper_ms: 310, search_ms: 390, analyzer_ms: 620, total_ms: 1500 },
      execution_time_seconds: 1.50
    }
  },

  // 9. Mostly True - Wage Policy Mixed (Score 4)
  {
    id: "demo-distort-mixed-1",
    verdict: "real",
    format: "mixed",
    score: 4,
    category: "PUBLIC_POLICY_GOV",
    categoryLabel: "นโยบายรัฐ / แรงงาน",
    label: "ปรับขึ้นค่าจ้างขั้นต่ำ 400 บาท นำร่องธุรกิจโรงแรม 4 ดาวขึ้นไปใน 10 จังหวัดท่องเที่ยว",
    content: "กระทรวงแรงงานเคาะปรับขึ้นอัตราค่าจ้างขั้นต่ำเป็นวันละ 400 บาท นำร่องกลุ่มธุรกิจโรงแรมและที่พักระดับ 4 ดาวขึ้นไปใน 10 จังหวัดท่องเที่ยวสำคัญ\nhttps://today.line.me/th/v2/article/VxR3MxV",
    result: {
      status: "success",
      input: {
        content: "กระทรวงแรงงานเคาะปรับขึ้นอัตราค่าจ้างขั้นต่ำเป็นวันละ 400 บาท นำร่องกลุ่มธุรกิจโรงแรมและที่พักระดับ 4 ดาวขึ้นไปใน 10 จังหวัดท่องเที่ยวสำคัญ\nhttps://today.line.me/th/v2/article/VxR3MxV",
        method: "URL Link",
        original_url: "https://today.line.me/th/v2/article/VxR3MxV",
        timeline: "2569",
        publish_date: "20 ส.ค. 2569",
        timestamp_display: "20 ส.ค. 2569"
      },
      verdict: {
        score: 4,
        summary: "ข้อมูลจริงเป็นส่วนใหญ่ คณะกรรมการค่าจ้างมีมติปรับขึ้นค่าจ้าง 400 บาทจริง เฉพาะในธุรกิจโรงแรมระดับ 4 ดาวขึ้นไปและมีลูกจ้างตั้งแต่ 50 คนขึ้นไปใน 10 พื้นที่ท่องเที่ยว",
        supported_points: [
          "คณะกรรมการค่าจ้าง (บอร์ดค่าจ้างชุดที่ 22) มีมติเห็นชอบปรับอัตราค่าจ้างขั้นต่ำ 400 บาทต่อวันจริง",
          "บังคับใช้เฉพาะประเภทกิจการโรงแรมระดับ 4 ดาวขึ้นไป และมีลูกจ้างตั้งแต่ 50 คนขึ้นไป",
          "ครอบคลุมพื้นที่นำร่อง 10 จังหวัดท่องเที่ยว เช่น ภูเก็ต, เกาะสมุย, พัทยา, เชียงใหม่, กรุงเทพฯ เฉพาะเขตที่กำหนด"
        ],
        conflicting_points: [
          "ไม่ได้เป็นการปรับขึ้นค่าจ้างขั้นต่ำ 400 บาทให้กับลูกจ้างทุกสาขาอาชีพทั่วประเทศตามที่มีการแชร์แบบเหมารวม"
        ],
        comparative_analysis: "จากการตรวจสอบประกาศราชกิจจานุเบกษาและมติคณะกรรมการค่าจ้าง กระทรวงแรงงาน พบว่าข่าวนี้เป็น 'เรื่องจริงเป็นส่วนใหญ่ (Mostly True)' รัฐบาลและบอร์ดค่าจ้างได้อนุมัติการปรับขึ้นค่าจ้าง 400 บาทจริง แต่มุ่งเน้นเฉพาะภาคการท่องเที่ยวที่มีความพร้อม โดยจำกัดเฉพาะโรงแรมขนาดใหญ่ที่มีมาตรฐาน 4 ดาวและมีลูกจ้างเกิน 50 คนในพื้นที่นำร่อง 10 จังหวัดเท่านั้น ยังไม่ได้ครอบคลุมโรงงาน ร้านค้า หรือธุรกิจทั่วไปทั้งประเทศ",
        disinformation_category: "PUBLIC_POLICY_GOV",
        disinformation_category_label: "นโยบายรัฐ / แรงงาน",
        sub_claims: [
          {
            claim_text: "มีการปรับขึ้นค่าแรงขั้นต่ำ 400 บาทต่อวัน",
            score: 5,
            verdict_label: "จริง (100%)",
            detail: "มีมติคณะกรรมการค่าจ้างประกาศใช้จริง"
          },
          {
            claim_text: "ปรับขึ้นทุกอาชีพทั่วประเทศ",
            score: 1,
            verdict_label: "เท็จ (0%)",
            detail: "บังคับใช้เฉพาะธุรกิจโรงแรม 4 ดาวขึ้นไปใน 10 จังหวัดนำร่อง"
          }
        ],
        security_warning: {
          is_suspicious: false,
          risk_level: "SAFE",
          reasons: [],
          clean_domain: "today.line.me"
        },
        timeline: "2569",
        publish_date: "20 ส.ค. 2569"
      },
      references: [
        {
          title: "ราชกิจจานุเบกษา ประกาศขึ้นค่าจ้างขั้นต่ำ 400 บาท 10 จังหวัดท่องเที่ยว ธุรกิจโรงแรม 4 ดาว",
          url: "https://www.mol.go.th/news/minimum-wage-400-hotel-sector-2026",
          pub_date: "19 ส.ค. 2569",
          snippet: "กระทรวงแรงงาน เผยแพร่ประกาศคณะกรรมการค่าจ้าง กำหนดอัตราค่าจ้างขั้นต่ำ 400 บาทในธุรกิจโรงแรม",
          match_score: 0.99,
          relevance_pct: 99,
          source: "Ministry of Labour",
          is_official_authority: true,
          authority_name: "กระทรวงแรงงาน"
        }
      ],
      timing: { planner_ms: 200, scraper_ms: 330, search_ms: 420, analyzer_ms: 660, total_ms: 1610 },
      execution_time_seconds: 1.61
    }
  },

  // 10. True Mixed - Cyber Police +697 Prefix Warning (Score 5)
  {
    id: "demo-real-mixed-2",
    verdict: "real",
    format: "mixed",
    score: 5,
    category: "FINANCIAL_SCAM",
    categoryLabel: "ความปลอดภัยไซเบอร์ / เตือนภัย",
    label: "กสทช. และตำรวจไซเบอร์เตือนภัย เบอร์โทรขึ้นต้นด้วย +697 ห้ามรับสายเด็ดขาด",
    content: "กสทช. ประสานผู้ให้บริการโทรศัพท์เคลื่อนที่ เพิ่มรหัส +697 นำหน้าเบอร์โทรข้ามแดนผ่านอินเทอร์เน็ต เพื่อเตือนภัยประชาชนให้ระวังแก๊งคอลเซ็นเตอร์โทรหลอกลวง\nhttps://today.line.me/th/v2/article/8noPO6K",
    result: {
      status: "success",
      input: {
        content: "กสทช. ประสานผู้ให้บริการโทรศัพท์เคลื่อนที่ เพิ่มรหัส +697 นำหน้าเบอร์โทรข้ามแดนผ่านอินเทอร์เน็ต เพื่อเตือนภัยประชาชนให้ระวังแก๊งคอลเซ็นเตอร์โทรหลอกลวง\nhttps://today.line.me/th/v2/article/8noPO6K",
        method: "URL Link",
        original_url: "https://today.line.me/th/v2/article/8noPO6K",
        timeline: "2569",
        publish_date: "20 ส.ค. 2569",
        timestamp_display: "20 ส.ค. 2569"
      },
      verdict: {
        score: 5,
        summary: "ข้อมูลจริง 100% กสทช. ได้กำหนดรหัส +697 และ +698 นำหน้าเบอร์โทรที่โทรผ่านระบบอินเทอร์เน็ต (VoIP) จากต่างประเทศจริง เพื่อให้ประชาชนสังเกตและระวังสายแก๊งคอลเซ็นเตอร์",
        supported_points: [
          "สำนักงาน กสทช. ออกมาตรการร่วมกับค่ายมือถือ กำหนดรหัส +697 นำหน้าเบอร์โทรข้ามประเทศผ่านอินเทอร์เน็ต (VoIP) จริง",
          "รหัส +697 ช่วยให้ประชาชนทราบทันทีว่าสายที่โทรเข้ามาไม่ได้มาจากเสาสัญญาณปกติในประเทศ",
          "หากไม่มีญาติหรือธุระติดต่อต่างประเทศ ประชาชนสามารถตัดสายหรือไม่รับสายได้ทันทีเพื่อความปลอดภัย"
        ],
        conflicting_points: [
          "ไม่พบข้อมูลขัดแย้ง มาตรการดังกล่าวเป็นข้อกำหนดบังคับใช้จริงของ กสทช. และตำรวจไซเบอร์"
        ],
        comparative_analysis: "จากการตรวจสอบกับประกาศอย่างเป็นทางการของสำนักงาน กสทช. (nbtc.go.th) และกองบัญชาการตำรวจสืบสวนสอบสวนอาชญากรรมทางเทคโนโลยี (บช.สอท.) พบว่าเป็น 'เรื่องจริง (True)' โดยมาตรการใส่รหัส +697 และ +698 เป็นหนึ่งในมาตรการสกัดกั้นแก๊งคอลเซ็นเตอร์ที่ลักลอบแปลงสัญญาณโทรศัพท์ผ่านระบบคอมพิวเตอร์เข้ามาในไทย ประชาชนสามารถตั้งค่าปฏิเสธการรับสายรหัสต่างประเทศดังกล่าวบนสมาร์ตโฟนได้โดยตรง",
        disinformation_category: "FINANCIAL_SCAM",
        disinformation_category_label: "ความปลอดภัยไซเบอร์ / เตือนภัย",
        sub_claims: [
          {
            claim_text: "กสทช. กำหนดรหัส +697 เตือนเบอร์โทรผ่านเน็ตจากต่างประเทศ",
            score: 5,
            verdict_label: "จริง (100%)",
            detail: "เป็นมาตรการความปลอดภัยโทรคมนาคมแห่งชาติ"
          }
        ],
        security_warning: {
          is_suspicious: false,
          risk_level: "SAFE",
          reasons: [],
          clean_domain: "today.line.me"
        },
        timeline: "2569",
        publish_date: "20 ส.ค. 2569"
      },
      references: [
        {
          title: "กสทช. ย้ำเบอร์โทรขึ้นต้น +697 และ +698 เป็นสายผ่านอินเทอร์เน็ตจากต่างประเทศ แนะระวังแก๊งคอลเซ็นเตอร์",
          url: "https://www.nbtc.go.th/News/Press-Center/nbtc-prefix-697-warning.aspx",
          pub_date: "20 ส.ค. 2569",
          snippet: "สำนักงาน กสทช. เผยมาตรการป้องกันคอลเซ็นเตอร์ กำหนดรหัสแสดงหน้าจอให้ประชาชนรู้ตัวก่อนรับสาย",
          match_score: 0.99,
          relevance_pct: 99,
          source: "NBTC Thailand",
          is_official_authority: true,
          authority_name: "สำนักงาน กสทช."
        },
        {
          title: "ตร.ไซเบอร์แนะวิธีบล็อกเบอร์ +697 บนมือถือ ตัดวงจรแก๊งคอลเซ็นเตอร์หลอกลวง",
          url: "https://www.thaipoliceonline.go.th/tip/how-to-block-697",
          pub_date: "19 ส.ค. 2569",
          snippet: "ตำรวจไซเบอร์แนะนำขั้นตอนการตั้งค่าปฏิเสธสายที่ไม่รู้จักและสายโทรข้ามประเทศ",
          match_score: 0.95,
          relevance_pct: 95,
          source: "Thai Police Online",
          is_official_authority: true,
          authority_name: "ตำรวจไซเบอร์ (บช.สอท.)"
        }
      ],
      timing: { planner_ms: 190, scraper_ms: 310, search_ms: 380, analyzer_ms: 600, total_ms: 1480 },
      execution_time_seconds: 1.48
    }
  }
];

export function getDemoFactCheckResult(queryOrUrl: string): FactCheckResult | null {
  const clean = (queryOrUrl || "").trim().toLowerCase();
  if (!clean) return null;

  // 1. Direct ID match
  const byId = DEMO_TOPICS_10.find((item) => item.id.toLowerCase() === clean);
  if (byId) return byId.result;

  // 2. Exact or substring match on content or url
  for (const item of DEMO_TOPICS_10) {
    const itemContent = item.content.toLowerCase();
    const itemLabel = item.label.toLowerCase();
    if (
      itemContent === clean ||
      clean === itemContent ||
      itemContent.includes(clean) ||
      clean.includes(itemContent) ||
      itemLabel.includes(clean) ||
      clean.includes(itemLabel)
    ) {
      return item.result;
    }

    // Check URL matches
    if (item.format === "url" || item.format === "mixed") {
      const urlMatch = item.content.match(/https?:\/\/[^\s]+/i);
      if (urlMatch && clean.includes(urlMatch[0].toLowerCase())) {
        return item.result;
      }
    }
  }

  // 3. Fallback to closest matching topic by keywords
  if (clean.includes("5,000") || clean.includes("5000") || clean.includes("กระทรวงการคลัง") && clean.includes("ไลน์")) {
    return DEMO_TOPICS_10[0].result;
  }
  if (clean.includes("มะนาว") || clean.includes("โซดา") || clean.includes("มะเร็ง")) {
    return DEMO_TOPICS_10[1].result;
  }
  if (clean.includes("พายุ") || clean.includes("อุตุนิยมวิทยา") || clean.includes("ฝนตก")) {
    return DEMO_TOPICS_10[2].result;
  }
  if (clean.includes("ดิจิทัล") || clean.includes("10,000") || clean.includes("วอลเล็ต")) {
    return DEMO_TOPICS_10[3].result;
  }
  if (clean.includes("ไข้เลือดออก") || clean.includes("ยุงลาย") || clean.includes("3 เก็บ")) {
    return DEMO_TOPICS_10[4].result;
  }
  if (clean.includes("ดาวเคราะห์") || clean.includes("เจมส์ เวบบ์") || clean.includes("lhs 1140")) {
    return DEMO_TOPICS_10[5].result;
  }
  if (clean.includes("900") || clean.includes("ไทยช่วยไทย") || clean.includes("sms")) {
    return DEMO_TOPICS_10[6].result;
  }
  if (clean.includes("น้ำป่า") || clean.includes("น่าน") || clean.includes("ปัว")) {
    return DEMO_TOPICS_10[7].result;
  }
  if (clean.includes("400") || clean.includes("ค่าจ้าง") || clean.includes("ค่าแรง") || clean.includes("โรงแรม")) {
    return DEMO_TOPICS_10[8].result;
  }
  if (clean.includes("+697") || clean.includes("กสทช") || clean.includes("คอลเซ็นเตอร์")) {
    return DEMO_TOPICS_10[9].result;
  }

  return null;
}
