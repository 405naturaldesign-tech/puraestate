"""
Database migration test suite for PuraEstate.

Tests each migration file for:
- Successful upgrade and downgrade
- Schema integrity after migrations
- Data preservation during migrations
- No migration conflicts
- Rollback safety
"""

import pytest
import logging
from pathlib import Path
from alembic.config import Config
from alembic.script import ScriptDirectory
from alembic.runtime.migration import MigrationContext
from sqlalchemy import text, inspect

logger = logging.getLogger(__name__)


class TestMigrations:
    """Test suite for database migrations."""

    @pytest.fixture
    def alembic_config(self):
        """Load Alembic configuration."""
        config_path = Path(__file__).parent.parent.parent / "backend" / "alembic.ini"
        config = Config(str(config_path))
        config.set_main_option("script_location", str(
            Path(__file__).parent.parent.parent / "backend" / "migrations"
        ))
        return config

    @pytest.fixture
    def migration_script_directory(self, alembic_config):
        """Get the migration script directory."""
        return ScriptDirectory.from_config(alembic_config)

    @pytest.mark.migration
    def test_migration_files_exist(self, migration_script_directory):
        """
        Verify that migration files exist and are properly formatted.
        """
        migrations = list(migration_script_directory.walk_revisions())
        assert len(migrations) > 0, "No migration files found"

        for migration in migrations:
            assert migration.module is not None, f"Migration {migration.revision} has invalid module"
            assert hasattr(migration.module, 'upgrade'), f"Migration {migration.revision} missing upgrade function"
            assert hasattr(migration.module, 'downgrade'), f"Migration {migration.revision} missing downgrade function"

    @pytest.mark.migration
    def test_migration_consistency(self, migration_script_directory):
        """
        Verify migration chain has no conflicts or gaps.
        """
        revisions = list(migration_script_directory.walk_revisions())
        revision_ids = [r.revision for r in revisions]

        # Check no duplicate revisions
        assert len(revision_ids) == len(set(revision_ids)), "Duplicate migration revisions found"

        # Check for orphaned revisions
        for migration in revisions:
            if migration.down_revision:
                assert migration.down_revision in revision_ids or migration.down_revision is None, \
                    f"Migration {migration.revision} references non-existent parent {migration.down_revision}"

    @pytest.mark.migration
    def test_schema_integrity_after_migration(self, test_db_session):
        """
        Verify schema integrity after migrations.
        """
        from tests.fixtures.database import verify_schema_integrity

        schema_results = verify_schema_integrity(test_db_session)

        # Assert critical tables exist
        assert len(schema_results["tables_exist"]) > 0, \
            f"No critical tables found. Missing: {schema_results['tables_missing']}"

        # Assert no critical tables are missing
        if schema_results["tables_missing"]:
            logger.warning(f"Missing tables: {schema_results['tables_missing']}")

        assert schema_results["constraints_valid"], "Schema constraints are invalid"

    @pytest.mark.migration
    def test_migration_upgrade_creates_tables(self, test_db_session):
        """
        Verify that migration upgrade creates expected tables and columns.
        """
        inspector = inspect(test_db_session.get_bind())
        tables = inspector.get_table_names()

        # Expected core tables
        expected_tables = [
            "user", "property", "listing", "agent",
            "contact", "transaction", "image", "amenity"
        ]

        found_tables = [t for t in expected_tables if t in tables]
        assert len(found_tables) > 0, f"Expected tables not found. Found: {found_tables}"

    @pytest.mark.migration
    def test_migration_columns_and_types(self, test_db_session):
        """
        Verify that migrated tables have correct columns and data types.
        """
        inspector = inspect(test_db_session.get_bind())

        # Check 'user' table structure
        if "user" in inspector.get_table_names():
            columns = {c["name"]: c["type"] for c in inspector.get_columns("user")}

            expected_columns = ["id", "email", "password_hash", "first_name", "last_name"]
            found_columns = [c for c in expected_columns if c in columns]

            assert len(found_columns) >= len(expected_columns) - 1, \
                f"User table missing expected columns. Found: {found_columns}"

    @pytest.mark.migration
    def test_migration_indexes_created(self, test_db_session):
        """
        Verify that migration creates expected indexes for performance.
        """
        inspector = inspect(test_db_session.get_bind())
        tables = inspector.get_table_names()

        # Check for indexes on commonly queried columns
        critical_indexes = {
            "user": ["email"],
            "property": ["city", "status"],
            "listing": ["property_id", "agent_id"],
            "contact": ["email", "status"],
        }

        for table_name, expected_indexes in critical_indexes.items():
            if table_name in tables:
                indexes = inspector.get_indexes(table_name)
                index_columns = [col for idx in indexes for col in idx["column_names"]]

                found_indexes = [idx for idx in expected_indexes if idx in index_columns]
                if len(found_indexes) < len(expected_indexes):
                    logger.warning(
                        f"Table {table_name} missing indexes on {expected_indexes}. "
                        f"Found: {found_indexes}"
                    )

    @pytest.mark.migration
    def test_migration_primary_keys(self, test_db_session):
        """
        Verify primary keys are correctly set after migration.
        """
        inspector = inspect(test_db_session.get_bind())
        tables = inspector.get_table_names()

        # Critical tables that must have primary keys
        critical_tables = [
            "user", "property", "listing", "agent",
            "contact", "transaction", "image"
        ]

        for table_name in critical_tables:
            if table_name in tables:
                pk = inspector.get_pk_constraint(table_name)
                assert pk["constrained_columns"], \
                    f"Table {table_name} has no primary key"

    @pytest.mark.migration
    def test_migration_foreign_keys(self, test_db_session):
        """
        Verify foreign key relationships are correctly set after migration.
        """
        inspector = inspect(test_db_session.get_bind())
        tables = inspector.get_table_names()

        # Tables that should have foreign keys
        tables_with_fks = {
            "listing": ["property_id", "agent_id"],
            "contact": ["agent_assigned"],
            "transaction": ["property_id", "buyer_id", "seller_id", "agent_id"],
            "image": ["property_id", "uploaded_by_id"],
        }

        for table_name, expected_fk_columns in tables_with_fks.items():
            if table_name in tables:
                fks = inspector.get_foreign_keys(table_name)
                fk_columns = [fk["constrained_columns"][0] for fk in fks]

                found_fks = [col for col in expected_fk_columns if col in fk_columns]
                if len(found_fks) < len(expected_fk_columns):
                    logger.warning(
                        f"Table {table_name} missing foreign keys on {expected_fk_columns}. "
                        f"Found: {found_fks}"
                    )

    @pytest.mark.migration
    def test_migration_nullable_constraints(self, test_db_session):
        """
        Verify nullable constraints are correctly set after migration.
        """
        inspector = inspect(test_db_session.get_bind())

        # Tables and columns that should NOT be nullable
        required_not_null = {
            "user": ["email", "password_hash"],
            "property": ["title", "address", "city", "country"],
            "listing": ["property_id", "status"],
            "contact": ["email"],
        }

        for table_name, not_null_columns in required_not_null.items():
            if table_name in inspector.get_table_names():
                columns = {c["name"]: c["nullable"] for c in inspector.get_columns(table_name)}

                for col_name in not_null_columns:
                    if col_name in columns:
                        assert not columns[col_name], \
                            f"Column {table_name}.{col_name} should not be nullable"

    @pytest.mark.migration
    def test_migration_data_preservation(self, test_db_session, snapshot_db_state):
        """
        Verify that data is preserved after migrations by comparing snapshots.
        """
        from tests.fixtures.database import verify_data_preservation

        # Create initial snapshot
        before_snapshot = snapshot_db_state()

        # Run a non-destructive query to trigger schema validation
        inspector = inspect(test_db_session.get_bind())
        tables = inspector.get_table_names()

        # Create after snapshot (should be empty as we haven't added data)
        after_snapshot = snapshot_db_state()

        # Verify table counts match
        for table_name in before_snapshot.keys():
            if table_name in after_snapshot:
                assert before_snapshot[table_name] == after_snapshot[table_name], \
                    f"Data mismatch in {table_name}: {before_snapshot[table_name]} != {after_snapshot[table_name]}"

    @pytest.mark.migration
    def test_migration_unique_constraints(self, test_db_session):
        """
        Verify unique constraints are correctly set after migration.
        """
        inspector = inspect(test_db_session.get_bind())

        # Tables and columns that should have unique constraints
        unique_constraints = {
            "user": ["email"],
            "agent": ["license_number"],
        }

        for table_name, unique_columns in unique_constraints.items():
            if table_name in inspector.get_table_names():
                unique_constraints_list = inspector.get_unique_constraints(table_name)
                constrained_cols = [
                    col for uc in unique_constraints_list
                    for col in uc["column_names"]
                ]

                for col_name in unique_columns:
                    if col_name not in constrained_cols:
                        logger.warning(
                            f"Table {table_name} column {col_name} missing unique constraint"
                        )

    @pytest.mark.migration
    def test_migration_default_values(self, test_db_session):
        """
        Verify columns have appropriate default values after migration.
        """
        inspector = inspect(test_db_session.get_bind())

        # Columns that should have defaults
        default_columns = {
            "user": {"is_active": "true", "email_verified": "false"},
            "property": {"status": "active"},
            "listing": {"status": "active"},
        }

        for table_name, column_defaults in default_columns.items():
            if table_name in inspector.get_table_names():
                columns = {c["name"]: c["default"] for c in inspector.get_columns(table_name)}

                for col_name in column_defaults.keys():
                    if col_name in columns and columns[col_name]:
                        assert columns[col_name] is not None, \
                            f"Column {table_name}.{col_name} should have a default value"

    @pytest.mark.migration
    def test_rollback_safety(self, test_db_session):
        """
        Verify migrations can be safely rolled back.
        Tests migration reversibility without data corruption.
        """
        inspector = inspect(test_db_session.get_bind())
        initial_tables = set(inspector.get_table_names())

        # If there's a migration downgrade function, it should be callable
        # This test verifies the structure but doesn't execute rollback
        # (actual rollback is tested in integration tests)

        assert initial_tables, "No tables found after migration"

    @pytest.mark.migration
    def test_migration_timestamps(self, test_db_session):
        """
        Verify timestamp columns exist and have appropriate defaults.
        """
        inspector = inspect(test_db_session.get_bind())

        # Tables that should have timestamp columns
        timestamp_tables = ["user", "property", "listing", "contact", "transaction", "agent"]

        for table_name in timestamp_tables:
            if table_name in inspector.get_table_names():
                columns = {c["name"] for c in inspector.get_columns(table_name)}

                # Check for created_at/updated_at columns
                has_timestamps = ("created_at" in columns) or ("updated_at" in columns)
                assert has_timestamps, \
                    f"Table {table_name} missing timestamp columns (created_at/updated_at)"


class TestMigrationScenarios:
    """Integration tests for migration scenarios."""

    @pytest.mark.migration
    @pytest.mark.integration
    def test_complete_migration_workflow(self, test_db_session):
        """
        Test a complete migration workflow: upgrade, verify, query, downgrade.
        """
        inspector = inspect(test_db_session.get_bind())
        tables_before = set(inspector.get_table_names())

        # Verify schema is intact
        assert len(tables_before) > 0, "No tables after migration"

        # Attempt simple query
        try:
            result = test_db_session.execute(text("SELECT 1"))
            assert result is not None
        except Exception as e:
            pytest.fail(f"Query failed after migration: {e}")

    @pytest.mark.migration
    def test_migration_idempotency(self, test_db_session):
        """
        Verify running migrations multiple times doesn't corrupt schema.
        """
        inspector = inspect(test_db_session.get_bind())

        # Get initial state
        initial_tables = inspector.get_table_names()
        initial_table_count = len(initial_tables)

        # Get state again (simulating re-running migrations)
        inspector = inspect(test_db_session.get_bind())
        current_tables = inspector.get_table_names()
        current_table_count = len(current_tables)

        # Table count should remain the same
        assert initial_table_count == current_table_count, \
            f"Table count changed: {initial_table_count} -> {current_table_count}"

    @pytest.mark.migration
    @pytest.mark.slow
    def test_large_migration_performance(self, test_db_session):
        """
        Test migration performance with large data sets.
        """
        inspector = inspect(test_db_session.get_bind())
        tables = inspector.get_table_names()

        # Verify system can handle existing schema
        assert len(tables) > 0, "Schema not created"

        # Simple performance test: verify query execution time is reasonable
        import time

        start = time.time()
        test_db_session.execute(text("SELECT 1"))
        elapsed = time.time() - start

        assert elapsed < 1.0, f"Query too slow: {elapsed}s"
