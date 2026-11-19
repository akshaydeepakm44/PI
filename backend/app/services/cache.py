import time
import threading
from typing import Any, Optional, Dict

class SimpleTTLCache:
    """Thread-safe in-memory cache with time-to-live expiration."""
    def __init__(self, default_ttl_seconds: int = 3600):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()
        self._default_ttl = default_ttl_seconds

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            entry = self._cache.get(key)
            if not entry:
                return None
            if time.time() > entry["expires_at"]:
                del self._cache[key]
                return None
            return entry["value"]

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        with self._lock:
            self._cache[key] = {
                "value": value,
                "expires_at": time.time() + ttl,
                "created_at": time.time()
            }

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()

class RateLimiter:
    """Enforces minimum interval between consecutive requests to polite providers (e.g. OSM Nominatim)."""
    def __init__(self, min_interval_seconds: float = 1.0):
        self.min_interval = min_interval_seconds
        self.last_call_time = 0.0
        self._lock = threading.Lock()

    def wait(self) -> None:
        with self._lock:
            elapsed = time.time() - self.last_call_time
            if elapsed < self.min_interval:
                time.sleep(self.min_interval - elapsed)
            self.last_call_time = time.time()

# Shared singletons
geocoding_cache = SimpleTTLCache(default_ttl_seconds=86400) # 24h for geocoding
poi_cache = SimpleTTLCache(default_ttl_seconds=43200)       # 12h for POI queries
route_cache = SimpleTTLCache(default_ttl_seconds=43200)     # 12h for routes
air_quality_cache = SimpleTTLCache(default_ttl_seconds=3600) # 1h for air quality

nominatim_limiter = RateLimiter(min_interval_seconds=1.1)
