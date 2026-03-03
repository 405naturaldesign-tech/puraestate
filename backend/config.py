"""
Configuration classes for the Costa Rica Real Estate SaaS Platform.
Supports Development, Testing, and Production environments.
"""

import os
from datetime import timedelta
from dotenv import load_dotenv

# Load .env file from the project root (one level up from this file, or same dir)
_env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(_env_path)


def _require_env(key: str) -> str:
    """Return the env var or raise a clear error at startup."""
    value = os.environ.get(key)
    if not value:
        raise RuntimeError(
            f"Required environment variable '{key}' is not set. "
            "Check your .env file."
        )
    return value


class BaseConfig:
    """Base configuration shared across all environments."""

    # -------------------------------------------------------------------------
    # Application
    # -------------------------------------------------------------------------
    APP_NAME = "Costa Rica Real Estate API"
    APP_VERSION = "1.0.0"
    API_PREFIX = "/api/v1"
    SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-production")
    DEBUG = False
    TESTING = False

    # -------------------------------------------------------------------------
    # PostgreSQL / SQLAlchemy
    # -------------------------------------------------------------------------
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_RECORD_QUERIES = False
    # Connection pool settings
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 1800,      # recycle connections after 30 min
        "pool_size": 10,
        "max_overflow": 20,
        "pool_timeout": 30,
        "echo": False,
    }

    # -------------------------------------------------------------------------
    # JWT
    # -------------------------------------------------------------------------
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "change-me-jwt-secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.environ.get("JWT_ACCESS_EXPIRES_MINUTES", "60"))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        days=int(os.environ.get("JWT_REFRESH_EXPIRES_DAYS", "30"))
    )
    JWT_ALGORITHM = "HS256"
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
    JWT_BLACKLIST_ENABLED = True
    JWT_BLACKLIST_TOKEN_CHECKS = ["access", "refresh"]

    # -------------------------------------------------------------------------
    # Redis
    # -------------------------------------------------------------------------
    REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    CACHE_DEFAULT_TIMEOUT = 300        # 5 minutes
    SESSION_TIMEOUT = 3600             # 1 hour
    RATE_LIMIT_DEFAULT = "200 per hour"
    RATE_LIMIT_SEARCH = "60 per minute"
    RATE_LIMIT_AUTH = "10 per minute"

    # -------------------------------------------------------------------------
    # CORS
    # -------------------------------------------------------------------------
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
    CORS_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    CORS_HEADERS = ["Content-Type", "Authorization", "X-Request-ID"]

    # -------------------------------------------------------------------------
    # File uploads
    # -------------------------------------------------------------------------
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024   # 16 MB
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", "/tmp/uploads")
    ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}

    # -------------------------------------------------------------------------
    # Email (SMTP)
    # -------------------------------------------------------------------------
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", "587"))
    MAIL_USE_TLS = os.environ.get("MAIL_USE_TLS", "true").lower() == "true"
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD", "")
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_DEFAULT_SENDER", "noreply@costaricarealestate.com")

    # -------------------------------------------------------------------------
    # Logging
    # -------------------------------------------------------------------------
    LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
    LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"

    # -------------------------------------------------------------------------
    # External integrations
    # -------------------------------------------------------------------------
    GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "")
    AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "")
    AWS_S3_BUCKET = os.environ.get("AWS_S3_BUCKET", "")
    AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
    SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY", "")
    STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
    STRIPE_PUBLISHABLE_KEY = os.environ.get("STRIPE_PUBLISHABLE_KEY", "")

    # -------------------------------------------------------------------------
    # Pagination
    # -------------------------------------------------------------------------
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100

    @classmethod
    def from_env(cls):
        """Return the correct Config class based on the FLASK_ENV variable."""
        env = os.environ.get("FLASK_ENV", "development").lower()
        mapping = {
            "development": DevelopmentConfig,
            "testing": TestingConfig,
            "production": ProductionConfig,
        }
        config_class = mapping.get(env, DevelopmentConfig)
        return config_class()


class DevelopmentConfig(BaseConfig):
    """Configuration for local development."""

    DEBUG = True
    SQLALCHEMY_RECORD_QUERIES = True
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/cr_realestate_dev",
    )
    SQLALCHEMY_ENGINE_OPTIONS = {
        **BaseConfig.SQLALCHEMY_ENGINE_OPTIONS,
        "echo": True,    # log all SQL statements
        "pool_size": 5,
        "max_overflow": 10,
    }
    LOG_LEVEL = "DEBUG"
    RATE_LIMIT_DEFAULT = "1000 per hour"
    RATE_LIMIT_AUTH = "100 per minute"
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]


class TestingConfig(BaseConfig):
    """Configuration for the test suite."""

    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "TEST_DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/cr_realestate_test",
    )
    SQLALCHEMY_ENGINE_OPTIONS = {
        **BaseConfig.SQLALCHEMY_ENGINE_OPTIONS,
        "pool_size": 2,
        "max_overflow": 5,
        "echo": False,
    }
    # Use in-memory or test Redis DB
    REDIS_URL = os.environ.get("TEST_REDIS_URL", "redis://localhost:6379/15")
    # Shorter token lifetimes for test speed
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(hours=1)
    # Disable rate limiting in tests
    RATE_LIMIT_DEFAULT = "100000 per hour"
    RATE_LIMIT_AUTH = "100000 per minute"
    WTF_CSRF_ENABLED = False


class ProductionConfig(BaseConfig):
    """Configuration for production deployment."""

    DEBUG = False
    SQLALCHEMY_RECORD_QUERIES = False
    # In production, DATABASE_URL must be set
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "")
    SQLALCHEMY_ENGINE_OPTIONS = {
        **BaseConfig.SQLALCHEMY_ENGINE_OPTIONS,
        "pool_size": 20,
        "max_overflow": 40,
        "pool_timeout": 60,
        "echo": False,
    }
    LOG_LEVEL = "WARNING"
    # Enforce secure secrets in production
    SECRET_KEY = os.environ.get("SECRET_KEY", "")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "")

    def __init__(self):
        super().__init__()
        # Validate required production secrets at startup
        required = ["SECRET_KEY", "JWT_SECRET_KEY", "DATABASE_URL"]
        missing = [k for k in required if not os.environ.get(k)]
        if missing:
            raise RuntimeError(
                f"Production requires these env vars to be set: {missing}"
            )


# Convenience mapping used by app factory
config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
