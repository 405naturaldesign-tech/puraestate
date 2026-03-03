"""
WSGI entry point for production deployment (Gunicorn, uWSGI, etc.).

Usage with Gunicorn:
    gunicorn wsgi:application --workers 4 --bind 0.0.0.0:5000

Usage with uWSGI:
    uwsgi --http 0.0.0.0:5000 --module wsgi:application
"""

import os
from app import create_app
from utils.cache import init_cache

_env = os.environ.get("FLASK_ENV", "production")
application = create_app(_env)

# Initialise Redis cache in the application context
with application.app_context():
    init_cache(application)

# Allow `flask run` to find the app
app = application

if __name__ == "__main__":
    application.run()
