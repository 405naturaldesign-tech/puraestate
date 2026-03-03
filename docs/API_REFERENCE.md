# PuraEstate Platform - Complete API Reference & Migration Guide

## API Documentation

### Base URL
```
Development: http://localhost:3000
Staging: https://staging-api.puraestate.com
Production: https://api.puraestate.com
```

---

## Authentication Endpoints

### POST /api/auth/signup
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "profilePhoto": null,
    "status": "ACTIVE",
    "emailVerified": false,
    "createdAt": "2024-02-24T10:00:00Z"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 86400
}
```

### POST /api/auth/login
Authenticate user with credentials.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

**Response (200):**
```json
{
  "user": { ... },
  "accessToken": "...",
  "refreshToken": "...",
  "expiresIn": 86400
}
```

### POST /api/auth/verify-email
Verify email with code sent to user.

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response (200):**
```json
{
  "verified": true,
  "message": "Email verified successfully"
}
```

### POST /api/auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGc...",
  "expiresIn": 86400
}
```

### POST /api/auth/forgot-password
Request password reset.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Reset link sent to email"
}
```

### POST /api/auth/reset-password
Reset password with token.

**Request:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "newSecurePassword123!"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

---

## Listing Endpoints

### POST /api/listings
Create a new listing.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "title": "Beautiful 3-bedroom house",
  "description": "Spacious family home with garden",
  "category": "property",
  "subcategory": "residential",
  "price": 250000,
  "priceCurrency": "USD",
  "priceNegotiable": true,
  "location": {
    "lat": 40.7128,
    "lng": -74.0060,
    "address": "123 Main St, New York, NY",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "zip": "10001"
  },
  "amenities": ["garage", "garden", "pool"],
  "attributes": {
    "bedrooms": 3,
    "bathrooms": 2,
    "squareFeet": 2500,
    "yearBuilt": 2010
  }
}
```

**Response (201):**
```json
{
  "listing": {
    "id": "listing-uuid",
    "userId": "user-uuid",
    "title": "Beautiful 3-bedroom house",
    "status": "DRAFT",
    "price": 250000,
    "viewCount": 0,
    "saveCount": 0,
    "createdAt": "2024-02-24T10:00:00Z",
    "updatedAt": "2024-02-24T10:00:00Z"
  }
}
```

### GET /api/listings
List all active listings with pagination and filtering.

**Query Parameters:**
```
?page=1
&limit=20
&status=ACTIVE
&category=property
&priceMin=100000
&priceMax=500000
&sortBy=newest (or: popular, price_asc, price_desc, rating)
```

**Response (200):**
```json
{
  "listings": [
    {
      "id": "uuid",
      "title": "...",
      "price": 250000,
      "location": {
        "lat": 40.7128,
        "lng": -74.0060,
        "city": "New York"
      },
      "imageUrls": ["https://..."],
      "viewCount": 150,
      "saveCount": 25,
      "createdAt": "2024-02-24T10:00:00Z"
    }
  ],
  "total": 500,
  "page": 1,
  "pageSize": 20,
  "hasMore": true
}
```

### GET /api/listings/:id
Get listing details.

**Response (200):**
```json
{
  "listing": {
    "id": "uuid",
    "userId": "user-uuid",
    "title": "Beautiful 3-bedroom house",
    "description": "...",
    "category": "property",
    "price": 250000,
    "location": {
      "lat": 40.7128,
      "lng": -74.0060,
      "address": "123 Main St, New York, NY"
    },
    "imageUrls": ["https://..."],
    "amenities": ["garage", "garden"],
    "attributes": {
      "bedrooms": 3,
      "bathrooms": 2
    },
    "status": "ACTIVE",
    "viewCount": 150,
    "saveCount": 25,
    "seller": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "profilePhoto": "https://...",
      "averageRating": 4.8,
      "totalReviews": 45,
      "responseTime": 2
    },
    "relatedListings": [...],
    "createdAt": "2024-02-24T10:00:00Z"
  }
}
```

### PATCH /api/listings/:id
Update a listing.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "title": "Updated title",
  "price": 240000,
  "status": "ACTIVE"
}
```

**Response (200):**
```json
{
  "listing": { ... }
}
```

### DELETE /api/listings/:id
Delete a listing.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Listing deleted"
}
```

### POST /api/listings/:id/images
Upload images to listing.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Form Data:**
```
images: [File, File, File...]
```

**Response (200):**
```json
{
  "imageUrls": [
    "https://s3.amazonaws.com/puraestate/listing-id/image1.jpg",
    "https://s3.amazonaws.com/puraestate/listing-id/image2.jpg"
  ]
}
```

### POST /api/listings/:id/publish
Publish a draft listing.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "listing": {
    "id": "uuid",
    "status": "ACTIVE",
    "publishedAt": "2024-02-24T10:00:00Z"
  }
}
```

---

## Search Endpoints

### POST /api/search
Advanced search with filters.

**Request:**
```json
{
  "query": "3 bedroom house near park",
  "filters": {
    "category": "property",
    "priceRange": {
      "min": 100000,
      "max": 500000
    },
    "location": {
      "lat": 40.7128,
      "lng": -74.0060,
      "radius": 10
    },
    "amenities": ["garden", "pool"],
    "attributes": {
      "bedrooms": { "min": 3 },
      "bathrooms": { "min": 2 }
    }
  },
  "sort": "relevance",
  "page": 1,
  "limit": 20
}
```

**Response (200):**
```json
{
  "results": [
    {
      "id": "uuid",
      "title": "...",
      "price": 250000,
      "relevanceScore": 0.95,
      "matchReasons": [
        "Matches 3 bedroom requirement",
        "Close to park (0.5 miles)"
      ]
    }
  ],
  "total": 45,
  "facets": {
    "categories": [
      { "name": "property", "count": 40 },
      { "name": "service", "count": 5 }
    ],
    "priceRanges": [
      { "range": "100000-200000", "count": 15 },
      { "range": "200000-300000", "count": 20 }
    ]
  },
  "executionTimeMs": 145
}
```

### GET /api/search/autocomplete
Autocomplete suggestions.

**Query Parameters:**
```
?q=3 bedroom
&type=all (or: listing, user, query)
&limit=10
```

**Response (200):**
```json
{
  "suggestions": [
    {
      "text": "3 bedroom house",
      "type": "query",
      "frequency": 250
    },
    {
      "text": "3 bedroom apartment in Manhattan",
      "type": "query",
      "frequency": 180
    },
    {
      "id": "uuid",
      "title": "Beautiful 3-bedroom house",
      "type": "listing",
      "price": 250000
    }
  ]
}
```

### POST /api/search/saved-searches
Save a search filter for later.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "name": "My Dream Home Search",
  "filters": {
    "category": "property",
    "priceMax": 500000,
    "location": { "lat": 40.7128, "lng": -74.0060, "radius": 10 }
  }
}
```

**Response (201):**
```json
{
  "savedSearch": {
    "id": "uuid",
    "name": "My Dream Home Search",
    "filters": { ... },
    "createdAt": "2024-02-24T10:00:00Z"
  }
}
```

---

## Messaging Endpoints

### GET /api/conversations
List user conversations.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?page=1&limit=20&status=ACTIVE
```

**Response (200):**
```json
{
  "conversations": [
    {
      "id": "conv-uuid",
      "otherUser": {
        "id": "user-uuid",
        "firstName": "Jane",
        "lastName": "Smith",
        "profilePhoto": "https://...",
        "isOnline": true
      },
      "listing": {
        "id": "listing-uuid",
        "title": "3-bedroom house"
      },
      "lastMessage": {
        "content": "Is this still available?",
        "createdAt": "2024-02-24T10:00:00Z"
      },
      "unreadCount": 2,
      "createdAt": "2024-02-23T15:00:00Z"
    }
  ],
  "unreadTotal": 5,
  "total": 12,
  "page": 1
}
```

### POST /api/conversations/:conversationId/messages
Send a message.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "content": "Is this property still available?",
  "contentType": "TEXT",
  "attachmentUrl": null
}
```

**Response (201):**
```json
{
  "message": {
    "id": "msg-uuid",
    "conversationId": "conv-uuid",
    "senderId": "user-uuid",
    "content": "Is this property still available?",
    "isRead": false,
    "createdAt": "2024-02-24T10:05:00Z"
  }
}
```

### GET /api/conversations/:conversationId/messages
Get conversation message history.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?page=1&limit=50
```

**Response (200):**
```json
{
  "messages": [
    {
      "id": "msg-uuid",
      "senderId": "user-uuid",
      "content": "When can you show me the property?",
      "isRead": true,
      "createdAt": "2024-02-24T10:05:00Z"
    }
  ],
  "total": 15,
  "page": 1
}
```

### PATCH /api/messages/:messageId/read
Mark message as read.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Message marked as read"
}
```

### POST /api/conversations/:conversationId/typing
Send typing indicator (WebSocket preferred).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "isTyping": true
}
```

**Response (200):**
```json
{
  "success": true
}
```

---

## User Profile Endpoints

### GET /api/users/me
Get current user profile.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "profilePhoto": "https://...",
    "bio": "Real estate enthusiast",
    "status": "ACTIVE",
    "emailVerified": true,
    "phoneVerified": true,
    "kycStatus": "VERIFIED",
    "averageRating": 4.8,
    "totalReviews": 45,
    "responseTime": 2,
    "notificationPreferences": {
      "emailOnMessages": true,
      "emailOnOffers": true,
      "smsAlerts": true,
      "pushNotifications": true
    },
    "createdAt": "2024-02-01T10:00:00Z"
  }
}
```

### GET /api/users/:userId
Get public user profile.

**Response (200):**
```json
{
  "user": {
    "id": "user-uuid",
    "firstName": "John",
    "lastName": "Doe",
    "profilePhoto": "https://...",
    "bio": "Real estate enthusiast",
    "averageRating": 4.8,
    "totalReviews": 45,
    "responseTime": 2,
    "joinDate": "2024-02-01",
    "listingCount": 12,
    "stats": {
      "activeListings": 8,
      "soldListings": 4,
      "totalViews": 500,
      "totalInquiries": 45
    },
    "reviews": [
      {
        "id": "review-uuid",
        "reviewer": "Jane Smith",
        "rating": 5,
        "comment": "Great seller, very responsive",
        "createdAt": "2024-02-15T10:00:00Z"
      }
    ]
  }
}
```

### PATCH /api/users/profile
Update user profile.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "bio": "Updated bio",
  "notificationPreferences": {
    "emailOnMessages": false,
    "smsAlerts": true
  }
}
```

**Response (200):**
```json
{
  "user": { ... }
}
```

### POST /api/users/profile-photo
Upload profile photo.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Form Data:**
```
photo: File
```

**Response (200):**
```json
{
  "photoUrl": "https://s3.amazonaws.com/puraestate/users/user-uuid/photo.jpg"
}
```

---

## Review Endpoints

### POST /api/reviews
Leave a review for a user.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "revieweeId": "user-uuid",
  "listingId": "listing-uuid",
  "rating": 5,
  "title": "Great experience",
  "comment": "Very responsive and professional seller"
}
```

**Response (201):**
```json
{
  "review": {
    "id": "review-uuid",
    "reviewerId": "user-uuid",
    "revieweeId": "user-uuid",
    "rating": 5,
    "title": "Great experience",
    "comment": "Very responsive and professional seller",
    "status": "PUBLISHED",
    "createdAt": "2024-02-24T10:00:00Z"
  }
}
```

### GET /api/users/:userId/reviews
Get reviews for a user.

**Query Parameters:**
```
?page=1&limit=10&sort=newest
```

**Response (200):**
```json
{
  "reviews": [
    {
      "id": "review-uuid",
      "reviewer": {
        "firstName": "Jane",
        "lastName": "Smith",
        "profilePhoto": "https://..."
      },
      "rating": 5,
      "title": "Great experience",
      "comment": "Very responsive seller",
      "createdAt": "2024-02-24T10:00:00Z"
    }
  ],
  "total": 45,
  "averageRating": 4.8
}
```

---

## Notifications Endpoints

### GET /api/notifications
Get user notifications.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?page=1&limit=20&isRead=false
```

**Response (200):**
```json
{
  "notifications": [
    {
      "id": "notif-uuid",
      "type": "message",
      "title": "New message from John Doe",
      "body": "Is this property still available?",
      "data": {
        "conversationId": "conv-uuid",
        "messageId": "msg-uuid"
      },
      "isRead": false,
      "createdAt": "2024-02-24T10:00:00Z"
    }
  ],
  "unreadCount": 5,
  "total": 20
}
```

### PATCH /api/notifications/:notificationId/read
Mark notification as read.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true
}
```

### PATCH /api/notifications/read-all
Mark all notifications as read.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "readCount": 5
}
```

---

## Analytics Endpoints

### GET /api/analytics/listings/:listingId
Get listing analytics.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "listingId": "listing-uuid",
  "views": 450,
  "viewsToday": 25,
  "viewsTrend": [
    { "date": "2024-02-20", "count": 50 },
    { "date": "2024-02-21", "count": 60 }
  ],
  "saves": 85,
  "inquiries": 12,
  "conversionRate": 0.026,
  "topReferrers": [
    { "source": "search", "count": 250 },
    { "source": "direct", "count": 150 }
  ],
  "exposureTime": "4 days",
  "estimatedExposureScore": 85
}
```

### GET /api/analytics/user/dashboard
Get user dashboard analytics.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "metrics": {
    "totalViews": 2500,
    "totalInquiries": 45,
    "responseRate": 0.95,
    "averageResponseTime": 2
  },
  "listings": [
    {
      "id": "listing-uuid",
      "title": "3-bedroom house",
      "views": 450,
      "inquiries": 12,
      "saves": 85
    }
  ],
  "topListings": [...],
  "monthlyTrend": [...]
}
```

---

## Payment Endpoints

### POST /api/payments/create-intent
Create payment intent for transaction.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "listingId": "listing-uuid",
  "amount": 5000,
  "paymentMethod": "stripe"
}
```

**Response (201):**
```json
{
  "clientSecret": "pi_...",
  "amount": 5000,
  "currency": "usd"
}
```

### POST /api/payments/confirm
Confirm payment after client-side processing.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "paymentIntentId": "pi_...",
  "listingId": "listing-uuid"
}
```

**Response (200):**
```json
{
  "transaction": {
    "id": "trans-uuid",
    "status": "COMPLETED",
    "amount": 5000,
    "completedAt": "2024-02-24T10:00:00Z"
  }
}
```

---

## Admin Endpoints

### GET /api/admin/dashboard
Get admin dashboard stats.

**Headers:**
```
Authorization: Bearer {adminAccessToken}
```

**Response (200):**
```json
{
  "metrics": {
    "totalUsers": 5000,
    "activeUsers": 2500,
    "totalListings": 3200,
    "activeListings": 2800,
    "totalTransactions": 4500,
    "monthlyRevenue": 125000,
    "todaysRevenue": 8500
  },
  "disputes": 3,
  "suspendedAccounts": 5,
  "pendingReviews": 12,
  "systemHealth": {
    "apiStatus": "healthy",
    "databaseStatus": "healthy",
    "cacheStatus": "healthy"
  }
}
```

### GET /api/admin/users
List users (admin).

**Headers:**
```
Authorization: Bearer {adminAccessToken}
```

**Query Parameters:**
```
?page=1&limit=50&search=email&status=ACTIVE
```

**Response (200):**
```json
{
  "users": [...],
  "total": 5000,
  "page": 1
}
```

### PATCH /api/admin/users/:userId
Update user (admin).

**Headers:**
```
Authorization: Bearer {adminAccessToken}
```

**Request:**
```json
{
  "status": "SUSPENDED",
  "reason": "Violation of terms"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": { ... }
}
```

---

## WebSocket Events

### Connection
```javascript
const socket = io('https://api.puraestate.com', {
  auth: {
    token: accessToken
  }
})
```

### User Events
```javascript
// User comes online
socket.emit('user:online')

// User goes offline (automatic on disconnect)
```

### Message Events
```javascript
// Send message
socket.emit('message:send', {
  conversationId: 'conv-uuid',
  content: 'Hello!'
})

// Receive message
socket.on('message:new', (data) => {
  console.log('New message:', data)
})

// Typing indicator
socket.emit('typing:start', 'conv-uuid')
socket.emit('typing:stop', 'conv-uuid')

socket.on('typing', (data) => {
  console.log(`${data.userId} is typing: ${data.isTyping}`)
})
```

### Status Events
```javascript
// User status
socket.on('user:status', (data) => {
  console.log(`User ${data.userId} is ${data.status}`)
})

// Listing updates
socket.emit('listing:watch', 'listing-uuid')
socket.on('listing:updated', (data) => {
  console.log('Listing updated:', data)
})
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 400 | Invalid request parameters |
| UNAUTHORIZED | 401 | Missing or invalid auth token |
| FORBIDDEN | 403 | User lacks permission |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMIT | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limiting

All endpoints are rate limited:
- Authenticated users: 100 requests per 15 minutes
- Unauthenticated users: 20 requests per 15 minutes
- Search endpoint: 50 requests per 15 minutes

Headers returned:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1708773600
```

---

## Migration from Legacy PuraEstate

### Phase 1: Export Current Data

```bash
# Export from legacy database
pg_dump puraestate_legacy > backup.sql

# Export images from S3
aws s3 sync s3://puraestate-legacy/ s3://puraestate-backup/
```

### Phase 2: Data Mapping

```typescript
// Map old schema to new schema
const legacyToNewMapping = {
  users: {
    id: 'id',
    email: 'email',
    password: 'password_hash',
    full_name: (row) => `${row.first_name} ${row.last_name}`,
    profile_pic: 'profile_photo_url',
    created: 'created_at'
  },
  listings: {
    id: 'id',
    user_id: 'user_id',
    title: 'title',
    desc: 'description',
    type: 'category',
    price_value: 'price',
    price_unit: (row) => 'USD', // Default currency
    lat: 'location_lat',
    lon: 'location_lng',
    addr: 'location_address',
    images: (row) => row.image_ids.split(','),
    post_date: 'created_at'
  }
}
```

### Phase 3: Data Import Script

```typescript
// packages/database/scripts/migrate-legacy.ts
import { Pool } from 'pg'
import csv from 'csv-parser'
import fs from 'fs'

const oldDb = new Pool({ connectionString: process.env.LEGACY_DB_URL })
const newDb = new Pool({ connectionString: process.env.DATABASE_URL })

async function migrateUsers() {
  const result = await oldDb.query('SELECT * FROM users')

  for (const legacyUser of result.rows) {
    await newDb.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, profile_photo_url, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [
        legacyUser.id,
        legacyUser.email,
        legacyUser.password_hash,
        legacyUser.first_name,
        legacyUser.last_name,
        legacyUser.profile_photo_url,
        legacyUser.created_at
      ]
    )
  }

  console.log(`✓ Migrated ${result.rows.length} users`)
}

async function migrateListings() {
  const result = await oldDb.query('SELECT * FROM listings')

  for (const legacyListing of result.rows) {
    await newDb.query(
      `INSERT INTO listings
       (id, user_id, title, description, category, price, location_lat, location_lng, location_address, image_urls, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [
        legacyListing.id,
        legacyListing.user_id,
        legacyListing.title,
        legacyListing.description,
        legacyListing.type || 'property',
        legacyListing.price_value,
        legacyListing.lat,
        legacyListing.lon,
        legacyListing.address,
        legacyListing.image_urls || [],
        'ACTIVE', // Assume all legacy listings were active
        legacyListing.created_at
      ]
    )
  }

  console.log(`✓ Migrated ${result.rows.length} listings`)
}

async function runMigration() {
  try {
    console.log('Starting legacy data migration...')
    await migrateUsers()
    await migrateListings()
    console.log('✓ Migration completed successfully!')
  } catch (error) {
    console.error('✗ Migration failed:', error)
    process.exit(1)
  } finally {
    await oldDb.end()
    await newDb.end()
  }
}

runMigration()
```

### Phase 4: Image Migration

```bash
# Download legacy images
mkdir legacy-images
aws s3 sync s3://puraestate-legacy/images/ ./legacy-images/

# Optimize images (resize, compress)
for file in legacy-images/*.{jpg,jpeg,png}; do
  convert "$file" -resize 2000x2000 -quality 85 "optimized/$file"
done

# Upload to new bucket
aws s3 sync ./optimized/ s3://puraestate-prod/listings/ --acl public-read
```

### Phase 5: Validation & Reconciliation

```typescript
// Verify migration integrity
async function validateMigration() {
  const oldUserCount = await oldDb.query('SELECT COUNT(*) FROM users')
  const newUserCount = await newDb.query('SELECT COUNT(*) FROM users')

  if (oldUserCount.rows[0].count === newUserCount.rows[0].count) {
    console.log('✓ User count matches')
  } else {
    console.error('✗ User count mismatch!')
    return false
  }

  // Check for data integrity
  const oldUsers = await oldDb.query('SELECT id, email FROM users ORDER BY id')
  const newUsers = await newDb.query('SELECT id, email FROM users ORDER BY id')

  for (let i = 0; i < oldUsers.rows.length; i++) {
    if (oldUsers.rows[i].email !== newUsers.rows[i].email) {
      console.error(`✗ Email mismatch for user ${oldUsers.rows[i].id}`)
      return false
    }
  }

  console.log('✓ All data integrity checks passed')
  return true
}
```

### Phase 6: Cutover & Rollback Plan

**Cutover Process:**
1. Notify users of maintenance window (24-48 hours notice)
2. Enable read-only mode on legacy system
3. Run final validation sync
4. Update DNS to point to new system
5. Monitor error rates and performance
6. Keep legacy system running for 7 days as fallback

**Rollback Procedure:**
```bash
# If critical issues occur
# Point DNS back to legacy system
aws route53 change-resource-record-sets \
  --hosted-zone-id ZONE_ID \
  --change-batch file://rollback-change.json

# Keep new system running for investigation
# Document issues and plan re-cutover
```

---

## Example Implementations

### JavaScript/Node.js

```javascript
const axios = require('axios')

const api = axios.create({
  baseURL: 'https://api.puraestate.com',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
})

// Create listing
async function createListing(listing) {
  const response = await api.post('/listings', listing)
  return response.data.listing
}

// Search listings
async function search(query, filters) {
  const response = await api.post('/search', { query, filters })
  return response.data.results
}

// Send message
async function sendMessage(conversationId, content) {
  const response = await api.post(
    `/conversations/${conversationId}/messages`,
    { content }
  )
  return response.data.message
}
```

### Python

```python
import requests

class PuraEstateAPI:
    BASE_URL = "https://api.puraestate.com"

    def __init__(self, access_token):
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

    def create_listing(self, listing_data):
        response = requests.post(
            f"{self.BASE_URL}/listings",
            json=listing_data,
            headers=self.headers
        )
        return response.json()["listing"]

    def search(self, query, filters):
        response = requests.post(
            f"{self.BASE_URL}/search",
            json={"query": query, "filters": filters},
            headers=self.headers
        )
        return response.json()["results"]

    def send_message(self, conversation_id, content):
        response = requests.post(
            f"{self.BASE_URL}/conversations/{conversation_id}/messages",
            json={"content": content},
            headers=self.headers
        )
        return response.json()["message"]
```

---

**Version:** 1.0
**Last Updated:** February 24, 2026
**Status:** Complete & Ready for Integration
