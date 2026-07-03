"""Pytest fixtures for integration tests.

Provides reusable fixtures that eliminate repetitive mock boilerplate
(mock_resp with status_code, raise_for_status, content, json return_value)
across all integration test methods.
"""

import sys
from pathlib import Path

# Add workspace root so tests.fixtures.mocks is importable
workspace_root = str(Path(__file__).resolve().parent.parent.parent)
if workspace_root not in sys.path:
    sys.path.insert(0, workspace_root)

import pytest
from unittest.mock import patch


# ============================================================================
# Auto-patching fixtures — replace @patch decorators
# ============================================================================


@pytest.fixture
def mock_post():
    """Auto-patch ``requests.Session.post`` and yield the mock.

    Replaces the ``@patch("requests.Session.post")`` decorator pattern.
    Usage in a test method::

        def test_xxx(self, mock_post):
            mock_post.return_value = mock_success_response({"key": "val"})
    """
    with patch("requests.Session.post") as m:
        yield m


@pytest.fixture
def mock_get():
    """Auto-patch ``requests.Session.get`` and yield the mock."""
    with patch("requests.Session.get") as m:
        yield m


@pytest.fixture
def mock_requests_post():
    """Auto-patch ``requests.post`` (standalone, not Session.post) and yield the mock.

    Used by SlackBot tests which call ``requests.post`` directly.
    """
    with patch("requests.post") as m:
        yield m


@pytest.fixture
def mock_boto3_client():
    """Auto-patch ``boto3.client`` and yield the mock.

    Used by AWSS3Client tests.
    """
    with patch("boto3.client") as m:
        yield m