import os
import requests
import re
import concurrent.futures
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

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

# 💡 ฟังก์ชันใหม่: อัจฉริยะในการแยกแยะ "หน้าข่าวจริง" กับ "หน้ารวมข่าว/หน้าแรก"
def is_actual_article(url, title):
    parsed = urlparse(url.lower())
    path = parsed.path
    path_parts = [p for p in path.split('/') if p] # แยกโฟลเดอร์ออกมานับ

    title_lower = title.lower()

    # 1. บล็อกไฟล์ PDF และเอกสารทุกชนิดแบบเด็ดขาด (ครอบคลุมถึงอนาคต)
    if re.search(r'\.(pdf|doc|docx|xls|xlsx|ppt|pptx)($|\?)', url.lower()): return False
    if '[pdf]' in title_lower or 'pdf' in title_lower: return False

    # 2. บล็อกหน้าแรก (Homepage) และไฟล์ Index พื้นฐาน
    if not path_parts: return False
    if path in ['/', '/th', '/en', '/th/', '/en/', '/index.html', '/index.php', '/default.aspx', '/home']: return False

    # 3. บล็อกหน้าหมวดหมู่/ป้ายกำกับ/หน้าค้นหา (Aggregator Keywords)
    aggregator_keywords = ['category', 'topic', 'tag', 'tags', 'author', 'page', 'search', 'archive', 'archives', 'gallery', 'video', 'vdo', 'calendar', 'sitemap']
    if any(keyword in path_parts for keyword in aggregator_keywords): return False

    # 4. 🚀 กฎความลึก (Depth Check): ถ้ามีแค่โฟลเดอร์เดียว มักจะเป็นหน้ารวมข่าว
    if len(path_parts) == 1:
        single_path = path_parts[0]
        # โฟลเดอร์ฮิตที่เป็นหน้ารวมข่าว
        if single_path in ['news', 'latest', 'pr', 'article', 'articles', 'update', 'ข่าวด่วน', 'ข่าว']: 
            return False
        # ถ้าชื่อโฟลเดอร์สั้นเกินไป (น้อยกว่า 10 ตัวอักษร) และไม่ใช่ไฟล์ .html ถือว่าเป็นหน้าหมวดหมู่
        if len(single_path) < 10 and not re.search(r'\.(html|htm|php|aspx)', single_path):
            return False

    # 5. 🚀 กฎชื่อเรื่อง (Title Heuristics): ดักจับเว็บที่พัง หรือดึงมาแค่หน้าแรกของหน่วยงาน
    generic_titles = ['หน้าแรก', 'หน้าหลัก', 'รวมข่าว', 'ข่าวล่าสุด', 'ข่าวด่วน', 'home', 'official website', 'เว็บไซต์ทางการ']
    if any(g_title in title_lower for g_title in generic_titles):
        if len(title_lower) < 30: return False # ถ้าชื่อสั้นๆ และมีคำพวกนี้ คือหน้าแรกแน่นอน
    
    # ถ้า Title มีแค่ 1-2 คำสั้นๆ (เช่น "กระทรวงมหาดไทย", "โซลาร์เซลล์") ไม่ใช่ประโยคข่าว -> เตะทิ้ง
    if len(title.strip().split()) <= 2 and len(title) < 20: return False

    return True # ถ้าผ่านด่านหฤโหดพวกนี้มาได้ แปลว่าเป็น "บทความข่าวเฉพาะเจาะจง" แน่นอน!

def search_news_references(query: str, num_results: int = 10, must_have_keywords: list = None, source_url: str = "") -> list:
    if not query.strip() or query == "SKIP_SEARCH": return []
    
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

    blacklisted_domains = [
        'youtube.com', 'youtu.be', 'tiktok.com', 'facebook.com', 'instagram.com', 'x.com', 'twitter.com', 
        'vimeo.com', 'dailymotion.com', 'line.me', 'blockdit.com', 'pantip.com',
        'wikipedia.org', 'wiktionary.org', 'longdo.com', 'thai-language.com'
    ]

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

    payload_gov = {
        "query": clean_query,
        "useAutoprompt": False, 
        "numResults": 10,
        "includeDomains": ["go.th", "antifakenewscenter.com", "sure.factcheckthailand.org", "cofact.org"],
        "contents": { "text": { "maxCharacters": 1500 } }
    }

    payload_media = {
        "query": clean_query,
        "useAutoprompt": False,
        "numResults": 15,
        "includeDomains": trusted_media,
        "contents": { "text": { "maxCharacters": 1500 } }
    }

    raw_results = []
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
        content = item.get("text", "")[:1500] 
        pub_date = item.get("publishedDate", "ไม่ระบุ")
        
        parsed_url = urlparse(link.lower())
        domain = parsed_url.netloc.replace('www.', '')
        link_clean = link.lower().split('?')[0].rstrip('/')

        # 🚫 บล็อกวิดีโอเด็ดขาด
        if re.search(r'/(video|watch|shorts|reel|reels|v)/', link.lower()) or 'fb.watch' in link.lower():
            continue
            
        # 🚫 บล็อกลิงก์ตัวเอง
        if clean_source_url and (clean_source_url == link_clean):
            continue
            
        if link in urls_seen or any(b in domain for b in blacklisted_domains):
            continue
            
        # 🚀 นำ URL และ Title เข้าสู่เครื่องสแกนอัจฉริยะ (ถ้าเป็นหน้าแรกหรือหน้าหมวดหมู่ จะโดนเตะทิ้งตรงนี้)
        if not is_actual_article(link, title):
            continue
        
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
            'snippet': content,
            'tier': tier 
        })
        
    processed_results.sort(key=lambda x: x['tier'])
    for r in processed_results: r.pop('tier', None)
        
    return processed_results[:num_results]