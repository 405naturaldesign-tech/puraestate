# PuraEstate Platform - Deployment & DevOps Guide

---

## PRE-DEPLOYMENT CHECKLIST

### Week Before Launch

- [ ] Code review completed (2 approvals minimum)
- [ ] All unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] Database backups configured
- [ ] Monitoring & alerting configured
- [ ] Disaster recovery plan reviewed
- [ ] Team training completed

### Day Before Launch

- [ ] Staging deployment successful
- [ ] Staging smoke tests passed
- [ ] Database migration tested in staging
- [ ] All API endpoints responding
- [ ] WebSocket connections stable
- [ ] Mobile apps built and tested
- [ ] Communication plan confirmed
- [ ] Rollback plan prepared
- [ ] On-call schedule confirmed

---

## DOCKER CONFIGURATION

### Backend Dockerfile

```dockerfile
# docker/Dockerfile.backend
FROM node:18-alpine

# Install build dependencies
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm ci --production

# Copy source
COPY packages/backend/src ./packages/backend/src
COPY packages/backend/tsconfig.json ./packages/backend/
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/

# Build backend
RUN npm run build --workspace=packages/backend

# Remove dev dependencies
RUN npm prune --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "packages/backend/dist/index.js"]
```

### Mobile Dockerfile (for CI/CD)

```dockerfile
# docker/Dockerfile.mobile
FROM node:18-alpine

RUN apk add --no-cache git bash

WORKDIR /app

COPY package*.json ./
COPY apps/mobile/package*.json ./apps/mobile/
COPY packages/shared/package*.json ./packages/shared/

RUN npm ci

COPY apps/mobile ./apps/mobile
COPY packages/shared ./packages/shared

WORKDIR /app/apps/mobile

RUN npm run build:eas

VOLUME ["/app/builds"]

CMD ["npm", "run", "build:ios"]
```

### Docker Compose (Production-like)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: puraestate-postgres
    environment:
      POSTGRES_DB: ${DB_NAME:-puraestate}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=en_US.UTF-8"
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    environment:
      PGUSER: ${DB_USER}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - puraestate
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: puraestate-redis
    ports:
      - "${REDIS_PORT:-6379}:6379"
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - puraestate
    restart: unless-stopped

  backend:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
      args:
        NODE_ENV: production
    container_name: puraestate-backend
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME:-puraestate}
      DATABASE_POOL_MIN: 5
      DATABASE_POOL_MAX: 20
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRY: 24h
      REFRESH_TOKEN_SECRET: ${REFRESH_TOKEN_SECRET}
      AWS_REGION: ${AWS_REGION}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      AWS_S3_BUCKET: ${AWS_S3_BUCKET}
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}
      COMPOSIO_API_KEY: ${COMPOSIO_API_KEY}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      SENDGRID_API_KEY: ${SENDGRID_API_KEY}
      TWILIO_ACCOUNT_SID: ${TWILIO_ACCOUNT_SID}
      TWILIO_AUTH_TOKEN: ${TWILIO_AUTH_TOKEN}
      FIREBASE_PROJECT_ID: ${FIREBASE_PROJECT_ID}
      FIREBASE_PRIVATE_KEY: ${FIREBASE_PRIVATE_KEY}
      FIREBASE_CLIENT_EMAIL: ${FIREBASE_CLIENT_EMAIL}
      DATADOG_API_KEY: ${DATADOG_API_KEY}
      FRONTEND_URL: ${FRONTEND_URL}
      MOBILE_API_URL: ${MOBILE_API_URL}
      LOG_LEVEL: info
    ports:
      - "${API_PORT:-3000}:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./logs:/app/logs
    networks:
      - puraestate
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "10"

  worker:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
    container_name: puraestate-worker
    environment:
      NODE_ENV: production
      WORKER_MODE: "true"
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME:-puraestate}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      # ... other env vars same as backend
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - puraestate
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"

  nginx:
    image: nginx:alpine
    container_name: puraestate-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - backend
    networks:
      - puraestate
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  puraestate:
    driver: bridge
```

### Nginx Configuration

```nginx
# docker/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/atom+xml image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

    upstream backend {
        least_conn;
        server backend:3000 max_fails=3 fail_timeout=30s;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name api.puraestate.com;

        # SSL
        ssl_certificate /etc/nginx/certs/cert.pem;
        ssl_certificate_key /etc/nginx/certs/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;

        # API endpoints
        location /api/ {
            limit_req zone=api burst=200 nodelay;

            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_buffering off;
            proxy_request_buffering off;
        }

        # WebSocket
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_buffering off;
        }

        # Health check
        location /health {
            access_log off;
            proxy_pass http://backend;
        }

        # Static files (if serving from backend)
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://backend;
            proxy_cache_valid 200 1d;
            expires 1d;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

---

## KUBERNETES DEPLOYMENT

### Namespace & RBAC

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: puraestate-prod

---
# Service Account
apiVersion: v1
kind: ServiceAccount
metadata:
  name: puraestate-app
  namespace: puraestate-prod

---
# ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: puraestate-app
rules:
- apiGroups: [""]
  resources: ["pods", "pods/logs"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["services"]
  verbs: ["get", "list"]

---
# ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: puraestate-app
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: puraestate-app
subjects:
- kind: ServiceAccount
  name: puraestate-app
  namespace: puraestate-prod
```

### ConfigMap & Secrets

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: puraestate-config
  namespace: puraestate-prod
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  API_PORT: "3000"
  REDIS_PORT: "6379"
  DATABASE_POOL_MIN: "10"
  DATABASE_POOL_MAX: "30"
  JWT_EXPIRY: "24h"

---
# k8s/secrets.yaml (WARNING: Store in sealed-secrets or external vault)
apiVersion: v1
kind: Secret
metadata:
  name: puraestate-secrets
  namespace: puraestate-prod
type: Opaque
stringData:
  DATABASE_URL: postgresql://user:password@postgres.default:5432/puraestate
  REDIS_URL: redis://:password@redis.default:6379
  JWT_SECRET: "min-32-char-secret-key-here"
  AWS_ACCESS_KEY_ID: "AKIA..."
  AWS_SECRET_ACCESS_KEY: "..."
  # ... other secrets
```

### Backend Deployment

```yaml
# k8s/deployments/backend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: puraestate-backend
  namespace: puraestate-prod
  labels:
    app: puraestate-backend
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: puraestate-backend
  template:
    metadata:
      labels:
        app: puraestate-backend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: puraestate-app
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001

      initContainers:
      - name: migrations
        image: gcr.io/puraestate/backend:latest
        imagePullPolicy: Always
        command: ["npm", "run", "migrate"]
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: puraestate-secrets
              key: DATABASE_URL
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

      containers:
      - name: backend
        image: gcr.io/puraestate/backend:latest
        imagePullPolicy: Always
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL

        ports:
        - containerPort: 3000
          name: http
          protocol: TCP

        envFrom:
        - configMapRef:
            name: puraestate-config

        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: puraestate-secrets
              key: DATABASE_URL
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: puraestate-secrets
              key: REDIS_URL
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: puraestate-secrets
              key: JWT_SECRET
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: POD_IP
          valueFrom:
            fieldRef:
              fieldPath: status.podIP

        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"

        livenessProbe:
          httpGet:
            path: /health
            port: http
            scheme: HTTP
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3

        readinessProbe:
          httpGet:
            path: /health
            port: http
            scheme: HTTP
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2

        startupProbe:
          httpGet:
            path: /health
            port: http
            scheme: HTTP
          initialDelaySeconds: 0
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 30

        volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: cache
          mountPath: /app/.cache
        - name: logs
          mountPath: /app/logs

      volumes:
      - name: tmp
        emptyDir: {}
      - name: cache
        emptyDir: {}
      - name: logs
        emptyDir: {}

      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - puraestate-backend
              topologyKey: kubernetes.io/hostname

      terminationGracePeriodSeconds: 30

---
# Service
apiVersion: v1
kind: Service
metadata:
  name: puraestate-backend
  namespace: puraestate-prod
  labels:
    app: puraestate-backend
spec:
  type: ClusterIP
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800
  ports:
  - port: 3000
    targetPort: http
    protocol: TCP
    name: http
  selector:
    app: puraestate-backend

---
# HorizontalPodAutoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: puraestate-backend-hpa
  namespace: puraestate-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: puraestate-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30

---
# PodDisruptionBudget
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: puraestate-backend-pdb
  namespace: puraestate-prod
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: puraestate-backend
```

### Worker Deployment

```yaml
# k8s/deployments/worker.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: puraestate-worker
  namespace: puraestate-prod
spec:
  replicas: 2
  selector:
    matchLabels:
      app: puraestate-worker
  template:
    metadata:
      labels:
        app: puraestate-worker
    spec:
      serviceAccountName: puraestate-app
      containers:
      - name: worker
        image: gcr.io/puraestate/backend:latest
        imagePullPolicy: Always
        command: ["npm", "run", "worker"]

        env:
        - name: WORKER_MODE
          value: "true"
        envFrom:
        - configMapRef:
            name: puraestate-config

        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: puraestate-secrets
              key: DATABASE_URL
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: puraestate-secrets
              key: REDIS_URL

        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"

      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - puraestate-worker
              topologyKey: kubernetes.io/hostname
```

---

## GITHUB ACTIONS CI/CD

### Test Pipeline

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Lint
      run: npm run lint

    - name: Unit tests
      run: npm run test:unit
      env:
        DATABASE_URL: postgresql://postgres:test@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379

    - name: Build
      run: npm run build

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/coverage-final.json
```

### Build & Push Pipeline

```yaml
# .github/workflows/build.yml
name: Build & Push

on:
  push:
    branches: [main]
  workflow_run:
    workflows: ["Test"]
    types: [completed]
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    if: github.event.workflow_run.conclusion == 'success' || github.event_name == 'push'

    steps:
    - uses: actions/checkout@v4

    - name: Set up Cloud SDK
      uses: google-github-actions/setup-gcloud@v1
      with:
        service_account_key: ${{ secrets.GCP_SERVICE_ACCOUNT_KEY }}
        project_id: ${{ secrets.GCP_PROJECT_ID }}

    - name: Configure Docker
      run: gcloud auth configure-docker gcr.io

    - name: Get git tag
      id: tag
      run: echo "tag=$(git describe --tags --always)" >> $GITHUB_OUTPUT

    - name: Build backend
      run: docker build -f docker/Dockerfile.backend -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/backend:${{ steps.tag.outputs.tag }} .

    - name: Push backend
      run: docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/backend:${{ steps.tag.outputs.tag }}

    - name: Update deployment
      run: |
        gcloud container clusters get-credentials puraestate-prod --zone us-central1-a
        kubectl set image deployment/puraestate-backend \
          backend=gcr.io/${{ secrets.GCP_PROJECT_ID }}/backend:${{ steps.tag.outputs.tag }} \
          -n puraestate-prod
        kubectl rollout status deployment/puraestate-backend -n puraestate-prod
```

### Deploy Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/')
    environment: production

    steps:
    - uses: actions/checkout@v4

    - name: Deploy backend
      run: |
        gcloud container clusters get-credentials puraestate-prod --zone us-central1-a
        kubectl apply -f k8s/ -n puraestate-prod

    - name: Deploy web
      env:
        VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      run: |
        npm install -g vercel
        vercel --prod --token=$VERCEL_TOKEN

    - name: Build mobile
      uses: expo/expo-github-action@v8
      with:
        eas-version: latest
        token: ${{ secrets.EXPO_TOKEN }}
      run: eas build --platform all --auto-submit

    - name: Notify
      if: always()
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        text: 'Production deployment completed'
        webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## MONITORING & OBSERVABILITY

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    service: puraestate
    environment: production

scrape_configs:
  - job_name: backend
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: kubernetes-apiservers
    kubernetes_sd_configs:
      - role: endpoints
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token

  - job_name: kubernetes-pods
    kubernetes_sd_configs:
      - role: pod
```

### Alert Rules

```yaml
# alerts.yml
groups:
  - name: puraestate
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 10m
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"

      - alert: HighLatency
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 0.5
        for: 5m
        annotations:
          summary: "High API latency"
          description: "p95 latency is {{ $value }}s"

      - alert: DatabaseConnectionPoolExhausted
        expr: pg_stat_activity_count > 25
        for: 5m
        annotations:
          summary: "Database connection pool nearly exhausted"

      - alert: CacheHighMissRate
        expr: rate(redis_commands_processed_total{cmd="get"}[5m]) < 0.8
        for: 10m
        annotations:
          summary: "High cache miss rate"
```

### Datadog Integration

```typescript
// packages/backend/src/config/monitoring.ts
import { datadogMetrics } from '@datadog/browser-core'
import statsd from 'node-dogstatsd'

export const metricsClient = new statsd.StatsD({
  host: process.env.DATADOG_AGENT_HOST || 'localhost',
  port: 8125,
  prefix: 'puraestate.'
})

// Track API requests
export function trackRequest(method: string, path: string, statusCode: number, duration: number) {
  metricsClient.timing('request.duration', duration, {
    method,
    path,
    status: statusCode
  })

  metricsClient.increment('request.count', {
    method,
    path,
    status: statusCode
  })
}

// Track database queries
export function trackDatabaseQuery(query: string, duration: number, error?: boolean) {
  metricsClient.timing('db.query.duration', duration, {
    query_type: query.split(' ')[0].toUpperCase()
  })

  if (error) {
    metricsClient.increment('db.query.errors')
  }
}

// Track business events
export function trackBusinessEvent(eventName: string, metadata?: any) {
  metricsClient.increment(`event.${eventName}`, 1, metadata)
}
```

---

## BACKUP & DISASTER RECOVERY

### Backup Strategy

```bash
#!/bin/bash
# scripts/backup.sh

set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"

mkdir -p $BACKUP_PATH

# Database backup
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_PATH/database.sql.gz"

# Redis backup
redis-cli --rdb "$BACKUP_PATH/redis.rdb"

# Upload to S3
aws s3 sync "$BACKUP_PATH" "s3://puraestate-backups/$TIMESTAMP/"

# Keep local backups for 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \; || true

echo "Backup completed: $BACKUP_PATH"
```

### Restore Procedure

```bash
#!/bin/bash
# scripts/restore.sh

BACKUP_TIMESTAMP=$1

if [ -z "$BACKUP_TIMESTAMP" ]; then
  echo "Usage: ./restore.sh <timestamp>"
  echo "Example: ./restore.sh 20240224_100000"
  exit 1
fi

BACKUP_PATH="/backups/backup_$BACKUP_TIMESTAMP"

# Download from S3 if not local
if [ ! -d "$BACKUP_PATH" ]; then
  aws s3 sync "s3://puraestate-backups/$BACKUP_TIMESTAMP/" "$BACKUP_PATH/"
fi

# Stop application
kubectl scale deployment puraestate-backend --replicas=0 -n puraestate-prod

# Restore database
psql "$DATABASE_URL" < <(gunzip -c "$BACKUP_PATH/database.sql.gz")

# Restore Redis
redis-cli --pipe < "$BACKUP_PATH/redis.rdb"

# Start application
kubectl scale deployment puraestate-backend --replicas=3 -n puraestate-prod

echo "Restore completed"
```

---

## HEALTH CHECK SCRIPT

```bash
#!/bin/bash
# scripts/health-check.sh

API_URL="https://api.puraestate.com"
ALERT_THRESHOLD=3

check_api_health() {
  response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
  if [ "$response" != "200" ]; then
    echo "API health check failed: HTTP $response"
    return 1
  fi
  return 0
}

check_database_connection() {
  psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo "Database connection failed"
    return 1
  fi
  return 0
}

check_redis_connection() {
  redis-cli -u "$REDIS_URL" ping > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo "Redis connection failed"
    return 1
  fi
  return 0
}

check_websocket() {
  wscat -c wss://api.puraestate.com/socket.io/ --execute "ping" > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo "WebSocket connection failed"
    return 1
  fi
  return 0
}

failures=0

check_api_health || ((failures++))
check_database_connection || ((failures++))
check_redis_connection || ((failures++))
check_websocket || ((failures++))

if [ $failures -ge $ALERT_THRESHOLD ]; then
  echo "CRITICAL: Multiple health checks failed ($failures/$ALERT_THRESHOLD)"
  exit 1
elif [ $failures -gt 0 ]; then
  echo "WARNING: $failures health check(s) failed"
  exit 1
else
  echo "OK: All health checks passed"
  exit 0
fi
```

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All tests passing
- [ ] Code review approved
- [ ] Database migrations tested
- [ ] Secrets configured in vault
- [ ] Monitoring configured
- [ ] Alerts configured
- [ ] Rollback plan prepared
- [ ] Team briefed

### Deployment
- [ ] Create release branch
- [ ] Tag release with version
- [ ] Run CI/CD pipeline
- [ ] Monitor deployment progress
- [ ] Run smoke tests
- [ ] Verify metrics and logs
- [ ] Check error rates (<0.1%)
- [ ] Validate user experience

### Post-Deployment
- [ ] Monitor for 1 hour
- [ ] Check application metrics
- [ ] Verify all endpoints
- [ ] Check user reports
- [ ] Document deployment
- [ ] Update status page
- [ ] Notify stakeholders
- [ ] Archive logs

---

**Last Updated:** February 24, 2026
**Status:** Production Ready
