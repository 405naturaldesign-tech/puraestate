"""
Database initialisation, SQLAlchemy instance, and Alembic migration support.

Usage in app factory:
    from database import db, migrate, init_db
    init_db(app)
"""

import logging
from typing import Optional

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from sqlalchemy import text

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# SQLAlchemy and Alembic / Flask-Migrate instances
# These are initialised *lazily* via init_db() so they can be imported
# anywhere without requiring an active app context.
# ---------------------------------------------------------------------------

db = SQLAlchemy()
migrate = Migrate()


def init_db(app: Flask) -> None:
    """
    Bind SQLAlchemy and Flask-Migrate to the Flask application.

    Call this once inside the application factory (create_app).
    All models must be imported before the first call so that
    Alembic can discover them during autogenerate.
    """
    db.init_app(app)

    # Import all models so SQLAlchemy metadata is populated and
    # Alembic autogenerate can detect changes.
    _import_models()

    migrate.init_app(app, db, directory="migrations", compare_type=True)

    logger.info(
        "Database initialised | uri=%s",
        _safe_uri(app.config.get("SQLALCHEMY_DATABASE_URI", "")),
    )


def _import_models() -> None:
    """
    Import all ORM models to register them with SQLAlchemy metadata.
    This is a no-op if models are already imported elsewhere.
    """
    try:
        import models  # noqa: F401 – side-effect import
    except ImportError as exc:
        logger.warning("Could not import models: %s", exc)


def _safe_uri(uri: str) -> str:
    """Return the database URI with the password masked."""
    if "@" in uri:
        scheme_user, rest = uri.rsplit("@", 1)
        if ":" in scheme_user:
            scheme_part, _ = scheme_user.rsplit(":", 1)
            return f"{scheme_part}:***@{rest}"
    return uri


# ---------------------------------------------------------------------------
# Database health check helper
# ---------------------------------------------------------------------------

def ping_db() -> bool:
    """
    Execute a lightweight SELECT 1 to verify the database connection.
    Returns True on success, False on any error.
    """
    try:
        db.session.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.error("Database ping failed: %s", exc)
        return False


# ---------------------------------------------------------------------------
# Session / transaction helpers
# ---------------------------------------------------------------------------

def get_or_404(model, record_id: int, error_message: Optional[str] = None):
    """
    Return a model instance by primary key, or raise a 404 HTTP error.

    Args:
        model: SQLAlchemy model class.
        record_id: Primary key value to look up.
        error_message: Optional custom error message.

    Returns:
        Model instance.

    Raises:
        werkzeug.exceptions.NotFound: if the record does not exist.
    """
    from flask import abort

    instance = db.session.get(model, record_id)
    if instance is None:
        msg = error_message or f"{model.__name__} with id {record_id} not found."
        abort(404, description=msg)
    return instance


def commit_or_rollback() -> bool:
    """
    Attempt to commit the current session.
    On failure, roll back and re-raise the exception.

    Returns:
        True on success.
    """
    try:
        db.session.commit()
        return True
    except Exception as exc:
        db.session.rollback()
        logger.error("Commit failed, rolled back: %s", exc)
        raise


def paginate_query(query, page: int = 1, per_page: int = 20, max_per_page: int = 100):
    """
    Apply pagination to a SQLAlchemy query and return a structured dict.

    Args:
        query: SQLAlchemy query object.
        page: Current page number (1-indexed).
        per_page: Number of items per page.
        max_per_page: Maximum allowed per_page.

    Returns:
        dict with keys: items, total, page, per_page, pages, has_prev, has_next.
    """
    page = max(1, page)
    per_page = min(max(1, per_page), max_per_page)

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return {
        "items": pagination.items,
        "total": pagination.total,
        "page": pagination.page,
        "per_page": pagination.per_page,
        "pages": pagination.pages,
        "has_prev": pagination.has_prev,
        "has_next": pagination.has_next,
    }
