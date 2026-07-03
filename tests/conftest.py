"""
Pytest configuration and shared fixtures for PuraEstate backend tests.

This file is automatically loaded by pytest and makes all fixtures available
to all test modules.
"""

import os
import sys
import pytest
import logging
from pathlib import Path

# Add backend to path for imports
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

# Configure logging for tests
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

# Suppress verbose logging from third-party libraries during tests
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logging.getLogger("alembic").setLevel(logging.WARNING)


# ============================================================================
# Environment setup
# ============================================================================

def pytest_configure(config):
    """
    Configure pytest before test collection.
    Sets up environment variables and test configuration.
    """
    # Set test environment
    os.environ.setdefault("FLASK_ENV", "testing")
    os.environ.setdefault("ENVIRONMENT", "test")

    # Use in-memory SQLite for tests if PostgreSQL not available
    if not os.environ.get("TEST_DATABASE_URL"):
        os.environ["TEST_DATABASE_URL"] = "sqlite:///:memory:"

    # Add custom markers
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )
    config.addinivalue_line(
        "markers", "migration: marks tests as migration tests"
    )
    config.addinivalue_line(
        "markers", "api: marks tests as API endpoint tests"
    )
    config.addinivalue_line(
        "markers", "auth: marks tests as authentication tests"
    )
    config.addinivalue_line(
        "markers", "db: marks tests as database tests"
    )


# ============================================================================
# Import and re-export all fixtures
# ============================================================================

# Import fixtures from the fixtures module
# Note: some plugins may fail due to missing dependencies in CI-only testing
# That's OK — individual test suites should import their own fixtures
try:
    import importlib
    _available = []
    for _plugin in ("tests.fixtures.database", "tests.fixtures.firebase",
                    "tests.fixtures.stripe", "tests.fixtures.fixtures"):
        try:
            importlib.import_module(_plugin)
            _available.append(_plugin)
        except ImportError:
            pass
    pytest_plugins = _available
except ImportError:
    pytest_plugins = []


# ============================================================================
# Session-level fixtures
# ============================================================================

@pytest.fixture(scope="session")
def test_environment():
    """
    Provide test environment information.
    """
    return {
        "db_url": os.environ.get("TEST_DATABASE_URL", "sqlite:///:memory:"),
        "flask_env": os.environ.get("FLASK_ENV", "testing"),
        "debug": os.environ.get("DEBUG", "false").lower() == "true",
    }


# ============================================================================
# Autouse fixtures for test isolation
# ============================================================================

@pytest.fixture(autouse=True)
def reset_sqlalchemy_state(test_db_session):
    """
    Automatically reset SQLAlchemy state before each test for isolation.
    """
    yield
    # Cleanup after test
    test_db_session.expunge_all()


@pytest.fixture(autouse=True)
def isolate_test_redis(monkeypatch):
    """
    Isolate Redis usage in tests by mocking it.
    Prevents tests from interfering with actual Redis data.
    """
    from unittest.mock import MagicMock

    mock_redis = MagicMock()
    monkeypatch.setattr("redis.Redis", MagicMock(return_value=mock_redis))
    monkeypatch.setattr("redis.from_url", MagicMock(return_value=mock_redis))

    yield


# ============================================================================
# Test result reporting
# ============================================================================

def pytest_sessionfinish(session, exitstatus):
    """
    Called after all tests are finished.
    Can be used for cleanup or reporting.
    """
    # Generate test summary
    reporter = session.config.pluginmanager.get_plugin("terminalreporter")
    if reporter:
        reporter.write_sep("=", "Test Summary")


def pytest_collection_modifyitems(config, items):
    """
    Modify test collection to add default markers.
    """
    for item in items:
        # Add 'unit' marker to tests not marked as 'integration'
        if "integration" not in item.keywords and "migration" not in item.keywords:
            if "api" not in item.keywords:
                item.add_marker(pytest.mark.unit)


# ============================================================================
# Helper fixtures for common test patterns
# ============================================================================

@pytest.fixture
def assert_no_errors(app_client):
    """
    Fixture providing a helper to assert API responses have no errors.
    """
    def _assert(response, expected_status=None):
        """
        Assert that response has no errors.

        Args:
            response: Flask test response
            expected_status: Optional expected status code
        """
        import json

        if expected_status:
            assert response.status_code == expected_status, \
                f"Expected {expected_status}, got {response.status_code}"

        try:
            data = json.loads(response.data)
            assert "error" not in data or data.get("error") is None, \
                f"Response contains error: {data.get('error')}"
        except (json.JSONDecodeError, AttributeError):
            # Response may not be JSON, which is ok
            pass

        return response

    return _assert


@pytest.fixture
def assert_error(app_client):
    """
    Fixture providing a helper to assert API responses have errors.
    """
    def _assert(response, error_type=None, status_code=None):
        """
        Assert that response contains expected error.

        Args:
            response: Flask test response
            error_type: Optional expected error type/message
            status_code: Optional expected status code
        """
        import json

        if status_code:
            assert response.status_code == status_code, \
                f"Expected status {status_code}, got {response.status_code}"

        try:
            data = json.loads(response.data)
            assert "error" in data or "message" in data, \
                f"Response does not contain error information: {data}"

            if error_type:
                error_msg = data.get("error") or data.get("message", "")
                assert error_type.lower() in error_msg.lower(), \
                    f"Expected error type '{error_type}', got '{error_msg}'"
        except (json.JSONDecodeError, AttributeError):
            pytest.fail("Response is not valid JSON")

        return response

    return _assert


@pytest.fixture
def mock_external_service(monkeypatch):
    """
    Fixture for mocking external service calls.
    Prevents tests from making actual HTTP requests.
    """
    def _mock(module_path, service_name, return_value=None):
        """
        Mock an external service.

        Args:
            module_path: Module path to mock (e.g., 'requests.post')
            service_name: Service identifier for logging
            return_value: Value to return when service is called
        """
        from unittest.mock import MagicMock

        mock = MagicMock(return_value=return_value)
        monkeypatch.setattr(module_path, mock)

        return mock

    return _mock
