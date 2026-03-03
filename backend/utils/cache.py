"""
Redis-backed cache manager for the Costa Rica Real Estate platform.

Features:
  - get / set / delete with optional TTL
  - Pattern-based key invalidation
  - JSON serialisation / deserialisation
  - Graceful fallback when Redis is unavailable
  - Rate-limit counter helpers
  - Session storage helpers
"""

import json
import logging
import re
from typing import Any, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level Redis client (initialised lazily from app config)
# ---------------------------------------------------------------------------
_redis_client = None


def init_cache(app) -> None:
    """
    Bind the Redis client to the Flask application.
    Call once in the application factory after app config is loaded.
    """
    global _redis_client
    import redis

    redis_url = app.config.get("REDIS_URL", "redis://localhost:6379/0")
    try:
        _redis_client = redis.Redis.from_url(
            redis_url,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
            retry_on_timeout=True,
        )
        _redis_client.ping()
        logger.info("Redis cache connected: %s", redis_url)
    except Exception as exc:
        logger.warning("Redis unavailable (%s). Running without cache.", exc)
        _redis_client = None


def _client():
    """Return the Redis client, or None if not available."""
    return _redis_client


# ---------------------------------------------------------------------------
# Core cache operations
# ---------------------------------------------------------------------------

class CacheManager:
    """Thin wrapper around Redis providing typed get/set/delete operations."""

    DEFAULT_TIMEOUT = 300  # 5 minutes

    # ----- Basic operations -----

    def get(self, key: str) -> Optional[Any]:
        """Return a cached value, or None on miss / error."""
        client = _client()
        if client is None:
            return None
        try:
            raw = client.get(key)
            if raw is None:
                return None
            return json.loads(raw)
        except Exception as exc:
            logger.debug("Cache GET error key=%s: %s", key, exc)
            return None

    def set(self, key: str, value: Any, timeout: Optional[int] = None) -> bool:
        """Serialise *value* to JSON and store it in Redis with an optional TTL."""
        client = _client()
        if client is None:
            return False
        ttl = timeout if timeout is not None else self.DEFAULT_TIMEOUT
        try:
            serialised = json.dumps(value, default=str)
            if ttl > 0:
                client.setex(key, ttl, serialised)
            else:
                client.set(key, serialised)
            return True
        except Exception as exc:
            logger.debug("Cache SET error key=%s: %s", key, exc)
            return False

    def delete(self, key: str) -> bool:
        """Remove a single key."""
        client = _client()
        if client is None:
            return False
        try:
            client.delete(key)
            return True
        except Exception as exc:
            logger.debug("Cache DELETE error key=%s: %s", key, exc)
            return False

    def exists(self, key: str) -> bool:
        """Return True if the key exists in Redis."""
        client = _client()
        if client is None:
            return False
        try:
            return bool(client.exists(key))
        except Exception:
            return False

    def ttl(self, key: str) -> int:
        """Return the remaining TTL for *key* in seconds (-1 = no expiry, -2 = missing)."""
        client = _client()
        if client is None:
            return -2
        try:
            return client.ttl(key)
        except Exception:
            return -2

    # ----- Pattern invalidation -----

    def invalidate_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching a glob pattern (e.g. "properties:*").
        Returns the number of keys removed.

        WARNING: Uses SCAN, which is safe for production (does not block).
        """
        client = _client()
        if client is None:
            return 0
        count = 0
        try:
            cursor = 0
            while True:
                cursor, keys = client.scan(cursor, match=pattern, count=100)
                if keys:
                    client.delete(*keys)
                    count += len(keys)
                if cursor == 0:
                    break
        except Exception as exc:
            logger.debug("Cache invalidate_pattern error pattern=%s: %s", pattern, exc)
        return count

    def flush_all(self) -> int:
        """
        Flush ALL keys in the currently selected Redis database.
        Use with caution (admin use only).
        """
        client = _client()
        if client is None:
            return 0
        try:
            db_size = client.dbsize()
            client.flushdb()
            logger.warning("Redis DB flushed (%d keys removed).", db_size)
            return db_size
        except Exception as exc:
            logger.error("Cache flush_all error: %s", exc)
            return 0

    # ----- Rate limiting helpers -----

    def rate_limit_check(self, key: str, limit: int, window_seconds: int) -> dict:
        """
        Sliding-window rate limiter.

        Returns a dict:
            {
                "allowed": bool,
                "remaining": int,
                "reset_in": int  (seconds until the window resets)
            }
        """
        client = _client()
        if client is None:
            # Redis unavailable – allow all requests
            return {"allowed": True, "remaining": limit, "reset_in": window_seconds}

        try:
            pipe = client.pipeline()
            pipe.incr(key)
            pipe.ttl(key)
            count, remaining_ttl = pipe.execute()

            if count == 1 or remaining_ttl == -1:
                # First request in this window; set expiry
                client.expire(key, window_seconds)
                remaining_ttl = window_seconds

            remaining = max(0, limit - count)
            return {
                "allowed": count <= limit,
                "remaining": remaining,
                "reset_in": remaining_ttl if remaining_ttl > 0 else window_seconds,
                "count": count,
            }
        except Exception as exc:
            logger.debug("Rate limit check error key=%s: %s", key, exc)
            return {"allowed": True, "remaining": limit, "reset_in": window_seconds}

    # ----- Session helpers -----

    def set_session(self, session_id: str, data: dict, timeout: int = 3600) -> bool:
        """Store session data keyed by session_id."""
        return self.set(f"session:{session_id}", data, timeout=timeout)

    def get_session(self, session_id: str) -> Optional[dict]:
        """Retrieve session data by session_id."""
        return self.get(f"session:{session_id}")

    def delete_session(self, session_id: str) -> bool:
        """Destroy a session."""
        return self.delete(f"session:{session_id}")

    def refresh_session(self, session_id: str, timeout: int = 3600) -> bool:
        """Reset the TTL on a session key."""
        client = _client()
        if client is None:
            return False
        try:
            return bool(client.expire(f"session:{session_id}", timeout))
        except Exception:
            return False

    # ----- Convenience: cached property stats -----

    def get_property_stats(self) -> Optional[dict]:
        return self.get("stats:properties")

    def set_property_stats(self, stats: dict, timeout: int = 3600) -> bool:
        return self.set("stats:properties", stats, timeout=timeout)

    def get_search_results(self, cache_key: str) -> Optional[Any]:
        return self.get(f"search:{cache_key}")

    def set_search_results(self, cache_key: str, results: Any, timeout: int = 120) -> bool:
        return self.set(f"search:{cache_key}", results, timeout=timeout)


# ---------------------------------------------------------------------------
# Singleton instance
# ---------------------------------------------------------------------------
cache_manager = CacheManager()
