import os
import requests
import re
import concurrent.futures
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

# 💡 ฟังก์ชันเชื่อมต่อกับ Exa AI API
def fetch_exa_api(payload, api_key, timeout=25):
    url = "https://api.exa.ai/search"
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "x-api-key": api_key
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=timeout)
        response.raise_for_status()
        data = response.json()
        return data.get("results", [])
    except Exception as e:
        print(f"❌ Exa API Error: {e}")
        return []

def search_news_references(query: str, num_results: int = 10, source_url: str = "") -> list:
    if not query.strip() or query == "SKIP_SEARCH": 
        return []
    
    exa_api_key = os.getenv("EXA_API_KEY", "").strip()
    if not exa_api_key:
        try:
            import streamlit as st
            exa_api_key = st.secrets.get("EXA_API_KEY", "").strip()
        except: pass
        
    if not exa_api_key:
        print("❌ System Error: ไม่พบ EXA_API_KEY ในไฟล์ .env")
        return []

    clean_query = query.replace('"', '').replace("'", "")
    clean_source_url = source_url.split('?')[0].rstrip('/').lower() if source_url else ""

    # 🚫 โดเมนและโฟลเดอร์ที่ไม่ต้องการ
    blacklisted_domains = ['tiktok.com', 'facebook.com', 'instagram.com', 'x.com', 'twitter.com', 'pantip.com', 'youtube.com', 'blockdit.com']

    # ✅ Whitelist สำนักข่าวคุณภาพ (Exa AI อนุญาตให้ยัดลงไปใน includeDomains ได้เลย)
    trusted_media = [
        'thaipbs.or.th', 'pptvhd36.com', 'ch7.com', 'news.ch7.com', 'ch3plus.com', '3plusnews.com', 
        'one31.net', 'amarintv.com', 'nationtv.tv', 'tnnthailand.com', 'springnews.co.th', 
        'mcot.net', 'tna.mcot.net', 'workpointtoday.com', 'thaich8.com',
        'thairath.co.th', 'khaosod.co.th', 'matichon.co.th', 'dailynews.co.th', 
        'thaipost.net', 'komchadluek.net', 'naewna.com', 'siamrath.co.th', 
        'bangkokbiznews.com', 'prachachat.net', 'thansettakij.com', 'posttoday.com', 
        'mgronline.com', 'prachatai.com', 'isranews.org', 'thestandard.co', 'thematter.co', 'the101.world', 
        'thaipublica.org', 'voicetv.co.th', 'moneyandbanking.co.th', 'efinancethai.com', 
        'bbc.com', 'reuters.com', 'apnews.com', 'sanook.com', 'kapook.com', 'today.line.me'
    ]

    # 🚀 กระสุน 1: เจาะเว็บรัฐบาลและศูนย์ต้านข่าวปลอม (Exa รองรับ Suffix match)
    payload_gov = {
        "query": clean_query,
        "useAutoprompt": True, # ให้ AI ของ Exa แปลงเป็นคำค้นหาที่ลึกซึ้ง
        "numResults": 8,
        "includeDomains": ["go.th", "antifakenewscenter.com", "sure.factcheckthailand.org", "cofact.org"],
        "contents": {
            "text": { "maxCharacters": 1500 } # 💡 ให้ดึงเนื้อหาคลีนๆ กลับมาเลย ไม่ต้องใช้ Jina Reader!
        }
    }

    # 🚀 กระสุน 2: เจาะเว็บสื่อมวลชนที่เชื่อถือได้
    payload_media = {
        "query": clean_query,
        "useAutoprompt": True,
        "numResults": 10,
        "includeDomains": trusted_media,
        "contents": {
            "text": { "maxCharacters": 1500 }
        }
    }

    raw_results = []
    # ยิง Exa API คู่ขนาน
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        future_gov = executor.submit(fetch_exa_api, payload_gov, exa_api_key)
        future_media = executor.submit(fetch_exa_api, payload_media, exa_api_key)
        
        raw_results.extend(future_gov.result())
        raw_results.extend(future_media.result())

    urls_seen = set()
    processed_results = []
    
    for item in raw_results:
        title = item.get("title", "").strip() if item.get("title") else "ข่าวที่เกี่ยวข้อง"
        link = item.get("url", "")
        # 💡 Exa ส่งเนื้อหาที่คลีนมาใน text ไม่ใช่แค่ snippet สั้นๆ
        content = item.get("text", "")[:1500] 
        pub_date = item.get("publishedDate", "ไม่ระบุ")
        
        parsed_url = urlparse(link.lower())
        domain = parsed_url.netloc.replace('www.', '')
        link_lower = link.lower()
        link_clean = link_lower.split('?')[0].rstrip('/')
        
        # 🚫 บล็อก PDF แบบเด็ดขาด
        if '[pdf]' in title.lower() or 'pdf' in title.lower():
            continue
        if re.search(r'\.(pdf|doc|docx|xls|xlsx|ppt|pptx)($|\?)', link_lower):
            continue
            
        if not parsed_url.path or parsed_url.path == '/':
            continue
        if re.search(r'/(category|topic|tag|tags|author|page)/|\.xml|sitemap', link_lower):
            continue
            
        if clean_source_url and (clean_source_url == link_clean):
            continue
            
        if link in urls_seen or any(b in domain for b in blacklisted_domains):
            continue
        
        # 🏅 การจัดลำดับความน่าเชื่อถือ
        tier = 2
        if domain.endswith('.go.th') or domain.endswith('.gov') or domain.endswith('.ac.th') or domain.endswith('.or.th'):
            tier = 0
        elif 'antifakenewscenter.com' in domain or 'sure.factcheckthailand.org' in domain or 'cofact.org' in domain:
            tier = 0
        elif any(wd in domain for wd in trusted_media):
            tier = 1

        urls_seen.add(link)
        processed_results.append({
            'title': title,
            'href': link,
            'pub_date': pub_date,
            'snippet': content, # เนื้อหาอัดแน่นเต็มสูบ ส่งให้ Qwen อ่านสบายๆ
            'tier': tier 
        })
        
    processed_results.sort(key=lambda x: x['tier'])
    for r in processed_results:
        r.pop('tier', None)
        
    return processed_results[:num_results]