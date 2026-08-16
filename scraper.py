import os
import re
import json
import socket
import ipaddress
import concurrent.futures
from bs4 import BeautifulSoup
from urllib.parse import unquote, quote, urlparse, parse_qs
from curl_cffi import requests

try:
    import streamlit as st
except ImportError:
    st = None

try:
    from config import EXA_API_KEY
except ImportError:
    EXA_API_KEY = os.getenv("EXA_API_KEY", "")

MAX_REDIRECTS = 5
MAX_INPUT_TEXT_LENGTH = 5000
SCRAPER_TIMEOUT = int(os.getenv("SCRAPER_TIMEOUT", "8"))
MAX_RESPONSE_SIZE = 5 * 1024 * 1024 # 5MB

def _is_safe_url(url: str) -> bool:
    """Block private/reserved IPs and non-HTTP schemes (SSRF protection)."""
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ('http', 'https', ''):
            return False
        hostname = parsed.hostname
        if not hostname:
            return False
        try:
            resolved = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
            for _family, _type, _proto, _canonname, sockaddr in resolved:
                ip = ipaddress.ip_address(sockaddr[0])
                if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                    return False
        except socket.gaierror:
            return False # Fail safe on DNS error
        except ValueError:
            pass
        return True
    except Exception:
        return False

def clean_mobile_url(url: str) -> str:
    url = unquote(url.strip())
    
    if "l.facebook.com/l.php?u=" in url:
        try:
            url = unquote(url.split("u=")[1].split("&")[0])
        except (IndexError, ValueError):
            pass
            
    url = url.replace("://m.facebook.com", "://www.facebook.com")
    url = url.replace("://mobile.twitter.com", "://twitter.com")
    url = url.replace("://x.com", "://twitter.com")
    
    if "?" in url:
        base_url, query_str = url.split("?", 1)
        fragment = ""
        
        if "#" in query_str:
            query_str, fragment = query_str.split("#", 1)
            if fragment: 
                fragment = "#" + fragment
                
        params = query_str.split("&")
        
        junk_params = (
            'mibextid=', 'igsh=', 'si=', 'fbclid=', 'is_from_webapp=', 
            'h=', 's=', 't=', 'rdid=', 'share_url=', 'utm_', 'c='
        )
        
        clean_params = [
            p for p in params 
            if not p.lower().startswith(junk_params)
        ]
        
        if clean_params:
            url = f"{base_url}?{'&'.join(clean_params)}{fragment}"
        else:
            url = f"{base_url}{fragment}"
            
    url = url.rstrip('#')
    return url

def resolve_facebook_redirects(url: str) -> str:
    if "facebook.com/share/" not in url.lower() and "fb.watch" not in url.lower():
        return url
        
    def try_googlebot():
        try:
            bot_headers = {
                "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            }
            res = requests.get(url, headers=bot_headers, timeout=SCRAPER_TIMEOUT, allow_redirects=False)
            
            if res.status_code in [301, 302, 303, 307] and 'Location' in res.headers:
                real_url = res.headers['Location']
                if "facebook.com/share/" not in real_url.lower() and "login" not in real_url.lower():
                    if _is_safe_url(real_url):
                        return real_url
                    
            res_full = requests.get(url, headers=bot_headers, timeout=SCRAPER_TIMEOUT, allow_redirects=True)
            meta_match = re.search(r'http-equiv=["\']?refresh["\']?[^>]*url=["\']?([^"\'>]+)["\']?', res_full.text, re.IGNORECASE)
            if meta_match:
                refresh_url = meta_match.group(1).replace('&amp;', '&')
                if "facebook.com/share/" not in refresh_url.lower() and "login" not in refresh_url.lower():
                    if _is_safe_url(refresh_url):
                        return refresh_url
                    
            canonical = re.search(r'<link\s+rel=["\']canonical["\']\s+href=["\']([^"\']+)["\']', res_full.text, re.IGNORECASE)
            if canonical:
                canonical_url = canonical.group(1).replace('&amp;', '&')
                if "facebook.com/share/" not in canonical_url.lower() and "login" not in canonical_url.lower():
                    if _is_safe_url(canonical_url):
                        return canonical_url
        except Exception:
            pass
        return None

    def try_jina():
        try:
            jina_req = requests.get(f"https://r.jina.ai/{url}", headers={"Accept": "application/json"}, timeout=SCRAPER_TIMEOUT)
            if jina_req.status_code == 200:
                resolved_url = jina_req.json().get("data", {}).get("url", url)
                if "facebook.com/share/" not in resolved_url.lower() and "login" not in resolved_url.lower():
                    if _is_safe_url(resolved_url):
                        return resolved_url
        except Exception:
            pass
        return None

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        futures = [executor.submit(try_googlebot), executor.submit(try_jina)]
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            if result:
                return result
                
    return url

def expand_url(url: str) -> str:
    redirectors = ['shorturl.', 'bit.ly', 'tinyurl.', 't.co', 'cutt.ly', 'rebrand.ly', 'lnkd.in', 'vt.tiktok.com', 'vm.tiktok.com', 'youtu.be', 'line.me', 'liff.line.me']
    if any(r in url.lower() for r in redirectors):
        try:
            res = requests.get(url, impersonate="safari", allow_redirects=True, timeout=SCRAPER_TIMEOUT)
            final_url = res.url
            meta_match = re.search(r'http-equiv=["\']?refresh["\']?[^>]*url=["\']?([^"\'>]+)["\']?', res.text, re.IGNORECASE)
            if meta_match: 
                final_url = meta_match.group(1)
            js_match = re.search(r'window\.location\.(?:href|replace)\s*=\s*["\'](.*?)["\']', res.text, re.IGNORECASE)
            if js_match: 
                final_url = js_match.group(1)
            
            if _is_safe_url(final_url):
                return final_url
        except Exception:
            pass
    return url

def _clean_fb_text(text: str) -> str:
    """Helper to clean Facebook text uniformly."""
    text = re.sub(r'(ดูโพสต์เพิ่มเติมจาก|เข้าสู่ระบบ|ลืมรหัสผ่าน|หาเพื่อนบน Facebook|บน Facebook|Log In|Sign Up).*', '', text, flags=re.IGNORECASE).strip()
    if not text or re.search(r'(error 404|content not found|ไม่พบเนื้อหา)', text, re.IGNORECASE):
        return None
    if text.lower() in ["facebook", "facebook app", "meta"]:
        return None
    if len(text) < 10:
        return None
    return text

def extract_social_metadata(url: str) -> str:
    try:
        if "x.com/" in url or "twitter.com/" in url:
            match = re.search(r'(?:x|twitter)\.com(/.*)', url)
            if match:
                clean_path = match.group(1).split('?')[0]
                twitter_std_url = f"https://twitter.com{clean_path}"
                
                def try_oembed():
                    try:
                        oembed_url = f"https://publish.twitter.com/oembed?url={quote(twitter_std_url)}&omit_script=true"
                        res = requests.get(oembed_url, impersonate="chrome", timeout=SCRAPER_TIMEOUT)
                        if res.status_code == 200:
                            data = res.json()
                            html = data.get("html", "")
                            author = data.get("author_name", "ผู้ใช้งาน X")
                            clean_text = BeautifulSoup(html, 'html.parser').get_text(separator=' ', strip=True)
                            if clean_text:
                                return f"โพสต์จาก X ({author}):\n{clean_text}"
                    except Exception:
                        pass
                    return None

                def try_vxtwitter():
                    try:
                        api_url = "https://api.vxtwitter.com" + clean_path
                        res = requests.get(api_url, impersonate="chrome", timeout=SCRAPER_TIMEOUT)
                        if res.status_code == 200:
                            try:
                                data = res.json()
                                title = data.get("user_name", "ผู้ใช้งาน X")
                                desc = data.get("text", "")
                                if title or desc: return f"{title}\n{desc}".strip()
                            except Exception:
                                soup = BeautifulSoup(res.text, 'html.parser')
                                og_desc = soup.find("meta", property="og:description")
                                if og_desc and og_desc.get("content") and "Failed to scan" not in og_desc["content"]:
                                    return f"โพสต์จาก X:\n{og_desc['content'].strip()}"
                    except Exception:
                        pass
                    return None

                def try_fxtwitter():
                    try:
                        api_url = "https://api.fxtwitter.com" + clean_path
                        res = requests.get(api_url, impersonate="chrome", timeout=SCRAPER_TIMEOUT)
                        if res.status_code == 200:
                            data = res.json().get('tweet', {})
                            title = data.get("author", {}).get("name", "ผู้ใช้งาน X")
                            desc = data.get("text", "")
                            if title or desc: return f"{title}\n{desc}".strip()
                    except Exception:
                        pass
                    return None

                def try_jina_x():
                    try:
                        res = requests.get(f"https://r.jina.ai/{url}", impersonate="chrome", timeout=SCRAPER_TIMEOUT)
                        if res.status_code == 200 and len(res.text) > 20:
                            return f"โพสต์จาก X:\n{res.text.strip()}"
                    except Exception:
                        pass
                    return None

                with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
                    futures = [executor.submit(try_oembed), executor.submit(try_vxtwitter), executor.submit(try_fxtwitter), executor.submit(try_jina_x)]
                    for future in concurrent.futures.as_completed(futures):
                        res = future.result()
                        if res:
                            return res
                
                return "PLATFORM_BLOCKED"

        elif "instagram.com/" in url:
            match = re.search(r'instagram\.com/(?:p|reel|tv)/([^/?]+)', url)
            if match:
                shortcode = match.group(1)
                
                def try_ig_embed():
                    try:
                        embed_url = f"https://www.instagram.com/p/{shortcode}/embed/captioned/"
                        res = requests.get(embed_url, impersonate="chrome", timeout=SCRAPER_TIMEOUT)
                        if res.status_code == 200:
                            soup = BeautifulSoup(res.text, 'html.parser')
                            og_desc = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", property="og:description")
                            if og_desc and og_desc.get("content"):
                                return f"โพสต์จาก Instagram:\n{og_desc['content'].strip()}"
                            
                            ld = soup.find('script', type='application/ld+json')
                            if ld and ld.string:
                                try:
                                    ldj = json.loads(ld.string)
                                    if isinstance(ldj, dict):
                                        cap = ldj.get('caption') or ldj.get('description')
                                        if cap: return f"โพสต์จาก Instagram:\n{cap.strip()}"
                                except Exception:
                                    pass
                    except Exception:
                        pass
                    return None

                def try_ddinstagram():
                    try:
                        ig_proxy_url = f"https://ddinstagram.com/p/{shortcode}/"
                        response = requests.get(ig_proxy_url, impersonate="chrome", timeout=SCRAPER_TIMEOUT)
                        if response.status_code == 200:
                            soup = BeautifulSoup(response.text, 'html.parser')
                            og_title = soup.find("meta", property="og:title") or soup.find("meta", attrs={"name": "og:title"})
                            og_desc = soup.find("meta", property="og:description") or soup.find("meta", attrs={"name": "og:description"})
                            title = og_title["content"] if og_title and og_title.get("content") else ""
                            desc = og_desc["content"] if og_desc and og_desc.get("content") else ""
                            if title or desc:
                                wall_texts = ["Login", "Sign up for Instagram", "Log in to Instagram", "เข้าสู่ระบบ", "Never miss a post from", "agree to Instagram"]
                                combined = (title + "\n" + desc).strip()
                                if not any(w.lower() in combined.lower() for w in wall_texts):
                                    return f"โพสต์จาก Instagram:\n{combined}"
                    except Exception:
                        pass
                    return None

                def try_ig_jina():
                    try:
                        res = requests.get(f"https://r.jina.ai/{url}", impersonate="chrome", timeout=SCRAPER_TIMEOUT)
                        if res.status_code == 200 and len(res.text) > 30:
                            wall_texts = ["Login", "Sign up for Instagram", "Log in to Instagram", "เข้าสู่ระบบ", "Never miss a post from", "agree to Instagram"]
                            if not any(w.lower() in res.text.lower() for w in wall_texts):
                                return f"โพสต์จาก Instagram:\n{res.text.strip()}"
                    except Exception:
                        pass
                    return None

                with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                    futures = [executor.submit(try_ig_embed), executor.submit(try_ddinstagram), executor.submit(try_ig_jina)]
                    for future in concurrent.futures.as_completed(futures):
                        res = future.result()
                        if res:
                            return res

            return "PLATFORM_BLOCKED"

        # --- Facebook ---
        elif "facebook.com" in url or "fb.watch" in url:
            clean_url = url
            
            def fb_iframe():
                try:
                    embed_url = f"https://www.facebook.com/plugins/post.php?href={quote(clean_url)}&show_text=true"
                    res_embed = requests.get(embed_url, impersonate="chrome", timeout=SCRAPER_TIMEOUT)
                    if res_embed.status_code == 200:
                        soup_embed = BeautifulSoup(res_embed.text, 'html.parser')
                        for element in soup_embed(["script", "style", "form", "button", "a"]): 
                            element.extract()
                        extracted = soup_embed.get_text(separator='\n', strip=True)
                        cleaned = _clean_fb_text(extracted)
                        if cleaned and "This Facebook post is no longer available" not in cleaned:
                            return cleaned, "[ดึงด้วย: FB Embed Iframe 🌐]"
                except Exception:
                    pass
                return None, None

            def fb_jina():
                try:
                    jina_req = requests.get(f"https://r.jina.ai/{clean_url}", impersonate="chrome", headers={"Accept": "application/json"}, timeout=SCRAPER_TIMEOUT)
                    if jina_req.status_code == 200:
                        jina_data = jina_req.json().get("data", {})
                        combined = f"{jina_data.get('title', '')}\n{jina_data.get('content', '')}".strip()
                        cleaned = _clean_fb_text(combined)
                        if cleaned and "This Facebook post is no longer available" not in cleaned:
                            return cleaned, "[ดึงด้วย: Headless Cloud Browser ☁️]"
                except Exception:
                    pass
                return None, None

            def fb_meta():
                try:
                    meta_res = requests.get(clean_url, impersonate="chrome", timeout=SCRAPER_TIMEOUT, allow_redirects=True)
                    meta_res.encoding = 'utf-8'
                    soup_meta = BeautifulSoup(meta_res.text, 'html.parser')
                    og_title = soup_meta.find("meta", property="og:title") or soup_meta.find("meta", attrs={"name": "og:title"})
                    og_desc = soup_meta.find("meta", property="og:description") or soup_meta.find("meta", attrs={"name": "og:description"})
                    combined = f"{og_title['content'] if og_title else ''}\n{og_desc['content'] if og_desc else ''}".strip()
                    cleaned = _clean_fb_text(combined)
                    if cleaned and "This Facebook post is no longer available" not in cleaned:
                        return cleaned, "[ดึงด้วย: Chrome Impersonation 🤖]"
                except Exception:
                    pass
                return None, None

            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                futures = [executor.submit(fb_iframe), executor.submit(fb_jina), executor.submit(fb_meta)]
                for future in concurrent.futures.as_completed(futures):
                    res_text, method = future.result()
                    if res_text:
                        return f"โพสต์จาก Facebook {method}:\n{res_text}"
                        
            return "PLATFORM_BLOCKED"

        response = requests.get(url, impersonate="chrome", timeout=SCRAPER_TIMEOUT)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        og_title = soup.find("meta", property="og:title") or soup.find("meta", attrs={"name": "og:title"})
        og_desc = soup.find("meta", property="og:description") or soup.find("meta", attrs={"name": "og:description"})
        
        title = og_title["content"] if og_title else (soup.title.string if soup.title else "")
        desc = og_desc["content"] if og_desc else ""
        
        return f"{title}\n{desc}".strip()
        
    except Exception:
        return "SCRAPE_FAILED"

def force_extract_news_link(social_url: str) -> str:
    try:
        response = requests.get(social_url, impersonate="chrome", timeout=SCRAPER_TIMEOUT, allow_redirects=True)
        decoded_html = unquote(response.text)
        whitelist = ['thairath.co.th', 'khaosod.co.th', 'matichon.co.th', 'dailynews.co.th', 'prachachat.net', 'bangkokbiznews.com', 'mgronline.com', 'thaipbs.or.th', 'pptvhd36.com', 'ch7.com', 'thestandard.co', 'workpointtoday.com', 'amarintv.com', 'nationtv.tv', 'tnnthailand.com', 'springnews.co.th', '77kaoded.com', 'voathai.com', 'xinhuathai.com']
        domain_pattern = "|".join([d.replace('.', r'\.') for d in whitelist])
        regex = rf'https?://(?:www\.)?(?:[a-zA-Z0-9-]+\.)*(?:{domain_pattern})[^\s"\'<>\\]*'
        found_links = re.findall(regex, decoded_html)
        
        for link in found_links:
            clean_link = link.split('?')[0] 
            if len(clean_link.split('/')) >= 4 and not clean_link.endswith('/home'): return clean_link
        return ""
    except Exception:
        return ""


def _clean_extracted_text(text: str) -> str:
    text = re.sub(r'!\[[^\]]*\]\([^)]*\)', ' ', str(text or ''))
    text = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:12000]


def _article_json_ld_candidates(value):
    candidates = []
    if isinstance(value, list):
        for item in value:
            candidates.extend(_article_json_ld_candidates(item))
    elif isinstance(value, dict):
        graph = value.get('@graph')
        if graph:
            candidates.extend(_article_json_ld_candidates(graph))
        raw_type = value.get('@type', '')
        types = raw_type if isinstance(raw_type, list) else [raw_type]
        if any(article_type in ['Article', 'NewsArticle', 'ReportageNewsArticle'] for article_type in types):
            body = value.get('articleBody', '')
            headline = value.get('headline', '')
            if body:
                candidates.append(f"{headline}\n{body}".strip())
    return candidates


def _content_quality_score(text: str) -> float:
    text = _clean_extracted_text(text)
    if not text:
        return 0.0
    length_score = min(len(text), 6000)
    sentence_score = min(1000, len(re.findall(r'[.!?。]|ครับ|ค่ะ|ว่า|โดย|เมื่อ', text)) * 20)
    boilerplate_hits = len(re.findall(
        r'(cookie|privacy policy|สมัครสมาชิก|เข้าสู่ระบบ|เมนู|หน้าหลัก|ติดตามเรา|สงวนลิขสิทธิ์)',
        text,
        re.IGNORECASE
    ))
    return length_score + sentence_score - (boilerplate_hits * 120)


def _extract_article_text_from_html(html: str) -> str:
    soup = BeautifulSoup(html or '', 'html.parser')
    candidates = []

    for script in soup.find_all('script', attrs={'type': 'application/ld+json'}):
        try:
            candidates.extend(
                (value, 1800.0)
                for value in _article_json_ld_candidates(json.loads(script.string or script.get_text()))
            )
        except Exception:
            pass

    for element in soup(["script", "style", "nav", "header", "footer", "aside", "noscript", "form", "button"]):
        element.extract()

    selectors = [
        ('[itemprop="articleBody"]', 1800.0), ('article', 1500.0), ('main', 900.0),
        ('.article-content', 1400.0), ('.article-body', 1400.0),
        ('.entry-content', 1200.0), ('.post-content', 1200.0),
        ('.story-content', 1200.0), ('.news-content', 1200.0),
        ('#article-content', 1400.0), ('#article-body', 1400.0)
    ]
    for selector, structure_bonus in selectors:
        for node in soup.select(selector):
            text = node.get_text(separator=' ', strip=True)
            if len(text) >= 100:
                candidates.append((text, structure_bonus))

    body_text = soup.get_text(separator=' ', strip=True)
    if body_text:
        candidates.append((body_text, 0.0))

    cleaned_candidates = []
    for value, structure_bonus in candidates:
        clean_value = _clean_extracted_text(value)
        if clean_value:
            cleaned_candidates.append((clean_value, structure_bonus))
    if not cleaned_candidates:
        return ""
    best_text, _ = max(
        cleaned_candidates,
        key=lambda item: _content_quality_score(item[0]) + item[1]
    )
    return best_text

def fetch_with_fallback(url: str) -> str:
    anti_bot_patterns = r'(cloudflare|500 internal server error|403 forbidden|access denied|captcha|not acceptable|checking your browser|security check|just a moment|log in to facebook|เข้าสู่ระบบ|error 404|404 not found|page not found|ไม่พบหน้านี้|ไม่พบเนื้อหา|content not found|this page isn\'t available|หน้านี้ไม่พร้อมใช้งาน|อาจเสียหรือถูกลบไปแล้ว)'
    
    def fetch_native():
        try:
            res = requests.get(url, impersonate="chrome", timeout=SCRAPER_TIMEOUT, allow_redirects=True)
            if res.status_code == 200:
                content_len = res.headers.get('Content-Length')
                if content_len and int(content_len) > MAX_RESPONSE_SIZE:
                    return None
                    
                if res.encoding is None or res.encoding.lower() == 'iso-8859-1':
                    res.encoding = res.apparent_encoding or 'utf-8'
                clean_text = _extract_article_text_from_html(res.text)
                if len(clean_text) > 80 and not re.search(anti_bot_patterns, clean_text, re.IGNORECASE):
                    return clean_text
        except Exception:
            pass
        return None

    def fetch_googlebot():
        try:
            headers = {"User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"}
            res = requests.get(url, headers=headers, timeout=SCRAPER_TIMEOUT, allow_redirects=True)
            if res.status_code == 200:
                if res.encoding is None or res.encoding.lower() == 'iso-8859-1':
                    res.encoding = res.apparent_encoding or 'utf-8'
                clean_text = _extract_article_text_from_html(res.text)
                if len(clean_text) > 80 and not re.search(anti_bot_patterns, clean_text, re.IGNORECASE):
                    return clean_text
        except Exception:
            pass
        return None

    def fetch_jina():
        try:
            jina_url = f"https://r.jina.ai/{url}"
            response = requests.get(jina_url, impersonate="chrome", headers={"Accept": "text/plain", "X-Retain-Images": "none"}, timeout=SCRAPER_TIMEOUT)
            if response.status_code == 200:
                content = _clean_extracted_text(response.text)
                if len(content.strip()) > 80 and not re.search(anti_bot_patterns, content, re.IGNORECASE): 
                    return content
        except Exception:
            pass
        return None

    def fetch_exa():
        try:
            if EXA_API_KEY:
                headers = {"x-api-key": EXA_API_KEY, "Content-Type": "application/json"}
                payload = {"urls": [url], "text": True}
                res = requests.post("https://api.exa.ai/contents", headers=headers, json=payload, timeout=SCRAPER_TIMEOUT)
                if res.status_code == 200:
                    results = res.json().get("results", [])
                    if results:
                        title = results[0].get("title", "")
                        text = results[0].get("text", "")
                        combined = f"{title}\n{text}".strip()
                        if len(combined) > 80 and not re.search(anti_bot_patterns, combined, re.IGNORECASE):
                            return combined
        except Exception:
            pass
        return None

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(fetch_native), executor.submit(fetch_googlebot), executor.submit(fetch_jina), executor.submit(fetch_exa)]
        candidates = []
        for future in concurrent.futures.as_completed(futures):
            res = future.result()
            if res:
                candidates.append(res)
        if candidates:
            return max(candidates, key=_content_quality_score)
                
    return ""

def is_gambling_content(text: str, domain: str = "") -> bool:
    """Determine if content is actually a gambling site, while allowing news about gambling."""
    whitelist = ['thairath.co.th', 'khaosod.co.th', 'matichon.co.th', 'dailynews.co.th', 'prachachat.net', 'bangkokbiznews.com', 'mgronline.com', 'thaipbs.or.th', 'pptvhd36.com', 'ch7.com', 'thestandard.co', 'workpointtoday.com', 'amarintv.com', 'nationtv.tv', 'tnnthailand.com', 'springnews.co.th', '77kaoded.com', 'voathai.com', 'xinhuathai.com']
    if any(w in domain.lower() for w in whitelist):
        return False
        
    scam_keywords = r'(สล็อต|บาคาร่า|เว็บตรง|pg slot|คาสิโน|แทงบอล|หวยออนไลน์|ฝากถอนไม่มีขั้นต่ำ|แตกง่าย|ปั่นสล็อต|เครดิตฟรี|เว็บพนัน|สล็อตออนไลน์|แชร์ลูกโซ่|ขายตรง.*รายได้|ลงทุน.*การันตี|airdrop.*ฟรี|crypto.*ฟรี)'
    matches = re.findall(scam_keywords, text, re.IGNORECASE)
    
    if len(matches) >= 3:
        return True
    return False

THAI_MONTHS_MAP = {
    'ม.ค.': 1, 'มกราคม': 1, 'ก.พ.': 2, 'กุมภาพันธ์': 2, 'มี.ค.': 3, 'มีนาคม': 3,
    'เม.ย.': 4, 'เมษายน': 4, 'พ.ค.': 5, 'พฤษภาคม': 5, 'มิ.ย.': 6, 'มิถุนายน': 6,
    'ก.ค.': 7, 'กรกฎาคม': 7, 'ส.ค.': 8, 'สิงหาคม': 8, 'ก.ย.': 9, 'กันยายน': 9,
    'ต.ค.': 10, 'ตุลาคม': 10, 'พ.ย.': 11, 'พฤศจิกายน': 11, 'ธ.ค.': 12, 'ธันวาคม': 12
}

def parse_relative_or_explicit_date(text: str) -> tuple:
    """Parse relative timestamps or explicit dates from Thai news text.
    
    Returns (iso_date_str, display_thai_str, is_fresh_news)
    """
    from datetime import datetime, timedelta
    import pytz
    tz = pytz.timezone('Asia/Bangkok')
    now = datetime.now(tz)
    text_clean = str(text or "").strip()
    if not text_clean:
        return None, "ไม่ระบุในข้อความ", False

    # 1. Thai explicit date (e.g. "25 มิถุนายน 2569", "25 มิ.ย. 69", "25 June 2026") - CHECK FIRST!
    thai_date_match = re.search(r'(\d{1,2})\s*(ม\.ค\.|มกราคม|ก\.พ\.|กุมภาพันธ์|มี\.ค\.|มีนาคม|เม\.ย\.|เมษายน|พ\.ค\.|พฤษภาคม|มิ\.ย\.|มิถุนายน|ก\.ค\.|กรกฎาคม|ส\.ค\.|สิงหาคม|ก\.ย\.|กันยายน|ต\.ค\.|ตุลาคม|พ\.ย\.|พฤศจิกายน|ธ\.ค\.|ธันวาคม)\s*(\d{2,4})', text_clean)
    if thai_date_match:
        day = int(thai_date_match.group(1))
        month_str = thai_date_match.group(2)
        year_raw = int(thai_date_match.group(3))
        month = THAI_MONTHS_MAP.get(month_str, 1)
        if year_raw < 100:
            year = year_raw + 2500 - 543
        elif year_raw > 2400:
            year = year_raw - 543
        else:
            year = year_raw
        try:
            dt = datetime(year, month, day)
            delta_days = (now.date() - dt.date()).days
            is_fresh = delta_days <= 1
            return dt.strftime("%Y-%m-%d"), f"{day} {month_str} {year+543}", is_fresh
        except Exception:
            pass

    # 2. Specific Relative Time (e.g. "5 นาทีที่แล้ว", "2 ชั่วโมงก่อน", "3 วันที่แล้ว")
    rel_match = re.search(r'(\d+)\s*(วินาที|นาที|ชั่วโมง|ชม\.|วัน|สัปดาห์|เดือน|ปี)\s*(ที่แล้ว|ก่อน)', text_clean, re.IGNORECASE)
    if rel_match:
        val = int(rel_match.group(1))
        unit = rel_match.group(2)
        if 'วินาที' in unit or 'นาที' in unit or 'ชั่วโมง' in unit or 'ชม.' in unit:
            dt = now - timedelta(hours=val if ('ชั่วโมง' in unit or 'ชม.' in unit) else 0)
            return dt.strftime("%Y-%m-%d"), f"{val} {unit}ที่แล้ว", True
        elif 'วัน' in unit:
            dt = now - timedelta(days=val)
            return dt.strftime("%Y-%m-%d"), f"{val} วันก่อน", val <= 1
        elif 'สัปดาห์' in unit:
            dt = now - timedelta(weeks=val)
            return dt.strftime("%Y-%m-%d"), f"{val} สัปดาห์ก่อน", False

    # 3. Relative "เมื่อวาน" or explicit post marker for "วันนี้"
    if re.search(r'เมื่อวาน(นี้)?', text_clean):
        dt = now - timedelta(days=1)
        return dt.strftime("%Y-%m-%d"), "เมื่อวานนี้", True

    if re.search(r'(โพสต์เมื่อ|เผยแพร่|อัปเดต)\s*:\s*วันนี้', text_clean):
        return now.strftime("%Y-%m-%d"), "วันนี้", True

    return None, "ไม่ระบุในข้อความ", False

def extract_text_from_url(url: str) -> dict:
    try:
        parsed_scheme = urlparse(url).scheme
        if parsed_scheme and parsed_scheme not in ('http', 'https'):
            return {"error": "LINK_UNSUPPORTED"}

        if not _is_safe_url(url):
            return {"error": "LINK_UNSUPPORTED"}

        url = clean_mobile_url(url)
        url = resolve_facebook_redirects(url)
        url = expand_url(url)
        url = clean_mobile_url(url)

        if not _is_safe_url(url):
            return {"error": "LINK_UNSUPPORTED"}

        domain = urlparse(url).netloc
        VIDEO_PATTERNS = [
            r'youtube\.com/watch', r'youtu\.be', r'youtube\.com/shorts',
            r'tiktok\.com', r'vt\.tiktok\.com', r'vm\.tiktok\.com',
            r'facebook\.com/.*/videos/', r'/share/v/', r'/share/r/', 
            r'vimeo\.com', r'dailymotion\.com'
        ]
        
        if any(re.search(p, url.lower()) for p in VIDEO_PATTERNS):
            return {"error": "VIDEO_DETECTED"}

        if re.search(r'(slot|casino|ufa\d+|pgslot|เว็บพนัน|bet365|joker123|sexybaccarat)', domain.lower()):
            if not any(w in domain.lower() for w in ['thairath.co.th', 'khaosod.co.th', 'matichon.co.th', 'dailynews.co.th', 'prachachat.net', 'bangkokbiznews.com', 'mgronline.com', 'thaipbs.or.th', 'pptvhd36.com', 'ch7.com', 'thestandard.co', 'workpointtoday.com', 'amarintv.com', 'nationtv.tv', 'tnnthailand.com', 'springnews.co.th', '77kaoded.com', 'voathai.com', 'xinhuathai.com']):
                return {"error": "GAMBLING_DETECTED"}

        social_domains = ["facebook.com", "fb.watch", "x.com", "twitter.com", "tiktok.com", "instagram.com"]
        is_social = any(d in domain.lower() for d in social_domains)
        
        content = ""
        actual_primary_url = url
        
        if is_social:
            content = extract_social_metadata(url)
            if content and is_gambling_content(content, domain):
                return {"error": "GAMBLING_DETECTED"}
                
            if "PLATFORM_BLOCKED" in content or "SCRAPE_FAILED" in content:
                fallback_content = fetch_with_fallback(actual_primary_url)
                if fallback_content: content = fallback_content
                
            hidden_news_url = force_extract_news_link(url)
            if hidden_news_url:
                actual_primary_url = hidden_news_url
                actual_news_content = fetch_with_fallback(actual_primary_url)
                
                if actual_news_content:
                    final_content = f"[พรีวิวจากโซเชียล]:\n{content}\n\n[เนื้อหาข่าวจริงที่ซ่อนอยู่ ({actual_primary_url})]:\n{actual_news_content}"
                    if is_gambling_content(final_content, urlparse(actual_primary_url).netloc): 
                        return {"error": "GAMBLING_DETECTED"}
                    return {"content": final_content, "actual_url": actual_primary_url}
            
            if "PLATFORM_BLOCKED" in content or "SCRAPE_FAILED" in content:
                return {"error": "PLATFORM_BLOCKED"}
                
            return {"content": content, "actual_url": actual_primary_url}
            
        else:
            actual_news_content = fetch_with_fallback(url)
            if actual_news_content:
                if is_gambling_content(actual_news_content, domain): 
                    return {"error": "GAMBLING_DETECTED"}
                return {"content": actual_news_content, "actual_url": url}
            else:
                return {"error": "SCRAPE_FAILED"}
                
    except Exception:
        return {"error": "SCRAPE_FAILED"}
