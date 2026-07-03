"""Shared mock helpers for integration tests.

Provides reusable factory functions for creating mock HTTP responses
and error conditions, eliminating repetitive MagicMock boilerplate
across integration test files.
"""

import json
from unittest.mock import MagicMock


def mock_success_response(data=None, status_code=200):
    """Create a MagicMock configured as a successful HTTP response.

    The returned mock has:
        - status_code set (default: 200)
        - raise_for_status as a no-op MagicMock
        - content as JSON-encoded bytes of *data*
        - json() returning *data*

    Args:
        data: Dict to encode as the response body and return from .json().
              If None, defaults to {}.
        status_code: HTTP status code (default: 200).

    Returns:
        MagicMock configured as a successful response.
    """
    if data is None:
        data = {}
    encoded = json.dumps(data).encode()
    mock_resp = MagicMock()
    mock_resp.status_code = status_code
    mock_resp.raise_for_status = MagicMock()
    mock_resp.content = encoded
    mock_resp.json.return_value = data
    return mock_resp


def mock_failure_response(exception_msg="Connection refused"):
    """Create an Exception suitable for use as a mock side_effect.

    Typical usage::

        mock_post.side_effect = mock_failure_response()

    Args:
        exception_msg: Message for the exception (default: "Connection refused").

    Returns:
        Exception instance.
    """
    return Exception(exception_msg)