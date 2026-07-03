"""Pytest fixtures for integration tests (integrations package).

Provides reusable fixtures that eliminate repetitive mock boilerplate
(mock_resp with status_code, raise_for_status, content, json return_value)
across all integration test methods.
"""

import sys
from pathlib import Path

# Ensure the parent integrations directory is importable
integrations_path = str(Path(__file__).parent.parent)
if integrations_path not in sys.path:
    sys.path.insert(0, integrations_path)

# Add workspace root so tests.fixtures.mocks is importable in test files
workspace_root = str(Path(__file__).resolve().parent.parent.parent)
if workspace_root not in sys.path:
    sys.path.append(workspace_root)

import pytest
from unittest.mock import patch


# ============================================================================
# Auto-patching fixtures — replace @patch decorators
# ============================================================================


@pytest.fixture
def mock_post():
    """Auto-patch ``requests.Session.post`` and yield the mock.

    Replaces the ``@patch("requests.Session.post")`` decorator pattern.
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
    """Auto-patch ``requests.post`` (standalone, not Session.post) and yield the mock."""
    with patch("requests.post") as m:
        yield m


@pytest.fixture
def mock_boto3_client():
    """Auto-patch ``boto3.client`` and yield the mock."""
    with patch("boto3.client") as m:
        yield m
