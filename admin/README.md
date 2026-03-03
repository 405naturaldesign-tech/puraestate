# PuraEstate Admin Dashboard

Complete, production-ready admin dashboard for PuraEstate management system.

## Features

### 1. Dashboard (Overview)
- Real-time metrics: Total properties, users, bookings, revenue
- Monthly booking and revenue analytics
- Interactive charts (Recharts)
- Recent activity feed
- Quick stats cards with trends

### 2. Properties Management
- List all properties with advanced filtering
- Create new properties with full details
- Edit property information
- Delete properties
- Image upload support
- Pricing and availability management
- Property type and status tracking

### 3. Users Management
- Complete user directory
- User profiles with detailed information
- Subscription management
- Role-based access (admin, agent, buyer, seller)
- User activation/deactivation
- Usage analytics per user

### 4. Agents Management
- Agent performance metrics
- Rating and review tracking
- Commission tracking and calculation
- License verification and expiry tracking
- Agent verification workflow
- Contact information management
- Property listings per agent

### 5. Bookings Management
- View all bookings with pagination
- Update booking status (pending, confirmed, completed, cancelled)
- Cancel bookings with confirmation
- Generate booking reports
- Track agent commission per booking
- Date-based filtering

### 6. Payments & Transactions
- Complete transaction history
- Payment reconciliation
- Stripe integration
- Multiple payment method support
- Refund processing
- Revenue reporting
- Commission distribution tracking

### 7. Messages & WhatsApp
- View all messages across channels
- WhatsApp, Email, and In-app messaging
- Message automation monitoring
- Manual message sending
- Message templates support
- Message status tracking (sent, delivered, read)
- User communication history

### 8. Analytics & Reports
- User growth metrics
- Property performance analytics
- Revenue breakdown by period and source
- Agent performance rankings
- Custom report generation
- Export to PDF, Excel, CSV
- Date range filtering

### 9. Settings
- System configuration
- Email settings (SMTP setup)
- Payment settings (Stripe keys)
- Security settings
- Session management
- Two-factor authentication
- Activity logging
- API key management

## Tech Stack

### Frontend
- **Next.js 14** - React framework with SSR
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **react-hook-form** - Form management
- **Zustand** - State management

### Backend
- **Next.js API Routes** - Backend endpoints
- **Firebase** - Database and authentication
- **Stripe** - Payment processing
- **Firebase Storage** - File uploads

### Infrastructure
- **Node.js** - Runtime
- **npm/yarn** - Package management

## Installation

### Prerequisites
- Node.js 16.x or higher
- npm or yarn
- Firebase project setup
- Stripe account

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/yourrepo/puraestate-admin-dashboard.git
cd puraestate-admin-dashboard
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Environment Setup**
Copy `.env.example` to `.env.local` and configure:
```bash
cp .env.example .env.local
```

4. **Configure environment variables**
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
FIREBASE_ADMIN_SDK_KEY=your_admin_key_json

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

5. **Run development server**
```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000` in your browser.

## Usage

### Login
- Navigate to `/login`
- Use demo credentials:
  - Email: `admin@puraestate.com`
  - Password: `password123`

### Key Routes

```
/login                  - Authentication
/dashboard              - Main dashboard
/properties             - Properties management
/properties/create      - Create new property
/users                  - Users management
/agents                 - Agents management
/bookings               - Bookings management
/payments               - Payments & transactions
/messages               - Messages management
/analytics              - Analytics & reports
/settings               - System settings
```

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login

#### Dashboard
- `GET /api/dashboard/metrics` - Get dashboard metrics

#### Properties
- `GET /api/properties/list` - List properties
- `GET /api/properties/[id]` - Get property details
- `PUT /api/properties/[id]` - Update property
- `DELETE /api/properties/[id]` - Delete property
- `POST /api/properties/create` - Create property

#### Users
- `GET /api/users/list` - List users
- `GET /api/users/[id]` - Get user details
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

#### Agents
- `GET /api/agents/list` - List agents
- `PUT /api/agents/[id]` - Update agent (verify, etc.)

#### Bookings
- `GET /api/bookings/list` - List bookings
- `PUT /api/bookings/[id]` - Update booking status
- `DELETE /api/bookings/[id]` - Cancel booking

#### Payments
- `GET /api/payments/transactions` - List transactions
- `POST /api/payments/[id]/refund` - Process refund

#### Messages
- `GET /api/messages/list` - List messages
- `POST /api/messages/send` - Send message

#### Analytics
- `POST /api/analytics/report` - Generate report

## Project Structure

```
puraestate-admin-dashboard/
├── components/
│   ├── Layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── AdminLayout.tsx
│   ├── Common/
│   │   ├── StatCard.tsx
│   │   ├── DataTable.tsx
│   │   ├── Modal.tsx
│   │   └── Button.tsx
│   └── Charts/
│       ├── RevenueChart.tsx
│       └── PropertyChart.tsx
├── pages/
│   ├── api/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── properties/
│   │   ├── users/
│   │   ├── agents/
│   │   ├── bookings/
│   │   ├── payments/
│   │   ├── messages/
│   │   └── analytics/
│   ├── _app.tsx
│   ├── _document.tsx
│   ├── login.tsx
│   ├── dashboard/
│   ├── properties/
│   ├── users/
│   ├── agents/
│   ├── bookings/
│   ├── payments/
│   ├── messages/
│   ├── analytics/
│   └── settings/
├── lib/
│   ├── api.ts
│   ├── firebase.ts
│   └── stripe.ts
├── hooks/
│   └── useAuth.ts
├── stores/
│   ├── authStore.ts
│   └── dashboardStore.ts
├── types/
│   └── index.ts
├── styles/
│   └── globals.css
└── public/
```

## Database Schema (Firebase Firestore)

### Collections

**users**
```typescript
{
  id: string,
  email: string,
  name: string,
  phone?: string,
  role: 'admin' | 'agent' | 'buyer' | 'seller',
  subscription?: SubscriptionPlan,
  createdAt: timestamp,
  updatedAt: timestamp,
  isActive: boolean,
  avatar?: string,
}
```

**properties**
```typescript
{
  id: string,
  title: string,
  description: string,
  location: { address, city, state, country, coordinates },
  propertyType: 'apartment' | 'house' | 'villa' | 'commercial' | 'land',
  bedrooms: number,
  bathrooms: number,
  squareFeet: number,
  amenities: string[],
  images: string[],
  price: number,
  currency: string,
  agent: { id, name, email },
  status: 'available' | 'sold' | 'rented' | 'pending',
  views: number,
  favorites: number,
  verified: boolean,
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

**bookings**
```typescript
{
  id: string,
  propertyId: string,
  userId: string,
  agentId: string,
  startDate: timestamp,
  endDate: timestamp,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
  totalPrice: number,
  commission: number,
  notes?: string,
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

**transactions**
```typescript
{
  id: string,
  bookingId?: string,
  userId: string,
  amount: number,
  currency: string,
  status: 'pending' | 'completed' | 'failed' | 'refunded',
  type: 'booking' | 'subscription' | 'commission',
  paymentMethod: 'stripe' | 'bank_transfer' | 'cash',
  stripeTransactionId?: string,
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

**agents**
```typescript
{
  id: string,
  user: User,
  license: string,
  licenseExpiry: timestamp,
  agency?: string,
  specialization: string[],
  rating: number,
  reviewCount: number,
  totalBookings: number,
  totalCommission: number,
  properties: string[],
  verified: boolean,
  bankDetails: { accountHolder, accountNumber, bankName, routingNumber },
}
```

**messages**
```typescript
{
  id: string,
  senderId: string,
  recipientId: string,
  content: string,
  type: 'text' | 'image' | 'document',
  channel: 'whatsapp' | 'email' | 'in-app',
  status: 'sent' | 'delivered' | 'read',
  metadata?: Record<string, any>,
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

## Authentication

The dashboard uses Firebase Authentication with role-based access control:

- **Admin**: Full access to all features
- **Agent**: Access to agent dashboard and performance metrics
- **User**: Limited access to own profile and bookings

## Security Features

- Firebase Authentication (email/password)
- JWT token-based authorization
- Protected API routes with middleware
- Environment variable secrets
- HTTPS enforced in production
- SQL injection prevention with Firebase
- XSS protection with React
- CSRF protection with Next.js
- Rate limiting recommended
- Two-factor authentication support

## Performance Optimization

- Next.js automatic code splitting
- Image optimization with next/image
- CSS-in-JS with Tailwind CSS
- Zustand for lightweight state management
- React Query for data caching (recommended addition)
- Lazy loading for modals and charts
- Pagination for large datasets

## Build & Deployment

### Build
```bash
npm run build
```

### Production
```bash
npm start
```

### Deployment Options
- **Vercel** (Recommended for Next.js)
- **AWS Amplify**
- **Google Cloud Run**
- **Digital Ocean**
- **Heroku**

### Example: Vercel Deployment
```bash
npm install -g vercel
vercel
```

## Testing

```bash
npm run test
```

(Add jest and testing-library as dev dependencies)

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT

## Support

For support, email support@puraestate.com or open an issue on GitHub.

## Roadmap

- [ ] Advanced analytics dashboard
- [ ] AI-powered property recommendations
- [ ] Mobile app for agents
- [ ] Live chat support
- [ ] Document management
- [ ] Virtual property tours
- [ ] Advanced reporting and BI integration
- [ ] Multi-language support
- [ ] Dark mode support

## Version History

### v1.0.0 (2024)
- Initial release
- Complete admin dashboard
- All core features implemented
- Production-ready code
