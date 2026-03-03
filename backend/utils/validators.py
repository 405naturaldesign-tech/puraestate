"""
Input validation helpers.
"""

import re
from typing import Optional


_EMAIL_RE = re.compile(r"^[a-zA-Z0-9_.+\-]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-.]+$")

# Costa Rica provinces for quick validation
COSTA_RICA_PROVINCES = {
    "San José", "Alajuela", "Cartago", "Heredia",
    "Guanacaste", "Puntarenas", "Limón",
}


def validate_email(email: str) -> bool:
    """Return True if *email* looks like a valid email address."""
    if not email or len(email) > 254:
        return False
    return bool(_EMAIL_RE.match(email))


def validate_password_strength(password: str) -> bool:
    """
    Return True if *password* meets minimum requirements:
      - At least 8 characters
      - At least one uppercase letter
      - At least one lowercase letter
      - At least one digit
    """
    if not password or len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    return True


def validate_coordinates(lat: Optional[float], lon: Optional[float]) -> bool:
    """Return True if latitude and longitude are within valid ranges."""
    if lat is None or lon is None:
        return False
    return -90 <= lat <= 90 and -180 <= lon <= 180


def validate_province(province: str) -> bool:
    """Return True if *province* is a recognised Costa Rican province."""
    return province in COSTA_RICA_PROVINCES


def validate_price(price) -> bool:
    """Return True if *price* is a non-negative number."""
    try:
        return float(price) >= 0
    except (TypeError, ValueError):
        return False


def validate_pagination_params(page, per_page, max_per_page: int = 100) -> tuple:
    """
    Normalise and validate pagination parameters.

    Returns:
        (page: int, per_page: int)
    """
    try:
        page = max(1, int(page))
    except (TypeError, ValueError):
        page = 1
    try:
        per_page = min(max(1, int(per_page)), max_per_page)
    except (TypeError, ValueError):
        per_page = 20
    return page, per_page


def sanitise_string(value: str, max_length: int = 1000) -> str:
    """Strip whitespace and truncate to *max_length*."""
    if not isinstance(value, str):
        return ""
    return value.strip()[:max_length]
