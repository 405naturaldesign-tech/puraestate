"""
Test fixtures for PuraEstate backend.

Imports all fixtures from submodules for convenient access.
"""

from tests.fixtures.database import (
    test_db_engine,
    test_db_schema,
    test_db_session,
    db_cleanup,
    db_transaction_tracker,
    snapshot_db_state,
    verify_schema_integrity,
    verify_data_preservation,
)

from tests.fixtures.firebase import (
    mock_firebase_auth,
    mock_firestore,
    firebase_auth_context,
    firebase_db_context,
    firebase_user_factory,
    firebase_document_factory,
    firebase_error_scenarios,
)

from tests.fixtures.stripe import (
    mock_stripe,
    stripe_context,
    stripe_charge_factory,
    stripe_customer_factory,
    stripe_payment_intent_factory,
    stripe_webhook_events,
    stripe_error_scenarios,
)

from tests.fixtures.fixtures import (
    UserFactory,
    AgentFactory,
    PropertyFactory,
    ListingFactory,
    ContactFactory,
    TransactionFactory,
    ImageFactory,
    AlertFactory,
    AmenityFactory,
    user_factory,
    agent_factory,
    property_factory,
    listing_factory,
    contact_factory,
    transaction_factory,
    image_factory,
    alert_factory,
    amenity_factory,
    sample_user,
    sample_agent,
    sample_property,
    sample_listing,
    sample_contact,
    sample_transaction,
    bulk_users,
    bulk_properties,
    bulk_contacts,
)

__all__ = [
    # Database fixtures
    "test_db_engine",
    "test_db_schema",
    "test_db_session",
    "db_cleanup",
    "db_transaction_tracker",
    "snapshot_db_state",
    "verify_schema_integrity",
    "verify_data_preservation",
    # Firebase fixtures
    "mock_firebase_auth",
    "mock_firestore",
    "firebase_auth_context",
    "firebase_db_context",
    "firebase_user_factory",
    "firebase_document_factory",
    "firebase_error_scenarios",
    # Stripe fixtures
    "mock_stripe",
    "stripe_context",
    "stripe_charge_factory",
    "stripe_customer_factory",
    "stripe_payment_intent_factory",
    "stripe_webhook_events",
    "stripe_error_scenarios",
    # Data factories
    "UserFactory",
    "AgentFactory",
    "PropertyFactory",
    "ListingFactory",
    "ContactFactory",
    "TransactionFactory",
    "ImageFactory",
    "AlertFactory",
    "AmenityFactory",
    "user_factory",
    "agent_factory",
    "property_factory",
    "listing_factory",
    "contact_factory",
    "transaction_factory",
    "image_factory",
    "alert_factory",
    "amenity_factory",
    "sample_user",
    "sample_agent",
    "sample_property",
    "sample_listing",
    "sample_contact",
    "sample_transaction",
    "bulk_users",
    "bulk_properties",
    "bulk_contacts",
]
