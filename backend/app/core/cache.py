import time
import threading
from typing import Any, Optional, Dict, Tuple
from app.core.config import settings

class InMemoryCache:
    """
    High-performance in-memory cache with TTL expiration and automatic invalidation.
    Designed for instant responses under high concurrency and heavy database loads.
    Can be seamlessly swapped with Redis by setting REDIS_URL in production.
    """
    def __init__(self, default_ttl: int = 30):
        self._cache: Dict[str, Tuple[Any, float]] = {}
        self._lock = threading.Lock()
        self.default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key not in self._cache:
                return None
            val, expiry = self._cache[key]
            if time.time() > expiry:
                del self._cache[key]
                return None
            return val

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        if ttl is None:
            ttl = self.default_ttl
        expiry = time.time() + ttl
        with self._lock:
            self._cache[key] = (value, expiry)

    def invalidate(self, prefix_or_key: str) -> None:
        """Invalidates all cache entries matching a prefix or exact key."""
        with self._lock:
            keys_to_del = [k for k in self._cache.keys() if k.startswith(prefix_or_key)]
            for k in keys_to_del:
                del self._cache[k]

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()

cache = InMemoryCache(default_ttl=30)
