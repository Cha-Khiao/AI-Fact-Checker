"""Shared pooled HTTP session + true wall-clock request enforcement.

A single module-level :class:`requests.Session` keeps TCP/TLS connections warm
across calls, skipping DNS + TCP + TLS handshakes.
"""

import threading
import requests
from requests.adapters import HTTPAdapter

DEFAULT_CONNECT_TIMEOUT = 5.0
DEFAULT_READ_TIMEOUT = 40.0

_session = requests.Session()
_adapter = HTTPAdapter(pool_connections=16, pool_maxsize=32, max_retries=0)
_session.mount("https://", _adapter)
_session.mount("http://", _adapter)

def get_session() -> requests.Session:
    """Return the shared pooled session (reused across reruns/calls)."""
    return _session

def split_timeout(read_timeout, connect_timeout: float = DEFAULT_CONNECT_TIMEOUT):
    """Return a ``(connect, read)`` timeout tuple bounding connect separately."""
    try:
        read_value = float(read_timeout)
    except (TypeError, ValueError):
        read_value = DEFAULT_READ_TIMEOUT
    connect_value = min(float(connect_timeout), max(1.0, read_value))
    return (connect_value, read_value)

def wall_clock_request(method: str, url: str, **kwargs) -> requests.Response:
    """Perform a request bounded by a TRUE wall-clock deadline."""
    timeout = kwargs.pop("timeout", None)
    if timeout is None:
        timeout = split_timeout(DEFAULT_READ_TIMEOUT)
    if isinstance(timeout, tuple):
        wall = float(timeout[1]) if len(timeout) > 1 else float(timeout[0])
    else:
        wall = float(timeout)
    if wall <= 0.0:
        raise requests.Timeout("wall-clock deadline already elapsed")
    kwargs["timeout"] = timeout
    outcome = {}

    def worker():
        try:
            outcome["response"] = getattr(get_session(), method.lower())(url, **kwargs)
        except Exception as error:
            outcome["error"] = error

    thread = threading.Thread(target=worker, name="http-wallclock", daemon=True)
    thread.start()
    thread.join(timeout=wall)
    if thread.is_alive():
        raise requests.Timeout(f"wall-clock deadline of {wall:g}s exceeded")
    if "error" in outcome:
        raise outcome["error"]
    return outcome["response"]
