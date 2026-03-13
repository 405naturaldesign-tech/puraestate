"""
Firebase mock setup for testing.

Provides fixtures for mocking Firebase Authentication and Firestore operations
without requiring actual Firebase credentials or network calls.
"""

import pytest
from unittest.mock import Mock, MagicMock, patch
import json


@pytest.fixture
def mock_firebase_auth():
    """
    Mock Firebase Authentication client.
    Provides methods for simulating user authentication operations.
    """
    mock_auth = MagicMock()

    # Mock user creation
    mock_auth.create_user = MagicMock(return_value=Mock(
        uid="test-firebase-uid-12345",
        email="test@example.com",
        display_name="Test User",
    ))

    # Mock user retrieval
    mock_auth.get_user = MagicMock(return_value=Mock(
        uid="test-firebase-uid-12345",
        email="test@example.com",
        display_name="Test User",
        email_verified=True,
        disabled=False,
    ))

    # Mock user update
    mock_auth.update_user = MagicMock(return_value=Mock(
        uid="test-firebase-uid-12345",
        display_name="Updated User",
    ))

    # Mock user deletion
    mock_auth.delete_user = MagicMock(return_value=None)

    # Mock custom claims
    mock_auth.set_custom_user_claims = MagicMock(return_value=None)

    # Mock token verification
    mock_auth.verify_id_token = MagicMock(return_value={
        "uid": "test-firebase-uid-12345",
        "email": "test@example.com",
        "email_verified": True,
        "iat": 1234567890,
        "exp": 1234571490,
    })

    # Mock password reset
    mock_auth.generate_password_reset_link = MagicMock(
        return_value="https://firebase.link/reset?code=abc123"
    )

    return mock_auth


@pytest.fixture
def mock_firestore():
    """
    Mock Firestore client.
    Provides methods for simulating document and collection operations.
    """
    mock_db = MagicMock()

    # Mock collection reference
    mock_collection = MagicMock()

    # Mock document operations
    mock_doc = MagicMock()
    mock_doc.get = MagicMock(return_value=Mock(
        exists=True,
        to_dict=MagicMock(return_value={
            "name": "Test Document",
            "created_at": "2024-03-12",
        })
    ))
    mock_doc.set = MagicMock(return_value=Mock(
        write_results=[Mock(commit_time=MagicMock())]
    ))
    mock_doc.update = MagicMock(return_value=Mock(
        write_results=[Mock(commit_time=MagicMock())]
    ))
    mock_doc.delete = MagicMock(return_value=Mock(
        write_results=[Mock(commit_time=MagicMock())]
    ))

    # Mock collection operations
    mock_collection.document = MagicMock(return_value=mock_doc)
    mock_collection.add = MagicMock(return_value=(None, Mock(
        write_results=[Mock(commit_time=MagicMock())]
    )))

    # Mock stream operations
    mock_collection.stream = MagicMock(return_value=[
        Mock(to_dict=MagicMock(return_value={"id": "doc1", "data": "value1"})),
        Mock(to_dict=MagicMock(return_value={"id": "doc2", "data": "value2"})),
    ])

    mock_db.collection = MagicMock(return_value=mock_collection)
    mock_db.batch = MagicMock(return_value=MagicMock(
        set=MagicMock(),
        update=MagicMock(),
        delete=MagicMock(),
        commit=MagicMock(return_value=[MagicMock()]),
    ))

    return mock_db


@pytest.fixture
def firebase_auth_context(mock_firebase_auth):
    """
    Provide a context manager that patches Firebase Auth globally.
    Useful for tests that import Firebase Auth modules.
    """
    with patch("firebase_admin.auth", mock_firebase_auth):
        yield mock_firebase_auth


@pytest.fixture
def firebase_db_context(mock_firestore):
    """
    Provide a context manager that patches Firestore globally.
    Useful for tests that import Firestore modules.
    """
    with patch("firebase_admin.firestore.client", return_value=mock_firestore):
        yield mock_firestore


@pytest.fixture
def firebase_user_factory(mock_firebase_auth):
    """
    Factory fixture for creating mock Firebase users.
    """
    def create_user(
        uid="test-uid-12345",
        email="user@example.com",
        display_name="Test User",
        email_verified=True,
        custom_claims=None,
    ):
        user_mock = Mock()
        user_mock.uid = uid
        user_mock.email = email
        user_mock.display_name = display_name
        user_mock.email_verified = email_verified
        user_mock.custom_claims = custom_claims or {}

        # Update the auth mock to return this user
        mock_firebase_auth.get_user.return_value = user_mock

        return user_mock

    return create_user


@pytest.fixture
def firebase_document_factory(mock_firestore):
    """
    Factory fixture for creating mock Firestore documents.
    """
    def create_document(path: str, data: dict, doc_id: str = "doc123"):
        doc_snapshot = Mock()
        doc_snapshot.id = doc_id
        doc_snapshot.reference = Mock()
        doc_snapshot.reference.path = f"{path}/{doc_id}"
        doc_snapshot.to_dict = MagicMock(return_value=data)
        doc_snapshot.get = MagicMock(side_effect=lambda key: data.get(key))

        return doc_snapshot

    return create_document


@pytest.fixture
def firebase_error_scenarios():
    """
    Provide common Firebase error scenarios for testing error handling.
    """
    return {
        "auth_user_not_found": Exception("No user record found for the provided identifier."),
        "auth_invalid_email": Exception("The email address is badly formatted."),
        "auth_weak_password": Exception("The password must be at least 6 characters long."),
        "auth_email_already_exists": Exception("The email address is already in use by another account."),
        "firestore_permission_denied": Exception("Permission denied. Missing or insufficient permissions."),
        "firestore_not_found": Exception("The requested document was not found."),
        "firestore_unavailable": Exception("Cloud Firestore is currently unavailable."),
    }
