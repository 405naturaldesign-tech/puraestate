"""
Pipedrive CRM integration — create and update leads/deals from property listings.
"""

import logging
import os
from typing import Dict, List, Optional

import requests

logger = logging.getLogger(__name__)


class PipedriveCRMClient:
    """
    Manages Pipedrive CRM leads and deals for property listings.

    Usage:
        crm = PipedriveCRMClient()
        person_id = crm.find_or_create_person(contact_data)
        deal_id = crm.find_or_create_deal(property_data, person_id)
    """

    BASE_URL = "https://api.pipedrive.com/v1"

    def __init__(
        self,
        api_key: Optional[str] = None,
        domain: Optional[str] = None,
    ):
        self.api_key = api_key or os.environ.get("PIPEDRIVE_API_KEY", "")
        self.domain = domain or os.environ.get("PIPEDRIVE_DOMAIN", "")
        self._session = requests.Session()
        self._session.params = {"api_token": self.api_key}
        self._session.headers["Content-Type"] = "application/json"

        # Cache field IDs
        self._deal_fields: Optional[Dict] = None
        self._person_fields: Optional[Dict] = None

    # ------------------------------------------------------------------
    # Person (Contact) operations
    # ------------------------------------------------------------------

    def find_or_create_person(self, contact: Dict) -> Optional[int]:
        """Find existing person by phone/email, or create new."""
        person_id = self._find_person(contact)
        if person_id:
            return person_id
        return self._create_person(contact)

    def _find_person(self, contact: Dict) -> Optional[int]:
        """Search for existing person by email or phone."""
        search_term = contact.get("email") or contact.get("phone")
        if not search_term:
            return None

        try:
            resp = self._session.get(
                f"{self.BASE_URL}/persons/search",
                params={"term": search_term, "fields": "email,phone"},
            )
            resp.raise_for_status()
            data = resp.json()
            items = data.get("data", {}).get("items", [])
            if items:
                return items[0]["item"]["id"]
        except Exception as exc:
            logger.error("Pipedrive find_person error: %s", exc)
        return None

    def _create_person(self, contact: Dict) -> Optional[int]:
        """Create a new Pipedrive person."""
        payload = {
            "name": contact.get("name") or contact.get("phone") or "Unknown Contact",
        }
        if contact.get("email"):
            payload["email"] = [{"value": contact["email"], "primary": True}]
        if contact.get("phone"):
            payload["phone"] = [{"value": contact["phone"], "primary": True}]

        try:
            resp = self._session.post(f"{self.BASE_URL}/persons", json=payload)
            resp.raise_for_status()
            person_id = resp.json()["data"]["id"]
            logger.info("Pipedrive: created person %d", person_id)
            return person_id
        except Exception as exc:
            logger.error("Pipedrive create_person error: %s", exc)
            return None

    # ------------------------------------------------------------------
    # Deal operations
    # ------------------------------------------------------------------

    def find_or_create_deal(self, property_data: Dict, person_id: Optional[int] = None) -> Optional[int]:
        """Find or create a Pipedrive deal for a property."""
        # Search by URL in deal title or custom field
        existing = self._find_deal_by_title(property_data.get("title", ""))
        if existing:
            self._update_deal(existing, property_data)
            return existing

        return self._create_deal(property_data, person_id)

    def _find_deal_by_title(self, title: str) -> Optional[int]:
        if not title:
            return None
        try:
            resp = self._session.get(
                f"{self.BASE_URL}/deals/search",
                params={"term": title[:60], "fields": "title"},
            )
            resp.raise_for_status()
            items = resp.json().get("data", {}).get("items", [])
            if items:
                return items[0]["item"]["id"]
        except Exception:
            pass
        return None

    def _create_deal(self, property_data: Dict, person_id: Optional[int]) -> Optional[int]:
        """Create a new deal in Pipedrive."""
        title = property_data.get("title") or f"Property {property_data.get('city', '')} - {property_data.get('source_name', '')}"
        price = property_data.get("price", 0)

        payload = {
            "title": title[:255],
            "value": price or 0,
            "currency": property_data.get("price_currency", "USD"),
            "status": "open",
        }
        if person_id:
            payload["person_id"] = person_id

        # Add custom fields
        custom = {
            "property_url": property_data.get("source_url", ""),
            "property_type": property_data.get("property_type", ""),
            "listing_type": property_data.get("listing_type", ""),
            "city": property_data.get("city", ""),
            "province": property_data.get("province", ""),
            "bedrooms": property_data.get("bedrooms"),
            "bathrooms": property_data.get("bathrooms"),
            "area_m2": property_data.get("total_area_sqm"),
            "source": property_data.get("source_name", ""),
        }
        # Remove None values
        payload.update({k: v for k, v in custom.items() if v is not None})

        try:
            resp = self._session.post(f"{self.BASE_URL}/deals", json=payload)
            resp.raise_for_status()
            deal_id = resp.json()["data"]["id"]

            # Add note with full description
            if property_data.get("description"):
                self._add_note(deal_id, property_data["description"][:1000])

            logger.info("Pipedrive: created deal %d for '%s'", deal_id, title)
            return deal_id
        except Exception as exc:
            logger.error("Pipedrive create_deal error: %s", exc)
            return None

    def _update_deal(self, deal_id: int, property_data: Dict):
        """Update an existing deal with latest data."""
        payload = {
            "value": property_data.get("price", 0),
            "currency": property_data.get("price_currency", "USD"),
        }
        try:
            self._session.put(f"{self.BASE_URL}/deals/{deal_id}", json=payload)
        except Exception as exc:
            logger.error("Pipedrive update_deal error: %s", exc)

    def _add_note(self, deal_id: int, content: str):
        """Add a note to a deal."""
        try:
            self._session.post(
                f"{self.BASE_URL}/notes",
                json={"content": content, "deal_id": deal_id},
            )
        except Exception:
            pass

    # ------------------------------------------------------------------
    # Bulk import
    # ------------------------------------------------------------------

    def sync_properties(self, properties: List[Dict]) -> Dict[str, int]:
        """
        Sync a list of properties to Pipedrive as deals.
        Returns {created: N, updated: N, failed: N}.
        """
        created = updated = failed = 0
        for prop in properties:
            try:
                contacts = prop.get("contacts", [])
                person_id = None
                if contacts:
                    person_id = self.find_or_create_person(contacts[0])

                deal_id = self._find_deal_by_title(prop.get("title", ""))
                if deal_id:
                    self._update_deal(deal_id, prop)
                    updated += 1
                else:
                    deal_id = self._create_deal(prop, person_id)
                    if deal_id:
                        created += 1
                    else:
                        failed += 1
            except Exception as exc:
                logger.error("Pipedrive sync error for '%s': %s", prop.get("title"), exc)
                failed += 1

        return {"created": created, "updated": updated, "failed": failed}
