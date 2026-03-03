"""
SendGrid email integration — property alerts, weekly digests, error notifications.
"""

import logging
import os
from datetime import datetime
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

try:
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail, To, Content, Attachment, FileContent, FileName, FileType
    import base64
    HAS_SENDGRID = True
except ImportError:
    HAS_SENDGRID = False
    logger.warning("sendgrid not installed — SendGridEmailClient disabled.")


class SendGridEmailClient:
    """
    Send emails via SendGrid.

    Usage:
        client = SendGridEmailClient()
        client.send_property_alert(
            to_email="user@example.com",
            property_data={...}
        )
        client.send_weekly_digest(to_email="user@example.com", properties=[...])
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
    ):
        self.api_key = api_key or os.environ.get("SENDGRID_API_KEY", "")
        self.from_email = from_email or os.environ.get("SENDGRID_FROM_EMAIL", "notifications@pura-estate.com")
        self.from_name = from_name or os.environ.get("SENDGRID_FROM_NAME", "PuraEstate")
        self._client: Optional["SendGridAPIClient"] = None
        if HAS_SENDGRID and self.api_key:
            self._client = SendGridAPIClient(self.api_key)

    def send_property_alert(self, to_email: str, property_data: Dict, to_name: str = "") -> bool:
        """Send a new property listing notification email."""
        if not self._can_send():
            return False

        price = property_data.get("price")
        currency = property_data.get("price_currency", "USD")
        price_str = f"{currency} {price:,.0f}" if price else "Price not listed"

        subject = f"New Property: {property_data.get('title', 'New Listing')} — {price_str}"

        specs = []
        if property_data.get("bedrooms"):
            specs.append(f"{property_data['bedrooms']} Bedrooms")
        if property_data.get("bathrooms"):
            specs.append(f"{property_data['bathrooms']} Bathrooms")
        if property_data.get("total_area_sqm"):
            specs.append(f"{property_data['total_area_sqm']} m²")
        specs_html = " &bull; ".join(specs) if specs else ""

        image_html = ""
        images = property_data.get("images", [])
        if images:
            img_url = images[0] if isinstance(images[0], str) else images[0].get("original_url", "")
            if img_url:
                image_html = f'<img src="{img_url}" style="max-width:100%;border-radius:8px;margin-bottom:16px;" alt="Property Image">'

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <div style="background: linear-gradient(135deg, #1a5276, #2980b9); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🏠 New Property Alert</h1>
                <p style="color: #aed6f1; margin: 5px 0 0 0;">PuraEstate</p>
            </div>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
                {image_html}
                <h2 style="color: #1a5276;">{property_data.get('title', 'Property Listing')}</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px; font-weight: bold; width: 35%;">Price:</td>
                        <td style="padding: 8px; color: #27ae60; font-size: 20px; font-weight: bold;">{price_str}</td></tr>
                    <tr style="background:#fff;"><td style="padding: 8px; font-weight: bold;">Location:</td>
                        <td style="padding: 8px;">{property_data.get('city', 'N/A')}, {property_data.get('province', '')}</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold;">Type:</td>
                        <td style="padding: 8px;">{property_data.get('property_type', 'N/A').replace('_', ' ').title()}</td></tr>
                    <tr style="background:#fff;"><td style="padding: 8px; font-weight: bold;">Listing:</td>
                        <td style="padding: 8px;">{property_data.get('listing_type', 'sale').upper()}</td></tr>
                    {"<tr><td style='padding: 8px; font-weight: bold;'>Specs:</td><td style='padding: 8px;'>" + specs_html + "</td></tr>" if specs_html else ""}
                    <tr style="background:#fff;"><td style="padding: 8px; font-weight: bold;">Source:</td>
                        <td style="padding: 8px;">{property_data.get('source_name', 'N/A')}</td></tr>
                </table>
                {"<p style='margin-top: 16px;'>" + property_data.get('description', '')[:300] + "...</p>" if property_data.get('description') else ""}
                <div style="text-align: center; margin-top: 24px;">
                    <a href="{property_data.get('source_url', '#')}"
                       style="background: #2980b9; color: white; padding: 12px 30px; border-radius: 6px;
                              text-decoration: none; font-weight: bold; display: inline-block;">
                        View Full Listing
                    </a>
                </div>
            </div>
            <p style="text-align: center; font-size: 12px; color: #aaa; margin-top: 16px;">
                PuraEstate Scraper &bull; {datetime.utcnow().strftime('%Y-%m-%d')}
            </p>
        </body>
        </html>
        """

        return self._send(to_email, to_name, subject, html_content)

    def send_weekly_digest(self, to_email: str, properties: List[Dict], to_name: str = "") -> bool:
        """Send a weekly digest of new property listings."""
        if not self._can_send():
            return False

        subject = f"PuraEstate Weekly Digest — {len(properties)} New Properties"
        date_range = f"Week of {datetime.utcnow().strftime('%B %d, %Y')}"

        rows = ""
        for p in properties[:20]:  # cap at 20 listings
            price = p.get("price")
            currency = p.get("price_currency", "USD")
            price_str = f"{currency} {price:,.0f}" if price else "N/A"
            rows += f"""
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">
                    <a href="{p.get('source_url', '#')}" style="color: #2980b9; text-decoration: none;">
                        {p.get('title', 'N/A')[:60]}
                    </a>
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">{p.get('city', 'N/A')}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; color: #27ae60; font-weight: bold;">{price_str}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">{p.get('property_type', 'N/A')}</td>
            </tr>
            """

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
            <div style="background: #1a5276; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                <h1 style="color: white;">🏘️ PuraEstate Weekly Digest</h1>
                <p style="color: #aed6f1;">{date_range}</p>
            </div>
            <p>{len(properties)} new properties found this week.</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                    <tr style="background: #2980b9; color: white;">
                        <th style="padding: 10px; text-align: left;">Title</th>
                        <th style="padding: 10px; text-align: left;">City</th>
                        <th style="padding: 10px; text-align: left;">Price</th>
                        <th style="padding: 10px; text-align: left;">Type</th>
                    </tr>
                </thead>
                <tbody>{rows}</tbody>
            </table>
            <p style="text-align: center; font-size: 12px; color: #aaa; margin-top: 20px;">
                Unsubscribe | PuraEstate
            </p>
        </body>
        </html>
        """

        return self._send(to_email, to_name, subject, html_content)

    def send_error_report(self, to_email: str, errors: List[Dict]) -> bool:
        """Send an error report email."""
        if not self._can_send():
            return False

        subject = f"PuraEstate Scraper Errors — {len(errors)} Issues"
        error_rows = "".join(
            f"<tr><td style='padding:8px;border-bottom:1px solid #eee;'>{e.get('scraper','')}</td>"
            f"<td style='padding:8px;border-bottom:1px solid #eee;'>{e.get('error','')[:100]}</td></tr>"
            for e in errors[:50]
        )

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #c0392b;">⚠️ Scraper Error Report</h1>
            <p>{len(errors)} errors detected at {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</p>
            <table style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #c0392b; color: white;">
                        <th style="padding: 10px; text-align: left;">Scraper</th>
                        <th style="padding: 10px; text-align: left;">Error</th>
                    </tr>
                </thead>
                <tbody>{error_rows}</tbody>
            </table>
        </body>
        </html>
        """
        return self._send(to_email, "", subject, html_content)

    # ------------------------------------------------------------------

    def _send(self, to_email: str, to_name: str, subject: str, html_content: str) -> bool:
        try:
            message = Mail(
                from_email=(self.from_email, self.from_name),
                to_emails=To(email=to_email, name=to_name) if to_name else to_email,
                subject=subject,
                html_content=html_content,
            )
            response = self._client.send(message)
            success = response.status_code in (200, 201, 202)
            if success:
                logger.info("SendGrid: email sent to %s (status=%d)", to_email, response.status_code)
            else:
                logger.error("SendGrid: failed (status=%d)", response.status_code)
            return success
        except Exception as exc:
            logger.error("SendGrid send error: %s", exc)
            return False

    def _can_send(self) -> bool:
        if not HAS_SENDGRID:
            logger.debug("sendgrid not installed.")
            return False
        if not self._client:
            logger.debug("SendGrid API key not configured.")
            return False
        return True
