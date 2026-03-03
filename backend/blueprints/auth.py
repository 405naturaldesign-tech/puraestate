"""
Authentication blueprint: register, login, logout, refresh, password reset.
Routes: /api/v1/auth/
"""

import logging
from datetime import datetime

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)
from werkzeug.security import check_password_hash, generate_password_hash

from database import db, commit_or_rollback
from models import User, UserRole
from utils.token_blocklist import revoke_token
from utils.validators import validate_email, validate_password_strength

logger = logging.getLogger(__name__)
auth_bp = Blueprint("auth", __name__)


# ---------------------------------------------------------------------------
# POST /api/v1/auth/register
# ---------------------------------------------------------------------------

@auth_bp.route("/register", methods=["POST"])
def register():
    """Create a new user account."""
    data = request.get_json(silent=True) or {}

    # Validate required fields
    required = ("email", "password", "first_name", "last_name")
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify(error="validation_error", missing_fields=missing), 400

    email = data["email"].strip().lower()
    if not validate_email(email):
        return jsonify(error="validation_error", message="Invalid email address."), 400

    if not validate_password_strength(data["password"]):
        return jsonify(
            error="validation_error",
            message="Password must be at least 8 characters and contain uppercase, lowercase, and a digit.",
        ), 400

    # Check for duplicate
    if User.query.filter_by(email=email).first():
        return jsonify(error="conflict", message="An account with this email already exists."), 409

    user = User(
        email=email,
        password_hash=generate_password_hash(data["password"]),
        first_name=data["first_name"].strip(),
        last_name=data["last_name"].strip(),
        phone=data.get("phone"),
        role=UserRole(data.get("role", UserRole.BUYER.value)),
        preferred_language=data.get("preferred_language", "es"),
        preferred_currency=data.get("preferred_currency", "USD"),
    )
    db.session.add(user)
    commit_or_rollback()

    logger.info("New user registered: %s (id=%s)", email, user.id)

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    return jsonify(
        message="Account created successfully.",
        user=user.to_dict(),
        access_token=access_token,
        refresh_token=refresh_token,
    ), 201


# ---------------------------------------------------------------------------
# POST /api/v1/auth/login
# ---------------------------------------------------------------------------

@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate a user and return JWT tokens."""
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify(error="validation_error", message="Email and password are required."), 400

    user = User.query.filter_by(email=email, deleted_at=None).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify(error="invalid_credentials", message="Invalid email or password."), 401

    if not user.is_active:
        return jsonify(error="account_disabled", message="Your account has been disabled."), 403

    # Update last login timestamp
    user.last_login_at = datetime.utcnow()
    commit_or_rollback()

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    logger.info("User logged in: %s (id=%s)", email, user.id)

    return jsonify(
        message="Login successful.",
        user=user.to_dict(),
        access_token=access_token,
        refresh_token=refresh_token,
    ), 200


# ---------------------------------------------------------------------------
# POST /api/v1/auth/refresh
# ---------------------------------------------------------------------------

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """Issue a new access token using a valid refresh token."""
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user or not user.is_active:
        return jsonify(error="account_disabled", message="Account not found or disabled."), 401

    new_access_token = create_access_token(identity=user_id)
    return jsonify(access_token=new_access_token), 200


# ---------------------------------------------------------------------------
# DELETE /api/v1/auth/logout
# ---------------------------------------------------------------------------

@auth_bp.route("/logout", methods=["DELETE"])
@jwt_required()
def logout():
    """Revoke the current access token (add to blocklist)."""
    jwt_payload = get_jwt()
    revoke_token(jwt_payload)
    return jsonify(message="Successfully logged out."), 200


# ---------------------------------------------------------------------------
# GET /api/v1/auth/me
# ---------------------------------------------------------------------------

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    """Return the currently authenticated user's profile."""
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify(error="not_found", message="User not found."), 404
    return jsonify(user=user.to_dict(include_sensitive=True)), 200


# ---------------------------------------------------------------------------
# POST /api/v1/auth/change-password
# ---------------------------------------------------------------------------

@auth_bp.route("/change-password", methods=["POST"])
@jwt_required(fresh=True)
def change_password():
    """Change the authenticated user's password (requires fresh token)."""
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify(error="not_found", message="User not found."), 404

    data = request.get_json(silent=True) or {}
    current_pw = data.get("current_password", "")
    new_pw = data.get("new_password", "")

    if not check_password_hash(user.password_hash, current_pw):
        return jsonify(error="invalid_credentials", message="Current password is incorrect."), 401

    if not validate_password_strength(new_pw):
        return jsonify(
            error="validation_error",
            message="New password must be at least 8 characters with uppercase, lowercase, and a digit.",
        ), 400

    user.password_hash = generate_password_hash(new_pw)
    commit_or_rollback()

    return jsonify(message="Password changed successfully."), 200
