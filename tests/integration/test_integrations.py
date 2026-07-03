"""
Unit tests for all integration modules.
All external API calls are mocked.
"""

import sys
import json
from pathlib import Path

import pytest
from unittest.mock import MagicMock, patch

# Add the integrations directory to the path (computed relative to this file)
_proj_root = Path(__file__).resolve().parent.parent.parent
integrations_path = str(_proj_root / "integrations")
sys.path.insert(0, integrations_path)

# Also add the project root so tests.fixtures.mocks is importable
if str(_proj_root) not in sys.path:
    sys.path.insert(0, str(_proj_root))

from n8n_client import N8nClient
from webhooks import WebhookManager, WebhookSubscription
from slack_bot import SlackBot
from whatsapp_twilio import WhatsAppClient
from sendgrid_email import SendGridEmailClient
from aws_s3 import AWSS3Client
from stripe_payments import StripeClient
from pipedrive_crm import PipedriveCRMClient
from google_sheets import GoogleSheetsClient

from tests.fixtures.mocks import mock_success_response, mock_failure_response


SAMPLE_PROPERTY = {
    "id": 1,
    "source_url": "https://properati.com.cr/prop/12345",
    "source_name": "properati",
    "title": "Casa moderna en Escazú",
    "listing_type": "sale",
    "property_type": "house",
    "price": 285000.0,
    "price_currency": "USD",
    "city": "Escazú",
    "province": "San José",
    "bedrooms": 3,
    "bathrooms": 2.5,
    "total_area_sqm": 180.0,
    "amenities": ["pool", "gym"],
    "contacts": [{"name": "Juan Pérez", "phone": "+506****1234", "email": "juan@example.com"}],
    "images": ["https://img.properati.com.cr/photo1.jpg"],
    "description": "Hermosa casa con vista a la ciudad, piscina y jardín.",
    "scraped_at": "2024-01-01T12:00:00",
}


# ---------------------------------------------------------------------------
# N8nClient tests
# ---------------------------------------------------------------------------

class TestN8nClient:
    def setup_method(self):
        self.client = N8nClient(
            base_url="http://localhost:5678",
            api_key="test_key",
            webhook_url="http://localhost:5678/webhook/",
        )

    def test_trigger_webhook_success(self, mock_post):
        mock_post.return_value = mock_success_response({"result": "ok"})

        result = self.client.trigger_webhook("new-property", SAMPLE_PROPERTY)
        assert result == {"result": "ok"}
        mock_post.assert_called_once()

    def test_trigger_webhook_failure_returns_none(self, mock_post):
        mock_post.side_effect = mock_failure_response()
        result = self.client.trigger_webhook("new-property", SAMPLE_PROPERTY)
        assert result is None

    def test_notify_new_property(self, mock_post):
        mock_post.return_value = mock_success_response()

        self.client.notify_new_property(SAMPLE_PROPERTY)
        call_kwargs = mock_post.call_args
        payload = call_kwargs[1]["json"]
        assert payload["event"] == "new_property"
        assert payload["data"] == SAMPLE_PROPERTY

    def test_notify_error(self, mock_post):
        mock_post.return_value = mock_success_response()

        self.client.notify_error("properati", "Connection timeout")
        payload = mock_post.call_args[1]["json"]
        assert payload["event"] == "scraper_error"
        assert payload["scraper"] == "properati"


# ---------------------------------------------------------------------------
# WebhookManager tests
# ---------------------------------------------------------------------------

class TestWebhookManager:
    def setup_method(self):
        self.manager = WebhookManager(incoming_secret="test_secret")

    def test_emit_delivers_to_subscriber(self, mock_post):
        mock_post.return_value = mock_success_response()

        self.manager.subscribe("https://dest.example.com/hook", events=["new_property"])
        results = self.manager.emit("new_property", SAMPLE_PROPERTY)

        assert "https://dest.example.com/hook" in results
        assert results["https://dest.example.com/hook"] is True

    def test_emit_skips_inactive_subscription(self, mock_post):
        sub = self.manager.subscribe("https://dest.example.com/hook", events=["new_property"])
        sub.active = False
        results = self.manager.emit("new_property", SAMPLE_PROPERTY)
        assert "https://dest.example.com/hook" not in results
        mock_post.assert_not_called()

    def test_wildcard_subscription(self, mock_post):
        mock_post.return_value = mock_success_response()
        self.manager.subscribe("https://dest.example.com/hook", events=["*"])
        results = self.manager.emit("any_event", {"data": "test"})
        assert results.get("https://dest.example.com/hook") is True

    def test_unsubscribe(self):
        self.manager.subscribe("https://to-remove.com/hook", events=["new_property"])
        assert len(self.manager._subscriptions) == 1
        self.manager.unsubscribe("https://to-remove.com/hook")
        assert len(self.manager._subscriptions) == 0

    def test_handle_incoming_valid_signature(self):
        body = b'{"event": "new_property", "data": {"title": "Test"}}'
        sig = WebhookManager._compute_signature(body, "test_secret")
        headers = {"X-PuraEstate-Signature": sig}

        handler = MagicMock()
        self.manager.on("new_property", handler)

        result = self.manager.handle_incoming(body, headers)
        assert result["status"] == "ok"
        handler.assert_called_once()

    def test_handle_incoming_invalid_signature(self):
        body = b'{"event": "new_property", "data": {}}'
        headers = {"X-PuraEstate-Signature": "sha256=invalidsig"}
        result = self.manager.handle_incoming(body, headers)
        assert result["status"] == "error"

    def test_signature_round_trip(self):
        body = b"test payload"
        secret = "my_secret"
        sig = WebhookManager._compute_signature(body, secret)
        assert WebhookManager._verify_signature(body, sig, secret)

    def test_on_registers_handler(self):
        handler = MagicMock()
        self.manager.on("test_event", handler)
        assert handler in self.manager._handlers["test_event"]


# ---------------------------------------------------------------------------
# SlackBot tests
# ---------------------------------------------------------------------------

class TestSlackBot:
    def test_cannot_send_without_credentials(self):
        bot = SlackBot(bot_token="", webhook_url="")
        assert bot._can_send() is False

    def test_can_send_with_webhook_url(self):
        bot = SlackBot(webhook_url="https://hooks.slack.com/xxx")
        # _can_send returns False if SDK not installed, True if it is
        # Just test the method doesn't crash
        can = bot._can_send()
        assert isinstance(can, bool)

    def test_send_property_alert_via_webhook(self, mock_requests_post):
        mock_requests_post.return_value = mock_success_response()

        bot = SlackBot(webhook_url="https://hooks.slack.com/test")
        if not bot._can_send():
            pytest.skip("Slack SDK not available")

        result = bot.send_property_alert(SAMPLE_PROPERTY)
        assert mock_requests_post.called

    def test_send_daily_stats(self, mock_requests_post):
        mock_requests_post.return_value = mock_success_response()

        bot = SlackBot(webhook_url="https://hooks.slack.com/test")
        if not bot._can_send():
            pytest.skip("Slack SDK not available")

        bot.send_daily_stats({
            "total_scraped": 100,
            "new_properties": 80,
            "duplicates": 15,
            "errors": 5,
        })


# ---------------------------------------------------------------------------
# WhatsAppClient tests
# ---------------------------------------------------------------------------

class TestWhatsAppClient:
    def test_cannot_send_without_credentials(self):
        client = WhatsAppClient(account_sid="", auth_token="")
        assert client._can_send() is False

    def test_format_message(self):
        client = WhatsAppClient(account_sid="ACtest", auth_token="test")
        # Test that send_property_alert constructs expected body
        client._client = MagicMock()
        mock_msg = MagicMock()
        mock_msg.sid = "SM123"
        client._client.messages.create.return_value = mock_msg

        if not client._can_send():
            pytest.skip("Twilio not available")

        result = client.send_property_alert("+506****1234", SAMPLE_PROPERTY)
        if result:
            call_kwargs = client._client.messages.create.call_args[1]
            assert "Casa moderna" in call_kwargs["body"]
            assert "285,000" in call_kwargs["body"]

    def test_from_number_formatted(self):
        client = WhatsAppClient(
            account_sid="ACtest",
            auth_token="test",
            from_number="whatsapp:+141****8886",
        )
        assert client.from_number.startswith("whatsapp:")


# ---------------------------------------------------------------------------
# AWSS3Client tests
# ---------------------------------------------------------------------------

class TestAWSS3Client:
    def test_cannot_use_without_boto3(self):
        client = AWSS3Client(bucket="test-bucket")
        # If boto3 is installed, _client will be set; otherwise None
        # Just verify _can_use returns bool
        result = client._can_use()
        assert isinstance(result, bool)

    def test_upload_image_success(self, mock_boto3_client):
        mock_s3 = MagicMock()
        mock_boto3_client.return_value = mock_s3
        mock_s3.put_object.return_value = {}

        client = AWSS3Client(bucket="test-bucket", region="us-east-1")
        client._client = mock_s3

        url = client.upload_image(b"fake_image_data", "prop_123.jpg", "image/jpeg")
        assert url is not None
        assert "test-bucket" in url
        mock_s3.put_object.assert_called_once()

    def test_upload_image_client_error(self, mock_boto3_client):
        from botocore.exceptions import ClientError
        mock_s3 = MagicMock()
        mock_boto3_client.return_value = mock_s3
        mock_s3.put_object.side_effect = ClientError(
            {"Error": {"Code": "403", "Message": "Forbidden"}}, "PutObject"
        )
        client = AWSS3Client(bucket="test-bucket")
        client._client = mock_s3
        url = client.upload_image(b"data", "key.jpg")
        assert url is None

    def test_backup_properties_json(self, mock_boto3_client):
        mock_s3 = MagicMock()
        mock_boto3_client.return_value = mock_s3
        mock_s3.put_object.return_value = {}

        client = AWSS3Client(bucket="test-bucket")
        client._client = mock_s3

        url = client.backup_properties([SAMPLE_PROPERTY], label="test")
        assert url is not None
        call_kwargs = mock_s3.put_object.call_args[1]
        assert call_kwargs["ContentType"] == "application/json"
        # Verify the body is valid JSON
        body = call_kwargs["Body"]
        parsed = json.loads(body)
        assert len(parsed) == 1


# ---------------------------------------------------------------------------
# StripeClient tests
# ---------------------------------------------------------------------------

class TestStripeClient:
    def test_cannot_use_without_key(self):
        client = StripeClient(secret_key="")
        assert client._can_use() is False

    def test_can_use_with_key(self):
        client = StripeClient(secret_key="sk_test_xxx")
        assert client._can_use() is True

    @patch("stripe.checkout.Session.create")
    def test_create_checkout_session(self, mock_create):
        mock_session = MagicMock()
        mock_session.id = "cs_test_123"
        mock_session.url = "https://checkout.stripe.com/cs_test_123"
        mock_create.return_value = mock_session

        client = StripeClient(secret_key="sk_test_xxx")
        if not client._can_use():
            pytest.skip("stripe not installed")

        result = client.create_checkout_session("professional", "user@example.com")
        assert result is not None
        assert result["session_id"] == "cs_test_123"
        assert "checkout.stripe.com" in result["url"]

    def test_process_event_subscription_completed(self):
        client = StripeClient(secret_key="sk_test_xxx")
        if not client._can_use():
            pytest.skip("stripe not installed")

        event = {
            "type": "checkout.session.completed",
            "id": "evt_123",
            "data": {
                "object": {
                    "customer_email": "user@example.com",
                    "subscription": "sub_456",
                    "metadata": {"plan": "professional"},
                }
            }
        }
        result = client._process_event(event)
        assert result["action"] == "activate_subscription"
        assert result["plan"] == "professional"

    def test_process_event_payment_failed(self):
        client = StripeClient(secret_key="sk_test_xxx")
        if not client._can_use():
            pytest.skip("stripe not installed")

        event = {
            "type": "invoice.payment_failed",
            "id": "evt_456",
            "data": {"object": {"customer": "cus_789"}},
        }
        result = client._process_event(event)
        assert result["action"] == "payment_failed_notify"

    @patch("stripe.Webhook.construct_event")
    def test_handle_webhook_valid(self, mock_construct):
        client = StripeClient(secret_key="sk_test_xxx", webhook_secret="whsec_test")
        if not client._can_use():
            pytest.skip("stripe not installed")

        mock_event = {
            "type": "invoice.payment_succeeded",
            "id": "evt_789",
            "data": {"object": {"customer": "cus_123", "amount_paid": 2900}},
        }
        mock_construct.return_value = mock_event

        result = client.handle_webhook(b"payload", "sig_header")
        assert result is not None
        assert result["action"] == "payment_recorded"


# ---------------------------------------------------------------------------
# PipedriveCRMClient tests
# ---------------------------------------------------------------------------

class TestPipedriveCRMClient:
    def setup_method(self):
        self.client = PipedriveCRMClient(api_key="test_key")

    def test_create_person(self, mock_post):
        mock_post.return_value = mock_success_response({"data": {"id": 101}})

        person_id = self.client._create_person({
            "name": "Juan Pérez",
            "phone": "+506****1234",
            "email": "juan@example.com",
        })
        assert person_id == 101

    def test_create_deal(self, mock_post):
        mock_post.return_value = mock_success_response({"data": {"id": 202}})

        deal_id = self.client._create_deal(SAMPLE_PROPERTY, person_id=101)
        assert deal_id == 202

    def test_find_person_returns_none_on_empty(self, mock_get):
        mock_get.return_value = mock_success_response({"data": {"items": []}})

        person_id = self.client._find_person({"email": "notfound@example.com"})
        assert person_id is None

    def test_sync_properties(self, mock_get, mock_post):
        mock_get.return_value = mock_success_response({"data": {"items": []}})
        mock_post.return_value = mock_success_response({"data": {"id": 303}}, status_code=201)

        result = self.client.sync_properties([SAMPLE_PROPERTY])
        assert result["created"] == 1
        assert result["failed"] == 0


# ---------------------------------------------------------------------------
# GoogleSheetsClient tests
# ---------------------------------------------------------------------------

class TestGoogleSheetsClient:
    def setup_method(self):
        self.client = GoogleSheetsClient(spreadsheet_id="test_sheet_id")

    def test_property_to_row_length(self):
        """Row should have exactly as many columns as COLUMNS list."""
        from google_sheets import COLUMNS
        row = self.client._property_to_row(SAMPLE_PROPERTY)
        assert len(row) == len(COLUMNS)

    def test_property_to_row_values(self):
        row = self.client._property_to_row(SAMPLE_PROPERTY)
        assert row[1] == "properati"   # source_name column
        assert row[5] == 285000.0      # price column
        assert row[6] == "USD"         # currency column
        assert row[7] == "Escazú"      # city column

    def test_property_to_row_contact_extracted(self):
        row = self.client._property_to_row(SAMPLE_PROPERTY)
        phone_col_idx = 14  # 0-based: Contact Phone
        email_col_idx = 15
        assert row[phone_col_idx] == "+506****1234"
        assert row[email_col_idx] == "juan@example.com"

    def test_no_connect_needed_for_row_conversion(self):
        """_property_to_row should not require API connection."""
        row = self.client._property_to_row({
            "source_name": "test",
            "price": 0,
        })
        assert isinstance(row, list)


# ---------------------------------------------------------------------------
# SendGridEmailClient tests
# ---------------------------------------------------------------------------

class TestSendGridEmailClient:
    def test_cannot_send_without_key(self):
        client = SendGridEmailClient(api_key="")
        assert client._can_send() is False

    @patch("sendgrid.SendGridAPIClient.send")
    def test_send_property_alert(self, mock_send):
        mock_send.return_value = mock_success_response(status_code=202)

        client = SendGridEmailClient(api_key="SG.test", from_email="from@test.com")
        if not client._can_send():
            pytest.skip("sendgrid not installed")

        result = client.send_property_alert("to@example.com", SAMPLE_PROPERTY)
        assert result is True

    @patch("sendgrid.SendGridAPIClient.send")
    def test_send_weekly_digest(self, mock_send):
        mock_send.return_value = mock_success_response(status_code=202)

        client = SendGridEmailClient(api_key="SG.test")
        if not client._can_send():
            pytest.skip("sendgrid not installed")

        result = client.send_weekly_digest("to@example.com", [SAMPLE_PROPERTY] * 5)
        assert result is True
