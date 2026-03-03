# Quick Start Guide - PuraEstate Admin Dashboard

Get up and running in 5 minutes!

## Prerequisites

- Node.js 16 or higher
- npm or yarn
- Git

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-repo/puraestate-admin-dashboard.git
cd puraestate-admin-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

```bash
# Copy example file
cp .env.example .env.local

# Edit .env.local with your credentials
nano .env.local  # or use your preferred editor
```

### 4. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project: `puraestate-admin`
3. Enable Firestore Database
4. Enable Authentication (Email/Password)
5. Create Storage Bucket
6. Go to Project Settings → Service Accounts
7. Copy credentials to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
```

### 5. Configure Stripe (Optional)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your test keys
3. Add to `.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
```

### 6. Run Development Server

```bash
npm run dev
```

### 7. Open in Browser

```
http://localhost:3000
```

## Demo Login Credentials

```
Email: admin@puraestate.com
Password: password123
```

## File Structure

```
puraestate-admin-dashboard/
├── components/       # React components
├── pages/           # Next.js pages and API routes
├── lib/             # Utilities and configurations
├── hooks/           # Custom React hooks
├── stores/          # Zustand state management
├── types/           # TypeScript types
├── styles/          # CSS files
└── public/          # Static files
```

## Project Pages

Navigate to these URLs after login:

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/dashboard` | Overview and metrics |
| Properties | `/properties` | Manage properties |
| Create Property | `/properties/create` | Add new property |
| Users | `/users` | Manage users |
| Agents | `/agents` | Manage agents |
| Bookings | `/bookings` | Manage bookings |
| Payments | `/payments` | Payment management |
| Messages | `/messages` | Message management |
| Analytics | `/analytics` | Reports and analytics |
| Settings | `/settings` | System settings |

## Available Commands

```bash
# Development
npm run dev          # Start dev server on port 3000

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format with Prettier (if configured)

# Deployment
npm run export       # Export static HTML (if needed)
```

## Features Overview

### Dashboard
- Real-time metrics
- Monthly revenue chart
- Property distribution pie chart
- Recent activity feed

### Properties
- List all properties
- Create new properties
- Edit property details
- Delete properties
- View property details in modal

### Users
- User directory
- User profiles
- Deactivate users
- View user details

### Agents
- Agent listing
- Agent performance metrics
- Rating system
- Verify agents

### Bookings
- Booking list
- Update booking status
- Cancel bookings
- View booking details

### Payments
- Transaction history
- Revenue summary
- Process refunds
- View transaction details

### Messages
- Message list by channel
- Send messages
- View message details
- Filter by channel (WhatsApp, Email, In-app)

### Analytics
- User growth metrics
- Property performance
- Revenue breakdown
- Agent performance rankings
- Generate and export reports

### Settings
- General configuration
- Email (SMTP) settings
- Payment (Stripe) settings
- Security settings

## Database Setup (Firebase Firestore)

### Create Collections

```javascript
// Run these queries in Firebase Console

// 1. Users collection
db.collection("users").doc("user1").set({
  email: "user@example.com",
  name: "John Doe",
  role: "buyer",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// 2. Properties collection
db.collection("properties").doc("prop1").set({
  title: "Sample Property",
  price: 250000,
  status: "available",
  // ... other fields
});

// 3. Bookings collection
db.collection("bookings").doc("booking1").set({
  propertyId: "prop1",
  userId: "user1",
  status: "pending",
  // ... other fields
});
```

## Troubleshooting

### Port 3000 Already in Use
```bash
# Use different port
npm run dev -- -p 3001

# Or kill process on port 3000 (Linux/Mac)
lsof -ti:3000 | xargs kill -9
```

### Firebase Authentication Error
- Check `.env.local` credentials
- Verify Firebase project exists
- Ensure Firestore is enabled
- Check internet connection

### Build Error
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

### Module Not Found Error
```bash
# Reinstall dependencies
npm install

# Clear Next.js cache
rm -rf .next
npm run dev
```

## Next Steps

1. **Read Documentation**
   - See `README.md` for detailed info
   - See `API_DOCUMENTATION.md` for API reference
   - See `DEPLOYMENT.md` for deployment guide

2. **Customize**
   - Update colors in `tailwind.config.js`
   - Modify API endpoints in `pages/api/`
   - Add your logo to `public/`

3. **Deploy**
   - Deploy to Vercel (1-click)
   - Deploy to AWS Amplify
   - Deploy to your server with Docker

4. **Connect to Live Data**
   - Update Firebase credentials
   - Configure real Stripe account
   - Setup email service

5. **Test Features**
   - Create sample data
   - Test all pages
   - Test API endpoints
   - Verify authentication

## Useful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Development Tips

### Add New Page
```bash
# Create new file in pages/
touch pages/new-feature.tsx

# Add to sidebar navigation in components/Layout/Sidebar.tsx
```

### Add New Component
```bash
# Create new file in components/
touch components/YourComponent.tsx

# Export and use in pages
```

### Add New API Endpoint
```bash
# Create new file in pages/api/
touch pages/api/your-endpoint.ts

# Define handler function
```

### State Management
```typescript
// Use Zustand for global state
import { create } from 'zustand';

const useStore = create((set) => ({
  // state
  // actions
}));
```

## Performance Tips

1. **Lazy Load Routes** - Use dynamic imports
2. **Optimize Images** - Use next/image
3. **Minimize Bundle** - Remove unused packages
4. **Cache API Calls** - Implement caching strategy
5. **Database Indexing** - Create Firestore indexes

## Security Tips

1. **Never commit .env.local** - Already in .gitignore
2. **Use HTTPS in production** - Most platforms auto-enable
3. **Validate user input** - Check all form inputs
4. **Sanitize output** - React does this by default
5. **Rotate API keys** - Do this regularly
6. **Use environment variables** - Never hardcode secrets

## Deployment Checklist

- [ ] Update environment variables
- [ ] Build project: `npm run build`
- [ ] Test build: `npm start`
- [ ] Check for console errors
- [ ] Test all features
- [ ] Verify database connection
- [ ] Test payment processing
- [ ] Setup monitoring
- [ ] Configure backups
- [ ] Deploy!

## Support

- **Issues**: Check GitHub issues
- **Documentation**: See README.md
- **API Reference**: See API_DOCUMENTATION.md
- **Deployment**: See DEPLOYMENT.md
- **Email**: support@puraestate.com

---

**You're all set! Happy coding!** 🚀

Questions? Check the documentation or open an issue on GitHub.
