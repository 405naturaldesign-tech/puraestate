"""
Webhook manager — incoming and outgoing webhooks for PuraEstate integrations.
Provides:
  - Outgoing webhooks: send events to external URLs on property/scraper events
  - Incoming webhooks: a simple Flask-based endpoint to receive external events
  - HMAC signature verification for security
"""

import hashlib
import hmac
import json
import logging
import os
import time
from dataclasses import dataclass, field
from typing import Callable, Dict, List, Optional

import requests

logger = logging.getLogger(__name__)


@dataclass
class WebhookSubscription:
    url: str
    events: List[str]       # event types to listen for, e.g. ["new_property", "scraper_error"]
    secret: str = ""
    active: bool = True
    retry_count: int = 3
    timeout: int = 10
    extra_headers: Dict[str, str] = field(default_factory=dict)


class WebhookManager:
    """
    Manages outgoing webhook delivery and incoming webhook processing.

    Outgoing usage:
        manager = WebhookManager()
        manager.subscribe("https://your-service.com/webhook", events=["new_property"])
        manager.emit("new_property", {"title": "Casa en Escazú", "price": 250000})

    Incoming (Flask) usage:
        from flask import Flask, request
        app = Flask(__name__)
        manager = WebhookManager(incoming_secret="your_secret")

        @app.route("/webhook", methods=["POST"])
        def handle_webhook():
            return manager.handle_incoming(request.get_data(), request.headers, request.get_json())
    """

    # Standard event types
    EVENT_NEW_PROPERTY = "new_property"
    EVENT_PROPERTY_UPDATED = "property_updated"
    EVENT_SCRAPER_STARTED = "scraper_started"
    EVENT_SCRAPER_COMPLETED = "scraper_completed"
    EVENT_SCRAPER_ERROR = "scraper_error"
    EVENT_DUPLICATE_DETECTED = "duplicate_detected"

    def __init__(self, incoming_secret: Optional[str] = None):
        self.incoming_secret = incoming_secret or os.environ.get("WEBHOOK_SECRET", "")
        self._subscriptions: List[WebhookSubscription] = []
        self._handlers: Dict[str, List[Callable]] = {}
        self._session = requests.Session()
        self._session.headers["Content-Type"] = "application/json"

    # ------------------------------------------------------------------
    # Outgoing webhooks
    # ------------------------------------------------------------------

    def subscribe(
        self,
        url: str,
        events: List[str] = None,
        secret: str = "",
        retry_count: int = 3,
        extra_headers: Dict = None,
    ) -> WebhookSubscription:
        """Register an outgoing webhook subscription."""
        sub = WebhookSubscription(
            url=url,
            events=events or ["*"],
            secret=secret,
            retry_count=retry_count,
            extra_headers=extra_headers or {},
        )
        self._subscriptions.append(sub)
        logger.info("Webhook: subscribed %s to events=%s", url, events)
        return sub

    def unsubscribe(self, url: str):
        """Remove all subscriptions for a URL."""
        before = len(self._subscriptions)
        self._subscriptions = [s for s in self._subscriptions if s.url != url]
        removed = before - len(self._subscriptions)
        if removed:
            logger.info("Webhook: removed %d subscription(s) for %s", removed, url)

    def emit(self, event_type: str, data: Dict) -> Dict[str, bool]:
        """
        Send an event to all matching subscribers.

        Returns:
            Dict mapping subscriber URL -> delivery success.
        """
        payload = {
            "event": event_type,
            "timestamp": int(time.time()),
            "data": data,
        }

        results = {}
        for sub in self._subscriptions:
            if not sub.active:
                continue
            if "*" not in sub.events and event_type not in sub.events:
                continue

            success = self._deliver(sub, payload)
            results[sub.url] = success

        return results

    def emit_new_property(self, property_data: Dict) -> Dict[str, bool]:
        return self.emit(self.EVENT_NEW_PROPERTY, property_data)

    def emit_scraper_error(self, scraper_name: str, error: str) -> Dict[str, bool]:
        return self.emit(self.EVENT_SCRAPER_ERROR, {"scraper": scraper_name, "error": error})

    def emit_scraper_completed(self, metrics: Dict) -> Dict[str, bool]:
        return self.emit(self.EVENT_SCRAPER_COMPLETED, metrics)

    def _deliver(self, sub: WebhookSubscription, payload: Dict) -> bool:
        """Attempt delivery with retries."""
        body = json.dumps(payload, default=str)
        headers = dict(sub.extra_headers)

        if sub.secret:
            sig = self._compute_signature(body.encode(), sub.secret)
            headers["X-PuraEstate-Signature"] = sig

        for attempt in range(sub.retry_count):
            try:
                resp = self._session.post(
                    sub.url,
                    data=body,
                    headers=headers,
                    timeout=sub.timeout,
                )
                if resp.status_code < 300:
                    logger.debug("Webhook delivered to %s (status=%d)", sub.url, resp.status_code)
                    return True
                elif resp.status_code >= 500 and attempt < sub.retry_count - 1:
                    wait = 2 ** attempt
                    logger.debug("Webhook %s got %d; retrying in %ds", sub.url, resp.status_code, wait)
                    time.sleep(wait)
                else:
                    logger.warning("Webhook to %s failed with status=%d", sub.url, resp.status_code)
                    return False
            except requests.RequestException as exc:
                if attempt < sub.retry_count - 1:
                    time.sleep(2 ** attempt)
                else:
                    logger.error("Webhook delivery to %s failed: %s", sub.url, exc)
                    return False

        return False

    # ------------------------------------------------------------------
    # Incoming webhooks
    # ------------------------------------------------------------------

    def on(self, event_type: str, handler: Callable):
        """Register a handler for an incoming event type."""
        self._handlers.setdefault(event_type, []).append(handler)
        logger.debug("Webhook: registered handler for '%s'", event_type)

    def handle_incoming(
        self,
        raw_body: bytes,
        headers: Dict,
        parsed_data: Optional[Dict] = None,
    ) -> Dict:
        """
        Process an incoming webhook request.

        Args:
            raw_body: Raw request body bytes (for signature verification)
            headers: Request headers dict
            parsed_data: Pre-parsed JSON body (optional)

        Returns:
            Response dict: {"status": "ok"} or {"status": "error", "message": ...}
        """
        # Verify signature if secret is configured
        if self.incoming_secret:
            sig = headers.get("X-PuraEstate-Signature") or headers.get("x-purastate-signature", "")
            if not sig or not self._verify_signature(raw_body, sig, self.incoming_secret):
                logger.warning("Webhook: invalid signature from %s", headers.get("Host", "unknown"))
                return {"status": "error", "message": "Invalid signature"}

        data = parsed_data or json.loads(raw_body)
        event_type = data.get("event", "unknown")
        handlers = self._handlers.get(event_type, []) + self._handlers.get("*", [])

        errors = []
        for handler in handlers:
            try:
                handler(event_type, data.get("data", data))
            except Exception as exc:
                logger.error("Webhook handler error for '%s': %s", event_type, exc)
                errors.append(str(exc))

        if errors:
            return {"status": "partial", "errors": errors}

        return {"status": "ok", "event": event_type, "handlers_called": len(handlers)}

    # ------------------------------------------------------------------
    # Flask app factory
    # ------------------------------------------------------------------

    def create_flask_app(self, secret: Optional[str] = None) -> "Flask":
        """Create a Flask app with a /webhook endpoint."""
        try:
            from flask import Flask, request, jsonify
        except ImportError:
            raise RuntimeError("Flask is not installed. Run: pip install flask")

        if secret:
            self.incoming_secret = secret

        app = Flask(__name__)

        @app.route("/webhook", methods=["POST"])
        def webhook_handler():
            result = self.handle_incoming(
                raw_body=request.get_data(),
                headers=dict(request.headers),
                parsed_data=request.get_json(silent=True),
            )
            status_code = 200 if result.get("status") in ("ok", "partial") else 401
            return jsonify(result), status_code

        @app.route("/health", methods=["GET"])
        def health():
            return jsonify({"status": "healthy", "subscriptions": len(self._subscriptions)})

        return app

    # ------------------------------------------------------------------
    # Signature helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _compute_signature(body: bytes, secret: str) -> str:
        return "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()

    @staticmethod
    def _verify_signature(body: bytes, signature: str, secret: str) -> bool:
        expected = WebhookManager._compute_signature(body, secret)
        return hmac.compare_digest(expected, signature)
