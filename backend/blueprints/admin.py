"""
Admin blueprint – management operations restricted to admin role.
Routes: /api/v1/admin/
"""

import logging

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from database import db, get_or_404, commit_or_rollback, paginate_query
from models import (
    User, UserRole, Property, ListingStatus,
    Agent, Agency, Transaction, Contact, ContactStatus,
    AuditLog,
)
from utils.auth_helpers import require_role
from utils.cache import cache_manager

logger = logging.getLogger(__name__)
admin_bp = Blueprint("admin", __name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _audit(user_id, entity_type, entity_id, action, old=None, new=None):
    """Write an audit log row."""
    from flask import request as req
    log = AuditLog(
        user_id=user_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        old_values=old,
        new_values=new,
        ip_address=req.remote_addr,
        user_agent=req.headers.get("User-Agent"),
    )
    db.session.add(log)


# ---------------------------------------------------------------------------
# GET /api/v1/admin/users
# ---------------------------------------------------------------------------

@admin_bp.route("/users", methods=["GET"])
@jwt_required()
@require_role("admin")
def list_users():
    """List all users (admin only)."""
    p = request.args
    page = max(1, int(p.get("page", 1)))
    per_page = min(int(p.get("per_page", 20)), 100)

    query = User.query.filter(User.deleted_at.is_(None))

    if p.get("role"):
        try:
            query = query.filter(User.role == UserRole(p["role"]))
        except ValueError:
            pass
    if p.get("is_active") in ("true", "1"):
        query = query.filter(User.is_active.is_(True))
    if p.get("is_active") in ("false", "0"):
        query = query.filter(User.is_active.is_(False))
    if p.get("search"):
        term = f"%{p['search']}%"
        query = query.filter(
            db.or_(User.email.ilike(term), User.first_name.ilike(term), User.last_name.ilike(term))
        )

    query = query.order_by(User.created_at.desc())
    result = paginate_query(query, page=page, per_page=per_page)
    result["items"] = [u.to_dict() for u in result["items"]]
    return jsonify(result), 200


# ---------------------------------------------------------------------------
# PATCH /api/v1/admin/users/<id>
# ---------------------------------------------------------------------------

@admin_bp.route("/users/<int:user_id>", methods=["PATCH"])
@jwt_required()
@require_role("admin")
def update_user(user_id):
    """Admin user management: toggle active, change role, verify."""
    admin_id = get_jwt_identity()
    user = get_or_404(User, user_id)
    data = request.get_json(silent=True) or {}
    old_values = user.to_dict()

    if "is_active" in data:
        user.is_active = bool(data["is_active"])
    if "is_verified" in data:
        user.is_verified = bool(data["is_verified"])
    if "role" in data:
        try:
            user.role = UserRole(data["role"])
        except ValueError:
            return jsonify(error="validation_error", message=f"Invalid role: {data['role']}"), 400

    _audit(admin_id, "User", user_id, "admin_update", old_values, user.to_dict())
    commit_or_rollback()
    return jsonify(message="User updated.", user=user.to_dict()), 200


# ---------------------------------------------------------------------------
# DELETE /api/v1/admin/users/<id>  – hard delete (admin only)
# ---------------------------------------------------------------------------

@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
@require_role("admin")
def delete_user(user_id):
    """Hard-delete a user account (irreversible)."""
    admin_id = get_jwt_identity()
    user = get_or_404(User, user_id)
    if user.id == admin_id:
        return jsonify(error="forbidden", message="You cannot delete your own account."), 403

    _audit(admin_id, "User", user_id, "admin_delete", user.to_dict(), None)
    db.session.delete(user)
    commit_or_rollback()
    return jsonify(message="User permanently deleted."), 200


# ---------------------------------------------------------------------------
# GET /api/v1/admin/properties
# ---------------------------------------------------------------------------

@admin_bp.route("/properties", methods=["GET"])
@jwt_required()
@require_role("admin")
def admin_list_properties():
    """Admin view of all properties including soft-deleted."""
    p = request.args
    page = max(1, int(p.get("page", 1)))
    per_page = min(int(p.get("per_page", 20)), 100)

    query = Property.query
    if p.get("include_deleted") not in ("true", "1"):
        query = query.filter(Property.deleted_at.is_(None))
    if p.get("status"):
        try:
            query = query.filter(Property.status == ListingStatus(p["status"]))
        except ValueError:
            pass

    query = query.order_by(Property.created_at.desc())
    result = paginate_query(query, page=page, per_page=per_page)
    result["items"] = [prop.to_dict(include_images=False) for prop in result["items"]]
    return jsonify(result), 200


# ---------------------------------------------------------------------------
# PATCH /api/v1/admin/properties/<id>/feature
# ---------------------------------------------------------------------------

@admin_bp.route("/properties/<int:property_id>/feature", methods=["PATCH"])
@jwt_required()
@require_role("admin")
def toggle_featured(property_id):
    """Toggle the is_featured flag on a property."""
    admin_id = get_jwt_identity()
    prop = get_or_404(Property, property_id)
    prop.is_featured = not prop.is_featured
    _audit(admin_id, "Property", property_id, "toggle_featured",
           {"is_featured": not prop.is_featured}, {"is_featured": prop.is_featured})
    commit_or_rollback()
    cache_manager.invalidate_pattern("properties:*")
    return jsonify(is_featured=prop.is_featured), 200


# ---------------------------------------------------------------------------
# GET /api/v1/admin/contacts
# ---------------------------------------------------------------------------

@admin_bp.route("/contacts", methods=["GET"])
@jwt_required()
@require_role("admin", "agent")
def admin_list_contacts():
    """Return all contacts/leads."""
    p = request.args
    page = max(1, int(p.get("page", 1)))
    per_page = min(int(p.get("per_page", 20)), 100)

    query = Contact.query
    if p.get("status"):
        try:
            query = query.filter(Contact.status == ContactStatus(p["status"]))
        except ValueError:
            pass
    if p.get("agent_id"):
        query = query.filter(Contact.agent_id == int(p["agent_id"]))

    query = query.order_by(Contact.created_at.desc())
    result = paginate_query(query, page=page, per_page=per_page)
    result["items"] = [c.to_dict() for c in result["items"]]
    return jsonify(result), 200


# ---------------------------------------------------------------------------
# GET /api/v1/admin/audit-logs
# ---------------------------------------------------------------------------

@admin_bp.route("/audit-logs", methods=["GET"])
@jwt_required()
@require_role("admin")
def audit_logs():
    """Return paginated audit log entries."""
    p = request.args
    page = max(1, int(p.get("page", 1)))
    per_page = min(int(p.get("per_page", 50)), 200)

    query = AuditLog.query
    if p.get("entity_type"):
        query = query.filter(AuditLog.entity_type == p["entity_type"])
    if p.get("user_id"):
        query = query.filter(AuditLog.user_id == int(p["user_id"]))
    if p.get("action"):
        query = query.filter(AuditLog.action.ilike(f"%{p['action']}%"))

    query = query.order_by(AuditLog.created_at.desc())
    result = paginate_query(query, page=page, per_page=per_page)
    result["items"] = [log.to_dict() for log in result["items"]]
    return jsonify(result), 200


# ---------------------------------------------------------------------------
# POST /api/v1/admin/agencies
# ---------------------------------------------------------------------------

@admin_bp.route("/agencies", methods=["POST"])
@jwt_required()
@require_role("admin")
def create_agency():
    """Create a new real-estate agency."""
    data = request.get_json(silent=True) or {}
    if not data.get("name"):
        return jsonify(error="validation_error", message="Agency name is required."), 400

    agency = Agency(
        name=data["name"],
        description=data.get("description"),
        logo_url=data.get("logo_url"),
        website=data.get("website"),
        email=data.get("email"),
        phone=data.get("phone"),
        address=data.get("address"),
        province=data.get("province"),
        license_number=data.get("license_number"),
        social_links=data.get("social_links"),
    )
    db.session.add(agency)
    commit_or_rollback()
    return jsonify(message="Agency created.", agency=agency.to_dict()), 201


# ---------------------------------------------------------------------------
# GET /api/v1/admin/cache/flush
# ---------------------------------------------------------------------------

@admin_bp.route("/cache/flush", methods=["POST"])
@jwt_required()
@require_role("admin")
def flush_cache():
    """Flush all application cache keys."""
    count = cache_manager.flush_all()
    return jsonify(message=f"Cache flushed. {count} keys removed."), 200
