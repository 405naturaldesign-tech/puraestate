"""
WhatsApp / Twilio integration — send property alerts and notifications via WhatsApp.
Uses Twilio's WhatsApp sandbox or approved business number.
"""

import logging
import os
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

try:
    from twilio.rest import Client as TwilioClient
    from twilio.base.exceptions import TwilioRestException
    HAS_TWILIO = True
except ImportError:
    HAS_TWILIO = False
    logger.warning("twilio not installed — WhatsAppClient disabled.")


class WhatsAppClient:
    """
    Send WhatsApp messages via Twilio.

    Usage:
        client = WhatsAppClient()
        client.send_property_alert(
            to="+50688881234",
            property_data={"title": "Casa en Escazú", "price": 250000}
        )
    """

    def __init__(
        self,
        account_sid: Optional[str] = None,
        auth_token: Optional[str] = None,
        from_number: Optional[str] = None,
    ):
        self.account_sid = account_sid or os.environ.get("TWILIO_ACCOUNT_SID", "")
        self.auth_token = auth_token or os.environ.get("TWILIO_AUTH_TOKEN", "")
        self.from_number = from_number or os.environ.get("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")

        self._client: Optional["TwilioClient"] = None
        if HAS_TWILIO and self.account_sid and self.auth_token:
            self._client = TwilioClient(self.account_sid, self.auth_token)

    def send_message(self, to: str, body: str, media_url: Optional[str] = None) -> bool:
        """
        Send a WhatsApp message.

        Args:
            to: Recipient phone number (will be prefixed with 'whatsapp:' if not already)
            body: Message text
            media_url: Optional image/media URL to attach

        Returns:
            True if sent successfully.
        """
        if not self._can_send():
            return False

        to_number = to if to.startswith("whatsapp:") else f"whatsapp:{to}"

        try:
            kwargs = {
                "from_": self.from_number,
                "to": to_number,
                "body": body,
            }
            if media_url:
                kwargs["media_url"] = [media_url]

            message = self._client.messages.create(**kwargs)
            logger.info("WhatsApp sent to %s (SID: %s)", to, message.sid)
            return True

        except TwilioRestException as exc:
            logger.error("Twilio error sending to %s: %s", to, exc)
            return False
        except Exception as exc:
            logger.error("WhatsApp send error: %s", exc)
            return False

    def send_property_alert(self, to: str, property_data: Dict) -> bool:
        """Format and send a property listing alert."""
        price = property_data.get("price")
        currency = property_data.get("price_currency", "USD")
        price_str = f"{currency} {price:,.0f}" if price else "Precio no disponible"

        specs = []
        if property_data.get("bedrooms"):
            specs.append(f"{property_data['bedrooms']} hab")
        if property_data.get("bathrooms"):
            specs.append(f"{property_data['bathrooms']} baños")
        if property_data.get("total_area_sqm"):
            specs.append(f"{property_data['total_area_sqm']} m²")

        body = (
            f"🏠 *Nueva propiedad disponible*\n\n"
            f"*{property_data.get('title', 'Sin título')}*\n\n"
            f"💰 {price_str}\n"
            f"📍 {property_data.get('city', 'N/A')}, {property_data.get('province', '')}\n"
            f"🏡 {property_data.get('property_type', 'N/A').replace('_', ' ').title()}\n"
        )

        if specs:
            body += f"📊 {' | '.join(specs)}\n"

        if property_data.get("source_url"):
            body += f"\n🔗 Ver anuncio: {property_data['source_url']}"

        # Attach primary image if available
        media_url = None
        images = property_data.get("images", [])
        if images:
            first_img = images[0] if isinstance(images[0], str) else images[0].get("original_url")
            if first_img and first_img.startswith("http"):
                media_url = first_img

        return self.send_message(to, body, media_url=media_url)

    def send_bulk(self, recipients: List[str], body: str) -> Dict[str, bool]:
        """Send the same message to multiple recipients."""
        results = {}
        for to in recipients:
            results[to] = self.send_message(to, body)
        return results

    def send_scraper_summary(self, to: str, metrics: Dict) -> bool:
        """Send a daily scraper summary via WhatsApp."""
        body = (
            f"📊 *PuraEstate — Resumen Diario*\n\n"
            f"✅ Nuevas propiedades: {metrics.get('new_properties', 0)}\n"
            f"🔄 Actualizadas: {metrics.get('updated_properties', 0)}\n"
            f"🔁 Duplicados: {metrics.get('duplicates', 0)}\n"
            f"❌ Errores: {metrics.get('errors', 0)}\n"
        )
        return self.send_message(to, body)

    def _can_send(self) -> bool:
        if not HAS_TWILIO:
            logger.debug("Twilio not installed.")
            return False
        if not self._client:
            logger.debug("Twilio credentials not configured.")
            return False
        return True
