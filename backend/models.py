"""
SQLAlchemy ORM models for the Costa Rica Real Estate SaaS Platform.
All tables, relationships, indexes, and constraints are defined here.
"""

from datetime import datetime
from decimal import Decimal
import enum

from database import db


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class PropertyType(enum.Enum):
    HOUSE = "house"
    APARTMENT = "apartment"
    CONDO = "condo"
    LAND = "land"
    COMMERCIAL = "commercial"
    VILLA = "villa"
    FARM = "farm"
    TOWNHOUSE = "townhouse"
    PENTHOUSE = "penthouse"
    OFFICE = "office"


class ListingStatus(enum.Enum):
    ACTIVE = "active"
    PENDING = "pending"
    SOLD = "sold"
    RENTED = "rented"
    WITHDRAWN = "withdrawn"
    EXPIRED = "expired"
    DRAFT = "draft"


class TransactionType(enum.Enum):
    SALE = "sale"
    RENTAL = "rental"
    LEASE = "lease"


class TransactionStatus(enum.Enum):
    INITIATED = "initiated"
    UNDER_CONTRACT = "under_contract"
    DUE_DILIGENCE = "due_diligence"
    CLOSING = "closing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FALLEN_THROUGH = "fallen_through"


class UserRole(enum.Enum):
    ADMIN = "admin"
    AGENT = "agent"
    BUYER = "buyer"
    SELLER = "seller"
    VIEWER = "viewer"


class AlertFrequency(enum.Enum):
    INSTANT = "instant"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class ImageCategory(enum.Enum):
    EXTERIOR = "exterior"
    INTERIOR = "interior"
    KITCHEN = "kitchen"
    BATHROOM = "bathroom"
    BEDROOM = "bedroom"
    LIVING_ROOM = "living_room"
    GARDEN = "garden"
    POOL = "pool"
    VIEW = "view"
    AERIAL = "aerial"
    FLOOR_PLAN = "floor_plan"
    OTHER = "other"


class ContactStatus(enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    NEGOTIATING = "negotiating"
    CLOSED = "closed"
    LOST = "lost"


# ---------------------------------------------------------------------------
# Association / Junction tables
# ---------------------------------------------------------------------------

property_amenities = db.Table(
    "property_amenities",
    db.Column(
        "property_id",
        db.Integer,
        db.ForeignKey("properties.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    db.Column(
        "amenity_id",
        db.Integer,
        db.ForeignKey("amenities.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

listing_agents = db.Table(
    "listing_agents",
    db.Column(
        "listing_id",
        db.Integer,
        db.ForeignKey("listings.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    db.Column(
        "agent_id",
        db.Integer,
        db.ForeignKey("agents.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


# ---------------------------------------------------------------------------
# Core models
# ---------------------------------------------------------------------------

class TimestampMixin:
    """Adds created_at and updated_at to any model."""

    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


class SoftDeleteMixin:
    """Adds soft-delete support (deleted_at timestamp)."""

    deleted_at = db.Column(db.DateTime(timezone=True), nullable=True)

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    def soft_delete(self):
        self.deleted_at = datetime.utcnow()


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class User(db.Model, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "users"
    __table_args__ = (
        db.Index("ix_users_email", "email"),
        db.Index("ix_users_role", "role"),
        db.Index("ix_users_created_at", "created_at"),
        db.UniqueConstraint("email", name="uq_users_email"),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(255), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(30), nullable=True)
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.VIEWER)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    is_verified = db.Column(db.Boolean, nullable=False, default=False)
    verification_token = db.Column(db.String(255), nullable=True)
    reset_token = db.Column(db.String(255), nullable=True)
    reset_token_expires = db.Column(db.DateTime(timezone=True), nullable=True)
    last_login_at = db.Column(db.DateTime(timezone=True), nullable=True)
    avatar_url = db.Column(db.String(500), nullable=True)
    preferred_language = db.Column(db.String(10), nullable=False, default="es")
    preferred_currency = db.Column(db.String(3), nullable=False, default="USD")
    notification_prefs = db.Column(db.JSON, nullable=True)

    # Relationships
    agent = db.relationship("Agent", back_populates="user", uselist=False, cascade="all, delete-orphan")
    favorites = db.relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    alerts = db.relationship("Alert", back_populates="user", cascade="all, delete-orphan")
    contacts = db.relationship("Contact", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User id={self.id} email={self.email} role={self.role}>"

    def to_dict(self, include_sensitive=False):
        data = {
            "id": self.id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": f"{self.first_name} {self.last_name}",
            "phone": self.phone,
            "role": self.role.value,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "avatar_url": self.avatar_url,
            "preferred_language": self.preferred_language,
            "preferred_currency": self.preferred_currency,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
        if include_sensitive:
            data["notification_prefs"] = self.notification_prefs
        return data


# ---------------------------------------------------------------------------
# Agent
# ---------------------------------------------------------------------------

class Agent(db.Model, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "agents"
    __table_args__ = (
        db.Index("ix_agents_license_number", "license_number"),
        db.Index("ix_agents_agency_id", "agency_id"),
        db.Index("ix_agents_user_id", "user_id"),
        db.UniqueConstraint("license_number", name="uq_agents_license_number"),
        db.UniqueConstraint("user_id", name="uq_agents_user_id"),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    agency_id = db.Column(db.Integer, db.ForeignKey("agencies.id", ondelete="SET NULL"), nullable=True)
    license_number = db.Column(db.String(50), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    specializations = db.Column(db.ARRAY(db.String), nullable=True)
    languages = db.Column(db.ARRAY(db.String), nullable=True, default=["es", "en"])
    years_experience = db.Column(db.Integer, nullable=True)
    rating = db.Column(db.Numeric(3, 2), nullable=True)
    review_count = db.Column(db.Integer, nullable=False, default=0)
    commission_rate = db.Column(db.Numeric(5, 4), nullable=True)
    social_links = db.Column(db.JSON, nullable=True)
    is_featured = db.Column(db.Boolean, nullable=False, default=False)
    total_sales = db.Column(db.Integer, nullable=False, default=0)
    total_rentals = db.Column(db.Integer, nullable=False, default=0)
    total_listings = db.Column(db.Integer, nullable=False, default=0)

    # Relationships
    user = db.relationship("User", back_populates="agent")
    agency = db.relationship("Agency", back_populates="agents")
    listings = db.relationship("Listing", secondary=listing_agents, back_populates="agents")
    contacts = db.relationship("Contact", back_populates="agent")
    transactions = db.relationship("Transaction", back_populates="agent")

    def __repr__(self):
        return f"<Agent id={self.id} license={self.license_number}>"

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "agency_id": self.agency_id,
            "license_number": self.license_number,
            "bio": self.bio,
            "specializations": self.specializations or [],
            "languages": self.languages or [],
            "years_experience": self.years_experience,
            "rating": float(self.rating) if self.rating else None,
            "review_count": self.review_count,
            "commission_rate": float(self.commission_rate) if self.commission_rate else None,
            "social_links": self.social_links or {},
            "is_featured": self.is_featured,
            "total_sales": self.total_sales,
            "total_rentals": self.total_rentals,
            "total_listings": self.total_listings,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


# ---------------------------------------------------------------------------
# Agency
# ---------------------------------------------------------------------------

class Agency(db.Model, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "agencies"
    __table_args__ = (
        db.Index("ix_agencies_name", "name"),
        db.UniqueConstraint("name", name="uq_agencies_name"),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    logo_url = db.Column(db.String(500), nullable=True)
    website = db.Column(db.String(500), nullable=True)
    email = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(30), nullable=True)
    address = db.Column(db.String(500), nullable=True)
    province = db.Column(db.String(100), nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    license_number = db.Column(db.String(50), nullable=True)
    social_links = db.Column(db.JSON, nullable=True)

    # Relationships
    agents = db.relationship("Agent", back_populates="agency")

    def __repr__(self):
        return f"<Agency id={self.id} name={self.name}>"

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "logo_url": self.logo_url,
            "website": self.website,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "province": self.province,
            "is_active": self.is_active,
            "license_number": self.license_number,
            "social_links": self.social_links or {},
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


# ---------------------------------------------------------------------------
# Property
# ---------------------------------------------------------------------------

class Property(db.Model, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "properties"
    __table_args__ = (
        db.Index("ix_properties_property_type", "property_type"),
        db.Index("ix_properties_province", "province"),
        db.Index("ix_properties_canton", "canton"),
        db.Index("ix_properties_price", "price"),
        db.Index("ix_properties_bedrooms", "bedrooms"),
        db.Index("ix_properties_bathrooms", "bathrooms"),
        db.Index("ix_properties_area_sqm", "area_sqm"),
        db.Index("ix_properties_created_at", "created_at"),
        db.Index("ix_properties_geo", "latitude", "longitude"),
        db.Index("ix_properties_status", "status"),
        db.CheckConstraint("price >= 0", name="ck_properties_price_positive"),
        db.CheckConstraint("area_sqm > 0", name="ck_properties_area_positive"),
        db.CheckConstraint(
            "bedrooms IS NULL OR bedrooms >= 0", name="ck_properties_bedrooms_nonneg"
        ),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(300), nullable=False)
    slug = db.Column(db.String(350), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    property_type = db.Column(db.Enum(PropertyType), nullable=False)
    status = db.Column(db.Enum(ListingStatus), nullable=False, default=ListingStatus.ACTIVE)

    # Location
    address = db.Column(db.String(500), nullable=True)
    province = db.Column(db.String(100), nullable=False)
    canton = db.Column(db.String(100), nullable=True)
    district = db.Column(db.String(100), nullable=True)
    neighborhood = db.Column(db.String(100), nullable=True)
    postal_code = db.Column(db.String(20), nullable=True)
    latitude = db.Column(db.Numeric(10, 7), nullable=True)
    longitude = db.Column(db.Numeric(10, 7), nullable=True)
    location_description = db.Column(db.Text, nullable=True)

    # Physical characteristics
    area_sqm = db.Column(db.Numeric(12, 2), nullable=False)
    lot_size_sqm = db.Column(db.Numeric(12, 2), nullable=True)
    construction_sqm = db.Column(db.Numeric(12, 2), nullable=True)
    bedrooms = db.Column(db.Integer, nullable=True)
    bathrooms = db.Column(db.Numeric(3, 1), nullable=True)
    half_bathrooms = db.Column(db.Integer, nullable=True)
    parking_spaces = db.Column(db.Integer, nullable=True)
    floors = db.Column(db.Integer, nullable=True)
    year_built = db.Column(db.Integer, nullable=True)

    # Pricing
    price = db.Column(db.Numeric(15, 2), nullable=False)
    price_currency = db.Column(db.String(3), nullable=False, default="USD")
    price_per_sqm = db.Column(db.Numeric(12, 2), nullable=True)
    monthly_hoa_fee = db.Column(db.Numeric(10, 2), nullable=True)
    monthly_rent = db.Column(db.Numeric(12, 2), nullable=True)

    # Features & metadata
    features = db.Column(db.JSON, nullable=True)
    tags = db.Column(db.ARRAY(db.String), nullable=True)
    is_featured = db.Column(db.Boolean, nullable=False, default=False)
    is_new_construction = db.Column(db.Boolean, nullable=False, default=False)
    has_ocean_view = db.Column(db.Boolean, nullable=False, default=False)
    has_pool = db.Column(db.Boolean, nullable=False, default=False)
    has_garage = db.Column(db.Boolean, nullable=False, default=False)
    furnished = db.Column(db.Boolean, nullable=True)
    pet_friendly = db.Column(db.Boolean, nullable=True)

    # SEO / marketing
    meta_title = db.Column(db.String(160), nullable=True)
    meta_description = db.Column(db.String(320), nullable=True)
    virtual_tour_url = db.Column(db.String(500), nullable=True)
    video_url = db.Column(db.String(500), nullable=True)

    # Stats
    view_count = db.Column(db.Integer, nullable=False, default=0)
    favorite_count = db.Column(db.Integer, nullable=False, default=0)
    inquiry_count = db.Column(db.Integer, nullable=False, default=0)

    # Ownership
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    listings = db.relationship("Listing", back_populates="property", cascade="all, delete-orphan")
    images = db.relationship(
        "PropertyImage", back_populates="property", cascade="all, delete-orphan",
        order_by="PropertyImage.sort_order"
    )
    amenities = db.relationship(
        "Amenity", secondary=property_amenities, back_populates="properties"
    )
    favorites = db.relationship("Favorite", back_populates="property", cascade="all, delete-orphan")
    contacts = db.relationship("Contact", back_populates="property", cascade="all, delete-orphan")
    transactions = db.relationship("Transaction", back_populates="property")
    owner = db.relationship("User", foreign_keys=[owner_id])

    def __repr__(self):
        return f"<Property id={self.id} slug={self.slug}>"

    def to_dict(self, include_images=True, include_amenities=True):
        data = {
            "id": self.id,
            "title": self.title,
            "slug": self.slug,
            "description": self.description,
            "property_type": self.property_type.value,
            "status": self.status.value,
            "address": self.address,
            "province": self.province,
            "canton": self.canton,
            "district": self.district,
            "neighborhood": self.neighborhood,
            "postal_code": self.postal_code,
            "latitude": float(self.latitude) if self.latitude else None,
            "longitude": float(self.longitude) if self.longitude else None,
            "location_description": self.location_description,
            "area_sqm": float(self.area_sqm),
            "lot_size_sqm": float(self.lot_size_sqm) if self.lot_size_sqm else None,
            "construction_sqm": float(self.construction_sqm) if self.construction_sqm else None,
            "bedrooms": self.bedrooms,
            "bathrooms": float(self.bathrooms) if self.bathrooms else None,
            "half_bathrooms": self.half_bathrooms,
            "parking_spaces": self.parking_spaces,
            "floors": self.floors,
            "year_built": self.year_built,
            "price": float(self.price),
            "price_currency": self.price_currency,
            "price_per_sqm": float(self.price_per_sqm) if self.price_per_sqm else None,
            "monthly_hoa_fee": float(self.monthly_hoa_fee) if self.monthly_hoa_fee else None,
            "monthly_rent": float(self.monthly_rent) if self.monthly_rent else None,
            "features": self.features or {},
            "tags": self.tags or [],
            "is_featured": self.is_featured,
            "is_new_construction": self.is_new_construction,
            "has_ocean_view": self.has_ocean_view,
            "has_pool": self.has_pool,
            "has_garage": self.has_garage,
            "furnished": self.furnished,
            "pet_friendly": self.pet_friendly,
            "meta_title": self.meta_title,
            "meta_description": self.meta_description,
            "virtual_tour_url": self.virtual_tour_url,
            "video_url": self.video_url,
            "view_count": self.view_count,
            "favorite_count": self.favorite_count,
            "inquiry_count": self.inquiry_count,
            "owner_id": self.owner_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
        if include_images:
            data["images"] = [img.to_dict() for img in self.images]
        if include_amenities:
            data["amenities"] = [a.to_dict() for a in self.amenities]
        return data


# ---------------------------------------------------------------------------
# PropertyImage
# ---------------------------------------------------------------------------

class PropertyImage(db.Model, TimestampMixin):
    __tablename__ = "property_images"
    __table_args__ = (
        db.Index("ix_property_images_property_id", "property_id"),
        db.Index("ix_property_images_sort_order", "property_id", "sort_order"),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    property_id = db.Column(
        db.Integer, db.ForeignKey("properties.id", ondelete="CASCADE"), nullable=False
    )
    url = db.Column(db.String(1000), nullable=False)
    thumbnail_url = db.Column(db.String(1000), nullable=True)
    caption = db.Column(db.String(300), nullable=True)
    alt_text = db.Column(db.String(300), nullable=True)
    category = db.Column(db.Enum(ImageCategory), nullable=False, default=ImageCategory.OTHER)
    sort_order = db.Column(db.Integer, nullable=False, default=0)
    is_primary = db.Column(db.Boolean, nullable=False, default=False)
    width = db.Column(db.Integer, nullable=True)
    height = db.Column(db.Integer, nullable=True)
    file_size_bytes = db.Column(db.Integer, nullable=True)
    mime_type = db.Column(db.String(50), nullable=True)

    # Relationships
    property = db.relationship("Property", back_populates="images")

    def __repr__(self):
        return f"<PropertyImage id={self.id} property_id={self.property_id}>"

    def to_dict(self):
        return {
            "id": self.id,
            "property_id": self.property_id,
            "url": self.url,
            "thumbnail_url": self.thumbnail_url,
            "caption": self.caption,
            "alt_text": self.alt_text,
            "category": self.category.value,
            "sort_order": self.sort_order,
            "is_primary": self.is_primary,
            "width": self.width,
            "height": self.height,
            "file_size_bytes": self.file_size_bytes,
            "mime_type": self.mime_type,
            "created_at": self.created_at.isoformat(),
        }


# ---------------------------------------------------------------------------
# Amenity
# ---------------------------------------------------------------------------

class Amenity(db.Model, TimestampMixin):
    __tablename__ = "amenities"
    __table_args__ = (
        db.UniqueConstraint("name", name="uq_amenities_name"),
        db.Index("ix_amenities_category", "category"),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100), nullable=True)
    icon = db.Column(db.String(100), nullable=True)
    description = db.Column(db.String(255), nullable=True)

    # Relationships
    properties = db.relationship(
        "Property", secondary=property_amenities, back_populates="amenities"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "icon": self.icon,
            "description": self.description,
        }


# ---------------------------------------------------------------------------
# Listing
# ---------------------------------------------------------------------------

class Listing(db.Model, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "listings"
    __table_args__ = (
        db.Index("ix_listings_property_id", "property_id"),
        db.Index("ix_listings_status", "status"),
        db.Index("ix_listings_transaction_type", "transaction_type"),
        db.Index("ix_listings_expires_at", "expires_at"),
        db.Index("ix_listings_listed_at", "listed_at"),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    property_id = db.Column(
        db.Integer, db.ForeignKey("properties.id", ondelete="CASCADE"), nullable=False
    )
    transaction_type = db.Column(db.Enum(TransactionType), nullable=False, default=TransactionType.SALE)
    status = db.Column(db.Enum(ListingStatus), nullable=False, default=ListingStatus.ACTIVE)
    listed_price = db.Column(db.Numeric(15, 2), nullable=False)
    price_currency = db.Column(db.String(3), nullable=False, default="USD")
    listed_at = db.Column(db.DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=True)
    sold_at = db.Column(db.DateTime(timezone=True), nullable=True)
    sold_price = db.Column(db.Numeric(15, 2), nullable=True)
    days_on_market = db.Column(db.Integer, nullable=True)
    mls_number = db.Column(db.String(50), nullable=True, unique=True)
    description_override = db.Column(db.Text, nullable=True)
    show_price = db.Column(db.Boolean, nullable=False, default=True)
    exclusive = db.Column(db.Boolean, nullable=False, default=False)
    open_house_dates = db.Column(db.JSON, nullable=True)
    notes = db.Column(db.Text, nullable=True)

    # Relationships
    property = db.relationship("Property", back_populates="listings")
    agents = db.relationship("Agent", secondary=listing_agents, back_populates="listings")
    transactions = db.relationship("Transaction", back_populates="listing")

    def __repr__(self):
        return f"<Listing id={self.id} property_id={self.property_id} status={self.status}>"

    def to_dict(self):
        return {
            "id": self.id,
            "property_id": self.property_id,
            "transaction_type": self.transaction_type.value,
            "status": self.status.value,
            "listed_price": float(self.listed_price),
            "price_currency": self.price_currency,
            "listed_at": self.listed_at.isoformat(),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "sold_at": self.sold_at.isoformat() if self.sold_at else None,
            "sold_price": float(self.sold_price) if self.sold_price else None,
            "days_on_market": self.days_on_market,
            "mls_number": self.mls_number,
            "description_override": self.description_override,
            "show_price": self.show_price,
            "exclusive": self.exclusive,
            "open_house_dates": self.open_house_dates or [],
            "notes": self.notes,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


# ---------------------------------------------------------------------------
# Transaction
# ---------------------------------------------------------------------------

class Transaction(db.Model, TimestampMixin):
    __tablename__ = "transactions"
    __table_args__ = (
        db.Index("ix_transactions_property_id", "property_id"),
        db.Index("ix_transactions_listing_id", "listing_id"),
        db.Index("ix_transactions_agent_id", "agent_id"),
        db.Index("ix_transactions_status", "status"),
        db.Index("ix_transactions_closed_at", "closed_at"),
        db.CheckConstraint("sale_price >= 0", name="ck_transactions_sale_price"),
        db.CheckConstraint(
            "commission_amount IS NULL OR commission_amount >= 0",
            name="ck_transactions_commission",
        ),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    property_id = db.Column(
        db.Integer, db.ForeignKey("properties.id", ondelete="RESTRICT"), nullable=False
    )
    listing_id = db.Column(
        db.Integer, db.ForeignKey("listings.id", ondelete="SET NULL"), nullable=True
    )
    agent_id = db.Column(
        db.Integer, db.ForeignKey("agents.id", ondelete="SET NULL"), nullable=True
    )
    buyer_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    seller_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    transaction_type = db.Column(db.Enum(TransactionType), nullable=False)
    status = db.Column(db.Enum(TransactionStatus), nullable=False, default=TransactionStatus.INITIATED)
    sale_price = db.Column(db.Numeric(15, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False, default="USD")
    earnest_money = db.Column(db.Numeric(15, 2), nullable=True)
    commission_rate = db.Column(db.Numeric(5, 4), nullable=True)
    commission_amount = db.Column(db.Numeric(15, 2), nullable=True)
    closing_costs = db.Column(db.Numeric(15, 2), nullable=True)
    contract_date = db.Column(db.DateTime(timezone=True), nullable=True)
    closing_date = db.Column(db.DateTime(timezone=True), nullable=True)
    closed_at = db.Column(db.DateTime(timezone=True), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    documents = db.Column(db.JSON, nullable=True)
    timeline = db.Column(db.JSON, nullable=True)

    # Relationships
    property = db.relationship("Property", back_populates="transactions")
    listing = db.relationship("Listing", back_populates="transactions")
    agent = db.relationship("Agent", back_populates="transactions")
    buyer = db.relationship("User", foreign_keys=[buyer_id])
    seller = db.relationship("User", foreign_keys=[seller_id])

    def __repr__(self):
        return f"<Transaction id={self.id} status={self.status}>"

    def to_dict(self):
        return {
            "id": self.id,
            "property_id": self.property_id,
            "listing_id": self.listing_id,
            "agent_id": self.agent_id,
            "buyer_id": self.buyer_id,
            "seller_id": self.seller_id,
            "transaction_type": self.transaction_type.value,
            "status": self.status.value,
            "sale_price": float(self.sale_price),
            "currency": self.currency,
            "earnest_money": float(self.earnest_money) if self.earnest_money else None,
            "commission_rate": float(self.commission_rate) if self.commission_rate else None,
            "commission_amount": float(self.commission_amount) if self.commission_amount else None,
            "closing_costs": float(self.closing_costs) if self.closing_costs else None,
            "contract_date": self.contract_date.isoformat() if self.contract_date else None,
            "closing_date": self.closing_date.isoformat() if self.closing_date else None,
            "closed_at": self.closed_at.isoformat() if self.closed_at else None,
            "notes": self.notes,
            "documents": self.documents or [],
            "timeline": self.timeline or [],
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


# ---------------------------------------------------------------------------
# Contact (Lead / Inquiry)
# ---------------------------------------------------------------------------

class Contact(db.Model, TimestampMixin):
    __tablename__ = "contacts"
    __table_args__ = (
        db.Index("ix_contacts_property_id", "property_id"),
        db.Index("ix_contacts_agent_id", "agent_id"),
        db.Index("ix_contacts_user_id", "user_id"),
        db.Index("ix_contacts_status", "status"),
        db.Index("ix_contacts_created_at", "created_at"),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    property_id = db.Column(
        db.Integer, db.ForeignKey("properties.id", ondelete="SET NULL"), nullable=True
    )
    agent_id = db.Column(
        db.Integer, db.ForeignKey("agents.id", ondelete="SET NULL"), nullable=True
    )
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    # Guest contact info (when not authenticated)
    guest_name = db.Column(db.String(200), nullable=True)
    guest_email = db.Column(db.String(255), nullable=True)
    guest_phone = db.Column(db.String(30), nullable=True)

    subject = db.Column(db.String(300), nullable=True)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.Enum(ContactStatus), nullable=False, default=ContactStatus.NEW)
    source = db.Column(db.String(100), nullable=True)
    preferred_contact_method = db.Column(db.String(50), nullable=True)
    preferred_contact_time = db.Column(db.String(100), nullable=True)
    budget_min = db.Column(db.Numeric(15, 2), nullable=True)
    budget_max = db.Column(db.Numeric(15, 2), nullable=True)
    timeline = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    replied_at = db.Column(db.DateTime(timezone=True), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(500), nullable=True)

    # Relationships
    property = db.relationship("Property", back_populates="contacts")
    agent = db.relationship("Agent", back_populates="contacts")
    user = db.relationship("User", back_populates="contacts")

    def __repr__(self):
        return f"<Contact id={self.id} status={self.status}>"

    def to_dict(self):
        return {
            "id": self.id,
            "property_id": self.property_id,
            "agent_id": self.agent_id,
            "user_id": self.user_id,
            "guest_name": self.guest_name,
            "guest_email": self.guest_email,
            "guest_phone": self.guest_phone,
            "subject": self.subject,
            "message": self.message,
            "status": self.status.value,
            "source": self.source,
            "preferred_contact_method": self.preferred_contact_method,
            "preferred_contact_time": self.preferred_contact_time,
            "budget_min": float(self.budget_min) if self.budget_min else None,
            "budget_max": float(self.budget_max) if self.budget_max else None,
            "timeline": self.timeline,
            "notes": self.notes,
            "replied_at": self.replied_at.isoformat() if self.replied_at else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


# ---------------------------------------------------------------------------
# Favorite
# ---------------------------------------------------------------------------

class Favorite(db.Model, TimestampMixin):
    __tablename__ = "favorites"
    __table_args__ = (
        db.UniqueConstraint("user_id", "property_id", name="uq_favorites_user_property"),
        db.Index("ix_favorites_user_id", "user_id"),
        db.Index("ix_favorites_property_id", "property_id"),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    property_id = db.Column(
        db.Integer, db.ForeignKey("properties.id", ondelete="CASCADE"), nullable=False
    )
    notes = db.Column(db.Text, nullable=True)

    # Relationships
    user = db.relationship("User", back_populates="favorites")
    property = db.relationship("Property", back_populates="favorites")

    def __repr__(self):
        return f"<Favorite user={self.user_id} property={self.property_id}>"

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "property_id": self.property_id,
            "notes": self.notes,
            "created_at": self.created_at.isoformat(),
        }


# ---------------------------------------------------------------------------
# Alert (Saved Search)
# ---------------------------------------------------------------------------

class Alert(db.Model, TimestampMixin):
    __tablename__ = "alerts"
    __table_args__ = (
        db.Index("ix_alerts_user_id", "user_id"),
        db.Index("ix_alerts_is_active", "is_active"),
        db.Index("ix_alerts_next_run_at", "next_run_at"),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name = db.Column(db.String(200), nullable=False)
    search_criteria = db.Column(db.JSON, nullable=False)
    frequency = db.Column(db.Enum(AlertFrequency), nullable=False, default=AlertFrequency.DAILY)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    email_notifications = db.Column(db.Boolean, nullable=False, default=True)
    push_notifications = db.Column(db.Boolean, nullable=False, default=False)
    last_run_at = db.Column(db.DateTime(timezone=True), nullable=True)
    next_run_at = db.Column(db.DateTime(timezone=True), nullable=True)
    match_count = db.Column(db.Integer, nullable=False, default=0)
    total_sent = db.Column(db.Integer, nullable=False, default=0)

    # Relationships
    user = db.relationship("User", back_populates="alerts")

    def __repr__(self):
        return f"<Alert id={self.id} user={self.user_id} frequency={self.frequency}>"

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "search_criteria": self.search_criteria,
            "frequency": self.frequency.value,
            "is_active": self.is_active,
            "email_notifications": self.email_notifications,
            "push_notifications": self.push_notifications,
            "last_run_at": self.last_run_at.isoformat() if self.last_run_at else None,
            "next_run_at": self.next_run_at.isoformat() if self.next_run_at else None,
            "match_count": self.match_count,
            "total_sent": self.total_sent,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


# ---------------------------------------------------------------------------
# AuditLog
# ---------------------------------------------------------------------------

class AuditLog(db.Model):
    __tablename__ = "audit_logs"
    __table_args__ = (
        db.Index("ix_audit_logs_user_id", "user_id"),
        db.Index("ix_audit_logs_entity", "entity_type", "entity_id"),
        db.Index("ix_audit_logs_action", "action"),
        db.Index("ix_audit_logs_created_at", "created_at"),
    )

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    entity_type = db.Column(db.String(100), nullable=False)
    entity_id = db.Column(db.Integer, nullable=True)
    action = db.Column(db.String(100), nullable=False)
    old_values = db.Column(db.JSON, nullable=True)
    new_values = db.Column(db.JSON, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(500), nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    def __repr__(self):
        return f"<AuditLog id={self.id} action={self.action} entity={self.entity_type}:{self.entity_id}>"

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "action": self.action,
            "old_values": self.old_values,
            "new_values": self.new_values,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat(),
        }
