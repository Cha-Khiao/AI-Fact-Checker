"""Root server runner for Render, Railway, and Cloud PaaS platforms."""
import os
import sys

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

import uvicorn

if __name__ == "__main__":
    port_str = os.environ.get("PORT", "8000")
    try:
        port = int(port_str)
    except ValueError:
        port = 8000

    print(f"[*] Starting AI Fact-Checker API Server on port {port}...")
    uvicorn.run("api.main:app", host="0.0.0.0", port=port, reload=False)
