"""
Agents blueprint.
Routes: /api/v1/agents/
"""

import logging

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from database import db, get_or_404, commit_or_rollback, paginate_query
from models import Agent, Agency, User, UserRole, Listing, Contact
from utils.cache import cache_manager

logger = logging.getLogger(__name__)
agents_bp = Blueprint("agents", __name__)


# ---------------------------------------------------------------------------
# GET /api/v1/agents
# ---------------------------------------------------------------------------

@agents_bp.route("", methods=["GET"])
def list_agents():
    """Return a paginated list of agents with optional filters."""
    p = request.args
    page = max(1, int(p.get("page", 1)))
    per_page = min(int(p.get("per_page", 20)), 100)

    query = (
        Agent.query
        .join(User, Agent.user_id == User.id)
        .filter(Agent.deleted_at.is_(None), User.is_active.is_(True))
    )

    if p.get("agency_id"):
        query = query.filter(Agent.agency_id == int(p["agency_id"]))
    if p.get("is_featured") in ("true", "1"):
        query = query.filter(Agent.is_featured.is_(True))
    if p.get("language"):
        query = query.filter(Agent.languages.any(p["language"]))
    if p.get("specialization"):
        query = query.filter(Agent.specializations.any(p["specialization"]))
    if p.get("search"):
        term = f"%{p['search']}%"
        query = query.filter(
            db.or_(
                User.first_name.ilike(term),
                User.last_name.ilike(term),
                Agent.bio.ilike(term),
            )
        )

    sort = p.get("sort", "featured")
    if sort == "featured":
        query = query.order_by(Agent.is_featured.desc(), Agent.rating.desc())
    elif sort == "rating":
        query = query.order_by(Agent.rating.desc())
    elif sort == "experience":
        query = query.order_by(Agent.years_experience.desc())
    elif sort == "listings":
        query = query.order_by(Agent.total_listings.desc())

    result = paginate_query(query, page=page, per_page=per_page)
    result["items"] = [_agent_with_user(a) for a in result["items"]]
    return jsonify(result), 200


# ---------------------------------------------------------------------------
# GET /api/v1/agents/<id>
# ---------------------------------------------------------------------------

@agents_bp.route("/<int:agent_id>", methods=["GET"])
def get_agent(agent_id):
    """Return full agent profile."""
    agent = get_or_404(Agent, agent_id)
    data = _agent_with_user(agent)
    data["recent_listings"] = [
        listing.to_dict()
        for listing in Listing.query.filter(
            Listing.agents.any(id=agent_id),
            Listing.deleted_at.is_(None),
        ).order_by(Listing.created_at.desc()).limit(5).all()
    ]
    return jsonify(data), 200


# ---------------------------------------------------------------------------
# POST /api/v1/agents  – create agent profile
# ---------------------------------------------------------------------------

@agents_bp.route("", methods=["POST"])
@jwt_required()
def create_agent():
    """Create an agent profile for the authenticated user."""
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify(error="not_found", message="User not found."), 404

    if Agent.query.filter_by(user_id=user_id).first():
        return jsonify(error="conflict", message="Agent profile already exists."), 409

    data = request.get_json(silent=True) or {}

    agent = Agent(
        user_id=user_id,
        agency_id=data.get("agency_id"),
        license_number=data.get("license_number"),
        bio=data.get("bio"),
        specializations=data.get("specializations"),
        languages=data.get("languages", ["es", "en"]),
        years_experience=data.get("years_experience"),
        commission_rate=data.get("commission_rate"),
        social_links=data.get("social_links"),
    )
    db.session.add(agent)

    # Elevate user role to agent
    user.role = UserRole.AGENT
    commit_or_rollback()

    cache_manager.invalidate_pattern("agents:*")
    return jsonify(message="Agent profile created.", agent=agent.to_dict()), 201


# ---------------------------------------------------------------------------
# PUT/PATCH /api/v1/agents/<id>
# ---------------------------------------------------------------------------

@agents_bp.route("/<int:agent_id>", methods=["PUT", "PATCH"])
@jwt_required()
def update_agent(agent_id):
    """Update agent profile (self or admin)."""
    agent = get_or_404(Agent, agent_id)
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)

    if agent.user_id != user_id and user.role != UserRole.ADMIN:
        return jsonify(error="forbidden", message="You cannot edit this profile."), 403

    data = request.get_json(silent=True) or {}
    for field in ("bio", "specializations", "languages", "years_experience",
                  "commission_rate", "social_links", "agency_id", "license_number"):
        if field in data:
            setattr(agent, field, data[field])

    # Admins can set is_featured
    if user.role == UserRole.ADMIN and "is_featured" in data:
        agent.is_featured = bool(data["is_featured"])

    commit_or_rollback()
    cache_manager.invalidate_pattern("agents:*")
    return jsonify(message="Agent updated.", agent=agent.to_dict()), 200


# ---------------------------------------------------------------------------
# GET /api/v1/agents/featured
# ---------------------------------------------------------------------------

@agents_bp.route("/featured", methods=["GET"])
def featured_agents():
    """Return featured agents (cached)."""
    cache_key = "agents:featured"
    cached = cache_manager.get(cache_key)
    if cached:
        return jsonify(cached), 200

    agents = (
        Agent.query
        .join(User, Agent.user_id == User.id)
        .filter(Agent.is_featured.is_(True), Agent.deleted_at.is_(None), User.is_active.is_(True))
        .order_by(Agent.rating.desc())
        .limit(8)
        .all()
    )
    result = [_agent_with_user(a) for a in agents]
    cache_manager.set(cache_key, result, timeout=1800)
    return jsonify(result), 200


# ---------------------------------------------------------------------------
# GET /api/v1/agents/agencies  – list all agencies
# ---------------------------------------------------------------------------

@agents_bp.route("/agencies", methods=["GET"])
def list_agencies():
    """Return all active agencies."""
    agencies = Agency.query.filter_by(is_active=True, deleted_at=None).all()
    return jsonify([a.to_dict() for a in agencies]), 200


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _agent_with_user(agent: Agent) -> dict:
    """Merge agent dict with user public profile."""
    data = agent.to_dict()
    if agent.user:
        u = agent.user
        data["name"] = f"{u.first_name} {u.last_name}"
        data["email"] = u.email
        data["phone"] = u.phone
        data["avatar_url"] = u.avatar_url
    if agent.agency:
        data["agency"] = agent.agency.to_dict()
    return data
