"""
Costa Rica Real Estate SaaS Platform - Flask Application Factory
"""

import logging
import os
import uuid
from datetime import datetime

from flask import Flask, jsonify, request, g
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from config import config_by_name, BaseConfig
from database import db, migrate, init_db


# ---------------------------------------------------------------------------
# Module-level logger
# ---------------------------------------------------------------------------
logger = logging.getLogger(__name__)

# JWT manager (app-level instance, bound in create_app)
jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address)


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

def create_app(config_name: str = None) -> Flask:
    """
    Flask application factory.

    Args:
        config_name: One of "development", "testing", "production".
                     Defaults to FLASK_ENV environment variable or "development".

    Returns:
        Configured Flask application instance.
    """
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__, instance_relative_config=False)

    # ------------------------------------------------------------------
    # Load configuration
    # ------------------------------------------------------------------
    cfg_class = config_by_name.get(config_name, config_by_name["default"])
    app.config.from_object(cfg_class)

    # ------------------------------------------------------------------
    # Logging
    # ------------------------------------------------------------------
    _configure_logging(app)

    # ------------------------------------------------------------------
    # Extensions
    # ------------------------------------------------------------------
    _init_extensions(app)

    # ------------------------------------------------------------------
    # Redis cache (initialised after extensions)
    # ------------------------------------------------------------------
    from utils.cache import init_cache
    init_cache(app)

    # ------------------------------------------------------------------
    # Blueprints
    # ------------------------------------------------------------------
    _register_blueprints(app)

    # ------------------------------------------------------------------
    # Error handlers
    # ------------------------------------------------------------------
    _register_error_handlers(app)

    # ------------------------------------------------------------------
    # Request hooks (request ID, timing, audit)
    # ------------------------------------------------------------------
    _register_request_hooks(app)

    # ------------------------------------------------------------------
    # Health & root routes
    # ------------------------------------------------------------------
    _register_base_routes(app)

    logger.info(
        "Application created | env=%s | debug=%s",
        config_name,
        app.config.get("DEBUG"),
    )
    return app


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _configure_logging(app: Flask) -> None:
    log_level = getattr(logging, app.config.get("LOG_LEVEL", "INFO").upper(), logging.INFO)
    log_format = app.config.get("LOG_FORMAT", "%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    logging.basicConfig(level=log_level, format=log_format)
    app.logger.setLevel(log_level)


def _init_extensions(app: Flask) -> None:
    """Initialise all Flask extensions."""

    # SQLAlchemy + Alembic
    init_db(app)

    # CORS
    CORS(
        app,
        origins=app.config["CORS_ORIGINS"],
        methods=app.config["CORS_METHODS"],
        allow_headers=app.config["CORS_HEADERS"],
        supports_credentials=True,
        max_age=600,
    )

    # JWT
    jwt.init_app(app)
    _configure_jwt_callbacks(jwt)

    # Rate limiter (backed by Redis)
    limiter.init_app(app)
    app.config.setdefault("RATELIMIT_STORAGE_URI", app.config["REDIS_URL"])
    app.config.setdefault("RATELIMIT_DEFAULT", app.config["RATE_LIMIT_DEFAULT"])
    app.config.setdefault("RATELIMIT_HEADERS_ENABLED", True)


def _configure_jwt_callbacks(jwt_manager: JWTManager) -> None:
    """Register JWT event callbacks for custom error responses."""

    from utils.token_blocklist import is_token_revoked

    @jwt_manager.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        return is_token_revoked(jwt_payload)

    @jwt_manager.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify(
            error="token_expired",
            message="The access token has expired.",
        ), 401

    @jwt_manager.invalid_token_loader
    def invalid_token_callback(error_string):
        return jsonify(
            error="invalid_token",
            message=f"Token validation failed: {error_string}",
        ), 422

    @jwt_manager.unauthorized_loader
    def missing_token_callback(error_string):
        return jsonify(
            error="authorization_required",
            message="An access token is required.",
        ), 401

    @jwt_manager.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify(
            error="token_revoked",
            message="The token has been revoked.",
        ), 401

    @jwt_manager.needs_fresh_token_loader
    def token_not_fresh_callback(jwt_header, jwt_payload):
        return jsonify(
            error="fresh_token_required",
            message="A fresh token is required for this action.",
        ), 401


def _register_blueprints(app: Flask) -> None:
    """Import and register all API blueprints."""
    from blueprints.properties import properties_bp
    from blueprints.agents import agents_bp
    from blueprints.analytics import analytics_bp
    from blueprints.admin import admin_bp
    from blueprints.users import users_bp
    from blueprints.integrations import integrations_bp
    from blueprints.auth import auth_bp
    from blueprints.contacts import contacts_bp

    prefix = app.config["API_PREFIX"]

    app.register_blueprint(auth_bp,         url_prefix=f"{prefix}/auth")
    app.register_blueprint(users_bp,        url_prefix=f"{prefix}/users")
    app.register_blueprint(properties_bp,   url_prefix=f"{prefix}/properties")
    app.register_blueprint(agents_bp,       url_prefix=f"{prefix}/agents")
    app.register_blueprint(analytics_bp,    url_prefix=f"{prefix}/analytics")
    app.register_blueprint(admin_bp,        url_prefix=f"{prefix}/admin")
    app.register_blueprint(integrations_bp, url_prefix=f"{prefix}/integrations")
    app.register_blueprint(contacts_bp,     url_prefix=f"{prefix}/contacts")


def _register_error_handlers(app: Flask) -> None:
    """Register global HTTP error handlers."""

    @app.errorhandler(400)
    def bad_request(e):
        return _error_response(400, "bad_request", str(e.description))

    @app.errorhandler(401)
    def unauthorized(e):
        return _error_response(401, "unauthorized", "Authentication is required.")

    @app.errorhandler(403)
    def forbidden(e):
        return _error_response(403, "forbidden", "You do not have permission to access this resource.")

    @app.errorhandler(404)
    def not_found(e):
        return _error_response(404, "not_found", "The requested resource was not found.")

    @app.errorhandler(405)
    def method_not_allowed(e):
        return _error_response(405, "method_not_allowed", f"Method {request.method} is not allowed.")

    @app.errorhandler(409)
    def conflict(e):
        return _error_response(409, "conflict", str(e.description))

    @app.errorhandler(422)
    def unprocessable_entity(e):
        return _error_response(422, "unprocessable_entity", str(e.description))

    @app.errorhandler(429)
    def too_many_requests(e):
        return _error_response(429, "rate_limit_exceeded", "Too many requests. Please slow down.")

    @app.errorhandler(500)
    def internal_server_error(e):
        logger.exception("Unhandled 500 error: %s", e)
        return _error_response(500, "internal_server_error", "An unexpected error occurred.")

    # SQLAlchemy integrity errors
    from sqlalchemy.exc import IntegrityError, DataError, OperationalError

    @app.errorhandler(IntegrityError)
    def handle_integrity_error(e):
        db.session.rollback()
        logger.warning("Database integrity error: %s", e.orig)
        return _error_response(409, "conflict", "A record with this data already exists.")

    @app.errorhandler(DataError)
    def handle_data_error(e):
        db.session.rollback()
        logger.warning("Database data error: %s", e.orig)
        return _error_response(400, "invalid_data", "Invalid data format provided.")

    @app.errorhandler(OperationalError)
    def handle_operational_error(e):
        db.session.rollback()
        logger.error("Database operational error: %s", e.orig)
        return _error_response(503, "database_unavailable", "Database is temporarily unavailable.")


def _register_request_hooks(app: Flask) -> None:
    """Before/after request hooks for request ID injection, timing, etc."""

    @app.before_request
    def before_request():
        g.request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        g.start_time = datetime.utcnow()

    @app.after_request
    def after_request(response):
        # Inject request ID into every response
        response.headers["X-Request-ID"] = getattr(g, "request_id", "unknown")

        # Compute and inject response time
        if hasattr(g, "start_time"):
            delta = (datetime.utcnow() - g.start_time).total_seconds() * 1000
            response.headers["X-Response-Time"] = f"{delta:.2f}ms"

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        return response

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        if exception:
            db.session.rollback()
        db.session.remove()


def _register_base_routes(app: Flask) -> None:
    """Register health check and root informational routes."""

    @app.route("/health")
    def health():
        from utils.health import check_health
        status = check_health()
        code = 200 if status["healthy"] else 503
        return jsonify(status), code

    @app.route(app.config["API_PREFIX"])
    def api_root():
        return jsonify(
            name=app.config["APP_NAME"],
            version=app.config["APP_VERSION"],
            api_prefix=app.config["API_PREFIX"],
            documentation="/api/v1/docs",
            status="operational",
        )

    @app.route(f"{app.config['API_PREFIX']}/ping")
    def ping():
        return jsonify(pong=True, timestamp=datetime.utcnow().isoformat())


# ---------------------------------------------------------------------------
# JSON error helper
# ---------------------------------------------------------------------------

def _error_response(status_code: int, error_code: str, message: str):
    return jsonify(
        error=error_code,
        message=message,
        status=status_code,
        request_id=getattr(g, "request_id", None),
    ), status_code


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
