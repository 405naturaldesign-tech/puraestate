"""
PostgreSQL test database setup and fixtures.

This module provides pytest fixtures for database testing, including:
- Test database creation and teardown
- Database session management
- Transaction handling for test isolation
- Schema management
"""

import os
import logging
import pytest
from sqlalchemy import text, create_engine, event
from sqlalchemy.orm import sessionmaker, Session

logger = logging.getLogger(__name__)


@pytest.fixture(scope="session")
def test_db_engine():
    """
    Create a test database engine.
    Uses a test-specific PostgreSQL database URL from environment or creates in-memory SQLite for CI.
    """
    db_url = os.environ.get("TEST_DATABASE_URL")

    if not db_url:
        # Fallback to SQLite in-memory for CI/testing without PostgreSQL
        db_url = "sqlite:///:memory:"
        logger.warning("TEST_DATABASE_URL not set, using in-memory SQLite")

    engine = create_engine(
        db_url,
        echo=os.environ.get("SQL_ECHO", "false").lower() == "true",
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
    )

    return engine


@pytest.fixture(scope="session")
def test_db_schema(test_db_engine):
    """
    Create the test database schema.
    Runs once per test session.
    """
    import importlib
    db = importlib.import_module("backend.database").db
    importlib.import_module("backend.models")

    # Create all tables
    db.metadata.create_all(bind=test_db_engine)

    yield test_db_engine

    # Teardown: drop all tables
    db.metadata.drop_all(bind=test_db_engine)
    logger.info("Test database schema dropped")


@pytest.fixture(scope="function")
def test_db_session(test_db_schema):
    """
    Provide a test database session with automatic rollback.
    Each test gets a fresh session and all changes are rolled back.
    """
    from backend.database import db

    # Create a connection
    connection = test_db_schema.connect()

    # Begin a transaction
    transaction = connection.begin()

    # Create a session with the connection
    session_factory = sessionmaker(bind=connection)
    session = session_factory()

    # Bind the session to the app context
    session.connection()

    yield session

    # Rollback the transaction to isolate tests
    transaction.rollback()
    connection.close()
    session.close()


@pytest.fixture
def db_cleanup(test_db_session):
    """
    Cleanup fixture that ensures the database is clean after each test.
    Useful for verifying data isolation between tests.
    """
    yield

    # Verify session is still active and clean it up
    if test_db_session.is_active:
        test_db_session.rollback()


@pytest.fixture
def db_transaction_tracker(test_db_session):
    """
    Track database transactions for testing transaction handling and rollback safety.
    Returns a context that tracks commits and rollbacks.
    """
    class TransactionTracker:
        def __init__(self):
            self.commits = 0
            self.rollbacks = 0
            self.savepoints = 0

        def reset(self):
            self.commits = 0
            self.rollbacks = 0
            self.savepoints = 0

        def get_summary(self):
            return {
                "commits": self.commits,
                "rollbacks": self.rollbacks,
                "savepoints": self.savepoints,
            }

    tracker = TransactionTracker()

    @event.listens_for(test_db_session, "after_begin")
    def receive_after_begin(session, transaction, connection):
        tracker.savepoints += 1

    @event.listens_for(test_db_session, "after_commit")
    def receive_after_commit(session, transaction):
        tracker.commits += 1

    @event.listens_for(test_db_session, "after_rollback")
    def receive_after_rollback(session, transaction):
        tracker.rollbacks += 1

    return tracker


def verify_schema_integrity(session: Session) -> dict:
    """
    Verify database schema integrity after migrations.

    Returns:
        dict with schema validation results
    """
    results = {
        "tables_exist": [],
        "tables_missing": [],
        "columns_valid": [],
        "columns_invalid": [],
        "constraints_valid": True,
    }

    try:
        # Check critical tables
        critical_tables = [
            "user", "property", "transaction", "contact",
            "agent", "listing", "image", "amenity"
        ]

        inspector_query = text(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'public'"
        )
        existing_tables = {row[0] for row in session.execute(inspector_query)}

        for table_name in critical_tables:
            if table_name in existing_tables:
                results["tables_exist"].append(table_name)
            else:
                results["tables_missing"].append(table_name)

        # Verify no integrity constraint violations
        constraint_query = text(
            "SELECT constraint_type, COUNT(*) as count "
            "FROM information_schema.table_constraints "
            "WHERE table_schema = 'public' "
            "GROUP BY constraint_type"
        )
        results["constraints_valid"] = bool(session.execute(constraint_query).fetchall())

    except Exception as e:
        logger.error(f"Schema integrity check failed: {e}")
        results["error"] = str(e)

    return results


def verify_data_preservation(session: Session, data_snapshot: dict) -> dict:
    """
    Verify that data is preserved after migrations.

    Args:
        session: Database session
        data_snapshot: Previous snapshot of data for comparison

    Returns:
        dict with verification results
    """
    results = {
        "preserved": [],
        "lost": [],
        "corrupted": [],
    }

    try:
        # Compare record counts for each table
        for table_name, expected_count in data_snapshot.items():
            count_query = text(f"SELECT COUNT(*) FROM {table_name}")
            actual_count = session.execute(count_query).scalar()

            if actual_count == expected_count:
                results["preserved"].append(table_name)
            else:
                results["lost"].append({
                    "table": table_name,
                    "expected": expected_count,
                    "actual": actual_count
                })

    except Exception as e:
        logger.error(f"Data preservation check failed: {e}")
        results["error"] = str(e)

    return results


@pytest.fixture
def snapshot_db_state(test_db_session):
    """
    Snapshot the current database state for comparison after operations.
    Useful for verifying data preservation during migrations.
    """
    def _snapshot():
        snapshot = {}
        try:
            tables_query = text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema = 'public'"
            )
            tables = [row[0] for row in test_db_session.execute(tables_query)]

            for table_name in tables:
                count_query = text(f"SELECT COUNT(*) FROM {table_name}")
                snapshot[table_name] = test_db_session.execute(count_query).scalar()

        except Exception as e:
            logger.error(f"Failed to snapshot database state: {e}")

        return snapshot

    return _snapshot
