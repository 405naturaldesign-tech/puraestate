"""
JWT token blocklist backed by Redis.
Revoked tokens are stored with their remaining TTL so Redis handles expiry automatically.
"""

import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Prefix for all blocklist keys
_PREFIX = "jwt:blocklist:"


def revoke_token(jwt_payload: dict) -> bool:
    """
    Add a JWT to the Redis blocklist until it would naturally expire.

    Args:
        jwt_payload: The decoded JWT payload (contains 'jti' and 'exp').

    Returns:
        True if the token was successfully added to the blocklist.
    """
    from utils.cache import _client

    client = _client()
    if client is None:
        logger.warning("Redis unavailable – token revocation skipped.")
        return False

    jti = jwt_payload.get("jti")
    exp = jwt_payload.get("exp")
    if not jti:
        return False

    try:
        now = datetime.now(tz=timezone.utc).timestamp()
        ttl = max(1, int(exp - now)) if exp else 3600  # default 1 h
        key = f"{_PREFIX}{jti}"
        client.setex(key, ttl, "revoked")
        logger.debug("Token revoked jti=%s ttl=%ds", jti, ttl)
        return True
    except Exception as exc:
        logger.error("Failed to revoke token jti=%s: %s", jti, exc)
        return False


def is_token_revoked(jwt_payload: dict) -> bool:
    """
    Return True if the given JWT is in the blocklist.
    Called automatically by Flask-JWT-Extended on every protected request.
    """
    from utils.cache import _client

    client = _client()
    if client is None:
        # Fail open: if Redis is down, allow the request
        return False

    jti = jwt_payload.get("jti")
    if not jti:
        return False

    try:
        return client.exists(f"{_PREFIX}{jti}") > 0
    except Exception as exc:
        logger.debug("Blocklist check error jti=%s: %s", jti, exc)
        return False
