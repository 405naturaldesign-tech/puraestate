# Deployment Guide - PuraEstate Composio WhatsApp Integration

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Development](#docker-development)
3. [Production Deployment](#production-deployment)
4. [Cloud Platforms](#cloud-platforms)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Troubleshooting](#troubleshooting)

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB 6.0+
- Redis 7.0+
- npm or yarn

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env

# 3. Update .env with your values
# - Composio API key
# - WhatsApp credentials
# - Database URLs
# - Security keys

# 4. Start MongoDB and Redis
# Option A: Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:6.0
docker run -d -p 6379:6379 --name redis redis:7-alpine

# Option B: Using Homebrew (macOS)
brew services start mongodb-community
brew services start redis

# 5. Run migrations (if any)
npm run migrate

# 6. Start development server
npm run dev
```

The server will start on http://localhost:3000

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run specific test file
npm test -- message.service.test.ts

# Generate coverage report
npm test -- --coverage

# Run workflow tests
npx tsx scripts/test-workflows.ts
```

## Docker Development

### Using Docker Compose

```bash
# 1. Build images
docker-compose build

# 2. Start services
docker-compose up

# 3. Verify all services are running
docker-compose ps

# 4. View logs
docker-compose logs -f app

# 5. Stop services
docker-compose down

# 6. Remove volumes (clean slate)
docker-compose down -v
```

### Individual Docker Commands

```bash
# Build image
docker build -t puraestatecomposio:latest .

# Run container
docker run -d \
  --name puraestatecomposio \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  puraestatecomposio:latest

# Check logs
docker logs -f puraestatecomposio

# Stop container
docker stop puraestatecomposio

# Remove container
docker rm puraestatecomposio
```

## Production Deployment

### Prerequisites

- VPS or cloud server (2GB RAM minimum)
- MongoDB (managed service recommended)
- Redis (managed service recommended)
- Domain name
- SSL certificate

### Server Setup

```bash
# 1. SSH into server
ssh user@your-server.com

# 2. Update system
sudo apt-get update
sudo apt-get upgrade -y

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install PM2 (process manager)
sudo npm install -g pm2

# 5. Install Docker (recommended for services)
curl -fsSL https://get.docker.com | sudo sh

# 6. Clone repository
cd /opt
sudo git clone https://github.com/puraestatecomposio/integration.git
sudo chown -R user:user integration/

# 7. Install dependencies
cd integration
npm ci --only=production

# 8. Build application
npm run build
```

### Environment Configuration

```bash
# Create .env file
nano .env

# Add production configuration
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/puraestatecomposio
REDIS_URL=redis://redis-host:6379
COMPOSIO_API_KEY=your_api_key
# ... other variables
```

### Start with PM2

```bash
# Start application
pm2 start dist/index.js --name "puraestatecomposio"

# Save PM2 configuration
pm2 save

# Setup auto-restart on reboot
pm2 startup

# Monitor application
pm2 monit

# View logs
pm2 logs puraestatecomposio
```

### Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt-get install -y nginx

# Create configuration
sudo nano /etc/nginx/sites-available/puraestatecomposio

# Add:
upstream puraestatecomposio {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://puraestatecomposio;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/puraestatecomposio /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Setup SSL with Let's Encrypt
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### SSL Certificate Management

```bash
# Auto-renew certificates
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

## Cloud Platforms

### AWS (EC2 + RDS + ElastiCache)

```bash
# 1. Launch EC2 instance
# - AMI: Ubuntu 22.04 LTS
# - Type: t3.small (minimum)
# - Security group: Allow 80, 443, 22

# 2. Create RDS MongoDB
# - Engine: MongoDB 6.0
# - Instance: db.t3.small
# - Storage: 100GB

# 3. Create ElastiCache Redis
# - Engine: Redis 7.0
# - Node type: cache.t3.small

# 4. Connect and deploy
ssh -i your-key.pem ubuntu@your-instance.com
# Follow server setup steps above
```

### Heroku

```bash
# 1. Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# 2. Login
heroku login

# 3. Create app
heroku create puraestatecomposio

# 4. Add buildpacks
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add heroku/mongodb
heroku buildpacks:add heroku/redis

# 5. Set environment variables
heroku config:set COMPOSIO_API_KEY=your_key
heroku config:set NODE_ENV=production
# ... set all other variables

# 6. Deploy
git push heroku main

# 7. View logs
heroku logs -f

# 8. Scale dynos if needed
heroku ps:scale web=2 worker=2
```

### DigitalOcean App Platform

```bash
# 1. Create app.yaml
name: puraestatecomposio
services:
  - name: api
    github:
      repo: your-org/puraestatecomposio
      branch: main
    build_command: npm run build
    run_command: npm start
    envs:
      - key: NODE_ENV
        value: production
      - key: COMPOSIO_API_KEY
        scope: RUN_AND_BUILD_TIME
        value: ${COMPOSIO_API_KEY}
    http_port: 3000

# 2. Deploy via DigitalOcean CLI
doctl apps create --spec app.yaml

# Or use web dashboard at app.digitalocean.com
```

### Docker Container Registry Deployment

```bash
# 1. Build and tag image
docker build -t your-registry/puraestatecomposio:latest .

# 2. Push to registry
docker push your-registry/puraestatecomposio:latest

# 3. On server, pull and run
docker pull your-registry/puraestatecomposio:latest
docker run -d \
  --name puraestatecomposio \
  -p 3000:3000 \
  --env-file .env \
  your-registry/puraestatecomposio:latest

# 4. Setup docker-compose for orchestration
docker-compose -f docker-compose.prod.yml up -d
```

## Kubernetes Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: puraestatecomposio
  labels:
    app: puraestatecomposio
spec:
  replicas: 2
  selector:
    matchLabels:
      app: puraestatecomposio
  template:
    metadata:
      labels:
        app: puraestatecomposio
    spec:
      containers:
        - name: app
          image: your-registry/puraestatecomposio:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: production
            - name: MONGODB_URI
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: mongodb-uri
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: redis-url
          resources:
            requests:
              memory: '256Mi'
              cpu: '100m'
            limits:
              memory: '512Mi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10

---
apiVersion: v1
kind: Service
metadata:
  name: puraestatecomposio-service
spec:
  type: LoadBalancer
  selector:
    app: puraestatecomposio
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: puraestatecomposio-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: puraestatecomposio
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

Deploy to Kubernetes:

```bash
# Create secrets
kubectl create secret generic app-secrets \
  --from-literal=mongodb-uri=$MONGODB_URI \
  --from-literal=redis-url=$REDIS_URL

# Create ConfigMap for other config
kubectl create configmap app-config \
  --from-literal=NODE_ENV=production \
  --from-literal=PORT=3000

# Deploy
kubectl apply -f deployment.yaml

# Check status
kubectl get pods
kubectl logs deployment/puraestatecomposio

# Scale manually
kubectl scale deployment puraestatecomposio --replicas=5
```

## Monitoring & Maintenance

### Health Checks

```bash
# API health
curl http://your-domain.com/health

# Admin health
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://your-domain.com/admin/health

# Database connection
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://your-domain.com/admin/dashboard/stats
```

### Logs

```bash
# Application logs
tail -f logs/all.log
tail -f logs/error.log

# View specific error
grep "ERROR" logs/all.log | tail -20

# Search for patterns
grep "rate_limit" logs/all.log

# Export logs for analysis
tail -100 logs/all.log > logs/export.log
```

### Performance Monitoring

```bash
# Install monitoring tools
sudo apt-get install -y htop iotop nethogs

# Monitor system resources
htop

# Monitor IO
iotop

# Monitor network
nethogs

# Check application memory
ps aux | grep node

# MongoDB performance
mongosh
> db.currentOp()
> db.stats()

# Redis performance
redis-cli
> INFO
> MONITOR
```

### Backup Strategy

```bash
# Backup MongoDB
mongodump --uri="mongodb+srv://..." --out=./backup

# Backup Redis
redis-cli BGSAVE

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backup

# MongoDB backup
mongodump --uri="$MONGODB_URI" --out=$BACKUP_DIR/mongo_$DATE

# Compress
tar -czf $BACKUP_DIR/mongo_$DATE.tar.gz $BACKUP_DIR/mongo_$DATE

# Upload to S3
aws s3 cp $BACKUP_DIR/mongo_$DATE.tar.gz s3://your-bucket/backups/

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### Updates & Patches

```bash
# Pull latest code
cd /opt/integration
git pull origin main

# Install new dependencies
npm ci --only=production

# Build
npm run build

# Reload with PM2
pm2 reload puraestatecomposio

# Or with Docker
docker-compose pull
docker-compose up -d

# Check if update was successful
curl http://localhost:3000/health
```

## Troubleshooting

### Application won't start

```bash
# Check Node.js version
node --version

# Check for port conflicts
sudo lsof -i :3000

# Check environment variables
env | grep COMPOSIO

# Run with debug output
NODE_DEBUG=* npm start

# Check logs
pm2 logs puraestatecomposio
```

### Database connection issues

```bash
# Test MongoDB connection
mongosh "mongodb://..."

# Test Redis connection
redis-cli ping

# Check connection string format
# MongoDB: mongodb+srv://user:pass@cluster.mongodb.net/dbname
# Redis: redis://:password@host:port
```

### High memory usage

```bash
# Check Node.js process memory
ps aux | grep node

# Enable garbage collection logs
NODE_OPTIONS="--max_old_space_size=512" npm start

# Check for memory leaks
npm install --save-dev clinic
clinic doctor -- npm start
```

### Queue issues

```bash
# Check queue status via API
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3000/admin/queue

# Clear stuck queue
curl -X DELETE \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3000/admin/queue/whatsapp-messages

# Retry failed messages
curl -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3000/admin/messages/retry-all
```

### Rate limiting issues

```bash
# Monitor rate limiting
grep "Rate limit" logs/all.log

# Adjust rate limit in .env
WHATSAPP_RATE_LIMIT_PER_MINUTE=60

# Restart application
pm2 restart puraestatecomposio
```

## Performance Optimization

### Node.js Optimization

```bash
# Production mode
NODE_ENV=production npm start

# Cluster mode with PM2
pm2 start dist/index.js -i max --name "puraestatecomposio"

# Memory optimization
NODE_OPTIONS="--max_old_space_size=2048" npm start
```

### Database Optimization

```javascript
// Index optimization
db.collection('WhatsAppMessages').createIndex({ recipientId: 1, createdAt: -1 });
db.collection('Investors').createIndex({ email: 1 });
db.collection('Properties').createIndex({ agentId: 1, price: 1 });
```

### Caching Strategy

```bash
# Redis optimization
# Increase max memory
redis-cli CONFIG SET maxmemory 256mb

# Set eviction policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## Production Checklist

- [ ] SSL certificate configured
- [ ] Environment variables secured
- [ ] Database backups enabled
- [ ] Monitoring alerts configured
- [ ] Rate limiting tested
- [ ] Error handling tested
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Disaster recovery plan in place
- [ ] Documentation updated

---

**Last Updated**: 2024
**Version**: 1.0.0
