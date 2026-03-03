"""
Analytics blueprint.
Routes: /api/v1/analytics/
All endpoints require JWT + admin/agent role unless noted.
"""

import logging
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, extract, text

from database import db
from models import (
    Property, PropertyType, ListingStatus,
    Transaction, TransactionStatus, TransactionType,
    Contact, ContactStatus,
    User, Agent, Listing, Favorite,
)
from utils.cache import cache_manager
from utils.auth_helpers import require_role

logger = logging.getLogger(__name__)
analytics_bp = Blueprint("analytics", __name__)


# ---------------------------------------------------------------------------
# GET /api/v1/analytics/dashboard
# ---------------------------------------------------------------------------

@analytics_bp.route("/dashboard", methods=["GET"])
@jwt_required()
@require_role("admin", "agent")
def dashboard():
    """High-level KPI dashboard (cached 10 minutes)."""
    cache_key = "analytics:dashboard"
    cached = cache_manager.get(cache_key)
    if cached:
        return jsonify(cached), 200

    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    ninety_days_ago = now - timedelta(days=90)

    # Properties
    total_props = Property.query.filter(Property.deleted_at.is_(None)).count()
    active_props = Property.query.filter(
        Property.deleted_at.is_(None), Property.status == ListingStatus.ACTIVE
    ).count()
    new_props_30d = Property.query.filter(
        Property.deleted_at.is_(None), Property.created_at >= thirty_days_ago
    ).count()

    # Transactions
    total_transactions = Transaction.query.count()
    completed_transactions = Transaction.query.filter_by(status=TransactionStatus.COMPLETED).count()
    total_revenue = db.session.query(func.sum(Transaction.commission_amount)).filter(
        Transaction.status == TransactionStatus.COMPLETED
    ).scalar() or 0

    revenue_30d = db.session.query(func.sum(Transaction.commission_amount)).filter(
        Transaction.status == TransactionStatus.COMPLETED,
        Transaction.closed_at >= thirty_days_ago,
    ).scalar() or 0

    # Contacts
    total_contacts = Contact.query.count()
    new_contacts_30d = Contact.query.filter(Contact.created_at >= thirty_days_ago).count()

    # Users
    total_users = User.query.filter(User.deleted_at.is_(None)).count()
    new_users_30d = User.query.filter(
        User.deleted_at.is_(None), User.created_at >= thirty_days_ago
    ).count()

    # Agents
    total_agents = Agent.query.filter(Agent.deleted_at.is_(None)).count()

    result = {
        "generated_at": now.isoformat(),
        "properties": {
            "total": total_props,
            "active": active_props,
            "new_last_30_days": new_props_30d,
        },
        "transactions": {
            "total": total_transactions,
            "completed": completed_transactions,
            "total_commission_usd": float(total_revenue),
            "commission_last_30_days_usd": float(revenue_30d),
        },
        "contacts": {
            "total": total_contacts,
            "new_last_30_days": new_contacts_30d,
        },
        "users": {
            "total": total_users,
            "new_last_30_days": new_users_30d,
        },
        "agents": {
            "total": total_agents,
        },
    }
    cache_manager.set(cache_key, result, timeout=600)
    return jsonify(result), 200


# ---------------------------------------------------------------------------
# GET /api/v1/analytics/properties/trends
# ---------------------------------------------------------------------------

@analytics_bp.route("/properties/trends", methods=["GET"])
@jwt_required()
@require_role("admin", "agent")
def property_trends():
    """Monthly property listing counts for the last N months."""
    months = min(int(request.args.get("months", 12)), 36)
    cache_key = f"analytics:property_trends:{months}"
    cached = cache_manager.get(cache_key)
    if cached:
        return jsonify(cached), 200

    rows = db.session.execute(
        text("""
            SELECT
                DATE_TRUNC('month', created_at) AS month,
                COUNT(*) AS new_listings,
                AVG(price) AS avg_price
            FROM properties
            WHERE deleted_at IS NULL
              AND created_at >= NOW() - INTERVAL ':months months'
            GROUP BY 1
            ORDER BY 1
        """),
        {"months": months},
    ).fetchall()

    result = [
        {
            "month": str(row.month)[:7],
            "new_listings": int(row.new_listings),
            "avg_price_usd": float(row.avg_price) if row.avg_price else 0,
        }
        for row in rows
    ]
    cache_manager.set(cache_key, result, timeout=3600)
    return jsonify(result), 200


# ---------------------------------------------------------------------------
# GET /api/v1/analytics/transactions/summary
# ---------------------------------------------------------------------------

@analytics_bp.route("/transactions/summary", methods=["GET"])
@jwt_required()
@require_role("admin", "agent")
def transactions_summary():
    """Transaction summary by type and month (cached 1 hour)."""
    cache_key = "analytics:transactions_summary"
    cached = cache_manager.get(cache_key)
    if cached:
        return jsonify(cached), 200

    by_status = db.session.query(
        Transaction.status, func.count(Transaction.id), func.sum(Transaction.sale_price)
    ).group_by(Transaction.status).all()

    by_type = db.session.query(
        Transaction.transaction_type, func.count(Transaction.id), func.sum(Transaction.commission_amount)
    ).group_by(Transaction.transaction_type).all()

    avg_days = db.session.execute(
        text("""
            SELECT AVG(EXTRACT(EPOCH FROM (closed_at - created_at)) / 86400) AS avg_days
            FROM transactions
            WHERE status = 'completed' AND closed_at IS NOT NULL
        """)
    ).scalar()

    result = {
        "by_status": [
            {"status": s.value, "count": c, "total_value_usd": float(v) if v else 0}
            for s, c, v in by_status
        ],
        "by_type": [
            {"type": t.value, "count": c, "total_commission_usd": float(v) if v else 0}
            for t, c, v in by_type
        ],
        "avg_days_to_close": float(avg_days) if avg_days else None,
    }
    cache_manager.set(cache_key, result, timeout=3600)
    return jsonify(result), 200


# ---------------------------------------------------------------------------
# GET /api/v1/analytics/market/provinces
# ---------------------------------------------------------------------------

@analytics_bp.route("/market/provinces", methods=["GET"])
def market_by_province():
    """Public market statistics grouped by province (cached 1 hour)."""
    cache_key = "analytics:market_provinces"
    cached = cache_manager.get(cache_key)
    if cached:
        return jsonify(cached), 200

    rows = db.session.query(
        Property.province,
        func.count(Property.id).label("listings"),
        func.avg(Property.price).label("avg_price"),
        func.min(Property.price).label("min_price"),
        func.max(Property.price).label("max_price"),
        func.avg(Property.area_sqm).label("avg_area"),
    ).filter(
        Property.deleted_at.is_(None),
        Property.status == ListingStatus.ACTIVE,
    ).group_by(Property.province).all()

    result = [
        {
            "province": row.province,
            "active_listings": int(row.listings),
            "avg_price_usd": float(row.avg_price) if row.avg_price else 0,
            "min_price_usd": float(row.min_price) if row.min_price else 0,
            "max_price_usd": float(row.max_price) if row.max_price else 0,
            "avg_area_sqm": float(row.avg_area) if row.avg_area else 0,
        }
        for row in rows
    ]
    cache_manager.set(cache_key, result, timeout=3600)
    return jsonify(result), 200


# ---------------------------------------------------------------------------
# GET /api/v1/analytics/leads/funnel
# ---------------------------------------------------------------------------

@analytics_bp.route("/leads/funnel", methods=["GET"])
@jwt_required()
@require_role("admin", "agent")
def leads_funnel():
    """Contact / lead funnel breakdown by status."""
    rows = db.session.query(
        Contact.status, func.count(Contact.id)
    ).group_by(Contact.status).all()

    return jsonify(
        [{"status": s.value, "count": c} for s, c in rows]
    ), 200


# ---------------------------------------------------------------------------
# GET /api/v1/analytics/popular
# ---------------------------------------------------------------------------

@analytics_bp.route("/popular", methods=["GET"])
def popular_properties():
    """Return top-viewed properties (public, cached 30 min)."""
    cache_key = "analytics:popular"
    cached = cache_manager.get(cache_key)
    if cached:
        return jsonify(cached), 200

    props = (
        Property.query
        .filter(Property.deleted_at.is_(None), Property.status == ListingStatus.ACTIVE)
        .order_by(Property.view_count.desc())
        .limit(10)
        .all()
    )
    result = [p.to_dict(include_images=True, include_amenities=False) for p in props]
    cache_manager.set(cache_key, result, timeout=1800)
    return jsonify(result), 200
