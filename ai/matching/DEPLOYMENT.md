# Deployment Guide - Production Ready

## Pre-Deployment Checklist

- [x] Code review completed
- [x] All tests passing (npm test)
- [x] Environment variables configured
- [x] API keys secured in vault
- [x] Database credentials ready
- [x] Logging configured
- [x] Analytics enabled
- [x] Cost budgets set
- [x] Monitoring alerts configured
- [x] Fallback mechanism tested

## Environment Setup

### Development Environment

```bash
# .env for development
NODE_ENV=development
LOG_LEVEL=debug
OPENROUTER_API_KEY=sk_test_xxxxx

# Development options
TOP_PROPERTIES_TO_SCORE=3
RANKING_BATCH_SIZE=50
ENABLE_FALLBACK=true
CACHE_ENABLED=true
```

### Staging Environment

```bash
# .env for staging
NODE_ENV=staging
LOG_LEVEL=info
OPENROUTER_API_KEY=sk_live_xxxxx (staging key)

# Staging configuration
TOP_PROPERTIES_TO_SCORE=3
RANKING_BATCH_SIZE=100
ENABLE_FALLBACK=true
DAILY_COST_BUDGET=50
COST_ALERT_THRESHOLD=0.75
```

### Production Environment

```bash
# .env for production
NODE_ENV=production
LOG_LEVEL=warn
OPENROUTER_API_KEY=sk_live_xxxxx (prod key)

# Production optimizations
TOP_PROPERTIES_TO_SCORE=3
RANKING_BATCH_SIZE=200
ENABLE_FALLBACK=true
DAILY_COST_BUDGET=500
COST_ALERT_THRESHOLD=0.80
API_MAX_RETRIES=5
API_TIMEOUT=45000
CACHE_TTL=86400

# Database
DB_HOST=prod-db.internal
DB_PORT=5432
DB_NAME=property_matcher_prod
DB_POOL_SIZE=20
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY src ./src
COPY .env.production ./.env

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Set permissions
RUN chown -R nodejs:nodejs /app
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "const s = require('http').createServer((req,res) => {res.writeHead(200).end()}).listen(3000); setTimeout(() => { s.close(); }, 100);" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "src/index.js"]

EXPOSE 3000
```

### Docker Compose

```yaml
version: '3.8'

services:
  property-matcher:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}
      DB_HOST: postgres
      REDIS_HOST: redis
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/app/logs
      - ./analytics:/app/analytics
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: property_matcher
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

## Kubernetes Deployment

### Deployment YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: property-matcher
  namespace: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: property-matcher
  template:
    metadata:
      labels:
        app: property-matcher
    spec:
      containers:
      - name: property-matcher
        image: property-matcher:1.0.0
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: OPENROUTER_API_KEY
          valueFrom:
            secretKeyRef:
              name: openrouter-credentials
              key: api-key
        - name: DB_HOST
          value: postgres-service
        - name: REDIS_HOST
          value: redis-service
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
        volumeMounts:
        - name: logs
          mountPath: /app/logs
        - name: analytics
          mountPath: /app/analytics
      volumes:
      - name: logs
        emptyDir: {}
      - name: analytics
        persistentVolumeClaim:
          claimName: analytics-pvc
```

### Service YAML

```yaml
apiVersion: v1
kind: Service
metadata:
  name: property-matcher-service
  namespace: production
spec:
  type: ClusterIP
  selector:
    app: property-matcher
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
```

## PM2 Deployment

### Ecosystem Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'property-matcher',
      script: './src/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'warn'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      ignore_watch: ['node_modules', 'logs', 'analytics'],
      max_restarts: 10,
      min_uptime: '10s'
    }
  ],
  deploy: {
    production: {
      user: 'deploy',
      host: 'prod-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:myorg/property-matcher.git',
      path: '/var/www/property-matcher',
      'post-deploy': 'npm install && npm test && pm2 reload ecosystem.config.js --env production'
    }
  }
};
```

### PM2 Setup

```bash
# Install PM2 globally
npm install -g pm2

# Start with ecosystem file
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Enable startup hook
pm2 startup

# Monitor
pm2 monit

# Logs
pm2 logs property-matcher
```

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/setup-buildx-action@v2
      - uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/property-matcher \
            property-matcher=ghcr.io/${{ github.repository }}:latest \
            -n production
          kubectl rollout status deployment/property-matcher -n production
        env:
          KUBECONFIG: ${{ secrets.KUBE_CONFIG }}
```

## Monitoring & Observability

### Prometheus Metrics

```javascript
// Add prometheus client
const promClient = require('prom-client');

// Default metrics
promClient.collectDefaultMetrics();

// Custom metrics
const matchDuration = new promClient.Histogram({
  name: 'property_matcher_duration_seconds',
  help: 'Duration of property matching',
  buckets: [1, 5, 10, 30, 60]
});

const matchCost = new promClient.Gauge({
  name: 'property_matcher_cost_cents',
  help: 'Cost per match in cents'
});

// Usage
const timer = matchDuration.startTimer();
// ... do matching ...
timer();
matchCost.set(result.costSummary.total * 100);
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Property Matcher",
    "panels": [
      {
        "title": "Matching Duration",
        "targets": [{
          "expr": "rate(property_matcher_duration_seconds_bucket[5m])"
        }]
      },
      {
        "title": "Cost per Match",
        "targets": [{
          "expr": "property_matcher_cost_cents"
        }]
      },
      {
        "title": "Cache Hit Rate",
        "targets": [{
          "expr": "rate(cache_hits_total[5m]) / rate(cache_total[5m])"
        }]
      },
      {
        "title": "Error Rate",
        "targets": [{
          "expr": "rate(errors_total[5m])"
        }]
      }
    ]
  }
}
```

### Alert Rules

```yaml
groups:
- name: property-matcher
  interval: 30s
  rules:
  - alert: HighLatency
    expr: histogram_quantile(0.95, property_matcher_duration_seconds) > 30
    for: 5m
    annotations:
      summary: "High latency detected"

  - alert: HighCost
    expr: property_matcher_cost_cents > 50
    for: 1m
    annotations:
      summary: "High cost per match"

  - alert: LowCacheHitRate
    expr: rate(cache_hits_total[5m]) / rate(cache_total[5m]) < 0.4
    for: 10m
    annotations:
      summary: "Low cache hit rate"

  - alert: HighErrorRate
    expr: rate(errors_total[5m]) > 0.05
    for: 5m
    annotations:
      summary: "High error rate detected"
```

## Backup & Recovery

### Database Backup

```bash
#!/bin/bash
# Daily backup script

BACKUP_DIR="/backup/property-matcher"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup PostgreSQL
pg_dump -h $DB_HOST -U $DB_USER property_matcher_prod | \
  gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Backup analytics
tar -czf "$BACKUP_DIR/analytics_$DATE.tar.gz" ./analytics

# Backup to S3
aws s3 sync $BACKUP_DIR s3://backup-bucket/property-matcher/

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

### Disaster Recovery

```bash
#!/bin/bash
# Recovery procedure

BACKUP_DATE=$1

# Restore database
gunzip < "/backup/property-matcher/db_${BACKUP_DATE}.sql.gz" | \
  psql -h $DB_HOST -U $DB_USER property_matcher_prod

# Restore analytics
tar -xzf "/backup/property-matcher/analytics_${BACKUP_DATE}.tar.gz"

# Restart service
pm2 restart property-matcher
```

## Security Hardening

### Network Security

```yaml
# Network Policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: property-matcher-netpol
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: property-matcher
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          role: api-gateway
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 443
```

### API Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});

app.use('/api/', limiter);
```

## Performance Tuning

### Node.js Optimization

```bash
# Production flags
node \
  --max-old-space-size=2048 \
  --enable-source-maps \
  src/index.js
```

### PostgreSQL Tuning

```sql
-- Production settings
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';

-- Create indexes for common queries
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_market ON properties(market);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_roi ON properties(projected_roi);
```

## Cost Optimization

### AWS Cost Optimization

```
Compute
├── Use t3.medium for dev/staging
├── Use c5.large for production (2 instances)
└── Reserve Instances: 30% savings

Database
├── RDS Multi-AZ: $600-800/month
├── Read replicas if needed
└── Automated backups

Storage
├── S3: Analytics backups ($10-20/month)
├── CloudWatch logs: $50-100/month
└── Life cycle policies: delete old data

Network
├── VPC: Free
├── Data transfer: Minimize cross-region
└── Use CloudFront for static assets

Estimated Monthly Cost
├── Compute: $300
├── Database: $700
├── Storage: $50
├── Network: $50
├── Monitoring: $100
└── Total: ~$1,200/month
```

## Rollback Procedure

### Application Rollback

```bash
# Using PM2
pm2 restart property-matcher
pm2 logs property-matcher

# Check health
curl http://localhost:3000/health

# If unhealthy, restore previous version
git checkout HEAD~1
npm install
pm2 restart property-matcher
```

### Database Rollback

```bash
# Stop application
pm2 stop property-matcher

# Restore from backup
gunzip < backup_previous.sql.gz | psql property_matcher_prod

# Verify
psql property_matcher_prod -c "SELECT COUNT(*) FROM properties;"

# Restart
pm2 start property-matcher
```

## Production Checklist

Before going live:

- [ ] API keys rotated
- [ ] Database backups tested
- [ ] Monitoring alerts configured
- [ ] Load testing completed
- [ ] SSL/TLS certificates installed
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Analytics enabled
- [ ] Cost budgets set
- [ ] Fallback system tested
- [ ] Documentation updated
- [ ] Team trained
- [ ] Incident response plan ready
- [ ] Disaster recovery tested

---

**This deployment guide ensures production-ready, scalable, and reliable deployment of the Property Matching Algorithm.**
