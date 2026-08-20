"""Domain Security, Anti-Phishing, and Fake Domain Heuristics Module.

Detects suspicious brand spoofing, typosquatting, high-risk TLDs,
and phishing heuristics to safeguard users against fraudulent websites.
"""

import re
from urllib.parse import urlparse

# High-risk TLDs frequently utilized by scammers/phishing operations
SUSPICIOUS_TLDS = {
    ".xyz", ".top", ".tk", ".ml", ".ga", ".cf", ".gq",
    ".buzz", ".work", ".click", ".link", ".fit", ".rest",
    ".surf", ".monster", ".quest", ".icu", ".cam", ".vip",
    ".sbs", ".cfd", ".skin", ".today", ".live"
}

# Major Thai news outlets, banks, and official institutions for spoofing detection
LEGITIMATE_AUTHORITY_DOMAINS = {
    "thairath.co.th": "ไทยรัฐ",
    "dailynews.co.th": "เดลินิวส์",
    "matichon.co.th": "มติชน",
    "khaosod.co.th": "ข่าวสด",
    "bangkokbiznews.com": "กรุงเทพธุรกิจ",
    "thaipbs.or.th": "Thai PBS",
    "pptvhd36.com": "PPTV HD 36",
    "sanook.com": "Sanook",
    "mgronline.com": "ผู้จัดการออนไลน์",
    "ch3plus.com": "ช่อง 3",
    "ch7.com": "ช่อง 7HD",
    "one31.net": "ช่อง ONE 31",
    "antifakenewscenter.com": "ศูนย์ต่อต้านข่าวปลอม",
    "bot.or.th": "ธนาคารแห่งประเทศไทย",
    "scb.co.th": "ธนาคารไทยพาณิชย์",
    "kasikornbank.com": "ธนาคารกสิกรไทย",
    "krungthai.com": "ธนาคารกรุงไทย",
    "bangkokbank.com": "ธนาคารกรุงเทพ",
    "ttbbank.com": "ธนาคารทหารไทยธนชาต",
    "gsb.or.th": "ธนาคารออมสิน",
    "baac.or.th": "ธ.ก.ส.",
    "sso.go.th": "สำนักงานประกันสังคม",
    "rd.go.th": "กรมสรรพากร",
    "dlt.go.th": "กรมการขนส่งทางบก",
    "thaipoliceonline.go.th": "ศูนย์ปราบปรามอาชญากรรมทางเทคโนโลยีสารสนเทศ",
}

# Well-known reputable social/tech domains
TRUSTED_GLOBAL_DOMAINS = {
    "facebook.com", "m.facebook.com", "fb.com", "fb.watch",
    "x.com", "twitter.com", "instagram.com", "threads.net",
    "youtube.com", "youtu.be", "tiktok.com", "line.me",
    "today.line.me", "google.com", "bbc.com", "reuters.com"
}

# Brand names commonly targeted by typosquatting/phishing
TARGET_BRAND_KEYWORDS = [
    "thairath", "khaosod", "sanook", "matichon", "dailynews",
    "scb", "kasikorn", "kbank", "krungthai", "bangkokbank",
    "gsb", "baac", "ttb", "sso", "police", "antifake",
    "thaipost", "thaipbs"
]

# Suspicious URL keywords indicative of scams / phishing lures
SUSPICIOUS_URL_KEYWORDS = [
    "login", "signin", "verify", "claim", "reward", "bonus",
    "register", "free-money", "loan-online", "invest", "crypto",
    "แจกเงิน", "กู้เงิน", "รับสิทธิ์", "ลงทะเบียนรับ", "ยืนยันตัวตน",
    "ถอนเงิน", "คืนภาษี", "แจกทอง", "งานออนไลน์"
]

def extract_registered_domain(hostname: str) -> str:
    """Extract clean domain name (e.g., 'news.thairath.co.th' -> 'thairath.co.th')."""
    if not hostname:
        return ""
    host = hostname.lower().strip()
    # Remove port if present
    if ":" in host:
        host = host.split(":")[0]
    return host

def analyze_domain_risk(url: str) -> dict:
    """Analyze URL and domain for potential phishing, impersonation, or high-risk indicators.
    
    Returns:
        dict: {
            "is_suspicious": bool,
            "risk_level": "HIGH" | "MEDIUM" | "LOW" | "SAFE",
            "reasons": list[str],
            "is_official_authority": bool,
            "authority_name": str | None,
            "clean_domain": str
        }
    """
    if not url:
        return {
            "is_suspicious": False,
            "risk_level": "SAFE",
            "reasons": [],
            "is_official_authority": False,
            "authority_name": None,
            "clean_domain": ""
        }

    try:
        parsed = urlparse(url if "://" in url else f"http://{url}")
        host = extract_registered_domain(parsed.hostname or "")
        path_query = (parsed.path + " " + parsed.query).lower()
    except Exception:
        return {
            "is_suspicious": True,
            "risk_level": "HIGH",
            "reasons": ["รูปแบบ URL ไม่ถูกต้องหรือไม่ปลอดภัย"],
            "is_official_authority": False,
            "authority_name": None,
            "clean_domain": ""
        }

    reasons = []
    risk_level = "SAFE"
    is_official_authority = False
    authority_name = None

    # 1. Check if it's an official recognized authority domain
    for auth_dom, name in LEGITIMATE_AUTHORITY_DOMAINS.items():
        if host == auth_dom or host.endswith(f".{auth_dom}"):
            is_official_authority = True
            authority_name = name
            break

    if not is_official_authority:
        if host.endswith(".go.th") or host.endswith(".gov"):
            is_official_authority = True
            authority_name = "หน่วยงานภาครัฐ"

    if is_official_authority:
        return {
            "is_suspicious": False,
            "risk_level": "SAFE",
            "reasons": [],
            "is_official_authority": True,
            "authority_name": authority_name,
            "clean_domain": host
        }

    # 2. Check if trusted global platform
    for trust_dom in TRUSTED_GLOBAL_DOMAINS:
        if host == trust_dom or host.endswith(f".{trust_dom}"):
            return {
                "is_suspicious": False,
                "risk_level": "SAFE",
                "reasons": [],
                "is_official_authority": False,
                "authority_name": None,
                "clean_domain": host
            }

    # 3. IP Address in Hostname
    if re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', host):
        reasons.append("ใช้หมายเลข IP Address แทนชื่อโดเมน ซึ่งมักพบในเว็บฟิชชิ่ง")
        risk_level = "HIGH"

    # 4. Check for Brand Impersonation / Typosquatting
    for brand in TARGET_BRAND_KEYWORDS:
        if brand in host:
            # Check if it's NOT the actual legitimate domain
            is_legit = any(host == leg or host.endswith(f".{leg}") for leg in LEGITIMATE_AUTHORITY_DOMAINS.keys())
            if not is_legit:
                reasons.append(f"พบการใช้ชื่อแบรนด์หรือองค์กร '{brand}' ในโดเมนที่ไม่ใช่เว็บทางการ เข้าข่ายแอบอ้าง/เลียนแบบ")
                risk_level = "HIGH"

    # 5. Check for Suspicious / Disposable TLDs
    for tld in SUSPICIOUS_TLDS:
        if host.endswith(tld):
            reasons.append(f"ใช้โดเมนระดับบนสุด (TLD) '{tld}' ซึ่งมีความเสี่ยงสูงและมักถูกใช้ในการหลอกลวง")
            if risk_level != "HIGH":
                risk_level = "MEDIUM"
            break

    # 6. Check for Phishing Lure Keywords in Path / Query
    matched_lures = [k for k in SUSPICIOUS_URL_KEYWORDS if k in path_query or k in host]
    if len(matched_lures) >= 2:
        reasons.append(f"พบคำชักชวน/ต้องสงสัยใน URL: {', '.join(matched_lures[:3])}")
        risk_level = "HIGH"
    elif len(matched_lures) == 1 and risk_level == "MEDIUM":
        risk_level = "HIGH"

    # 7. Excessive Hyphens or Subdomains (e.g. login-secure-scb-verify.online)
    if host.count("-") >= 3 or host.count(".") >= 4:
        reasons.append("โครงสร้างชื่อโดเมนมีความซับซ้อนผิดปกติ (มีเครื่องหมายขีดหรือซับโดเมนจำนวนมาก)")
        if risk_level == "SAFE":
            risk_level = "MEDIUM"

    is_suspicious = risk_level in ["HIGH", "MEDIUM"]

    return {
        "is_suspicious": is_suspicious,
        "risk_level": risk_level,
        "reasons": reasons,
        "is_official_authority": is_official_authority,
        "authority_name": authority_name,
        "clean_domain": host
    }
