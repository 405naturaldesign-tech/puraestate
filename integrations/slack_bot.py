"""
Slack bot integration — property alerts, daily stats, error notifications.
Uses the slack-sdk library (official Slack Python SDK).
"""

import logging
import os
from datetime import datetime
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

try:
    from slack_sdk import WebClient
    from slack_sdk.errors import SlackApiError
    HAS_SLACK = True
except ImportError:
    HAS_SLACK = False
    logger.warning("slack-sdk not installed — SlackBot disabled.")


class SlackBot:
    """
    Sends Slack messages for property alerts, scraper stats, and errors.

    Usage:
        bot = SlackBot()
        bot.send_property_alert(property_data)
        bot.send_daily_stats(metrics)
        bot.send_error_notification("properati", "Connection timeout")
    """

    PROPERTY_EMOJI = {
        "house": ":house:", "apartment": ":office:", "land": ":deciduous_tree:",
        "farm": ":ear_of_corn:", "commercial": ":department_store:", "villa": ":european_castle:",
    }

    def __init__(
        self,
        bot_token: Optional[str] = None,
        webhook_url: Optional[str] = None,
        default_channel: str = "#properties",
        alerts_channel: str = "#alerts",
    ):
        self.bot_token = bot_token or os.environ.get("SLACK_BOT_TOKEN", "")
        self.webhook_url = webhook_url or os.environ.get("SLACK_WEBHOOK_URL", "")
        self.default_channel = default_channel or os.environ.get("SLACK_CHANNEL_PROPERTIES", "#properties")
        self.alerts_channel = alerts_channel or os.environ.get("SLACK_CHANNEL_ALERTS", "#alerts")

        self._client: Optional["WebClient"] = None
        if HAS_SLACK and self.bot_token:
            self._client = WebClient(token=self.bot_token)

    def send_property_alert(self, property_data: Dict) -> bool:
        """Send a formatted property alert to the properties channel."""
        if not self._can_send():
            return False

        prop_type = property_data.get("property_type", "property")
        emoji = self.PROPERTY_EMOJI.get(prop_type, ":house:")
        price = property_data.get("price")
        currency = property_data.get("price_currency", "USD")
        price_str = f"{currency} {price:,.0f}" if price else "Price not listed"

        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"{emoji} New Property Listed",
                }
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Title:*\n{property_data.get('title', 'N/A')}"},
                    {"type": "mrkdwn", "text": f"*Price:*\n{price_str}"},
                    {"type": "mrkdwn", "text": f"*Location:*\n{property_data.get('city', 'N/A')}, {property_data.get('province', '')}"},
                    {"type": "mrkdwn", "text": f"*Type:*\n{prop_type.replace('_', ' ').title()}"},
                    {"type": "mrkdwn", "text": f"*Listing:*\n{property_data.get('listing_type', 'sale').upper()}"},
                    {"type": "mrkdwn", "text": f"*Source:*\n{property_data.get('source_name', 'N/A')}"},
                ]
            },
        ]

        # Add bedrooms/bathrooms if available
        specs = []
        if property_data.get("bedrooms"):
            specs.append(f"{property_data['bedrooms']} bed")
        if property_data.get("bathrooms"):
            specs.append(f"{property_data['bathrooms']} bath")
        if property_data.get("total_area_sqm"):
            specs.append(f"{property_data['total_area_sqm']} m²")

        if specs:
            blocks.append({
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"*Specs:* {' | '.join(specs)}"}
            })

        # Link to listing
        if property_data.get("source_url"):
            blocks.append({
                "type": "actions",
                "elements": [{
                    "type": "button",
                    "text": {"type": "plain_text", "text": "View Listing"},
                    "url": property_data["source_url"],
                    "style": "primary",
                }]
            })

        return self._send_blocks(self.default_channel, blocks)

    def send_daily_stats(self, metrics: Dict) -> bool:
        """Send daily scraper statistics summary."""
        if not self._can_send():
            return False

        date_str = datetime.utcnow().strftime("%Y-%m-%d")
        total = metrics.get("total_scraped", 0)
        new = metrics.get("new_properties", 0)
        updated = metrics.get("updated_properties", 0)
        dupes = metrics.get("duplicates", 0)
        errors = metrics.get("errors", 0)

        text = (
            f":bar_chart: *Daily Scraper Report — {date_str}*\n\n"
            f"• Total visited: {total:,}\n"
            f"• New properties: {new:,}\n"
            f"• Updated: {updated:,}\n"
            f"• Duplicates: {dupes:,}\n"
            f"• Errors: {errors:,}\n"
        )

        if "scrapers" in metrics:
            text += "\n*By Source:*\n"
            for name, stats in metrics["scrapers"].items():
                if isinstance(stats, dict):
                    text += f"  • {name}: {stats.get('new_properties', 0)} new, {stats.get('errors', 0)} errors\n"

        return self._send_message(self.alerts_channel, text)

    def send_error_notification(self, scraper_name: str, error: str, traceback: str = "") -> bool:
        """Send an error alert when a scraper fails."""
        if not self._can_send():
            return False

        blocks = [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": ":rotating_light: Scraper Error"}
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Scraper:*\n{scraper_name}"},
                    {"type": "mrkdwn", "text": f"*Time:*\n{datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"},
                ]
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"*Error:*\n```{error[:500]}```"}
            },
        ]

        if traceback:
            blocks.append({
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"*Traceback:*\n```{traceback[:1000]}```"}
            })

        return self._send_blocks(self.alerts_channel, blocks)

    def send_message(self, channel: str, text: str) -> bool:
        """Send a plain text message to any channel."""
        return self._send_message(channel, text)

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _can_send(self) -> bool:
        if not HAS_SLACK:
            logger.debug("Slack SDK not available.")
            return False
        if not self._client and not self.webhook_url:
            logger.debug("No Slack credentials configured.")
            return False
        return True

    def _send_message(self, channel: str, text: str) -> bool:
        try:
            if self._client:
                resp = self._client.chat_postMessage(channel=channel, text=text)
                return resp["ok"]
            elif self.webhook_url:
                import requests
                resp = requests.post(self.webhook_url, json={"text": text, "channel": channel}, timeout=10)
                return resp.status_code == 200
        except SlackApiError as exc:
            logger.error("Slack API error: %s", exc.response["error"])
        except Exception as exc:
            logger.error("Slack send error: %s", exc)
        return False

    def _send_blocks(self, channel: str, blocks: List[Dict]) -> bool:
        try:
            if self._client:
                resp = self._client.chat_postMessage(channel=channel, blocks=blocks)
                return resp["ok"]
            elif self.webhook_url:
                import requests
                resp = requests.post(
                    self.webhook_url,
                    json={"blocks": blocks, "channel": channel},
                    timeout=10,
                )
                return resp.status_code == 200
        except Exception as exc:
            logger.error("Slack blocks send error: %s", exc)
        return False
