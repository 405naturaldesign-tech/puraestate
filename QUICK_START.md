# PuraEstate - Quick Start Guide (5 Minutes)

Get PuraEstate running on your local machine in under 5 minutes.

---

## Prerequisites

Ensure you have the following installed:

```bash
node --version    # >= 18.17.0
npm --version     # >= 9.0.0
```

If you do not have Node.js installed:
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

---

## Step 1: Install Dependencies (1 minute)

```bash
cd /home/tjdavis/PuraEstate-Production
npm install
```

---

## Step 2: Configure Environment (2 minutes)

```bash
cp .env.example .env
```

Edit `.env` and fill in the minimum required keys:

```env
# Firebase (required for auth and data)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# OpenRouter AI (required for property matching)
OPENROUTER_API_KEY=your_openrouter_key

# Optional for development - can be added later
# COMPOSIO_API_KEY=your_composio_key
# STRIPE_PUBLISHABLE_KEY=your_stripe_key
# SENTRY_DSN=your_sentry_dsn
```

### Where to Get Keys

| Service | URL | Free Tier |
|---------|-----|-----------|
| Firebase | https://console.firebase.google.com | Yes (Spark plan) |
| OpenRouter | https://openrouter.ai/keys | Yes ($1 free credit) |
| Composio | https://app.composio.dev | Yes (free plan) |
| Stripe | https://dashboard.stripe.com/apikeys | Yes (test mode) |
| Sentry | https://sentry.io | Yes (5K events/month) |

---

## Step 3: Start the App (1 minute)

```bash
# Start Expo development server
npm run dev
```

This will open the Expo development tools. You can then:

- **Android**: Scan the QR code with the Expo Go app
- **iOS**: Scan the QR code with the Camera app
- **Web**: Press `w` to open in browser
- **Android Emulator**: Press `a` (requires Android Studio)
- **iOS Simulator**: Press `i` (requires Xcode, macOS only)

---

## Step 4: Verify It Works (1 minute)

1. The app should show the splash screen, then the auth screen
2. Create a test account with email/password
3. Browse the home screen with property listings
4. Try the property search with filters
5. Open an investment tool (e.g., ROI Calculator)

---

## Running Other Services

### Admin Dashboard
```bash
cd admin
npm install
npm run dev
# Opens at http://localhost:3000
```

### AI Matching Service (standalone)
```bash
cd ai/matching
npm install
npm run dev
```

### Composio WhatsApp Automation
```bash
cd automation/composio
npm install
npm run dev
# Requires Redis: docker run -d -p 6379:6379 redis
```

### Full Docker Stack (all services)
```bash
cd docker
docker-compose up -d
# Backend API: http://localhost:5000
# Frontend: http://localhost:3000
# Admin: http://localhost:3001
# Redis: localhost:6379
# PostgreSQL: localhost:5432
```

---

## Running Tests

```bash
# All tests
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# Only unit tests
npm run test:unit

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## Building for Production

### Android (APK for testing)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build development APK
eas build --platform android --profile development
```

### Android (AAB for Play Store)
```bash
eas build --platform android --profile production
```

---

## Common Issues

### "Module not found" errors
```bash
# Clear caches and reinstall
rm -rf node_modules
npm install
npx expo start --clear
```

### Metro bundler port conflict
```bash
# Kill existing Metro process
lsof -ti:8081 | xargs kill -9
npm run dev
```

### Firebase connection errors
- Verify your Firebase project is active
- Check that `google-services.json` is in the project root
- Ensure Firebase Auth is enabled in the console

### Build failures
```bash
# Clean prebuild
npx expo prebuild --clean
# Retry build
eas build --platform android --profile development
```

---

## Project Structure at a Glance

```
src/
  app/App.tsx           -- Main app entry point
  screens/              -- 5 main screens (Home, Auth, Search, Detail, Account)
  components/common/    -- 6 reusable UI components
  components/tools/     -- 10 investment calculator tools
  navigation/           -- Auth + Main navigators
  redux/                -- State management (auth, properties, filters)
  services/             -- API and Firebase service layers
  styles/               -- Theme, colors, typography, spacing
  types/                -- TypeScript interfaces
  utils/                -- Helpers, validation, constants, logger
```

---

## Next Steps

1. Read [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) to understand the full codebase
2. Read [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for system design
3. Read [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) when ready to deploy
4. Read [docs/DEVELOPMENT_STANDARDS.md](./docs/DEVELOPMENT_STANDARDS.md) for coding conventions

---

**Total setup time**: Under 5 minutes
**Questions?** Check `docs/` for comprehensive documentation.
