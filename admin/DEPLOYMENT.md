# PuraEstate Admin Dashboard - Deployment Guide

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Firebase project created and configured
- [ ] Stripe keys obtained and verified
- [ ] SMTP credentials tested
- [ ] WhatsApp Business Account created (optional)
- [ ] SSL certificate ready
- [ ] Database backups configured
- [ ] Monitoring and logging setup
- [ ] Security audit completed

## Environment Setup

### 1. Firebase Setup

#### Create Firebase Project
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init
```

#### Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project: `puraestate-admin`
3. Enable Authentication (Email/Password)
4. Create Firestore Database
5. Create Storage bucket
6. Get credentials from Project Settings

#### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin only access
    match /admin/{document=**} {
      allow read, write: if request.auth.uid != null &&
                         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // User data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId ||
                         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Public properties
    match /properties/{propertyId} {
      allow read: if true;
      allow write: if request.auth.uid != null;
    }

    // Bookings
    match /bookings/{bookingId} {
      allow read: if request.auth.uid != null;
      allow write: if request.auth.uid != null;
    }
  }
}
```

#### Storage Security Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /documents/{userId}/{allPaths=**} {
      allow read, write: if request.auth.uid == userId ||
                         isAdmin(request.auth.uid);
    }
  }
}
```

### 2. Stripe Setup

#### Create Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create test and live keys
3. Configure webhooks:
   - Endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `charge.succeeded`, `charge.failed`, `customer.subscription.created`

#### Webhook Signing Secret
```bash
# Get from Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Email Configuration

#### Gmail Setup
```bash
# 1. Enable 2-Step Verification on Gmail
# 2. Generate App Password from: https://myaccount.google.com/apppasswords
# 3. Use app password in SMTP_PASSWORD
```

#### SendGrid Alternative
```env
SENDGRID_API_KEY=SG.your_key
```

### 4. WhatsApp Business API (Optional)

```env
WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_id
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_API_KEY=your_api_key
```

## Deployment Platforms

### Option 1: Vercel (Recommended)

#### Benefits
- Automatic deployments from Git
- Built-in analytics
- Edge functions support
- Built-in HTTPS
- Serverless functions

#### Steps

1. **Connect to Git**
```bash
# Push code to GitHub, GitLab, or Bitbucket
git push origin main
```

2. **Deploy via Vercel**
```bash
npm install -g vercel
vercel
```

3. **Configure Environment**
- In Vercel dashboard: Settings → Environment Variables
- Add all variables from `.env.local`

4. **Set Production Domain**
- Go to Settings → Domains
- Add your custom domain

#### Vercel Configuration File (vercel.json)
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "env": {
    "NEXT_PUBLIC_FIREBASE_API_KEY": "@firebase_api_key",
    "STRIPE_SECRET_KEY": "@stripe_secret_key"
  },
  "functions": {
    "pages/api/**": {
      "maxDuration": 60
    }
  }
}
```

### Option 2: AWS Amplify

#### Steps

1. **Push to GitHub**
```bash
git push origin main
```

2. **Connect Amplify**
- Go to AWS Amplify Console
- Connect your GitHub repository
- Select branch to deploy

3. **Configure Build Settings**
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

4. **Set Environment Variables**
- In Amplify Console: Environment variables
- Add all configuration variables

### Option 3: Docker + Cloud Run (Google Cloud)

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "start"]
```

#### Docker Compose (for local testing)
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    volumes:
      - .:/app
      - /app/node_modules
```

#### Deploy to Google Cloud Run
```bash
# Build image
docker build -t puraestate-admin .

# Push to Google Container Registry
docker tag puraestate-admin gcr.io/PROJECT_ID/puraestate-admin
docker push gcr.io/PROJECT_ID/puraestate-admin

# Deploy to Cloud Run
gcloud run deploy puraestate-admin \
  --image gcr.io/PROJECT_ID/puraestate-admin \
  --platform managed \
  --region us-central1 \
  --set-env-vars NEXT_PUBLIC_FIREBASE_API_KEY=value
```

### Option 4: DigitalOcean App Platform

#### Create app.yaml
```yaml
name: puraestate-admin
services:
  - name: admin
    github:
      repo: your-repo
      branch: main
    build_command: npm install && npm run build
    run_command: npm start
    http_port: 3000
    envs:
      - key: NEXT_PUBLIC_FIREBASE_API_KEY
        value: ${NEXT_PUBLIC_FIREBASE_API_KEY}
      - key: STRIPE_SECRET_KEY
        value: ${STRIPE_SECRET_KEY}
        scope: RUN_AND_BUILD_TIME
```

#### Deploy
```bash
# Use DigitalOcean CLI or dashboard
doctl apps create --spec app.yaml
```

## Post-Deployment

### 1. Monitor Health
```bash
# Check logs
vercel logs your-app-name

# Monitor performance
# Visit: https://yourdomain.com/api/health

# Set up error tracking with Sentry
npm install @sentry/nextjs
```

### 2. Set Up Monitoring

#### Sentry Setup
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

#### New Relic Setup
```bash
npm install @newrelic/next
```

### 3. Database Backups

#### Firebase Backup
```bash
# Export data
firebase firestore:export gs://puraestate-backup/$(date +%s)

# Schedule via Cloud Scheduler
# Go to Google Cloud Console → Cloud Scheduler
# Create job to run export daily
```

### 4. CDN Configuration

#### Cloudflare Setup
1. Add domain to Cloudflare
2. Update nameservers in domain registrar
3. Enable Caching (Page Rules)
4. Set up DDoS protection

### 5. SSL/TLS Certificate

Most platforms (Vercel, Amplify, Cloud Run) provide automatic HTTPS.

For self-hosted:
```bash
# Using Let's Encrypt with nginx
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com
```

### 6. Performance Optimization

#### CDN Headers (vercel.json)
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, s-maxage=10, stale-while-revalidate=59"
        }
      ]
    }
  ]
}
```

#### Database Indexing
- In Firebase: Set up composite indexes for common queries
- Monitor slow queries in Firestore

## Continuous Integration/Deployment

### GitHub Actions Workflow (.github/workflows/deploy.yml)
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Troubleshooting

### Firebase Connection Issues
```bash
# Check Firebase credentials
firebase list

# Verify Firestore is accessible
curl -X POST https://firestore.googleapis.com/v1/projects/PROJECT_ID/databases/...
```

### Stripe Integration Issues
```bash
# Test Stripe connection
curl https://api.stripe.com/v1/charges \
  -u sk_test_key: \
  -d "amount=2000" \
  -d "currency=usd" \
  -d "source=tok_visa"
```

### Build Failures
```bash
# Clear build cache
npm run clean
rm -rf .next node_modules
npm install
npm run build
```

## Security Checklist

- [ ] Enable HTTPS everywhere
- [ ] Set secure headers in production
- [ ] Enable CORS only for trusted domains
- [ ] Rotate API keys regularly
- [ ] Enable Firebase App Check
- [ ] Set up DDoS protection
- [ ] Enable Web Application Firewall (WAF)
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Enable audit logging

## Performance Targets

- Lighthouse Score: > 90
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- API Response Time: < 200ms

## Rollback Plan

### Vercel Rollback
```bash
vercel rollback
```

### Manual Rollback
```bash
# Redeploy previous version
git revert HEAD
git push origin main
```

## Support & Maintenance

- Monitor error logs daily
- Review performance metrics weekly
- Update dependencies monthly
- Security patches: immediately
- Backup data: daily
