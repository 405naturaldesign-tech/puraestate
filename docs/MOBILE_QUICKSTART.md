# Puraestate Mobile App - Development Quickstart Guide

**Version:** 1.0
**Date:** 2026-02-24
**Target Audience:** Development Team

---

## Quick Reference

### Document Overview

This quickstart ties together the complete Puraestate mobile app specification. For detailed information, refer to:

1. **Main Specification** (`puraestate-mobile-app-spec.md`) - Complete feature and architecture documentation
2. **AI Integration Guide** (`puraestate-ai-integration-guide.md`) - OpenRouter and Composio implementation details
3. **Design System** (`puraestate-design-system.md`) - Components, tokens, and UI patterns

### Project Structure
```
puraestate-mobile/
├── src/
│   ├── screens/          # Screen components (organized by feature)
│   ├── components/       # Reusable UI components
│   ├── services/         # Business logic and API integration
│   ├── redux/           # State management
│   ├── navigation/      # Navigation configuration
│   ├── tokens/          # Design tokens
│   ├── utils/           # Utility functions
│   ├── hooks/           # Custom React hooks
│   └── types/           # TypeScript definitions
├── assets/              # Images, fonts, icons
├── android/             # Android native code
├── ios/                 # iOS native code
└── app.json            # Expo configuration
```

---

## Phase 1: Setup (Week 1)

### Environment Setup

```bash
# Install Node.js v18+
node --version  # Should be v18 or higher

# Install Expo CLI
npm install -g expo-cli

# Create new React Native project
npx create-expo-app puraestate-mobile
cd puraestate-mobile

# Install essential dependencies
npm install react-native-paper @react-navigation/native @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context react-native-gesture-handler
npm install @reduxjs/toolkit react-redux axios
npm install react-native-secure-storage react-native-sqlite-storage
npm install react-native-vector-icons
npm install --save-dev typescript @types/react-native
```

### Initialize TypeScript

```bash
# Generate tsconfig.json
npx tsc --init

# Create src/ directory
mkdir src
mkdir src/{screens,components,services,redux,navigation,tokens,utils,hooks,types}
```

### Environment Variables

```bash
# Create .env file
cat > .env << 'EOF'
API_BASE_URL=https://api.puraestate.com
WS_BASE_URL=wss://ws.puraestate.com

# OpenRouter
OPENROUTER_API_KEY=sk_live_xxxxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_PRIMARY_MODEL=gpt-4-turbo-preview
OPENROUTER_FALLBACK_MODEL=claude-3-sonnet

# Composio
COMPOSIO_API_KEY=xxxxx
COMPOSIO_WEBHOOK_SECRET=xxxxx

# Firebase
FIREBASE_PROJECT_ID=puraestate-mobile
FIREBASE_API_KEY=xxxxx
FIREBASE_MESSAGING_SENDER_ID=xxxxx
FIREBASE_APP_ID=xxxxx

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_COMPOSIO_AUTOMATION=true
ENABLE_OFFLINE_MODE=true
EOF
```

---

## Phase 1 Implementation Checklist

### Week 1-2: Authentication & Navigation

- [ ] Setup auth context and Redux store
- [ ] Implement login/signup screens
- [ ] Add biometric authentication (react-native-biometrics)
- [ ] Setup bottom tab navigation
- [ ] Create screen stubs for all main screens
- [ ] Implement safe area handling

**Key Files to Create:**
```typescript
// src/redux/slices/authSlice.ts
// src/services/auth/authService.ts
// src/screens/auth/LoginScreen.tsx
// src/screens/auth/SignupScreen.tsx
// src/navigation/RootNavigator.tsx
// src/navigation/BottomTabNavigator.tsx
```

### Week 3-4: Core Features (Search & Browse)

- [ ] Implement home screen with recommendations
- [ ] Create search screen with filters
- [ ] Build property listing cards
- [ ] Create property detail screen
- [ ] Implement save/favorite functionality
- [ ] Add image carousel with caching

**Key Files to Create:**
```typescript
// src/screens/discover/HomeScreen.tsx
// src/screens/search/SearchScreen.tsx
// src/screens/discover/PropertyDetailScreen.tsx
// src/components/cards/PropertyCard.tsx
// src/services/api/propertyService.ts
// src/redux/slices/propertySlice.ts
```

### Week 5-6: Communication & Bookings

- [ ] Build messages/chat UI
- [ ] Implement message sending
- [ ] Create bookings list and calendar
- [ ] Build schedule viewing modal
- [ ] Setup real-time WebSocket
- [ ] Add notifications infrastructure

**Key Files to Create:**
```typescript
// src/screens/messages/MessagesScreen.tsx
// src/screens/messages/ChatScreen.tsx
// src/screens/bookings/BookingsScreen.tsx
// src/components/modals/ScheduleViewingModal.tsx
// src/services/realtime/websocketService.ts
// src/services/notifications/notificationService.ts
```

### Week 7-8: MVP Polish & Testing

- [ ] Implement error boundaries
- [ ] Add loading states and skeletons
- [ ] Create offline-first sync
- [ ] Performance optimization
- [ ] User testing & iteration
- [ ] Prepare for beta release

---

## Phase 2: AI Features (Weeks 9-14)

### Implementation Order

1. **Smart Property Matching** (Week 9-10)
   - Integrate OpenRouter client
   - Implement matching algorithm
   - Add recommendation caching
   - Create matching UI component

2. **Description Generation** (Week 11)
   - Create description service
   - Add seller/agent dashboard integration
   - Implement edit and save flows

3. **Price Suggestions** (Week 12)
   - Build pricing algorithm
   - Create market data service
   - Implement UI for price recommendation modal

4. **Composio Automation** (Week 13-14)
   - Setup Composio workflows
   - Implement notification handlers
   - Add real-time sync with WebSocket
   - Test all automation triggers

**Critical Integration Points:**

```typescript
// Matching Service Call (Home Screen)
const matches = await propertyMatchingService.findMatches(request);

// Description Generation (Seller Dashboard)
const description = await descriptionGenerator.generateDescription(request);

// Price Suggestions (Pricing Modal)
const pricing = await pricingAdvisor.getSuggestion(request);

// Composio Workflow Trigger (On Price Change)
await priceDropWorkflow.onPropertyPriceChanged(event);
```

---

## Phase 2 Testing Strategy

### AI Feature Tests

```bash
# Test OpenRouter connectivity
npm run test -- services/ai/openrouter.test.ts

# Test matching algorithm
npm run test -- services/ai/propertyMatching.test.ts

# Test price suggestions
npm run test -- services/ai/pricingAdvisor.test.ts

# Integration test with cache
npm run test -- integration/aiFeatures.integration.test.ts
```

### Load Testing

```bash
# Test with 1000 properties
npm run load-test -- scenario.matching.loadTest

# Test API rate limiting
npm run load-test -- scenario.api.rateLimitTest
```

---

## Key Commands Reference

### Development

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run TypeScript compiler in watch mode
npx tsc --watch

# Lint and format code
npm run lint
npm run format

# Run tests
npm test
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Build & Deploy

```bash
# Build for iOS (requires Mac + Xcode)
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android

# Preview build (for testing)
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

---

## Critical Implementation Details

### State Management Pattern

All async operations should follow this pattern:

```typescript
export const fetchProperties = createAsyncThunk(
  'properties/fetchProperties',
  async (filters: SearchFilters, { rejectWithValue }) => {
    try {
      return await api.get('/properties/search', { params: filters });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const propertySlice = createSlice({
  name: 'properties',
  initialState: {
    items: [],
    isLoading: false,
    error: null,
  },
  extraReducers: builder => {
    builder
      .addCase(fetchProperties.pending, state => {
        state.isLoading = true;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});
```

### API Interceptor Pattern

```typescript
// Set up request interceptor for auth
api.interceptors.request.use(async config => {
  const token = await SecureStore.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Set up response interceptor for token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Handle token refresh
      try {
        await AuthService.refreshAccessToken();
        return api(error.config);
      } catch {
        // Redirect to login
        dispatch(logout());
      }
    }
    return Promise.reject(error);
  }
);
```

### Offline-First Sync Pattern

```typescript
// Store locally first
dispatch(addPropertyOffline(property));

// Queue for sync
syncQueue.enqueue({
  action: 'CREATE_PROPERTY',
  payload: property,
  timestamp: Date.now(),
});

// Sync when online
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    syncQueue.sync();
  }
});
```

---

## Performance Optimization Checklist

### Bundle Size
- [ ] Code splitting for screens (lazy loading)
- [ ] Tree-shaking unused imports
- [ ] Image optimization (use Cloudinary transforms)
- [ ] Minification and compression enabled

### Runtime Performance
- [ ] Use FlashList instead of FlatList
- [ ] Implement virtualization for long lists
- [ ] Memoize expensive components
- [ ] Use useMemo and useCallback appropriately

### Memory Management
- [ ] Unsubscribe from WebSocket on unmount
- [ ] Clear image caches periodically
- [ ] Limit Redux state size
- [ ] Clean up timers and intervals

### Network Optimization
- [ ] Cache API responses aggressively
- [ ] Use pagination (not infinite scroll where possible)
- [ ] Batch API requests
- [ ] Compress payloads with gzip

---

## Security Checklist

### Authentication
- [ ] Token stored in SecureStore (not AsyncStorage)
- [ ] Biometric key protection enabled
- [ ] Automatic logout after inactivity
- [ ] Token refresh before expiry

### Data Protection
- [ ] HTTPS enforced for all API calls
- [ ] Sensitive data encrypted at rest
- [ ] No sensitive data in Redux state logging
- [ ] Database encryption enabled

### API Security
- [ ] Rate limiting implemented
- [ ] CSRF protection (if applicable)
- [ ] Input validation on client
- [ ] API key not exposed in client code

### Privacy
- [ ] GDPR compliance implemented
- [ ] User consent for analytics
- [ ] Data deletion on account removal
- [ ] Privacy policy in-app link

---

## Testing Strategy

### Unit Tests (40%)
```bash
npm test -- --testPathPattern="services|utils|hooks"
```

### Component Tests (35%)
```bash
npm test -- --testPathPattern="components|screens"
```

### Integration Tests (20%)
```bash
npm test -- --testPathPattern="integration"
```

### E2E Tests (5%)
```bash
detox test-runner configuration
```

### Target Coverage: 80%+

---

## Monitoring & Debugging

### Firebase Analytics Events

Key events to track:
- `app_launch` - App opens
- `user_login` - User logs in
- `property_view` - User views property
- `property_save` - User saves property
- `booking_created` - Viewing booked
- `offer_submitted` - Offer made
- `ai_matching_used` - Matching viewed
- `error_occurred` - Any error

### Crash Reporting

Integrate Sentry:
```typescript
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
});
```

### Performance Monitoring

Track metrics:
- App startup time (< 2s target)
- Screen transition time (< 500ms target)
- API response time (< 1s target)
- Image load time (< 500ms target)

---

## Common Issues & Solutions

### Issue: Redux state too large
**Solution:** Use Redux persist with selective slices
```typescript
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'userPreferences'], // Only persist necessary slices
};
```

### Issue: WebSocket reconnection failing
**Solution:** Implement exponential backoff
```typescript
const delay = Math.pow(2, reconnectAttempts) * 1000;
setTimeout(() => this.reconnect(), delay);
```

### Issue: Image memory leaks
**Solution:** Clear image cache on app background
```typescript
AppState.addEventListener('change', (state) => {
  if (state === 'background') {
    imageCacheManager.clearCache();
  }
});
```

### Issue: API rate limiting
**Solution:** Implement request queue with delays
```typescript
const queue = [];
const processQueue = async () => {
  while (queue.length > 0) {
    const request = queue.shift();
    await request();
    await delay(100); // 100ms between requests
  }
};
```

---

## Release Checklist

### Pre-Release
- [ ] All tests passing (coverage > 80%)
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Device testing on iOS & Android
- [ ] Beta testing with 100+ users

### Release Candidate
- [ ] Version bump in app.json
- [ ] Update changelog
- [ ] Create release branch
- [ ] Build signed APK/IPA
- [ ] Submit to app stores

### Post-Release
- [ ] Monitor crash rates
- [ ] Watch analytics for anomalies
- [ ] Respond to user feedback
- [ ] Plan hotfix if needed

---

## Documentation Requirements

All code should include:

```typescript
/**
 * Fetches properties matching user preferences using AI matching.
 *
 * @param userId - User identifier
 * @param preferences - User preference object
 * @returns Promise resolving to matched properties
 *
 * @example
 * const matches = await findMatches('user123', { priceRange: [200000, 1000000] });
 *
 * @throws Error if OpenRouter API is unavailable
 */
export async function findMatches(userId: string, preferences: UserPreferences) {
  // Implementation
}
```

---

## Resources

### Official Documentation
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/docs/getting-started/)
- [Redux Toolkit](https://redux-toolkit.js.org/usage/usage-guide)

### Design & UX
- Figma design file: [Link to design file]
- Brand guidelines: [Link to brand docs]
- Storybook components: `npm run storybook`

### API Documentation
- Backend API: [Link to API docs]
- OpenRouter: https://openrouter.ai/docs
- Composio: https://www.composio.dev/docs

---

## Contact & Support

- **Tech Lead:** [Name & Email]
- **Product Manager:** [Name & Email]
- **Design Lead:** [Name & Email]
- **Team Slack Channel:** #puraestate-mobile

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-24 | Initial specification and documentation |

---

## Appendix: Critical Code Examples

### Minimal Viable Component

```typescript
// src/components/cards/PropertyCard.example.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../tokens';

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onPress }) => {
  const styles = StyleSheet.create({
    container: {
      marginVertical: Spacing.sm,
      marginHorizontal: Spacing.md,
      backgroundColor: Colors.neutral.white,
      borderRadius: BorderRadius.lg,
    },
    image: {
      width: '100%',
      height: 200,
      borderTopLeftRadius: BorderRadius.lg,
      borderTopRightRadius: BorderRadius.lg,
    },
    content: {
      padding: Spacing.md,
    },
    address: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.primary.navy,
      marginBottom: Spacing.sm,
    },
    price: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors.primary.gold,
    },
  });

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.container}>
        <Image source={{ uri: property.images[0] }} style={styles.image} />
        <View style={styles.content}>
          <Text style={styles.address}>{property.address}</Text>
          <Text style={styles.price}>${property.price.toLocaleString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default PropertyCard;
```

### Redux Thunk Example

```typescript
// src/redux/thunks/propertyThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { propertyService } from '../../services/api/propertyService';

export const fetchPropertyDetails = createAsyncThunk(
  'properties/fetchDetails',
  async (propertyId: string, { rejectWithValue }) => {
    try {
      const property = await propertyService.getPropertyById(propertyId);
      return property;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
```

### Service Implementation Example

```typescript
// src/services/api/propertyService.ts
import axios from 'axios';

class PropertyService {
  async getPropertyById(id: string) {
    const response = await axios.get(`/properties/${id}`);
    return response.data;
  }

  async searchProperties(filters: SearchFilters) {
    const response = await axios.get('/properties/search', { params: filters });
    return response.data;
  }
}

export const propertyService = new PropertyService();
```

---

**This document serves as the central entry point for the development team. Always refer back to the main specification documents for detailed information.**

**Last Updated:** 2026-02-24
**Status:** Ready for Development
