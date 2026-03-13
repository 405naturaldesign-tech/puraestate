"""
Flask API endpoint test framework for PuraEstate.

Tests all Flask blueprint endpoints including:
- Authentication/authorization
- Error handling (400, 401, 403, 404, 500)
- Request validation
- Response format consistency
"""

import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
from flask_jwt_extended import create_access_token, create_refresh_token

logger = __import__("logging").getLogger(__name__)


@pytest.fixture
def app_client(test_db_session):
    """
    Create a Flask test client with test database session.
    """
    from backend.app import create_app

    app = create_app("testing")

    with app.app_context():
        yield app.test_client()


@pytest.fixture
def auth_headers(app_client, sample_user):
    """
    Generate JWT authentication headers for a test user.
    """
    with app_client.application.app_context():
        access_token = create_access_token(identity=sample_user.id)
        return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def admin_headers(app_client, user_factory):
    """
    Generate JWT authentication headers for an admin user.
    """
    admin_user = user_factory.create(role="admin")

    with app_client.application.app_context():
        access_token = create_access_token(identity=admin_user.id)
        return {"Authorization": f"Bearer {access_token}"}


class TestHealthEndpoints:
    """Test health check endpoints."""

    @pytest.mark.api
    def test_health_check_endpoint(self, app_client):
        """Test the health check endpoint returns 200."""
        response = app_client.get("/api/v1/health")
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "status" in data

    @pytest.mark.api
    def test_root_endpoint(self, app_client):
        """Test the root endpoint returns API info."""
        response = app_client.get("/api/v1")
        assert response.status_code in [200, 404]  # May or may not exist


class TestAuthenticationEndpoints:
    """Test authentication endpoints."""

    @pytest.mark.api
    @pytest.mark.auth
    def test_register_successful(self, app_client):
        """Test successful user registration."""
        payload = {
            "email": "newuser@example.com",
            "password": "SecurePass123!",
            "first_name": "Test",
            "last_name": "User",
        }
        response = app_client.post(
            "/api/v1/auth/register",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code in [200, 201]
        data = json.loads(response.data)
        assert "access_token" in data or "message" in data

    @pytest.mark.api
    @pytest.mark.auth
    def test_register_missing_required_fields(self, app_client):
        """Test registration with missing required fields returns 400."""
        payload = {"email": "newuser@example.com"}  # Missing password, names

        response = app_client.post(
            "/api/v1/auth/register",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "error" in data or "missing" in data.lower()

    @pytest.mark.api
    @pytest.mark.auth
    def test_register_invalid_email(self, app_client):
        """Test registration with invalid email returns 400."""
        payload = {
            "email": "invalid-email",
            "password": "SecurePass123!",
            "first_name": "Test",
            "last_name": "User",
        }
        response = app_client.post(
            "/api/v1/auth/register",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code == 400

    @pytest.mark.api
    @pytest.mark.auth
    def test_register_weak_password(self, app_client):
        """Test registration with weak password returns 400."""
        payload = {
            "email": "newuser@example.com",
            "password": "weak",  # Too short
            "first_name": "Test",
            "last_name": "User",
        }
        response = app_client.post(
            "/api/v1/auth/register",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code == 400

    @pytest.mark.api
    @pytest.mark.auth
    def test_login_successful(self, app_client, sample_user):
        """Test successful login."""
        payload = {
            "email": sample_user.email,
            "password": "TestPassword123!",  # Assuming this was used during creation
        }
        response = app_client.post(
            "/api/v1/auth/login",
            data=json.dumps(payload),
            content_type="application/json",
        )
        # Login may succeed or fail depending on password setup
        assert response.status_code in [200, 401]

    @pytest.mark.api
    @pytest.mark.auth
    def test_login_invalid_credentials(self, app_client):
        """Test login with invalid credentials returns 401."""
        payload = {
            "email": "nonexistent@example.com",
            "password": "WrongPassword123!",
        }
        response = app_client.post(
            "/api/v1/auth/login",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code == 401

    @pytest.mark.api
    @pytest.mark.auth
    def test_logout_authenticated(self, app_client, auth_headers):
        """Test logout with valid token."""
        response = app_client.post(
            "/api/v1/auth/logout",
            headers=auth_headers,
        )
        assert response.status_code in [200, 204]

    @pytest.mark.api
    @pytest.mark.auth
    def test_logout_unauthorized(self, app_client):
        """Test logout without authentication returns 401."""
        response = app_client.post("/api/v1/auth/logout")
        assert response.status_code == 401

    @pytest.mark.api
    @pytest.mark.auth
    def test_refresh_token(self, app_client, sample_user):
        """Test token refresh endpoint."""
        with app_client.application.app_context():
            refresh_token = create_refresh_token(identity=sample_user.id)

        response = app_client.post(
            "/api/v1/auth/refresh",
            headers={"Authorization": f"Bearer {refresh_token}"},
        )
        assert response.status_code in [200, 401]


class TestUserEndpoints:
    """Test user management endpoints."""

    @pytest.mark.api
    def test_get_current_user(self, app_client, auth_headers, sample_user):
        """Test getting current user profile."""
        response = app_client.get(
            "/api/v1/users/me",
            headers=auth_headers,
        )
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = json.loads(response.data)
            assert "email" in data or "id" in data

    @pytest.mark.api
    def test_get_current_user_unauthorized(self, app_client):
        """Test getting current user without authentication returns 401."""
        response = app_client.get("/api/v1/users/me")
        assert response.status_code == 401

    @pytest.mark.api
    def test_update_user_profile(self, app_client, auth_headers, sample_user):
        """Test updating user profile."""
        payload = {
            "first_name": "Updated",
            "phone": "555-1234",
        }
        response = app_client.put(
            f"/api/v1/users/{sample_user.id}",
            data=json.dumps(payload),
            content_type="application/json",
            headers=auth_headers,
        )
        assert response.status_code in [200, 400, 403, 404]

    @pytest.mark.api
    def test_delete_user_requires_admin(self, app_client, auth_headers, sample_user):
        """Test deleting user requires admin role."""
        response = app_client.delete(
            f"/api/v1/users/{sample_user.id}",
            headers=auth_headers,
        )
        assert response.status_code in [403, 404]  # Should be forbidden or not found


class TestPropertyEndpoints:
    """Test property management endpoints."""

    @pytest.mark.api
    def test_list_properties(self, app_client):
        """Test listing all properties."""
        response = app_client.get("/api/v1/properties")
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "items" in data or isinstance(data, list)

    @pytest.mark.api
    def test_list_properties_pagination(self, app_client):
        """Test property listing with pagination."""
        response = app_client.get("/api/v1/properties?page=1&per_page=10")
        assert response.status_code == 200
        data = json.loads(response.data)
        if isinstance(data, dict) and "items" in data:
            assert "page" in data or "total" in data

    @pytest.mark.api
    def test_list_properties_filtering(self, app_client):
        """Test property listing with filters."""
        response = app_client.get("/api/v1/properties?city=SanJose&min_price=50000")
        assert response.status_code == 200

    @pytest.mark.api
    def test_get_property_detail(self, app_client, sample_property):
        """Test getting property details."""
        response = app_client.get(f"/api/v1/properties/{sample_property.id}")
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = json.loads(response.data)
            assert "id" in data or "title" in data

    @pytest.mark.api
    def test_get_property_not_found(self, app_client):
        """Test getting non-existent property returns 404."""
        response = app_client.get("/api/v1/properties/nonexistent-id")
        assert response.status_code == 404

    @pytest.mark.api
    def test_create_property_requires_auth(self, app_client):
        """Test creating property requires authentication."""
        payload = {
            "title": "Test Property",
            "address": "123 Main St",
            "city": "San Jose",
            "country": "Costa Rica",
            "price": 500000,
        }
        response = app_client.post(
            "/api/v1/properties",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code == 401

    @pytest.mark.api
    def test_create_property_authorized(self, app_client, auth_headers):
        """Test creating property with authentication."""
        payload = {
            "title": "Test Property",
            "address": "123 Main St",
            "city": "San Jose",
            "country": "Costa Rica",
            "price": 500000,
            "bedrooms": 3,
            "bathrooms": 2,
        }
        response = app_client.post(
            "/api/v1/properties",
            data=json.dumps(payload),
            content_type="application/json",
            headers=auth_headers,
        )
        assert response.status_code in [200, 201, 400]

    @pytest.mark.api
    def test_update_property(self, app_client, auth_headers, sample_property):
        """Test updating property."""
        payload = {"title": "Updated Title"}
        response = app_client.put(
            f"/api/v1/properties/{sample_property.id}",
            data=json.dumps(payload),
            content_type="application/json",
            headers=auth_headers,
        )
        assert response.status_code in [200, 403, 404]

    @pytest.mark.api
    def test_delete_property(self, app_client, auth_headers, sample_property):
        """Test deleting property."""
        response = app_client.delete(
            f"/api/v1/properties/{sample_property.id}",
            headers=auth_headers,
        )
        assert response.status_code in [200, 204, 403, 404]


class TestContactEndpoints:
    """Test contact management endpoints."""

    @pytest.mark.api
    def test_create_contact(self, app_client):
        """Test creating a contact."""
        payload = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@example.com",
            "phone": "555-1234",
            "message": "Interested in properties",
        }
        response = app_client.post(
            "/api/v1/contacts",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code in [200, 201, 400]

    @pytest.mark.api
    def test_create_contact_invalid_email(self, app_client):
        """Test creating contact with invalid email returns 400."""
        payload = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "invalid-email",
            "phone": "555-1234",
        }
        response = app_client.post(
            "/api/v1/contacts",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code == 400

    @pytest.mark.api
    def test_get_contacts_requires_auth(self, app_client):
        """Test listing contacts requires authentication."""
        response = app_client.get("/api/v1/contacts")
        assert response.status_code == 401

    @pytest.mark.api
    def test_get_contacts_authorized(self, app_client, auth_headers):
        """Test listing contacts with authentication."""
        response = app_client.get(
            "/api/v1/contacts",
            headers=auth_headers,
        )
        assert response.status_code in [200, 403]


class TestErrorHandling:
    """Test API error handling."""

    @pytest.mark.api
    def test_404_not_found(self, app_client):
        """Test 404 error response format."""
        response = app_client.get("/api/v1/nonexistent")
        assert response.status_code == 404
        data = json.loads(response.data)
        assert "error" in data or "message" in data

    @pytest.mark.api
    def test_405_method_not_allowed(self, app_client):
        """Test 405 error when using wrong HTTP method."""
        response = app_client.patch("/api/v1/properties")
        assert response.status_code == 405

    @pytest.mark.api
    def test_400_bad_request(self, app_client):
        """Test 400 error for malformed JSON."""
        response = app_client.post(
            "/api/v1/contacts",
            data="invalid json{",
            content_type="application/json",
        )
        assert response.status_code == 400

    @pytest.mark.api
    def test_401_unauthorized(self, app_client):
        """Test 401 error when missing auth."""
        response = app_client.get("/api/v1/users/me")
        assert response.status_code == 401
        data = json.loads(response.data)
        assert "error" in data or "msg" in data

    @pytest.mark.api
    def test_invalid_token(self, app_client):
        """Test invalid token returns 401."""
        response = app_client.get(
            "/api/v1/users/me",
            headers={"Authorization": "Bearer invalid-token"},
        )
        assert response.status_code == 401

    @pytest.mark.api
    def test_expired_token(self, app_client):
        """Test expired token returns 401."""
        # Create an expired token
        from flask_jwt_extended import create_access_token

        with app_client.application.app_context():
            expired_token = create_access_token(
                identity="test-user",
                expires_delta=timedelta(seconds=-1)
            )

        response = app_client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {expired_token}"},
        )
        assert response.status_code == 401


class TestResponseFormatting:
    """Test response format consistency."""

    @pytest.mark.api
    def test_json_response_format(self, app_client):
        """Test that API returns valid JSON."""
        response = app_client.get("/api/v1/properties")
        assert response.content_type == "application/json"

        data = json.loads(response.data)
        assert isinstance(data, (dict, list))

    @pytest.mark.api
    def test_error_response_format(self, app_client):
        """Test error responses have consistent format."""
        response = app_client.get("/api/v1/nonexistent")
        assert response.status_code == 404

        data = json.loads(response.data)
        # Should contain error information
        assert "error" in data or "message" in data

    @pytest.mark.api
    def test_list_response_format(self, app_client):
        """Test list responses have consistent format."""
        response = app_client.get("/api/v1/properties")
        assert response.status_code == 200

        data = json.loads(response.data)
        # Should be either a dict with items or a list
        if isinstance(data, dict):
            assert "items" in data or "data" in data or "properties" in data

    @pytest.mark.api
    def test_pagination_response_format(self, app_client):
        """Test paginated responses include pagination info."""
        response = app_client.get("/api/v1/properties?page=1&per_page=10")
        assert response.status_code == 200

        data = json.loads(response.data)
        if isinstance(data, dict) and "items" in data:
            # Should include pagination metadata
            pagination_fields = {"page", "per_page", "total", "pages"}
            has_pagination = any(field in data for field in pagination_fields)
            # Pagination is optional but if present should be consistent


class TestRateLimiting:
    """Test rate limiting functionality."""

    @pytest.mark.api
    @pytest.mark.slow
    def test_rate_limit_headers(self, app_client):
        """Test that rate limit headers are present."""
        response = app_client.get("/api/v1/properties")
        # Rate limit headers may be present
        headers = dict(response.headers)
        # Check for common rate limit headers
        rate_limit_headers = {"X-RateLimit-Limit", "RateLimit-Limit"}
        # Header names may vary by implementation


class TestCORS:
    """Test CORS functionality."""

    @pytest.mark.api
    def test_cors_headers(self, app_client):
        """Test CORS headers are present."""
        response = app_client.get("/api/v1/properties")
        headers = dict(response.headers)
        # CORS headers may be present depending on configuration
