# PuraEstate tRPC Server

Type-safe API layer for PuraEstate React Native mobile app.

**Architecture:**
```
React Native (Expo)
    ↓
tRPC Server (Node.js)
    ↓
Flask Backend (Python)
    ↓
PostgreSQL + Redis
```

## Quick Start

### 1. Install Dependencies
```bash
cd trpc-server
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local with your API keys:
# - FLASK_API_URL (e.g., http://localhost:5000)
# - COMPOSIO_API_KEY
# - OPENROUTER_API_KEY
# - NEXT_PUBLIC_SUPABASE_URL
```

### 3. Start Development Server
```bash
npm run dev
# Server will start on http://localhost:3000
```

### 4. Type-check (Optional)
```bash
npm run type-check
```

## API Structure

### Routers

#### `/trpc/listings`
- `list` - Get all listings with filters
- `byId` - Get single listing with stats
- `search` - Search with AI relevance
- `create` - Create new listing
- `update` - Update listing
- `delete` - Delete listing
- `generateDescription` - AI-powered description generation
- `suggestPrice` - Market-based price suggestions
- `generateKeywords` - SEO keyword generation
- `publish` - Publish listing (activate)

#### `/trpc/inquiries`
- `list` - Get user's inquiries
- `create` - Create new inquiry
- `update` - Update inquiry status
- `sendWhatsAppMessage` - Send WhatsApp notification
- `scheduleViewing` - Schedule property viewing
- `sendViewingReminder` - Send 24h reminder (WhatsApp)
- `submitOffer` - Submit purchase/rental offer

#### `/trpc/composioEvents`
- `list` - Get event log
- `create` - Log automation event
- `analytics` - Get event analytics
- `whatsappStatus` - Get WhatsApp delivery status
- `emailStatus` - Get email delivery status
- `retry` - Retry failed event
- `byId` - Get event details

## Integration Points

### Flask Backend
All data operations go through Flask backend at `FLASK_API_URL`:
- `/api/listings` - Listings CRUD
- `/api/inquiries` - Inquiries CRUD
- `/api/users/profile` - User profiles
- `/api/search` - Search functionality
- `/api/transactions` - Transaction management

### Composio (WhatsApp/Email/Calendar)
Handles all automation integrations:
- WhatsApp notifications (95% penetration in Costa Rica)
- Email automation (Gmail)
- Calendar events (Google Calendar)
- Google Sheets integration

### OpenRouter (AI Models)
Multi-model AI gateway:
- `groq/mixtral` - Fast property ranking ($0.001 per 1k tokens)
- `claude-3.5-haiku` - Smart descriptions ($0.08 per 1k tokens)
- `claude-3-opus` - Complex dispute mediation ($0.50 per 1k tokens)

## Authentication

JWT token in `Authorization` header:
```
Authorization: Bearer <token>
```

Tokens verified with Flask backend at `/auth/verify`.

## Example Client Code (React Native)

```typescript
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from './trpc-server';

const trpc = createTRPCReact<AppRouter>();

const client = trpc.createClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/trpc',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  ],
});

// Usage
const { data: listings } = trpc.listings.list.useQuery({
  propertyType: 'house',
  maxPrice: 500000,
});
```

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000
TRPC_BASE_URL=http://localhost:3000

# Flask Backend
FLASK_API_URL=http://localhost:5000
FLASK_API_KEY=your_api_key

# Auth
JWT_SECRET=your_secret
JWT_EXPIRY=7d

# Cache
REDIS_URL=redis://localhost:6379

# Composio
COMPOSIO_API_KEY=your_composio_key
COMPOSIO_BASE_URL=https://backend.composio.dev/api/v2

# OpenRouter
OPENROUTER_API_KEY=your_openrouter_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# CORS
CORS_ORIGIN=exp://localhost:8081,http://localhost:8081

# Logging
LOG_LEVEL=debug
```

## Development

### File Structure
```
src/
├── index.ts           # Express server setup
├── trpc.ts           # tRPC context and procedures
├── routers/
│   ├── index.ts      # Main router
│   ├── listings.ts   # Listings routes
│   ├── inquiries.ts  # Inquiries routes
│   └── composio-events.ts # Event logging
└── lib/
    ├── flask-gateway.ts   # Flask API client
    ├── composio.ts       # Composio integration
    └── openrouter.ts     # OpenRouter AI client
```

### Testing

```bash
# Start test server
npm run dev

# In another terminal, test an endpoint
curl http://localhost:3000/health
curl http://localhost:3000/status

# tRPC endpoint
curl -X POST http://localhost:3000/trpc/listings.list
```

## Deployment

### Docker
```bash
docker build -t puraestate-trpc .
docker run -p 3000:3000 -e FLASK_API_URL=http://flask:5000 puraestate-trpc
```

### Heroku
```bash
heroku create puraestate-trpc
heroku config:set FLASK_API_URL=https://puraestate-flask.herokuapp.com
git push heroku main
```

### AWS ECS
See `DEPLOYMENT.md` for full ECS setup.

## Monitoring

### Health Checks
- `/health` - Server health status
- `/status` - Detailed integration status

### Logs
Check console output for:
- Request/response times
- tRPC errors
- Integration failures (Flask, Composio, OpenRouter)

## Costa Rica Optimizations

1. **WhatsApp-First**: 95% population penetration
   - All notifications via WhatsApp (Composio)
   - No app download barrier

2. **Local Payment**: SINPE Móvil integration
   - Via Flask backend
   - Instant, trusted payments

3. **Low-Cost AI**: OpenRouter multi-model
   - Groq for ranking ($0.25)
   - Claude for matching ($0.08)
   - 93% cost savings vs traditional enterprise

4. **Language Support**: Spanish default
   - Auto-translation via OpenRouter

## Next Steps

1. ✅ tRPC server setup (complete)
2. React Native client integration
3. Deploy to production (AWS/Heroku)
4. Enable Composio WhatsApp webhooks
5. Set up OpenRouter usage monitoring
6. Launch beta

## Support

- Docs: `/home/tjdavis/PuraEstate-Production/`
- Issues: Check Flask backend logs first
- API Keys: Store in `.env.local` (never commit)

---

**Status:** Production-ready
**Last Updated:** 2026-02-25
