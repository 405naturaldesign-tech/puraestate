# PuraEstate Production Deployment - Quick Start Guide

## 5-Minute Setup

### Step 1: Copy Configuration Files
```bash
# Copy all generated configs to project root
cd /path/to/pura-estate
cp /home/tjdavis/puraEstate_config_* ./

# Rename files (remove prefix)
for file in puraEstate_config_*; do
  mv "$file" "${file#puraEstate_config_}"
done
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Setup Environment Variables
```bash
# Copy production template
cp .env.example .env.production

# Edit with real credentials
nano .env.production
```

**Required Credentials to Update:**
- EXPO_PUBLIC_FIREBASE_API_KEY
- EXPO_PUBLIC_FIREBASE_APP_ID
- EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
- EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
- SENTRY_DSN
- And all other ${VARIABLE} placeholders

### Step 4: Test Build
```bash
# Lint
npm run lint

# Type check
npm run type-check

# Run tests
npm run test

# Build preview
npm run build:web
```

### Step 5: Deploy

#### Option A: EAS (Recommended)
```bash
# iOS
eas build --platform ios --profile production
eas submit --platform ios

# Android
eas build --platform android --profile production
eas submit --platform android
```

#### Option B: GitHub Actions
```bash
# Commit and push
git add .
git commit -m "Configure production deployment"
git push origin main

# CI/CD pipeline runs automatically
# Check Actions tab for progress
```

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing: `npm run test`
- [ ] No lint errors: `npm run lint`
- [ ] TypeScript compiles: `npm run type-check`
- [ ] No console.log in production code

### Configuration
- [ ] .env.production filled with real values
- [ ] Firebase project created and configured
- [ ] Stripe account linked
- [ ] Google Maps API enabled
- [ ] Sentry project created

### iOS (App Store)
- [ ] Apple Developer account active
- [ ] App Store Connect app created
- [ ] Certificates and provisioning profiles setup
- [ ] App Icons (1024x1024)
- [ ] Screenshots for App Store
- [ ] Privacy Policy URL ready
- [ ] Build number incremented

### Android (Google Play)
- [ ] Google Play Developer account active
- [ ] Google Play app created
- [ ] Upload key generated
- [ ] App Icons (512x512)
- [ ] Screenshots for Play Store
- [ ] Privacy Policy URL ready
- [ ] Version code incremented

### Firebase
- [ ] Firestore security rules deployed
- [ ] Storage rules configured
- [ ] Authentication providers enabled
- [ ] Hosting configured
- [ ] Functions deployed

### API Backend
- [ ] API endpoints verified
- [ ] CORS configured
- [ ] Database migrations run
- [ ] Environment variables set
- [ ] SSL certificates valid

---

## Build Commands Reference

### Development
```bash
npm start                    # Start development
npm run android            # Run on Android
npm run ios                # Run on iOS
npm run web                # Run on web
npm run test               # Run tests
npm run test:watch         # Watch mode
```

### Production
```bash
npm run build              # Build for all platforms (EAS)
npm run build:ios          # Build iOS only (EAS)
npm run build:android      # Build Android only (EAS)
npm run submit:ios         # Submit iOS to App Store
npm run submit:android     # Submit Android to Play Store
npm run build:web          # Export web build
```

### Code Quality
```bash
npm run lint               # ESLint check
npm run lint:fix           # Fix ESLint issues
npm run type-check         # TypeScript check
npm run format             # Prettier format
npm run format:check       # Check formatting
```

---

## Key Configuration Files

| File | Purpose | Location |
|------|---------|----------|
| package.json | Dependencies & scripts | Root |
| app.json | Expo app config | Root |
| eas.json | EAS build config | Root |
| tsconfig.json | TypeScript config | Root |
| babel.config.js | Babel transpiling | Root |
| .eslintrc.json | Linting rules | Root |
| jest.config.js | Testing config | Root |
| firebase.json | Firebase hosting | Root |
| .env.production | Production secrets | Root |
| android/build.gradle | Android build | android/ |
| Podfile | iOS dependencies | ios/ |
| Dockerfile | API container | Root |

---

## Environment Variables Quick Reference

### Firebase (Required)
```
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
```

### Payment (Required)
```
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
```

### Maps (Required)
```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
```

### Analytics (Optional)
```
EXPO_PUBLIC_AMPLITUDE_KEY
EXPO_PUBLIC_SEGMENT_KEY
```

### Error Tracking (Recommended)
```
SENTRY_DSN
```

---

## CI/CD Pipeline Setup

### GitHub Actions Workflow
1. Push code to `main` branch
2. Automatic lint and test
3. Build iOS and Android
4. Submit to app stores
5. Deploy backend

**Monitor progress:**
```bash
# View in GitHub UI
https://github.com/yourusername/pura-estate/actions

# Or check locally
git log --oneline
```

---

## Troubleshooting

### Build Fails
```bash
# Clear caches
rm -rf node_modules dist build .expo .metro-cache
npm install

# Try again
npm run build
```

### Firebase Errors
```bash
# Verify credentials
cat .env.production | grep FIREBASE

# Test connection
npm run test -- firebase

# Check Firebase Console for errors
```

### App Store Submission Issues
```bash
# View submission logs
eas submit --platform ios --latest

# Check Apple Connect
# Review build status and errors
```

### EAS Build Problems
```bash
# Check credentials
eas credentials

# View build logs
eas build --latest --status

# Clear cache
eas build --platform ios --clear-cache
```

---

## Performance Optimization Tips

### Bundle Size
```bash
# Analyze bundle
npm run build:web -- --analyze

# Remove unused dependencies
npm prune --production
```

### Runtime Performance
- Enable Hermes engine (configured)
- Use React.memo for components
- Optimize image loading
- Enable code splitting

### Build Time
- Use faster NDK version
- Enable parallel Gradle builds (configured)
- Cache dependencies
- Use EAS build (not local)

---

## Security Reminders

### Never Commit
- .env files with credentials
- Private keys (signing certificates)
- API secrets
- Firebase credentials

### Secure Storage
- Use GitHub Secrets for CI/CD
- Use 1Password or similar for local
- Rotate keys regularly
- Use service accounts with minimal permissions

### Code Security
- Keep dependencies updated
- Run security audit: `npm audit`
- Use rate limiting (configured)
- Validate all inputs
- Use HTTPS everywhere

---

## Monitoring After Deployment

### Analytics
- Monitor daily active users (Firebase)
- Track crash reports (Sentry)
- Monitor API response times
- Check app store reviews

### Errors
- Set up Sentry alerts
- Monitor Firebase functions
- Check API logs
- Review App Store feedback

### Performance
- Monitor app size
- Track screen load times
- Measure battery impact
- Review user retention

---

## Useful Links

- [Expo Dashboard](https://expo.dev)
- [Firebase Console](https://firebase.google.com)
- [EAS Status](https://eas.expo.dev)
- [GitHub Actions](https://github.com/yourusername/pura-estate/actions)
- [Apple Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
- [Sentry Dashboard](https://sentry.io)

---

## Contact & Support

For issues or questions:
1. Check documentation links above
2. Review GitHub Issues
3. Check Discord communities
4. Contact Anthropic support for SDK issues

---

**Last Updated:** 2026-02-24
**Status:** Ready for Production Deployment
