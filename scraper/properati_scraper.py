"""
properati_scraper.py — Properati.com.cr property scraper.

Extracts listings from Properati's search result pages using requests + BeautifulSoup.
Targets properati.com.cr with the same HTML structure as all Properati/Mitula sites.

Key selectors (from reverse-engineering properati.com.ar):
  - Listing card: div.snippet[data-url]
  - Title: h2.title inside .information2__top
  - Price: span.price[data-test=snippet__price]
  - Location: span.location
  - Bedrooms: span.properties__bedrooms
  - Bathrooms: span.properties__bathrooms
  - Area: span.properties__area
  - Agency: span.agency__name
  - Published date: span.published-date
  - Link: data-url attribute on snippet div
  - Pagination: link[rel=next] href
  - Structured data: JSON-LD in <script type="application/ld+json">
"""

import json
import re
import time
import random
import logging
from datetime import datetime
from typing import Optional
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

BASE_URL = "https://www.properati.com.cr"

# Default search URLs — can be overridden via constructor
DEFAULT_URLS = [
    f"{BASE_URL}/s/comprar",       # For sale (all types)
    f"{BASE_URL}/s/comprar/casa",  # Houses for sale
    f"{BASE_URL}/s/comprar/terreno",  # Land for sale
]

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
]


class ProperatiScraper:
    """Scrapes property listings from Properati.com.cr."""

    def __init__(self, search_urls: Optional[list[str]] = None,
                 max_pages: int = 5, delay_range: tuple[float, float] = (2.0, 4.0),
                 timeout: int = 30):
        self.search_urls = search_urls or DEFAULT_URLS
        self.max_pages = max_pages
        self.delay_range = delay_range
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "es-CR,es;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        })

    def _rotate_ua(self):
        self.session.headers.update({
            "User-Agent": random.choice(USER_AGENTS),
        })

    def _random_delay(self):
        time.sleep(random.uniform(*self.delay_range))

    def fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch a page and return a BeautifulSoup object."""
        self._rotate_ua()
        try:
            resp = self.session.get(url, timeout=self.timeout)
            resp.raise_for_status()
            # Detect encoding from Content-Type or meta
            resp.encoding = resp.apparent_encoding or "utf-8"
            return BeautifulSoup(resp.text, "lxml")
        except requests.RequestException as e:
            logger.warning("Failed to fetch %s: %s", url, e)
            return None

    def extract_properties_from_listing(self, url: str) -> list[dict]:
        """Extract property listings from a search result page."""
        soup = self.fetch_page(url)
        if not soup:
            return []

        properties = []

        # Method 1: Parse JSON-LD structured data (most reliable)
        jsonld_props = self._parse_jsonld(soup)
        seen_urls = set()

        for prop in jsonld_props:
            seen_urls.add(prop["source_url"])
            properties.append(prop)

        # Method 2: Parse snippet HTML cards (for properties not in JSON-LD)
        snippet_props = self._parse_snippets(soup, seen_urls)
        properties.extend(snippet_props)

        logger.info("Extracted %d properties from %s", len(properties), url)
        return properties

    def _parse_jsonld(self, soup: BeautifulSoup) -> list[dict]:
        """Extract property data from JSON-LD structured data."""
        properties = []
        scripts = soup.find_all("script", type="application/ld+json")

        for script in scripts:
            try:
                data = json.loads(script.string)
                # Can be a list or a single object
                items = data if isinstance(data, list) else [data]
                for item in items:
                    if item.get("@type") in ("House", "Apartment", "Accommodation"):
                        prop = self._jsonld_to_property(item)
                        if prop:
                            properties.append(prop)
            except (json.JSONDecodeError, AttributeError, TypeError):
                continue

        return properties

    def _jsonld_to_property(self, item: dict) -> Optional[dict]:
        """Convert a JSON-LD item to our property dict format."""
        try:
            name = item.get("name", "")
            image = item.get("image", "")

            # Determine type
            schema_type = item.get("@type", "")
            if schema_type == "House":
                property_type = "house"
            elif schema_type == "Apartment":
                property_type = "apartment"
            else:
                property_type = "other"

            # Description
            description = item.get("description", "")

            # Bedrooms / Bathrooms
            bedrooms = item.get("numberOfBedrooms")
            bathrooms = item.get("numberOfBathroomsTotal")

            # Area
            floor_size = item.get("floorSize", {})
            total_area = None
            if isinstance(floor_size, dict):
                try:
                    total_area = float(floor_size.get("value", 0))
                except (ValueError, TypeError):
                    total_area = None

            # Address
            address_data = item.get("address", {})
            if isinstance(address_data, dict):
                street = address_data.get("streetAddress", "")
                locality = address_data.get("addressLocality", "")
                region = address_data.get("addressRegion", "")
                address = street or ""
                neighborhood = ""
                city = locality
                province = region
                country = address_data.get("addressCountry", {}).get("name", "Costa Rica") if isinstance(address_data.get("addressCountry"), dict) else "Costa Rica"
            else:
                address = ""
                neighborhood = ""
                city = ""
                province = ""
                country = "Costa Rica"

            # Geo coordinates
            geo = item.get("geo", {})
            lat = None
            lng = None
            if isinstance(geo, dict):
                try:
                    lat = float(geo.get("latitude", 0))
                    lng = float(geo.get("longitude", 0))
                except (ValueError, TypeError):
                    pass

            # Build source URL — JSON-LD doesn't always have it, so we construct a fallback
            source_url = ""

            return {
                "source_url": source_url,
                "source_name": "properati",
                "external_id": "",
                "listing_type": "comprar",
                "property_type": property_type,
                "title": name,
                "description": description,
                "price": None,
                "price_currency": "USD",
                "price_per_sqm": None,
                "address": address,
                "neighborhood": neighborhood,
                "city": city,
                "province": province,
                "country": country,
                "lat": lat,
                "lng": lng,
                "bedrooms": self._int_or_none(bedrooms),
                "bathrooms": self._int_or_none(bathrooms),
                "parking": None,
                "total_area_sqm": total_area,
                "built_area_sqm": None,
                "lot_area_sqm": None,
                "status": "active",
                "is_featured": 0,
                "is_verified": 0,
                "amenities": "",
                "features": "",
                "contact_name": "",
                "contact_phone": "",
                "contact_email": "",
                "agency_name": "",
                "published_date": "",
            }
        except Exception as e:
            logger.debug("Failed to parse JSON-LD item: %s", e)
            return None

    def _parse_snippets(self, soup: BeautifulSoup, seen_urls: set) -> list[dict]:
        """Extract properties from HTML snippet cards not already in JSON-LD."""
        properties = []
        snippets = soup.find_all("div", class_="snippet")

        for snippet in snippets:
            # Get the property URL from data-url attribute
            source_url = snippet.get("data-url", "")
            if not source_url:
                # Try <a> tag inside
                link = snippet.find("a", href=True)
                if link:
                    source_url = urljoin(BASE_URL, link["href"])
                else:
                    continue

            if not source_url.startswith("http"):
                source_url = urljoin(BASE_URL, source_url)

            if source_url in seen_urls:
                continue
            seen_urls.add(source_url)

            prop = self._snippet_to_property(snippet, source_url)
            if prop:
                properties.append(prop)

        return properties

    def _snippet_to_property(self, snippet, source_url: str) -> Optional[dict]:
        """Extract property data from an HTML snippet card."""
        try:
            content = snippet.find("div", class_="snippet__content")
            if not content:
                return None

            top_info = content.find("div", class_="information2__top")

            # Title
            title_el = top_info.find("h2", class_="title") if top_info else None
            title = title_el.get_text(strip=True) if title_el else ""

            # Price
            price_el = snippet.find("span", class_="price") or (
                content.find("span", class_="price") if content else None
            )
            price_text = price_el.get_text(strip=True) if price_el else ""
            price, currency = self._parse_price(price_text)

            # Location
            location_el = top_info.find("span", class_="location") if top_info else None
            location_text = location_el.get_text(strip=True) if location_el else ""

            # Parse location into components
            address, city, province = self._parse_location(location_text)

            # Bedrooms
            bed_el = snippet.find("span", class_="properties__bedrooms")
            bedrooms = self._extract_number(bed_el) if bed_el else None

            # Bathrooms
            bath_el = snippet.find("span", class_="properties__bathrooms")
            bathrooms = self._extract_number(bath_el) if bath_el else None

            # Area
            area_el = snippet.find("span", class_="properties__area")
            area = self._extract_area(area_el) if area_el else None

            # Agency
            agency_el = snippet.find("span", class_="agency__name")
            agency_name = agency_el.get_text(strip=True) if agency_el else ""

            # Published date
            date_el = snippet.find("span", class_="published-date")
            published_date = date_el.get_text(strip=True) if date_el else ""

            # Determine property type from title
            property_type = self._detect_property_type(title)

            return {
                "source_url": source_url,
                "source_name": "properati",
                "external_id": "",
                "listing_type": "comprar",
                "property_type": property_type,
                "title": title,
                "description": "",
                "price": price,
                "price_currency": currency or "USD",
                "price_per_sqm": (round(price / area, 2) if price and area and area > 0 else None),
                "address": address,
                "neighborhood": "",
                "city": city,
                "province": province,
                "country": "Costa Rica",
                "lat": None,
                "lng": None,
                "bedrooms": bedrooms,
                "bathrooms": bathrooms,
                "parking": None,
                "total_area_sqm": area,
                "built_area_sqm": None,
                "lot_area_sqm": None,
                "status": "active",
                "is_featured": 0,
                "is_verified": 0,
                "amenities": "",
                "features": "",
                "contact_name": "",
                "contact_phone": "",
                "contact_email": "",
                "agency_name": agency_name,
                "published_date": published_date,
            }
        except Exception as e:
            logger.debug("Failed to parse snippet: %s", e)
            return None

    def get_detail_page(self, url: str) -> Optional[dict]:
        """
        Fetch a property detail page for additional info (contact, description).
        Merges with existing data.
        """
        soup = self.fetch_page(url)
        if not soup:
            return None

        extra = {}

        # Try JSON-LD first
        description = soup.find("meta", attrs={"name": "description"})
        if description:
            extra["description"] = description.get("content", "")

        # Try to find contact info
        # Properati often has contact buttons/links
        contact_els = soup.find_all(string=re.compile(r"[\d\s-]{8,}"))
        phones = [c.strip() for c in contact_els if re.match(r'^[\d\s\-\(\)\+]{7,}$', c.strip())]
        if phones:
            extra["contact_phone"] = phones[0]

        # Email pattern
        email_pattern = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
        emails = email_pattern.findall(soup.get_text())
        if emails:
            extra["contact_email"] = emails[0]

        return extra if extra else None

    def scrape_search_page(self, url: str) -> tuple[list[dict], Optional[str]]:
        """Scrape a single search page and return (properties, next_page_url)."""
        properties = self.extract_properties_from_listing(url)

        # Find next page
        next_link = None
        try:
            soup = self.fetch_page(url)
            if soup:
                link = soup.find("link", rel="next")
                if link and link.get("href"):
                    next_link = link["href"]
        except Exception:
            pass

        return properties, next_link

    def scrape_all(self) -> list[dict]:
        """
        Scrape all configured search URLs, following pagination up to max_pages.
        Returns a deduplicated list of property dicts.
        """
        all_properties = []
        seen_urls = set()

        for search_url in self.search_urls:
            current_url = search_url
            page_num = 0

            while current_url and page_num < self.max_pages:
                logger.info("Scraping page %d: %s", page_num + 1, current_url)
                properties, next_url = self.scrape_search_page(current_url)

                for prop in properties:
                    if prop["source_url"] not in seen_urls:
                        seen_urls.add(prop["source_url"])
                        all_properties.append(prop)

                page_num += 1

                if next_url and page_num < self.max_pages:
                    self._random_delay()
                    current_url = next_url
                else:
                    current_url = None

            # Delay between different search URLs
            self._random_delay()

        logger.info("Total unique properties scraped: %d", len(all_properties))
        return all_properties

    # ---- Helpers ----

    @staticmethod
    def _parse_price(text: str) -> tuple[Optional[float], Optional[str]]:
        """Extract numeric price and currency from text like 'USD 89.000'."""
        if not text:
            return None, None

        text = text.strip()

        # Detect currency
        currency = "USD"
        if text.upper().startswith("USD") or text.startswith("$"):
            currency = "USD"
        elif text.upper().startswith("CRC") or text.startswith("₡"):
            currency = "CRC"
        elif text.upper().startswith("EUR") or text.startswith("€"):
            currency = "EUR"

        # Extract digits, allowing for both dot and comma separators
        # Remove currency prefix
        text_clean = re.sub(r'^[A-Z]{3}\s*', '', text)
        text_clean = re.sub(r'^[₡$€]\s*', '', text_clean)

        # Handle Latin American number format: 1.234.567 or 1,234,567
        # Remove dots used as thousand separators
        if '.' in text_clean and ',' not in text_clean:
            # Could be 1.234 (thousands) or 1.5 (decimal)
            parts = text_clean.split('.')
            if len(parts) == 2 and len(parts[1]) <= 2:
                # Likely decimal (1.5)
                pass
            else:
                # Thousand separators - remove all dots
                text_clean = text_clean.replace('.', '')
        elif ',' in text_clean and '.' in text_clean:
            # Mixed: 1.234,56 or 1,234.56
            if text_clean.rfind(',') > text_clean.rfind('.'):
                # European format: 1.234,56
                text_clean = text_clean.replace('.', '').replace(',', '.')
            else:
                # US format: 1,234.56
                text_clean = text_clean.replace(',', '')
        elif ',' in text_clean:
            # Could be 1,234 (thousands) or 1,5 (decimal)
            parts = text_clean.split(',')
            if len(parts) == 2 and len(parts[1]) <= 2:
                # Likely decimal (1,5)
                text_clean = text_clean.replace(',', '.')
            else:
                # Thousands separator
                text_clean = text_clean.replace(',', '')

        # Extract final number
        match = re.search(r'[\d.]+', text_clean)
        if match:
            try:
                price = float(match.group())
                if price.is_integer():
                    price = int(price)
                return float(price), currency
            except ValueError:
                pass

        return None, currency

    @staticmethod
    def _parse_location(text: str) -> tuple[str, str, str]:
        """
        Parse location text into (address, city, province).
        Properati format: "Neighborhood, City, Province" or "City, Province"
        """
        if not text:
            return "", "", ""

        parts = [p.strip() for p in text.split(",")]
        parts = [p for p in parts if p]

        if len(parts) >= 3:
            return parts[0], parts[-2], parts[-1]
        elif len(parts) == 2:
            return "", parts[0], parts[-1]
        elif len(parts) == 1:
            return "", parts[0], ""
        return "", "", ""

    @staticmethod
    def _extract_number(el) -> Optional[int]:
        """Extract integer from a span element."""
        text = el.get_text(strip=True)
        match = re.search(r'\d+', text)
        if match:
            try:
                return int(match.group())
            except ValueError:
                pass
        return None

    @staticmethod
    def _extract_area(el) -> Optional[float]:
        """Extract area in sqm from text like '85 m²' or '85 mt²'."""
        text = el.get_text(strip=True)
        match = re.search(r'([\d.,]+)\s*(?:m[²2]|mt[²2]|m2)', text, re.IGNORECASE)
        if match:
            try:
                val = float(match.group(1).replace(",", "."))
                return val
            except ValueError:
                pass

        # Try simple number
        match = re.search(r'([\d.]+)', text)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                pass
        return None

    @staticmethod
    def _int_or_none(val) -> Optional[int]:
        if val is None:
            return None
        try:
            return int(val)
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _detect_property_type(title: str) -> str:
        title_lower = title.lower()
        if any(w in title_lower for w in ["casa", "house", "villa", "chalet", "bungalow"]):
            return "house"
        elif any(w in title_lower for w in ["apartamento", "apartment", "condo", "departamento", "flat"]):
            return "apartment"
        elif any(w in title_lower for w in ["terreno", "land", "lote", "parcela", "solar"]):
            return "land"
        elif any(w in title_lower for w in ["local", "comercial", "commercial", "oficina", "office"]):
            return "commercial"
        elif any(w in title_lower for w in ["nave", "warehouse", "bodega", "galpón", "galpon"]):
            return "warehouse"
        return "other"


def test_scraper_ar():
    """Quick test using the .ar version (accessible from this network)."""
    scraper = ProperatiScraper(
        search_urls=["https://www.properati.com.ar/s/venta"],
        max_pages=2,
    )
    props = scraper.scrape_all()
    print(f"\nFound {len(props)} properties:")
    for p in props[:5]:
        print(f"  - {p['title'][:50]:50s} | {p['price']} {p['price_currency']} | {p['city']}")
    return props


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    test_scraper_ar()