import unittest
from core.search import is_actual_article
from core.scraper import extract_text_from_url
from core.pipeline import run_factcheck_pipeline

class TestGalleryBlocker(unittest.TestCase):

    def test_sanook_gallery_url_and_title(self):
        url = "https://www.sanook.com/women/195053/gallery/2012721/"
        title = '[รวมรูปภาพของ มิตรภาพนางงาม "อิงฟ้า วราหะ" ไลฟ์เพื่อนนางงามพูดไทย น่ารักมาก (มีคลิป) รูปที่ 7 จาก 12]'
        self.assertFalse(is_actual_article(url, title))

    def test_gallery_paths_rejected(self):
        bad_urls = [
            "https://www.sanook.com/news/12345/gallery/67890/",
            "https://women.kapook.com/photo/12345_678.html",
            "https://www.thairath.co.th/gallery/12345",
            "https://www.khaosod.co.th/lifestyle/album/9999",
            "https://entertain.teenee.com/picture/4567.html",
            "https://mgronline.com/entertainment/wallpapers/111",
        ]
        for u in bad_urls:
            self.assertFalse(is_actual_article(u, "ข่าวสารทั่วไป"), f"Failed to reject gallery url: {u}")

    def test_gallery_titles_rejected(self):
        bad_titles = [
            "[รวมรูปภาพของ ดาราหนุ่ม]",
            "[ภาพชุด] งานแต่งดาราดัง สวยงามอลังการ",
            "[ประมวลภาพ] พิธีเปิดการแข่งขันกีฬาแห่งชาติ",
            "[อัลบั้มภาพ] แฟชั่นเซ็ตใหม่ล่าสุด",
            "ส่องภาพความน่ารัก น้องหมาไซบีเรียน รูปที่ 1 จาก 10",
            "รวมภาพสวย คอนเสิร์ตใหญ่ ภาพที่ 5 จาก 20",
            "แจกวอลเปเปอร์สายมู ประจำวันเกิด",
            "[photo gallery] live concert highlights",
        ]
        for t in bad_titles:
            self.assertFalse(is_actual_article("https://www.thairath.co.th/news/general/123456", t), f"Failed to reject title: {t}")

    def test_legitimate_news_articles_accepted(self):
        good_articles = [
            ("https://www.thairath.co.th/news/politic/2841920", "อนุทิน สั่งสอบข้อเท็จจริงปมความเสียหาย 4.5 พันล้าน"),
            ("https://www.sanook.com/news/9248210/", "กฟภ. เตือนภัยประชาชนอย่าหลงเชื่อมิจฉาชีพอ้างคืนเงินค่าประกันมิเตอร์"),
            ("https://www.dailynews.co.th/news/1234567/", "ตำรวจไซเบอร์บุกทลายแก๊งคอลเซ็นเตอร์"),
        ]
        for u, t in good_articles:
            self.assertTrue(is_actual_article(u, t), f"Legitimate article falsely rejected: {u}")

    def test_scraper_detects_image_and_gallery(self):
        gallery_url = "https://www.sanook.com/women/195053/gallery/2012721/"
        res = extract_text_from_url(gallery_url)
        self.assertEqual(res.get("error"), "IMAGE_DETECTED")

    def test_pipeline_handles_image_detected(self):
        out = run_factcheck_pipeline("IMAGE_DETECTED")
        self.assertEqual(out["result"]["verdict_summary"], "พบรูปภาพ/อัลบั้มรูปภาพ")

if __name__ == '__main__':
    unittest.main()
