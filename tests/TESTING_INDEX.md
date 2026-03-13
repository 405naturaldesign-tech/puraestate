# PuraEstate Backend Testing - Quick Index

## Test Files Overview

### Database Testing (`tests/fixtures/database.py`)
Database fixtures for PostgreSQL and SQLite testing.

**Fixtures**:
- `test_db_engine` - Database connection
- `test_db_session` - Transactional session with auto-rollback
- `db_transaction_tracker` - Track commits/rollbacks
- `snapshot_db_state()` - Snapshot database state
- `verify_schema_integrity()` - Validate table structure
- `verify_data_preservation()` - Check data after operations

**Example**:
```python
def test_user_creation(test_db_session, user_factory):
    user = user_factory.create(email="test@example.com")
    assert user.email == "test@example.com"
```

### Firebase Mocking (`tests/fixtures/firebase.py`)
Mocks for Firebase Authentication and Firestore.

**Fixtures**:
- `mock_firebase_auth` - Auth operations
- `mock_firestore` - Firestore documents
- `firebase_user_factory()` - Create mock users
- `firebase_error_scenarios` - Common errors

**Example**:
```python
def test_firebase_user(firebase_user_factory):
    user = firebase_user_factory(email="test@example.com")
    assert user.uid is not None
```

### Stripe Mocking (`tests/fixtures/stripe.py`)
Mocks for Stripe payment processing.

**Fixtures**:
- `mock_stripe` - Stripe API client
- `stripe_charge_factory()` - Create mock charges
- `stripe_webhook_events` - Webhook examples
- `stripe_error_scenarios` - Payment errors

**Example**:
```python
def test_payment(stripe_charge_factory):
    charge = stripe_charge_factory(amount=10000)
    assert charge.status == "succeeded"
```

### Test Data Factories (`tests/fixtures/fixtures.py`)
Factory-boy based factories for test data generation.

**Factories**:
- `UserFactory` - Test users
- `AgentFactory` - Test agents
- `PropertyFactory` - Test properties
- `ListingFactory` - Test listings
- `ContactFactory` - Test contacts
- `TransactionFactory` - Test transactions
- And more...

**Example**:
```python
def test_property(property_factory):
    prop = property_factory.create(city="San Jose")
    assert prop.city == "San Jose"
```

### Migration Tests (`tests/migrations/test_migrations.py`)
Test database migrations for schema integrity.

**Test Classes**:
- `TestMigrations` - Core migration validation
  - Schema integrity
  - Table/column creation
  - Constraints and keys
  - Data preservation
- `TestMigrationScenarios` - Integration scenarios
  - Complete workflows
  - Idempotency
  - Performance

**Example**:
```python
@pytest.mark.migration
def test_migration_primary_keys(test_db_session):
    inspector = inspect(test_db_session.get_bind())
    assert inspector.get_pk_constraint("user") is not None
```

### API Endpoint Tests (`tests/api/test_endpoints.py`)
Test Flask API endpoints for correctness and error handling.

**Test Classes**:
- `TestAuthenticationEndpoints` - Register, login, logout, refresh
- `TestUserEndpoints` - User profile operations
- `TestPropertyEndpoints` - Property CRUD
- `TestContactEndpoints` - Contact creation
- `TestErrorHandling` - 400/401/403/404 errors
- `TestResponseFormatting` - JSON consistency
- `TestRateLimiting` - Rate limits
- `TestCORS` - CORS headers

**Example**:
```python
@pytest.mark.api
@pytest.mark.auth
def test_login(app_client):
    response = app_client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "TestPass123!"
    })
    assert response.status_code in [200, 401]
```

---

## Quick Start

### Running Tests

```bash
# All tests
pytest tests/

# With coverage
pytest tests/ --cov=backend --cov-report=html

# Specific category
pytest tests/ -m "api"
pytest tests/ -m "migration"
pytest tests/ -m "auth"

# Without slow tests
pytest tests/ -m "not slow"

# Watch mode
pytest-watch tests/

# Verbose output
pytest tests/ -vv
```

### Test Markers

Use markers to run specific test categories:

```bash
@pytest.mark.unit        # Fast, isolated unit tests
@pytest.mark.integration # Tests with dependencies
@pytest.mark.migration   # Database migration tests
@pytest.mark.api         # API endpoint tests
@pytest.mark.auth        # Authentication tests
@pytest.mark.db          # Database operation tests
@pytest.mark.slow        # Slow/performance tests
```

---

## Configuration Files

### `pytest.ini`
Main pytest configuration:
- Test discovery patterns
- Coverage thresholds (75% minimum)
- Test markers
- Output formats

### `conftest.py`
Pytest setup and shared fixtures:
- Environment configuration
- Fixture imports
- Test isolation helpers
- Custom assertions

---

## Documentation

### `/home/thegoodideallc/puraestate/backend/TESTING.md`
Comprehensive testing guide:
- Quick start
- Running tests locally
- Writing new tests
- Mocking guidelines
- Database testing
- Coverage targets
- Troubleshooting

### `/home/thegoodideallc/puraestate/TESTING_SETUP.md`
Complete setup summary:
- Files created
- Test statistics
- Test execution flow
- Best practices
- Next steps

---

## Directory Structure

```
tests/
├── conftest.py                    # Pytest configuration
├── TESTING_INDEX.md               # This file
├── fixtures/
│   ├── database.py               # DB fixtures
│   ├── firebase.py               # Firebase mocks
│   ├── stripe.py                 # Stripe mocks
│   ├── fixtures.py               # Data factories
│   └── __init__.py
├── migrations/
│   ├── test_migrations.py        # Migration tests (15+ tests)
│   └── __init__.py
├── api/
│   ├── test_endpoints.py         # API tests (60+ tests)
│   └── __init__.py
├── integration/
│   └── test_integrations.py
├── unit/
├── mocks/
├── README.md                      # Tests overview
└── qa-checklist.md               # QA checklist
```

---

## Common Test Patterns

### Testing Database Operations

```python
@pytest.mark.db
def test_create_user(test_db_session, user_factory):
    """Create and verify a user."""
    user = user_factory.create(email="test@example.com")
    assert user.email == "test@example.com"
    assert user.id is not None
```

### Testing API Endpoints

```python
@pytest.mark.api
def test_get_properties(app_client):
    """Get all properties."""
    response = app_client.get("/api/v1/properties")
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, (dict, list))
```

### Testing with Authentication

```python
@pytest.mark.api
@pytest.mark.auth
def test_protected_endpoint(app_client, auth_headers, sample_user):
    """Access protected endpoint."""
    response = app_client.get(
        "/api/v1/users/me",
        headers=auth_headers
    )
    assert response.status_code == 200
```

### Testing Error Handling

```python
@pytest.mark.api
def test_invalid_login(app_client):
    """Login with invalid credentials."""
    response = app_client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401
```

### Testing with Mocks

```python
@pytest.mark.unit
def test_payment(stripe_charge_factory):
    """Process payment."""
    charge = stripe_charge_factory(amount=10000, status="succeeded")
    assert charge.amount == 10000
    assert charge.paid == True
```

---

## Test Coverage

### Current Test Count
- **Migration tests**: 15+
- **API endpoint tests**: 60+
- **Unit tests**: Various
- **Total**: 75+

### Coverage Targets
| Module | Target | Priority |
|--------|--------|----------|
| models.py | 90%+ | Critical |
| database.py | 90%+ | Critical |
| blueprints/auth.py | 90%+ | Critical |
| blueprints/users.py | 80%+ | High |
| blueprints/properties.py | 80%+ | High |
| config.py | 70%+ | Low |

### Overall Target
- **Minimum**: 75% (CI/CD enforced)
- **Target**: 85%+
- **Critical paths**: 90%+

---

## Using Fixtures

### Available Fixtures

**Database**:
```python
test_db_session         # Transactional DB session
test_db_engine          # Database engine
db_transaction_tracker  # Track transactions
snapshot_db_state()     # Snapshot state
```

**Test Data**:
```python
sample_user             # Single test user
sample_agent            # Single test agent
sample_property         # Single test property
sample_listing          # Single test listing
bulk_users              # 100 test users
bulk_properties         # 50 test properties
```

**Factories**:
```python
user_factory            # UserFactory
agent_factory           # AgentFactory
property_factory        # PropertyFactory
listing_factory         # ListingFactory
contact_factory         # ContactFactory
transaction_factory     # TransactionFactory
```

**Mocks**:
```python
mock_firebase_auth      # Firebase Auth mock
mock_firestore          # Firestore mock
mock_stripe             # Stripe API mock
firebase_user_factory   # Create mock users
stripe_charge_factory   # Create mock charges
```

**Helpers**:
```python
app_client              # Flask test client
auth_headers            # JWT auth headers
admin_headers           # Admin auth headers
assert_no_errors        # Assert response OK
assert_error            # Assert response error
mock_external_service   # Mock HTTP calls
```

---

## Writing New Tests

### Template

```python
"""
Test module docstring.
"""

import pytest
import json
from unittest.mock import Mock, patch

logger = __import__("logging").getLogger(__name__)


class TestMyFeature:
    """Test suite for my feature."""

    @pytest.fixture
    def setup(self, sample_user):
        """Setup test data."""
        return {"user": sample_user}

    @pytest.mark.unit
    def test_feature_behavior(self, setup):
        """Test the feature."""
        # Arrange
        user = setup["user"]

        # Act
        result = user.some_method()

        # Assert
        assert result == expected_value

    @pytest.mark.api
    def test_endpoint(self, app_client, auth_headers):
        """Test endpoint."""
        response = app_client.get("/api/v1/endpoint", headers=auth_headers)
        assert response.status_code == 200
```

### Best Practices

1. **Descriptive names**: `test_login_with_invalid_email()`
2. **AAA pattern**: Arrange, Act, Assert
3. **Use fixtures**: Reuse setup code
4. **Mock external**: No real API calls
5. **Test both paths**: Success and failure
6. **Add docstrings**: Explain what's tested
7. **Use markers**: Categorize tests

---

## Troubleshooting

### No tests found
```bash
# Check path
pytest tests/ --collect-only

# Run from project root
cd /home/thegoodideallc/puraestate
pytest tests/
```

### Database connection errors
```bash
# Use SQLite
export TEST_DATABASE_URL="sqlite:///:memory:"

# Or PostgreSQL
export TEST_DATABASE_URL="postgresql://user:pass@localhost/test_db"
```

### Import errors
```bash
# Add backend to path
export PYTHONPATH="${PYTHONPATH}:$(pwd)/backend"
```

### Slow tests
```bash
# Skip slow tests
pytest tests/ -m "not slow"

# Run specific test
pytest tests/api/test_endpoints.py::TestAuthenticationEndpoints::test_login_successful
```

---

## Continuous Integration

Tests run automatically on:
- Push to `main`, `develop`, `staging`
- Pull requests to these branches

**GitHub Actions Workflow**: `.github/workflows/test.yml`
- Frontend tests (Node.js)
- Backend tests (Python 3.10-3.12)
- Coverage reporting
- Slack notifications

View results: https://github.com/[repo]/actions

---

## Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [Factory Boy](https://factoryboy.readthedocs.io/)
- [Flask Testing](https://flask.palletsprojects.com/en/latest/testing/)
- [Backend TESTING.md](../backend/TESTING.md)
- [Setup Summary](../TESTING_SETUP.md)

---

**Last Updated**: March 12, 2026
**Status**: Complete and Ready
