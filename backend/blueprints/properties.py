"""
Properties blueprint.
Routes: /api/v1/properties/
"""

import logging
from math import ceil

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from sqlalchemy import or_, and_, func

from database import db, get_or_404, commit_or_rollback, paginate_query
from models import Property, PropertyType, ListingStatus, Favorite, User
from utils.cache import cache_manager
from utils.slugify import slugify
from utils.validators import validate_coordinates

logger = logging.getLogger(__name__)
properties_bp = Blueprint("properties", __name__)


# ---------------------------------------------------------------------------
# GET /api/v1/properties  – list / search
# ---------------------------------------------------------------------------

@properties_bp.route("", methods=["GET"])
def list_properties():
    """
    Search and filter properties.

    Query parameters:
        page, per_page, sort (price_asc/price_desc/newest/oldest/views),
        property_type, province, canton, district,
        min_price, max_price, min_bedrooms, max_bedrooms,
        min_bathrooms, has_pool, has_ocean_view, has_garage,
        furnished, pet_friendly, is_featured, is_new_construction,
        min_area, max_area, search (full-text across title/description),
        tags (comma-separated)
    """
    p = request.args

    page = max(1, int(p.get("page", 1)))
    per_page = min(max(1, int(p.get("per_page", current_app.config["DEFAULT_PAGE_SIZE"]))),
                   current_app.config["MAX_PAGE_SIZE"])

    query = Property.query.filter(Property.deleted_at.is_(None))

    # --- Filters ---
    if p.get("property_type"):
        try:
            ptype = PropertyType(p["property_type"])
            query = query.filter(Property.property_type == ptype)
        except ValueError:
            return jsonify(error="validation_error", message="Invalid property_type."), 400

    if p.get("status"):
        try:
            status = ListingStatus(p["status"])
            query = query.filter(Property.status == status)
        except ValueError:
            pass
    else:
        query = query.filter(Property.status == ListingStatus.ACTIVE)

    for field in ("province", "canton", "district", "neighborhood"):
        if p.get(field):
            query = query.filter(getattr(Property, field).ilike(f"%{p[field]}%"))

    if p.get("min_price"):
        query = query.filter(Property.price >= float(p["min_price"]))
    if p.get("max_price"):
        query = query.filter(Property.price <= float(p["max_price"]))

    if p.get("min_bedrooms"):
        query = query.filter(Property.bedrooms >= int(p["min_bedrooms"]))
    if p.get("max_bedrooms"):
        query = query.filter(Property.bedrooms <= int(p["max_bedrooms"]))

    if p.get("min_bathrooms"):
        query = query.filter(Property.bathrooms >= float(p["min_bathrooms"]))

    if p.get("min_area"):
        query = query.filter(Property.area_sqm >= float(p["min_area"]))
    if p.get("max_area"):
        query = query.filter(Property.area_sqm <= float(p["max_area"]))

    for bool_field in ("has_pool", "has_ocean_view", "has_garage",
                       "furnished", "pet_friendly", "is_featured", "is_new_construction"):
        if p.get(bool_field) in ("true", "1"):
            query = query.filter(getattr(Property, bool_field).is_(True))
        elif p.get(bool_field) in ("false", "0"):
            query = query.filter(getattr(Property, bool_field).is_(False))

    if p.get("tags"):
        tags = [t.strip() for t in p["tags"].split(",") if t.strip()]
        query = query.filter(Property.tags.overlap(tags))

    if p.get("search"):
        term = f"%{p['search']}%"
        query = query.filter(
            or_(
                Property.title.ilike(term),
                Property.description.ilike(term),
                Property.address.ilike(term),
                Property.location_description.ilike(term),
            )
        )

    # Bounding-box geo filter
    if all(p.get(k) for k in ("lat_min", "lat_max", "lon_min", "lon_max")):
        query = query.filter(
            and_(
                Property.latitude >= float(p["lat_min"]),
                Property.latitude <= float(p["lat_max"]),
                Property.longitude >= float(p["lon_min"]),
                Property.longitude <= float(p["lon_max"]),
            )
        )

    # --- Sorting ---
    sort = p.get("sort", "newest")
    sort_map = {
        "price_asc":  Property.price.asc(),
        "price_desc": Property.price.desc(),
        "newest":     Property.created_at.desc(),
        "oldest":     Property.created_at.asc(),
        "views":      Property.view_count.desc(),
        "area_asc":   Property.area_sqm.asc(),
        "area_desc":  Property.area_sqm.desc(),
    }
    query = query.order_by(sort_map.get(sort, Property.created_at.desc()))

    result = paginate_query(query, page=page, per_page=per_page)
    result["items"] = [p_.to_dict(include_images=True) for p_ in result["items"]]

    return jsonify(result), 200


# ---------------------------------------------------------------------------
# POST /api/v1/properties  – create
# ---------------------------------------------------------------------------

@properties_bp.route("", methods=["POST"])
@jwt_required()
def create_property():
    """Create a new property listing (requires authentication)."""
    data = request.get_json(silent=True) or {}

    required = ("title", "property_type", "province", "price", "area_sqm")
    missing = [f for f in required if data.get(f) is None]
    if missing:
        return jsonify(error="validation_error", missing_fields=missing), 400

    try:
        ptype = PropertyType(data["property_type"])
    except ValueError:
        return jsonify(error="validation_error", message="Invalid property_type."), 400

    user_id = get_jwt_identity()

    prop = Property(
        title=data["title"],
        slug=_unique_slug(data["title"]),
        description=data.get("description"),
        property_type=ptype,
        status=ListingStatus(data.get("status", ListingStatus.ACTIVE.value)),
        address=data.get("address"),
        province=data["province"],
        canton=data.get("canton"),
        district=data.get("district"),
        neighborhood=data.get("neighborhood"),
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        area_sqm=data["area_sqm"],
        lot_size_sqm=data.get("lot_size_sqm"),
        construction_sqm=data.get("construction_sqm"),
        bedrooms=data.get("bedrooms"),
        bathrooms=data.get("bathrooms"),
        half_bathrooms=data.get("half_bathrooms"),
        parking_spaces=data.get("parking_spaces"),
        floors=data.get("floors"),
        year_built=data.get("year_built"),
        price=data["price"],
        price_currency=data.get("price_currency", "USD"),
        monthly_hoa_fee=data.get("monthly_hoa_fee"),
        monthly_rent=data.get("monthly_rent"),
        features=data.get("features"),
        tags=data.get("tags"),
        is_featured=data.get("is_featured", False),
        is_new_construction=data.get("is_new_construction", False),
        has_ocean_view=data.get("has_ocean_view", False),
        has_pool=data.get("has_pool", False),
        has_garage=data.get("has_garage", False),
        furnished=data.get("furnished"),
        pet_friendly=data.get("pet_friendly"),
        virtual_tour_url=data.get("virtual_tour_url"),
        video_url=data.get("video_url"),
        owner_id=user_id,
    )
    db.session.add(prop)
    commit_or_rollback()

    logger.info("Property created: id=%s slug=%s", prop.id, prop.slug)
    cache_manager.invalidate_pattern("properties:*")

    return jsonify(message="Property created.", property=prop.to_dict()), 201


# ---------------------------------------------------------------------------
# GET /api/v1/properties/<id>  – retrieve single
# ---------------------------------------------------------------------------

@properties_bp.route("/<int:property_id>", methods=["GET"])
def get_property(property_id):
    """Return a single property; increment view count."""
    prop = get_or_404(Property, property_id)

    # Increment view count (fire-and-forget, non-critical)
    try:
        prop.view_count += 1
        db.session.commit()
    except Exception:
        db.session.rollback()

    # Attach is_favorited flag if user is authenticated
    is_favorited = False
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id:
            is_favorited = Favorite.query.filter_by(
                user_id=user_id, property_id=property_id
            ).first() is not None
    except Exception:
        pass

    result = prop.to_dict(include_images=True, include_amenities=True)
    result["is_favorited"] = is_favorited
    return jsonify(result), 200


# ---------------------------------------------------------------------------
# PUT /api/v1/properties/<id>  – full update
# PATCH /api/v1/properties/<id>  – partial update
# ---------------------------------------------------------------------------

@properties_bp.route("/<int:property_id>", methods=["PUT", "PATCH"])
@jwt_required()
def update_property(property_id):
    """Update a property (owner or admin only)."""
    prop = get_or_404(Property, property_id)
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)

    if prop.owner_id != user_id and user.role.value != "admin":
        return jsonify(error="forbidden", message="You cannot edit this property."), 403

    data = request.get_json(silent=True) or {}
    updatable = (
        "title", "description", "status", "address", "province", "canton",
        "district", "neighborhood", "latitude", "longitude", "area_sqm",
        "lot_size_sqm", "construction_sqm", "bedrooms", "bathrooms",
        "half_bathrooms", "parking_spaces", "floors", "year_built",
        "price", "price_currency", "monthly_hoa_fee", "monthly_rent",
        "features", "tags", "is_featured", "is_new_construction",
        "has_ocean_view", "has_pool", "has_garage", "furnished",
        "pet_friendly", "virtual_tour_url", "video_url",
        "meta_title", "meta_description", "location_description",
    )
    for field in updatable:
        if field in data:
            if field == "status":
                try:
                    setattr(prop, field, ListingStatus(data[field]))
                except ValueError:
                    return jsonify(error="validation_error", message=f"Invalid status: {data[field]}"), 400
            else:
                setattr(prop, field, data[field])

    if "title" in data:
        prop.slug = _unique_slug(data["title"], exclude_id=prop.id)

    commit_or_rollback()
    cache_manager.invalidate_pattern("properties:*")

    return jsonify(message="Property updated.", property=prop.to_dict()), 200


# ---------------------------------------------------------------------------
# DELETE /api/v1/properties/<id>  – soft delete
# ---------------------------------------------------------------------------

@properties_bp.route("/<int:property_id>", methods=["DELETE"])
@jwt_required()
def delete_property(property_id):
    """Soft-delete a property (owner or admin only)."""
    prop = get_or_404(Property, property_id)
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)

    if prop.owner_id != user_id and user.role.value != "admin":
        return jsonify(error="forbidden", message="You cannot delete this property."), 403

    prop.soft_delete()
    prop.status = ListingStatus.WITHDRAWN
    commit_or_rollback()

    cache_manager.invalidate_pattern("properties:*")
    return jsonify(message="Property deleted."), 200


# ---------------------------------------------------------------------------
# POST /api/v1/properties/<id>/favorite
# DELETE /api/v1/properties/<id>/favorite
# ---------------------------------------------------------------------------

@properties_bp.route("/<int:property_id>/favorite", methods=["POST"])
@jwt_required()
def add_favorite(property_id):
    """Add a property to the current user's favorites."""
    user_id = get_jwt_identity()
    get_or_404(Property, property_id)

    existing = Favorite.query.filter_by(user_id=user_id, property_id=property_id).first()
    if existing:
        return jsonify(message="Already in favorites.", favorite=existing.to_dict()), 200

    fav = Favorite(user_id=user_id, property_id=property_id, notes=request.json.get("notes") if request.is_json else None)
    db.session.add(fav)

    # Increment property favorite counter
    prop = db.session.get(Property, property_id)
    if prop:
        prop.favorite_count = (prop.favorite_count or 0) + 1

    commit_or_rollback()
    return jsonify(message="Added to favorites.", favorite=fav.to_dict()), 201


@properties_bp.route("/<int:property_id>/favorite", methods=["DELETE"])
@jwt_required()
def remove_favorite(property_id):
    """Remove a property from the current user's favorites."""
    user_id = get_jwt_identity()
    fav = Favorite.query.filter_by(user_id=user_id, property_id=property_id).first()
    if not fav:
        return jsonify(error="not_found", message="Favorite not found."), 404

    db.session.delete(fav)

    prop = db.session.get(Property, property_id)
    if prop and prop.favorite_count > 0:
        prop.favorite_count -= 1

    commit_or_rollback()
    return jsonify(message="Removed from favorites."), 200


# ---------------------------------------------------------------------------
# GET /api/v1/properties/featured
# ---------------------------------------------------------------------------

@properties_bp.route("/featured", methods=["GET"])
def featured_properties():
    """Return featured properties (cached)."""
    cache_key = "properties:featured"
    cached = cache_manager.get(cache_key)
    if cached:
        return jsonify(cached), 200

    props = (
        Property.query
        .filter_by(is_featured=True, deleted_at=None)
        .filter(Property.status == ListingStatus.ACTIVE)
        .order_by(Property.created_at.desc())
        .limit(12)
        .all()
    )
    result = [p.to_dict(include_images=True) for p in props]
    cache_manager.set(cache_key, result, timeout=600)
    return jsonify(result), 200


# ---------------------------------------------------------------------------
# GET /api/v1/properties/similar/<id>
# ---------------------------------------------------------------------------

@properties_bp.route("/similar/<int:property_id>", methods=["GET"])
def similar_properties(property_id):
    """Return similar properties based on type, province, and price range."""
    prop = get_or_404(Property, property_id)
    price_range = float(prop.price) * 0.3

    similar = (
        Property.query
        .filter(
            Property.id != property_id,
            Property.property_type == prop.property_type,
            Property.province == prop.province,
            Property.price.between(float(prop.price) - price_range, float(prop.price) + price_range),
            Property.status == ListingStatus.ACTIVE,
            Property.deleted_at.is_(None),
        )
        .order_by(Property.is_featured.desc(), Property.view_count.desc())
        .limit(6)
        .all()
    )
    return jsonify([p.to_dict(include_images=True) for p in similar]), 200


# ---------------------------------------------------------------------------
# GET /api/v1/properties/stats
# ---------------------------------------------------------------------------

@properties_bp.route("/stats", methods=["GET"])
def property_stats():
    """Aggregate statistics about the property catalog (cached)."""
    cache_key = "properties:stats"
    cached = cache_manager.get(cache_key)
    if cached:
        return jsonify(cached), 200

    total = Property.query.filter(Property.deleted_at.is_(None)).count()
    active = Property.query.filter(
        Property.deleted_at.is_(None), Property.status == ListingStatus.ACTIVE
    ).count()

    avg_price = db.session.query(func.avg(Property.price)).filter(
        Property.deleted_at.is_(None), Property.status == ListingStatus.ACTIVE
    ).scalar()

    by_type = db.session.query(
        Property.property_type, func.count(Property.id)
    ).filter(Property.deleted_at.is_(None)).group_by(Property.property_type).all()

    by_province = db.session.query(
        Property.province, func.count(Property.id)
    ).filter(Property.deleted_at.is_(None)).group_by(Property.province).all()

    stats = {
        "total_properties": total,
        "active_listings": active,
        "average_price_usd": float(avg_price) if avg_price else 0,
        "by_type": {t.value: c for t, c in by_type},
        "by_province": {prov: c for prov, c in by_province},
    }
    cache_manager.set(cache_key, stats, timeout=3600)
    return jsonify(stats), 200


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _unique_slug(title: str, exclude_id: int = None) -> str:
    """Generate a unique slug; append a counter if the slug already exists."""
    base = slugify(title)
    slug = base
    counter = 1
    while True:
        q = Property.query.filter_by(slug=slug)
        if exclude_id:
            q = q.filter(Property.id != exclude_id)
        if not q.first():
            return slug
        slug = f"{base}-{counter}"
        counter += 1
