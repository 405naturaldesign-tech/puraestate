# PuraEstate Composio WhatsApp Integration - Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PuraEstate Application                   │
│              (Your Real Estate Platform)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API
                       ↓
┌─────────────────────────────────────────────────────────────┐
│             Express Server (Port 3000)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  API Routes  │  │   Webhooks   │  │  Admin Routes    │ │
│  │              │  │              │  │                  │ │
│  │ - Send Msg   │  │ - Status     │  │ - Dashboard      │ │
│  │ - Automation │  │ - Incoming   │  │ - Analytics      │ │
│  │ - Tracking   │  │ - Events     │  │ - Queue Mgmt     │ │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘ │
│         │                 │                   │            │
│         └─────────────────┼───────────────────┘            │
│                           ↓                                │
│         ┌─────────────────────────────────────┐            │
│         │  Composio Client                    │            │
│         │  - Send WhatsApp Messages           │            │
│         │  - Verify Signatures                │            │
│         │  - Retry Logic                      │            │
│         │  - Error Handling                   │            │
│         └──────────┬──────────────────────────┘            │
│                    │                                       │
└────────────────────┼───────────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         ↓           ↓           ↓
    ┌────────┐  ┌────────┐  ┌─────────────────┐
    │ Redis  │  │MongoDB │  │ Composio API    │
    │ Queue  │  │Database│  │ WhatsApp API    │
    └───┬────┘  └────────┘  └────────┬────────┘
        │                            │
        ↓                            ↓
   ┌─────────────────┐      ┌─────────────────┐
   │ Job Processors  │      │ WhatsApp Network│
   │ (6 Workers)     │      │                 │
   │                 │      │ - Message       │
   │ - Messages      │      │ - Delivery      │
   │ - Property      │      │ - Read          │
   │ - Booking       │      │ - Read Receipt  │
   │ - Reminders     │      └─────────────────┘
   │ - Payments      │
   │ - Portfolio     │
   └────────┬────────┘
            ↓
        Webhooks ←──────────┘ (Status Updates)
```

---

## Data Flow Architecture

### Message Flow (Happy Path)

```
1. User Trigger
   ├─ API Request (/api/messages/send)
   └─ Payload: { phoneNumber, message, ... }

2. Message Service
   ├─ Create message record in DB
   ├─ Check rate limit
   ├─ Status: queued
   └─ Add to queue

3. Queue System (Redis Bull)
   ├─ Store job in Redis
   ├─ Wait for available worker
   └─ Concurrent limit: configurable

4. Worker Process
   ├─ Dequeue job
   ├─ Send to Composio
   ├─ Get messageId back
   ├─ Update DB status: sent
   └─ Continue monitoring

5. Composio → WhatsApp
   ├─ Route to WhatsApp API
   └─ Send via WhatsApp Network

6. Webhook Callback
   ├─ Receive status update
   ├─ Verify signature
   ├─ Parse status (delivered/read)
   └─ Update DB

7. Final State
   ├─ Message status: delivered/read
   ├─ Timestamps recorded
   └─ Available in history
```

### Error Recovery Flow

```
1. Message Send Fails
   ├─ Log error
   ├─ Increment retry counter
   └─ Status: queued (requeue)

2. Exponential Backoff
   ├─ Retry 1: 1 second delay
   ├─ Retry 2: 2 seconds delay
   └─ Retry 3: 4 seconds delay

3. Max Retries Exceeded
   ├─ Status: failed
   ├─ Store error message
   ├─ Log failure
   └─ Available for manual retry

4. Admin Recovery
   ├─ List failed messages
   ├─ Review errors
   ├─ Trigger manual retry
   └─ Message requeued
```

---

## Component Architecture

### Layer 1: Request Entry Points

```
API Routes (3 routers)
├─ Express Router 1: /api/**
│   ├─ /messages/send
│   ├─ /messages/bulk
│   ├─ /messages/{id}/status
│   ├─ /automations/**
│   └─ /queue/stats
│
├─ Express Router 2: /webhooks/**
│   ├─ /whatsapp/status
│   ├─ /whatsapp/incoming
│   ├─ /composio/events
│   └─ /health
│
└─ Express Router 3: /admin/**
    ├─ /dashboard/stats
    ├─ /analytics/**
    ├─ /messages/search
    ├─ /queue
    └─ /health
```

### Layer 2: Business Logic

```
Services (2 services)
├─ Message Service
│   ├─ sendMessage(request)
│   ├─ sendBulkMessages(array)
│   ├─ getMessageStatus(id)
│   ├─ getMessageHistory(recipientId)
│   ├─ retryFailedMessage(id)
│   └─ updateMessageStatus(id, status)
│
└─ Automation Service
    ├─ notifyPropertyMatch(request)
    ├─ sendBookingConfirmation(request)
    ├─ scheduleViewingReminders(viewingId)
    ├─ sendPaymentNotification(investorId, type, data)
    ├─ sendPortfolioUpdate(investorId, type, data)
    └─ sendViewingSurvey(viewingId)
```

### Layer 3: Integration

```
Composio Client
├─ sendWhatsAppMessage(params)
├─ getMessageStatus(messageId)
├─ createTemplate(params)
├─ sendTemplateMessage(params)
├─ executeAction(action, params)
├─ createWebhook(url, events)
└─ verifyWebhookSignature(payload, signature, timestamp)

Queue Manager
├─ addWhatsAppMessageJob(data)
├─ addPropertyMatchJob(data)
├─ addBookingConfirmationJob(data)
├─ addReminderJob(data, delay)
├─ addPaymentJob(data)
├─ addPortfolioUpdateJob(data)
├─ processQueue(name, handler)
├─ getQueueStats(name)
└─ closeAll()
```

### Layer 4: Data

```
Database Layer (MongoDB)
├─ Investor Collection
├─ Agent Collection
├─ Property Collection
├─ Viewing Collection
├─ WhatsAppMessage Collection
├─ Subscription Collection
├─ MessageAnalytics Collection
├─ MessageTemplate Collection
└─ WebhookEvent Collection

Cache Layer (Redis)
├─ Rate limit counters
├─ Session data
└─ Job queue storage
```

---

## State Machine: Message Lifecycle

```
                   ┌─────────┐
                   │ Created │
                   └────┬────┘
                        │ (save to DB)
                        ↓
                   ┌─────────┐
                   │ Queued  │
                   └────┬────┘
                        │ (add to queue)
                        ↓
                   ┌─────────────┐
            ┌─────→│ Sent        │◄─────┐
            │      └─────────────┘      │ (retry)
            │           │               │
            │ (backoff)  │ (webhook)    │
            │ retry 1-3  ↓              │
            │      ┌─────────────┐      │
            │      │ Delivered   │      │
            │      └─────────────┘      │
            │           │               │
            │           │ (webhook)     │
            │           ↓               │
            │      ┌─────────────┐      │
            │      │ Read        │      │
            │      └─────────────┘      │
            │                           │
            │      (error)              │
            └─────────────────────────────┘
                        │
                        ↓
                   ┌─────────┐
                   │ Failed  │
                   └─────────┘
                        ↑
                   (manual retry)
                        │
                     ┌──┘
```

---

## Workflow Execution Architecture

### Workflow 1: Property Match

```
API Request (property match)
    ↓
Message Service
    ↓
Queue Job: property_match
    ↓
Worker Process
    ↓
Automation Service: notifyPropertyMatch()
    ├─ Load investor
    ├─ Load properties
    ├─ Get top agents (per property)
    ├─ For each agent:
    │   ├─ Get template
    │   ├─ Interpolate variables
    │   ├─ Send message
    │   └─ Log result
    └─ Complete job
```

### Workflow 2: Booking Confirmation

```
API Request (booking)
    ↓
Message Service
    ↓
Queue Job: booking_confirmation
    ↓
Worker Process
    ↓
Automation Service: sendBookingConfirmation()
    ├─ Load investor
    ├─ Load agent
    ├─ Load property
    ├─ Create viewing record
    ├─ Send to investor
    │   ├─ Get template
    │   ├─ Interpolate variables
    │   └─ Queue message
    ├─ Send to agent
    │   ├─ Get template
    │   ├─ Interpolate variables
    │   └─ Queue message
    ├─ Schedule reminders
    │   ├─ 24h reminder
    │   └─ 1h reminder
    └─ Complete job
```

### Workflow 3-6: Other Workflows

Similar pattern:
1. API request → Queue job
2. Worker dequeues
3. Automation service executes
4. Messages sent via Composio
5. Status tracked via webhooks

---

## Rate Limiting Architecture

```
┌─────────────────────────────────────┐
│  Message Send Request               │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│  Rate Limit Check                   │
│  (Per phone number)                 │
│  - Get counter from cache           │
│  - Compare to limit (60/min default)│
│  - Increment counter                │
│  - Set TTL (60 seconds)             │
└────┬────────────────────────────┬───┘
     │                            │
   YES                           NO
(allowed)                   (limit exceeded)
     │                            │
     ↓                            ↓
  Queue              Return 429 + Retry-After
   Message              header
     │
     ↓
  Success
```

---

## Error Handling Architecture

```
Try/Catch Wrapper
    ↓
┌───────────────────────────────────┐
│ Error Classification              │
├───────────────────────────────────┤
│ ├─ Network Error                  │
│ ├─ Rate Limit Error               │
│ ├─ Invalid Input Error            │
│ ├─ Authentication Error           │
│ ├─ Database Error                 │
│ └─ Unknown Error                  │
└───────────────────────────────────┘
    │
    ├─ Network/Rate Limit → Retry with backoff
    ├─ Invalid Input → Log + Fail (no retry)
    ├─ Auth Error → Log + Alert (no retry)
    ├─ Database Error → Retry with backoff
    └─ Unknown → Log + Alert + Retry
    │
    ↓
Logging
    ├─ Error log
    ├─ Analytics event
    ├─ Alert if critical
    └─ Available for admin review
```

---

## Scalability Architecture

### Horizontal Scaling

```
Load Balancer (Nginx)
    ├─ Instance 1 (Express Server)
    │   ├─ API Routes
    │   └─ Webhook Handler
    │
    ├─ Instance 2 (Express Server)
    │   ├─ API Routes
    │   └─ Webhook Handler
    │
    └─ Instance N (Express Server)
        ├─ API Routes
        └─ Webhook Handler

Shared Infrastructure
    ├─ MongoDB (Replica Set)
    ├─ Redis (Cluster or Sentinel)
    └─ Composio API (External)

Worker Nodes
    ├─ Worker 1 (6 queue processors)
    ├─ Worker 2 (6 queue processors)
    └─ Worker N (6 queue processors)
```

### Queue Scaling

```
Single Worker (Default)
    ├─ Concurrency: 10
    ├─ Max throughput: ~600 messages/minute
    └─ CPU usage: Low

Multiple Workers
    ├─ Worker 1 + Worker 2 + ... Worker N
    ├─ Concurrency per worker: 10
    ├─ Total throughput: 600 × N messages/minute
    └─ CPU usage: Scales linearly
```

---

## Security Architecture

```
Request Entry
    ↓
┌─────────────────────────────────┐
│ Authentication Layer            │
├─────────────────────────────────┤
│ ├─ API Routes: Bearer token     │
│ ├─ Webhooks: Signature verify   │
│ └─ Admin: JWT token             │
└────┬────────────────────────────┘
     │
     ↓ (Valid)
┌─────────────────────────────────┐
│ Validation Layer                │
├─────────────────────────────────┤
│ ├─ Input schema validation      │
│ ├─ Phone number format check    │
│ └─ Rate limit check             │
└────┬────────────────────────────┘
     │
     ↓ (Valid)
┌─────────────────────────────────┐
│ Rate Limiting Layer             │
├─────────────────────────────────┤
│ ├─ Per-phone rate limit         │
│ ├─ Per-API rate limit           │
│ └─ Queue backoff               │
└────┬────────────────────────────┘
     │
     ↓ (Allowed)
┌─────────────────────────────────┐
│ Execution Layer                 │
├─────────────────────────────────┤
│ ├─ Transaction begin            │
│ ├─ Process request              │
│ ├─ Log audit trail              │
│ └─ Transaction commit/rollback  │
└─────────────────────────────────┘
```

---

## Monitoring Architecture

```
Application
    ├─ Request logging
    ├─ Error tracking
    └─ Performance metrics
         │
         ↓
┌─────────────────────────────────┐
│ Logging System (Winston)        │
├─────────────────────────────────┤
│ ├─ Console output (dev)         │
│ ├─ File output (prod)           │
│ │   ├─ logs/all.log             │
│ │   └─ logs/error.log           │
│ └─ Structured JSON logging      │
└────┬────────────────────────────┘
     │
     ↓
┌─────────────────────────────────┐
│ Metrics Collection              │
├─────────────────────────────────┤
│ ├─ Message count                │
│ ├─ Delivery rate                │
│ ├─ Error rate                   │
│ ├─ Queue depth                  │
│ └─ Response times               │
└────┬────────────────────────────┘
     │
     ↓
┌─────────────────────────────────┐
│ Admin Dashboard                 │
├─────────────────────────────────┤
│ ├─ Real-time stats              │
│ ├─ Analytics charts             │
│ ├─ Queue visualization          │
│ ├─ Error list                   │
│ └─ Health status                │
└─────────────────────────────────┘
```

---

## Template Architecture

```
Template Library
    ├─ property_match
    │   ├─ en (English)
    │   └─ es (Spanish)
    │
    ├─ booking_confirmation
    │   ├─ en
    │   └─ es
    │
    ├─ viewing_reminder_24h
    │   ├─ en
    │   └─ es
    │
    ├─ payment_confirmation
    │   ├─ en
    │   └─ es
    │
    ├─ payment_failed
    │   ├─ en
    │   └─ es
    │
    ├─ price_alert
    │   ├─ en
    │   └─ es
    │
    └─ survey_request
        ├─ en
        └─ es

Template Usage Flow:
1. Get template by key and language
2. Extract variables list
3. Interpolate with actual values
4. Send final message
```

---

## Deployment Architecture

### Development

```
Developer Machine
    ├─ Node.js + npm
    ├─ Docker (optional)
    ├─ MongoDB (local or Docker)
    ├─ Redis (local or Docker)
    └─ http://localhost:3000
```

### Docker

```
Docker Container
    ├─ Node.js app (Port 3000)
    ├─ Environment from compose
    ├─ Volume mounts for logs
    ├─ Health checks
    └─ Signal handling
```

### Production

```
VPS / Cloud Server
    ├─ Ubuntu/Linux OS
    ├─ Node.js (v18+)
    ├─ PM2 (process manager)
    ├─ Nginx (reverse proxy)
    ├─ Let's Encrypt (SSL)
    │
    ├─ External services
    │   ├─ MongoDB Atlas
    │   ├─ Redis Cloud / ElastiCache
    │   └─ Composio API
    │
    └─ Monitoring
        ├─ PM2 monitoring
        ├─ Log aggregation
        └─ Health checks
```

---

## Technology Stack

### Runtime
- **Node.js** 18+ (JavaScript runtime)
- **TypeScript** 5+ (Type safety)
- **Express.js** 4+ (Web framework)

### Databases
- **MongoDB** 6+ (Document database)
- **Redis** 7+ (Cache & queue)

### Messaging
- **Bull** 4+ (Queue management)
- **Composio** (WhatsApp integration)
- **Axios** (HTTP client)

### Utilities
- **Winston** (Logging)
- **Joi** (Validation)
- **node-cache** (In-memory caching)
- **dotenv** (Environment management)

### Testing
- **Jest** (Test framework)
- **Supertest** (HTTP testing)
- **mongodb-memory-server** (In-memory DB for tests)

### DevOps
- **Docker** (Containerization)
- **docker-compose** (Orchestration)
- **PM2** (Process management)
- **Nginx** (Reverse proxy)

---

## Performance Characteristics

### Message Processing

```
┌──────────────────────────────────────┐
│ Single Message                       │
├──────────────────────────────────────┤
│ Queue time: 0-100ms                  │
│ Processing: 500-1000ms               │
│ Composio API: 1-3 seconds            │
│ Total: 1.5-4.5 seconds               │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Bulk Messages (100 messages)         │
├──────────────────────────────────────┤
│ Queue time: 100-500ms                │
│ Processing: 50-100ms each            │
│ Total: 5-10 seconds                  │
│ Throughput: 10-20 msgs/sec           │
└──────────────────────────────────────┘
```

### System Resources

```
┌──────────────────────────────────────┐
│ Idle                                 │
├──────────────────────────────────────┤
│ Memory: ~150MB                       │
│ CPU: 0%                              │
│ Connections: 1 (MongoDB, Redis each)│
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 1000 messages/minute                 │
├──────────────────────────────────────┤
│ Memory: ~300-400MB                   │
│ CPU: 20-30%                          │
│ Database connections: 5-10           │
│ Redis connections: 10-20             │
└──────────────────────────────────────┘
```

---

## Conclusion

This architecture is designed to be:
- **Scalable**: Add more instances, workers, and databases
- **Reliable**: Queue-based with retry logic and persistence
- **Maintainable**: Clean separation of concerns, TypeScript types
- **Observable**: Comprehensive logging and monitoring
- **Secure**: Multi-layer authentication and validation
- **Compliant**: GDPR, CCPA support built-in

---

**Last Updated**: 2024
**Version**: 1.0.0
