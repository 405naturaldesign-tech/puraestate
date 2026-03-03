# PuraEstate - AI-Powered Real Estate Investment Platform

**Premium real estate investment platform for Costa Rica, powered by AI matching and WhatsApp automation.**

PuraEstate connects international investors with Costa Rican real estate opportunities through an intelligent mobile app, AI-powered property matching, automated WhatsApp communication, and a comprehensive admin dashboard.

---

## Platform Overview

| Component | Technology | Location |
|-----------|-----------|----------|
| Mobile App | React Native + Expo | `src/` |
| AI Matching | OpenRouter API + Node.js | `ai/matching/` |
| WhatsApp Automation | Composio SDK + Express | `automation/composio/` |
| Admin Dashboard | Next.js + TailwindCSS | `admin/` |
| Backend API | Python Flask + PostgreSQL | `backend/` |
| Firebase Services | Auth, Firestore, Storage | `backend/functions/` |
| Frontend Web | Next.js + TypeScript | `frontend/` |
| CI/CD Pipeline | GitHub Actions + EAS | `.github/workflows/` |
| Deployment | Docker + Nginx | `docker/` |
| Integrations | Stripe, SendGrid, Slack, S3 | `integrations/` |
| Automation Workflows | n8n | `n8n/` |
| Investment Tools | 10 Financial Calculators | `src/components/tools/` |

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/your-org/PuraEstate.git
cd PuraEstate
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys (Firebase, OpenRouter, Composio, Stripe)

# 3. Start development
npm run dev

# 4. Run tests
npm test

# 5. Build for Android
npm run build:android
```

See [QUICK_START.md](./QUICK_START.md) for the complete 5-minute setup guide.

---

## Architecture

```
Client Layer         Service Layer          Data Layer
-----------         -------------          ----------
Mobile App    -->   Firebase Auth    -->   Firestore DB
(React Native)      Cloud Functions        Firebase Storage
                    OpenRouter AI           Redis Cache
Admin Dashboard --> Flask API        -->   PostgreSQL
(Next.js)           Composio SDK           MongoDB (messages)
                    n8n Workflows
```

### Key Features

- **AI Property Matching**: OpenRouter-powered algorithm scores properties against investor preferences with 95%+ accuracy
- **WhatsApp Automation**: Composio-integrated messaging for property alerts, viewing scheduling, and agent communication
- **Investment Tools**: 10 specialized calculators (ROI, mortgage, closing costs, portfolio analytics, residency guide, etc.)
- **Real-Time Notifications**: Firebase Cloud Messaging for instant property alerts
- **Multi-Language Support**: English and Spanish via i18next
- **Admin Dashboard**: Full property management, user analytics, agent performance, and payment tracking
- **Secure Payments**: Stripe integration for deposits and subscriptions

---

## Directory Structure

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for the complete file navigation guide.

```
PuraEstate-Production/
  src/              # React Native mobile app source
  backend/          # Python Flask API + Firebase functions
  ai/               # OpenRouter AI matching algorithm
  automation/       # Composio WhatsApp + workflow automation
  admin/            # Next.js admin dashboard
  frontend/         # Next.js web frontend
  config/           # All configuration files
  docker/           # Docker deployment configs
  integrations/     # Third-party service integrations
  n8n/              # n8n automation workflows
  scripts/          # Build, deploy, and utility scripts
  tests/            # All test suites
  docs/             # Complete documentation
  assets/           # Play Store, marketing, images
  .github/          # CI/CD workflows
```

---

## Development

### Prerequisites

- Node.js >= 18.17.0
- npm >= 9.0.0
- Python >= 3.11 (for backend)
- Docker & Docker Compose (for deployment)
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Firebase CLI (`npm install -g firebase-tools`)

### Environment Variables

Copy `.env.example` and configure:

```bash
# Firebase
FIREBASE_API_KEY=your_key
FIREBASE_PROJECT_ID=pura-estate-prod

# OpenRouter AI
OPENROUTER_API_KEY=your_key

# Composio WhatsApp
COMPOSIO_API_KEY=your_key

# Stripe Payments
STRIPE_PUBLISHABLE_KEY=your_key
STRIPE_SECRET_KEY=your_key

# Sentry Error Tracking
SENTRY_DSN=your_dsn
```

### Running Services

```bash
# Mobile app
npm run dev

# Admin dashboard
npm run admin:dev

# AI matching service
npm run ai:match

# Composio automation
npm run composio:dev

# Full Docker stack
npm run docker:up
```

### Testing

```bash
npm test                    # All tests with coverage
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:e2e           # End-to-end tests
npm run test:security      # Security tests
npm run test:performance   # Performance benchmarks
```

---

## Deployment

### Google Play Store

```bash
# Build production AAB
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android --profile production-android
```

See [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) for the complete submission checklist.

### Docker Production

```bash
cd docker
docker-compose -f docker-compose.yml up -d
```

See [docs/COMPLETE_DEPLOYMENT_GUIDE.md](./docs/COMPLETE_DEPLOYMENT_GUIDE.md) for full deployment instructions.

---

## Documentation

| Document | Description |
|----------|-------------|
| [QUICK_START.md](./QUICK_START.md) | 5-minute setup guide |
| [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) | Google Play Store submission checklist |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Complete file navigation guide |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture deep-dive |
| [docs/API_REFERENCE.md](./docs/API_REFERENCE.md) | API endpoint documentation |
| [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) | Deployment procedures |
| [docs/AI_INTEGRATION_GUIDE.md](./docs/AI_INTEGRATION_GUIDE.md) | OpenRouter AI setup |
| [docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md) | UI/UX design system |
| [docs/DEVELOPMENT_STANDARDS.md](./docs/DEVELOPMENT_STANDARDS.md) | Code standards and conventions |

---

## Tech Stack

**Mobile**: React Native 0.74 + Expo 51 + TypeScript 5.3
**State**: Redux Toolkit + Redux Persist + Zustand
**Backend**: Python Flask + PostgreSQL + Redis + Celery
**Firebase**: Auth + Firestore + Storage + Cloud Functions + Messaging
**AI**: OpenRouter API (Claude, GPT-4, Gemini models)
**Automation**: Composio SDK + n8n + Bull Queue
**Admin**: Next.js 14 + TailwindCSS + Zustand
**Payments**: Stripe React Native SDK
**CI/CD**: GitHub Actions + EAS Build + Docker
**Monitoring**: Sentry + Custom Analytics

---

## License

Proprietary - PuraEstate Team. All rights reserved.
