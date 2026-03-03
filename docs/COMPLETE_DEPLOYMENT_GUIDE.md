# PuraEstate - Complete Deployment & Setup Documentation

**Version:** 2.0
**Last Updated:** February 24, 2026
**Status:** Production-Ready
**Author:** PuraEstate Engineering Team

---

## Table of Contents

1. [Quick Start Guide (30 Minutes)](#quick-start-guide)
2. [Deployment Guide](#deployment-guide)
3. [Google Play Store Submission](#google-play-store-submission)
4. [Architecture Documentation](#architecture-documentation)
5. [API Documentation](#api-documentation)
6. [Development Guide](#development-guide)
7. [Troubleshooting Guide](#troubleshooting-guide)
8. [Operational Runbooks](#operational-runbooks)

---

## Quick Start Guide

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher (or yarn)
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose (optional but recommended)
- Git
- macOS/Linux/WSL2 (Windows)

### Step 1: Clone Repository

```bash
# Clone the main repository
git clone https://github.com/puraestate/puraestate-monorepo.git
cd puraestate-monorepo

# Install root dependencies
npm install

# Install workspace dependencies
npm install --workspaces
```

### Step 2: Environment Setup

```bash
# Create .env.local in root directory
cat > .env.local << 'EOF'
# Backend
BACKEND_PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://puraestate:password@localhost:5432/puraestate_dev
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRY=24h
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key-min-32-characters-long

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=puraestate-dev

# External APIs
OPENROUTER_API_KEY=sk-xxx
COMPOSIO_API_KEY=xxx
STRIPE_SECRET_KEY=sk_test_xxx
SENDGRID_API_KEY=SG.xxx
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-email

# Datadog (optional)
DATADOG_API_KEY=xxx
DATADOG_APP_ID=xxx
DATADOG_CLIENT_TOKEN=xxx

# URLs
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:3000
MOBILE_API_URL=http://localhost:3000

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_COMPOSIO=true
ENABLE_PAYMENT=false
EOF

# Copy to workspace directories
cp .env.local apps/backend/.env.local
cp .env.local apps/web/.env.local
cp .env.local apps/mobile/.env.local
```

### Step 3: Database Initialization

```bash
# Create PostgreSQL database
createdb puraestate_dev
createuser puraestate -P  # Set password to 'password'

# Run migrations
npm run migrate

# Seed initial data (optional)
npm run seed
```

### Step 4: Start Development Servers

```bash
# Terminal 1: Start backend
cd apps/backend
npm run dev
# Logs: Backend running on http://localhost:3000

# Terminal 2: Start web frontend
cd apps/web
npm run dev
# Logs: Web app on http://localhost:3001

# Terminal 3: Start mobile (if testing locally)
cd apps/mobile
npm run dev
# Logs: Expo running on Metro Bundler
```

### Step 5: Verify Installation

```bash
# Check backend health
curl http://localhost:3000/api/health
# Expected: { "status": "healthy", "timestamp": "2024-02-24T10:00:00Z" }

# Check web app
open http://localhost:3001

# Test API
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Step 6: Test on Device

**iOS (Apple Silicon/Intel Mac):**
```bash
cd apps/mobile
npx eas build --platform ios
npx eas build --platform ios --profile preview  # For testing
```

**Android:**
```bash
cd apps/mobile
npx eas build --platform android
npx eas build --platform android --profile preview  # For testing
```

**Web:**
- Navigate to http://localhost:3001 in browser
- Test signup, login, create listing, search
- Verify mobile responsiveness (DevTools)

---

## Deployment Guide

### Pre-Deployment Checklist

- [ ] All tests passing: `npm test`
- [ ] Lint passing: `npm run lint`
- [ ] Environment variables configured
- [ ] Database backups up-to-date
- [ ] SSL certificates valid
- [ ] Fire permission rules reviewed
- [ ] Rate limiting configured
- [ ] Monitoring alerts set up
- [ ] Incident response plan documented

### Production Environment Setup

#### 1. Database Setup (PostgreSQL)

```bash
# Create production database
createdb puraestate_prod
createuser puraestate_prod -P

# Run migrations
psql -h prod-db.example.com -U puraestate_prod -d puraestate_prod -f migrations/001_initial_schema.sql

# Verify
psql -h prod-db.example.com -U puraestate_prod -d puraestate_prod -c "\dt"
```

#### 2. Redis Setup

```bash
# Production Redis cluster (recommended)
redis-cli -h prod-redis.example.com -p 6379 ping
# Expected: PONG

# Test connection
redis-cli -h prod-redis.example.com --ldb --eval test.lua
```

#### 3. AWS S3 Setup

```bash
# Create S3 bucket
aws s3api create-bucket \
  --bucket puraestate-prod \
  --region us-east-1 \
  --create-bucket-configuration LocationConstraint=us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket puraestate-prod \
  --versioning-configuration Status=Enabled

# Set lifecycle policy (delete old versions after 90 days)
aws s3api put-bucket-lifecycle-configuration \
  --bucket puraestate-prod \
  --lifecycle-configuration file://lifecycle-policy.json

# Block public access
aws s3api put-public-access-block \
  --bucket puraestate-prod \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable CORS for images
aws s3api put-bucket-cors \
  --bucket puraestate-prod \
  --cors-configuration file://cors-config.json
```

#### 4. Firebase Setup

```bash
# Initialize Firebase project
firebase projects:create puraestate-prod --display-name="PuraEstate Production"

# Enable required services
firebase firestore:databases:create --database-id=default
firebase storage:buckets:create --bucket=puraestate-prod.appspot.com

# Configure authentication
firebase auth:configure-oauth-providers --user-service-account puraestate-prod

# Deploy Firebase functions (see Cloud Functions section)
firebase deploy
```

#### 5. API Keys Configuration

```bash
# Create secure secrets file
mkdir -p /etc/puraestate
chmod 700 /etc/puraestate

# Store in AWS Secrets Manager (recommended)
aws secretsmanager create-secret \
  --name puraestate/prod/env \
  --description "PuraEstate production environment variables" \
  --secret-string file://prod-secrets.json

# Grant access to deployment role
aws secretsmanager put-resource-policy \
  --secret-id puraestate/prod/env \
  --policy file://secret-policy.json
```

### Docker Deployment

#### 1. Build Docker Images

```bash
# Build backend image
docker build -f docker/Dockerfile.backend \
  -t puraestate-backend:latest \
  -t puraestate-backend:v2.0.0 \
  .

# Build web frontend image
docker build -f docker/Dockerfile.web \
  -t puraestate-web:latest \
  -t puraestate-web:v2.0.0 \
  .

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

docker tag puraestate-backend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/puraestate-backend:latest
docker tag puraestate-web:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/puraestate-web:latest

docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/puraestate-backend:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/puraestate-web:latest
```

#### 2. Docker Compose Deployment (Staging)

```bash
# Create production docker-compose.yml
docker-compose -f docker-compose.prod.yml up -d

# Verify services running
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f web
```

### Kubernetes Deployment (Production)

#### 1. Create Namespace

```bash
# Create namespace
kubectl create namespace puraestate-prod

# Create secrets
kubectl create secret generic app-secrets \
  --from-literal=database-url='postgresql://...' \
  --from-literal=jwt-secret='...' \
  --from-literal=redis-url='redis://...' \
  -n puraestate-prod

# Verify
kubectl get secrets -n puraestate-prod
```

#### 2. Deploy Backend

```bash
# Apply backend deployment
kubectl apply -f k8s/deployments/backend.yaml -n puraestate-prod

# Verify deployment
kubectl get deployments -n puraestate-prod
kubectl get pods -n puraestate-prod

# Check logs
kubectl logs -n puraestate-prod deployment/puraestate-backend --tail=100

# Watch rollout status
kubectl rollout status deployment/puraestate-backend -n puraestate-prod
```

#### 3. Deploy Web Frontend

```bash
# Apply web deployment
kubectl apply -f k8s/deployments/web.yaml -n puraestate-prod

# Verify
kubectl get svc -n puraestate-prod

# Get external IP
kubectl get svc puraestate-web -n puraestate-prod
```

#### 4. Setup Ingress

```bash
# Install nginx-ingress (if not already installed)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.0/deploy/static/provider/aws/deploy.yaml

# Apply ingress configuration
kubectl apply -f k8s/ingress/puraestate-ingress.yaml -n puraestate-prod

# Get ingress IP
kubectl get ingress -n puraestate-prod
```

#### 5. Configure SSL/TLS with cert-manager

```bash
# Install cert-manager
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.13.0

# Apply certificate issuer
kubectl apply -f k8s/cert-issuer/letsencrypt-prod.yaml -n puraestate-prod

# Verify certificate issued
kubectl get certificates -n puraestate-prod
kubectl describe certificate puraestate-cert -n puraestate-prod
```

### Cloud Functions Deployment

#### 1. Deploy Firebase Functions

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Authenticate
firebase login

# Deploy functions
cd functions
npm install
npm run build
firebase deploy --only functions --project puraestate-prod

# Verify deployment
firebase functions:list --project puraestate-prod
```

#### 2. Deploy Google Cloud Functions

```bash
# Deploy onNewListing function
gcloud functions deploy onNewListing \
  --runtime nodejs18 \
  --trigger-topic listing.created \
  --set-env-vars SENDGRID_API_KEY=xxx,TWILIO_ACCOUNT_SID=xxx \
  --project puraestate-prod

# Deploy notificationService function
gcloud functions deploy notificationService \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --project puraestate-prod

# View logs
gcloud functions log read onNewListing --limit 50 --project puraestate-prod
```

### Monitoring & Alerts Setup

#### 1. Datadog Setup

```bash
# Install Datadog agent
DD_AGENT_MAJOR_VERSION=7 DD_API_KEY=xxx DD_SITE=datadoghq.com bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_mac_os.sh)"

# Configure APM
cat > /etc/datadog-agent/conf.d/apm.yaml << 'EOF'
apm_config:
  enabled: true
  bind_host: localhost
  bind_port: 8126
EOF

# Configure logs
cat > /etc/datadog-agent/conf.d/nodejs.yaml << 'EOF'
logs:
  - type: file
    path: /var/log/puraestate/app.log
    service: puraestate-backend
    source: nodejs
EOF

# Restart agent
sudo systemctl restart datadog-agent

# Verify
sudo systemctl status datadog-agent
```

#### 2. Create Monitoring Dashboard

```bash
# Use Datadog API to create custom dashboard
curl -X POST https://api.datadoghq.com/api/v1/dashboard \
  -H "DD-API-KEY: xxx" \
  -H "DD-APPLICATION-KEY: xxx" \
  -d '{
    "title": "PuraEstate Production Dashboard",
    "layout_type": "ordered",
    "widgets": [
      {
        "type": "metric",
        "query": "avg:system.cpu{service:puraestate}"
      },
      {
        "type": "metric",
        "query": "avg:system.mem{service:puraestate}"
      }
    ]
  }'
```

#### 3. Setup Alerts

```bash
# High error rate alert
cat > alerts/high-error-rate.yaml << 'EOF'
type: metric_alert
name: High Error Rate - PuraEstate
query: |
  avg(last_5m):avg:trace.web.request.errors{service:puraestate} > 0.01
threshold: 0.01
notify_no_data: true
notification_list:
  - "@ops-team@puraestate.com"
EOF

# Slow API response alert
cat > alerts/slow-api.yaml << 'EOF'
type: metric_alert
name: Slow API Response - PuraEstate
query: |
  avg(last_5m):p99:trace.web.request.duration{service:puraestate} > 500
threshold: 500
notify_no_data: true
EOF

# Deploy alerts
dd-cli alerts apply alerts/
```

---

## Google Play Store Submission

### Phase 1: Account & Project Setup

#### 1. Create Google Play Developer Account

```bash
# Visit https://play.google.com/console
# Sign in with Google Account
# Complete payment ($25 registration fee)
# Accept terms and policies
# Create organization profile
```

#### 2. Create App Project

```bash
# In Play Console > All apps > Create app
# App name: "PuraEstate"
# Select category: "Lifestyle" or "Business"
# Select content rating: "12+" (property listings)
# Privacy policy: https://puraestate.com/privacy
# Contact email: support@puraestate.com
```

#### 3. App Bundle Setup

```bash
# Create new signing key (first time only)
# OR use existing key in Firebase Console

# Required assets:
# - App name (50 chars max): "PuraEstate Real Estate"
# - Short description (80 chars): "Buy, sell, or rent properties"
# - Full description (4000 chars): [See marketing copy]
# - Screenshots (2-8 images, 1080x1920px)
# - Feature graphic (1024x500px)
# - Promo graphic (180x120px)
# - App icon (512x512px)
```

### Phase 2: APK/Bundle Generation & Signing

#### 1. Generate Signing Key

```bash
# Create keystore (first time only)
keytool -genkey -v -keystore puraestate-key.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias puraestate \
  -storepass puraestate123 \
  -keypass puraestate123 \
  -dname "CN=PuraEstate,O=PuraEstate,L=San Francisco,S=CA,C=US"

# Store securely
mv puraestate-key.jks /secure/location/
chmod 600 /secure/location/puraestate-key.jks
```

#### 2. Build Release Bundle

```bash
# Configure build settings in app.json
cat > apps/mobile/app.json << 'EOF'
{
  "expo": {
    "name": "PuraEstate",
    "slug": "puraestate",
    "version": "1.0.0",
    "build": {
      "android": {
        "buildType": "app-bundle",
        "releaseChannel": "production",
        "keystorePath": "/secure/location/puraestate-key.jks",
        "keystorePassword": "puraestate123",
        "keyAlias": "puraestate",
        "keyPassword": "puraestate123"
      }
    }
  }
}
EOF

# Build for production
cd apps/mobile
eas build --platform android --profile production

# Build logs saved to .eas/
```

#### 3. Build Web APK Alternative

```bash
# If using React Native without Expo
cd apps/mobile

# Generate release APK
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk

# Generate App Bundle (AAB)
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab

# Sign the APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore puraestate-key.jks \
  android/app/build/outputs/bundle/release/app-release.aab \
  puraestate

# Verify signature
jarsigner -verify -verbose -certs \
  android/app/build/outputs/bundle/release/app-release.aab
```

### Phase 3: Upload to Play Store

#### 1. Create Release Build

```bash
# In Play Console:
# 1. Select app (PuraEstate)
# 2. Navigate to Release > Production
# 3. Click "Create new release"
# 4. Upload AAB/APK file
# 5. Set version code: 1, version name: 1.0.0
```

#### 2. Complete Store Listing

```
Content rating questionnaire:
- Violence: None
- Sexual content: None
- Profanity: None
- Alcohol/tobacco: None
- Gambling: None
- Malware: Confirmed NO
- Sensitive info: No (for privacy)

Pricing & distribution:
- Price: Free
- Countries: All available
- Content rating: 12+ (Mild content)
- Device requirements: Android 8.0+
- Permissions: Camera, Location, Contacts
```

#### 3. Add Privacy Policy

```bash
# Add privacy policy URL
# https://puraestate.com/privacy

# Add terms of service
# https://puraestate.com/terms

# Add contact info
# support@puraestate.com
```

### Phase 4: Submit for Review

#### 1. Final Checklist

- [x] All required fields completed
- [x] Screenshots uploaded (minimum 2)
- [x] Feature graphic (1024x500)
- [x] Privacy policy URL active
- [x] Contact email verified
- [x] Content rating questionnaire submitted
- [x] Testing instructions provided (if needed)

#### 2. Submit for Review

```bash
# In Play Console:
# 1. Review all content
# 2. Click "Submit to review"
# 3. Confirm submission

# Review typically takes 24-48 hours
# Monitor status in Release notes section
```

#### 3. Track Review Status

```bash
# Check status in Play Console
# - In review
# - Rejected (if issues)
# - Ready to release
# - Live

# Response time: 24-72 hours typically
# Common rejection reasons:
# - Incomplete metadata
# - Policy violations
# - Crashed during testing
# - Misleading screenshots
```

### Phase 5: Post-Launch Management

#### 1. Monitor Performance

```bash
# In Play Console > Statistics:
- Downloads & Installs (daily/weekly)
- Active device installs
- Uninstalls
- Crashes & ANRs
- Star ratings
```

#### 2. Respond to Reviews

```bash
# Monitor feedback regularly
# Respond to:
- Low ratings (resolve issues)
- Bug reports (acknowledge, fix)
- Feature requests (acknowledge)

# Template responses:
"Thank you for your feedback! We're constantly improving PuraEstate.
Please contact us at support@puraestate.com for specific issues."
```

#### 3. Plan Updates

```bash
# Update cadence:
- Bug fixes: As needed (hotfix)
- Features: Every 2 weeks (bi-weekly)
- Major updates: Every quarter

# Update checklist:
- [ ] Bump version code
- [ ] Update version name
- [ ] Write release notes
- [ ] Test on multiple devices
- [ ] Build & sign APK/AAB
- [ ] Upload to Play Console
- [ ] Set rollout %
- [ ] Monitor crashes
- [ ] Full rollout after 24-48 hours
```

---

## Architecture Documentation

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  Mobile (React Native/Expo)  │  Web (Next.js)  │  Admin (React)  │
└─────────────────┬──────────────────┬────────────────┬─────────────┘
                  │                  │                │
                  └──────────────────┼────────────────┘
                                     │ (REST/WebSocket)
                     ┌───────────────▼────────────────┐
                     │      API Gateway (Nginx)       │
                     │  - Rate Limiting               │
                     │  - Request Validation          │
                     │  - SSL/TLS Termination         │
                     └───────────────┬────────────────┘
                                     │
┌────────────────────────────────────▼──────────────────────────────┐
│                    Application Layer                              │
├────────────────────────────────────────────────────────────────────┤
│  Backend (Node.js/Express)                                        │
│  - Authentication & Authorization                                 │
│  - Business Logic                                                 │
│  - API Controllers                                                │
│  - WebSocket Server                                               │
└────────────────────────────────────────────────────────────────────┘
          │                        │                    │
    ┌─────▼──────┐         ┌──────▼──────┐     ┌──────▼──────┐
    │ PostgreSQL │         │    Redis    │     │  Firebase   │
    │ Database   │         │    Cache    │     │  Services   │
    └────────────┘         └─────────────┘     └─────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
            ┌───────▼────┐   ┌──────▼─────┐  ┌──────▼─────┐
            │  AWS S3    │   │ OpenRouter │  │ Composio  │
            │   Images   │   │    (AI)    │  │Automation │
            └────────────┘   └────────────┘  └───────────┘
```

### Data Flow Architecture

#### 1. User Registration Flow

```
Client Signup Request
    ↓
API Gateway (validation)
    ↓
AuthController.signup()
    ↓
AuthService.hashPassword()
    ↓
DB: Insert User
    ↓
Generate JWT Tokens
    ↓
Send Verification Email (Composio)
    ↓
Return tokens to Client
    ↓
Store tokens in localStorage
    ↓
Redirect to onboarding
```

#### 2. Listing Creation Flow

```
Client: Upload Images
    ↓
API Gateway
    ↓
ListingController.create()
    ↓
File Upload Handler
    ↓
AWS S3: Store Images
    ↓
Generate Thumbnails
    ↓
DB: Insert Listing
    ↓
Queue: onNewListing Event
    ↓
Composio Workflow
    ├─ Send confirmation email
    ├─ Send WhatsApp message
    └─ Schedule follow-up
    ↓
Return listing ID
```

#### 3. Real-Time Messaging Flow

```
Client 1: Send Message
    ↓
WebSocket Server
    ↓
MessageService.save()
    ↓
DB: Insert Message
    ↓
Cache: Update conversation
    ↓
Emit to Client 2 (WebSocket)
    ↓
Push Notification (Firebase)
    ↓
Mark unread count
```

### Component Architecture

#### Backend Services

```
packages/backend/
├── src/
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── middlewares/      # Auth, validation, logging
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── utils/            # Helpers
│   ├── config/           # Configuration
│   └── index.ts          # App entry point
├── migrations/           # Database schemas
├── tests/                # Unit & integration tests
└── docker/              # Dockerfile
```

#### Frontend Architecture

```
apps/web/
├── src/
│   ├── app/              # Next.js pages
│   ├── components/       # React components
│   ├── hooks/            # Custom hooks
│   ├── lib/
│   │   ├── api/          # API client
│   │   ├── store/        # State management
│   │   └── utils/        # Helpers
│   ├── styles/           # Tailwind CSS
│   └── types/            # TypeScript types
├── public/               # Static files
└── tests/                # Tests
```

#### Mobile Architecture

```
apps/mobile/
├── app/
│   ├── (tabs)/           # Bottom tab navigation
│   │   ├── home.tsx
│   │   ├── search.tsx
│   │   ├── messages.tsx
│   │   └── profile.tsx
│   ├── auth/             # Auth screens
│   └── listing/          # Listing screens
├── lib/
│   ├── api/              # API client
│   ├── sqlite/           # Local database
│   ├── store/            # State management
│   └── utils/
├── components/           # Reusable components
└── assets/               # Images, icons
```

### Database Schema

#### Core Tables

**users**
```
id: UUID PRIMARY KEY
email: VARCHAR(255) UNIQUE NOT NULL
password_hash: VARCHAR(255)
first_name: VARCHAR(100)
last_name: VARCHAR(100)
phone: VARCHAR(20)
profile_photo_url: VARCHAR(500)
bio: TEXT
status: ENUM (ACTIVE, SUSPENDED, DELETED) DEFAULT ACTIVE
email_verified: BOOLEAN DEFAULT FALSE
kyc_status: ENUM (PENDING, VERIFIED, REJECTED) DEFAULT PENDING
average_rating: DECIMAL(3,2)
total_reviews: INT
notification_preferences: JSONB
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP DEFAULT NOW()
```

**listings**
```
id: UUID PRIMARY KEY
user_id: UUID FOREIGN KEY REFERENCES users(id)
title: VARCHAR(255) NOT NULL
description: TEXT
category: VARCHAR(50) NOT NULL
price: DECIMAL(12,2)
price_currency: VARCHAR(3) DEFAULT 'USD'
price_negotiable: BOOLEAN DEFAULT FALSE
location_lat: DECIMAL(10,8)
location_lng: DECIMAL(11,8)
location_address: VARCHAR(500)
image_urls: TEXT[]
status: ENUM (DRAFT, ACTIVE, SOLD, ARCHIVED) DEFAULT DRAFT
view_count: INT DEFAULT 0
save_count: INT DEFAULT 0
slug: VARCHAR(255) UNIQUE
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP DEFAULT NOW()
published_at: TIMESTAMP
```

**conversations**
```
id: UUID PRIMARY KEY
user_1_id: UUID FOREIGN KEY REFERENCES users(id)
user_2_id: UUID FOREIGN KEY REFERENCES users(id)
listing_id: UUID FOREIGN KEY REFERENCES listings(id)
last_message_at: TIMESTAMP
created_at: TIMESTAMP DEFAULT NOW()
UNIQUE(user_1_id, user_2_id)
```

**messages**
```
id: UUID PRIMARY KEY
conversation_id: UUID FOREIGN KEY
sender_id: UUID FOREIGN KEY REFERENCES users(id)
recipient_id: UUID FOREIGN KEY REFERENCES users(id)
content: TEXT NOT NULL
content_type: ENUM (TEXT, IMAGE, DOCUMENT) DEFAULT TEXT
attachment_url: VARCHAR(500)
is_read: BOOLEAN DEFAULT FALSE
created_at: TIMESTAMP DEFAULT NOW()
```

### Indexes

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_location ON listings USING GIST (ll_to_earth(location_lat, location_lng));
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_is_read ON messages(is_read) WHERE is_read = false;
```

### API Endpoints Summary

#### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

#### Listings
- `POST /api/listings` - Create listing
- `GET /api/listings` - List all listings (paginated)
- `GET /api/listings/:id` - Get listing details
- `PATCH /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Delete listing
- `POST /api/listings/:id/images` - Upload images

#### Search
- `POST /api/search` - Advanced search
- `GET /api/search/autocomplete` - Search suggestions

#### Messaging
- `GET /api/conversations` - List conversations
- `POST /api/conversations/:id/messages` - Send message
- `GET /api/conversations/:id/messages` - Get message history

#### Users
- `GET /api/users/me` - Get current user
- `GET /api/users/:id` - Get user profile
- `PATCH /api/users/profile` - Update profile
- `POST /api/users/profile-photo` - Upload photo

---

## API Documentation

See `/home/tjdavis/PURAESTATE_API_REFERENCE.md` for complete API documentation including:
- All endpoints
- Request/response formats
- Error codes
- Rate limiting
- WebSocket events
- Code examples in multiple languages

---

## Development Guide

### Code Style & Standards

#### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### ESLint Rules

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-types': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  }
}
```

#### Prettier Config

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always"
}
```

### Naming Conventions

#### Files & Directories
```
controllers/
  UserController.ts       # PascalCase for classes
  listing.controller.ts   # kebab-case for files

utils/
  formatDate.ts          # camelCase for functions
  parseJSON.ts

types/
  user.types.ts          # kebab-case
  listingTypes.ts

services/
  AuthService.ts         # PascalCase for services
```

#### Variables & Functions
```typescript
// Constants: UPPER_SNAKE_CASE
const JWT_EXPIRY = '24h'
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

// Variables: camelCase
let currentUser: User
const listingTitle = 'Beautiful House'

// Functions: camelCase
function fetchListings(): Promise<Listing[]> {}
const validateEmail = (email: string): boolean => {}

// Classes & Types: PascalCase
class UserService {}
interface UserProfile {}
type ListingStatus = 'DRAFT' | 'ACTIVE' | 'SOLD'
```

### Component Patterns

#### Service Pattern (Backend)

```typescript
// User.service.ts
export class UserService {
  constructor(private db: Database, private cache: Cache) {}

  async findById(id: string): Promise<User> {
    // Check cache first
    const cached = await this.cache.get(`user:${id}`)
    if (cached) return cached

    // Query database
    const user = await this.db.query('SELECT * FROM users WHERE id = $1', [id])

    // Cache result
    await this.cache.set(`user:${id}`, user, 3600)

    return user
  }

  async create(data: CreateUserDTO): Promise<User> {
    // Validate
    this.validateUserData(data)

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12)

    // Insert
    const result = await this.db.query(
      'INSERT INTO users (...) VALUES (...) RETURNING *',
      [...]
    )

    // Invalidate cache
    await this.cache.del('users:list')

    return result.rows[0]
  }
}
```

#### Controller Pattern (Backend)

```typescript
// User.controller.ts
export class UserController {
  constructor(private userService: UserService) {}

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id
      const user = await this.userService.findById(userId)

      if (!user) {
        res.status(404).json({ error: 'User not found' })
        return
      }

      res.json({ user })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id
      const updatedUser = await this.userService.update(userId, req.body)
      res.json({ user: updatedUser })
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  }
}
```

#### React Hook Pattern (Frontend)

```typescript
// useListings.ts
export function useListings(filter?: ListingFilter) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true)
        const data = await api.get('/listings', { params: filter })
        setListings(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch'))
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [filter])

  return { listings, loading, error, refetch: fetchListings }
}
```

#### React Component Pattern (Frontend)

```typescript
// ListingCard.tsx
interface ListingCardProps {
  listing: Listing
  onSelect?: (listing: Listing) => void
}

export function ListingCard({ listing, onSelect }: ListingCardProps) {
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = async () => {
    try {
      await api.post(`/listings/${listing.id}/save`)
      setIsSaved(true)
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  return (
    <div
      onClick={() => onSelect?.(listing)}
      className="bg-white rounded-lg shadow hover:shadow-lg transition"
    >
      <img src={listing.imageUrls[0]} alt={listing.title} className="w-full h-40 object-cover" />
      <div className="p-4">
        <h3 className="font-semibold text-lg">{listing.title}</h3>
        <p className="text-gray-600">${listing.price.toLocaleString()}</p>
        <button
          onClick={handleSave}
          className={`mt-2 px-4 py-2 rounded ${isSaved ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          {isSaved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  )
}
```

### State Management Patterns

#### Backend State (Redis Cache)

```typescript
// Zustand store initialization
import { create } from 'zustand'

interface StoreState {
  user: User | null
  setUser: (user: User) => void
  clearUser: () => void
}

export const useStore = create<StoreState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null })
}))
```

#### Frontend State (Zustand)

```typescript
// store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  restoreSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: async (email, password) => {
        const { user, accessToken } = await api.post('/auth/login', { email, password })
        set({ user, token: accessToken })
      },
      logout: () => set({ user: null, token: null }),
      restoreSession: async () => {
        try {
          const { user } = await api.get('/users/me')
          set({ user })
        } catch {
          set({ user: null, token: null })
        }
      }
    }),
    {
      name: 'auth-storage'
    }
  )
)
```

### Testing Strategy

#### Unit Tests (Jest)

```typescript
// __tests__/services/UserService.test.ts
describe('UserService', () => {
  let userService: UserService
  let mockDb: jest.Mocked<Database>

  beforeEach(() => {
    mockDb = {
      query: jest.fn()
    } as any
    userService = new UserService(mockDb)
  })

  describe('findById', () => {
    it('should return user by id', async () => {
      const mockUser = { id: '1', email: 'test@example.com' }
      mockDb.query.mockResolvedValue({ rows: [mockUser] })

      const user = await userService.findById('1')
      expect(user).toEqual(mockUser)
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE id'),
        ['1']
      )
    })

    it('should throw error if user not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] })

      await expect(userService.findById('1')).rejects.toThrow('User not found')
    })
  })
})
```

#### Integration Tests (Jest + Supertest)

```typescript
// __tests__/routes/auth.test.ts
import request from 'supertest'
import app from '@/app'

describe('Auth Routes', () => {
  describe('POST /api/auth/signup', () => {
    it('should create new user', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        })

      expect(response.status).toBe(201)
      expect(response.body.user.email).toBe('test@example.com')
      expect(response.body.accessToken).toBeDefined()
    })

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        })

      expect(response.status).toBe(400)
    })
  })
})
```

#### E2E Tests (Playwright)

```typescript
// e2e/listing.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Listing Creation', () => {
  test('should create a new listing', async ({ page, context }) => {
    // Login
    await page.goto('http://localhost:3001/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'Password123!')
    await page.click('button[type="submit"]')
    await page.waitForNavigation()

    // Create listing
    await page.goto('http://localhost:3001/listings/create')
    await page.fill('[name="title"]', 'Beautiful 3-bedroom house')
    await page.fill('[name="description"]', 'Spacious family home')
    await page.fill('[name="price"]', '250000')

    // Upload images
    await page.setInputFiles('input[type="file"]', 'test-image.jpg')

    // Submit
    await page.click('button:has-text("Create Listing")')

    // Verify
    await expect(page).toHaveURL(/\/listings\/[a-f0-9-]+/)
    await expect(page.locator('h1')).toContainText('Beautiful 3-bedroom house')
  })
})
```

---

## Troubleshooting Guide

### Common Issues & Solutions

#### Issue: Database Connection Failed

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**

```bash
# 1. Check PostgreSQL is running
sudo systemctl status postgresql
# or on macOS with Homebrew
brew services list | grep postgres

# 2. Verify connection string
psql postgresql://user:password@localhost:5432/puraestate_dev

# 3. Check database exists
psql -l | grep puraestate

# 4. Check user permissions
psql -U puraestate -d puraestate_dev -c "SELECT 1"

# 5. Reset database
dropdb puraestate_dev
createdb puraestate_dev
npm run migrate
```

#### Issue: Redis Connection Timeout

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solutions:**

```bash
# 1. Check Redis is running
redis-cli ping
# Expected: PONG

# 2. Check Redis configuration
redis-cli config get port
redis-cli config get bind

# 3. Restart Redis
redis-cli shutdown
redis-server /etc/redis/redis.conf

# 4. Test connection
redis-cli -h localhost -p 6379 PING
```

#### Issue: JWT Token Expired

**Symptoms:**
```json
{
  "error": "Unauthorized",
  "message": "Token expired"
}
```

**Solutions:**

```bash
# 1. Check token expiry
const payload = jwt.decode(token)
console.log(payload.exp * 1000) // Unix timestamp in ms

# 2. Use refresh token
POST /api/auth/refresh
{
  "refreshToken": "..."
}

# 3. Check JWT_SECRET is set
echo $JWT_SECRET
# Should output secret, not empty

# 4. Verify in .env.local
cat .env.local | grep JWT
```

#### Issue: Image Upload Fails

**Symptoms:**
```
Error: Access Denied to S3 bucket
```

**Solutions:**

```bash
# 1. Check AWS credentials
aws sts get-caller-identity
# Should return account info

# 2. Verify S3 bucket exists
aws s3 ls s3://puraestate-dev

# 3. Check bucket permissions
aws s3api get-bucket-acl --bucket puraestate-dev

# 4. Verify IAM policy
aws iam get-user-policy --user-name puraestate --policy-name s3-access

# 5. Test S3 upload
aws s3 cp test.jpg s3://puraestate-dev/test.jpg
```

#### Issue: WebSocket Connection Failed

**Symptoms:**
```
WebSocket connection to 'ws://localhost:3000' failed
```

**Solutions:**

```bash
# 1. Check backend is running
curl http://localhost:3000/health

# 2. Verify WebSocket server is enabled
grep -n "WebSocket\|socket.io" packages/backend/src/index.ts

# 3. Check CORS configuration
# In backend, ensure CORS allows your frontend origin

# 4. Test WebSocket connection
npx wscat -c ws://localhost:3000/socket.io

# 5. Check firewall/proxy
netstat -an | grep 3000
```

### Performance Optimization

#### Database Query Optimization

```typescript
// Slow query (N+1 problem)
const listings = await db.query('SELECT * FROM listings')
for (const listing of listings) {
  const seller = await db.query('SELECT * FROM users WHERE id = $1', [listing.user_id])
  listing.seller = seller
}

// Optimized (Single query with JOIN)
const listings = await db.query(`
  SELECT l.*, u.* FROM listings l
  LEFT JOIN users u ON l.user_id = u.id
  ORDER BY l.created_at DESC
  LIMIT $1 OFFSET $2
`, [limit, offset])
```

#### Redis Caching Strategy

```typescript
// Implement cache-aside pattern
async function getListingWithCache(id: string): Promise<Listing> {
  // Check cache
  const cached = await redis.get(`listing:${id}`)
  if (cached) return JSON.parse(cached)

  // Fetch from DB if not in cache
  const listing = await db.query('SELECT * FROM listings WHERE id = $1', [id])

  // Store in cache (1 hour expiry)
  await redis.setex(`listing:${id}`, 3600, JSON.stringify(listing))

  return listing
}
```

#### API Response Optimization

```typescript
// Implement pagination
GET /api/listings?page=1&limit=20

// Implement field selection
GET /api/listings?fields=id,title,price

// Implement pagination + field selection
GET /api/listings?page=1&limit=20&fields=id,title,price

// Implement compression
app.use(compression())
```

#### Frontend Performance

```typescript
// Code splitting
const ListingDetail = lazy(() => import('@/pages/ListingDetail'))

// Image optimization
import Image from 'next/image'
<Image src={url} width={400} height={300} alt="Listing" />

// Component memoization
const ListingCard = memo(({ listing }) => (...))

// Lazy loading
const InfiniteListings = () => {
  const { data, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['listings'],
    queryFn: ({ pageParam = 1 }) => fetchListings(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPage
  })

  return (
    <InfiniteScroll
      dataLength={data?.pages.length}
      next={fetchNextPage}
      hasMore={hasNextPage}
    >
      {/* List items */}
    </InfiniteScroll>
  )
}
```

---

## Operational Runbooks

### Daily Operations

#### Morning Checks (8:00 AM)

```bash
#!/bin/bash
# daily-checks.sh

echo "=== PuraEstate Daily Health Check ==="

# 1. System Health
echo "1. Checking system health..."
curl -s http://localhost:3000/api/health | jq .

# 2. Database Connectivity
echo "2. Checking database..."
psql postgresql://user:pass@localhost/puraestate_prod -c "SELECT COUNT(*) as user_count FROM users;"

# 3. Redis Status
echo "3. Checking Redis..."
redis-cli ping

# 4. Disk Space
echo "4. Checking disk space..."
df -h | grep -E '^/dev|Filesystem'

# 5. Memory Usage
echo "5. Checking memory..."
free -h

# 6. Service Status
echo "6. Checking services..."
systemctl status puraestate-backend
systemctl status puraestate-web

# 7. Recent Errors
echo "7. Recent errors..."
tail -20 /var/log/puraestate/error.log

echo "=== End Daily Check ==="
```

#### Run daily checks:
```bash
chmod +x daily-checks.sh
./daily-checks.sh
```

#### Afternoon Monitoring (2:00 PM)

```bash
#!/bin/bash
# afternoon-monitoring.sh

echo "=== PuraEstate Afternoon Monitoring ==="

# 1. API Response Time
echo "1. API Response Time:"
for i in {1..5}; do
  time curl -s http://localhost:3000/api/listings | jq . > /dev/null
done

# 2. Active Connections
echo "2. Active Database Connections:"
psql postgresql://user:pass@localhost/puraestate_prod -c \
  "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"

# 3. Cache Hit Rate
echo "3. Redis Cache Info:"
redis-cli info stats | grep -E 'hits|misses'

# 4. Slow Queries
echo "4. Slow Queries:"
psql postgresql://user:pass@localhost/puraestate_prod -c \
  "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# 5. Top Error Codes
echo "5. Top Error Codes (last hour):"
grep "ERROR\|Exception" /var/log/puraestate/app.log | tail -20

echo "=== End Afternoon Monitoring ==="
```

### Weekly Maintenance

#### Database Maintenance (Saturday 2:00 AM)

```bash
#!/bin/bash
# weekly-db-maintenance.sh

echo "=== Database Maintenance ==="

# 1. Vacuum tables
psql postgresql://user:pass@localhost/puraestate_prod -c "VACUUM ANALYZE;"

# 2. Reindex
psql postgresql://user:pass@localhost/puraestate_prod -c "REINDEX DATABASE puraestate_prod;"

# 3. Check integrity
psql postgresql://user:pass@localhost/puraestate_prod -c "SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) FROM pg_database;"

# 4. Backup
pg_dump -h localhost -U puraestate_prod -d puraestate_prod | gzip > backup-$(date +%Y%m%d).sql.gz

# 5. Archive old logs
find /var/log/puraestate/ -name "*.log" -mtime +30 -exec gzip {} \;

echo "=== Maintenance Complete ==="
```

#### Cache Cleanup (Sunday 3:00 AM)

```bash
#!/bin/bash
# weekly-cache-cleanup.sh

echo "=== Cache Cleanup ==="

# Get cache memory usage before
BEFORE=$(redis-cli info memory | grep used_memory_human)
echo "Before cleanup: $BEFORE"

# 1. Remove expired keys
redis-cli eval "return redis.call('del', unpack(redis.call('keys', '*')))" 0

# 2. Defragment
redis-cli --latency-latest

# Get cache memory usage after
AFTER=$(redis-cli info memory | grep used_memory_human)
echo "After cleanup: $AFTER"

echo "=== Cleanup Complete ==="
```

### Incident Response

#### Database is Down

```bash
#!/bin/bash
# incident-db-down.sh

echo "=== Database Down Incident ==="

# 1. Alert team
# Send message to #incidents Slack channel
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-type: application/json' \
  -d '{"text":"ALERT: Database is down. Starting recovery procedures."}'

# 2. Check status
systemctl status postgresql

# 3. Check logs
tail -50 /var/log/postgresql/postgresql.log

# 4. Try restart
systemctl restart postgresql
sleep 5

# 5. Verify connection
psql postgresql://user:pass@localhost/puraestate_prod -c "SELECT 1" || {
  echo "Database still down. Escalating..."
  # Contact DBA
}

# 6. Notify users
# Post status page update

echo "=== Incident Response Complete ==="
```

#### High CPU Usage

```bash
#!/bin/bash
# incident-high-cpu.sh

echo "=== High CPU Usage Incident ==="

# 1. Get top processes
ps aux | sort -rnk 3 | head -10

# 2. Check running queries (PostgreSQL)
psql postgresql://user:pass@localhost/puraestate_prod -c \
  "SELECT pid, query, query_start FROM pg_stat_activity WHERE state = 'active';"

# 3. Kill long-running queries
psql postgresql://user:pass@localhost/puraestate_prod -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE query_start < now() - interval '30 minutes';"

# 4. Restart problematic services
systemctl restart puraestate-backend

# 5. Monitor recovery
watch -n 1 "top -bn1 | head -15"

echo "=== Incident Resolution Complete ==="
```

#### High Memory Usage

```bash
#!/bin/bash
# incident-high-memory.sh

echo "=== High Memory Usage Incident ==="

# 1. Check memory status
free -h
vmstat -s

# 2. Find memory hogs
ps aux | sort -rnk 4 | head -10

# 3. Clear page cache
sync; echo 3 > /proc/sys/vm/drop_caches

# 4. Check for memory leaks
node --inspect=9229 dist/index.js

# 5. Restart services
systemctl restart puraestate-backend

# 6. Monitor memory
watch -n 2 free -h

echo "=== Resolution Complete ==="
```

### Scaling Procedures

#### Horizontal Scaling (Add Server)

```bash
#!/bin/bash
# scale-add-server.sh

NEW_SERVER="prod-api-03.example.com"

echo "=== Adding New Backend Server ==="

# 1. Configure new server
ssh $NEW_SERVER << 'EOF'
  # Install dependencies
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh

  # Clone code
  git clone https://github.com/puraestate/puraestate-monorepo.git
  cd puraestate-monorepo

  # Build image
  docker build -f docker/Dockerfile.backend -t puraestate-backend:latest .
EOF

# 2. Register with load balancer
aws elb register-instances-with-load-balancer \
  --load-balancer-name puraestate-prod-elb \
  --instances i-1234567890abcdef0

# 3. Add to monitoring
curl -X POST https://api.datadoghq.com/api/v1/monitor \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  -d '{"name": "Monitor '$NEW_SERVER'", "type": "host"}'

# 4. Run health checks
curl -s http://$NEW_SERVER:3000/api/health | jq .

echo "=== Server Added Successfully ==="
```

#### Database Scaling (Read Replica)

```bash
#!/bin/bash
# scale-db-read-replica.sh

echo "=== Adding Database Read Replica ==="

# 1. Create read replica
aws rds create-db-instance-read-replica \
  --db-instance-identifier puraestate-prod-replica-01 \
  --source-db-instance-identifier puraestate-prod \
  --db-instance-class db.t3.large

# 2. Wait for replica to be available
aws rds wait db-instance-available \
  --db-instance-identifier puraestate-prod-replica-01

# 3. Configure connection pooling
cat > /etc/pgbouncer/pgbouncer.ini << 'EOF'
[databases]
puraestate_read = host=puraestate-prod-replica-01.xxx.rds.amazonaws.com port=5432 dbname=puraestate_prod

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
EOF

# 4. Update backend connection string
# Connection string for read operations: puraestate-prod-replica-01.xxx.rds.amazonaws.com
# Connection string for write operations: puraestate-prod.xxx.rds.amazonaws.com

echo "=== Read Replica Added ==="
```

### Regular Updates

#### Dependency Updates (Monthly)

```bash
#!/bin/bash
# monthly-dependency-update.sh

echo "=== Monthly Dependency Update ==="

# 1. Check for updates
npm outdated

# 2. Update dependencies
npm update

# 3. Update major versions (carefully)
npm update --save-dev @types/node

# 4. Run tests
npm test

# 5. Build
npm run build

# 6. Commit and push
git add -A
git commit -m "chore: update dependencies"
git push origin main

# 7. Deploy to staging
npm run deploy:staging

echo "=== Update Complete ==="
```

#### Security Patches (As Needed)

```bash
#!/bin/bash
# security-patches.sh

echo "=== Security Patch Installation ==="

# 1. Check for vulnerabilities
npm audit

# 2. Fix vulnerabilities
npm audit fix

# 3. If auto-fix fails, manual review
npm audit --json | jq '.vulnerabilities'

# 4. Review changes
git diff package.json

# 5. Test thoroughly
npm test
npm run build

# 6. Deploy ASAP
npm run deploy:prod

# 7. Monitor for issues
tail -f /var/log/puraestate/error.log

echo "=== Patches Applied ==="
```

---

## Summary

This comprehensive documentation provides everything needed to deploy, manage, and maintain PuraEstate in production. Key components:

1. **Quick Start**: Get running in 30 minutes
2. **Deployment**: Docker, Kubernetes, Vercel, Firebase
3. **Play Store**: Complete submission workflow
4. **Architecture**: System design and data flows
5. **API**: Full endpoint reference
6. **Development**: Code standards and patterns
7. **Troubleshooting**: Common issues and solutions
8. **Operations**: Daily checks and incident response

For updates and additional information, refer to supporting documentation:
- `/home/tjdavis/PURAESTATE_API_REFERENCE.md`
- `/home/tjdavis/PURAESTATE_SETUP_GUIDE.md`
- `/home/tjdavis/PURAESTATE_ARCHITECTURE.md`

---

**Version:** 2.0
**Status:** Production-Ready
**Last Updated:** February 24, 2026
