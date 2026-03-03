# PuraEstate Admin Dashboard - API Documentation

Complete API reference for the PuraEstate Admin Dashboard.

## Base URL

```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

## Authentication

All endpoints (except `/auth/login`) require Bearer token authentication:

```bash
Authorization: Bearer <token>
```

Tokens are obtained via the login endpoint and stored in `localStorage`.

## Response Format

All endpoints return standardized JSON responses:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "error": null,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## Authentication Endpoints

### POST /auth/login

Login with email and password.

**Request:**
```json
{
  "email": "admin@puraestate.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "user123",
      "email": "admin@puraestate.com"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Dashboard Endpoints

### GET /dashboard/metrics

Get dashboard overview metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProperties": 250,
    "totalUsers": 1500,
    "totalBookings": 450,
    "totalRevenue": 1250000,
    "monthlyBookings": 45,
    "monthlyRevenue": 125000,
    "activeUsers": 850,
    "pendingVerifications": 12
  }
}
```

---

## Properties Endpoints

### GET /properties/list

Get list of properties with pagination.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `pageSize` (number, default: 10) - Items per page
- `status` (string) - Filter by status: available, sold, rented, pending

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "prop123",
        "title": "Modern Apartment",
        "price": 250000,
        "status": "available",
        "location": {
          "city": "New York",
          "state": "NY"
        },
        "views": 150,
        "favorites": 25
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 250,
      "totalPages": 25
    }
  }
}
```

### POST /properties/create

Create a new property.

**Request:**
```json
{
  "title": "Luxury Villa",
  "description": "Beautiful beachfront villa",
  "propertyType": "villa",
  "bedrooms": 4,
  "bathrooms": 3,
  "squareFeet": 3500,
  "price": 500000,
  "currency": "USD",
  "location": {
    "address": "123 Ocean View",
    "city": "Miami",
    "state": "FL",
    "country": "USA",
    "coordinates": {
      "lat": 25.7617,
      "lng": -80.1918
    }
  },
  "amenities": ["Pool", "Garden", "Garage"],
  "agent": {
    "id": "agent123",
    "name": "John Doe",
    "email": "john@puraestate.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Property created successfully",
  "data": {
    "id": "prop456",
    "title": "Luxury Villa",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### GET /properties/[id]

Get property details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prop123",
    "title": "Modern Apartment",
    "description": "Spacious apartment in downtown",
    "propertyType": "apartment",
    "bedrooms": 2,
    "bathrooms": 1,
    "squareFeet": 1200,
    "price": 250000,
    "status": "available",
    "images": [
      "https://storage.googleapis.com/..."
    ],
    "amenities": ["Gym", "Parking", "Doorman"],
    "agent": {
      "id": "agent123",
      "name": "John Doe",
      "email": "john@puraestate.com"
    }
  }
}
```

### PUT /properties/[id]

Update property details.

**Request:**
```json
{
  "title": "Updated Title",
  "price": 275000,
  "status": "rented"
}
```

### DELETE /properties/[id]

Delete property.

**Response:**
```json
{
  "success": true,
  "message": "Property deleted successfully"
}
```

---

## Users Endpoints

### GET /users/list

Get list of users.

**Query Parameters:**
- `page` (number, default: 1)
- `pageSize` (number, default: 10)
- `role` (string) - Filter by role: admin, agent, buyer, seller

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "user123",
        "email": "user@example.com",
        "name": "John Smith",
        "role": "buyer",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

### GET /users/[id]

Get user details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Smith",
    "phone": "+1234567890",
    "role": "buyer",
    "isActive": true,
    "avatar": "https://...",
    "bio": "Real estate enthusiast",
    "subscription": {
      "id": "sub123",
      "name": "Premium",
      "price": 99,
      "duration": "monthly"
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### PUT /users/[id]

Update user information.

**Request:**
```json
{
  "name": "John Smith Updated",
  "phone": "+1234567890",
  "isActive": false
}
```

### DELETE /users/[id]

Delete user account.

---

## Agents Endpoints

### GET /agents/list

Get list of agents.

**Query Parameters:**
- `page` (number, default: 1)
- `pageSize` (number, default: 10)
- `verified` (boolean) - Filter by verification status

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "agent123",
        "user": {
          "id": "user456",
          "name": "Jane Doe",
          "email": "jane@puraestate.com"
        },
        "license": "RE-2024-001",
        "rating": 4.8,
        "reviewCount": 45,
        "totalBookings": 120,
        "totalCommission": 45000,
        "verified": true
      }
    ],
    "pagination": { ... }
  }
}
```

### PUT /agents/[id]

Update agent information or verify.

**Request:**
```json
{
  "verified": true,
  "verificationDate": "2024-01-15T10:30:00Z"
}
```

---

## Bookings Endpoints

### GET /bookings/list

Get list of bookings.

**Query Parameters:**
- `page` (number)
- `pageSize` (number)
- `status` (string) - pending, confirmed, completed, cancelled

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "booking123",
        "propertyId": "prop123",
        "userId": "user123",
        "agentId": "agent123",
        "startDate": "2024-02-01",
        "endDate": "2024-02-07",
        "totalPrice": 3500,
        "commission": 350,
        "status": "confirmed"
      }
    ]
  }
}
```

### PUT /bookings/[id]

Update booking status.

**Request:**
```json
{
  "status": "completed",
  "notes": "Guest satisfied"
}
```

### DELETE /bookings/[id]

Cancel booking.

---

## Payments Endpoints

### GET /payments/transactions

Get transaction history.

**Query Parameters:**
- `page` (number)
- `pageSize` (number)
- `status` (string) - pending, completed, failed, refunded
- `type` (string) - booking, subscription, commission

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "txn123",
        "amount": 500,
        "currency": "USD",
        "status": "completed",
        "type": "booking",
        "paymentMethod": "stripe",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### POST /payments/[id]/refund

Process refund for transaction.

**Request:**
```json
{
  "amount": 500,
  "reason": "Customer request"
}
```

---

## Messages Endpoints

### GET /messages/list

Get list of messages.

**Query Parameters:**
- `page` (number)
- `channel` (string) - whatsapp, email, in-app
- `status` (string) - sent, delivered, read

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "msg123",
        "senderId": "user123",
        "recipientId": "user456",
        "content": "Hello, interested in this property",
        "channel": "whatsapp",
        "status": "read",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### POST /messages/send

Send new message.

**Request:**
```json
{
  "recipientId": "user456",
  "content": "Message content",
  "channel": "whatsapp",
  "type": "text"
}
```

---

## Analytics Endpoints

### POST /analytics/report

Generate analytics report.

**Request:**
```json
{
  "type": "user_metrics",
  "filters": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }
}
```

**Supported Report Types:**
- `user_metrics` - User growth and activity
- `property_performance` - Property views and bookings
- `revenue` - Revenue breakdown
- `agent_performance` - Agent rankings
- `custom` - Custom report

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "report_1705318200",
    "title": "user_metrics Report",
    "type": "user_metrics",
    "generatedBy": "admin",
    "generatedAt": "2024-01-15T10:30:00Z",
    "data": {
      "totalUsers": 1500,
      "byRole": { ... },
      "monthlyGrowth": [ ... ]
    }
  }
}
```

### GET /analytics/export

Export report as file.

**Query Parameters:**
- `reportId` (string) - Report ID
- `format` (string) - pdf, excel, csv

---

## Settings Endpoints

### GET /settings

Get system settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "platformName": "PuraEstate",
    "supportEmail": "support@puraestate.com",
    "timezone": "UTC",
    "smtpHost": "smtp.gmail.com",
    "commissionRate": 10
  }
}
```

### PUT /settings

Update system settings.

**Request:**
```json
{
  "platformName": "PuraEstate",
  "supportEmail": "support@puraestate.com",
  "commissionRate": 12
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Common Errors

**400 Bad Request**
```json
{
  "success": false,
  "message": "Invalid request parameters",
  "error": "Missing required field: email"
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "message": "Authentication required",
  "error": "Invalid or expired token"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Resource not found",
  "error": "Property with ID 'prop999' not found"
}
```

---

## Rate Limiting

- Rate limit: 1000 requests per hour per API key
- Headers:
  - `X-RateLimit-Limit: 1000`
  - `X-RateLimit-Remaining: 950`
  - `X-RateLimit-Reset: 1705322400`

---

## Pagination

All list endpoints support pagination:

```
GET /api/users/list?page=1&pageSize=10
```

Response includes:
```json
{
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 250,
    "totalPages": 25
  }
}
```

---

## Webhooks

### Stripe Webhook
```
POST /api/webhooks/stripe
```

**Events:**
- `charge.succeeded`
- `charge.failed`
- `customer.subscription.created`
- `customer.subscription.deleted`

### WhatsApp Webhook
```
POST /api/webhooks/whatsapp
```

---

## Code Examples

### JavaScript/TypeScript

```typescript
import { apiClient } from '@/lib/api';

// Login
const loginResponse = await apiClient.post('/auth/login', {
  email: 'admin@puraestate.com',
  password: 'password123'
});

// Get properties
const propertiesResponse = await apiClient.get('/properties/list', {
  params: { page: 1, pageSize: 10 }
});

// Create property
const createResponse = await apiClient.post('/properties/create', {
  title: 'New Property',
  price: 250000,
  // ... other fields
});
```

### cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@puraestate.com","password":"password123"}'

# Get properties
curl -X GET "http://localhost:3000/api/properties/list?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create property
curl -X POST http://localhost:3000/api/properties/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"New Property",...}'
```

### Python

```python
import requests

headers = {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
}

# Get users
response = requests.get(
    'http://localhost:3000/api/users/list',
    headers=headers,
    params={'page': 1, 'pageSize': 10}
)
users = response.json()
```

---

## Best Practices

1. **Always validate input** before sending to API
2. **Handle errors gracefully** with proper error messages
3. **Use pagination** for large datasets
4. **Cache responses** where appropriate
5. **Use HTTPS** in production
6. **Rotate API keys** regularly
7. **Monitor rate limits** and adjust request frequency
8. **Log all API calls** for debugging
9. **Test endpoints** before using in production
10. **Keep token refresh logic** up to date
