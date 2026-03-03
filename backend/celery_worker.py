"""
PuraEstate – Celery Worker Entry Point

This module creates the Celery application instance used by:
  - The Celery worker container (Dockerfile.celery)
  - The Flower monitoring dashboard
  - Flask's task dispatching via `celery_app.send_task()`

Usage:
    celery -A celery_worker:celery_app worker --loglevel=info
    celery -A celery_worker:celery_app flower --port=5555
"""

import os
from celery import Celery
from app import create_app

# ---------------------------------------------------------------------------
# Flask application context
# ---------------------------------------------------------------------------
flask_app = create_app(os.environ.get("FLASK_ENV", "production"))

# ---------------------------------------------------------------------------
# Celery configuration
# ---------------------------------------------------------------------------
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

# Use separate Redis databases for broker and result backend
# to avoid key collisions with the application cache (DB 0)
CELERY_BROKER_URL    = REDIS_URL.replace("/0", "/1")
CELERY_RESULT_BACKEND = REDIS_URL.replace("/0", "/2")


def make_celery(app) -> Celery:
    """
    Create and configure a Celery instance bound to the Flask app context.

    All tasks run inside the Flask application context so they can access
    Flask extensions (db, mail, cache, etc.) without additional setup.
    """
    celery = Celery(
        app.import_name,
        broker=CELERY_BROKER_URL,
        backend=CELERY_RESULT_BACKEND,
        include=[
            # Register task modules here so Celery can auto-discover them
            "tasks.email_tasks",
            "tasks.report_tasks",
            "tasks.notification_tasks",
            "tasks.property_tasks",
        ],
    )

    # Apply Celery configuration
    celery.conf.update(
        # Serialization
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",

        # Timezone
        timezone="America/Costa_Rica",
        enable_utc=True,

        # Task execution
        task_soft_time_limit=300,   # 5 min soft limit (raises SoftTimeLimitExceeded)
        task_time_limit=600,         # 10 min hard limit (kills worker)
        task_acks_late=True,         # Ack after task completes (reliable delivery)
        task_reject_on_worker_lost=True,

        # Result backend
        result_expires=3600,         # Results expire after 1 hour

        # Queue routing
        task_default_queue="default",
        task_queues={
            "default":       {"exchange": "default",       "routing_key": "default"},
            "emails":        {"exchange": "emails",        "routing_key": "emails"},
            "reports":       {"exchange": "reports",       "routing_key": "reports"},
            "notifications": {"exchange": "notifications", "routing_key": "notifications"},
        },
        task_routes={
            "tasks.email_tasks.*":        {"queue": "emails"},
            "tasks.report_tasks.*":       {"queue": "reports"},
            "tasks.notification_tasks.*": {"queue": "notifications"},
            "tasks.property_tasks.*":     {"queue": "default"},
        },

        # Worker settings
        worker_prefetch_multiplier=1,    # Fair task distribution
        worker_max_tasks_per_child=500,  # Prevent memory leaks

        # Beat scheduler (for periodic tasks)
        beat_schedule={
            "send-property-alerts": {
                "task": "tasks.notification_tasks.send_property_alerts",
                "schedule": 3600.0,   # Every hour
            },
            "generate-daily-analytics": {
                "task": "tasks.report_tasks.generate_daily_analytics",
                "schedule": 86400.0,  # Every 24 hours
                "kwargs": {},
            },
            "cleanup-expired-tokens": {
                "task": "tasks.property_tasks.cleanup_expired_tokens",
                "schedule": 21600.0,  # Every 6 hours
            },
        },

        # Flower monitoring
        flower_unauthenticated_api=False,
    )

    # Make tasks execute within Flask application context
    class ContextTask(celery.Task):
        """Base task that runs within the Flask app context."""

        abstract = True

        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

        def on_failure(self, exc, task_id, args, kwargs, einfo):
            """Log task failures."""
            app.logger.error(
                "Celery task failed | task_id=%s | exc=%s | args=%s",
                task_id, exc, args,
            )
            super().on_failure(exc, task_id, args, kwargs, einfo)

    celery.Task = ContextTask
    return celery


# ---------------------------------------------------------------------------
# Create the shared Celery application instance
# ---------------------------------------------------------------------------
celery_app = make_celery(flask_app)

# Make the celery app accessible as `app` for the CLI
# (celery -A celery_worker:celery_app worker)
app = celery_app


if __name__ == "__main__":
    celery_app.start()
