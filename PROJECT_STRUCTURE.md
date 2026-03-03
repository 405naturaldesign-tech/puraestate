# PuraEstate - Project Structure Guide

Complete navigation guide for every directory and file in the PuraEstate production codebase.

---

## Root Directory

```
PuraEstate-Production/
  package.json            -- Unified dependencies (all subsystems merged)
  app.json                -- Expo app configuration (icons, permissions, deep links)
  eas.json                -- EAS Build/Submit profiles (dev, staging, prod)
  tsconfig.json           -- TypeScript compiler configuration with path aliases
  babel.config.js         -- Babel transpilation config
  jest.config.js          -- Jest test runner configuration
  jest.setup.js           -- Test environment setup
  metro.config.js         -- Metro bundler configuration
  .eslintrc.json          -- ESLint rules
  .prettierrc.json        -- Code formatting rules
  .editorconfig           -- Editor settings (indentation, line endings)
  .gitignore              -- Git ignore patterns
  .env.example            -- Template for environment variables
  README.md               -- Project overview and quick reference
  QUICK_START.md          -- 5-minute setup guide
  LAUNCH_CHECKLIST.md     -- Google Play Store submission checklist
  PROJECT_STRUCTURE.md    -- This file
```

---

## src/ -- React Native Mobile App

The core mobile application built with React Native + Expo + TypeScript.

```
src/
  app/
    App.tsx                     -- Main app entry point, providers, navigation setup
    ToolboxApp.tsx              -- Investment toolbox app variant

  screens/
    HomeScreen.tsx              -- Property listings feed, featured properties
    AuthScreen.tsx              -- Login/signup with Firebase Auth
    PropertySearchScreen.tsx    -- Advanced search with filters (location, price, type)
    PropertyDetailScreen.tsx    -- Full property view with gallery, details, contact
    AccountScreen.tsx           -- User profile, settings, saved properties
    remaining.tsx               -- Additional screen implementations

  components/
    common/
      Button.tsx                -- Reusable button component with variants
      Card.tsx                  -- Property card with image, price, details
      ErrorBoundary.tsx         -- React error boundary with fallback UI
      Header.tsx                -- Navigation header with back button, title
      Input.tsx                 -- Text input with validation and error display
      Loader.tsx                -- Loading spinner and skeleton screens
    tools/
      ROICalculator.tsx         -- Return on investment calculator
      MortgageCalculator.tsx    -- Mortgage payment estimator
      ClosingCostsBreakdown.tsx -- Costa Rica closing costs calculator
      FolioRealTitleChecker.tsx -- Property title verification tool
      InspectionChecklist.tsx   -- Property inspection checklist
      MarketHeatmap.tsx         -- Regional market activity heatmap
      PortfolioAnalytics.tsx    -- Investment portfolio analyzer
      PropertyManager.tsx       -- Property management dashboard
      ResidencyGuide.tsx        -- Costa Rica residency guide
      Toolbox.tsx               -- Tool launcher / navigation hub

  navigation/
    AuthNavigator.tsx           -- Authentication flow navigator (login, signup, forgot)
    MainNavigator.tsx           -- Main app tab navigator (home, search, tools, account)
    NavigationContainer.tsx     -- Root navigation container with linking config

  redux/
    store.ts                    -- Redux store configuration with persist
    authSlice.ts                -- Authentication state (user, token, loading)
    propertiesSlice.ts          -- Property listings state (list, filters, pagination)
    filtersSlice.ts             -- Search filter state (location, price, type, features)
    toolboxStore.ts             -- Zustand store for investment tools

  types/
    api.ts                      -- API request/response type definitions
    common.ts                   -- Shared types (loading states, errors, pagination)
    property.ts                 -- Property model interfaces
    user.ts                     -- User/agent model interfaces

  styles/
    theme.ts                    -- Complete theme object (colors, typography, spacing)
    colors.ts                   -- Color palette (primary, secondary, semantic colors)
    spacing.ts                  -- Spacing scale and layout constants
    typography.ts               -- Font families, sizes, weights, line heights

  services/
    api.ts                      -- Axios HTTP client with interceptors, retry logic
    firebase.ts                 -- Firebase SDK initialization and service helpers

  utils/
    constants.ts                -- App-wide constants (API URLs, feature flags)
    helpers.ts                  -- General utility functions
    validation.ts               -- Form validation rules (email, phone, password)
    logger.ts                   -- Logging utility with levels and remote reporting
    calculations.ts             -- Financial calculation utilities (from Tools)
    currency.ts                 -- Currency formatting (USD, CRC)
    storage.ts                  -- AsyncStorage wrapper utilities

  templates/
    composio-templates.ts       -- WhatsApp message templates for automation
```

---

## backend/ -- Python Flask API + Firebase Functions

Server-side logic for the platform.

```
backend/
  app.py                        -- Flask application factory and configuration
  config.py                     -- Environment-based configuration classes
  database.py                   -- SQLAlchemy database setup and session management
  models.py                     -- All database models (User, Property, Agent, etc.)
  celery_worker.py              -- Celery async task worker configuration
  wsgi.py                       -- WSGI entry point for production deployment
  alembic.ini                   -- Database migration configuration
  requirements_backend.txt      -- Python dependencies
  .env.example                  -- Backend environment variables template

  blueprints/
    __init__.py                 -- Blueprint registration
    auth.py                     -- Authentication endpoints (login, register, refresh)
    properties.py               -- Property CRUD and search endpoints
    users.py                    -- User management endpoints
    agents.py                   -- Agent management and assignment
    analytics.py                -- Analytics and reporting endpoints
    admin.py                    -- Admin-only endpoints
    contacts.py                 -- Contact and inquiry management
    integrations.py             -- Third-party integration endpoints

  utils/
    __init__.py                 -- Utils package init
    auth_helpers.py             -- JWT token helpers and decorators
    cache.py                    -- Redis cache utilities
    health.py                   -- Health check endpoint
    pagination.py               -- Cursor/offset pagination helpers
    slugify.py                  -- URL slug generation
    token_blocklist.py          -- JWT token revocation
    validators.py               -- Request validation helpers

  migrations/
    env.py                      -- Alembic migration environment
    script.py.mako              -- Migration script template
    versions/                   -- Database migration files

  functions/
    cloud-functions-main.js     -- Firebase Cloud Functions (triggers, APIs)
    cloud-functions-analytics.js -- Analytics cloud functions
    firebase-auth-setup.js      -- Firebase Auth custom claims setup

  firestore/
    firestore-schema.json       -- Firestore collection schema definitions
    firestore-security-rules.txt -- Firestore security rules

  config/
    firebase-config.json        -- Firebase project configuration
    functions-config.js         -- Cloud Functions runtime config
    backup-monitoring-setup.js  -- Automated backup monitoring
```

---

## ai/matching/ -- OpenRouter AI Property Matching

AI-powered property matching algorithm using OpenRouter API.

```
ai/matching/
  package.json                  -- Dependencies (axios, redis, winston)
  .env.example                  -- API keys template
  README.md                     -- Algorithm documentation
  ARCHITECTURE.md               -- System design document
  DEPLOYMENT.md                 -- Deployment guide
  USAGE.md                      -- API usage examples

  src/
    index.js                    -- Main entry point, API server
    client/
      openRouterClient.js       -- OpenRouter API client with retries
    core/
      propertyMatcher.js        -- Main matching algorithm (scoring, ranking)
      fallbackRanking.js        -- Fallback when AI is unavailable
    prompts/
      scoringPrompts.js         -- AI prompts for property scoring
      rankingPrompts.js         -- AI prompts for result ranking
    cache/
      cacheManager.js           -- Redis + in-memory caching layer
    analytics/
      costAnalytics.js          -- API cost tracking and optimization
      performanceAnalytics.js   -- Matching performance metrics
    utils/
      logger.js                 -- Structured logging
    __tests__/
      unit/
        propertyMatcher.test.js -- Unit tests for matching algorithm

  examples/
    complete-integration.js     -- Full integration example
```

---

## automation/composio/ -- WhatsApp Automation

Composio SDK integration for WhatsApp messaging and workflow automation.

```
automation/composio/
  package.json                  -- Dependencies (composio, express, bull, redis)
  tsconfig.json                 -- TypeScript configuration
  jest.config.js                -- Test configuration
  .env.example                  -- API keys template
  .env.test                     -- Test environment config
  docker-compose.yml            -- Redis + MongoDB for local development
  Dockerfile                    -- Container build
  README.md                     -- Integration documentation

  src/
    index.ts                    -- Express server entry point
    composio/
      client.ts                 -- Composio SDK client wrapper
    config/
      index.ts                  -- Environment configuration loader
    db/
      connection.ts             -- MongoDB connection manager
      schemas.ts                -- Mongoose schemas (messages, automations)
    logger/
      index.ts                  -- Winston logger configuration
    queue/
      manager.ts                -- Bull queue for async message processing
    routes/
      api.ts                    -- REST API routes for messaging
      admin.ts                  -- Admin routes for automation management
      webhooks.ts               -- Webhook handlers for incoming messages
    services/
      automation.service.ts     -- Core automation logic (triggers, workflows)
      message.service.ts        -- Message composition and delivery
    templates/
      index.ts                  -- WhatsApp message templates (property alerts, etc.)
    types/
      index.ts                  -- TypeScript interfaces
    utils/
      rateLimit.ts              -- Rate limiting for API calls
    workers/
      index.ts                  -- Background job workers
    __tests__/
      automation.service.test.ts -- Automation service tests
      message.service.test.ts    -- Message service tests

  tests/                        -- Comprehensive test suites
    setup.ts                    -- Test environment setup
    config/                     -- Configuration tests
    e2e/                        -- End-to-end user journey tests
    fixtures/                   -- Test data fixtures
    integration/                -- Integration tests (API, Composio, Firebase)
    logger/                     -- Logger tests
    mocks/                      -- Mock implementations (Redis, MongoDB, etc.)
    performance/                -- Performance benchmarks
    security/                   -- Security tests (auth, injection, etc.)

  examples/
    workflow-examples.ts        -- Example workflow configurations

  scripts/
    run-tests.sh                -- Test runner script (Linux/Mac)
    run-tests.bat               -- Test runner script (Windows)
    test-workflows.ts           -- Workflow testing utility
```

---

## admin/ -- Admin Dashboard

Next.js admin dashboard for property and user management.

```
admin/
  package.json                  -- Dependencies (next, tailwind, zustand)
  next.config.js                -- Next.js configuration
  tsconfig.json                 -- TypeScript configuration
  tailwind.config.js            -- TailwindCSS configuration
  postcss.config.js             -- PostCSS configuration
  .env.example                  -- Admin environment variables

  components/
    Layout/
      AdminLayout.tsx           -- Main layout wrapper
      Header.tsx                -- Top navigation bar
      Sidebar.tsx               -- Side navigation menu
    Common/
      Button.tsx                -- Reusable button
      DataTable.tsx             -- Sortable, filterable data table
      Modal.tsx                 -- Modal dialog
      StatCard.tsx              -- Statistics display card
    Charts/
      PropertyChart.tsx         -- Property analytics chart
      RevenueChart.tsx          -- Revenue tracking chart

  pages/
    _app.tsx                    -- Next.js app wrapper
    _document.tsx               -- Custom document
    login.tsx                   -- Admin login page
    dashboard/index.tsx         -- Main dashboard with metrics
    properties/
      index.tsx                 -- Property listing management
      create.tsx                -- Property creation form
    users/index.tsx             -- User management
    agents/index.tsx            -- Agent management
    bookings/index.tsx          -- Booking management
    messages/index.tsx          -- Message center
    payments/index.tsx          -- Payment transactions
    analytics/index.tsx         -- Analytics dashboard
    settings/index.tsx          -- System settings
    api/                        -- API routes (auth, CRUD, analytics)

  hooks/
    useAuth.ts                  -- Authentication hook

  lib/
    api.ts                      -- API client
    firebase.ts                 -- Firebase admin SDK
    stripe.ts                   -- Stripe server-side SDK

  stores/
    authStore.ts                -- Auth state (Zustand)
    dashboardStore.ts           -- Dashboard state (Zustand)

  styles/
    globals.css                 -- Global styles with Tailwind

  types/
    index.ts                    -- Admin TypeScript interfaces

  public/
    favicon.ico                 -- Site favicon
```

---

## frontend/ -- Next.js Web Frontend

Web version of PuraEstate built with Next.js.

```
frontend/
  package.json                  -- Dependencies
  next.config.js                -- Next.js configuration
  tsconfig.json                 -- TypeScript configuration
  tailwind.config.js            -- TailwindCSS configuration
  app/                          -- Next.js App Router pages
  components/                   -- Web UI components
  lib/                          -- Utility libraries
  public/                       -- Static assets
  styles/                       -- CSS/Tailwind styles
```

---

## config/ -- Configuration Files

All configuration files organized by purpose.

```
config/
  package.json                  -- Reference package.json
  app.json                      -- Reference Expo config
  eas.json                      -- Reference EAS config
  tsconfig.json                 -- Reference TypeScript config
  babel.config.js               -- Reference Babel config
  jest.config.js                -- Reference Jest config
  jest.setup.js                 -- Reference Jest setup
  metro.config.js               -- Reference Metro config
  firebase.json                 -- Firebase hosting/functions config
  firebase.config.ts            -- Firebase SDK configuration
  sentry.config.ts              -- Sentry error tracking setup
  docker-compose.yml            -- Docker Compose reference
  Dockerfile                    -- Dockerfile reference
  .dockerignore                 -- Docker ignore patterns
  .env.example                  -- Environment template
  .env.development              -- Development environment
  .env.production               -- Production environment
  .env.staging                  -- Staging environment
  .eslintrc.json                -- ESLint config
  .prettierrc.json              -- Prettier config
  .editorconfig                 -- Editor config
  .gitignore                    -- Git ignore patterns
  github-workflows-build.yml    -- CI/CD workflow reference
  android/
    build.gradle                -- Android root build config
    build.gradle.app            -- Android app build config
    gradle.properties           -- Gradle properties
    proguard-rules.pro          -- ProGuard obfuscation rules
  ios/
    Podfile                     -- CocoaPods dependencies
  vscode/
    extensions.json             -- Recommended VS Code extensions
    launch.json                 -- Debug launch configurations
    settings.json               -- VS Code project settings
```

---

## docker/ -- Deployment Configuration

Docker-based deployment for all backend services.

```
docker/
  docker-compose.yml            -- Full stack compose (backend, frontend, redis, postgres, nginx)
  docker-compose.override.yml   -- Development overrides
  Dockerfile.backend            -- Python Flask backend
  Dockerfile.celery             -- Celery worker
  Dockerfile.frontend           -- Next.js frontend
  Dockerfile.nginx              -- Nginx reverse proxy
  .dockerignore                 -- Docker build ignore
  .env.example                  -- Docker environment template
  .env.production               -- Production Docker environment
  DEPLOYMENT_GUIDE.md           -- Docker deployment documentation
  nginx/
    nginx.conf                  -- Main Nginx configuration
    conf.d/
      puraestate.conf           -- PuraEstate virtual host
      flower.conf               -- Celery Flower monitoring
    ssl/                        -- SSL certificate storage
  postgres-init/
    01-init.sql                 -- Database initialization script
```

---

## integrations/ -- Third-Party Services

Python-based integration modules for external services.

```
integrations/
  __init__.py                   -- Integration package init
  aws_s3.py                     -- AWS S3 file storage
  google_sheets.py              -- Google Sheets data sync
  n8n_client.py                 -- n8n workflow API client
  pipedrive_crm.py              -- Pipedrive CRM integration
  sendgrid_email.py             -- SendGrid email sending
  slack_bot.py                  -- Slack notifications
  stripe_payments.py            -- Stripe payment processing
  whatsapp_twilio.py            -- Twilio WhatsApp messaging
  webhooks.py                   -- Incoming webhook handlers
  pytest.ini                    -- Test configuration
  tests/
    test_integrations.py        -- Integration test suite
```

---

## n8n/ -- Workflow Automation

n8n workflow definitions for automated business processes.

```
n8n/
  README.md                     -- n8n setup and workflow guide
  config/
    credentials.env.template    -- n8n credential template
    database_schema.sql         -- Supporting database schema
    n8n_credentials_setup.json  -- Credential configuration
    webhook_urls.md             -- Webhook URL reference
  templates/
    workflow_schedule_summary.json -- Workflow scheduling template
  workflows/
    admin/                      -- Admin automation workflows
    alerts/                     -- Alert and notification workflows
    data-collection/            -- Data scraping and collection
    integrations/               -- Service integration workflows
    lead-management/            -- Lead capture and nurturing
```

---

## scripts/ -- Build and Deploy Scripts

```
scripts/
  build.sh                      -- Build script (Android/iOS)
  release.sh                    -- Release management script
  rollback.sh                   -- Deployment rollback script
  migrate-db.sh                 -- Database migration script
  deploy.sh                     -- Production deployment script
  backup.sh                     -- Database backup script
  db-migrate.sh                 -- Alembic migration runner
  generate-secrets.sh           -- Secret key generation
  healthcheck.sh                -- Service health verification
  init-ssl.sh                   -- SSL certificate setup
  redis-init.sh                 -- Redis initialization
  .scriptrc                     -- Shell environment for scripts
```

---

## tests/ -- Test Suites

```
tests/
  setup.ts                      -- Global test setup
  unit/
    calculations.test.ts        -- Financial calculation tests
    validation.test.ts          -- Validation utility tests
  integration/
    api.integration.test.ts     -- API endpoint tests
    composio.integration.test.ts -- Composio integration tests
    firebase.integration.test.ts -- Firebase integration tests
    test_integrations.py        -- Python integration tests
  e2e/
    user-journeys.e2e.test.ts   -- End-to-end user flow tests
  mocks/
    composio.mock.ts            -- Composio SDK mock
    database.mock.ts            -- Database mock
    firebase.mock.ts            -- Firebase mock
    redis.mock.ts               -- Redis mock
  fixtures/
    test-data.ts                -- Shared test fixtures
  performance/
    performance.test.ts         -- Performance benchmark tests
  security/
    security.test.ts            -- Security vulnerability tests
  config/
    config.test.ts              -- Configuration tests
  logger/
    logger.test.ts              -- Logger tests
```

---

## .github/ -- CI/CD Pipeline

```
.github/
  BRANCH_PROTECTION.md          -- Branch protection rules documentation
  CI_CD_GUIDE.md                -- CI/CD pipeline guide
  SECRETS_SETUP.md              -- GitHub Secrets configuration guide
  workflows/
    test.yml                    -- Run tests on PR
    build.yml                   -- Build Android/iOS on push
    deploy.yml                  -- Deploy to production
    lint.yml                    -- Code linting checks
    e2e-tests.yml               -- End-to-end test workflow
    security-scan.yml           -- Security vulnerability scan
    monitoring.yml              -- Production monitoring checks
    README.md                   -- Workflow documentation
```

---

## docs/ -- Documentation

Contains 40+ documentation files covering every aspect of the platform. Key files:

```
docs/
  ARCHITECTURE.md               -- System architecture deep-dive
  API_REFERENCE.md              -- Complete API endpoint documentation
  DEPLOYMENT_GUIDE.md           -- Deployment procedures
  AI_INTEGRATION_GUIDE.md       -- OpenRouter AI setup and usage
  DESIGN_SYSTEM.md              -- UI/UX design system specification
  DEVELOPER_SETUP_GUIDE.md      -- Developer onboarding guide
  DEVELOPMENT_STANDARDS.md      -- Code standards and conventions
  EXECUTIVE_SUMMARY.md          -- Business overview
  IMPLEMENTATION_GUIDE.md       -- Technical implementation details
  INTEGRATION_GUIDE.md          -- Third-party integration guide
  MOBILE_APP_BLUEPRINT.md       -- Mobile app architecture
  MOBILE_APP_SPEC.md            -- Mobile app specification
  SETUP_GUIDE.md                -- Environment setup documentation
  VIRAL_LAUNCH_STRATEGY.md      -- Marketing launch strategy
  30DAY_CONVERSION_PLAN.md      -- 30-day user conversion plan
  (and 25+ more reference documents)
```

---

## assets/ -- Media and Marketing

```
assets/
  playstore/
    screenshots/                -- Google Play Store screenshots
  images/                       -- App images and icons
  marketing/
    0-EXECUTIVE-SUMMARY.md      -- Marketing executive summary
    1-PRESS-RELEASE.md          -- Launch press release
    2-EMAIL-CAMPAIGN.md         -- Email marketing campaign
    3-SOCIAL-MEDIA-ASSETS.md    -- Social media content
    4-BLOG-POSTS.md             -- Blog content for launch
    5-LANDING-PAGE-COPY.md      -- Landing page copywriting
    6-INFLUENCER-OUTREACH.md    -- Influencer partnership plan
    7-PRESS-KIT.md              -- Media press kit
    8-LAUNCH-DAY-TIMELINE.md    -- Launch day execution plan
```

---

## File Count Summary

| Directory | Files | Purpose |
|-----------|-------|---------|
| src/ | 37 | Mobile app source code |
| backend/ | 25 | Python API + Firebase functions |
| ai/matching/ | 18 | AI matching algorithm |
| automation/composio/ | 35 | WhatsApp automation |
| admin/ | 30 | Admin dashboard |
| frontend/ | 15+ | Web frontend |
| config/ | 29 | Configuration files |
| docker/ | 14 | Deployment configs |
| integrations/ | 14 | Third-party integrations |
| n8n/ | 10+ | Workflow automation |
| scripts/ | 12 | Build/deploy scripts |
| tests/ | 20 | Test suites |
| .github/ | 11 | CI/CD workflows |
| docs/ | 48 | Documentation |
| assets/marketing/ | 9 | Marketing materials |
| **Total** | **~330** | **Complete platform** |
