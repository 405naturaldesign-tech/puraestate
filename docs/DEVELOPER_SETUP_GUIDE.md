# PuraEstate - Complete Developer Setup Guide

**Version:** 2.0
**Date:** February 24, 2026
**Status:** Production-Ready
**For:** Development Teams

---

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Local Development Environment](#local-development-environment)
3. [First-Time Configuration](#first-time-configuration)
4. [Running the Full Stack](#running-the-full-stack)
5. [IDE & Tools Setup](#ide--tools-setup)
6. [Database Setup & Management](#database-setup--management)
7. [Frontend Development](#frontend-development)
8. [Backend Development](#backend-development)
9. [Mobile Development](#mobile-development)
10. [Testing Setup](#testing-setup)
11. [Debugging Guide](#debugging-guide)
12. [Performance Optimization](#performance-optimization)
13. [CI/CD Pipeline](#cicd-pipeline)
14. [Troubleshooting](#troubleshooting)
15. [Quick Reference](#quick-reference)

---

## Initial Setup

### Prerequisites Checklist

Before starting, ensure you have:

```bash
# Check system requirements
uname -a                    # OS info
node --version             # Should be v18+
npm --version              # Should be v9+
git --version              # Any recent version
docker --version           # Should be v20.10+
docker-compose --version   # Should be v1.29+
```

### Step 1: Install Required Tools

#### macOS

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js (using Homebrew)
brew install node@18

# Verify installation
node --version  # v18.x.x
npm --version   # 9.x.x

# Install Docker Desktop
brew install --cask docker

# Start Docker
open /Applications/Docker.app

# Install additional tools
brew install git
brew install curl
brew install wget
brew install watchman  # For React Native file watching

# Verify Docker is running
docker ps
```

#### Ubuntu/Debian Linux

```bash
# Update package manager
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version

# Install Docker
sudo apt-get install -y docker.io docker-compose

# Add user to docker group (avoid sudo for docker commands)
sudo usermod -aG docker $USER
newgrp docker

# Install additional tools
sudo apt-get install -y git curl wget build-essential python3

# Verify Docker
docker ps
```

#### Windows (using Chocolatey)

```powershell
# Install Chocolatey (run as Administrator)
Set-ExecutionPolicy Bypass -Scope Process -Force;
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072;
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install dependencies
choco install nodejs --version=18.16.0
choco install docker-desktop
choco install git
choco install curl

# Verify
node --version
npm --version
docker --version

# Note: You may need to restart after Docker Desktop installation
```

### Step 2: Clone Repository & Install Dependencies

```bash
# Create workspace directory (optional but recommended)
mkdir -p ~/workspace
cd ~/workspace

# Clone repository
git clone https://github.com/your-org/puraestate-monorepo.git
cd puraestate-monorepo

# Verify directory structure
ls -la
# Should show: apps/, packages/, docker/, k8s/, docs/, etc.

# Install all dependencies
npm install

# This will:
# 1. Install root dependencies
# 2. Install each workspace dependencies
# 3. Link packages together
# 4. Build TypeScript if needed

# Verify installation
npm list --depth=0
npm run --list  # Show available scripts
```

---

## Local Development Environment

### Docker Compose Setup

#### Start Services

```bash
# From project root
docker-compose up -d

# Verify all services started
docker-compose ps

# Expected output:
# NAME             STATUS              PORTS
# postgres         Up 2 minutes        5432->5432/tcp
# redis            Up 2 minutes        6379->6379/tcp
```

#### Manage Services

```bash
# View logs
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f  # All services

# Stop services
docker-compose down

# Stop and remove volumes (data will be lost)
docker-compose down -v

# Restart services
docker-compose restart

# Execute command in container
docker-compose exec postgres psql -U postgres -d puraestate_dev -c "SELECT * FROM users LIMIT 5;"
```

#### Database Configuration

```bash
# Connect to PostgreSQL directly
docker-compose exec postgres psql -U postgres

# Or with connection string
psql postgresql://puraestate_user:puraestate_pass@localhost:5432/puraestate_dev

# Common commands
\dt             # List tables
\d users        # Describe users table
SELECT * FROM users;  # Query users
\q              # Quit
```

#### Redis Configuration

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Common commands in redis-cli
PING               # Test connection (responds PONG)
KEYS *             # List all keys
GET key_name       # Get value
DEL key_name       # Delete key
FLUSHDB            # Clear all keys in current database
MONITOR            # Watch commands in real-time
exit               # Quit
```

---

## First-Time Configuration

### Step 1: Create Environment Files

#### Backend (.env)

```bash
cd packages/backend
cat > .env << 'EOF'
# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database (use Docker service)
DATABASE_URL=postgresql://puraestate_user:puraestate_pass@localhost:5432/puraestate_dev
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis (use Docker service)
REDIS_URL=redis://localhost:6379

# Authentication Secrets (generate random 32+ char strings)
JWT_SECRET=your-super-secret-jwt-key-that-is-at-least-32-characters-long-change-in-prod
JWT_EXPIRY=24h
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key-at-least-32-chars-change-in-prod
REFRESH_TOKEN_EXPIRY=7d

# CORS
CORS_ORIGIN=http://localhost:3001,http://localhost:3002,http://localhost:8081
CORS_CREDENTIALS=true

# AWS S3 (for development, use local mock or real AWS credentials)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=dev-key-not-real
AWS_SECRET_ACCESS_KEY=dev-secret-not-real
AWS_S3_BUCKET=puraestate-dev

# External APIs (get from respective services)
OPENROUTER_API_KEY=sk_live_your_actual_key_here
COMPOSIO_API_KEY=your_composio_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_key_here

# Firebase (get from Firebase console)
FIREBASE_PROJECT_ID=puraestate-dev
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase@project.iam.gserviceaccount.com

# URLs
FRONTEND_URL=http://localhost:3001
MOBILE_API_URL=http://localhost:3000

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_COMPOSIO=true
EOF

# Secure the file
chmod 600 .env

# Verify file was created
cat .env
```

#### Web App (.env.local)

```bash
cd apps/web
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_ENV=development
NEXTAUTH_SECRET=your-random-secret-here-at-least-32-chars
NEXTAUTH_URL=http://localhost:3001
EOF
```

#### Mobile App (.env)

```bash
cd apps/mobile
cat > .env << 'EOF'
API_BASE_URL=http://localhost:3000
WS_BASE_URL=ws://localhost:3000
OPENROUTER_API_KEY=sk_live_your_key_here
FIREBASE_PROJECT_ID=puraestate-mobile
ENABLE_AI_FEATURES=true
ENABLE_OFFLINE_MODE=true
EOF
```

### Step 2: Generate Secrets

```bash
# Generate secure random strings for JWT secrets
# Use one of these methods:

# Method 1: OpenSSL
openssl rand -base64 32

# Method 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Method 3: Online generator (use caution)
# https://generate-random.org/

# Copy the output and paste into your .env files for:
# - JWT_SECRET
# - REFRESH_TOKEN_SECRET
# - NEXTAUTH_SECRET
```

### Step 3: Run Database Migrations

```bash
# From project root
npm run migrate

# Expected output:
# Running migration: 001_initial_schema.sql
# ✓ Completed: 001_initial_schema.sql
# All migrations completed!

# Verify migrations ran
npm run db:verify

# Or verify manually
docker-compose exec postgres psql -U postgres -d puraestate_dev -c "\dt"
```

### Step 4: Seed Development Data

```bash
# Populate database with sample data
npm run seed

# Expected output:
# Seeding users...
# Created 50 test users
# Seeding listings...
# Created 200 test listings
# Seeding messages...
# Created 500 test messages
# Seed completed!

# Verify data
docker-compose exec postgres psql -U postgres -d puraestate_dev -c "SELECT COUNT(*) FROM users;"
```

---

## Running the Full Stack

### Option 1: Run Everything with One Command

```bash
# From project root
npm run dev

# This starts all services in parallel:
# - Docker: PostgreSQL, Redis
# - Backend: Node/Express on :3000
# - Web: Next.js on :3001
# - Mobile: Expo on :19000

# Watch the output for:
✓ backend started on port 3000
✓ web started on port 3001
✓ mobile ready - scan QR code or press 'i' for iOS

# Test all services are working
curl http://localhost:3000/api/health
curl http://localhost:3001  # Should show homepage
```

### Option 2: Run Services Individually

```bash
# Terminal 1: Start Docker services
docker-compose up -d
docker-compose logs -f

# Terminal 2: Start Backend
npm run dev --workspace=packages/backend
# Watching: packages/backend/src
# Ready on http://localhost:3000

# Terminal 3: Start Web App
npm run dev --workspace=apps/web
# Ready on http://localhost:3001

# Terminal 4: Start Mobile App
cd apps/mobile
npm start
# Scan QR with Expo Go or press 'i' for iOS
```

### Option 3: Run Specific Components

```bash
# Backend only
npm run dev --workspace=packages/backend

# Web only (requires backend running)
npm run dev --workspace=apps/web

# Mobile only (requires backend running)
cd apps/mobile && npm start

# Database only (useful for testing)
docker-compose up postgres redis -d
```

### Verification Checklist

After starting all services, verify:

```bash
# 1. Check backend health
curl http://localhost:3000/api/health
# Expected: { "status": "ok", "timestamp": "..." }

# 2. Test database
npm run db:verify
# Expected: Connection successful

# 3. Test Redis
npm run redis:health
# Expected: Redis is running

# 4. Open web app
open http://localhost:3001
# Expected: Homepage loads without errors

# 5. Check console for errors
# Watch for any red error messages
```

---

## IDE & Tools Setup

### VS Code Setup (Recommended)

#### Installation

```bash
# Install VS Code
# macOS: brew install --cask visual-studio-code
# Linux: https://code.visualstudio.com/docs/setup/linux
# Windows: choco install visualstudiocode

# Open repository in VS Code
code puraestate-monorepo
```

#### Essential Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",           // ESLint
    "esbenp.prettier-vscode",           // Code formatter
    "ms-vscode.vscode-typescript-vue",  // TypeScript
    "christopherlum.github-copilot",    // AI assistant
    "eamodio.gitlens",                  // Git integration
    "ms-azuretools.vscode-docker",      // Docker
    "redhat.vscode-yaml",               // YAML support
    "ms-kubernetes-tools.vscode-kubernetes-tools", // K8s
    "GraphQL.vscode-graphql",           // GraphQL (if used)
    "orta.vscode-jest",                 // Jest testing
    "firsttris.vscode-jest-runner",     // Run tests from editor
    "ms-vscode-remote.remote-containers" // Dev containers
  ]
}
```

#### Install Extensions

```bash
# Install recommended extensions
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-typescript-vue
code --install-extension christopherlum.github-copilot
# ... etc for each extension
```

#### VS Code Settings

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/.git": true,
    "**/.DS_Store": true,
    "**/dist": false
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

#### Launch Debug Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Backend Debug",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/packages/backend/src/index.ts",
      "restart": true,
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "outFiles": ["${workspaceFolder}/packages/backend/dist/**/*.js"],
      "envFile": "${workspaceFolder}/packages/backend/.env"
    },
    {
      "name": "Jest Current File",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["${file}", "--runInBand"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Other IDE Options

#### WebStorm / IntelliJ IDEA

```bash
# Open repository
webstorm puraestate-monorepo

# Built-in TypeScript support
# Built-in ESLint integration
# Built-in testing support

# Recommended plugins:
# - Docker
# - Kubernetes
# - GraphQL
# - MongoDB (if using Mongo)
```

#### NeoVim / Vim Setup

```bash
# Install vim-plug or packer (package manager)

# Essential plugins:
# - neovim/nvim-lspconfig (language server)
# - nvim-treesitter/nvim-treesitter (syntax highlighting)
# - nvim-telescope/telescope.nvim (file search)
# - preservim/nerdtree (file explorer)

# See wiki for full config
```

---

## Database Setup & Management

### PostgreSQL Database

#### Access Database

```bash
# Interactive terminal
docker-compose exec postgres psql -U postgres -d puraestate_dev

# With specific user
psql postgresql://puraestate_user:puraestate_pass@localhost:5432/puraestate_dev

# From npm script
npm run db:shell
```

#### Common Database Tasks

```bash
# List all databases
\l

# Switch to puraestate_dev database
\c puraestate_dev

# List all tables
\dt

# Describe a table
\d users
\d+ users  # More details

# Show table structure
\d users

# Count rows in table
SELECT COUNT(*) FROM users;

# View table data
SELECT * FROM users LIMIT 5;

# Describe indexes
\di

# Describe sequences
\ds
```

#### Backup & Restore

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres puraestate_dev > backup-$(date +%Y%m%d).sql

# Restore from backup
docker-compose exec postgres psql -U postgres puraestate_dev < backup-20260224.sql

# Backup all databases
docker-compose exec postgres pg_dumpall -U postgres > full-backup.sql
```

#### Database Queries

```bash
# List all users
SELECT id, email, first_name, last_name FROM users ORDER BY created_at DESC LIMIT 10;

# Search users by email
SELECT * FROM users WHERE email LIKE '%example%';

# List listings by status
SELECT id, title, status, created_at FROM listings WHERE status = 'ACTIVE' ORDER BY created_at DESC;

# Get user activity
SELECT u.email, COUNT(l.id) as listing_count FROM users u LEFT JOIN listings l ON u.id = l.user_id GROUP BY u.id;

# Find recent messages
SELECT * FROM messages ORDER BY created_at DESC LIMIT 20;
```

#### Reset Database

```bash
# WARNING: This deletes all data

# Method 1: Drop and recreate
docker-compose exec postgres psql -U postgres -c "DROP DATABASE puraestate_dev; CREATE DATABASE puraestate_dev;"

# Method 2: Using npm script
npm run db:reset

# Then re-run migrations and seed
npm run migrate
npm run seed
```

### Redis Cache

#### Access Redis

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# Or from npm
npm run redis:cli
```

#### Common Redis Commands

```bash
# Connection
PING               # Response: PONG

# Key operations
KEYS *             # List all keys
KEYS "user:*"      # List keys matching pattern
DEL key_name       # Delete key
FLUSHDB            # Delete all keys (DANGER!)
TTL key_name       # Time to live

# String operations
GET key_name       # Get value
SET key_name value # Set value
APPEND key_name value  # Append to value
STRLEN key_name    # Get length

# List operations
LPUSH list_name value  # Add to left
RPUSH list_name value  # Add to right
LPOP list_name         # Remove from left
RPOP list_name         # Remove from right
LLEN list_name         # List length

# Monitoring
MONITOR            # Watch all commands
DBSIZE             # Number of keys
INFO               # Server info
CONFIG GET "*"     # Show all config
```

#### Clear Redis Cache

```bash
# Clear specific key
redis-cli DEL key_name

# Clear all dev cache
redis-cli FLUSHDB

# Clear all databases
redis-cli FLUSHALL

# Or from npm
npm run redis:clear
```

---

## Frontend Development

### Web App Development (Next.js)

#### Project Structure

```
apps/web/
├── app/                    # App router (Next.js 13+)
│   ├── page.tsx           # Home page
│   ├── layout.tsx         # Root layout
│   ├── (auth)/            # Auth route group
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── listings/          # Listings routes
│   │   ├── page.tsx       # Listings list
│   │   ├── [id]/page.tsx  # Listing detail
│   │   └── create/page.tsx
│   └── api/               # API routes
│       └── health/route.ts
├── components/            # React components
│   ├── common/
│   ├── layouts/
│   ├── forms/
│   └── listing/
├── lib/                   # Utilities
│   ├── api.ts            # API client
│   ├── hooks/            # Custom hooks
│   └── utils/
├── public/               # Static assets
├── styles/               # Global styles
├── next.config.js        # Next.js config
└── package.json
```

#### Development Workflow

```bash
# Start development server
npm run dev --workspace=apps/web

# Creates hot-reload server on http://localhost:3001

# Make changes to any file:
# - .tsx files: Hot reload (state preserved usually)
# - lib/api.ts: Module reload
# - globals.css: Instant style reload
# - app/layout.tsx: Full page reload
```

#### Key Components Pattern

```typescript
// apps/web/components/listing/ListingCard.tsx
'use client';  // Client component (has hooks)

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  location: string;
}

export default function ListingCard({
  id,
  title,
  price,
  image,
  location
}: ListingCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  return (
    <Link href={`/listings/${id}`}>
      <div className="card">
        <Image
          src={image}
          alt={title}
          width={300}
          height={200}
          className="card-image"
        />
        <div className="card-content">
          <h3>{title}</h3>
          <p className="price">${price.toLocaleString()}</p>
          <p className="location">{location}</p>
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsSaved(!isSaved);
            }}
            className={`save-btn ${isSaved ? 'saved' : ''}`}
          >
            {isSaved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </Link>
  );
}
```

#### Styling Approach

```bash
# Next.js supports multiple approaches:

# 1. Tailwind CSS (recommended)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 2. CSS Modules
# Create: ListingCard.module.css
.card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
}

# Then in component:
import styles from './ListingCard.module.css';
<div className={styles.card}>

# 3. Global CSS
# apps/web/styles/globals.css
// Then import in app/layout.tsx
```

#### API Integration

```typescript
// apps/web/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Mobile App Development (React Native)

#### Project Structure

```
apps/mobile/
├── app/                       # Expo Router screens
│   ├── (tabs)/               # Tabbed navigation
│   │   ├── _layout.tsx       # Tab configuration
│   │   ├── home.tsx          # Home tab
│   │   ├── search.tsx        # Search tab
│   │   ├── messages.tsx      # Messages tab
│   │   └── profile.tsx       # Profile tab
│   ├── (auth)/               # Auth screens
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── _layout.tsx           # Root layout
│   └── +not-found.tsx        # 404 screen
├── components/               # Reusable components
│   ├── ListingCard.tsx
│   ├── PropertyImage.tsx
│   └── ChatBubble.tsx
├── services/                 # Business logic
│   ├── api/
│   ├── auth/
│   └── listings/
├── redux/                    # State management
│   ├── store.ts
│   ├── slices/
│   │   ├── authSlice.ts
│   │   ├── listingSlice.ts
│   │   └── chatSlice.ts
│   └── thunks/
├── assets/                   # Images, fonts
├── app.json                  # Expo configuration
└── package.json
```

#### Getting Started

```bash
# Navigate to mobile
cd apps/mobile

# Start Expo development server
npm start

# This shows options:
# › Press 'a' for Android
# › Press 'i' for iOS
# › Press 'w' for web
# › Press 'r' to reload
# › Press 'q' to quit
```

#### Running on Devices

```bash
# iOS Simulator (macOS only)
npm start
# Press 'i' in terminal
# Or: npm run ios

# Android Emulator
npm start
# Press 'a' in terminal
# Or: npm run android
# (requires Android Studio and configured emulator)

# Physical Device
npm start
# Install Expo Go app on device
# Scan QR code with camera/Expo Go
# Make sure device and computer on same WiFi
```

#### React Native Components

```typescript
// apps/mobile/components/ListingCard.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  onPress: (id: string) => void;
}

const ListingCard: React.FC<ListingCardProps> = ({
  id,
  title,
  price,
  image,
  onPress
}) => {
  return (
    <TouchableOpacity onPress={() => onPress(id)} style={styles.container}>
      <Image source={{ uri: image }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.price}>${price.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  image: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
  },
});

export default ListingCard;
```

---

## Backend Development

### Project Structure

```
packages/backend/
├── src/
│   ├── index.ts           # Server entry point
│   ├── controllers/       # Route handlers
│   │   ├── UserController.ts
│   │   ├── ListingController.ts
│   │   └── MessageController.ts
│   ├── services/          # Business logic
│   │   ├── AuthService.ts
│   │   ├── ListingService.ts
│   │   └── ImageService.ts
│   ├── models/            # Data models
│   │   ├── User.ts
│   │   └── Listing.ts
│   ├── middleware/        # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── routes/            # Route definitions
│   │   ├── auth.ts
│   │   ├── listings.ts
│   │   └── messages.ts
│   ├── config/            # Configuration
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── env.ts
│   ├── utils/             # Helper functions
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── logger.ts
│   └── types/             # TypeScript types
│       └── index.ts
├── tests/                 # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example          # Environment template
├── package.json
├── tsconfig.json
└── jest.config.js
```

### Development Workflow

```bash
# Navigate to backend
cd packages/backend

# Start development server with hot reload
npm run dev

# This uses ts-node-dev which:
# - Watches src/** for changes
# - Automatically restarts server
# - Takes ~1-2 seconds to restart

# In another terminal, tail logs
npm run dev 2>&1 | tee dev.log
```

### Creating API Endpoints

```typescript
// packages/backend/src/controllers/ListingController.ts
import { Request, Response } from 'express';
import { db } from '@/config/database';

export class ListingController {
  /**
   * Get all listings
   * GET /api/listings
   */
  async list(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, status = 'ACTIVE' } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const result = await db.query(
        `SELECT * FROM listings
         WHERE status = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [status, limit, offset]
      );

      res.json({
        listings: result.rows,
        page: Number(page),
        pageSize: Number(limit),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Create new listing
   * POST /api/listings
   */
  async create(req: Request, res: Response) {
    try {
      const { title, description, price, category } = req.body;
      const userId = req.userId; // From auth middleware

      const result = await db.query(
        `INSERT INTO listings (user_id, title, description, price, category, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, title, description, price, category, 'DRAFT']
      );

      res.status(201).json({ listing: result.rows[0] });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

#### Register Routes

```typescript
// packages/backend/src/routes/listings.ts
import express from 'express';
import { ListingController } from '@/controllers/ListingController';
import { authenticate } from '@/middleware/auth';

const router = express.Router();
const controller = new ListingController();

// Public routes
router.get('/', controller.list.bind(controller));

// Protected routes
router.post('/', authenticate, controller.create.bind(controller));

export default router;
```

#### Register in Main App

```typescript
// packages/backend/src/index.ts
import express from 'express';
import listingRoutes from '@/routes/listings';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/listings', listingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
```

---

## Testing Setup

### Unit Testing

```bash
# Run all unit tests
npm test

# Run specific file
npm test -- services/AuthService.test.ts

# Watch mode (re-run on changes)
npm test -- --watch

# Generate coverage
npm test -- --coverage

# View coverage report
open coverage/index.html
```

#### Writing Unit Tests

```typescript
// packages/backend/src/services/AuthService.test.ts
import { AuthService } from './AuthService';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('signup', () => {
    it('should create a new user', async () => {
      const user = await authService.signup(
        'test@example.com',
        'password123',
        'John',
        'Doe'
      );

      expect(user).toHaveProperty('id');
      expect(user.email).toBe('test@example.com');
    });

    it('should throw error if user exists', async () => {
      await authService.signup('test@example.com', 'password123', 'John', 'Doe');

      await expect(
        authService.signup('test@example.com', 'password123', 'Jane', 'Smith')
      ).rejects.toThrow('User already exists');
    });
  });

  describe('login', () => {
    it('should return tokens on successful login', async () => {
      await authService.signup('test@example.com', 'password123', 'John', 'Doe');

      const result = await authService.login('test@example.com', 'password123');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });
});
```

### Integration Testing

```bash
# Run integration tests (with real database)
npm run test:integration

# Specific test
npm run test:integration -- listings.integration.test.ts

# These tests:
# - Start PostgreSQL
# - Run migrations
# - Seed test data
# - Run tests
# - Clean up
```

#### Writing Integration Tests

```typescript
// packages/backend/src/controllers/ListingController.integration.test.ts
import request from 'supertest';
import { app } from '../../index';
import { db } from '../../config/database';

describe('Listing Controller Integration', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create test user
    const res = await request(app).post('/api/auth/signup').send({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    });

    authToken = res.body.accessToken;
    userId = res.body.user.id;
  });

  afterAll(async () => {
    // Clean up
    await db.query('DELETE FROM listings WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
  });

  describe('POST /api/listings', () => {
    it('should create a new listing', async () => {
      const res = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Beautiful apartment',
          description: 'Spacious 2-bedroom',
          price: 500000,
          category: 'apartment',
        });

      expect(res.status).toBe(201);
      expect(res.body.listing).toHaveProperty('id');
      expect(res.body.listing.title).toBe('Beautiful apartment');
    });
  });

  describe('GET /api/listings', () => {
    it('should retrieve listings', async () => {
      const res = await request(app).get('/api/listings');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.listings)).toBe(true);
    });
  });
});
```

### E2E Testing

```bash
# Run end-to-end tests (full app flow)
npm run test:e2e

# With UI (shows browser)
npm run test:e2e -- --ui

# Specific test
npm run test:e2e -- user.e2e.test.ts
```

---

## Debugging Guide

### Backend Debugging

#### Using Node Inspector

```bash
# Start with inspector
node --inspect packages/backend/dist/index.js

# Open Chrome DevTools
# Navigate to: chrome://inspect
# Should show Node process
# Click "inspect" to open debugger

# Or use auto-bind
node --inspect-brk packages/backend/dist/index.js
# Stops at first line
```

#### VS Code Debugging

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Backend Debug",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/packages/backend/src/index.ts",
      "restart": true,
      "runtimeArgs": ["-r", "ts-node/register"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

Then press F5 to start debugging.

#### Logging

```typescript
// packages/backend/src/utils/logger.ts
export const logger = {
  info: (msg: string, data?: any) => {
    console.log(`[INFO] ${msg}`, data || '');
  },
  error: (msg: string, error?: Error) => {
    console.error(`[ERROR] ${msg}`, error);
  },
  debug: (msg: string, data?: any) => {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] ${msg}`, data || '');
    }
  },
};

// Usage
import { logger } from '@/utils/logger';

logger.info('User created', { userId: user.id, email: user.email });
logger.error('Database error', error);
logger.debug('Processing listing', { listingId });
```

### Web App Debugging

```bash
# Chrome DevTools built-in (F12)
# React Developer Tools extension
# Redux DevTools extension (if using Redux)

# Network debugging
# 1. Open DevTools > Network tab
# 2. Make request
# 3. See request/response details

# Performance profiling
# 1. DevTools > Performance tab
# 2. Click "Record"
# 3. Interact with app
# 4. Click "Stop"
# 5. Analyze performance waterfall
```

### Mobile App Debugging

```bash
# In Expo console (where `npm start` is running)
# Press 'j' to open Chrome DevTools

# Or use React Native Debugger
# Download: https://github.com/jhen0409/react-native-debugger

# Logging
import { Alert } from 'react-native';
Alert.alert('Debug', JSON.stringify(data));  // Shows popup

console.log('message');  // Shows in Expo console
```

---

## Performance Optimization

### Frontend Performance

```bash
# Analyze bundle size
npm run build --workspace=apps/web
# Then check: apps/web/.next/static/

# Check Core Web Vitals
# Use Lighthouse in Chrome DevTools
# Target: All green (green = good)

# Optimize images
# Use Next.js Image component (automatic optimization)
# Use WEBP format where possible
# Lazy load below-the-fold images
```

#### Image Optimization Example

```typescript
// ✓ Good - Optimized
import Image from 'next/image';

<Image
  src="/listing.jpg"
  alt="Listing photo"
  width={300}
  height={200}
  loading="lazy"  // Don't load until visible
  priority={false}  // Only true for hero image
/>

// ✗ Bad - Not optimized
<img src="/listing.jpg" alt="Listing" />
```

### Backend Performance

```bash
# Profile API endpoints
# 1. Install clinic.js
npm install -g clinic

# 2. Run with profiler
clinic doctor -- npm run dev

# 3. Make requests
# 4. Press Ctrl+C to stop
# 5. Opens analysis in browser

# Check database query performance
npm run db:slow-queries
```

#### Database Query Optimization

```sql
-- Slow query
SELECT * FROM listings WHERE title LIKE '%apartment%';

-- Optimized with index
CREATE INDEX idx_listings_search ON listings USING GIN(to_tsvector('english', title));
SELECT * FROM listings WHERE to_tsvector('english', title) @@ to_tsquery('apartment');
```

### Mobile App Performance

```bash
# Check app size
npm run build:android --workspace=apps/mobile
# Check: packages/mobile/build/

# Optimize bundle
# - Remove unused dependencies
# - Use lazy loading for screens
# - Optimize images
# - Use code splitting

# Profile app
# React Native: Use Hermes profiler
# Expo: Built-in performance profiling
```

---

## CI/CD Pipeline

### GitHub Actions Setup

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

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
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm install
      - run: npm run lint
      - run: npm run type-check
      - run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

#### Deploy Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build
        run: |
          npm install
          npm run build

      - name: Deploy to production
        run: |
          npm run deploy:prod
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Troubleshooting

### Common Issues & Solutions

#### Issue: `npm install` hangs or fails

```bash
# Solution 1: Clear cache
npm cache clean --force

# Solution 2: Update npm
npm install -g npm@latest

# Solution 3: Check network
ping registry.npmjs.org

# Solution 4: Try alternate registry
npm install --registry https://registry.yarnpkg.com
```

#### Issue: Port already in use

```bash
# Find process using port
lsof -i :3000
# Kill it
kill -9 <PID>

# Or change port in .env
PORT=3005
```

#### Issue: Database connection fails

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check connection string in .env
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

#### Issue: WebSocket connection fails

```bash
# Check backend is running
curl http://localhost:3000/api/health

# Check CORS configuration in .env
# CORS_ORIGIN should include frontend URL

# Verify no firewall blocking port
# Check browser console for specific errors
```

#### Issue: Hot reload not working

```bash
# For Node backend:
# Kill and restart
npm run dev --workspace=packages/backend

# For Next.js:
# Clear .next folder
rm -rf apps/web/.next
npm run dev --workspace=apps/web

# For Expo:
# Press 'r' in Expo console
# Or: npm start --reset-cache
```

---

## Quick Reference

### Most Common Commands

```bash
# Setup & Installation
npm install
npm run setup
docker-compose up -d

# Development
npm run dev                        # All services
npm run dev --workspace=packages/backend
npm run dev --workspace=apps/web
cd apps/mobile && npm start

# Database
npm run migrate
npm run seed
npm run db:reset
npm run db:shell

# Testing
npm test
npm run test:integration
npm run test:e2e

# Building
npm run build
npm run build --workspace=packages/backend

# Deployment
npm run deploy:staging
npm run deploy:prod

# Debugging & Utilities
npm run lint
npm run format
npm run type-check
curl http://localhost:3000/api/health
```

### File Locations

| File | Location |
|------|----------|
| Backend .env | `packages/backend/.env` |
| Web .env | `apps/web/.env.local` |
| Mobile .env | `apps/mobile/.env` |
| Database migrations | `packages/database/migrations/` |
| Database seeds | `packages/database/seeds/` |
| Docker compose | `docker-compose.yml` |
| K8s manifests | `k8s/` |
| CI/CD workflows | `.github/workflows/` |

### Useful Links

- Main README: `/home/tjdavis/PuraEstate-README.md`
- Architecture: `/home/tjdavis/PURAESTATE_ARCHITECTURE.md`
- API Docs: `/home/tjdavis/PURAESTATE_API_REFERENCE.md`
- Deployment: `/home/tjdavis/PURAESTATE_DEPLOYMENT_GUIDE.md`

---

**Last Updated:** February 24, 2026
**Status:** Production-Ready
**Created By:** Claude Code Team

For additional help, see the main README or open a GitHub issue.
