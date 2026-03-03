# PuraEstate - Google Play Store Launch Checklist

Complete step-by-step checklist for submitting PuraEstate to the Google Play Store.

---

## Phase 1: Pre-Build Preparation

### 1.1 Google Play Console Setup
- [ ] Create Google Play Developer account ($25 one-time fee)
- [ ] Complete identity verification (can take 2-5 business days)
- [ ] Set up Google Play Console at https://play.google.com/console
- [ ] Create new application: "PuraEstate - Costa Rica Real Estate"
- [ ] Select "App" (not Game)
- [ ] Select default language: English (US)
- [ ] Set app category: Lifestyle > Real Estate

### 1.2 API Keys and Services
- [ ] Firebase project configured (Auth, Firestore, Storage, Messaging)
- [ ] OpenRouter API key active with billing
- [ ] Composio API key configured for WhatsApp
- [ ] Stripe account verified and keys set
- [ ] Sentry DSN configured for error tracking
- [ ] All keys in `.env.production` (NOT committed to git)
- [ ] Google Services JSON (`google-services.json`) downloaded from Firebase Console

### 1.3 App Signing
- [ ] Generate upload keystore:
  ```bash
  keytool -genkeypair -v -storetype JKS -keyalg RSA -keysize 2048 \
    -validity 10000 -storepass YOUR_PASSWORD \
    -keypass YOUR_PASSWORD -alias pura-estate \
    -keystore pura-estate-upload.jks \
    -dname "CN=PuraEstate,OU=Development,O=PuraEstate,L=San Jose,ST=SJ,C=CR"
  ```
- [ ] Enroll in Google Play App Signing (recommended)
- [ ] Store keystore securely (NOT in git)
- [ ] Add keystore password to EAS secrets or CI/CD secrets

---

## Phase 2: App Configuration

### 2.1 app.json Verification
- [ ] `expo.name` = "PuraEstate"
- [ ] `expo.slug` = "pura-estate"
- [ ] `expo.version` = "1.0.0"
- [ ] `android.package` = "com.pura.estate"
- [ ] `android.versionCode` = 1
- [ ] `android.adaptiveIcon` configured with correct paths
- [ ] `android.permissions` includes all required permissions
- [ ] `android.googleServicesFile` points to `./google-services.json`
- [ ] Deep linking configured for `puraestee.app`

### 2.2 eas.json Verification
- [ ] Production build profile configured
- [ ] `android.gradleCommand` = ":app:bundleRelease"
- [ ] `android.buildType` = "apk" (or "aab" for Play Store)
- [ ] Submit profile with service account JSON
- [ ] `track` = "production" for production submit

### 2.3 Environment Variables
- [ ] `.env.production` has all production API keys
- [ ] No development/staging keys in production config
- [ ] API base URL points to production server
- [ ] Firebase config points to production project

---

## Phase 3: Build

### 3.1 Pre-Build Checks
- [ ] Run all tests: `npm test` (all passing)
- [ ] Run type check: `npm run type-check` (no errors)
- [ ] Run linter: `npm run lint` (no errors)
- [ ] Test on physical Android device via Expo Go
- [ ] Verify all screens load correctly
- [ ] Verify Firebase authentication works
- [ ] Verify property search and display works
- [ ] Verify payment flow works (test mode)

### 3.2 Build Production APK/AAB
```bash
# Using EAS Build
eas build --platform android --profile production

# Or build locally
npx expo prebuild --clean
cd android && ./gradlew bundleRelease
```
- [ ] Build completes without errors
- [ ] APK/AAB file generated successfully
- [ ] AAB size is under 150MB
- [ ] Test the production build on a physical device

### 3.3 Post-Build Verification
- [ ] Install production build on test device
- [ ] Verify app opens and splash screen displays
- [ ] Verify sign-up/login flow works
- [ ] Verify property listings load
- [ ] Verify AI matching returns results
- [ ] Verify push notifications arrive
- [ ] Verify deep links work
- [ ] Verify crash-free startup

---

## Phase 4: Store Listing

### 4.1 App Information
- [ ] **App name**: PuraEstate - Costa Rica Real Estate (max 30 chars)
- [ ] **Short description**: Discover premium Costa Rica properties with AI-powered matching (max 80 chars)
- [ ] **Full description**: Complete with features, benefits, and call-to-action (max 4000 chars)
- [ ] **App category**: Lifestyle
- [ ] **Tags**: real estate, costa rica, property investment, AI matching
- [ ] **Contact email**: support@puraestate.com
- [ ] **Contact website**: https://puraestate.com
- [ ] **Privacy policy URL**: https://puraestate.com/privacy

### 4.2 Graphics and Screenshots
- [ ] **App icon**: 512x512 PNG, 32-bit, no alpha
- [ ] **Feature graphic**: 1024x500 PNG or JPEG
- [ ] **Phone screenshots**: Min 2, max 8 (16:9 or 9:16)
  - [ ] Home screen with property listings
  - [ ] Property detail view
  - [ ] AI matching results
  - [ ] Search/filter interface
  - [ ] Account/profile screen
  - [ ] Investment tools screen
- [ ] **Tablet screenshots**: Optional but recommended (min 2)
- [ ] All screenshots are actual app content (no mockups)

### 4.3 Content Rating
- [ ] Complete IARC content rating questionnaire
- [ ] Expected rating: Everyone (no violent/adult content)
- [ ] No user-generated content requiring moderation flags

### 4.4 Privacy and Data Safety
- [ ] **Data collection declaration**:
  - [ ] Personal info (name, email, phone) - Required for account
  - [ ] Location data - Used for nearby property search
  - [ ] Financial info - Stripe payment processing
  - [ ] Photos - Property image uploads
- [ ] **Data sharing**: Not shared with third parties (except payment processor)
- [ ] **Data security**: Encrypted in transit (HTTPS) and at rest
- [ ] **Data deletion**: Users can request account deletion
- [ ] Privacy policy covers all data practices

---

## Phase 5: Compliance

### 5.1 Google Play Policies
- [ ] App does not contain prohibited content
- [ ] App does not use deceptive practices
- [ ] Intellectual property rights are clear
- [ ] App follows advertising policies (if ads are included)
- [ ] Financial features comply with local regulations

### 5.2 Costa Rica Specific
- [ ] Real estate listings comply with local laws
- [ ] Currency display in USD and CRC (Costa Rican Colon)
- [ ] Property data sourced from legitimate providers
- [ ] No unlicensed real estate advice

### 5.3 Required Documents
- [ ] Privacy Policy (hosted at puraestate.com/privacy)
- [ ] Terms of Service (hosted at puraestate.com/terms)
- [ ] GDPR compliance documentation (for EU users)
- [ ] Data Processing Agreement (if applicable)

---

## Phase 6: Submission

### 6.1 Upload Build
```bash
# Via EAS Submit
eas submit --platform android --profile production-android

# Or manually upload AAB via Play Console
```
- [ ] Upload AAB to production track (or internal testing first)
- [ ] Select countries for distribution (start with US, CR, CA, UK, DE)
- [ ] Set pricing: Free (with in-app purchases)

### 6.2 Release Configuration
- [ ] Select "Full rollout" or "Staged rollout" (10% recommended for first release)
- [ ] Add release notes:
  ```
  PuraEstate 1.0.0 - Launch Release
  - AI-powered property matching for Costa Rica
  - Browse premium real estate listings
  - Investment calculator tools
  - WhatsApp agent communication
  - Secure payment processing
  ```
- [ ] Review and submit for review

### 6.3 Post-Submission
- [ ] Monitor review status (typically 1-7 days for new apps)
- [ ] Respond promptly to any reviewer questions
- [ ] If rejected, review feedback and resubmit
- [ ] Set up Google Play Console alerts for review updates

---

## Phase 7: Post-Launch

### 7.1 Monitoring
- [ ] Sentry error tracking active and monitored
- [ ] Firebase Analytics dashboard reviewed daily
- [ ] Google Play Console crash reports monitored
- [ ] ANR (Application Not Responding) rate < 0.47%
- [ ] Crash rate < 1.09%

### 7.2 User Feedback
- [ ] Monitor Play Store reviews daily
- [ ] Respond to all 1-2 star reviews within 24 hours
- [ ] Create feedback loop for feature requests
- [ ] Set up in-app feedback mechanism

### 7.3 Performance
- [ ] App startup time < 3 seconds
- [ ] Property search results in < 2 seconds
- [ ] AI matching completes in < 5 seconds
- [ ] No memory leaks on extended usage

### 7.4 Marketing Launch
- [ ] See `assets/marketing/` for complete campaign materials
- [ ] Press release distributed
- [ ] Social media campaign launched
- [ ] Email campaign to waitlist
- [ ] Influencer outreach initiated

---

## Emergency Procedures

### If App is Rejected
1. Read the rejection reason carefully in Play Console
2. Common reasons: privacy policy issues, misleading content, permission justification
3. Fix the identified issues
4. Increment `versionCode` in `app.json`
5. Rebuild and resubmit
6. Add detailed notes in the review appeal

### If Critical Bug Found Post-Launch
1. Create hotfix branch
2. Fix the issue
3. Increment patch version (1.0.0 -> 1.0.1)
4. Increment `versionCode`
5. Build and submit expedited review
6. Use staged rollout to limit impact

### Rollback Procedure
1. In Play Console, halt the current rollout
2. Upload the previous known-good AAB
3. Set staged rollout to 100%
4. Notify affected users via push notification

---

## Timeline

| Day | Task |
|-----|------|
| Day 1 | Complete Phase 1 (account setup, API keys) |
| Day 2 | Complete Phase 2 (app configuration) |
| Day 3 | Complete Phase 3 (build and test) |
| Day 4 | Complete Phase 4 (store listing, screenshots) |
| Day 5 | Complete Phase 5 (compliance review) |
| Day 6 | Submit to Google Play (Phase 6) |
| Day 7-13 | Review period (monitor for feedback) |
| Day 14 | Expected go-live + Phase 7 monitoring |

---

**Status**: Ready for execution
**Estimated time to submission**: 5-6 working days
**Estimated review time**: 1-7 days (new apps)
**Target launch date**: Configure based on your timeline
