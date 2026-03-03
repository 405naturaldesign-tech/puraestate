"""
n8n API client — trigger webhooks and execute workflows.
"""

import logging
import os
from typing import Any, Dict, Optional

import requests

logger = logging.getLogger(__name__)


class N8nClient:
    """
    Client for n8n workflow automation.
    Supports webhook triggers and workflow execution via the n8n REST API.

    Usage:
        client = N8nClient()
        client.trigger_webhook("new-property", {"title": "Casa en Escazú", "price": 250000})
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        webhook_url: Optional[str] = None,
        timeout: int = 30,
    ):
        self.base_url = base_url or os.environ.get("N8N_BASE_URL", "http://localhost:5678")
        self.api_key = api_key or os.environ.get("N8N_API_KEY", "")
        self.webhook_base = webhook_url or os.environ.get("N8N_WEBHOOK_URL", f"{self.base_url}/webhook/")
        self.timeout = timeout

        self._session = requests.Session()
        if self.api_key:
            self._session.headers["X-N8N-API-KEY"] = self.api_key
        self._session.headers["Content-Type"] = "application/json"

    def trigger_webhook(self, webhook_path: str, payload: Dict[str, Any]) -> Optional[Dict]:
        """
        Send a POST request to an n8n webhook URL.

        Args:
            webhook_path: The webhook path/ID (appended to webhook_base)
            payload: Data to send in the request body

        Returns:
            Response JSON from n8n, or None on failure.
        """
        url = f"{self.webhook_base}{webhook_path}"
        try:
            resp = self._session.post(url, json=payload, timeout=self.timeout)
            resp.raise_for_status()
            logger.info("n8n webhook triggered: %s (status=%d)", webhook_path, resp.status_code)
            return resp.json() if resp.content else {}
        except requests.RequestException as exc:
            logger.error("n8n webhook failed [%s]: %s", webhook_path, exc)
            return None

    def notify_new_property(self, property_data: Dict) -> Optional[Dict]:
        """Trigger the 'new-property' workflow with property details."""
        return self.trigger_webhook("new-property", {
            "event": "new_property",
            "data": property_data,
            "source": "pura_estate_scraper",
        })

    def notify_scraper_complete(self, metrics: Dict) -> Optional[Dict]:
        """Trigger workflow on scraper completion."""
        return self.trigger_webhook("scraper-complete", {
            "event": "scraper_complete",
            "metrics": metrics,
        })

    def notify_error(self, scraper_name: str, error: str) -> Optional[Dict]:
        """Trigger error notification workflow."""
        return self.trigger_webhook("scraper-error", {
            "event": "scraper_error",
            "scraper": scraper_name,
            "error": error,
        })

    # ------------------------------------------------------------------
    # REST API methods
    # ------------------------------------------------------------------

    def list_workflows(self) -> Optional[Dict]:
        """List all n8n workflows via REST API."""
        return self._api_get("/workflows")

    def get_workflow(self, workflow_id: str) -> Optional[Dict]:
        return self._api_get(f"/workflows/{workflow_id}")

    def activate_workflow(self, workflow_id: str) -> Optional[Dict]:
        return self._api_patch(f"/workflows/{workflow_id}", {"active": True})

    def deactivate_workflow(self, workflow_id: str) -> Optional[Dict]:
        return self._api_patch(f"/workflows/{workflow_id}", {"active": False})

    def execute_workflow(self, workflow_id: str, data: Dict = None) -> Optional[Dict]:
        """Execute a workflow by ID."""
        return self._api_post(f"/workflows/{workflow_id}/execute", data or {})

    def _api_get(self, path: str) -> Optional[Dict]:
        try:
            resp = self._session.get(f"{self.base_url}/api/v1{path}", timeout=self.timeout)
            resp.raise_for_status()
            return resp.json()
        except Exception as exc:
            logger.error("n8n API GET %s failed: %s", path, exc)
            return None

    def _api_post(self, path: str, data: Dict) -> Optional[Dict]:
        try:
            resp = self._session.post(f"{self.base_url}/api/v1{path}", json=data, timeout=self.timeout)
            resp.raise_for_status()
            return resp.json()
        except Exception as exc:
            logger.error("n8n API POST %s failed: %s", path, exc)
            return None

    def _api_patch(self, path: str, data: Dict) -> Optional[Dict]:
        try:
            resp = self._session.patch(f"{self.base_url}/api/v1{path}", json=data, timeout=self.timeout)
            resp.raise_for_status()
            return resp.json()
        except Exception as exc:
            logger.error("n8n API PATCH %s failed: %s", path, exc)
            return None
