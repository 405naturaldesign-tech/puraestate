"""
Integrations blueprint – webhooks and third-party service endpoints.
Routes: /api/v1/integrations/
"""

import hashlib
import hmac
import logging
import os

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required

from utils.auth_helpers import require_role

logger = logging.getLogger(__name__)
integrations_bp = Blueprint("integrations", __name__)


# ---------------------------------------------------------------------------
# POST /api/v1/integrations/webhooks/stripe
# ---------------------------------------------------------------------------

@integrations_bp.route("/webhooks/stripe", methods=["POST"])
def stripe_webhook():
    """
    Receive and process Stripe payment events.
    Validates the Stripe-Signature header before processing.
    """
    payload = request.get_data(as_text=False)
    sig_header = request.headers.get("Stripe-Signature", "")
    webhook_secret = current_app.config.get("STRIPE_WEBHOOK_SECRET", "")

    if webhook_secret:
        try:
            import stripe
            stripe.api_key = current_app.config.get("STRIPE_SECRET_KEY")
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        except Exception as exc:
            logger.warning("Stripe webhook validation failed: %s", exc)
            return jsonify(error="invalid_signature"), 400
    else:
        import json
        try:
            event = json.loads(payload)
        except Exception:
            return jsonify(error="invalid_payload"), 400

    event_type = event.get("type", "unknown")
    logger.info("Stripe webhook received: %s", event_type)

    handlers = {
        "payment_intent.succeeded": _handle_payment_succeeded,
        "payment_intent.payment_failed": _handle_payment_failed,
        "customer.subscription.created": _handle_subscription_created,
        "customer.subscription.deleted": _handle_subscription_deleted,
    }
    handler = handlers.get(event_type)
    if handler:
        try:
            handler(event)
        except Exception as exc:
            logger.error("Error handling Stripe event %s: %s", event_type, exc)

    return jsonify(received=True), 200


# ---------------------------------------------------------------------------
# POST /api/v1/integrations/webhooks/sendgrid
# ---------------------------------------------------------------------------

@integrations_bp.route("/webhooks/sendgrid", methods=["POST"])
def sendgrid_webhook():
    """Receive SendGrid email event webhooks (opens, clicks, bounces)."""
    events = request.get_json(silent=True) or []
    for event in events:
        event_type = event.get("event", "unknown")
        email = event.get("email", "unknown")
        logger.info("SendGrid event: type=%s email=%s", event_type, email)
        # TODO: update contact/user email engagement stats in DB
    return jsonify(received=True), 200


# ---------------------------------------------------------------------------
# GET /api/v1/integrations/maps/geocode
# ---------------------------------------------------------------------------

@integrations_bp.route("/maps/geocode", methods=["GET"])
@jwt_required()
def geocode():
    """
    Proxy geocoding request to Google Maps API.
    Requires: ?address=<string>
    """
    address = request.args.get("address")
    if not address:
        return jsonify(error="validation_error", message="address query parameter required."), 400

    api_key = current_app.config.get("GOOGLE_MAPS_API_KEY")
    if not api_key:
        return jsonify(error="not_configured", message="Google Maps API key not configured."), 503

    import urllib.parse
    import urllib.request
    import json

    params = urllib.parse.urlencode({"address": address, "key": api_key})
    url = f"https://maps.googleapis.com/maps/api/geocode/json?{params}"

    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            data = json.loads(resp.read().decode())
    except Exception as exc:
        logger.error("Geocoding request failed: %s", exc)
        return jsonify(error="geocoding_failed", message="Could not geocode address."), 502

    if data.get("status") != "OK":
        return jsonify(error="geocoding_error", status=data.get("status"), message="No results."), 404

    result = data["results"][0]
    loc = result["geometry"]["location"]
    return jsonify(
        formatted_address=result.get("formatted_address"),
        latitude=loc["lat"],
        longitude=loc["lng"],
        place_id=result.get("place_id"),
        address_components=result.get("address_components", []),
    ), 200


# ---------------------------------------------------------------------------
# POST /api/v1/integrations/s3/upload-url
# ---------------------------------------------------------------------------

@integrations_bp.route("/s3/upload-url", methods=["POST"])
@jwt_required()
def generate_upload_url():
    """
    Generate a pre-signed S3 URL for direct browser-to-S3 uploads.
    Body: { "filename": "photo.jpg", "content_type": "image/jpeg" }
    """
    data = request.get_json(silent=True) or {}
    filename = data.get("filename")
    content_type = data.get("content_type", "image/jpeg")

    if not filename:
        return jsonify(error="validation_error", message="filename is required."), 400

    bucket = current_app.config.get("AWS_S3_BUCKET")
    region = current_app.config.get("AWS_REGION", "us-east-1")
    if not bucket:
        return jsonify(error="not_configured", message="S3 bucket not configured."), 503

    try:
        import boto3
        s3 = boto3.client(
            "s3",
            region_name=region,
            aws_access_key_id=current_app.config.get("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=current_app.config.get("AWS_SECRET_ACCESS_KEY"),
        )
        import uuid
        key = f"properties/{uuid.uuid4()}/{filename}"
        presigned_url = s3.generate_presigned_url(
            "put_object",
            Params={"Bucket": bucket, "Key": key, "ContentType": content_type},
            ExpiresIn=600,
        )
        public_url = f"https://{bucket}.s3.{region}.amazonaws.com/{key}"
        return jsonify(upload_url=presigned_url, public_url=public_url, key=key), 200
    except Exception as exc:
        logger.error("S3 presign failed: %s", exc)
        return jsonify(error="s3_error", message="Could not generate upload URL."), 502


# ---------------------------------------------------------------------------
# Private event handlers
# ---------------------------------------------------------------------------

def _handle_payment_succeeded(event):
    logger.info("Payment succeeded: %s", event.get("data", {}).get("object", {}).get("id"))


def _handle_payment_failed(event):
    logger.warning("Payment failed: %s", event.get("data", {}).get("object", {}).get("id"))


def _handle_subscription_created(event):
    logger.info("Subscription created: %s", event.get("data", {}).get("object", {}).get("id"))


def _handle_subscription_deleted(event):
    logger.info("Subscription deleted: %s", event.get("data", {}).get("object", {}).get("id"))
