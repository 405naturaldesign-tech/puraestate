"""
Health check utilities.
Used by the /health endpoint to report service status.
"""

import logging
from typing import Dict

logger = logging.getLogger(__name__)


def check_health() -> dict:
    """
    Run all health checks and return a status report.

    Returns:
        dict with keys:
            healthy (bool): overall system status
            checks (dict): individual service statuses
    """
    checks = {}

    # Database
    db_ok, db_msg = _check_database()
    checks["database"] = {"ok": db_ok, "message": db_msg}

    # Redis
    redis_ok, redis_msg = _check_redis()
    checks["redis"] = {"ok": redis_ok, "message": redis_msg}

    overall = all(c["ok"] for c in checks.values())
    return {
        "healthy": overall,
        "status": "ok" if overall else "degraded",
        "checks": checks,
    }


def _check_database() -> tuple:
    """Ping the PostgreSQL database."""
    try:
        from database import ping_db
        ok = ping_db()
        return ok, "ok" if ok else "unreachable"
    except Exception as exc:
        logger.error("Health check DB error: %s", exc)
        return False, str(exc)


def _check_redis() -> tuple:
    """Ping Redis."""
    try:
        from utils.cache import _client
        client = _client()
        if client is None:
            return False, "not configured"
        client.ping()
        return True, "ok"
    except Exception as exc:
        logger.warning("Health check Redis error: %s", exc)
        return False, str(exc)
