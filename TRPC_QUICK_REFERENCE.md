# tRPC Server - Quick Reference

Fast lookup guide for common tasks.

## 🚀 Quick Start (5 minutes)

```bash
cd trpc-server
npm install
cp .env.example .env.local
# Edit .env.local with your Flask URL
npm run dev
```

Then open: http://localhost:3000/health

---

## 🔌 API Endpoints

### Listings

**Get all listings:**
```typescript
trpc.listings.list.useQuery({
  propertyType: 'house',
  minPrice: 100000,
  maxPrice: 500000,
  limit: 20
})
```

**Get single listing:**
```typescript
trpc.listings.byId.useQuery('listing-id-123')
```

**Create listing:**
```typescript
trpc.listings.create.useMutation({
  title: 'Beautiful House in Tamarindo',
  propertyType: 'house',
  price: 350000,
  bedrooms: 3,
  bathrooms: 2,
  squareMeters: 250,
  location: 'Tamarindo, Guanacaste',
  latitude: 10.3045,
  longitude: -85.8312,
  amenities: ['pool', 'ac', 'kitchen']
})
```

**Generate AI description:**
```typescript
trpc.listings.generateDescription.useMutation({
  propertyData: {
    title: 'Beautiful House',
    bedrooms: 3,
    bathrooms: 2,
    squareMeters: 250,
    amenities: ['pool', 'ac'],
    location: 'Tamarindo',
    highlights: ['ocean view', 'modern kitchen']
  },
  style: 'professional' // or 'casual', 'poetic'
})
```

### Inquiries

**Create inquiry:**
```typescript
trpc.inquiries.create.useMutation({
  propertyId: 'property-123',
  inquiryType: 'viewing', // or 'general', 'offer'
  message: 'I want to view this property',
  buyerName: 'John Doe',
  buyerEmail: 'john@example.com',
  buyerPhone: '+506 8765 4321'
})
```

**Schedule viewing:**
```typescript
trpc.inquiries.scheduleViewing.useMutation({
  inquiryId: 'inquiry-123',
  viewingDate: '2026-03-15T10:00:00Z',
  buyerEmail: 'john@example.com',
  agentEmail: 'agent@puraestate.com'
})
```

**Send WhatsApp message:**
```typescript
trpc.inquiries.sendWhatsAppMessage.useMutation({
  inquiryId: 'inquiry-123',
  phoneNumber: '+506 8765 4321',
  message: '✨ Great news! 3 providers matched your job'
})
```

---

## 🔑 Environment Variables

### Minimal (for local dev)
```env
FLASK_API_URL=http://localhost:5000
FLASK_API_KEY=dev-key
```

### Full (production)
```env
NODE_ENV=production
PORT=3000
FLASK_API_URL=https://api.puraestate.com
FLASK_API_KEY=prod-key
COMPOSIO_API_KEY=your_key
OPENROUTER_API_KEY=your_key
JWT_SECRET=your_secret
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=https://puraestate.com
LOG_LEVEL=info
```

---

## 📊 Directory Structure

```
trpc-server/
├── src/
│   ├── index.ts                # Express server
│   ├── trpc.ts                # tRPC setup
│   ├── routers/
│   │   ├── listings.ts        # Listings CRUD
│   │   ├── inquiries.ts       # Inquiries CRUD
│   │   ├── composio-events.ts # Event logging
│   │   └── index.ts           # Main router
│   └── lib/
│       ├── flask-gateway.ts   # Flask API client
│       ├── composio.ts        # WhatsApp/Email
│       └── openrouter.ts      # AI models
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

---

## 🛠 Common Tasks

### Start Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Type Checking
```bash
npm run type-check
```

### Check Server Status
```bash
curl http://localhost:3000/status
```

### View Flask Backend Status
```bash
curl http://localhost:5000/health
```

### Test Composio Connection
```bash
curl -H "x-api-key: $COMPOSIO_API_KEY" \
  https://backend.composio.dev/api/v2/connectedAccounts
```

---

## 🚨 Error Codes

| Error | Cause | Fix |
|-------|-------|-----|
| `UNAUTHORIZED` | Missing/invalid JWT | Add token to Authorization header |
| `FORBIDDEN` | Insufficient permissions | User role doesn't allow action |
| `Flask API error: 500` | Flask backend crashed | Check Flask logs |
| `Composio not configured` | Missing COMPOSIO_API_KEY | Add key to .env.local |
| `CORS error` | Frontend origin not allowed | Update CORS_ORIGIN |

---

## 💡 Pro Tips

### 1. Batch Multiple Queries
```typescript
// tRPC automatically batches these into 1 request
const [listings, stats] = await Promise.all([
  trpc.listings.list.useQuery(),
  trpc.composioEvents.analytics.useQuery()
])
```

### 2. Cache Responses (React Query)
```typescript
const { data } = trpc.listings.list.useQuery(filters, {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
})
```

### 3. Monitor Composio Events
```bash
curl http://localhost:3000/trpc/composioEvents.list
```

### 4. Generate Multiple Descriptions
```typescript
const descriptions = await Promise.all([
  trpc.listings.generateDescription.mutate({ style: 'professional' }),
  trpc.listings.generateDescription.mutate({ style: 'casual' }),
  trpc.listings.generateDescription.mutate({ style: 'poetic' })
])
```

---

## 📈 Performance

### Optimize for Mobile (Costa Rica Context)

1. **Limit query results**
   ```typescript
   { limit: 10, offset: 0 } // Pagination
   ```

2. **Enable caching**
   - staleTime: 5 minutes
   - cacheTime: 10 minutes

3. **Use WhatsApp for notifications**
   - 95% penetration in Costa Rica
   - No data charges via Composio

4. **Compress responses**
   - gzip enabled (Express middleware)
   - JSON payload < 100KB per request

---

## 🔐 Security Checklist

- [ ] JWT tokens verified with Flask
- [ ] CORS restricted to trusted origins
- [ ] Environment variables never committed
- [ ] API keys stored in `.env.local`
- [ ] Rate limiting enabled (future)
- [ ] Input validation via Zod schemas
- [ ] No sensitive data in logs
- [ ] HTTPS required in production

---

## 📞 Support

| Issue | Resource |
|-------|----------|
| Flask not connecting | Check `FLASK_API_URL` in `.env.local` |
| Composio errors | Check logs: `npm run dev` |
| OpenRouter charges | Check balance at https://openrouter.ai/account |
| tRPC type errors | Run `npm run type-check` |
| CORS issues | Update `CORS_ORIGIN` in `.env.local` |

---

## 🎯 Roadmap

- ✅ tRPC server setup
- ✅ Flask integration
- ✅ Composio (WhatsApp)
- ✅ OpenRouter (AI)
- ⬜ React Native client
- ⬜ Real-time subscriptions (WebSockets)
- ⬜ Payment processing (Stripe)
- ⬜ Push notifications
- ⬜ Video call integration

---

**Last Updated:** 2026-02-25
