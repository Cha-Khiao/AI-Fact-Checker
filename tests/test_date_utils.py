"""Unit tests for the Universal Date & Time Extraction Engine."""

import unittest
from datetime import datetime, timedelta
import pytz
from core.date_utils import (
    parse_thai_and_global_date,
    compute_relative_thai_time,
    parse_iso_or_structured_date,
    format_thai_date,
    BANGKOK_TZ,
)

class TestUniversalDateUtils(unittest.TestCase):

    def test_thai_relative_hours(self):
        iso, display, is_fresh = parse_thai_and_global_date("โพสต์นี้เผยแพร่เมื่อ 9 ชั่วโมงที่ผ่านมา ที่กรุงเทพฯ")
        self.assertEqual(display, "9 ชั่วโมงที่ผ่านมา")
        self.assertTrue(is_fresh)

        iso, display, is_fresh = parse_thai_and_global_date("ข่าวด่วน 3 ชม.ที่แล้ว ตำรวจบุกจับ")
        self.assertEqual(display, "3 ชั่วโมงที่ผ่านมา")
        self.assertTrue(is_fresh)

    def test_social_dot_format(self):
        iso, display, is_fresh = parse_thai_and_global_date("ไทยรัฐนิวส์โชว์ · 9 ชม. · เจ้าหน้าที่เข้าตรวจสอบ")
        self.assertEqual(display, "9 ชั่วโมงที่ผ่านมา")
        self.assertTrue(is_fresh)

    def test_thai_relative_minutes(self):
        iso, display, is_fresh = parse_thai_and_global_date("อัปเดตเมื่อ 15 นาทีที่แล้ว")
        self.assertEqual(display, "15 นาทีที่แล้ว")
        self.assertTrue(is_fresh)

    def test_thai_relative_days(self):
        iso, display, is_fresh = parse_thai_and_global_date("เกิดเหตุเมื่อ 3 วันก่อน ในพื้นที่พัทยา")
        self.assertEqual(display, "3 วันก่อน")

    def test_yesterday_and_today(self):
        iso, display, is_fresh = parse_thai_and_global_date("รายงานเมื่อวานนี้ เวลา 14:30 น.")
        self.assertIn("เมื่อวานนี้", display)
        self.assertTrue(is_fresh)

    def test_thai_explicit_buddhist_era(self):
        iso, display, is_fresh = parse_thai_and_global_date("แถลงการณ์ วันที่ 15 สิงหาคม พ.ศ. 2568 เวลา 10:00 น.")
        self.assertEqual(iso, "2025-08-15")
        self.assertIn("15 สิงหาคม 2568", display)

    def test_english_relative_and_explicit(self):
        iso, display, is_fresh = parse_thai_and_global_date("Breaking news: 5 hours ago the event happened")
        self.assertEqual(display, "5 ชั่วโมงที่ผ่านมา")
        self.assertTrue(is_fresh)

        iso, display, is_fresh = parse_thai_and_global_date("Published on August 10, 2025")
        self.assertEqual(iso, "2025-08-10")

    def test_metadata_date_priority(self):
        iso, display, is_fresh = parse_thai_and_global_date(
            "ข้อความไม่มีวันที่ระบุชัดเจน",
            metadata_date="2026-08-19T10:30:00+07:00"
        )
        self.assertEqual(iso, "2026-08-19")
        self.assertTrue(is_fresh)

    def test_noise_rejection(self):
        # Noise like "อ่านล่าสุด 5 นาทีที่แล้ว" should not override empty or real content
        iso, display, is_fresh = parse_thai_and_global_date("ยอดวิว 500,000 ครั้ง สงวนลิขสิทธิ์ 2569")
        self.assertEqual(display, "ไม่ระบุในข้อความ")

if __name__ == "__main__":
    unittest.main()
