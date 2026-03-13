"""
Stripe API mock setup for testing.

Provides fixtures for mocking Stripe payment processing without making actual API calls.
"""

import pytest
from unittest.mock import Mock, MagicMock, patch
from datetime import datetime, timedelta


@pytest.fixture
def mock_stripe():
    """
    Mock Stripe API client.
    Provides methods for simulating payment operations.
    """
    mock_stripe = MagicMock()

    # Mock charge operations
    mock_charge = MagicMock()
    mock_charge.create = MagicMock(return_value=Mock(
        id="ch_test_charge_12345",
        amount=10000,  # $100.00 in cents
        currency="usd",
        status="succeeded",
        paid=True,
        customer="cus_test12345",
        description="Test charge",
        created=1234567890,
    ))
    mock_charge.retrieve = MagicMock(return_value=Mock(
        id="ch_test_charge_12345",
        status="succeeded",
        paid=True,
    ))

    # Mock customer operations
    mock_customer = MagicMock()
    mock_customer.create = MagicMock(return_value=Mock(
        id="cus_test12345",
        email="customer@example.com",
        description="Test Customer",
        created=1234567890,
    ))
    mock_customer.retrieve = MagicMock(return_value=Mock(
        id="cus_test12345",
        email="customer@example.com",
        balance=0,
    ))
    mock_customer.update = MagicMock(return_value=Mock(
        id="cus_test12345",
        email="updated@example.com",
    ))
    mock_customer.delete = MagicMock(return_value=Mock(
        id="cus_test12345",
        deleted=True,
    ))

    # Mock card operations
    mock_card = MagicMock()
    mock_card.create = MagicMock(return_value=Mock(
        id="card_test12345",
        brand="visa",
        last4="4242",
        exp_month=12,
        exp_year=2025,
    ))
    mock_card.retrieve = MagicMock(return_value=Mock(
        id="card_test12345",
        brand="visa",
        last4="4242",
    ))

    # Mock payment intent operations
    mock_payment_intent = MagicMock()
    mock_payment_intent.create = MagicMock(return_value=Mock(
        id="pi_test_intent_12345",
        amount=10000,
        currency="usd",
        status="requires_payment_method",
        client_secret="pi_test_secret_abc123",
    ))
    mock_payment_intent.retrieve = MagicMock(return_value=Mock(
        id="pi_test_intent_12345",
        status="succeeded",
        amount_received=10000,
    ))
    mock_payment_intent.confirm = MagicMock(return_value=Mock(
        id="pi_test_intent_12345",
        status="succeeded",
    ))

    # Mock refund operations
    mock_refund = MagicMock()
    mock_refund.create = MagicMock(return_value=Mock(
        id="re_test_refund_12345",
        charge="ch_test_charge_12345",
        amount=10000,
        status="succeeded",
    ))
    mock_refund.retrieve = MagicMock(return_value=Mock(
        id="re_test_refund_12345",
        status="succeeded",
    ))

    # Mock subscription operations
    mock_subscription = MagicMock()
    mock_subscription.create = MagicMock(return_value=Mock(
        id="sub_test_subscription_12345",
        customer="cus_test12345",
        status="active",
        items=Mock(data=[]),
        current_period_start=int(datetime.now().timestamp()),
        current_period_end=int((datetime.now() + timedelta(days=30)).timestamp()),
    ))
    mock_subscription.retrieve = MagicMock(return_value=Mock(
        id="sub_test_subscription_12345",
        status="active",
    ))

    # Mock plan operations
    mock_plan = MagicMock()
    mock_plan.create = MagicMock(return_value=Mock(
        id="plan_test_monthly",
        amount=2999,  # $29.99
        currency="usd",
        interval="month",
        product="prod_test_product",
    ))

    # Assign all mocks to the main stripe mock
    mock_stripe.Charge = mock_charge
    mock_stripe.Customer = mock_customer
    mock_stripe.Card = mock_card
    mock_stripe.PaymentIntent = mock_payment_intent
    mock_stripe.Refund = mock_refund
    mock_stripe.Subscription = mock_subscription
    mock_stripe.Plan = mock_plan

    # Mock webhook event operations
    mock_webhook = MagicMock()
    mock_webhook.construct_event = MagicMock(return_value={
        "id": "evt_test_event_12345",
        "type": "charge.succeeded",
        "data": {
            "object": {
                "id": "ch_test_charge_12345",
                "amount": 10000,
                "status": "succeeded",
            }
        }
    })
    mock_stripe.Webhook = mock_webhook

    return mock_stripe


@pytest.fixture
def stripe_context(mock_stripe):
    """
    Provide a context manager that patches Stripe globally.
    """
    with patch("stripe", mock_stripe):
        yield mock_stripe


@pytest.fixture
def stripe_charge_factory(mock_stripe):
    """
    Factory fixture for creating mock Stripe charges.
    """
    def create_charge(
        amount=10000,
        currency="usd",
        customer="cus_test12345",
        status="succeeded",
        paid=True,
        description="Test charge",
    ):
        charge = Mock()
        charge.id = f"ch_test_{int(datetime.now().timestamp())}"
        charge.amount = amount
        charge.currency = currency
        charge.customer = customer
        charge.status = status
        charge.paid = paid
        charge.description = description
        charge.created = int(datetime.now().timestamp())

        return charge

    return create_charge


@pytest.fixture
def stripe_customer_factory(mock_stripe):
    """
    Factory fixture for creating mock Stripe customers.
    """
    def create_customer(
        email="customer@example.com",
        description="Test Customer",
        metadata=None,
    ):
        customer = Mock()
        customer.id = f"cus_test_{int(datetime.now().timestamp())}"
        customer.email = email
        customer.description = description
        customer.metadata = metadata or {}
        customer.created = int(datetime.now().timestamp())

        return customer

    return create_customer


@pytest.fixture
def stripe_payment_intent_factory(mock_stripe):
    """
    Factory fixture for creating mock Stripe payment intents.
    """
    def create_payment_intent(
        amount=10000,
        currency="usd",
        status="requires_payment_method",
        customer=None,
        description="Test payment",
    ):
        intent = Mock()
        intent.id = f"pi_test_{int(datetime.now().timestamp())}"
        intent.amount = amount
        intent.currency = currency
        intent.status = status
        intent.customer = customer
        intent.description = description
        intent.client_secret = f"pi_secret_{int(datetime.now().timestamp())}"

        return intent

    return create_payment_intent


@pytest.fixture
def stripe_webhook_events():
    """
    Provide common Stripe webhook event examples.
    """
    return {
        "charge_succeeded": {
            "id": "evt_test_charge_succeeded",
            "type": "charge.succeeded",
            "data": {
                "object": {
                    "id": "ch_test_charge_12345",
                    "amount": 10000,
                    "currency": "usd",
                    "status": "succeeded",
                    "paid": True,
                }
            }
        },
        "charge_failed": {
            "id": "evt_test_charge_failed",
            "type": "charge.failed",
            "data": {
                "object": {
                    "id": "ch_test_failed_12345",
                    "amount": 10000,
                    "status": "failed",
                    "failure_message": "Card declined",
                }
            }
        },
        "payment_intent_succeeded": {
            "id": "evt_test_pi_succeeded",
            "type": "payment_intent.succeeded",
            "data": {
                "object": {
                    "id": "pi_test_intent_12345",
                    "status": "succeeded",
                    "amount_received": 10000,
                }
            }
        },
        "customer_subscription_updated": {
            "id": "evt_test_sub_updated",
            "type": "customer.subscription.updated",
            "data": {
                "object": {
                    "id": "sub_test_subscription_12345",
                    "status": "active",
                    "customer": "cus_test12345",
                }
            }
        },
        "refund_created": {
            "id": "evt_test_refund_created",
            "type": "charge.refunded",
            "data": {
                "object": {
                    "id": "ch_test_refunded_12345",
                    "refunded": True,
                    "refunds": {
                        "data": [{
                            "id": "re_test_refund_12345",
                            "amount": 5000,
                            "status": "succeeded",
                        }]
                    }
                }
            }
        },
    }


@pytest.fixture
def stripe_error_scenarios():
    """
    Provide common Stripe error scenarios for testing error handling.
    """
    return {
        "card_declined": Exception("Your card was declined."),
        "insufficient_funds": Exception("The card has insufficient funds."),
        "lost_card": Exception("The card is reported as lost."),
        "stolen_card": Exception("The card is reported as stolen."),
        "expired_card": Exception("The card has expired."),
        "incorrect_cvc": Exception("The CVC code is incorrect."),
        "processing_error": Exception("An error occurred while processing your card."),
        "rate_limit_error": Exception("Too many requests. Please retry after a short period."),
    }
