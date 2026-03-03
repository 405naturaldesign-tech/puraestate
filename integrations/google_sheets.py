"""
Google Sheets API integration — sync properties to a shared spreadsheet.
Uses Google Service Account credentials for server-to-server auth.
"""

import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    HAS_GOOGLE = True
except ImportError:
    HAS_GOOGLE = False
    logger.warning("google-api-python-client not installed — GoogleSheetsClient disabled.")

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

# Default column order for the properties sheet
COLUMNS = [
    "ID", "Source", "Title", "Listing Type", "Property Type",
    "Price", "Currency", "City", "Province", "Address",
    "Bedrooms", "Bathrooms", "Area m2", "Amenities",
    "Contact Phone", "Contact Email", "Agent Name",
    "Images", "URL", "Scraped At",
]


class GoogleSheetsClient:
    """
    Syncs property data to Google Sheets.

    Usage:
        client = GoogleSheetsClient(spreadsheet_id="your_id")
        client.upsert_property(property_data)
        client.append_scraper_stats(metrics)
    """

    def __init__(
        self,
        spreadsheet_id: Optional[str] = None,
        credentials_file: Optional[str] = None,
        properties_sheet: str = "Properties",
        stats_sheet: str = "Scraper Stats",
    ):
        self.spreadsheet_id = spreadsheet_id or os.environ.get("GOOGLE_SHEET_ID", "")
        self.credentials_file = credentials_file or os.environ.get(
            "GOOGLE_SHEETS_CREDENTIALS_FILE",
            "/home/tjdavis/integrations/google_credentials.json",
        )
        self.properties_sheet = properties_sheet
        self.stats_sheet = stats_sheet
        self._service = None

    def connect(self):
        """Initialize the Google Sheets API service."""
        if not HAS_GOOGLE:
            raise RuntimeError("google-api-python-client not installed.")
        if not os.path.exists(self.credentials_file):
            raise FileNotFoundError(f"Google credentials file not found: {self.credentials_file}")

        creds = service_account.Credentials.from_service_account_file(
            self.credentials_file, scopes=SCOPES
        )
        self._service = build("sheets", "v4", credentials=creds)
        logger.info("Google Sheets API connected.")

    def ensure_headers(self):
        """Write column headers if the sheet is empty."""
        if not self._service:
            self.connect()
        try:
            result = self._service.spreadsheets().values().get(
                spreadsheetId=self.spreadsheet_id,
                range=f"{self.properties_sheet}!A1:T1",
            ).execute()

            if not result.get("values"):
                self._service.spreadsheets().values().update(
                    spreadsheetId=self.spreadsheet_id,
                    range=f"{self.properties_sheet}!A1",
                    valueInputOption="RAW",
                    body={"values": [COLUMNS]},
                ).execute()
                logger.info("Google Sheets: headers written.")
        except Exception as exc:
            logger.error("Google Sheets ensure_headers error: %s", exc)

    def upsert_property(self, property_data: Dict) -> bool:
        """
        Add or update a property row.
        Checks for existing URL match, updates in-place if found, otherwise appends.
        """
        if not self._service:
            self.connect()

        row = self._property_to_row(property_data)

        try:
            # Search for existing entry by URL
            url = property_data.get("source_url", "")
            existing_row = self._find_row_by_url(url)

            if existing_row:
                range_str = f"{self.properties_sheet}!A{existing_row}:T{existing_row}"
                self._service.spreadsheets().values().update(
                    spreadsheetId=self.spreadsheet_id,
                    range=range_str,
                    valueInputOption="RAW",
                    body={"values": [row]},
                ).execute()
                logger.debug("Google Sheets: updated row %d for %s", existing_row, url)
            else:
                self._service.spreadsheets().values().append(
                    spreadsheetId=self.spreadsheet_id,
                    range=f"{self.properties_sheet}!A1",
                    valueInputOption="RAW",
                    insertDataOption="INSERT_ROWS",
                    body={"values": [row]},
                ).execute()
                logger.debug("Google Sheets: appended new row for %s", url)

            return True

        except Exception as exc:
            logger.error("Google Sheets upsert error: %s", exc)
            return False

    def bulk_append(self, properties: List[Dict]) -> int:
        """Append multiple properties at once. Returns count of rows added."""
        if not self._service:
            self.connect()

        rows = [self._property_to_row(p) for p in properties]
        try:
            self._service.spreadsheets().values().append(
                spreadsheetId=self.spreadsheet_id,
                range=f"{self.properties_sheet}!A1",
                valueInputOption="RAW",
                insertDataOption="INSERT_ROWS",
                body={"values": rows},
            ).execute()
            logger.info("Google Sheets: bulk appended %d rows.", len(rows))
            return len(rows)
        except Exception as exc:
            logger.error("Google Sheets bulk_append error: %s", exc)
            return 0

    def append_scraper_stats(self, metrics: Dict) -> bool:
        """Append a scraper run stats row to the Stats sheet."""
        if not self._service:
            self.connect()

        row = [
            datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
            metrics.get("source_name", ""),
            metrics.get("total_scraped", 0),
            metrics.get("new_properties", 0),
            metrics.get("updated_properties", 0),
            metrics.get("duplicates", 0),
            metrics.get("errors", 0),
            metrics.get("duration_seconds", 0),
        ]

        try:
            self._service.spreadsheets().values().append(
                spreadsheetId=self.spreadsheet_id,
                range=f"{self.stats_sheet}!A1",
                valueInputOption="RAW",
                insertDataOption="INSERT_ROWS",
                body={"values": [row]},
            ).execute()
            return True
        except Exception as exc:
            logger.error("Google Sheets stats error: %s", exc)
            return False

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _property_to_row(self, p: Dict) -> List[Any]:
        contacts = p.get("contacts", [])
        phone = contacts[0].get("phone", "") if contacts else ""
        email = contacts[0].get("email", "") if contacts else ""
        agent = contacts[0].get("name", "") if contacts else ""

        images = p.get("images", [])
        if images and isinstance(images[0], dict):
            images = [i.get("original_url", "") for i in images]
        image_str = "; ".join(images[:3]) if images else ""

        amenities = p.get("amenities", [])
        amenities_str = ", ".join(amenities) if amenities else ""

        return [
            p.get("id", ""),
            p.get("source_name", ""),
            p.get("title", ""),
            p.get("listing_type", ""),
            p.get("property_type", ""),
            p.get("price", ""),
            p.get("price_currency", "USD"),
            p.get("city", ""),
            p.get("province", ""),
            p.get("address", ""),
            p.get("bedrooms", ""),
            p.get("bathrooms", ""),
            p.get("total_area_sqm", ""),
            amenities_str,
            phone,
            email,
            agent,
            image_str,
            p.get("source_url", ""),
            p.get("scraped_at", datetime.utcnow().isoformat()),
        ]

    def _find_row_by_url(self, url: str) -> Optional[int]:
        """Return 1-based row number matching the URL, or None."""
        if not url:
            return None
        try:
            result = self._service.spreadsheets().values().get(
                spreadsheetId=self.spreadsheet_id,
                range=f"{self.properties_sheet}!S:S",  # URL column (index 18 = S)
            ).execute()
            values = result.get("values", [])
            for idx, row in enumerate(values):
                if row and row[0] == url:
                    return idx + 1  # 1-based
        except Exception:
            pass
        return None
