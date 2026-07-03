#!/usr/bin/env python3
"""RE.cr Costa Rica MLS Scraper — extracts property listings from re.cr MLS."""

import logging
import re
import time
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

logger = logging.getLogger("re_cr_scraper")

BASE_URL = "https://www.re.cr"
SEARCH_URL = "https://www.re.cr/es/busquedas-rapidas/casas-residenciales-en-venta"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

class RECrScraper:
    """Scraper for re.cr — Costa Rica MLS."""

    def __init__(self, max_pages=5, delay=1.0):
        self.max_pages = max_pages
        self.delay = delay
        self.s = requests.Session()
        self.s.headers.update(HEADERS)

    def _fetch(self, url):
        try:
            r = self.s.get(url, timeout=30)
            r.raise_for_status()
            return BeautifulSoup(r.text, "html.parser")
        except Exception as e:
            logger.warning("Failed to fetch %s: %s", url, e)
            return None

    def _parse(self, row):
        """Extract data from a .row.propertyrow element."""
        p = {}
        t = row.select_one(".title a.summary")
        if t:
            p["title"] = t.get_text(strip=True)
            p["source_url"] = urljoin(BASE_URL, t.get("href", ""))
        if not p.get("source_url"):
            return None

        # Location
        loc = row.select_one(".freetext")
        if loc:
            p["address"] = loc.get_text(strip=True)
            parts = [x.strip() for x in p["address"].split(",")]
            if len(parts) >= 1: p["city"] = parts[0]
            if len(parts) >= 2: p["province"] = parts[1]
            if len(parts) >= 3: p["country"] = parts[2]

        # Property type
        pt = row.select_one(".location")
        if pt:
            p["property_type"] = pt.get_text(strip=True)

        # Bedrooms / Bathrooms (format "X/Y")
        beds = row.select_one(".bedrooms")
        if beds:
            m = re.search(r'(\d+)\s*/\s*(\d+)', beds.get_text())
            if m:
                p["bedrooms"] = int(m.group(1))
                p["bathrooms"] = int(m.group(2))

        # Area
        area = row.select_one(".area")
        if area:
            t = area.get_text(strip=True)
            m2 = re.search(r'([\d.,]+)\s*m²', t)
            if m2:
                p["total_area_sqm"] = float(m2.group(1).replace(".", "").replace(",", "."))
            p["area_text"] = t

        # Price
        price = row.select_one(".price")
        if price:
            t = price.get_text(strip=True)
            pm = re.search(r'([\d.]+)\s*US\$', t)
            if pm:
                p["price"] = int(pm.group(1).replace(".", ""))
                p["price_currency"] = "USD"

        p["source_name"] = "re.cr"
        p["listing_type"] = "venta"
        return p

    def scrape_page(self, page_num):
        url = f"{SEARCH_URL}?page={page_num}" if page_num > 1 else SEARCH_URL
        logger.info("Scraping page %d: %s", page_num, url)
        soup = self._fetch(url)
        if not soup:
            return []
        rows = soup.select(".row.propertyrow")
        results = []
        for row in rows:
            data = self._parse(row)
            if data:
                results.append(data)
        logger.info("  Found %d listings", len(results))
        return results

    def scrape_all(self):
        all_ = []
        for page in range(1, self.max_pages + 1):
            all_.extend(self.scrape_page(page))
            if page < self.max_pages:
                time.sleep(self.delay)
        return all_