# PURAESTATE.COM - Complete Technical Architecture Blueprint

**Version:** 1.0
**Date:** February 24, 2026
**Target Platform:** Mobile-First Web + Native Apps
**Timeline:** 4-Week MVP to Full Feature Implementation

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Tech Stack Recommendation](#tech-stack-recommendation)
3. [System Architecture Overview](#system-architecture-overview)
4. [Detailed Component Architecture](#detailed-component-architecture)
5. [Folder Structure](#folder-structure)
6. [Database Schema](#database-schema)
7. [API Specifications](#api-specifications)
8. [Mobile App Architecture](#mobile-app-architecture)
9. [Web (Next.js) Architecture](#web-nextjs-architecture)
10. [AI & Automation Integration](#ai--automation-integration)
11. [Real-Time Features](#real-time-features)
12. [Migration Plan](#migration-plan)
13. [Implementation Timeline](#implementation-timeline)
14. [Code Examples](#code-examples)
15. [Deployment & DevOps](#deployment--devops)

---

## EXECUTIVE SUMMARY

This blueprint provides a complete rebuild of puraestate.com as a modern, scalable mobile-first platform. The architecture uses:

- **Frontend:** Next.js (web) + React Native (iOS/Android)
- **Backend:** Node.js + Express + Firebase/PostgreSQL hybrid
- **AI/Automation:** OpenRouter for LLM, Composio for multi-channel automations, Rork for rapid expansion
- **Real-time:** Firebase Realtime Database or Socket.io with Redis
- **Deployment:** Docker + Kubernetes on AWS/GCP, with CDN edge caching

**Key Differentiators:**
- Offline-first mobile experience with sync
- AI-powered smart matching and descriptions
- Multi-channel automations (WhatsApp, email, SMS)
- Real-time notifications and messaging
- Progressive Web App fallback
- HIPAA/compliance-ready architecture

---

## TECH STACK RECOMMENDATION

### Why This Stack for PuraEstate?

#### **Frontend Tier**

| Technology | Use Case | Justification |
|-----------|----------|---------------|
| **Next.js 14** | Web platform + Admin | Server-side rendering for SEO, API routes reduce backend complexity, built-in image optimization |
| **React Native 0.73** | iOS/Android apps | Code sharing 70-80%, native performance, hot reload for faster development |
| **Expo** | React Native tooling | Managed services reduce ops overhead, OTA updates without app store |
| **TailwindCSS** | Web styling | Mobile-first utility classes, consistent design system |
| **React Query** | Data fetching | Caching, background sync, offline support across all platforms |

#### **Backend Tier**

| Technology | Use Case | Justification |
|-----------|----------|---------------|
| **Node.js 20 + Express** | API server | Lightweight, async by default, perfect for real-time features |
| **Firebase** | Real-time + Auth | WebSocket for real-time updates, handles scale automatically |
| **PostgreSQL** | Relational data | ACID compliance, complex queries for matching algorithms |
| **Redis** | Caching + Sessions | In-memory performance for hot data, pub/sub for real-time |
| **Bull/RabbitMQ** | Job queue | Async tasks: image processing, email, AI description generation |

#### **AI/Automation Layer**

| Service | Purpose | Integration |
|---------|---------|-------------|
| **OpenRouter** | LLM backbone | Smart descriptions, price suggestions, dispute resolution, search ranking |
| **Composio** | Multi-channel automation | WhatsApp, email, SMS, calendar integrations, workflow automation |
| **Rork** | Rapid feature expansion | Reference architecture for agent patterns, faster feature iteration |
| **Hugging Face** | NLP/Classification | Property/service categorization, spam detection, content moderation |

#### **DevOps/Infrastructure**

| Tool | Purpose | Notes |
|------|---------|-------|
| **Docker** | Containerization | Consistent environments dev-to-prod |
| **Kubernetes** | Orchestration | Auto-scaling, self-healing, zero-downtime deployments |
| **GitHub Actions** | CI/CD | Automated testing, security scanning, deployment |
| **Datadog** | Observability | APM, logs, metrics, user session tracking |
| **Cloudflare** | CDN + Security | DDoS protection, edge caching, SSL/TLS |

---

## SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├──────────────────────────┬──────────────────────────────────────┤
│   Web (Next.js)          │   Mobile (React Native)              │
│   - SSR Pages            │   - iOS App                          │
│   - Admin Dashboard      │   - Android App                      │
│   - Progressive Web App  │   - Offline Sync                     │
└──────────────────────────┴──────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │   API Gateway   │
                    │  (Cloudflare)   │
                    └────────┬────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                      SERVICE LAYER                              │
├──────────────────┬──────────────────┬──────────────────────────┤
│  Core APIs       │  Real-time Hub   │  Background Jobs         │
│  (Express/Node)  │  (Socket.io)     │  (Bull + Redis)          │
│                  │                  │                          │
│ - Auth Service   │ - Messaging      │ - Email/SMS              │
│ - Listing CRUD   │ - Notifications  │ - Image Processing       │
│ - Search/Filter  │ - Presence       │ - AI Generation          │
│ - Matching Algo  │ - Live Updates   │ - Analytics              │
│ - Payment        │                  │ - Data Sync              │
└──────────────────┴──────────────────┴──────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                      DATA LAYER                                 │
├────────────────────┬────────────────┬──────────────────────────┤
│  Primary DB        │  Cache Layer   │  Blob Storage            │
│  (PostgreSQL)      │  (Redis)       │  (S3/GCS)                │
│                    │                │                          │
│ - Users            │ - Hot listings │ - Property images        │
│ - Listings         │ - Sessions     │ - Documents              │
│ - Messages         │ - Search index │ - Verification files     │
│ - Transactions     │ - Feature flags│                          │
│ - Reviews          │                │                          │
└────────────────────┴────────────────┴──────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                        │
├──────────────────┬──────────────────┬──────────────────────────┤
│  AI/LLM          │  Automation      │  Third-party Services    │
│  (OpenRouter)    │  (Composio)      │                          │
│                  │                  │ - Stripe/PayPal          │
│ - Smart Match    │ - WhatsApp       │ - Twilio SMS             │
│ - Descriptions   │ - Email          │ - SendGrid               │
│ - Price Suggest  │ - SMS            │ - Google Maps            │
│ - Ranking        │ - Calendar       │ - Auth0                  │
│ - Moderation     │ - CRM            │ - Sentry                 │
└──────────────────┴──────────────────┴──────────────────────────┘
```

---

## DETAILED COMPONENT ARCHITECTURE

### 1. Authentication & Authorization

```
┌─────────────────────────────────────────┐
│      Auth Service (Middleware)          │
├─────────────────────────────────────────┤
│                                         │
│  ├─ JWT Token Management               │
│  ├─ OAuth 2.0 (Google, Apple, Phone)  │
│  ├─ Multi-factor Authentication        │
│  ├─ Role-Based Access Control (RBAC)  │
│  ├─ Permission System                  │
│  └─ Session Management (Redis)         │
│                                         │
└─────────────────────────────────────────┘
```

**User Roles:**
- ADMIN: Full platform control
- MODERATOR: Content review, dispute resolution
- SELLER/LANDLORD: List properties/services
- BUYER/TENANT: Search, message, purchase
- GUEST: Browse without account

### 2. Listing Management Service

```
Listing Lifecycle:
  DRAFT → PENDING_REVIEW → ACTIVE → PAUSED → SOLD/RENTED → ARCHIVED

Quality Checks:
  ├─ Image validation (min 3, max 50)
  ├─ Title/description length
  ├─ Price validation (AI-assisted)
  ├─ Location verification
  └─ Spam/fraud detection (ML)
```

### 3. Matching & Search Engine

```
Search Pipeline:
  User Input
    ↓
  [Query Normalization & Typo Correction]
    ↓
  [Elasticsearch/PostgreSQL Full-Text Search]
    ↓
  [Filter Application (location, price, category)]
    ↓
  [Smart Ranking (AI, user history, recency)]
    ↓
  [Results + Recommendations]
```

### 4. Messaging & Notifications

```
Real-Time Messaging:
  User A ──(WebSocket)──> Socket.io Server ──(pub/sub)──> User B
                              ↓
                         Firebase Firestore
                         (Message History)

Notification Types:
  ├─ In-app (real-time badge)
  ├─ Push notifications (Firebase Cloud Messaging)
  ├─ Email (SendGrid)
  ├─ SMS (Twilio)
  └─ WhatsApp (Composio)
```

---

## FOLDER STRUCTURE

```
puraestate-monorepo/
│
├── apps/
│   │
│   ├── web/                              # Next.js web platform
│   │   ├── pages/
│   │   │   ├── index.tsx                 # Homepage
│   │   │   ├── auth/
│   │   │   │   ├── login.tsx
│   │   │   │   ├── signup.tsx
│   │   │   │   └── verify.tsx
│   │   │   ├── listings/
│   │   │   │   ├── [id].tsx              # Detail page
│   │   │   │   ├── create.tsx
│   │   │   │   └── edit/[id].tsx
│   │   │   ├── search/
│   │   │   │   └── [...query].tsx
│   │   │   ├── messages/
│   │   │   │   ├── index.tsx
│   │   │   │   └── [conversationId].tsx
│   │   │   ├── profile/
│   │   │   │   ├── [userId].tsx
│   │   │   │   ├── settings.tsx
│   │   │   │   └── dashboard.tsx
│   │   │   ├── admin/
│   │   │   │   ├── dashboard.tsx
│   │   │   │   ├── users.tsx
│   │   │   │   ├── listings.tsx
│   │   │   │   └── moderation.tsx
│   │   │   └── api/
│   │   │       ├── auth/
│   │   │       ├── listings/
│   │   │       ├── search/
│   │   │       └── upload/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── Navigation.tsx
│   │   │   ├── listings/
│   │   │   │   ├── ListingCard.tsx
│   │   │   │   ├── ListingDetail.tsx
│   │   │   │   ├── ListingForm.tsx
│   │   │   │   └── ImageGallery.tsx
│   │   │   ├── search/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── FilterPanel.tsx
│   │   │   │   └── ResultsList.tsx
│   │   │   ├── messaging/
│   │   │   │   ├── ChatWindow.tsx
│   │   │   │   ├── ConversationList.tsx
│   │   │   │   └── MessageInput.tsx
│   │   │   └── auth/
│   │   │       ├── LoginForm.tsx
│   │   │       ├── SignupForm.tsx
│   │   │       └── MFASetup.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useListings.ts
│   │   │   ├── useSearch.ts
│   │   │   ├── useMessages.ts
│   │   │   └── useLocalStorage.ts
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   │   ├── client.ts             # API client (axios/fetch)
│   │   │   │   └── endpoints.ts
│   │   │   ├── utils/
│   │   │   │   ├── validation.ts
│   │   │   │   ├── formatting.ts
│   │   │   │   └── geo.ts
│   │   │   └── constants.ts
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   ├── tailwind.config.js
│   │   │   └── variables.css
│   │   ├── public/
│   │   │   ├── images/
│   │   │   ├── icons/
│   │   │   └── manifest.json             # PWA manifest
│   │   ├── next.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── mobile/                            # React Native Expo app
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login.tsx
│   │   │   │   ├── signup.tsx
│   │   │   │   └── verify.tsx
│   │   │   ├── (tabs)/
│   │   │   │   ├── home.tsx
│   │   │   │   ├── search.tsx
│   │   │   │   ├── messages.tsx
│   │   │   │   ├── profile.tsx
│   │   │   │   └── _layout.tsx
│   │   │   ├── listings/
│   │   │   │   ├── [id].tsx
│   │   │   │   ├── create.tsx
│   │   │   │   └── edit.tsx
│   │   │   ├── modals/
│   │   │   │   ├── FilterModal.tsx
│   │   │   │   └── SettingsModal.tsx
│   │   │   └── _layout.tsx
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── TabBar.tsx
│   │   │   │   └── SafeAreaWrapper.tsx
│   │   │   ├── listings/
│   │   │   │   ├── ListingCard.tsx
│   │   │   │   ├── ListingDetail.tsx
│   │   │   │   ├── ImageCarousel.tsx
│   │   │   │   └── ListingForm.tsx
│   │   │   ├── search/
│   │   │   │   ├── SearchInput.tsx
│   │   │   │   ├── FilterChips.tsx
│   │   │   │   └── ResultsList.tsx
│   │   │   └── messaging/
│   │   │       ├── ChatBubble.tsx
│   │   │       ├── ChatList.tsx
│   │   │       └── ChatInput.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useLocation.ts
│   │   │   ├── useOfflineSync.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   └── usePushNotifications.ts
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   │   ├── client.ts
│   │   │   │   └── offline.ts            # Offline-first logic
│   │   │   ├── sqlite/
│   │   │   │   ├── db.ts                 # Local database
│   │   │   │   └── schema.ts
│   │   │   └── utils/
│   │   ├── assets/
│   │   │   ├── images/
│   │   │   └── icons/
│   │   ├── expo.json
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── admin/                             # Admin panel (optional Next.js)
│       ├── pages/
│       ├── components/
│       └── package.json
│
├── packages/
│   │
│   ├── backend/                           # Express.js API server
│   │   ├── src/
│   │   │   ├── index.ts                   # Entry point
│   │   │   ├── config/
│   │   │   │   ├── database.ts
│   │   │   │   ├── env.ts
│   │   │   │   ├── cache.ts
│   │   │   │   └── messaging.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── errorHandler.ts
│   │   │   │   ├── logger.ts
│   │   │   │   ├── rateLimiter.ts
│   │   │   │   └── validation.ts
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── listings.ts
│   │   │   │   ├── search.ts
│   │   │   │   ├── messages.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── payments.ts
│   │   │   │   ├── admin.ts
│   │   │   │   └── webhook.ts
│   │   │   ├── controllers/
│   │   │   │   ├── AuthController.ts
│   │   │   │   ├── ListingController.ts
│   │   │   │   ├── SearchController.ts
│   │   │   │   ├── MessageController.ts
│   │   │   │   ├── UserController.ts
│   │   │   │   └── AnalyticsController.ts
│   │   │   ├── services/
│   │   │   │   ├── AuthService.ts
│   │   │   │   ├── ListingService.ts
│   │   │   │   ├── SearchService.ts
│   │   │   │   ├── MatchingService.ts    # AI-powered matching
│   │   │   │   ├── MessageService.ts
│   │   │   │   ├── NotificationService.ts
│   │   │   │   ├── PaymentService.ts
│   │   │   │   ├── ImageService.ts
│   │   │   │   └── AIService.ts          # OpenRouter integration
│   │   │   ├── models/
│   │   │   │   ├── User.ts
│   │   │   │   ├── Listing.ts
│   │   │   │   ├── Message.ts
│   │   │   │   ├── Review.ts
│   │   │   │   ├── Transaction.ts
│   │   │   │   └── index.ts
│   │   │   ├── jobs/
│   │   │   │   ├── emailQueue.ts
│   │   │   │   ├── imageProcessing.ts
│   │   │   │   ├── aiGeneration.ts
│   │   │   │   ├── analyticsSync.ts
│   │   │   │   └── cleanupSchedules.ts
│   │   │   ├── websocket/
│   │   │   │   ├── events.ts
│   │   │   │   ├── handlers.ts
│   │   │   │   └── middleware.ts
│   │   │   ├── utils/
│   │   │   │   ├── validation.ts
│   │   │   │   ├── encryption.ts
│   │   │   │   ├── logging.ts
│   │   │   │   └── cache.ts
│   │   │   └── types/
│   │   │       ├── index.ts              # Shared types
│   │   │       └── api.ts
│   │   ├── .env.example
│   │   ├── docker-compose.yml
│   │   ├── Dockerfile
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── database/                          # Shared database layer
│   │   ├── migrations/
│   │   │   ├── 001_initial_schema.sql
│   │   │   ├── 002_listings_table.sql
│   │   │   ├── 003_messages_table.sql
│   │   │   └── 004_indexes.sql
│   │   ├── seeds/
│   │   │   └── development.sql
│   │   ├── scripts/
│   │   │   ├── migrate.ts
│   │   │   └── seed.ts
│   │   └── package.json
│   │
│   ├── shared/                            # Shared utilities & types
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── user.ts
│   │   │   │   ├── listing.ts
│   │   │   │   ├── message.ts
│   │   │   │   └── api.ts
│   │   │   ├── utils/
│   │   │   │   ├── validation.ts
│   │   │   │   ├── formatting.ts
│   │   │   │   ├── constants.ts
│   │   │   │   └── errors.ts
│   │   │   └── hooks/
│   │   │       ├── useApi.ts
│   │   │       └── useAuth.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── ai-engine/                        # AI/ML features
│       ├── src/
│       │   ├── matching/
│       │   │   ├── algorithm.ts
│       │   │   ├── vectorizer.ts
│       │   │   └── ranker.ts
│       │   ├── generation/
│       │   │   ├── descriptionGen.ts
│       │   │   ├── titleGen.ts
│       │   │   └── priceOptimizer.ts
│       │   ├── moderation/
│       │   │   ├── contentFilter.ts
│       │   │   ├── spamDetector.ts
│       │   │   └── fraudDetection.ts
│       │   ├── integrations/
│       │   │   ├── openrouter.ts
│       │   │   ├── composio.ts
│       │   │   └── huggingface.ts
│       │   └── utils/
│       ├── tests/
│       └── package.json
│
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.mobile
│   ├── docker-compose.yml
│   └── nginx.conf
│
├── k8s/
│   ├── namespaces.yaml
│   ├── deployments/
│   │   ├── backend.yaml
│   │   ├── worker.yaml
│   │   └── redis.yaml
│   ├── services/
│   │   ├── backend-service.yaml
│   │   └── redis-service.yaml
│   ├── configmaps/
│   │   └── app-config.yaml
│   └── secrets/
│       └── secrets-example.yaml
│
├── scripts/
│   ├── setup.sh
│   ├── deploy.sh
│   ├── migrate.sh
│   ├── backup.sh
│   └── health-check.sh
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── CONTRIBUTING.md
│   └── MIGRATION.md
│
├── .github/
│   └── workflows/
│       ├── test.yml
│       ├── build.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
│
├── .env.example
├── README.md
├── package.json
└── turbo.json
```

---

## DATABASE SCHEMA

### Core Tables

```sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  profile_photo_url VARCHAR(500),
  bio TEXT,

  -- Account status
  status ENUM ('ACTIVE', 'SUSPENDED', 'DELETED') DEFAULT 'ACTIVE',
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,

  -- Profile completeness
  profile_completeness DECIMAL(3,2) DEFAULT 0,
  kyc_status ENUM ('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING',

  -- Ratings
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  response_time_hours INT,

  -- Settings
  notification_preferences JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,

  -- Indexing
  CONSTRAINT email_unique UNIQUE (email),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  FULLTEXT INDEX idx_search (first_name, last_name)
);

-- Listings Table
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Basic info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'property', 'service', etc.
  subcategory VARCHAR(50),

  -- Pricing
  price DECIMAL(12,2),
  price_currency VARCHAR(3) DEFAULT 'USD',
  price_negotiable BOOLEAN DEFAULT FALSE,

  -- Location
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  location_address VARCHAR(500),
  location_city VARCHAR(100),
  location_state VARCHAR(100),
  location_country VARCHAR(100),
  location_zip VARCHAR(20),

  -- Media
  image_urls TEXT[] DEFAULT '{}', -- Array of S3 URLs
  thumbnail_url VARCHAR(500),
  video_url VARCHAR(500),

  -- Details (JSONB for flexibility)
  attributes JSONB DEFAULT '{}', -- e.g., {bedrooms: 3, bathrooms: 2}
  amenities TEXT[] DEFAULT '{}',

  -- Status
  status ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'SOLD', 'ARCHIVED') DEFAULT 'DRAFT',
  is_featured BOOLEAN DEFAULT FALSE,

  -- Engagement
  view_count INT DEFAULT 0,
  save_count INT DEFAULT 0,
  inquiry_count INT DEFAULT 0,

  -- SEO
  slug VARCHAR(255) UNIQUE,
  meta_title VARCHAR(160),
  meta_description VARCHAR(160),

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,
  expires_at TIMESTAMP,

  -- Indexes
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_category (category),
  INDEX idx_location (location_city),
  INDEX idx_price (price),
  INDEX idx_created_at (created_at),
  SPATIAL INDEX idx_location_geo (location_lat, location_lng),
  FULLTEXT INDEX idx_search (title, description)
);

-- Messages Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID NOT NULL REFERENCES users(id),

  -- Content
  content TEXT NOT NULL,
  content_type ENUM ('TEXT', 'IMAGE', 'FILE', 'OFFER') DEFAULT 'TEXT',
  attachment_url VARCHAR(500),

  -- State
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_conversation (conversation_id),
  INDEX idx_sender (sender_id),
  INDEX idx_recipient (recipient_id),
  INDEX idx_created_at (created_at)
);

-- Conversations Table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id),
  user_1_id UUID NOT NULL REFERENCES users(id),
  user_2_id UUID NOT NULL REFERENCES users(id),

  -- State
  status ENUM ('ACTIVE', 'ARCHIVED', 'BLOCKED') DEFAULT 'ACTIVE',
  last_message_at TIMESTAMP,
  unread_count_user_1 INT DEFAULT 0,
  unread_count_user_2 INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_user_1 (user_1_id),
  INDEX idx_user_2 (user_2_id),
  INDEX idx_listing (listing_id),
  UNIQUE INDEX idx_unique_conversation (user_1_id, user_2_id)
);

-- Reviews Table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  reviewee_id UUID NOT NULL REFERENCES users(id),
  listing_id UUID REFERENCES listings(id),
  transaction_id UUID,

  -- Review content
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  comment TEXT,
  is_verified_transaction BOOLEAN DEFAULT FALSE,

  -- Status
  status ENUM ('PENDING', 'PUBLISHED', 'HIDDEN') DEFAULT 'PENDING',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_reviewee (reviewee_id),
  INDEX idx_reviewer (reviewer_id),
  INDEX idx_listing (listing_id),
  INDEX idx_created_at (created_at)
);

-- Transactions Table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES users(id),

  -- Payment
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method ENUM ('STRIPE', 'PAYPAL', 'ESCROW', 'TRANSFER'),
  payment_status ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'),

  -- State
  status ENUM ('PENDING', 'COMPLETED', 'DISPUTE', 'CANCELLED') DEFAULT 'PENDING',
  dispute_reason TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,

  -- Indexes
  INDEX idx_buyer (buyer_id),
  INDEX idx_seller (seller_id),
  INDEX idx_listing (listing_id),
  INDEX idx_status (status)
);

-- Saved Listings Table
CREATE TABLE saved_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE INDEX idx_unique_save (user_id, listing_id),
  INDEX idx_user (user_id),
  INDEX idx_listing (listing_id)
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Content
  type VARCHAR(50) NOT NULL, -- 'message', 'listing_view', 'offer', etc.
  title VARCHAR(255),
  body TEXT,
  data JSONB DEFAULT '{}', -- Additional data

  -- State
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,

  -- Delivery
  delivery_channels TEXT[] DEFAULT '{in_app}', -- 'in_app', 'push', 'email', 'sms'

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,

  -- Indexes
  INDEX idx_user (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
);
```

### Indexing Strategy

```sql
-- Search optimization indexes
CREATE INDEX idx_listings_search
ON listings USING GIN(to_tsvector('english', title || ' ' || description));

CREATE INDEX idx_listings_location_distance
ON listings USING GIST(
  ll_to_earth(location_lat, location_lng)
);

-- Performance indexes
CREATE INDEX idx_messages_conversation_created
ON messages(conversation_id, created_at DESC);

CREATE INDEX idx_listings_active_category_price
ON listings(category, price)
WHERE status = 'ACTIVE';

-- Cache-friendly indexes
CREATE INDEX idx_hot_listings
ON listings(created_at DESC)
WHERE status = 'ACTIVE' AND is_featured = TRUE;
```

---

## API SPECIFICATIONS

### Authentication Endpoints

```typescript
// POST /api/auth/signup
Request: {
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber?: string
}
Response: {
  user: User
  accessToken: string
  refreshToken: string
}

// POST /api/auth/login
Request: { email: string; password: string }
Response: { user: User; accessToken: string; refreshToken: string }

// POST /api/auth/verify-email
Request: { email: string; code: string }
Response: { verified: boolean }

// POST /api/auth/refresh
Request: { refreshToken: string }
Response: { accessToken: string; expiresIn: number }

// POST /api/auth/logout
Response: { success: boolean }

// POST /api/auth/mfa/setup
Response: { secret: string; qrCode: string }

// POST /api/auth/mfa/verify
Request: { code: string }
Response: { verified: boolean }
```

### Listing Endpoints

```typescript
// GET /api/listings?status=ACTIVE&page=1&limit=20
Response: {
  listings: Listing[]
  total: number
  page: number
  pageSize: number
}

// POST /api/listings
Headers: Authorization
Request: CreateListingRequest
Response: { listing: Listing; success: boolean }

// GET /api/listings/:id
Response: { listing: Listing; relatedListings: Listing[] }

// PATCH /api/listings/:id
Headers: Authorization
Request: UpdateListingRequest
Response: { listing: Listing }

// DELETE /api/listings/:id
Headers: Authorization
Response: { success: boolean }

// POST /api/listings/:id/images
Headers: Authorization, Content-Type: multipart/form-data
Request: FormData with images
Response: { imageUrls: string[] }

// POST /api/listings/:id/publish
Headers: Authorization
Response: { listing: Listing; publishedAt: Date }
```

### Search Endpoint

```typescript
// POST /api/search
Request: {
  query?: string
  filters: {
    category?: string
    priceMin?: number
    priceMax?: number
    location?: { lat: number; lng: number; radius: number }
    amenities?: string[]
    attributes?: Record<string, any>
  }
  sort?: 'relevance' | 'newest' | 'price_asc' | 'price_desc' | 'rating'
  page?: number
  limit?: number
}
Response: {
  results: Listing[]
  facets: {
    categories: { name: string; count: number }[]
    priceRanges: { range: string; count: number }[]
  }
  total: number
  executionTimeMs: number
}

// GET /api/search/autocomplete?q=query
Response: {
  suggestions: Array<{
    text: string
    type: 'query' | 'listing' | 'user'
    metadata?: any
  }>
}
```

### Messaging Endpoints

```typescript
// GET /api/conversations
Headers: Authorization
Response: {
  conversations: Conversation[]
  unreadCount: number
}

// POST /api/conversations/:conversationId/messages
Headers: Authorization
Request: { content: string }
Response: { message: Message }

// GET /api/conversations/:conversationId/messages?page=1&limit=20
Headers: Authorization
Response: {
  messages: Message[]
  total: number
}

// PATCH /api/messages/:messageId/read
Headers: Authorization
Response: { success: boolean }

// GET /api/conversations/:conversationId/status
Headers: Authorization
Response: {
  otherUser: User
  isOnline: boolean
  lastSeen?: Date
}
```

### User Profile Endpoints

```typescript
// GET /api/users/:userId
Response: {
  user: User
  stats: {
    listingCount: number
    averageRating: number
    responseTime: number
  }
  reviews: Review[]
}

// PATCH /api/users/profile
Headers: Authorization
Request: UpdateProfileRequest
Response: { user: User }

// GET /api/users/me
Headers: Authorization
Response: { user: User }

// POST /api/users/profile-photo
Headers: Authorization, Content-Type: multipart/form-data
Request: FormData with image
Response: { photoUrl: string }

// POST /api/users/preferences
Headers: Authorization
Request: { notificationSettings: any; privacySettings: any }
Response: { preferences: UserPreferences }
```

### Analytics Endpoints

```typescript
// GET /api/analytics/listings/:listingId
Headers: Authorization
Response: {
  views: number
  viewsToday: number
  saves: number
  inquiries: number
  conversionRate: number
  topReferrers: Array<{ source: string; count: number }>
}

// GET /api/analytics/user/dashboard
Headers: Authorization
Response: {
  totalViews: number
  totalInquiries: number
  responseRate: number
  conversionMetrics: any
  topListings: Listing[]
}

// POST /api/analytics/track
Request: {
  eventType: string
  entityType: 'listing' | 'user'
  entityId: string
  properties?: Record<string, any>
}
Response: { success: boolean }
```

---

## MOBILE APP ARCHITECTURE

### React Native Project Structure

```typescript
// app.tsx - Entry point
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useAuth } from './hooks/useAuth'
import { useOfflineSync } from './hooks/useOfflineSync'

export default function App() {
  const { authState, isLoading } = useAuth()
  const { isSyncing } = useOfflineSync()

  if (isLoading) {
    return <SplashScreen />
  }

  return (
    <NavigationContainer>
      {authState.isLoggedIn ? <AppNavigation /> : <AuthNavigation />}
    </NavigationContainer>
  )
}
```

### Navigation Structure

```typescript
// Navigation patterns
const AppNavigation = () => {
  const Tab = createBottomTabNavigator()
  const Stack = createNativeStackNavigator()

  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: HomeIcon
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStack}
        options={{ tabBarLabel: 'Search' }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesStack}
        options={{
          tabBarLabel: 'Messages',
          tabBarBadge: unreadCount
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  )
}

// Stack navigators for each tab
const HomeStack = () => {
  const Stack = createNativeStackNavigator()
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomePage" component={HomeScreen} />
      <Stack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    </Stack.Navigator>
  )
}
```

### Offline-First Implementation

```typescript
// hooks/useOfflineSync.ts
import { useCallback, useEffect, useState } from 'react'
import NetInfo from '@react-native-community/netinfo'
import { useDatabase } from './useDatabase'

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const db = useDatabase()

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected && state.isInternetReachable
      setIsOnline(online)

      // Trigger sync when coming back online
      if (online) {
        syncPendingChanges()
      }
    })

    return unsubscribe
  }, [])

  const syncPendingChanges = useCallback(async () => {
    setIsSyncing(true)
    try {
      // Get pending operations from local DB
      const pendingOps = await db.query(
        'SELECT * FROM pending_operations WHERE status = ?',
        ['PENDING']
      )

      for (const op of pendingOps) {
        try {
          await api.execute(op.operation, op.payload)
          await db.execute(
            'UPDATE pending_operations SET status = ? WHERE id = ?',
            ['SYNCED', op.id]
          )
        } catch (error) {
          console.error('Sync failed for operation:', op.id, error)
        }
      }
    } finally {
      setIsSyncing(false)
    }
  }, [])

  return {
    isOnline,
    isSyncing,
    syncPendingChanges
  }
}
```

### Local Database (SQLite)

```typescript
// lib/sqlite/db.ts
import SQLite from 'expo-sqlite'

const DB_NAME = 'puraestate.db'

export const useDatabase = () => {
  const [db, setDb] = useState<SQLite.Database | null>(null)

  useEffect(() => {
    const setupDatabase = async () => {
      const database = await SQLite.openDatabaseAsync(DB_NAME)

      // Initialize schema
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT,
          firstName TEXT,
          lastName TEXT,
          photoUrl TEXT,
          syncedAt INTEGER
        );

        CREATE TABLE IF NOT EXISTS listings (
          id TEXT PRIMARY KEY,
          userId TEXT,
          title TEXT,
          description TEXT,
          price REAL,
          imageUrls TEXT,
          status TEXT,
          syncedAt INTEGER,
          FOREIGN KEY (userId) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          conversationId TEXT,
          senderId TEXT,
          content TEXT,
          createdAt INTEGER,
          isRead INTEGER DEFAULT 0,
          status TEXT DEFAULT 'PENDING'
        );

        CREATE TABLE IF NOT EXISTS pending_operations (
          id TEXT PRIMARY KEY,
          operation TEXT,
          payload TEXT,
          status TEXT,
          createdAt INTEGER,
          retryCount INTEGER DEFAULT 0
        );

        CREATE INDEX idx_user_sync ON users(syncedAt);
        CREATE INDEX idx_listing_status ON listings(status);
        CREATE INDEX idx_message_conversation ON messages(conversationId);
      `)

      setDb(database)
    }

    setupDatabase()
  }, [])

  const query = async (sql: string, params: any[] = []) => {
    if (!db) throw new Error('Database not initialized')
    return db.getAllAsync(sql, params)
  }

  const execute = async (sql: string, params: any[] = []) => {
    if (!db) throw new Error('Database not initialized')
    return db.runAsync(sql, params)
  }

  return { query, execute }
}
```

### Push Notifications

```typescript
// hooks/usePushNotifications.ts
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'

export const usePushNotifications = () => {
  useEffect(() => {
    registerForPushNotifications()

    // Handle notification received while app is foreground
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification)
        // Update app state
        handleNotificationReceived(notification)
      }
    )

    // Handle notification tapped
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        navigateToNotificationTarget(response.notification)
      })

    return () => {
      subscription.remove()
      responseSubscription.remove()
    }
  }, [])

  const registerForPushNotifications = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync()

      if (status !== 'granted') {
        console.warn('Push notification permission not granted')
        return
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId
      })

      // Save token to backend
      await api.post('/notifications/token', {
        token: token.data,
        platform: Platform.OS
      })

      // Configure notification categories
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        })
      }
    } catch (error) {
      console.error('Failed to register for push notifications:', error)
    }
  }

  return { registerForPushNotifications }
}
```

### Location Services

```typescript
// hooks/useLocation.ts
import * as Location from 'expo-location'
import { useEffect, useState } from 'react'

export const useLocation = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [watching, setWatching] = useState(false)

  const requestPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      setErrorMsg('Location permission not granted')
      return false
    }
    return true
  }

  const getCurrentLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      })
      setLocation(currentLocation)
      return currentLocation
    } catch (error) {
      setErrorMsg('Failed to get location')
      return null
    }
  }

  const startWatching = async () => {
    try {
      const granted = await requestPermissions()
      if (!granted) return

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 100
        },
        (newLocation) => {
          setLocation(newLocation)
        }
      )

      setWatching(true)
      return subscription
    } catch (error) {
      setErrorMsg('Failed to watch location')
      return null
    }
  }

  return {
    location,
    errorMsg,
    watching,
    getCurrentLocation,
    startWatching,
    requestPermissions
  }
}
```

---

## WEB (NEXT.JS) ARCHITECTURE

### Server-Side Rendering Strategy

```typescript
// pages/search/[...query].tsx
import { GetServerSideProps } from 'next'
import { api } from '@/lib/api/client'

interface SearchPageProps {
  results: Listing[]
  query: string
  total: number
}

export const getServerSideProps: GetServerSideProps<SearchPageProps> = async (context) => {
  const { query } = context.params as { query: string[] }
  const searchQuery = query?.join(' ') || ''
  const page = context.query.page || 1

  try {
    // Server-side search for SEO
    const results = await api.post('/search', {
      query: searchQuery,
      page,
      limit: 20
    })

    return {
      props: {
        results: results.data.results,
        query: searchQuery,
        total: results.data.total
      },
      revalidate: 300 // ISR - revalidate every 5 minutes
    }
  } catch (error) {
    return {
      notFound: true,
      revalidate: 60
    }
  }
}

export default function SearchPage({ results, query, total }: SearchPageProps) {
  const [clientResults, setClientResults] = useState(results)
  const [page, setPage] = useState(1)

  // Client-side pagination and filtering
  const handleFilterChange = async (filters: any) => {
    const response = await api.post('/search', {
      query,
      filters,
      page: 1
    })
    setClientResults(response.data.results)
  }

  return (
    <Layout>
      <Head>
        <title>Search: {query} | PuraEstate</title>
        <meta name="description" content={`Search results for ${query}`} />
        <meta property="og:title" content={`Search: ${query} | PuraEstate`} />
      </Head>

      <div className="flex gap-6">
        <FilterPanel onFilterChange={handleFilterChange} />
        <ResultsList results={clientResults} total={total} />
      </div>
    </Layout>
  )
}
```

### Dynamic Listing Pages with ISR

```typescript
// pages/listings/[id].tsx
export const getStaticPaths: GetStaticPaths = async () => {
  // Generate popular listings at build time
  const listings = await api.get('/listings?limit=100&sort=popular')

  const paths = listings.data.map((listing: Listing) => ({
    params: { id: listing.id }
  }))

  return {
    paths,
    fallback: 'blocking' // Generate other pages on-demand
  }
}

export const getStaticProps: GetStaticProps<ListingPageProps> = async ({
  params
}) => {
  const { id } = params as { id: string }

  try {
    const [listing, relatedListings] = await Promise.all([
      api.get(`/listings/${id}`),
      api.get(`/listings?category=${listing.category}&limit=4`)
    ])

    return {
      props: {
        listing: listing.data,
        relatedListings: relatedListings.data
      },
      revalidate: 3600 // ISR every hour
    }
  } catch (error) {
    return {
      notFound: true,
      revalidate: 60
    }
  }
}
```

### Admin Dashboard

```typescript
// pages/admin/dashboard.tsx
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api/client'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      router.push('/')
      return
    }

    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/dashboard')
      setStats(response.data)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <AdminLayout>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={stats.totalUsers} />
        <StatCard label="Active Listings" value={stats.activeListings} />
        <StatCard label="Today's Revenue" value={`$${stats.todaysRevenue}`} />
        <StatCard label="Disputes" value={stats.openDisputes} />
      </div>

      <TabGroup defaultTab="users">
        <Tab label="Users">
          <UsersTable />
        </Tab>
        <Tab label="Listings">
          <ListingsTable />
        </Tab>
        <Tab label="Moderation">
          <ModerationQueue />
        </Tab>
        <Tab label="Reports">
          <ReportsTable />
        </Tab>
      </TabGroup>
    </AdminLayout>
  )
}
```

### SEO Optimization

```typescript
// components/SEO.tsx
import Head from 'next/head'
import { useRouter } from 'next/router'

interface SEOProps {
  title: string
  description: string
  image?: string
  url?: string
  type?: string
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  image = '/og-image.png',
  url,
  type = 'website'
}) => {
  const router = useRouter()
  const canonicalUrl = url || `https://puraestate.com${router.asPath}`

  return (
    <Head>
      {/* Basic Meta */}
      <title>{title} | PuraEstate</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="PuraEstate" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': type === 'product' ? 'Product' : 'WebSite',
            name: title,
            description: description,
            image: image
          })
        }}
      />
    </Head>
  )
}
```

---

## AI & AUTOMATION INTEGRATION

### Smart Matching Algorithm

```typescript
// packages/ai-engine/src/matching/algorithm.ts
import { vectorize } from './vectorizer'
import openrouter from './integrations/openrouter'

interface MatchingProfile {
  userId: string
  preferences: Record<string, any>
  vector: number[]
  history: string[]
}

interface MatchResult {
  listingId: string
  score: number
  reasons: string[]
}

class MatchingEngine {
  private profiles: Map<string, MatchingProfile> = new Map()

  async getMatches(
    userId: string,
    limit: number = 10
  ): Promise<MatchResult[]> {
    const userProfile = await this.getUserProfile(userId)
    const listings = await this.getRelevantListings(userProfile)

    // Vector-based similarity matching
    const scores = listings.map((listing) => {
      const listingVector = vectorize(listing)
      const similarity = this.cosineSimilarity(
        userProfile.vector,
        listingVector
      )

      return {
        listingId: listing.id,
        score: similarity,
        listing
      }
    })

    // Re-rank with AI
    const topCandidates = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.ceil(limit * 1.5))

    const reranked = await this.reRankWithAI(userProfile, topCandidates)

    return reranked.slice(0, limit)
  }

  private async reRankWithAI(
    profile: MatchingProfile,
    candidates: any[]
  ): Promise<MatchResult[]> {
    const prompt = `
      User Profile:
      - Preferences: ${JSON.stringify(profile.preferences)}
      - Search History: ${profile.history.join(', ')}

      Candidates to rank:
      ${candidates.map((c) => `- ${c.listingId}: ${c.listing.title}`).join('\n')}

      Provide a JSON array with rankings and reasons for the top matches.
    `

    const response = await openrouter.complete({
      prompt,
      model: 'mistral-7b-instruct',
      maxTokens: 500
    })

    return JSON.parse(response.content)
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
    return dotProduct / (magnitudeA * magnitudeB)
  }

  private async getUserProfile(userId: string): Promise<MatchingProfile> {
    // Fetch or compute user profile
    const user = await db.query('SELECT * FROM users WHERE id = ?', [userId])
    const preferences = await db.query(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [userId]
    )
    const history = await db.query(
      'SELECT listing_id FROM search_history WHERE user_id = ? LIMIT 50',
      [userId]
    )

    return {
      userId,
      preferences,
      vector: vectorize(user, preferences),
      history: history.map((h) => h.listing_id)
    }
  }

  private async getRelevantListings(profile: MatchingProfile) {
    // Get listings matching basic preferences
    return db.query(
      `SELECT * FROM listings WHERE status = 'ACTIVE' AND category = ?`,
      [profile.preferences.category]
    )
  }
}

export const matchingEngine = new MatchingEngine()
```

### Automated Description Generation

```typescript
// packages/ai-engine/src/generation/descriptionGen.ts
import openrouter from '../integrations/openrouter'

interface DescriptionRequest {
  title: string
  attributes: Record<string, any>
  amenities?: string[]
  images?: string[]
  category: string
}

interface GeneratedContent {
  description: string
  keywords: string[]
  seoTitle: string
}

export async function generateDescription(
  request: DescriptionRequest
): Promise<GeneratedContent> {
  const imageDescriptions = request.images
    ? await analyzeImages(request.images)
    : []

  const prompt = `
    You are an expert real estate listing writer. Generate a compelling, SEO-optimized description.

    Title: ${request.title}
    Category: ${request.category}

    Attributes:
    ${Object.entries(request.attributes)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join('\n')}

    ${request.amenities ? `Amenities: ${request.amenities.join(', ')}` : ''}

    ${imageDescriptions.length > 0 ? `Image Analysis:\n${imageDescriptions.join('\n')}` : ''}

    Requirements:
    1. Write 150-300 word description
    2. Use active voice
    3. Highlight key features
    4. Include relevant keywords
    5. Be compelling but honest
    6. Format with line breaks for readability

    Also provide:
    - 5-10 relevant keywords
    - SEO-optimized title (60 chars max)

    Return as JSON: {
      "description": "...",
      "keywords": [...],
      "seoTitle": "..."
    }
  `

  const response = await openrouter.complete({
    prompt,
    model: 'gpt-3.5-turbo',
    maxTokens: 800,
    temperature: 0.7
  })

  return JSON.parse(response.content)
}

async function analyzeImages(imageUrls: string[]): Promise<string[]> {
  return Promise.all(
    imageUrls.slice(0, 3).map((url) =>
      openrouter.visionAnalyze({
        imageUrl: url,
        prompt: 'Describe what you see in this image in 1-2 sentences'
      })
    )
  )
}
```

### Composio Integration for Automations

```typescript
// packages/ai-engine/src/integrations/composio.ts
import Composio from '@composio/sdk'

const composio = new Composio()

export class ComposioAutomations {
  async sendWhatsAppMessage(
    phoneNumber: string,
    message: string,
    mediaUrl?: string
  ) {
    return composio.execute('whatsapp_send_message', {
      phoneNumber,
      message,
      mediaUrl
    })
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    attachments?: string[]
  ) {
    return composio.execute('send_email', {
      to,
      subject,
      body,
      attachments
    })
  }

  async scheduleCalendarEvent(
    title: string,
    description: string,
    startTime: Date,
    endTime: Date,
    attendees: string[]
  ) {
    return composio.execute('google_calendar_create_event', {
      title,
      description,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      attendees
    })
  }

  async createCRMDeal(
    dealName: string,
    amount: number,
    stage: string,
    contactId: string
  ) {
    return composio.execute('hubspot_create_deal', {
      name: dealName,
      amount,
      stage,
      contact_id: contactId
    })
  }

  // Workflow automation - multi-step processes
  async newListingWorkflow(listing: any, seller: any) {
    try {
      // Step 1: Send seller confirmation email
      await this.sendEmail(
        seller.email,
        'Your Listing is Live!',
        `Your listing "${listing.title}" is now active on PuraEstate.`
      )

      // Step 2: Send WhatsApp notification
      await this.sendWhatsAppMessage(
        seller.phoneNumber,
        `Great! Your "${listing.title}" listing is live. View it at https://puraestate.com/listings/${listing.id}`
      )

      // Step 3: Create CRM opportunity
      await this.createCRMDeal(
        listing.title,
        listing.price,
        'Active',
        seller.id
      )

      // Step 4: Schedule follow-up reminder
      const followUpDate = new Date()
      followUpDate.setDate(followUpDate.getDate() + 7)

      await this.scheduleCalendarEvent(
        `Follow-up: ${listing.title}`,
        `Check on listing performance`,
        followUpDate,
        new Date(followUpDate.getTime() + 30 * 60000),
        [seller.email]
      )

      return { success: true }
    } catch (error) {
      console.error('Workflow error:', error)
      throw error
    }
  }

  // Smart inquiry response
  async inquiryReceivedWorkflow(inquiry: any, listing: any, seller: any) {
    const prompt = `
      Generate a friendly, professional response to this inquiry about "${listing.title}".
      Inquiry: "${inquiry.message}"
      Keep it under 150 words.
    `

    const response = await openrouter.complete({
      prompt,
      model: 'gpt-3.5-turbo',
      maxTokens: 200
    })

    // Send response via WhatsApp if buyer has number
    if (inquiry.buyerPhoneNumber) {
      await this.sendWhatsAppMessage(
        inquiry.buyerPhoneNumber,
        response.content
      )
    }

    // Send response via email
    await this.sendEmail(
      inquiry.buyerEmail,
      `Response to your inquiry: ${listing.title}`,
      response.content
    )
  }
}

export const composioAutomations = new ComposioAutomations()
```

### Price Optimization

```typescript
// packages/ai-engine/src/generation/priceOptimizer.ts
import openrouter from '../integrations/openrouter'

interface PriceAnalysis {
  suggestedPrice: number
  priceRange: { min: number; max: number }
  confidence: number
  reasoning: string
  comparables: any[]
}

export async function analyzePricing(
  listing: any,
  marketData: any
): Promise<PriceAnalysis> {
  // Get comparable listings
  const comparables = await db.query(
    `SELECT price FROM listings
     WHERE category = ? AND location_city = ?
     AND status = 'ACTIVE'
     AND created_at > NOW() - INTERVAL '90 days'
     ORDER BY created_at DESC
     LIMIT 20`,
    [listing.category, listing.location_city]
  )

  const avgPrice = comparables.reduce((sum, c) => sum + c.price, 0) / comparables.length
  const medianPrice = comparables.sort((a, b) => a.price - b.price)[
    Math.floor(comparables.length / 2)
  ].price

  const prompt = `
    Analyze the market pricing for this listing:

    Listing: ${listing.title}
    Current Price: ${listing.price}
    Market Average: ${avgPrice}
    Market Median: ${medianPrice}

    Attributes:
    ${JSON.stringify(listing.attributes)}

    Market Trends:
    - Price change (90d): ${marketData.priceChange}%
    - Avg time on market: ${marketData.avgDaysOnMarket} days
    - Demand index: ${marketData.demandIndex}

    Consider:
    1. Supply/demand ratio
    2. Market trends
    3. Comparable sales
    4. Listing quality/condition

    Recommend an optimal price and range to maximize sales speed and revenue.

    Return JSON: {
      "suggestedPrice": number,
      "priceRange": {"min": number, "max": number},
      "confidence": 0-1,
      "reasoning": "..."
    }
  `

  const response = await openrouter.complete({
    prompt,
    model: 'gpt-3.5-turbo',
    maxTokens: 400
  })

  const analysis = JSON.parse(response.content)

  return {
    ...analysis,
    comparables: comparables.slice(0, 5)
  }
}
```

---

## REAL-TIME FEATURES

### WebSocket Messaging Architecture

```typescript
// packages/backend/src/websocket/handlers.ts
import { Server as SocketIOServer } from 'socket.io'
import { verifyToken } from '@/middleware/auth'

export function setupWebSocketHandlers(io: SocketIOServer) {
  // Middleware for auth
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      const user = await verifyToken(token)
      socket.userId = user.id
      next()
    } catch (error) {
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`)

    // User comes online
    socket.on('user:online', () => {
      socket.broadcast.emit('user:status', {
        userId: socket.userId,
        status: 'online'
      })
      socket.join(`user:${socket.userId}`)
    })

    // User goes offline
    socket.on('disconnect', () => {
      socket.broadcast.emit('user:status', {
        userId: socket.userId,
        status: 'offline',
        lastSeen: new Date()
      })
    })

    // Message events
    socket.on('message:send', async (data) => {
      const { conversationId, content } = data

      // Validate permission
      const conversation = await db.query(
        'SELECT * FROM conversations WHERE id = ?',
        [conversationId]
      )

      if (
        ![conversation.user_1_id, conversation.user_2_id].includes(
          socket.userId
        )
      ) {
        return socket.emit('error', 'Unauthorized')
      }

      // Save message
      const message = await db.query(
        `INSERT INTO messages (conversation_id, sender_id, content, created_at)
         VALUES (?, ?, ?, NOW())
         RETURNING *`,
        [conversationId, socket.userId, content]
      )

      // Emit to recipient
      const recipientId =
        conversation.user_1_id === socket.userId
          ? conversation.user_2_id
          : conversation.user_1_id

      io.to(`user:${recipientId}`).emit('message:new', {
        conversationId,
        message,
        sender: {
          id: socket.userId,
          name: 'User Name' // Get from cache
        }
      })

      // Acknowledge to sender
      socket.emit('message:sent', { messageId: message.id })
    })

    // Typing indicator
    socket.on('typing:start', (conversationId) => {
      socket.broadcast.to(`conversation:${conversationId}`).emit('typing', {
        userId: socket.userId,
        isTyping: true
      })
    })

    socket.on('typing:stop', (conversationId) => {
      socket.broadcast.to(`conversation:${conversationId}`).emit('typing', {
        userId: socket.userId,
        isTyping: false
      })
    })

    // Notification events
    socket.on('notification:read', async (notificationId) => {
      await db.query(
        'UPDATE notifications SET is_read = TRUE WHERE id = ?',
        [notificationId]
      )
      socket.emit('notification:read-confirmed', { notificationId })
    })

    // Listing updates (for sellers/admins watching)
    socket.on('listing:watch', (listingId) => {
      socket.join(`listing:${listingId}`)
    })

    socket.on('listing:unwatch', (listingId) => {
      socket.leave(`listing:${listingId}`)
    })
  })

  return io
}

// Emit listing updates to watchers
export function emitListingUpdate(io: SocketIOServer, listingId: string, update: any) {
  io.to(`listing:${listingId}`).emit('listing:updated', {
    listingId,
    update,
    timestamp: new Date()
  })
}
```

### Real-Time Notifications

```typescript
// packages/backend/src/services/NotificationService.ts
import admin from 'firebase-admin'
import { composioAutomations } from '@/packages/ai-engine/src/integrations/composio'

export class NotificationService {
  async notifyNewMessage(conversationId: string, message: any) {
    const conversation = await db.query(
      'SELECT * FROM conversations WHERE id = ?',
      [conversationId]
    )

    const recipientId =
      conversation.user_1_id === message.sender_id
        ? conversation.user_2_id
        : conversation.user_1_id

    const recipient = await db.query('SELECT * FROM users WHERE id = ?', [
      recipientId
    ])

    // In-app notification
    await this.createInAppNotification({
      userId: recipientId,
      type: 'message',
      title: 'New message',
      body: message.content.substring(0, 100),
      data: {
        conversationId,
        messageId: message.id
      }
    })

    // Push notification
    if (recipient.fcm_token) {
      await admin.messaging().send({
        token: recipient.fcm_token,
        notification: {
          title: 'New message',
          body: message.content.substring(0, 100)
        },
        data: {
          type: 'message',
          conversationId,
          messageId: message.id
        }
      })
    }

    // Email notification (if enabled)
    if (recipient.notification_preferences.emailOnMessages) {
      await composioAutomations.sendEmail(
        recipient.email,
        'New message on PuraEstate',
        `You have a new message in conversation ${conversationId}`
      )
    }

    // SMS notification (if enabled)
    if (recipient.notification_preferences.smsOnMessages && recipient.phone) {
      // Use Twilio via Composio
      await composioAutomations.sendSMS(
        recipient.phone,
        'You have a new message on PuraEstate'
      )
    }
  }

  async notifyListingViewed(listing: any, viewer: any) {
    const seller = await db.query('SELECT * FROM users WHERE id = ?', [
      listing.user_id
    ])

    if (seller.notification_preferences.listingViews) {
      await this.createInAppNotification({
        userId: seller.id,
        type: 'listing_view',
        title: 'Your listing viewed',
        body: `${viewer.firstName} viewed "${listing.title}"`,
        data: {
          listingId: listing.id,
          viewerId: viewer.id
        }
      })
    }
  }

  async notifyNewOffer(offer: any) {
    const seller = await db.query(
      'SELECT * FROM users WHERE id = ? ',
      [offer.seller_id]
    );

    await this.createInAppNotification({
      userId: seller.id,
      type: 'offer',
      title: 'New offer',
      body: `${offer.buyer_name} made an offer`,
      data: {
        offerId: offer.id,
        listingId: offer.listing_id
      }
    })
  }

  private async createInAppNotification(notification: any) {
    return db.query(
      `INSERT INTO notifications (user_id, type, title, body, data, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        notification.userId,
        notification.type,
        notification.title,
        notification.body,
        JSON.stringify(notification.data)
      ]
    )
  }
}

export const notificationService = new NotificationService()
```

---

## MIGRATION PLAN

### Phase 1: Data Migration (Week -1)

```bash
# Export current data from legacy puraestate
1. Database export (SQL dump)
   - Users
   - Listings
   - Transactions
   - Messages

2. Data mapping
   - Old schema → New schema
   - Handle missing fields
   - Validate data integrity

3. Image migration
   - Download from legacy S3
   - Upload to new S3/GCS
   - Generate thumbnails
   - Update URLs

4. User authentication
   - Hash passwords (if not already)
   - Create refresh tokens
   - Migrate auth tokens
```

### Phase 2: MVP Backend (Week 1)

```typescript
// Migration script
import { migrateUsers } from './migrations/users'
import { migrateListings } from './migrations/listings'
import { migrateMessages } from './migrations/messages'

async function runMigration() {
  console.log('Starting migration...')

  try {
    console.log('Migrating users...')
    const userCount = await migrateUsers()
    console.log(`✓ Migrated ${userCount} users`)

    console.log('Migrating listings...')
    const listingCount = await migrateListings()
    console.log(`✓ Migrated ${listingCount} listings`)

    console.log('Migrating messages...')
    const messageCount = await migrateMessages()
    console.log(`✓ Migrated ${messageCount} messages`)

    console.log('Migration complete!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
```

### Phase 3: Web & Mobile Launch (Week 2-3)

```bash
# Staging deployment
1. Deploy backend to staging
2. Deploy web to staging (Vercel)
3. Deploy mobile to beta track
4. Run integration tests
5. UAT with stakeholders

# Production deployment
1. Health checks
2. Database backups
3. Enable feature flags
4. Gradual rollout (10% → 25% → 50% → 100%)
5. Monitor metrics
```

### Phase 4: AI & Automation (Week 4)

```bash
# Enable AI features
1. Deploy AI service
2. Configure OpenRouter API
3. Start generation jobs
4. Enable smart matching
5. Activate Composio automations
6. Monitor costs
```

---

## IMPLEMENTATION TIMELINE

### Week 1: MVP Backend & Core Features

**Days 1-2: Project Setup**
- [ ] Repository structure initialization
- [ ] Docker compose for local development
- [ ] GitHub Actions CI/CD pipelines
- [ ] Database setup with migrations
- [ ] Redis cache setup
- [ ] Basic authentication system

**Days 3-4: Core APIs**
- [ ] User authentication (JWT, OAuth)
- [ ] Listing CRUD operations
- [ ] Search & filtering
- [ ] Image upload handling
- [ ] Basic validation & error handling

**Days 5-7: Real-time & Data**
- [ ] WebSocket messaging setup
- [ ] Message persistence
- [ ] Notification system (in-app)
- [ ] Rate limiting & security
- [ ] Logging & monitoring

### Week 2: Web Platform Launch

**Days 1-2: Web Setup**
- [ ] Next.js project scaffolding
- [ ] Authentication pages
- [ ] Listing pages (create, edit, detail)
- [ ] Search & filtering UI
- [ ] Admin dashboard skeleton

**Days 3-4: Web Features**
- [ ] User profile management
- [ ] Messaging UI
- [ ] Notification display
- [ ] Real-time sync
- [ ] Offline support (PWA)

**Days 5-7: Polish & Deploy**
- [ ] SEO optimization
- [ ] Performance tuning
- [ ] Mobile responsive design
- [ ] Bug fixes
- [ ] Deploy to Vercel (staging)

### Week 3: Mobile App Launch

**Days 1-3: Mobile Setup**
- [ ] React Native project (Expo)
- [ ] Navigation structure
- [ ] Authentication flows
- [ ] Listing screens

**Days 4-5: Mobile Features**
- [ ] Offline-first sync
- [ ] Push notifications
- [ ] Location services
- [ ] Camera integration
- [ ] Local storage (SQLite)

**Days 6-7: Testing & Beta**
- [ ] iOS build & TestFlight
- [ ] Android build & internal testing
- [ ] Bug fixes
- [ ] Beta user feedback

### Week 4: AI & Automations

**Days 1-2: AI Integration**
- [ ] OpenRouter API setup
- [ ] Smart matching algorithm
- [ ] Description generation
- [ ] Price optimization

**Days 3-4: Composio Automations**
- [ ] WhatsApp integration
- [ ] Email automation
- [ ] SMS notifications
- [ ] Calendar integration

**Days 5-7: Monitoring & Optimization**
- [ ] AI quality monitoring
- [ ] Cost optimization
- [ ] Performance tuning
- [ ] Documentation
- [ ] Full feature launch

---

## CODE EXAMPLES

### Express Backend Setup

```typescript
// packages/backend/src/index.ts
import express from 'express'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import compression from 'compression'

import authRoutes from './routes/auth'
import listingRoutes from './routes/listings'
import searchRoutes from './routes/search'
import messageRoutes from './routes/messages'
import adminRoutes from './routes/admin'

import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/logger'
import { setupWebSocketHandlers } from './websocket/handlers'

const app = express()
const server = http.createServer(app)
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
})

// Middleware
app.use(helmet())
app.use(compression())
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
})
app.use('/api/', limiter)

// Logging
app.use(requestLogger)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/listings', listingRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/admin', adminRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime()
  })
})

// WebSocket setup
setupWebSocketHandlers(io)

// Error handling (must be last)
app.use(errorHandler)

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV}`)
})
```

### React Custom Hook for Data Fetching

```typescript
// apps/web/hooks/useListings.ts
import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { Listing } from '@/types'

interface UseListingsOptions {
  page?: number
  limit?: number
  userId?: string
  status?: string
}

export const useListings = (options: UseListingsOptions = {}) => {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState(options)

  // Fetch listings
  const {
    data: listingsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['listings', filters],
    queryFn: async () => {
      const response = await api.get('/listings', { params: filters })
      return response.data
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Create listing mutation
  const createMutation = useMutation({
    mutationFn: (listing: Partial<Listing>) =>
      api.post('/listings', listing),
    onSuccess: (newListing) => {
      // Update cache
      queryClient.setQueryData(['listings', filters], (old: any) => ({
        ...old,
        listings: [newListing, ...old.listings]
      }))
    }
  })

  // Update listing mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Listing> }) =>
      api.patch(`/listings/${id}`, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      queryClient.setQueryData(['listing', updated.id], updated)
    }
  })

  // Delete listing mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/listings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] })
    }
  })

  return {
    listings: listingsData?.listings || [],
    total: listingsData?.total || 0,
    isLoading,
    error,
    refetch,
    filters,
    setFilters,
    createListing: createMutation.mutate,
    updateListing: updateMutation.mutate,
    deleteListing: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  }
}
```

### Mobile Navigation Setup

```typescript
// apps/mobile/app/_layout.tsx
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { Stack, Redirect } from 'expo-router'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import SplashScreen from './SplashScreen'

export default function RootLayout() {
  const { authState, isLoading } = useAuth()
  const { isSyncing } = useOfflineSync()
  usePushNotifications()

  useEffect(() => {
    if (!isLoading && isSyncing === false) {
      // Hide splash screen
      SplashScreen.hideAsync()
    }
  }, [isLoading, isSyncing])

  if (isLoading) {
    return <SplashScreen />
  }

  if (!authState.isLoggedIn) {
    return <Redirect href="/login" />
  }

  return (
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="(modals)/filter"
        options={{
          presentation: 'modal',
          title: 'Filters'
        }}
      />
      <Stack.Screen
        name="(modals)/create"
        options={{
          presentation: 'modal',
          title: 'New Listing'
        }}
      />
    </Stack>
  )
}
```

---

## DEPLOYMENT & DEVOPS

### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: puraestate
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USER}']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/puraestate
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}
      COMPOSIO_API_KEY: ${COMPOSIO_API_KEY}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      AWS_S3_BUCKET: ${AWS_S3_BUCKET}
    ports:
      - '3000:3000'
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./packages/backend/src:/app/src
      - /app/node_modules
    command: npm run dev

  worker:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/puraestate
      REDIS_URL: redis://redis:6379
      WORKER_MODE: 'true'
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./packages/backend/src:/app/src
      - /app/node_modules
    command: npm run worker

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Deployment

```yaml
# k8s/deployments/backend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: puraestate-backend
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
      app: puraestate-backend
  template:
    metadata:
      labels:
        app: puraestate-backend
    spec:
      containers:
      - name: backend
        image: gcr.io/puraestate/backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: redis-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
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
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Run linting
      run: npm run lint

    - name: Run tests
      run: npm test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost/test_db

    - name: Build
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: success()

    steps:
    - uses: actions/checkout@v3

    - name: Setup Google Cloud
      uses: google-github-actions/setup-gcloud@v1
      with:
        service_account_key: ${{ secrets.GCP_SERVICE_ACCOUNT_KEY }}
        project_id: ${{ secrets.GCP_PROJECT_ID }}

    - name: Configure Docker
      run: gcloud auth configure-docker

    - name: Build Docker image
      run: docker build -f docker/Dockerfile.backend -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/backend:${{ github.sha }} .

    - name: Push Docker image
      run: docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/backend:${{ github.sha }}

    - name: Deploy to GKE
      run: |
        gcloud container clusters get-credentials puraestate-prod --zone us-central1-a
        kubectl set image deployment/puraestate-backend \
          backend=gcr.io/${{ secrets.GCP_PROJECT_ID }}/backend:${{ github.sha }} \
          -n production
        kubectl rollout status deployment/puraestate-backend -n production

    - name: Notify Slack
      if: failure()
      uses: slackapi/slack-github-action@v1
      with:
        payload: |
          {
            "text": "Deployment failed for puraestate-backend"
          }
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## MONITORING & ANALYTICS

### Key Metrics to Track

```typescript
// Performance metrics
- Page load time (Web & Mobile)
- API response times (p50, p95, p99)
- Database query performance
- WebSocket latency
- Search performance

// Business metrics
- User growth rate
- Listing creation rate
- Message volume
- Transaction volume
- Revenue metrics

// Quality metrics
- Error rates
- Failed transactions
- Search relevance (engagement)
- AI generation quality
- Customer satisfaction (NPS)

// Infrastructure metrics
- Server CPU/Memory usage
- Database connections
- Cache hit rates
- API rate limit usage
- Cost per transaction
```

### Datadog Integration

```typescript
// Initialization
import { datadogRum } from '@datadog/browser-rum'
import { datadogLogs } from '@datadog/browser-logs'

datadogRum.init({
  applicationId: process.env.NEXT_PUBLIC_DATADOG_APP_ID,
  clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN,
  site: 'datadoghq.com',
  service: 'puraestate-web',
  env: process.env.NEXT_PUBLIC_ENV,
  version: process.env.NEXT_PUBLIC_VERSION,
  sessionSampleRate: 100,
  sessionReplaySampleRate: 20,
  trackUserInteractions: true
})

datadogLogs.init({
  clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN,
  site: 'datadoghq.com',
  service: 'puraestate-web',
  env: process.env.NEXT_PUBLIC_ENV,
  forwardErrorsToLogs: true
})

datadogRum.startSessionReplayRecording()
```

---

## SECURITY CONSIDERATIONS

### Data Protection

```typescript
// Encryption at rest
- Database: Use native encryption
- S3 buckets: Enable SSE-S3
- Secrets: Store in AWS Secrets Manager

// Encryption in transit
- HTTPS/TLS 1.3
- WebSocket WSS
- HPKP headers

// Authentication
- JWT tokens with rotation
- Refresh token rotation
- MFA for admin accounts
- OAuth2 for third-party access

// Authorization
- Role-based access control
- Resource-level permissions
- Rate limiting
- API key management

// Compliance
- GDPR data handling
- CCPA privacy controls
- PCI compliance (if handling cards)
- Regular security audits
```

### Input Validation

```typescript
// Example validation
import { z } from 'zod'

const createListingSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(50).max(5000),
  price: z.number().positive(),
  category: z.enum(['property', 'service']),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }),
  images: z.array(z.string().url()).min(1).max(50)
})

// Middleware
app.post('/listings', (req, res) => {
  const result = createListingSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() })
  }
  // Process validated data
})
```

---

## CONCLUSION

This comprehensive technical blueprint provides a complete roadmap for rebuilding puraestate.com as a modern, scalable platform. The architecture is designed to be:

- **Scalable**: Microservices-ready, auto-scaling infrastructure
- **Performant**: Server-side rendering, caching strategies, CDN
- **User-Friendly**: Mobile-first, offline-first, real-time features
- **AI-Powered**: Smart matching, automated content generation, price optimization
- **Secure**: Encryption, authentication, authorization, compliance
- **Maintainable**: Clean code structure, comprehensive documentation, monitoring

### Quick Start

```bash
# Clone and setup
git clone <repo>
cd puraestate-monorepo
npm install

# Run development
docker-compose up -d
npm run dev

# Run migrations
npm run migrate

# Launch web
cd apps/web && npm run dev

# Launch mobile
cd apps/mobile && npm start

# Deploy
npm run deploy:staging
npm run deploy:production
```

---

**Document Version:** 1.0
**Last Updated:** February 24, 2026
**Author:** Claude Code Architecture Team
**Status:** Ready for Implementation
