# PuraEstate tRPC Server - Setup & Deployment Guide

Complete guide to setting up, testing, and deploying the tRPC API layer.

## 📋 Table of Contents

1. [Local Development](#local-development)
2. [Configuration](#configuration)
3. [Running the Server](#running-the-server)
4. [Testing](#testing)
5. [Deployment](#deployment)
6. [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites

- Node.js 20+ (LTS recommended)
- npm or yarn
- Flask backend running on `http://localhost:5000`
- Composio API key (optional for development)
- OpenRouter API key (optional for development)

### 1. Install Dependencies

```bash
cd PuraEstate-Production/trpc-server
npm install
```

### 2. Create Environment File

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Development setup
NODE_ENV=development
PORT=3000

# Flask Backend (must be running)
FLASK_API_URL=http://localhost:5000
FLASK_API_KEY=dev-key-12345

# Optional: Composio for WhatsApp
COMPOSIO_API_KEY=your_composio_key_here

# Optional: OpenRouter for AI
OPENROUTER_API_KEY=your_openrouter_key_here

# CORS for local development
CORS_ORIGIN=exp://localhost:8081,http://localhost:8081
```

### 3. Start Development Server

```bash
npm run dev
```

You should see:
```
╔════════════════════════════════════════════╗
║   PuraEstate TRPC Server                   ║
╠════════════════════════════════════════════╣
║ 🚀 Server running on port 3000             ║
║ 🔗 tRPC endpoint: /trpc                    ║
║ 💚 Health check: /health                   ║
║ 📊 Status: /status                         ║
╚════════════════════════════════════════════╝
```

---

## Configuration

### Required Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `FLASK_API_URL` | Flask backend URL | `http://localhost:5000` |
| `FLASK_API_KEY` | API authentication | `your-key-here` |
| `JWT_SECRET` | Token signing | `your-jwt-secret` |

### Optional Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `COMPOSIO_API_KEY` | WhatsApp automation | (disabled) |
| `OPENROUTER_API_KEY` | AI features | (disabled) |
| `REDIS_URL` | Cache layer | `redis://localhost:6379` |
| `LOG_LEVEL` | Logging detail | `debug` |
| `PORT` | Server port | `3000` |

### Getting API Keys

#### Composio (WhatsApp Integration)
1. Go to https://composio.dev
2. Sign up for free account
3. Create workspace
4. Generate API key
5. Add to `.env.local`

#### OpenRouter (AI Models)
1. Go to https://openrouter.ai
2. Sign up for account
3. Add payment method (credits: $5 free)
4. Create API key in settings
5. Add to `.env.local`

---

## Running the Server

### Development

```bash
npm run dev
# Watches for changes, auto-reloads
```

### Production Build

```bash
npm run build
npm start
```

### Docker

```bash
# Build image
docker build -t puraestate-trpc:latest .

# Run container
docker run -p 3000:3000 \
  -e FLASK_API_URL=http://flask-backend:5000 \
  -e COMPOSIO_API_KEY=your_key \
  -e OPENROUTER_API_KEY=your_key \
  puraestate-trpc:latest
```

---

## Testing

### 1. Health Check
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-25T...",
  "uptime": 123.456
}
```

### 2. Server Status
```bash
curl http://localhost:3000/status
```

Response:
```json
{
  "server": "TRPC",
  "port": 3000,
  "integrations": {
    "flask": { "url": "http://localhost:5000", "status": "connected" },
    "composio": { "configured": true },
    "openrouter": { "configured": true }
  }
}
```

### 3. Test tRPC Endpoint

Using `curl`:
```bash
curl -X POST http://localhost:3000/trpc/listings.list
```

Using React Native client:
```typescript
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from './trpc-server';

const trpc = createTRPCReact<AppRouter>();

// In component
const { data: listings } = trpc.listings.list.useQuery({
  propertyType: 'house',
  limit: 10,
});
```

### 4. Integration Tests

```bash
# Test Flask connectivity
curl http://localhost:5000/health

# Test Composio (if configured)
npm run dev
# Check logs for Composio initialization

# Test OpenRouter (if configured)
# Check logs for OpenRouter API calls
```

---

## Deployment

### Strategy: Hybrid Python/Node Stack

**Architecture:**
- **Flask Backend** (Python) - Core business logic, database
- **tRPC Server** (Node.js) - API gateway, Composio/OpenRouter
- **React Native App** - Calls tRPC Server

### Option 1: Heroku (Easiest)

#### Prerequisites
- Heroku account (free tier available)
- Heroku CLI installed

#### Steps

```bash
# 1. Create Heroku app
heroku create puraestate-trpc

# 2. Set environment variables
heroku config:set FLASK_API_URL=https://puraestate-flask.herokuapp.com
heroku config:set COMPOSIO_API_KEY=your_composio_key
heroku config:set OPENROUTER_API_KEY=your_openrouter_key
heroku config:set NODE_ENV=production

# 3. Deploy
git push heroku main

# 4. Monitor logs
heroku logs --tail
```

**Costs:** Free tier includes 550 dyno hours/month (~22 days)

### Option 2: AWS ECS (Recommended for Scale)

#### Prerequisites
- AWS account
- AWS CLI configured
- ECR repository created

#### Steps

```bash
# 1. Build Docker image
docker build -t puraestate-trpc:latest .

# 2. Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker tag puraestate-trpc:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/puraestate-trpc:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/puraestate-trpc:latest

# 3. Create ECS task definition (using AWS Console or CLI)
aws ecs register-task-definition --cli-input-json file://task-definition.json

# 4. Create ECS service
aws ecs create-service --cluster puraestate --task-definition puraestate-trpc --service-name trpc-service

# 5. Monitor
aws ecs list-tasks --cluster puraestate
aws logs tail /ecs/puraestate-trpc --follow
```

**Estimated Costs:**
- Fargate: $0.04/vCPU/hour + $0.0045/GB/hour
- For t3.micro equivalent: ~$10/month

### Option 3: Docker Compose (Local/Dev)

```bash
# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  flask:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      FLASK_ENV: production
      DATABASE_URL: postgresql://...

  trpc:
    build: ./trpc-server
    ports:
      - "3000:3000"
    environment:
      FLASK_API_URL: http://flask:5000
      COMPOSIO_API_KEY: ${COMPOSIO_API_KEY}
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}
    depends_on:
      - flask

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
EOF

# Run
docker-compose up
```

---

## Production Checklist

- [ ] Flask backend accessible from tRPC server
- [ ] All environment variables set (use AWS Secrets Manager or similar)
- [ ] Composio API key configured and tested
- [ ] OpenRouter API key configured with sufficient credits
- [ ] CORS origins updated for production domain
- [ ] HTTPS enabled (required for React Native)
- [ ] Monitoring/logging configured (CloudWatch, DataDog, etc.)
- [ ] Rate limiting configured (to prevent abuse)
- [ ] Error tracking enabled (Sentry recommended)

---

## Troubleshooting

### "Cannot connect to Flask backend"

```bash
# Check Flask is running
curl http://localhost:5000/health

# Check environment variable
echo $FLASK_API_URL

# Check network (if Docker)
docker network ls
docker inspect puraestate-trpc
```

### "Composio: API key not set"

This is OK in development. For production:
```bash
# Verify key is set
echo $COMPOSIO_API_KEY

# Test Composio connection
curl -H "x-api-key: $COMPOSIO_API_KEY" \
  https://backend.composio.dev/api/v2/connectedAccounts
```

### "OpenRouter requests failing"

```bash
# Check API key
echo $OPENROUTER_API_KEY

# Check credits
# Go to https://openrouter.ai/account

# Test API
curl https://openrouter.ai/api/v1/auth/key \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

### "tRPC endpoint returns 404"

```bash
# Verify endpoint format
curl -X POST http://localhost:3000/trpc/listings.list

# Check server is running
curl http://localhost:3000/health

# Check logs
npm run dev
```

### "CORS errors from React Native"

```bash
# Update CORS_ORIGIN in .env.local
CORS_ORIGIN=exp://YOUR_EXP_URL,http://localhost:8081

# Restart server
npm run dev
```

---

## Performance Optimization

### Caching (Redis)

Enable Redis caching for frequently accessed data:

```typescript
// In flask-gateway.ts
const cacheKey = `listings:${JSON.stringify(filters)}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const result = await this.client.get('/api/listings', { params: filters });
await redis.setex(cacheKey, 3600, JSON.stringify(result)); // 1 hour TTL
return result;
```

### Query Batching

tRPC automatically batches requests:
- Multiple queries in single HTTP request
- Reduces latency for mobile apps

### Compression

Enable gzip compression in Express:

```typescript
import compression from 'compression';
app.use(compression());
```

---

## Monitoring & Logging

### Log Levels

```env
LOG_LEVEL=debug    # Development
LOG_LEVEL=info     # Production
LOG_LEVEL=error    # Emergency
```

### Recommended Monitoring Stack

1. **Logging:** Sentry or DataDog
2. **Performance:** New Relic or Datadog APM
3. **Uptime:** Pingdom or UptimeRobot
4. **Analytics:** Segment or Amplitude

---

## Next Steps

1. ✅ Setup local development server
2. ✅ Test Flask integration
3. ⬜ Connect React Native client
4. ⬜ Deploy to staging (Heroku)
5. ⬜ Load testing (k6 or Artillery)
6. ⬜ Production deployment (AWS ECS)
7. ⬜ Monitor and optimize

---

**Last Updated:** 2026-02-25
**Status:** Production-Ready
