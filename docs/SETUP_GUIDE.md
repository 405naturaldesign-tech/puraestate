# PuraEstate Platform - Complete Setup & Implementation Guide

## Quick Reference

- **Architecture Document:** `/home/tjdavis/PURAESTATE_ARCHITECTURE.md`
- **Tech Stack:** Next.js + React Native + Node.js + Firebase/PostgreSQL
- **Timeline:** 4 weeks from MVP to full feature launch
- **Key Tools:** Composio, OpenRouter, Rork, Firebase/GCP

---

## INITIAL SETUP (Day 1-2)

### 1. Create Monorepo Structure

```bash
# Initialize monorepo
mkdir -p puraestate-monorepo
cd puraestate-monorepo

# Create package.json with workspaces
cat > package.json << 'EOF'
{
  "name": "puraestate-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "migrate": "cd packages/database && npm run migrate",
    "seed": "cd packages/database && npm run seed",
    "deploy:staging": "turbo run deploy --filter=./apps/* -- staging",
    "deploy:prod": "turbo run deploy --filter=./apps/* -- production"
  },
  "devDependencies": {
    "turbo": "^1.10.0",
    "typescript": "^5.2.0"
  }
}
EOF

npm install
npx turbo init
```

### 2. Backend Setup

```bash
# Create backend package
mkdir -p packages/backend
cd packages/backend

# Initialize
npm init -y

# Install dependencies
npm install express cors helmet dotenv pg redis bull socket.io jsonwebtoken bcryptjs multer aws-sdk sharp

npm install -D typescript ts-node @types/express @types/node nodemon ts-jest jest @types/jest

# Create tsconfig
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Create .env template
cat > .env.example << 'EOF'
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/puraestate
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-here-min-32-chars
JWT_EXPIRY=24h
REFRESH_TOKEN_SECRET=your-refresh-secret-here-min-32-chars

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=puraestate-prod

# External APIs
OPENROUTER_API_KEY=your-openrouter-key
COMPOSIO_API_KEY=your-composio-key
STRIPE_SECRET_KEY=your-stripe-key
SENDGRID_API_KEY=your-sendgrid-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-email

# Datadog
DATADOG_API_KEY=your-datadog-key
DATADOG_APP_ID=your-app-id
DATADOG_CLIENT_TOKEN=your-client-token

# URLs
FRONTEND_URL=http://localhost:3001
MOBILE_API_URL=http://localhost:3000

# Feature flags
ENABLE_AI_FEATURES=false
ENABLE_COMPOSIO=false
ENABLE_PAYMENT=false
EOF

# Create package.json scripts
npm set-script dev "ts-node-dev --respawn src/index.ts"
npm set-script build "tsc"
npm set-script start "node dist/index.js"
npm set-script test "jest"
npm set-script migrate "ts-node src/migrations/run.ts"
```

### 3. Database Setup

```bash
# Create database migrations
mkdir -p packages/database/{migrations,seeds,scripts}

# Initial migration
cat > packages/database/migrations/001_initial_schema.sql << 'EOF'
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "earthdistance";
CREATE EXTENSION IF NOT EXISTS "cube";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  profile_photo_url VARCHAR(500),
  bio TEXT,
  status ENUM ('ACTIVE', 'SUSPENDED', 'DELETED') DEFAULT 'ACTIVE',
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  kyc_status ENUM ('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING',
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_search ON users USING GIN(to_tsvector('english', first_name || ' ' || last_name));

-- Listings table (simplified)
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  price DECIMAL(12,2),
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  location_address VARCHAR(500),
  image_urls TEXT[],
  status ENUM ('DRAFT', 'ACTIVE', 'SOLD', 'ARCHIVED') DEFAULT 'DRAFT',
  view_count INT DEFAULT 0,
  slug VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP
);

CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX idx_listings_search ON listings USING GIN(to_tsvector('english', title || ' ' || description));

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_1_id UUID NOT NULL REFERENCES users(id),
  user_2_id UUID NOT NULL REFERENCES users(id),
  listing_id UUID REFERENCES listings(id),
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_1_id, user_2_id)
);

CREATE INDEX idx_conversations_user_1 ON conversations(user_1_id);
CREATE INDEX idx_conversations_user_2 ON conversations(user_2_id);
EOF

# Create migration runner
cat > packages/database/scripts/migrate.ts << 'EOF'
import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../migrations')
  const files = fs.readdirSync(migrationsDir).sort()

  for (const file of files) {
    const filePath = path.join(migrationsDir, file)
    const sql = fs.readFileSync(filePath, 'utf-8')

    try {
      console.log(`Running migration: ${file}`)
      await pool.query(sql)
      console.log(`✓ Completed: ${file}`)
    } catch (error) {
      console.error(`✗ Failed: ${file}`, error)
      throw error
    }
  }

  await pool.end()
  console.log('All migrations completed!')
}

runMigrations()
EOF
```

### 4. Web App Setup

```bash
# Create Next.js app
npx create-next-app@latest apps/web --typescript --tailwind --eslint --app

cd apps/web

# Install additional dependencies
npm install next-auth axios zustand @tanstack/react-query @hookform/resolvers zod

# Create .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_DATADOG_APP_ID=your-id
NEXT_PUBLIC_DATADOG_CLIENT_TOKEN=your-token
NEXT_PUBLIC_ENV=development
EOF
```

### 5. Mobile App Setup

```bash
# Create React Native app
npx create-expo-app apps/mobile
cd apps/mobile

# Install dependencies
npm install expo-router expo-sqlite sqlite expo-notifications expo-location expo-image-picker @react-navigation/native @react-native-community/netinfo

# Create expo.json
cat > app.json << 'EOF'
{
  "expo": {
    "name": "PuraEstate",
    "slug": "puraestate",
    "version": "1.0.0",
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTabletMode": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png"
      }
    },
    "plugins": [
      ["expo-notifications"],
      ["expo-location"]
    ]
  }
}
EOF
```

---

## WEEK 1: MVP BACKEND IMPLEMENTATION

### 1. Authentication Service

```typescript
// packages/backend/src/services/AuthService.ts
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '@/config/database'

export class AuthService {
  async signup(email: string, password: string, firstName: string, lastName: string) {
    // Check if user exists
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existing.rows.length > 0) {
      throw new Error('User already exists')
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 12)

    // Create user
    const result = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, first_name, last_name`,
      [email, passwordHash, firstName, lastName]
    )

    const user = result.rows[0]

    // Generate tokens
    const tokens = this.generateTokens(user.id)

    return { user, ...tokens }
  }

  async login(email: string, password: string) {
    const result = await db.query(
      'SELECT id, password_hash FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials')
    }

    const user = result.rows[0]
    const validPassword = await bcryptjs.compare(password, user.password_hash)

    if (!validPassword) {
      throw new Error('Invalid credentials')
    }

    const tokens = this.generateTokens(user.id)

    return { user, ...tokens }
  }

  private generateTokens(userId: string) {
    const accessToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )

    const refreshToken = jwt.sign(
      { userId },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: '7d' }
    )

    return { accessToken, refreshToken }
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!)
    } catch (error) {
      throw new Error('Invalid token')
    }
  }
}
```

### 2. Listing Controller

```typescript
// packages/backend/src/controllers/ListingController.ts
import { Request, Response } from 'express'
import { db } from '@/config/database'
import { uploadToS3 } from '@/services/ImageService'

export class ListingController {
  async create(req: Request, res: Response) {
    const { title, description, category, price, location } = req.body
    const userId = req.userId // From auth middleware

    try {
      const result = await db.query(
        `INSERT INTO listings
         (user_id, title, description, category, price, location_lat, location_lng, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [userId, title, description, category, price, location.lat, location.lng, 'DRAFT']
      )

      res.status(201).json({ listing: result.rows[0] })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async list(req: Request, res: Response) {
    const { page = 1, limit = 20, status = 'ACTIVE' } = req.query

    try {
      const offset = (Number(page) - 1) * Number(limit)

      const result = await db.query(
        `SELECT * FROM listings
         WHERE status = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [status, limit, offset]
      )

      const countResult = await db.query(
        'SELECT COUNT(*) as count FROM listings WHERE status = $1',
        [status]
      )

      res.json({
        listings: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: Number(page),
        pageSize: Number(limit)
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async getById(req: Request, res: Response) {
    const { id } = req.params

    try {
      const result = await db.query(
        'SELECT * FROM listings WHERE id = $1',
        [id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Listing not found' })
      }

      res.json({ listing: result.rows[0] })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async upload(req: Request, res: Response) {
    const { id } = req.params
    const files = req.files

    try {
      const imageUrls = await Promise.all(
        files.map((file) =>
          uploadToS3(file.buffer, `listings/${id}/${file.originalname}`)
        )
      )

      res.json({ imageUrls })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
}
```

### 3. Express Routes Setup

```typescript
// packages/backend/src/routes/listings.ts
import express from 'express'
import { ListingController } from '@/controllers/ListingController'
import { authenticate } from '@/middleware/auth'
import multer from 'multer'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })
const controller = new ListingController()

// Public routes
router.get('/', controller.list.bind(controller))
router.get('/:id', controller.getById.bind(controller))

// Protected routes
router.post('/', authenticate, controller.create.bind(controller))
router.post('/:id/images', authenticate, upload.array('images', 50), controller.upload.bind(controller))

export default router
```

---

## WEEK 2: WEB PLATFORM LAUNCH

### 1. Next.js Page Structure

```typescript
// apps/web/app/page.tsx
import Link from 'next/link'
import { SearchBar } from '@/components/search/SearchBar'
import { FeaturedListings } from '@/components/listings/FeaturedListings'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Find Your Perfect Property</h1>
          <p className="text-xl mb-8">Search thousands of listings</p>
          <SearchBar />
        </div>
      </section>

      {/* Featured Listings */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold mb-10">Featured Listings</h2>
        <FeaturedListings />
      </section>

      {/* CTA Section */}
      <section className="bg-gray-100 py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">List Your Property</h2>
          <Link href="/listings/create" className="bg-blue-600 text-white px-8 py-3 rounded-lg">
            Post Listing
          </Link>
        </div>
      </section>
    </main>
  )
}
```

### 2. Listing Creation Form

```typescript
// apps/web/components/listings/ListingForm.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api/client'
import { useRouter } from 'next/navigation'

export default function ListingForm() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [images, setImages] = useState<File[]>([])
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      // Create listing
      const listingRes = await api.post('/listings', {
        title: data.title,
        description: data.description,
        category: data.category,
        price: parseFloat(data.price),
        location: {
          lat: parseFloat(data.lat),
          lng: parseFloat(data.lng)
        }
      })

      const listingId = listingRes.data.listing.id

      // Upload images
      if (images.length > 0) {
        const formData = new FormData()
        images.forEach((img) => formData.append('images', img))

        await api.post(`/listings/${listingId}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      router.push(`/listings/${listingId}`)
    } catch (error) {
      console.error('Failed to create listing:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Title</label>
        <input
          {...register('title', { required: 'Title is required' })}
          className="w-full px-4 py-2 border rounded-lg"
          placeholder="Enter listing title"
        />
        {errors.title && <span className="text-red-600">{errors.title.message}</span>}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          {...register('description', { required: 'Description is required' })}
          className="w-full px-4 py-2 border rounded-lg h-32"
          placeholder="Describe your listing"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <select {...register('category')} className="w-full px-4 py-2 border rounded-lg">
            <option value="property">Property</option>
            <option value="service">Service</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Price</label>
          <input
            {...register('price')}
            type="number"
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Images</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setImages(Array.from(e.target.files || []))}
          className="w-full"
        />
        <p className="text-sm text-gray-600 mt-2">{images.length} files selected</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Listing'}
      </button>
    </form>
  )
}
```

---

## WEEK 3: MOBILE APP IMPLEMENTATION

### 1. React Native Navigation

```typescript
// apps/mobile/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0066cc',
        tabBarInactiveTintColor: '#999',
        headerShown: true
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" color={color} size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble" color={color} size={size} />
          )
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          )
        }}
      />
    </Tabs>
  )
}
```

### 2. Offline Sync Implementation

```typescript
// apps/mobile/lib/sqlite/db.ts
import SQLite from 'expo-sqlite'

export const initDatabase = async () => {
  const db = await SQLite.openDatabaseAsync('puraestate.db')

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      userId TEXT,
      title TEXT,
      description TEXT,
      price REAL,
      imageUrls TEXT,
      status TEXT,
      syncedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS pending_sync (
      id TEXT PRIMARY KEY,
      operation TEXT,
      payload TEXT,
      createdAt INTEGER,
      retryCount INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_sync_status ON pending_sync(operation);
  `)

  return db
}

export const saveSyncOperation = async (db: SQLite.Database, operation: string, payload: any) => {
  await db.runAsync(
    `INSERT INTO pending_sync (id, operation, payload, createdAt)
     VALUES (?, ?, ?, ?)`,
    [Math.random().toString(), operation, JSON.stringify(payload), Date.now()]
  )
}
```

---

## WEEK 4: AI & AUTOMATION INTEGRATION

### 1. OpenRouter Integration

```typescript
// packages/ai-engine/src/integrations/openrouter.ts
import axios from 'axios'

const openrouterClient = axios.create({
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'HTTP-Referer': 'https://puraestate.com',
    'X-Title': 'PuraEstate'
  }
})

export async function generateDescription(listingData: any) {
  const prompt = `Generate a compelling description for this listing:
Title: ${listingData.title}
Category: ${listingData.category}
Attributes: ${JSON.stringify(listingData.attributes)}

Requirements:
- 150-300 words
- Professional tone
- Highlight key features
- Include relevant keywords

Return only the description text.`

  const response = await openrouterClient.post('/chat/completions', {
    model: 'mistral-7b-instruct',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 500
  })

  return response.data.choices[0].message.content
}
```

### 2. Composio Workflow

```typescript
// packages/ai-engine/src/workflows/newListingWorkflow.ts
import { composioAutomations } from '../integrations/composio'
import { sendEmail, sendWhatsApp } from '@/services/MessageService'

export async function handleNewListing(listing: any, seller: any) {
  try {
    // Step 1: Send confirmation email
    await composioAutomations.sendEmail(
      seller.email,
      'Your listing is live!',
      `Your listing "${listing.title}" has been published on PuraEstate.`
    )

    // Step 2: Send WhatsApp notification
    await composioAutomations.sendWhatsAppMessage(
      seller.phoneNumber,
      `Great! Your "${listing.title}" listing is live. View: https://puraestate.com/listings/${listing.id}`
    )

    // Step 3: Create calendar reminder (7 days follow-up)
    const followUpDate = new Date()
    followUpDate.setDate(followUpDate.getDate() + 7)

    await composioAutomations.scheduleCalendarEvent(
      `Follow-up: ${listing.title}`,
      `Check on listing performance and engagement`,
      followUpDate,
      new Date(followUpDate.getTime() + 30 * 60000),
      [seller.email]
    )

    console.log('✓ New listing workflow completed')
  } catch (error) {
    console.error('✗ Workflow failed:', error)
    throw error
  }
}
```

---

## DEPLOYMENT GUIDE

### 1. Docker Build

```bash
# Build backend Docker image
docker build -f docker/Dockerfile.backend -t puraestate-backend:latest .

# Run locally
docker-compose up -d

# Check services
docker-compose ps
```

### 2. Kubernetes Deployment

```bash
# Create namespace
kubectl create namespace puraestate-prod

# Create secrets
kubectl create secret generic app-secrets \
  --from-literal=database-url='postgresql://...' \
  --from-literal=jwt-secret='...' \
  -n puraestate-prod

# Deploy
kubectl apply -f k8s/deployments/backend.yaml -n puraestate-prod

# Check status
kubectl get deployments -n puraestate-prod
kubectl logs -n puraestate-prod deployment/puraestate-backend
```

### 3. Vercel Deployment (Web)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd apps/web
vercel

# Deploy production
vercel --prod
```

### 4. Expo Build (Mobile)

```bash
# Create Expo account and configure
eas login

# Create build configuration
eas build:configure

# Build for iOS and Android
eas build --platform ios
eas build --platform android

# Submit to app stores
eas submit -p ios
eas submit -p android
```

---

## TESTING CHECKLIST

### Unit Tests
- [ ] Authentication service
- [ ] Listing controller
- [ ] Search algorithm
- [ ] Image processing

### Integration Tests
- [ ] API endpoints
- [ ] Database operations
- [ ] Real-time messaging
- [ ] WebSocket connections

### E2E Tests
- [ ] User signup flow
- [ ] Create listing flow
- [ ] Search and filter
- [ ] Message sending
- [ ] Payment processing

### Performance Tests
- [ ] API response times < 200ms
- [ ] Page load time < 3s
- [ ] Database queries optimized
- [ ] Image optimization

---

## MONITORING & ALERTING

```bash
# Setup Datadog monitoring
1. Create Datadog account
2. Install agent
3. Configure APM
4. Set up dashboards
5. Create alerts for:
   - High error rates (>1%)
   - Slow API responses (>500ms)
   - Database connection issues
   - Memory leaks
```

---

## SUCCESS METRICS (Week 4)

- [ ] 100+ test users
- [ ] Zero-downtime deployment
- [ ] <100ms API latency p99
- [ ] 99.9% availability
- [ ] AI features generating 50+ descriptions/day
- [ ] Composio workflows automating 20+ notifications/day
- [ ] Mobile app downloads 100+ beta users

---

**Last Updated:** February 24, 2026
**Status:** Ready for Implementation
