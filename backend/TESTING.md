# Backend Testing Guide for PuraEstate

This guide explains how to run tests locally, write new tests, and understand the testing infrastructure for the PuraEstate backend.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Running Tests](#running-tests)
3. [Test Structure](#test-structure)
4. [Writing New Tests](#writing-new-tests)
5. [Mocking Guidelines](#mocking-guidelines)
6. [Database Testing](#database-testing)
7. [Coverage Targets](#coverage-targets)
8. [CI/CD Integration](#cicd-integration)

## Quick Start

### Prerequisites

- Python 3.10+
- PostgreSQL 13+ (for full testing) or SQLite (for basic testing)
- pip package manager

### Installation

```bash
# Install backend dependencies
pip install -r backend/requirements_backend.txt

# Optional: Install development dependencies
pip install pytest-watch pytest-html
```

### Running Tests Locally

```bash
# Run all tests
pytest tests/

# Run with coverage report
pytest tests/ --cov=backend --cov-report=html

# Run specific test file
pytest tests/api/test_endpoints.py

# Run specific test function
pytest tests/api/test_endpoints.py::TestAuthenticationEndpoints::test_login_successful

# Run tests matching a pattern
pytest tests/ -k "test_property"

# Run only fast tests (skip slow/integration tests)
pytest tests/ -m "not slow"

# Run with verbose output
pytest tests/ -v

# Run with detailed output on failures
pytest tests/ -vv
```

## Running Tests

### Pytest Configuration

Configuration is defined in `/backend/pytest.ini` and includes:

- **Test discovery**: Automatically finds test files matching `test_*.py` or `*_test.py`
- **Coverage thresholds**: Minimum 75% coverage required
- **Test markers**: Categorize tests (unit, integration, migration, api, auth, db, slow)
- **Output**: HTML coverage reports, terminal output with missing lines

### Test Markers

Mark tests with decorators to control test execution:

```python
@pytest.mark.slow
def test_performance():
    """This test will be skipped with 'pytest -m "not slow"'"""
    pass

@pytest.mark.integration
def test_with_external_service():
    """Integration tests with external dependencies"""
    pass

@pytest.mark.unit
def test_function_logic():
    """Fast, isolated unit tests"""
    pass

@pytest.mark.migration
def test_database_migration():
    """Database migration tests"""
    pass

@pytest.mark.api
def test_endpoint():
    """API endpoint tests"""
    pass

@pytest.mark.auth
def test_authentication():
    """Authentication tests"""
    pass

@pytest.mark.db
def test_database_operation():
    """Database operation tests"""
    pass
```

### Running Specific Test Categories

```bash
# Run only unit tests
pytest tests/ -m "unit"

# Run unit + integration tests
pytest tests/ -m "unit or integration"

# Skip slow tests
pytest tests/ -m "not slow"

# Run only migration tests
pytest tests/ -m "migration"

# Run only API tests
pytest tests/ -m "api"

# Run tests with verbose output
pytest tests/ -v

# Watch for file changes and re-run tests
pytest-watch tests/
```

## Test Structure

### Directory Layout

```
tests/
├── __init__.py
├── conftest.py                    # Pytest configuration and shared fixtures
├── fixtures/
│   ├── __init__.py
│   ├── database.py               # Database fixtures and helpers
│   ├── firebase.py               # Firebase mocks
│   ├── stripe.py                 # Stripe mocks
│   └── fixtures.py               # Test data factories
├── migrations/
│   ├── __init__.py
│   └── test_migrations.py         # Database migration tests
├── api/
│   ├── __init__.py
│   └── test_endpoints.py          # API endpoint tests
├── integration/                   # Integration tests
├── unit/                          # Unit tests
└── mocks/                         # Mock objects
```

### Test Files

#### Migration Tests (`tests/migrations/test_migrations.py`)

Tests database migrations for:
- Successful upgrade and downgrade
- Schema integrity verification
- Data preservation
- Foreign key and constraint validation
- Rollback safety

Example:
```python
@pytest.mark.migration
def test_migration_primary_keys(test_db_session):
    """Verify primary keys are correctly set after migration."""
    inspector = inspect(test_db_session.get_bind())
    tables = inspector.get_table_names()

    for table_name in ["user", "property", "listing"]:
        if table_name in tables:
            pk = inspector.get_pk_constraint(table_name)
            assert pk["constrained_columns"], \
                f"Table {table_name} has no primary key"
```

#### API Tests (`tests/api/test_endpoints.py`)

Tests Flask blueprint endpoints for:
- Authentication/authorization
- Request validation
- Error handling (400, 401, 403, 404, 500)
- Response format consistency

Example:
```python
@pytest.mark.api
@pytest.mark.auth
def test_login_successful(app_client, sample_user):
    """Test successful login."""
    payload = {
        "email": sample_user.email,
        "password": "TestPassword123!",
    }
    response = app_client.post(
        "/api/v1/auth/login",
        data=json.dumps(payload),
        content_type="application/json",
    )
    assert response.status_code in [200, 401]
```

## Writing New Tests

### Test File Template

```python
"""
Module docstring describing what is being tested.
"""

import pytest
from unittest.mock import Mock, patch
import json

logger = __import__("logging").getLogger(__name__)


class TestMyFeature:
    """Test suite for my feature."""

    @pytest.fixture
    def setup_data(self, sample_user, sample_property):
        """Setup test data."""
        return {
            "user": sample_user,
            "property": sample_property,
        }

    @pytest.mark.unit
    def test_feature_behavior(self, setup_data):
        """Test the expected behavior."""
        # Arrange
        user = setup_data["user"]

        # Act
        result = user.some_method()

        # Assert
        assert result == expected_value

    @pytest.mark.api
    def test_endpoint_returns_valid_json(self, app_client, auth_headers):
        """Test endpoint response format."""
        response = app_client.get(
            "/api/v1/endpoint",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert isinstance(data, dict)
```

### Best Practices

1. **Use descriptive names**: Test names should explain what is being tested
   ```python
   def test_user_creation_with_valid_email():  # Good
   def test_create():                          # Bad
   ```

2. **Follow AAA pattern**: Arrange, Act, Assert
   ```python
   def test_property_price_calculation():
       # Arrange
       property = PropertyFactory(price=100000)

       # Act
       discounted_price = property.calculate_discounted_price(0.1)

       # Assert
       assert discounted_price == 90000
   ```

3. **Use fixtures for setup**: Avoid repetitive code
   ```python
   # Good
   @pytest.fixture
   def sample_listing(listing_factory):
       return listing_factory.create()

   def test_listing(sample_listing):
       assert sample_listing.id is not None
   ```

4. **Isolate external dependencies**: Mock external services
   ```python
   # Good
   @patch("stripe.Charge.create")
   def test_payment_processing(mock_stripe):
       mock_stripe.return_value = Mock(id="charge_123")
       # ... test code
   ```

5. **Test both success and failure cases**
   ```python
   def test_login_success():
       # Test valid credentials

   def test_login_invalid_email():
       # Test invalid email format

   def test_login_weak_password():
       # Test weak password
   ```

## Mocking Guidelines

### Mocking External Services

Use the provided fixtures for common external services:

#### Firebase Mocking

```python
@pytest.mark.unit
def test_firebase_user_creation(firebase_user_factory):
    """Test Firebase user creation."""
    user = firebase_user_factory(
        uid="test-uid-12345",
        email="user@example.com",
    )
    assert user.email == "user@example.com"
```

#### Stripe Mocking

```python
@pytest.mark.unit
def test_payment_processing(stripe_charge_factory):
    """Test payment processing."""
    charge = stripe_charge_factory(amount=10000)
    assert charge.amount == 10000
    assert charge.status == "succeeded"
```

#### Redis Mocking

```python
@pytest.mark.unit
def test_cache_operations(monkeypatch):
    """Test cache operations."""
    from unittest.mock import MagicMock

    mock_redis = MagicMock()
    monkeypatch.setattr("redis.Redis", MagicMock(return_value=mock_redis))
    # ... test code
```

### Mocking HTTP Requests

```python
@pytest.mark.unit
@patch("requests.get")
def test_external_api_call(mock_get):
    """Test external API call."""
    mock_get.return_value = Mock(
        status_code=200,
        json=lambda: {"data": "value"}
    )

    # Your code that calls requests.get
    response = requests.get("https://api.example.com/data")
    assert response.json() == {"data": "value"}
```

## Database Testing

### Using Test Database Fixtures

```python
@pytest.mark.db
def test_user_creation(test_db_session, user_factory):
    """Test creating a user in the database."""
    user = user_factory.create(email="test@example.com")

    # Verify user was created
    assert user.email == "test@example.com"
    assert user.id is not None

    # Query the database
    found_user = test_db_session.query(User).filter_by(
        email="test@example.com"
    ).first()
    assert found_user is not None
```

### Snapshot Testing

```python
@pytest.mark.db
def test_data_preservation(test_db_session, snapshot_db_state):
    """Test that data is preserved after operations."""
    # Take snapshot before operation
    before = snapshot_db_state()

    # Perform operation
    # ...

    # Take snapshot after operation
    after = snapshot_db_state()

    # Verify data integrity
    assert before["user_count"] == after["user_count"]
```

### Transaction Tracking

```python
@pytest.mark.db
def test_transaction_rollback(test_db_session, db_transaction_tracker):
    """Test transaction handling."""
    # Track database transactions
    before = db_transaction_tracker.get_summary()

    # Perform operations
    # ...

    after = db_transaction_tracker.get_summary()

    # Verify transactions were handled correctly
    assert after["rollbacks"] >= before["rollbacks"]
```

### Schema Verification

```python
@pytest.mark.migration
def test_schema_after_migration(test_db_session):
    """Test schema integrity after migration."""
    from tests.fixtures.database import verify_schema_integrity

    results = verify_schema_integrity(test_db_session)

    assert len(results["tables_exist"]) > 0
    assert len(results["tables_missing"]) == 0
    assert results["constraints_valid"]
```

## Coverage Targets

### Current Coverage Goals

- **Minimum coverage**: 75% (enforced by pytest configuration)
- **Target coverage**: 85%+
- **Critical modules**: 90%+ coverage required

### Critical Modules for High Coverage

1. **Authentication** (`blueprints/auth.py`): 95%+
2. **Database models** (`models.py`): 90%+
3. **API endpoints** (`blueprints/*.py`): 85%+
4. **Database utilities** (`database.py`): 90%+

### Viewing Coverage Reports

```bash
# Generate HTML coverage report
pytest tests/ --cov=backend --cov-report=html

# Open coverage report in browser
open htmlcov/index.html
```

### Improving Coverage

1. **Identify gaps**: Look for red lines in coverage reports
2. **Add edge case tests**: Test error conditions and boundaries
3. **Test critical paths**: Focus on security, payments, authentication
4. **Mock external dependencies**: Test without external services

## CI/CD Integration

### GitHub Actions Workflow

The `.github/workflows/test.yml` file runs:

1. **Frontend tests** (Node.js 18.x, 20.x)
   - Jest unit tests
   - Coverage reporting
   - Slack notifications

2. **Backend tests** (Python 3.10, 3.11, 3.12)
   - Pytest unit tests
   - Migration tests
   - API endpoint tests
   - Coverage reporting

### Running Tests in CI

Tests are automatically run on:
- Push to `main`, `develop`, or `staging` branches
- Pull requests to these branches

### Test Requirements

Tests must:
- ✅ Run without external services (mocked)
- ✅ Complete in < 5 minutes
- ✅ Maintain 75%+ coverage
- ✅ Pass on Python 3.10, 3.11, and 3.12

### Viewing Test Results

1. **GitHub Actions**: View runs at https://github.com/[repo]/actions
2. **Coverage reports**: Download from Artifacts tab
3. **Slack notifications**: Sent to configured webhook

## Troubleshooting

### Common Issues

#### Tests fail with "No module named backend"

**Solution**: Ensure you're running pytest from the project root, or add backend to PYTHONPATH:
```bash
export PYTHONPATH="${PYTHONPATH}:$(pwd)/backend"
pytest tests/
```

#### Database connection errors

**Solution**: Set the test database URL:
```bash
export TEST_DATABASE_URL="postgresql://user:password@localhost:5432/test_db"
pytest tests/
```

#### Import errors in fixtures

**Solution**: Ensure fixtures are in the `tests/fixtures/` directory and imported in `conftest.py`

#### Flaky tests

**Solution**:
- Add `@pytest.mark.slow` if test is timing-dependent
- Use fixtures for reproducible test data
- Mock time-dependent operations:
```python
@patch('datetime.datetime')
def test_with_fixed_time(mock_datetime):
    mock_datetime.now.return_value = datetime(2024, 3, 12)
```

## Additional Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [Factory Boy Documentation](https://factoryboy.readthedocs.io/)
- [Flask Testing](https://flask.palletsprojects.com/en/latest/testing/)
- [SQLAlchemy Testing](https://docs.sqlalchemy.org/en/20/orm/session_basics.html#testing)
- [Alembic Migration Testing](https://alembic.sqlalchemy.org/en/latest/)

## Contributing Tests

When contributing new tests:

1. Follow the AAA (Arrange, Act, Assert) pattern
2. Use descriptive test names
3. Add appropriate markers (@pytest.mark.*)
4. Mock external dependencies
5. Aim for > 80% coverage of your code
6. Document complex test scenarios
7. Run tests locally before pushing:
   ```bash
   pytest tests/ -m "not slow" --cov=backend
   ```

## Support

For questions about testing infrastructure, contact the backend team or submit an issue on GitHub.
