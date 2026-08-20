"""Unit tests for Domain Security, Anti-Phishing, and Fake Domain Heuristics."""

import unittest
from core.domain_security import analyze_domain_risk, extract_registered_domain

class TestDomainSecurity(unittest.TestCase):

    def test_official_government_and_news_domains(self):
        res = analyze_domain_risk("https://www.thairath.co.th/news/local/123456")
        self.assertFalse(res["is_suspicious"])
        self.assertEqual(res["risk_level"], "SAFE")
        self.assertTrue(res["is_official_authority"])
        self.assertEqual(res["authority_name"], "ไทยรัฐ")

        res_gov = analyze_domain_risk("https://antifakenewscenter.com/check/article/1")
        self.assertTrue(res_gov["is_official_authority"])
        self.assertFalse(res_gov["is_suspicious"])

        res_sso = analyze_domain_risk("https://www.sso.go.th/e-service/")
        self.assertTrue(res_sso["is_official_authority"])
        self.assertEqual(res_sso["authority_name"], "สำนักงานประกันสังคม")

    def test_typosquatting_and_brand_impersonation(self):
        # Fake Thairath phishing domain
        res_fake_thairath = analyze_domain_risk("http://thairath-news-online.xyz/claim-money")
        self.assertTrue(res_fake_thairath["is_suspicious"])
        self.assertEqual(res_fake_thairath["risk_level"], "HIGH")
        self.assertTrue(any("thairath" in r.lower() for r in res_fake_thairath["reasons"]))

        # Fake SCB phishing domain
        res_fake_scb = analyze_domain_risk("https://scb-easy-verify-account.top/login")
        self.assertTrue(res_fake_scb["is_suspicious"])
        self.assertEqual(res_fake_scb["risk_level"], "HIGH")

    def test_suspicious_disposable_tlds(self):
        res_tld = analyze_domain_risk("http://urgent-breaking-fund.buzz/register")
        self.assertTrue(res_tld["is_suspicious"])
        self.assertIn(res_tld["risk_level"], ["HIGH", "MEDIUM"])

    def test_raw_ip_address_detection(self):
        res_ip = analyze_domain_risk("http://192.168.1.100/secure/login.php")
        self.assertTrue(res_ip["is_suspicious"])
        self.assertEqual(res_ip["risk_level"], "HIGH")

    def test_trusted_global_platforms(self):
        res_fb = analyze_domain_risk("https://www.facebook.com/thairath/posts/101")
        self.assertFalse(res_fb["is_suspicious"])
        self.assertEqual(res_fb["risk_level"], "SAFE")

        res_line = analyze_domain_risk("https://today.line.me/th/v3/article/ZaRQ0WQ")
        self.assertFalse(res_line["is_suspicious"])
        self.assertEqual(res_line["risk_level"], "SAFE")

if __name__ == "__main__":
    unittest.main()
