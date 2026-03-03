"""
URL slug generation utility.
Handles ASCII transliteration and common Spanish characters.
"""

import re
import unicodedata


def slugify(text: str, max_length: int = 200) -> str:
    """
    Convert *text* to a URL-safe slug.

    Steps:
      1. Normalise unicode (NFKD) to decompose accents.
      2. Encode to ASCII, ignoring un-mappable characters.
      3. Lowercase and replace non-alphanumeric characters with hyphens.
      4. Collapse multiple hyphens and strip leading/trailing hyphens.
      5. Truncate to *max_length*.

    Examples:
        slugify("Casa en San José")  -> "casa-en-san-jose"
        slugify("¡Hermosa Villa!")   -> "hermosa-villa"
    """
    if not text:
        return "untitled"

    # Step 1: Unicode normalisation (decomposes é → e + combining accent)
    normalised = unicodedata.normalize("NFKD", text)

    # Step 2: Encode to ASCII, drop combining marks
    ascii_bytes = normalised.encode("ascii", "ignore")
    ascii_str = ascii_bytes.decode("ascii")

    # Step 3: Lowercase; replace whitespace / non-word chars with hyphen
    lowered = ascii_str.lower()
    slugged = re.sub(r"[^a-z0-9]+", "-", lowered)

    # Step 4: Collapse hyphens and strip edges
    slugged = re.sub(r"-{2,}", "-", slugged).strip("-")

    # Step 5: Truncate
    return slugged[:max_length] or "untitled"
