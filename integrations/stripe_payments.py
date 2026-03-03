"""
Stripe integration — subscription and payment handling for PuraEstate.
"""

import logging
import os
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

try:
    import stripe
    HAS_STRIPE = True
except ImportError:
    HAS_STRIPE = False
    logger.warning("stripe not installed — StripeClient disabled.")


class StripeClient:
    """
    Handles Stripe subscriptions, payments, and webhook processing.

    Usage:
        client = StripeClient()
        session = client.create_checkout_session(plan="professional", customer_email="user@example.com")
        print(session["url"])
    """

    PLANS = {
        "starter": {
            "name": "PuraEstate Starter",
            "price_usd_month": 29,
            "features": ["50 properties/month", "Basic alerts", "Email notifications"],
        },
        "professional": {
            "name": "PuraEstate Professional",
            "price_usd_month": 99,
            "features": ["Unlimited properties", "All alerts", "WhatsApp + Email", "CRM sync"],
        },
        "enterprise": {
            "name": "PuraEstate Enterprise",
            "price_usd_month": 299,
            "features": ["Custom scrapers", "Dedicated support", "API access", "White-label"],
        },
    }

    def __init__(
        self,
        secret_key: Optional[str] = None,
        webhook_secret: Optional[str] = None,
    ):
        self.secret_key = secret_key or os.environ.get("STRIPE_SECRET_KEY", "")
        self.webhook_secret = webhook_secret or os.environ.get("STRIPE_WEBHOOK_SECRET", "")

        if HAS_STRIPE and self.secret_key:
            stripe.api_key = self.secret_key

    def create_checkout_session(
        self,
        plan: str,
        customer_email: str,
        success_url: str = "https://pura-estate.com/success",
        cancel_url: str = "https://pura-estate.com/cancel",
        price_id: Optional[str] = None,
    ) -> Optional[Dict]:
        """
        Create a Stripe Checkout session for subscription.

        Args:
            plan: Plan name key (starter/professional/enterprise)
            customer_email: Customer's email address
            success_url: Redirect URL on success
            cancel_url: Redirect URL on cancellation
            price_id: Optional direct Stripe price ID (overrides plan lookup)

        Returns:
            Dict with session ID and URL, or None on failure.
        """
        if not self._can_use():
            return None

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[{
                    "price": price_id or self._get_price_id(plan),
                    "quantity": 1,
                }] if price_id or plan else [],
                mode="subscription",
                customer_email=customer_email,
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={"plan": plan},
            )
            logger.info("Stripe: checkout session created for %s (plan=%s)", customer_email, plan)
            return {"session_id": session.id, "url": session.url}
        except stripe.error.StripeError as exc:
            logger.error("Stripe checkout error: %s", exc)
            return None

    def create_customer(self, email: str, name: str = "", metadata: Dict = None) -> Optional[str]:
        """Create a Stripe customer and return the customer ID."""
        if not self._can_use():
            return None
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata=metadata or {},
            )
            logger.info("Stripe: customer created %s", customer.id)
            return customer.id
        except stripe.error.StripeError as exc:
            logger.error("Stripe create_customer error: %s", exc)
            return None

    def cancel_subscription(self, subscription_id: str) -> bool:
        """Cancel a Stripe subscription at period end."""
        if not self._can_use():
            return False
        try:
            stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True,
            )
            logger.info("Stripe: subscription %s marked for cancellation.", subscription_id)
            return True
        except stripe.error.StripeError as exc:
            logger.error("Stripe cancel error: %s", exc)
            return False

    def get_subscription(self, subscription_id: str) -> Optional[Dict]:
        """Retrieve subscription details."""
        if not self._can_use():
            return None
        try:
            sub = stripe.Subscription.retrieve(subscription_id)
            return {
                "id": sub.id,
                "status": sub.status,
                "plan": sub.get("metadata", {}).get("plan"),
                "current_period_end": sub.current_period_end,
                "cancel_at_period_end": sub.cancel_at_period_end,
            }
        except stripe.error.StripeError as exc:
            logger.error("Stripe get_subscription error: %s", exc)
            return None

    def handle_webhook(self, payload: bytes, sig_header: str) -> Optional[Dict]:
        """
        Verify and parse an incoming Stripe webhook event.

        Returns:
            Parsed event dict or None if signature verification fails.
        """
        if not self._can_use() or not self.webhook_secret:
            return None
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, self.webhook_secret)
            return self._process_event(event)
        except stripe.error.SignatureVerificationError as exc:
            logger.error("Stripe webhook signature verification failed: %s", exc)
            return None
        except Exception as exc:
            logger.error("Stripe webhook processing error: %s", exc)
            return None

    def _process_event(self, event: Dict) -> Dict:
        """Process a Stripe webhook event and return a summary."""
        event_type = event["type"]
        data = event["data"]["object"]

        summary = {"event_type": event_type, "id": event["id"]}

        if event_type == "checkout.session.completed":
            summary.update({
                "customer_email": data.get("customer_email"),
                "subscription_id": data.get("subscription"),
                "plan": data.get("metadata", {}).get("plan"),
                "action": "activate_subscription",
            })
        elif event_type == "invoice.payment_succeeded":
            summary.update({
                "customer": data.get("customer"),
                "amount_paid": data.get("amount_paid", 0) / 100,
                "action": "payment_recorded",
            })
        elif event_type == "invoice.payment_failed":
            summary.update({
                "customer": data.get("customer"),
                "action": "payment_failed_notify",
            })
        elif event_type == "customer.subscription.deleted":
            summary.update({
                "subscription_id": data.get("id"),
                "action": "deactivate_subscription",
            })

        logger.info("Stripe webhook processed: %s", event_type)
        return summary

    def _get_price_id(self, plan: str) -> Optional[str]:
        """Look up Stripe price ID from environment variable."""
        env_key = f"STRIPE_PRICE_{plan.upper()}"
        return os.environ.get(env_key)

    def _can_use(self) -> bool:
        if not HAS_STRIPE:
            logger.debug("stripe not installed.")
            return False
        if not self.secret_key:
            logger.debug("Stripe secret key not configured.")
            return False
        return True
