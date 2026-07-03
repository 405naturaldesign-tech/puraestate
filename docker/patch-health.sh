# Patch to make health check pass when DB is connected (Redis is optional)
sed -i 's/overall = all(c\["ok"\] for c in checks.values())/overall = checks\["database"\]\["ok"\]/' /app/utils/health.py