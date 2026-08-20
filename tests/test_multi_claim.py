"""Unit tests for Multi-Claim Breakdown and Disinformation Categorization."""

import unittest
from core.llm import validate_ai_response
from core.pipeline import get_anonymous_threat_trends, record_anonymous_trend

class TestMultiClaimAndTrends(unittest.TestCase):

    def test_sub_claims_normalization(self):
        sample_ai_response = {
            "score": 3,
            "verdict_summary": "พบข้อมูลผสมระหว่างเรื่องจริงและข่าวปลอม",
            "comparative_analysis": "บทวิเคราะห์เปรียบเทียบเชิงลึก",
            "disinformation_category": "PUBLIC_POLICY_GOV",
            "sub_claims": [
                {
                    "claim_text": "น้ำท่วมหนักในพื้นที่ภาคเหนือ",
                    "score": 5,
                    "verdict_label": "จริง (100%)",
                    "detail": "สื่อหลักรายงานตรงกัน"
                },
                {
                    "claim_text": "รัฐบาลแจกเงินเยียวยาพิเศษ 50,000 บาททันที",
                    "score": 1,
                    "verdict_label": "เท็จ/ข่าวปลอม (0%)",
                    "detail": "หน่วยงานชี้แจงปฏิเสธว่าไม่มีนโยบายนี้"
                }
            ],
            "supported_points": ["น้ำท่วมในพื้นที่ภาคเหนือเป็นความจริง"],
            "conflicting_points": ["ไม่มีการแจกเงินเยียวยา 50,000 บาทตามที่อ้าง"]
        }

        validated = validate_ai_response(sample_ai_response)
        self.assertEqual(validated["score"], 3)
        self.assertEqual(validated["disinformation_category"], "PUBLIC_POLICY_GOV")
        self.assertEqual(validated["disinformation_category_label"], "นโยบายรัฐ / สวัสดิการ")
        self.assertEqual(len(validated["sub_claims"]), 2)
        self.assertEqual(validated["sub_claims"][0]["score"], 5)
        self.assertEqual(validated["sub_claims"][1]["score"], 1)

    def test_anonymous_threat_trends_recording(self):
        record_anonymous_trend("FINANCIAL_SCAM", is_threat=True)
        stats = get_anonymous_threat_trends()
        self.assertGreater(stats["total_checks"], 0)
        self.assertGreater(stats["categories"]["FINANCIAL_SCAM"], 0)
        self.assertGreater(stats["threats_detected"], 0)

if __name__ == "__main__":
    unittest.main()
