"""
Authentication and authorisation helper decorators.
"""

import functools
import logging
from typing import Tuple

from flask import jsonify
from flask_jwt_extended import get_jwt_identity

logger = logging.getLogger(__name__)


def require_role(*allowed_roles: str):
    """
    Decorator that restricts a route to users with specific roles.
    Must be applied AFTER @jwt_required() so the JWT identity is available.

    Usage:
        @app.route("/admin")
        @jwt_required()
        @require_role("admin")
        def admin_view():
            ...

    Args:
        *allowed_roles: One or more role strings (e.g. "admin", "agent").
    """
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            from database import db
            from models import User

            user_id = get_jwt_identity()
            user = db.session.get(User, user_id)

            if user is None:
                return jsonify(error="not_found", message="User not found."), 404

            if user.role.value not in allowed_roles:
                return jsonify(
                    error="forbidden",
                    message=(
                        f"Access requires one of the following roles: {', '.join(allowed_roles)}."
                    ),
                ), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def get_current_user():
    """
    Return the currently authenticated User model, or None.
    Must be called inside a JWT-protected request context.
    """
    from database import db
    from models import User

    user_id = get_jwt_identity()
    if user_id is None:
        return None
    return db.session.get(User, user_id)
