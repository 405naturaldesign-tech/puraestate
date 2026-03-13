"""
Common test data factories using factory-boy.

Provides factories and fixtures for generating test data that matches the PuraEstate models.
"""

import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from factory import Factory, Faker, LazyAttribute, SubFactory, post_generation
from faker import Faker as FakerLib

fake = FakerLib()


# ============================================================================
# Factories for Core Models
# ============================================================================

class UserFactory(Factory):
    """Factory for generating test User objects."""

    class Meta:
        model = "backend.models.User"
        sqlalchemy_session = None  # Set dynamically in fixtures

    id = Faker("uuid4")
    email = Faker("email")
    password_hash = Faker("sha256")
    first_name = Faker("first_name")
    last_name = Faker("last_name")
    phone = Faker("phone_number")
    profile_image_url = Faker("image_url")
    bio = Faker("text", max_nb_chars=200)
    role = "buyer"
    is_active = True
    email_verified = True
    created_at = Faker("date_time_this_year")
    updated_at = Faker("date_time_this_year")


class AgentFactory(Factory):
    """Factory for generating test Agent objects."""

    class Meta:
        model = "backend.models.Agent"
        sqlalchemy_session = None

    id = Faker("uuid4")
    user_id = SubFactory(UserFactory)
    license_number = Faker("bothify", text="?#?#?#?")
    agency = Faker("company")
    phone = Faker("phone_number")
    specializations = Faker("words", nb=3)
    languages = ["English", "Spanish"]
    bio = Faker("text", max_nb_chars=300)
    profile_image_url = Faker("image_url")
    is_verified = False
    is_active = True
    created_at = Faker("date_time_this_year")
    updated_at = Faker("date_time_this_year")


class PropertyFactory(Factory):
    """Factory for generating test Property objects."""

    class Meta:
        model = "backend.models.Property"
        sqlalchemy_session = None

    id = Faker("uuid4")
    title = Faker("sentence", nb_words=4)
    description = Faker("text", max_nb_chars=500)
    property_type = "house"
    status = "active"
    address = Faker("address")
    city = Faker("city")
    province = Faker("word")
    zipcode = Faker("postcode")
    country = "Costa Rica"
    latitude = Faker("latitude")
    longitude = Faker("longitude")
    price = Faker("random_int", min=50000, max=2000000)
    currency = "USD"
    bedrooms = Faker("random_int", min=1, max=10)
    bathrooms = Faker("random_int", min=1, max=8)
    square_feet = Faker("random_int", min=500, max=5000)
    lot_size = Faker("random_int", min=500, max=50000)
    year_built = Faker("random_int", min=1990, max=2024)
    features = Faker("words", nb=5)
    amenities = Faker("words", nb=5)
    owner_id = SubFactory(UserFactory)
    agent_id = SubFactory(AgentFactory)
    created_at = Faker("date_time_this_year")
    updated_at = Faker("date_time_this_year")


class ListingFactory(Factory):
    """Factory for generating test Listing objects."""

    class Meta:
        model = "backend.models.Listing"
        sqlalchemy_session = None

    id = Faker("uuid4")
    property_id = SubFactory(PropertyFactory)
    agent_id = SubFactory(AgentFactory)
    status = "active"
    list_price = Faker("random_int", min=50000, max=2000000)
    list_date = Faker("date_this_year")
    expiration_date = LazyAttribute(
        lambda x: (datetime.now() + timedelta(days=90)).date()
    )
    days_on_market = 0
    views = 0
    created_at = Faker("date_time_this_year")
    updated_at = Faker("date_time_this_year")


class ContactFactory(Factory):
    """Factory for generating test Contact objects."""

    class Meta:
        model = "backend.models.Contact"
        sqlalchemy_session = None

    id = Faker("uuid4")
    first_name = Faker("first_name")
    last_name = Faker("last_name")
    email = Faker("email")
    phone = Faker("phone_number")
    source = "website"
    status = "new"
    message = Faker("text", max_nb_chars=300)
    property_interested_in = None
    interested_in = Faker("words", nb=3)
    budget_min = Faker("random_int", min=50000, max=500000)
    budget_max = Faker("random_int", min=500001, max=2000000)
    agent_assigned = SubFactory(AgentFactory)
    created_at = Faker("date_time_this_year")
    updated_at = Faker("date_time_this_year")


class TransactionFactory(Factory):
    """Factory for generating test Transaction objects."""

    class Meta:
        model = "backend.models.Transaction"
        sqlalchemy_session = None

    id = Faker("uuid4")
    property_id = SubFactory(PropertyFactory)
    buyer_id = SubFactory(UserFactory)
    seller_id = SubFactory(UserFactory)
    agent_id = SubFactory(AgentFactory)
    transaction_type = "sale"
    status = "initiated"
    contract_price = Faker("random_int", min=50000, max=2000000)
    closing_date = LazyAttribute(
        lambda x: (datetime.now() + timedelta(days=60)).date()
    )
    contingencies = Faker("words", nb=3)
    notes = Faker("text", max_nb_chars=300)
    created_at = Faker("date_time_this_year")
    updated_at = Faker("date_time_this_year")


class ImageFactory(Factory):
    """Factory for generating test Image objects."""

    class Meta:
        model = "backend.models.Image"
        sqlalchemy_session = None

    id = Faker("uuid4")
    property_id = SubFactory(PropertyFactory)
    url = Faker("image_url")
    category = "exterior"
    caption = Faker("sentence", nb_words=3)
    display_order = Faker("random_int", min=0, max=50)
    uploaded_by_id = SubFactory(UserFactory)
    created_at = Faker("date_time_this_year")


class AlertFactory(Factory):
    """Factory for generating test Alert objects."""

    class Meta:
        model = "backend.models.Alert"
        sqlalchemy_session = None

    id = Faker("uuid4")
    user_id = SubFactory(UserFactory)
    search_criteria = {
        "city": "San Jose",
        "property_type": "house",
        "min_price": 50000,
        "max_price": 500000,
    }
    frequency = "daily"
    is_active = True
    created_at = Faker("date_time_this_year")
    updated_at = Faker("date_time_this_year")


class AmenityFactory(Factory):
    """Factory for generating test Amenity objects."""

    class Meta:
        model = "backend.models.Amenity"
        sqlalchemy_session = None

    id = Faker("uuid4")
    name = Faker("word")
    icon = "fas fa-star"
    category = "outdoor"
    created_at = Faker("date_time_this_year")


# ============================================================================
# Pytest Fixtures using Factories
# ============================================================================

@pytest.fixture
def user_factory(test_db_session):
    """Fixture providing a user factory bound to the test database session."""
    UserFactory._meta.sqlalchemy_session = test_db_session
    return UserFactory


@pytest.fixture
def agent_factory(test_db_session):
    """Fixture providing an agent factory bound to the test database session."""
    AgentFactory._meta.sqlalchemy_session = test_db_session
    return AgentFactory


@pytest.fixture
def property_factory(test_db_session):
    """Fixture providing a property factory bound to the test database session."""
    PropertyFactory._meta.sqlalchemy_session = test_db_session
    return PropertyFactory


@pytest.fixture
def listing_factory(test_db_session):
    """Fixture providing a listing factory bound to the test database session."""
    ListingFactory._meta.sqlalchemy_session = test_db_session
    return ListingFactory


@pytest.fixture
def contact_factory(test_db_session):
    """Fixture providing a contact factory bound to the test database session."""
    ContactFactory._meta.sqlalchemy_session = test_db_session
    return ContactFactory


@pytest.fixture
def transaction_factory(test_db_session):
    """Fixture providing a transaction factory bound to the test database session."""
    TransactionFactory._meta.sqlalchemy_session = test_db_session
    return TransactionFactory


@pytest.fixture
def image_factory(test_db_session):
    """Fixture providing an image factory bound to the test database session."""
    ImageFactory._meta.sqlalchemy_session = test_db_session
    return ImageFactory


@pytest.fixture
def alert_factory(test_db_session):
    """Fixture providing an alert factory bound to the test database session."""
    AlertFactory._meta.sqlalchemy_session = test_db_session
    return AlertFactory


@pytest.fixture
def amenity_factory(test_db_session):
    """Fixture providing an amenity factory bound to the test database session."""
    AmenityFactory._meta.sqlalchemy_session = test_db_session
    return AmenityFactory


# ============================================================================
# Convenient combination fixtures
# ============================================================================

@pytest.fixture
def sample_user(user_factory):
    """Create a sample user in the test database."""
    return user_factory.create()


@pytest.fixture
def sample_agent(agent_factory):
    """Create a sample agent in the test database."""
    return agent_factory.create()


@pytest.fixture
def sample_property(property_factory, sample_agent):
    """Create a sample property in the test database."""
    return property_factory.create(agent_id=sample_agent.id)


@pytest.fixture
def sample_listing(listing_factory, sample_property, sample_agent):
    """Create a sample listing in the test database."""
    return listing_factory.create(property_id=sample_property.id, agent_id=sample_agent.id)


@pytest.fixture
def sample_contact(contact_factory, sample_agent):
    """Create a sample contact in the test database."""
    return contact_factory.create(agent_assigned=sample_agent.id)


@pytest.fixture
def sample_transaction(transaction_factory, sample_property, sample_user, sample_agent):
    """Create a sample transaction in the test database."""
    return transaction_factory.create(
        property_id=sample_property.id,
        buyer_id=sample_user.id,
        agent_id=sample_agent.id,
    )


# ============================================================================
# Bulk data fixtures for performance testing
# ============================================================================

@pytest.fixture
def bulk_users(user_factory):
    """Create 100 sample users for bulk testing."""
    return user_factory.create_batch(100)


@pytest.fixture
def bulk_properties(property_factory, bulk_users):
    """Create 50 sample properties for bulk testing."""
    properties = []
    for i in range(50):
        properties.append(property_factory.create(owner_id=bulk_users[i % len(bulk_users)].id))
    return properties


@pytest.fixture
def bulk_contacts(contact_factory):
    """Create 100 sample contacts for bulk testing."""
    return contact_factory.create_batch(100)
