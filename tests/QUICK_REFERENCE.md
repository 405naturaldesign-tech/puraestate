# Backend Testing - Quick Reference

## Commands

```bash
# Run all tests
pytest tests/

# Run with coverage
pytest tests/ --cov=backend --cov-report=html

# Run specific marker
pytest tests/ -m "api"         # API tests
pytest tests/ -m "migration"   # Migration tests
pytest tests/ -m "auth"        # Auth tests
pytest tests/ -m "unit"        # Unit tests

# Run excluding slow tests
pytest tests/ -m "not slow"

# Run specific file
pytest tests/api/test_endpoints.py

# Run specific test
pytest tests/api/test_endpoints.py::TestAuthenticationEndpoints::test_login_successful

# Run matching pattern
pytest tests/ -k "login"

# Watch for changes
pytest-watch tests/

# Generate HTML coverage report
pytest tests/ --cov=backend --cov-report=html:coverage/
open coverage/index.html

# Run with verbose output
pytest tests/ -vv

# Show print statements
pytest tests/ -s

# Stop on first failure
pytest tests/ -x

# Run last failed tests
pytest tests/ --lf

# Run failed tests first
pytest tests/ --ff
```

## Test Fixtures (Quick List)

### Database
```python
test_db_session        # Use in any test for DB access
user_factory          # Create test users
property_factory      # Create test properties
contact_factory       # Create test contacts
sample_user           # Pre-created test user
sample_property       # Pre-created test property
```

### API Testing
```python
app_client            # Flask test client
auth_headers          # JWT auth headers
admin_headers         # Admin auth headers
```

### Mocking
```python
mock_firebase_auth    # Firebase mock
mock_firestore        # Firestore mock
mock_stripe           # Stripe mock
stripe_charge_factory # Create mock charges
firebase_user_factory # Create mock Firebase users
```

### Helpers
```python
assert_no_errors      # Assert response success
assert_error          # Assert response error
mock_external_service # Mock HTTP calls
```

## Example Tests

### Simple Unit Test
```python
@pytest.mark.unit
def test_user_creation(user_factory):
    user = user_factory.create(email="test@example.com")
    assert user.email == "test@example.com"
```

### API Test
```python
@pytest.mark.api
def test_get_properties(app_client):
    response = app_client.get("/api/v1/properties")
    assert response.status_code == 200
```

### Authenticated API Test
```python
@pytest.mark.api
@pytest.mark.auth
def test_user_profile(app_client, auth_headers, sample_user):
    response = app_client.get("/api/v1/users/me", headers=auth_headers)
    assert response.status_code in [200, 401]
```

### Database Test
```python
@pytest.mark.db
def test_user_in_database(test_db_session, user_factory):
    user = user_factory.create(email="test@example.com")

    # Query database
    result = test_db_session.query(User).filter_by(
        email="test@example.com"
    ).first()
    assert result is not None
```

### Migration Test
```python
@pytest.mark.migration
def test_schema_integrity(test_db_session):
    from tests.fixtures.database import verify_schema_integrity

    results = verify_schema_integrity(test_db_session)
    assert len(results["tables_exist"]) > 0
```

### Error Handling Test
```python
@pytest.mark.api
def test_invalid_login(app_client):
    response = app_client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401
```

### Mocking Test
```python
@pytest.mark.unit
def test_payment_processing(stripe_charge_factory):
    charge = stripe_charge_factory(amount=10000)
    assert charge.status == "succeeded"
```

## Test Markers

```python
@pytest.mark.unit        # Fast, isolated tests
@pytest.mark.integration # Tests with dependencies
@pytest.mark.api         # API endpoint tests
@pytest.mark.auth        # Authentication tests
@pytest.mark.db          # Database tests
@pytest.mark.migration   # Migration tests
@pytest.mark.slow        # Slow/performance tests
```

## Environment Variables

```bash
# Database URL
export TEST_DATABASE_URL="postgresql://user:pass@localhost/test_db"

# Or use SQLite
export TEST_DATABASE_URL="sqlite:///:memory:"

# Flask environment
export FLASK_ENV="testing"

# Debug output
export SQL_ECHO="true"  # Log SQL queries
```

## Coverage

```bash
# Generate coverage report
pytest tests/ --cov=backend --cov-report=html

# View report
open htmlcov/index.html

# Coverage target: 75%+ (minimum)
# Check pytest.ini for thresholds
```

## File Locations

```
/home/thegoodideallc/puraestate/
├── pytest.ini                     # Pytest configuration
├── tests/
│   ├── conftest.py               # Pytest setup
│   ├── TESTING_INDEX.md           # Detailed index
│   ├── QUICK_REFERENCE.md         # This file
│   ├── fixtures/
│   │   ├── database.py           # DB fixtures
│   │   ├── firebase.py           # Firebase mocks
│   │   ├── stripe.py             # Stripe mocks
│   │   └── fixtures.py           # Data factories
│   ├── migrations/
│   │   └── test_migrations.py    # Migration tests
│   ├── api/
│   │   └── test_endpoints.py     # API tests
│   ├── integration/
│   └── unit/
└── backend/
    ├── TESTING.md                # Complete guide
    ├── app.py
    ├── models.py
    ├── database.py
    └── blueprints/
```

## Troubleshooting

**No tests found**
```bash
pytest tests/ --collect-only  # See what tests are found
```

**Database errors**
```bash
export TEST_DATABASE_URL="sqlite:///:memory:"  # Use SQLite
```

**Import errors**
```bash
export PYTHONPATH="${PYTHONPATH}:$(pwd)/backend"
pytest tests/
```

**Slow tests**
```bash
pytest tests/ -m "not slow"  # Skip slow tests
```

**One test at a time**
```bash
pytest tests/api/test_endpoints.py -x  # Stop on first failure
```

## Test Stats

- **Migration tests**: 15+
- **API endpoint tests**: 60+
- **Total test cases**: 75+
- **Code coverage**: 75%+ (minimum), 85%+ (target)
- **Python versions**: 3.10, 3.11, 3.12

## Key Files

| File | Purpose | Lines |
|------|---------|-------|
| pytest.ini | Config | 60 |
| conftest.py | Setup | 200 |
| test_migrations.py | Migration tests | 450 |
| test_endpoints.py | API tests | 550 |
| database.py | DB fixtures | 220 |
| firebase.py | Firebase mocks | 280 |
| stripe.py | Stripe mocks | 320 |
| fixtures.py | Data factories | 400 |

## Documentation

- `backend/TESTING.md` - Complete testing guide
- `TESTING_SETUP.md` - Setup summary
- `tests/TESTING_INDEX.md` - Detailed file index
- `tests/QUICK_REFERENCE.md` - This file

## Getting Started

1. **Read**: `backend/TESTING.md` for overview
2. **Install**: `pip install -r backend/requirements_backend.txt`
3. **Run**: `pytest tests/ --cov=backend`
4. **Check**: Coverage report in `htmlcov/index.html`
5. **Write**: New tests following the templates

## Common Tasks

### Add a test
```python
@pytest.mark.api
def test_new_feature(app_client, sample_user):
    """Test description."""
    response = app_client.get("/api/v1/endpoint")
    assert response.status_code == 200
```

### Run tests locally
```bash
pytest tests/ --cov=backend
```

### Check coverage
```bash
pytest tests/ --cov=backend --cov-report=html
open htmlcov/index.html
```

### Run in watch mode
```bash
pytest-watch tests/
```

### Run in CI
```bash
# Automatic on push/PR
# View at: https://github.com/[repo]/actions
```

---

**Last Updated**: March 12, 2026
**For detailed info**: See `backend/TESTING.md` and `TESTING_SETUP.md`
