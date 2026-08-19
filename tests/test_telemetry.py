"""Unit tests for telemetry payload construction matching Google Apps Script doPost schema."""

import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.telemetry import _send_telemetry_worker


class TelemetryWorkerTest(unittest.TestCase):
    @patch("core.telemetry.requests.post")
    def test_url_input_payload_matches_apps_script_schema(self, mock_post):
        mock_post.return_value.status_code = 200

        mock_refs = [
            {"title": 'เจอแล้ว "น้ำฝน" เพื่อนสนิทที่เคยออมเงินให้ "อิงฟ้า วราหะ" ก่อนเข้าวงการ', "url": "https://thethaiger.com/th/news/1575816/"},
            {"title": "วันที่รอคอย! อิงฟ้า วราหะ เผยเพื่อนสนิทช่วยเหลือในวัยเรียน?", "url": "https://today.line.me/th/v3/article/j7KW073"},
            {"title": "ฮือฮาทั้งโซเชียล อิงฟ้า ตามหาเพื่อนสนิท ที่หายไปนาน 20 ปี", "url": "https://today.line.me/th/v3/article/eLKekOO"}
        ]

        with patch("core.telemetry.GSHEETS_WEBHOOK_URL", "https://script.google.com/macros/s/test/exec"):
            _send_telemetry_worker(
                query="https://www.instagram.com/p/DZZFPnaDIKI/",
                score=5,
                verdict="ข้อความดังกล่าวสอดคล้องกับข้อเท็จจริง",
                ref_count=3,
                execution_time=11.66,
                status="success",
                method="URL Link",
                original_url="https://www.instagram.com/p/DZZFPnaDIKI/",
                topic="อิงฟ้า วราหะ เพื่อนรัก",
                references=mock_refs
            )

        self.assertTrue(mock_post.called)
        sent_json = mock_post.call_args[1]["json"]

        # Exactly matches Apps Script:
        # data.timestamp, data.input_type, data.short_input, data.search_query, data.ref_count, data.ref_details, data.score, data.process_time
        self.assertIn("timestamp", sent_json)
        self.assertEqual(sent_json["input_type"], "URL Link")
        self.assertEqual(sent_json["short_input"], "[https://www.instagram.com/p/DZZFPnaDIKI/](https://www.instagram.com/p/DZZFPnaDIKI/)")
        self.assertEqual(sent_json["search_query"], "อิงฟ้า วราหะ เพื่อนรัก")
        self.assertEqual(sent_json["ref_count"], 3)
        self.assertIn("1. เจอแล้ว", sent_json["ref_details"])
        self.assertIn("https://thethaiger.com/th/news/1575816/", sent_json["ref_details"])
        self.assertIn("2. วันที่รอคอย!", sent_json["ref_details"])
        self.assertIn("3. ฮือฮาทั้งโซเชียล", sent_json["ref_details"])
        self.assertEqual(sent_json["score"], "ระดับ 5 (100%)")
        self.assertEqual(sent_json["process_time"], 11.66)

    @patch("core.telemetry.requests.post")
    def test_direct_text_payload_matches_apps_script_schema(self, mock_post):
        mock_post.return_value.status_code = 200

        with patch("core.telemetry.GSHEETS_WEBHOOK_URL", "https://script.google.com/macros/s/test/exec"):
            _send_telemetry_worker(
                query="แจกเงินดิจิทัล 10,000 บาท รอบ 2 เริ่มเดือนหน้า",
                score=1,
                verdict="ไม่มีการประกาศดังกล่าว ข้อมูลเท็จ",
                ref_count=1,
                execution_time=4.25,
                status="success",
                method="Direct Text",
                original_url="",
                topic="แจกเงินดิจิทัล 10,000 บาท",
                references=[{"title": "กระทรวงการคลังเตือนภัยข่าวปลอมเงินดิจิทัล", "url": "https://antifakenewscenter.com/123"}]
            )

        self.assertTrue(mock_post.called)
        sent_json = mock_post.call_args[1]["json"]

        self.assertEqual(sent_json["input_type"], "Direct Text")
        self.assertEqual(sent_json["short_input"], "แจกเงินดิจิทัล 10,000 บาท รอบ 2 เริ่มเดือนหน้า")
        self.assertEqual(sent_json["search_query"], "แจกเงินดิจิทัล 10,000 บาท")
        self.assertEqual(sent_json["ref_count"], 1)
        self.assertIn("antifakenewscenter.com", sent_json["ref_details"])
        self.assertEqual(sent_json["score"], "ระดับ 1 (0%)")
        self.assertEqual(sent_json["process_time"], 4.25)


if __name__ == "__main__":
    unittest.main()
