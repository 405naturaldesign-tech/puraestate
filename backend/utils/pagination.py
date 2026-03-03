"""
Pagination helpers – converts SQLAlchemy Pagination objects to JSON-ready dicts.
"""

from typing import Any, Callable, List, Optional


def paginated_response(
    pagination,
    serialiser: Optional[Callable] = None,
) -> dict:
    """
    Convert a Flask-SQLAlchemy Pagination object to a standardised dict.

    Args:
        pagination: SQLAlchemy Pagination object.
        serialiser: Optional callable to convert each item to a dict.
                    Defaults to calling .to_dict() on each item.

    Returns:
        dict with keys: items, total, page, per_page, pages, has_prev, has_next.
    """
    if serialiser is None:
        serialiser = lambda item: item.to_dict()  # noqa: E731

    return {
        "items": [serialiser(item) for item in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "per_page": pagination.per_page,
        "pages": pagination.pages,
        "has_prev": pagination.has_prev,
        "has_next": pagination.has_next,
        "prev_page": pagination.prev_num if pagination.has_prev else None,
        "next_page": pagination.next_num if pagination.has_next else None,
    }
