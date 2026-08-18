import os
from dotenv import load_dotenv

load_dotenv(override=True)

def _get_secret_or_env(key: str, default: str = "") -> str:
    """Read configuration strictly from os.getenv with live env reload."""
    load_dotenv(override=True)
    return os.getenv(key, default).strip()

def get_ai_model() -> str:
    """Get the active AI model name strictly from environment variables (.env)."""
    return _get_secret_or_env("AI_MODEL", "")

# ================= 1. API Keys =================
OPENROUTER_API_KEY = _get_secret_or_env("OPENROUTER_API_KEY", "")
EXA_API_KEY = _get_secret_or_env("EXA_API_KEY", "")
SERPER_API_KEY = _get_secret_or_env("SERPER_API_KEY", "")
GSHEETS_WEBHOOK_URL = _get_secret_or_env("GSHEETS_WEBHOOK_URL", "")

# ================= 2. Model Configuration =================
LLM_BACKEND = _get_secret_or_env("LLM_BACKEND", "openrouter").lower()
AI_MODEL = _get_secret_or_env("AI_MODEL", "")

try:
    PLANNER_MAX_TOKENS = int(_get_secret_or_env("PLANNER_MAX_TOKENS", "512"))
except ValueError:
    PLANNER_MAX_TOKENS = 512

try:
    ANALYZER_MAX_TOKENS = int(_get_secret_or_env("ANALYZER_MAX_TOKENS", "1800"))
except ValueError:
    ANALYZER_MAX_TOKENS = 1800

# ================= 3. Timeouts (Seconds) =================
try:
    SCRAPER_TIMEOUT = int(_get_secret_or_env("SCRAPER_TIMEOUT", "8"))
except ValueError:
    SCRAPER_TIMEOUT = 8

try:
    PLANNER_TIMEOUT_SECONDS = float(_get_secret_or_env("PLANNER_TIMEOUT_SECONDS", "20"))
except ValueError:
    PLANNER_TIMEOUT_SECONDS = 20.0

try:
    ANALYZER_TIMEOUT_SECONDS = float(_get_secret_or_env("ANALYZER_TIMEOUT_SECONDS", "45"))
except ValueError:
    ANALYZER_TIMEOUT_SECONDS = 45.0

_default_deadline = "30"
try:
    FACTCHECK_DEADLINE_SECONDS = float(_get_secret_or_env("FACTCHECK_DEADLINE_SECONDS", _default_deadline))
except ValueError:
    FACTCHECK_DEADLINE_SECONDS = float(_default_deadline)

# ================= 4. App Constants =================
RATE_LIMIT_MAX = 20
RATE_LIMIT_WINDOW = 3600
MAX_TEXT_INPUT_LENGTH = 5000

VIDEO_PATTERNS = [
    r'youtube\.com/watch', r'youtu\.be', r'youtube\.com/shorts', 
    r'tiktok\.com', r'vt\.tiktok\.com', r'vm\.tiktok\.com', 
    r'fb\.watch', r'facebook\.com/.*/videos/', 
    r'/share/v/', r'/share/r/', r'vimeo\.com', r'dailymotion\.com'
]
