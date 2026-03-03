"""
Users blueprint – profile, favorites, alerts.
Routes: /api/v1/users/
"""

import logging

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash

from database import db, get_or_404, commit_or_rollback, paginate_query
from models import User, Favorite, Alert, AlertFrequency, Property

logger = logging.getLogger(__name__)
users_bp = Blueprint("users", __name__)


# ---------------------------------------------------------------------------
# GET /api/v1/users/me
# ---------------------------------------------------------------------------

@users_bp.route("/me", methods=["GET"])
@jwt_required()
def get_profile():
    """Return the authenticated user's profile."""
    user = db.session.get(User, get_jwt_identity())
    if not user:
        return jsonify(error="not_found", message="User not found."), 404
    return jsonify(user=user.to_dict(include_sensitive=True)), 200


# ---------------------------------------------------------------------------
# PATCH /api/v1/users/me
# ---------------------------------------------------------------------------

@users_bp.route("/me", methods=["PATCH"])
@jwt_required()
def update_profile():
    """Update the authenticated user's profile."""
    user = db.session.get(User, get_jwt_identity())
    if not user:
        return jsonify(error="not_found", message="User not found."), 404

    data = request.get_json(silent=True) or {}
    for field in ("first_name", "last_name", "phone", "avatar_url",
                  "preferred_language", "preferred_currency", "notification_prefs"):
        if field in data:
            setattr(user, field, data[field])

    commit_or_rollback()
    return jsonify(message="Profile updated.", user=user.to_dict(include_sensitive=True)), 200


# ---------------------------------------------------------------------------
# GET /api/v1/users/me/favorites
# ---------------------------------------------------------------------------

@users_bp.route("/me/favorites", methods=["GET"])
@jwt_required()
def get_favorites():
    """Return all favorited properties for the authenticated user."""
    user_id = get_jwt_identity()
    page = max(1, int(request.args.get("page", 1)))
    per_page = min(int(request.args.get("per_page", 20)), 100)

    query = (
        Favorite.query
        .filter_by(user_id=user_id)
        .order_by(Favorite.created_at.desc())
    )
    result = paginate_query(query, page=page, per_page=per_page)
    items = []
    for fav in result["items"]:
        d = fav.to_dict()
        if fav.property:
            d["property"] = fav.property.to_dict(include_images=True, include_amenities=False)
        items.append(d)
    result["items"] = items
    return jsonify(result), 200


# ---------------------------------------------------------------------------
# GET /api/v1/users/me/alerts
# ---------------------------------------------------------------------------

@users_bp.route("/me/alerts", methods=["GET"])
@jwt_required()
def get_alerts():
    """Return all saved search alerts for the authenticated user."""
    user_id = get_jwt_identity()
    alerts = Alert.query.filter_by(user_id=user_id).order_by(Alert.created_at.desc()).all()
    return jsonify([a.to_dict() for a in alerts]), 200


# ---------------------------------------------------------------------------
# POST /api/v1/users/me/alerts
# ---------------------------------------------------------------------------

@users_bp.route("/me/alerts", methods=["POST"])
@jwt_required()
def create_alert():
    """Create a saved search / alert."""
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    if not data.get("name"):
        return jsonify(error="validation_error", message="Alert name is required."), 400
    if not data.get("search_criteria"):
        return jsonify(error="validation_error", message="search_criteria is required."), 400

    try:
        frequency = AlertFrequency(data.get("frequency", AlertFrequency.DAILY.value))
    except ValueError:
        return jsonify(error="validation_error", message="Invalid frequency."), 400

    alert = Alert(
        user_id=user_id,
        name=data["name"],
        search_criteria=data["search_criteria"],
        frequency=frequency,
        email_notifications=data.get("email_notifications", True),
        push_notifications=data.get("push_notifications", False),
    )
    db.session.add(alert)
    commit_or_rollback()
    return jsonify(message="Alert created.", alert=alert.to_dict()), 201


# ---------------------------------------------------------------------------
# PATCH /api/v1/users/me/alerts/<id>
# ---------------------------------------------------------------------------

@users_bp.route("/me/alerts/<int:alert_id>", methods=["PATCH"])
@jwt_required()
def update_alert(alert_id):
    """Update a saved search alert."""
    user_id = get_jwt_identity()
    alert = get_or_404(Alert, alert_id)
    if alert.user_id != user_id:
        return jsonify(error="forbidden", message="You cannot edit this alert."), 403

    data = request.get_json(silent=True) or {}
    for field in ("name", "search_criteria", "email_notifications",
                  "push_notifications", "is_active"):
        if field in data:
            setattr(alert, field, data[field])
    if "frequency" in data:
        try:
            alert.frequency = AlertFrequency(data["frequency"])
        except ValueError:
            return jsonify(error="validation_error", message="Invalid frequency."), 400

    commit_or_rollback()
    return jsonify(message="Alert updated.", alert=alert.to_dict()), 200


# ---------------------------------------------------------------------------
# DELETE /api/v1/users/me/alerts/<id>
# ---------------------------------------------------------------------------

@users_bp.route("/me/alerts/<int:alert_id>", methods=["DELETE"])
@jwt_required()
def delete_alert(alert_id):
    """Delete a saved search alert."""
    user_id = get_jwt_identity()
    alert = get_or_404(Alert, alert_id)
    if alert.user_id != user_id:
        return jsonify(error="forbidden", message="You cannot delete this alert."), 403
    db.session.delete(alert)
    commit_or_rollback()
    return jsonify(message="Alert deleted."), 200


# ---------------------------------------------------------------------------
# GET /api/v1/users/<id>  – public profile
# ---------------------------------------------------------------------------

@users_bp.route("/<int:user_id>", methods=["GET"])
def get_user_public(user_id):
    """Return a user's public profile (name, avatar only)."""
    user = get_or_404(User, user_id)
    return jsonify(
        id=user.id,
        full_name=f"{user.first_name} {user.last_name}",
        avatar_url=user.avatar_url,
        role=user.role.value,
        created_at=user.created_at.isoformat(),
    ), 200
