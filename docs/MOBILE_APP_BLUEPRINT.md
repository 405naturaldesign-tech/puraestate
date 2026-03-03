# PuraEstate Mobile App - Complete Technical Blueprint

**Version:** 1.0
**Date:** February 24, 2026
**Status:** Design & Architecture Ready for Development

---

## EXECUTIVE SUMMARY

PuraEstate Mobile App combines 10 existing real estate investment tools with AI-powered property matching to create the first intelligent real estate investment platform for Costa Rica. This mobile-first approach (React Native + Firebase) targets 50K+ investors in Costa Rica with three tiered pricing models.

**Key Differentiators:**
- Only AI-powered real estate platform for Costa Rica
- Combines all investment tools in single mobile app
- Instant agent matching via WhatsApp + Composio
- Mobile-first (website is web-only, no existing mobile app)
- Automates investor-agent friction

**30-Day Launch Target:** MVP with core features (Auth, Search, AI Matching, 5 tools)

---

## PART 1: FEATURE ARCHITECTURE

### 1.1 EXISTING 10 FEATURES (RETAINED)

#### 1. ROI Investment Calculator
**Purpose:** Calculate return on investment for rental properties
**Inputs:** Purchase price, down payment, rental income, expenses, holding period
**Outputs:** Annual ROI %, cash-on-cash return, 5/10-year projections
**Integration Points:**
- Firebase: Store user's saved calculations
- Property detail screen: Pre-populate with property data
- Export PDF functionality
- Local storage: Cache formulas offline

**Tech Stack:** React Native + JavaScript math library (decimal.js for precision)

#### 2. Property Manager (Tenants/Rent/Maintenance)
**Purpose:** Manage rental properties, tenants, payments, maintenance logs
**Core Screens:**
- Property list with status indicators
- Tenant profiles (name, lease dates, contact, documents)
- Rent collection tracker (paid/overdue/scheduled)
- Maintenance log (requests, completed jobs, costs)
- Expenses dashboard (monthly breakdown)

**Data Model:**
```
Property {
  id, address, type, purchasePrice, rentalIncome,
  tenants: [{name, lease, contact, documents}],
  rentPayments: [{date, amount, status}],
  maintenance: [{date, description, cost, status}],
  expenses: [{category, amount, date}]
}
```

**Integration Points:**
- Firebase Realtime Database: Store all tenant/rent/maintenance data
- Firebase Storage: Document uploads (IDs, lease agreements)
- Push notifications: Overdue rent alerts, maintenance reminders
- WhatsApp integration (Composio): Send payment reminders to tenants

**Tech Stack:** React Native, Firebase Admin SDK, Composio API

#### 3. Mortgage Calculator (CR Bank Rates)
**Purpose:** Calculate mortgage payments using current Costa Rica bank rates
**Features:**
- Real-time CR bank rates (LIBOR, IFX, BAC, BCAC, Davivienda)
- Loan amount, interest rate, term inputs
- Monthly payment, total interest, amortization schedule
- Comparison tool (multiple banks side-by-side)
- Automatic rate updates (daily via Firebase Cloud Function)

**Data Model:**
```
BankRate {
  bankName, date, rateType (LIBOR/IFX/Fixed),
  rate, lastUpdated, source
}

Mortgage {
  loanAmount, rate, termYears, monthlyPayment,
  totalInterest, amortizationSchedule: [{month, payment, principal, interest, balance}]
}
```

**Integration Points:**
- Firebase Realtime Database: Store current rates
- Cloud Function: Scheduled daily rate updates (calls CR bank APIs or web scraping)
- Property detail: Pre-populate with property price
- Export PDF: Amortization schedule

**Tech Stack:** React Native, Firebase Cloud Functions, node-schedule

#### 4. Closing Costs Breakdown
**Purpose:** Itemize and estimate closing costs for property purchases
**Features:**
- Itemized cost breakdown (recording fees, taxes, legal, title insurance, etc.)
- Costa Rica-specific closing cost percentages (typically 4-8% of purchase price)
- Calculate total closing costs + timeline
- Breakdown by buyer/seller responsibility
- Export PDF with itemized summary

**Data Model:**
```
ClosingCosts {
  purchasePrice, costType: [
    {name, percentage/fixed, amount, paidBy (buyer/seller/shared)},
    // Examples: titulo, registro, arancel notarial, seguros
  ],
  totalCosts, timeline
}
```

**Integration Points:**
- Firebase: Save user calculations
- Property detail: Auto-calculate with property price
- PDF export: Generate detailed breakdown
- Legal contacts: Link to notaries/lawyers

**Tech Stack:** React Native, React Native PDF

#### 5. Folio Real (Title Verification)
**Purpose:** Verify property titles and check for liens/legal issues
**Features:**
- Search Folio Real (official CR registry) by address
- Display title details: owner, size, classification, value
- Check for liens, mortgages, or legal restrictions
- Red flags for problematic properties
- Integration with legal professionals for verification

**Data Model:**
```
FolioReal {
  address, propertyId, owner, size, classification, value,
  liens: [], mortgages: [], legalFlags: [],
  lastVerified, source
}
```

**Integration Points:**
- External API: Call official Folio Real service (or scrape if no public API)
- Firebase: Cache results + verification history
- Property detail: Embed verification status
- Legal warnings: Display red flags prominently
- Notification system: Alert user to potential issues

**Tech Stack:** React Native, Firebase, Web scraping or official API

#### 6. Residency Guide (Investor/Pensionado/Rentista)
**Purpose:** Guide investors through Costa Rica residency options
**Features:**
- Three residency paths: Investor, Pensionado, Rentista
- Requirements breakdown (capital required, income, processing time)
- Documentation checklist for each path
- Legal process timeline
- Cost estimates
- Link to official resources + legal advisors

**Data Model:**
```
ResidencyOption {
  name (Investor/Pensionado/Rentista),
  minimumCapital, minimumIncome, processingDays,
  requirements: [{item, amount/description}],
  documents: [{name, description, optional}],
  estimatedCost, legalAdviserLink
}
```

**Integration Points:**
- Firebase: Store residency requirements + updates
- PDF export: Complete residency checklist
- Legal contacts: Link to immigration lawyers
- Push notifications: Updates to residency requirements
- Web links: Official government resources

**Tech Stack:** React Native, Firebase

#### 7. Market Heatmap (Price Trends by Canton)
**Purpose:** Visualize real estate prices and trends across Costa Rica cantons
**Features:**
- Interactive map of Costa Rica colored by price range
- Canton-level price data (average, min, max)
- Price trend graph (3/6/12-month trends)
- Filtering by property type (residential, commercial, land)
- Click on canton to see top properties
- Market opportunity indicators (high demand, rising prices, etc.)

**Data Model:**
```
CantonData {
  cantonName, region, averagePrice, minPrice, maxPrice,
  propertyCount, pricePerSqm, trend (up/stable/down),
  trendPercentage, demandLevel,
  topProperties: [{address, price, type, daysListed}]
}
```

**Integration Points:**
- Firebase Realtime Database: Store canton price data
- Cloud Function: Update prices weekly from property database
- Map library: React Native Maps or Mapbox
- Property database: Real-time price aggregation
- Push notifications: Alert on price changes in favorite cantons
- Analytics: Track user interest by canton

**Tech Stack:** React Native, Firebase, Mapbox/React Native Maps, Chart.js

#### 8. Inspection Checklist PDF
**Purpose:** Provide standardized property inspection checklist
**Features:**
- Pre-built inspection checklist (structural, electrical, plumbing, etc.)
- Check/unchecked items with photo upload capability
- Notes/comments field for each section
- Photo gallery (before/after)
- Generate PDF report with photos + notes
- Share with inspector/legal advisors
- Store inspection history

**Data Model:**
```
InspectionChecklist {
  propertyId, date, inspector,
  sections: [{
    name, items: [{
      itemName, category, checked, notes, photos: []
    }]
  }],
  overallStatus, redFlags, pdfUrl
}
```

**Integration Points:**
- Firebase Storage: Store photos + PDF reports
- React Native Camera: Photo capture
- PDF generation: PDFKit or React Native PDF
- Share functionality: Email/WhatsApp/cloud storage
- Property detail: Link inspection history
- Notifications: Inspection reminders

**Tech Stack:** React Native, Firebase, React Native Camera, PDFKit

#### 9. Toolbox (Combined Features Hub)
**Purpose:** Central hub accessing all tools from any screen
**Features:**
- Quick-access toolbar or modal with all 10 tools
- Tool search/filtering
- Recently used tools
- Favorite tools for quick access
- Tool descriptions + help tooltips
- Offline tool availability (calculators work without internet)

**Integration Points:**
- Navigation: Deep linking to specific tool screens
- Context passing: Pre-populate tool fields from current property
- Analytics: Track tool usage
- Caching: Store calculator logic offline

**Tech Stack:** React Native, Local storage (AsyncStorage)

#### 10. Plus Additional PuraEstate.com Features
**Current website features to consider:**
- Blog/market insights
- Investment guides
- Property listing database
- Agent directory
- Legal resources
- Tax guides
- Community forum (optional)

**To integrate:**
- Feed blog content into mobile app (RSS or API)
- Embed market insights in analytics dashboard
- Integrate investment guides as in-app learning content
- Agent directory synced with matching system
- Quick links to legal resources

---

## PART 2: NEW AI FEATURES (GUIDLYER INTEGRATION)

### 2.1 Smart Property Matching (OpenRouter)

**Purpose:** AI-powered property recommendations based on investor preferences

**How It Works:**
1. Investor completes profile (budget, location, ROI target, property type, risk tolerance)
2. AI analyzes investor profile + property database
3. Generates ranked property matches with rationale
4. Updates daily with new listings matching preferences
5. Learns from user behavior (clicked, saved, dismissed properties)

**Data Flow:**
```
Investor Profile → OpenRouter AI → Property Database
→ Ranking Algorithm → Sorted Matches → Mobile App
```

**Integration Points:**
- OpenRouter API: Call Claude/Llama for property analysis
- Firebase: Store investor preferences + interaction history
- Property database: Query against preference criteria
- Machine learning: Log user behavior for future model improvements
- Push notifications: New matching properties available
- Search screens: Embed match scores in property listings

**API Call Structure:**
```typescript
const analyzePropertyMatch = async (investor, property) => {
  const prompt = `
    Analyze if this property matches the investor's profile.
    Investor: ${JSON.stringify(investor)}
    Property: ${JSON.stringify(property)}

    Return: JSON {matchScore (0-100), reasoning, risks, opportunities}
  `;

  const response = await openRouterAPI.post('/chat/completions', {
    model: 'openrouter/auto',
    messages: [{role: 'user', content: prompt}],
    temperature: 0.7
  });

  return JSON.parse(response.content);
};
```

**Tech Stack:** OpenRouter SDK, Firebase, Node.js backend

### 2.2 Investor Preference Learning

**Purpose:** Improve matching accuracy by learning investor preferences over time

**Implementation:**
1. Track user interactions (viewed, saved, contacted agent, purchased)
2. Extract patterns from successful matches
3. Adjust algorithm weights based on behavior
4. A/B test different matching criteria
5. Provide insights to investor ("You prefer beach properties in Guanacaste")

**Data Collection:**
```
UserInteraction {
  investorId, propertyId, action (view/save/contact/purchase),
  timestamp, contextData: {
    listPrice, roi, location, propertyType, ...
  }
}
```

**Firebase Functions:**
- Daily batch process: Analyze interactions → update preference weights
- Real-time function: Update recommendations when user saves property
- Weekly summary: Send investor "Your property preferences" insight

**Tech Stack:** Firebase Cloud Functions, TensorFlow.js (optional for ML), Python backend (optional)

### 2.3 ROI Prediction

**Purpose:** AI-powered ROI forecasting based on market data + property specifics

**How It Works:**
1. Input property details (price, location, rental potential)
2. AI analyzes historical market data for similar properties
3. Generates 1/3/5/10-year ROI projections
4. Provides confidence intervals + risk assessment
5. Shows comparable property performance

**Integration Points:**
- ROI Calculator screen: Embed AI prediction as comparison
- Property detail: Show predicted vs. manual ROI
- Market data: Use canton price trends for forecasting
- Historical data: Link to comparable properties + their actual returns

**AI Analysis:**
```typescript
const predictROI = async (property, marketData) => {
  const prompt = `
    Predict 5-year ROI for this property based on market data.
    Property: ${JSON.stringify(property)}
    Market: ${JSON.stringify(marketData)}
    Similar properties: ${JSON.stringify(comparables)}

    Return: JSON {
      roi1Year, roi3Year, roi5Year, confidence, risks, factors
    }
  `;

  return await openRouterAPI.analyzeProperty(prompt);
};
```

**Tech Stack:** OpenRouter, Firebase, Real estate analytics database

### 2.4 Market Opportunity Alerts (Composio)

**Purpose:** Automated alerts to investors about market opportunities

**Alert Types:**
1. **Price Drop Alerts:** Property price reduced, ROI improved
2. **Demand Alerts:** Property type in demand, average prices rising
3. **Opportunity Alerts:** Properties matching investor profile appear
4. **Market Trend Alerts:** Canton-level price or demand shifts
5. **Competitor Alerts:** Similar properties selling, investor missing window

**Composio Integration:**
```typescript
const setupAlerts = async (investor) => {
  // Create workflow in Composio
  const workflow = await composio.workflows.create({
    name: `Alerts for ${investor.id}`,
    triggers: [
      {type: 'property_listed', filters: investor.preferences},
      {type: 'price_changed', threshold: '-5%'},
      {type: 'market_trend', region: investor.favoriteRegions}
    ],
    actions: [
      {type: 'push_notification', target: 'mobile_app'},
      {type: 'whatsapp_message', target: 'investor'},
      {type: 'email', template: 'opportunity_alert'}
    ]
  });

  return workflow;
};
```

**Firebase Integration:**
- Cloud Function: Monitor property database for alert triggers
- Realtime Database: Store alert preferences + history
- Notifications: Send push + email
- Analytics: Track alert engagement (which alerts investor acts on)

**Tech Stack:** Composio, Firebase Cloud Functions, Firebase Messaging

### 2.5 Instant Agent Notifications (Composio + WhatsApp)

**Purpose:** Automatically notify agents of qualified investor inquiries via WhatsApp

**Workflow:**
1. Investor clicks "Contact Agent" or "Interested in Property"
2. Firebase triggers Cloud Function
3. AI qualifies lead (profile, budget, seriousness)
4. Composio sends WhatsApp message to agent with investor details
5. Agent responds in WhatsApp, app notifies investor
6. Chat history stored in Firebase

**Composio + WhatsApp Setup:**
```typescript
const notifyAgentViaWhatsApp = async (investor, property, agent) => {
  const leadMessage = `
    New investor interested in ${property.address}!

    Name: ${investor.name}
    Budget: $${investor.budget}
    ROI Target: ${investor.roiTarget}%
    Profile: ${investor.riskProfile}

    Contact: ${investor.phone}

    Respond in app to start conversation.
  `;

  await composio.send('whatsapp', {
    to: agent.whatsappNumber,
    message: leadMessage,
    metadata: {
      investorId: investor.id,
      propertyId: property.id,
      agentId: agent.id
    }
  });

  // Log in Firebase for app notifications
  await firebase.database().ref(`conversations/${investor.id}`).push({
    agentId: agent.id,
    propertyId: property.id,
    initiated: true,
    timestamp: Date.now()
  });
};
```

**Firebase Structure:**
```
Conversations
├── investorId
│   ├── conversationId
│   │   ├── agentId
│   │   ├── propertyId
│   │   ├── messages: [{sender, text, timestamp, read}]
│   │   ├── status (active/archived)
│   │   ├── agentProfile: {name, photo, rating}
```

**Tech Stack:** Composio, WhatsApp Business API, Firebase Realtime Database, Cloud Functions

### 2.6 Automated Property Analysis

**Purpose:** AI-powered automated analysis of every property in database

**What It Analyzes:**
1. Investment viability (ROI potential, market fit)
2. Red flags (title issues, legal risks, overpriced)
3. Comparable market analysis (similar properties, pricing)
4. Rental potential (estimated rental income by location/type)
5. Appreciation potential (market trends for region)
6. Risk assessment (natural disasters, crime, market volatility)

**Firebase Cloud Function (runs on new property listing):**
```typescript
exports.analyzeNewProperty = functions.firestore
  .document('properties/{propertyId}')
  .onCreate(async (snap, context) => {
    const property = snap.data();

    // 1. Get comparable properties
    const comparables = await getComparableProperties(property);

    // 2. AI analysis
    const analysis = await openRouterAPI.analyzeProperty({
      property,
      comparables,
      marketData: await getMarketData(property.canton),
      historicalTrends: await getHistoricalTrends(property.canton)
    });

    // 3. Store analysis
    await firebase.firestore().collection('properties')
      .doc(propertyId).update({
        aiAnalysis: analysis,
        riskScore: analysis.riskScore,
        opportunityScore: analysis.opportunityScore,
        analysisDate: Date.now()
      });

    // 4. Notify matching investors
    await notifyMatchingInvestors(property, analysis);
  });
```

**Output Stored in Firebase:**
```
Property {
  aiAnalysis: {
    investmentViability: score,
    roiPotential: range,
    redFlags: [],
    comparablePrice: amount,
    rentalEstimate: amount,
    appreciationPotential: percentage,
    riskScore: 0-100,
    opportunityScore: 0-100,
    recommendations: []
  }
}
```

**Tech Stack:** OpenRouter, Firebase Cloud Functions, Firestore

---

## PART 3: TECHNICAL ARCHITECTURE

### 3.1 Technology Stack

**Frontend (Mobile):**
- React Native 0.76+
- Expo (for faster development/deployment)
- React Navigation (routing)
- Redux Toolkit (state management)
- Axios (HTTP client)
- Firebase SDK (Auth, Database, Storage, Cloud Messaging)
- React Native Maps / Mapbox (for heatmap)
- Chart.js (analytics dashboards)
- React Native PDF (invoice/checklist export)
- React Native Camera (inspection photos)

**Backend (Cloud):**
- Firebase (primary backend):
  - Authentication (OAuth, Phone)
  - Firestore (primary database)
  - Realtime Database (real-time features)
  - Cloud Storage (documents, photos)
  - Cloud Functions (server logic)
  - Cloud Messaging (push notifications)
  - Analytics
- Node.js + Express (optional additional backend)
- Python (optional ML/analytics)

**AI & Automation:**
- OpenRouter API (LLM access - Claude, Llama, etc.)
- Composio (API automation - WhatsApp, webhooks)
- TensorFlow.js (optional client-side ML)

**Payments:**
- SINPE Móvil integration (Costa Rica payment standard)
- Stripe (fallback, international payments)
- Firebase Remote Config (pricing management)

**External Integrations:**
- WhatsApp Business API (via Composio)
- Costa Rica Bank APIs (for mortgage rates)
- Property database APIs (property listings)
- Google Maps API (location services)

**DevOps:**
- Firebase Hosting (web dashboard/admin panel)
- GitHub (version control)
- GitHub Actions (CI/CD)
- Sentry (error tracking)
- Google Analytics (app analytics)

### 3.2 Database Schema (Firebase Firestore)

```
users/
├── {userId}
│   ├── profile: {name, email, phone, photo}
│   ├── investorProfile: {
│       budget, roiTarget, preferredRegions, propertyTypes,
│       riskTolerance, investmentHorizon, preferredUsage
│     }
│   ├── subscription: {tier, status, startDate, expiryDate}
│   ├── preferences: {notifications, alerts, language}
│   ├── savedProperties: {propertyId: true}
│   ├── createdAt, lastLogin, status
│
properties/
├── {propertyId}
│   ├── listing: {
│       address, canton, region, type, price, size,
│       bedrooms, bathrooms, amenities, photos, video
│     }
│   ├── financial: {
│       purchasePrice, estimatedRentalIncome, expenses,
│       capitalAppreciation
│     }
│   ├── legal: {
│       folioRealId, owner, liens, mortgages, restrictions,
│       titleVerificationStatus
│     }
│   ├── aiAnalysis: {
│       riskScore, opportunityScore, roiPrediction,
│       redFlags, recommendations
│     }
│   ├── agent: {agentId, agentName, agentPhone, agentPhoto}
│   ├── createdAt, updatedAt, status
│
agents/
├── {agentId}
│   ├── profile: {name, phone, email, photo, company}
│   ├── whatsappNumber
│   ├── specializations: {regions, propertyTypes}
│   ├── rating, reviews, soldProperties
│   ├── notifications: {enabled, categories}
│   ├── createdAt
│
conversations/
├── {conversationId}
│   ├── investorId, agentId, propertyId
│   ├── messages: {
│       {sender, text, timestamp, read, attachments}
│     }
│   ├── status (active/archived), createdAt
│
alerts/
├── {userId}
│   ├── {alertId}
│   │   ├── type: {price_drop, opportunity, market_trend, demand}
│   │   ├── propertyId, triggerDetails
│   │   ├── read, createdAt
│
calculations/
├── {userId}
│   ├── {calculationId}
│   │   ├── type: {roi, mortgage, closing_costs}
│   │   ├── inputs, outputs, createdAt, savedName
│
inspections/
├── {userId}
│   ├── {inspectionId}
│   │   ├── propertyId, date, inspector
│   │   ├── checklist: {sections with items, photos}
│   │   ├── status, pdfUrl, createdAt
│
properties_portfolio/
├── {userId}
│   ├── {propertyId}
│   │   ├── tenants: {tenantId: {name, lease, contact}}
│   │   ├── rentPayments: {entries}
│   │   ├── maintenance: {requests, logs}
│   │   ├── expenses: {entries}
│   │   ├── documents: {deeds, leases, insurance}
│
bank_rates/
├── {bankId}
│   ├── date, rates: {LIBOR, IFX, fixed}, lastUpdated
│
market_data/
├── {cantonId}
│   ├── cantonName, averagePrice, trend, demandLevel,
│   ├── propertyCount, pricePerSqm, priceHistory
```

### 3.3 API Endpoints (Backend REST API)

**Authentication:**
- POST `/auth/signup` - Create investor account
- POST `/auth/login` - Login with email/password
- POST `/auth/loginPhone` - Login with phone (OTP)
- POST `/auth/logout` - Logout
- POST `/auth/resetPassword` - Password reset
- POST `/auth/verifyOTP` - Verify phone OTP

**Investor Profile:**
- GET `/investors/{userId}` - Get investor profile
- PUT `/investors/{userId}` - Update investor profile
- GET `/investors/{userId}/preferences` - Get investor preferences
- PUT `/investors/{userId}/preferences` - Update preferences
- GET `/investors/{userId}/portfolio` - Get property portfolio

**Properties:**
- GET `/properties` - Get all properties (with filters)
- GET `/properties/{propertyId}` - Get property details
- GET `/properties/recommended/{userId}` - Get AI recommendations
- POST `/properties/{propertyId}/contact-agent` - Contact agent about property
- POST `/properties/{propertyId}/save` - Save favorite property
- GET `/investors/{userId}/favorites` - Get saved properties

**Tools:**
- POST `/tools/roi-calculator` - Calculate ROI
- POST `/tools/mortgage-calculator` - Calculate mortgage
- POST `/tools/closing-costs` - Calculate closing costs
- GET `/tools/market-heatmap` - Get canton price data
- GET `/tools/folio-real/{address}` - Verify title
- POST `/tools/inspection-checklist` - Create inspection
- PUT `/tools/inspection-checklist/{inspectionId}` - Update inspection
- POST `/tools/property-manager/properties` - Add property to portfolio
- POST `/tools/property-manager/rent-payment` - Log rent payment
- POST `/tools/property-manager/maintenance` - Log maintenance

**Agents:**
- GET `/agents` - Get agent directory
- GET `/agents/{agentId}` - Get agent profile
- POST `/agents/{agentId}/contact` - Send message to agent
- GET `/conversations/{investorId}` - Get conversations

**Alerts:**
- GET `/alerts/{userId}` - Get user alerts
- POST `/alerts/{userId}` - Create alert preference
- PUT `/alerts/{userId}/{alertId}` - Update alert preference
- DELETE `/alerts/{userId}/{alertId}` - Delete alert

**Subscriptions:**
- GET `/subscriptions/{userId}` - Get current subscription
- POST `/subscriptions/{userId}/upgrade` - Upgrade tier
- POST `/subscriptions/{userId}/cancel` - Cancel subscription
- POST `/payments/sinpe` - Process SINPE Móvil payment

---

## PART 4: SCREEN DESIGNS & USER FLOWS

### 4.1 Authentication Screens

#### Screen 1A: Welcome/Sign Up
```
[PuraEstate Logo]
"Smart Real Estate Investment in Costa Rica"

[Sign Up with Email Button]
[Sign Up with Phone Button]
[Sign Up with Google Button]

"Already have an account? Sign In"
```

#### Screen 1B: Investor Profile Setup (Multi-step)
**Step 1: Basic Info**
```
Full Name: [________]
Email: [________]
Phone: [________]
Country: [Costa Rica ▼]

[Next >]
```

**Step 2: Investment Profile**
```
Budget Range:
○ < $100K
○ $100K - $250K
○ $250K - $500K
○ $500K+

ROI Target:
○ Conservative (< 6%)
○ Moderate (6-10%)
○ Aggressive (10%+)

Property Types (select multiple):
☐ Residential
☐ Commercial
☐ Land
☐ Vacation Rental

Risk Tolerance:
Slider [Conservative ←→ Aggressive]

[Back] [Next >]
```

**Step 3: Preferences**
```
Preferred Regions:
☐ Central Valley (San José)
☐ Caribbean Coast
☐ Pacific Coast (North)
☐ Pacific Coast (South)
☐ Northern Zone

Investment Horizon:
○ Short term (1-3 years)
○ Medium term (3-7 years)
○ Long term (7+ years)

Intended Use:
○ Rental income
○ Capital appreciation
○ Personal residence
○ Mixed strategy

[Back] [Create Account]
```

#### Screen 1C: Phone Sign Up with OTP
```
Enter Phone Number:
[+506 ________]

[Send OTP]

Enter 6-digit code sent to your number:
[_ _ _ _ _ _]

[Verify & Sign Up]
```

---

### 4.2 Home Screen (Investor Dashboard)

```
┌─────────────────────────────┐
│  PuraEstate      ☰    👤    │  (hamburger menu, account)
├─────────────────────────────┤
│                             │
│  Hi, [Investor Name]!       │
│                             │
│  💰 Portfolio Value         │
│  $2,450,000                 │
│                             │
│  📈 Monthly Cashflow        │
│  $8,500                     │
│                             │
│  ⭐ Average ROI             │
│  8.3%                       │
│                             │
├─────────────────────────────┤
│                             │
│  🔥 Recommended Properties  │
│  (AI Matching)              │
│                             │
│  [Property Card 1]          │
│  Address: San José, Barrio  │
│  Price: $385K   ROI: 8.2%   │
│  ⭐⭐⭐⭐⭐ 92% Match          │
│                             │
│  [Property Card 2]          │
│  Address: Tamarindo, Guanac │
│  Price: $450K   ROI: 9.1%   │
│  ⭐⭐⭐⭐ 85% Match           │
│                             │
│  [View All >]               │
│                             │
├─────────────────────────────┤
│                             │
│  📍 Market Alerts (3)       │
│  • San José prices up 3.2%  │
│  • New condo match in Barrio│
│  • Guanacaste demand rising │
│                             │
│  [View All >]               │
│                             │
├─────────────────────────────┤
│  [Search] [Tools] [Portfolio][Agents]  │
└─────────────────────────────┘
```

---

### 4.3 Property Search & AI Recommendations Screen

```
┌─────────────────────────────┐
│  Search Properties  ☰    🔍  │
├─────────────────────────────┤
│  [Search by address...]     │
│                             │
│  Filters ▼                  │
│  • Budget: $100K - $500K    │
│  • Region: Pacific Coast    │
│  • Type: Residential        │
│  • ROI: 6% - 12%            │
│                             │
├─────────────────────────────┤
│  Sort by: AI Match ▼        │
│                             │
│  [AI Recommendations]       │
│  (Ranked by match score)    │
│                             │
│  1. San José, Barrio        │
│     $385K | 92% AI Match    │
│     ROI: 8.2% | 3 bed      │
│     🔔 Price just dropped   │
│     [Save] [View]           │
│                             │
│  2. Tamarindo, Guanacaste   │
│     $450K | 85% AI Match    │
│     ROI: 9.1% | 4 bed      │
│     [Save] [View]           │
│                             │
│  3. Central Valley, Aserrí   │
│     $320K | 78% AI Match    │
│     ROI: 7.8% | 2 bed      │
│     [Save] [View]           │
│                             │
│  [Show all properties >]    │
│                             │
└─────────────────────────────┘
```

---

### 4.4 Property Detail Screen (All Tools Embedded)

```
┌─────────────────────────────┐
│  [<] San José Property       │
├─────────────────────────────┤
│                             │
│  [Photo Gallery Carousel]   │
│  [Photo 1] [Photo 2] [...]  │
│                             │
│  $385,000 | 92% AI Match    │
│                             │
│  San José, Barrio Escalante │
│  3 bedrooms, 2 bathrooms    │
│  240 sq meters              │
│                             │
│  ❤️ Save Property            │
│                             │
├─────────────────────────────┤
│  📋 Property Details        │
│  • Type: Residential        │
│  • Year Built: 2015         │
│  • Lot Size: 500 sq ft      │
│  • Features: Pool, Gym      │
│                             │
├─────────────────────────────┤
│  💰 Financial Analysis      │
│  Est. Rental Income: $1,800 │
│  Est. Annual ROI: 8.2%      │
│  Price per sq meter: $1,604 │
│                             │
│  [Launch ROI Calculator >]  │
│                             │
├─────────────────────────────┤
│  📈 Market Data             │
│  Canton: San José           │
│  Avg Price: $425K           │
│  Avg ROI: 7.8%              │
│  Market Trend: ↑ +3.2%      │
│                             │
│  [View Market Heatmap >]    │
│                             │
├─────────────────────────────┤
│  ✅ Legal Verification      │
│  • Title: VERIFIED ✓        │
│  • Folio Real ID: SR-001... │
│  • Liens: None              │
│  • Mortgages: None          │
│                             │
│  [View Folio Real Details >]│
│                             │
├─────────────────────────────┤
│  💵 Closing Costs           │
│  Estimated: $23,100 (6%)    │
│  • Title Recording: $2,500  │
│  • Legal Fees: $8,000       │
│  • Taxes: $12,600           │
│                             │
│  [View Full Breakdown >]    │
│                             │
├─────────────────────────────┤
│  🏦 Mortgage Calculator      │
│  $308,000 loan @ 5.2% rate  │
│  Monthly Payment: $1,649    │
│                             │
│  [Adjust Mortgage >]         │
│                             │
├─────────────────────────────┤
│  🔍 Property Inspection      │
│  [Start Inspection...]      │
│                             │
├─────────────────────────────┤
│  👨‍💼 Agent Info               │
│  Carlos Rodríguez           │
│  RE/MAX Costa Rica          │
│  Rating: ⭐⭐⭐⭐⭐ (24 reviews)  │
│                             │
│  [Contact Agent]            │
│  [View All Properties >]    │
│                             │
├─────────────────────────────┤
│  💬 [Contact Agent Button]  │
│                             │
└─────────────────────────────┘
```

---

### 4.5 ROI Calculator Screen (In-app)

```
┌─────────────────────────────┐
│  ROI Calculator  [<]         │
├─────────────────────────────┤
│                             │
│  📊 Property: San José      │
│  (Pre-filled from listing)  │
│                             │
│  Purchase Price:            │
│  $[385,000________________] │
│                             │
│  Down Payment:              │
│  $[77,000_________________] │
│  (20% default)              │
│                             │
│  Mortgage:                  │
│  ○ No Mortgage              │
│  ○ With Mortgage            │
│    Loan Amount: $308,000    │
│    Rate: 5.2%               │
│    Term: 30 years           │
│    Monthly: $1,649          │
│                             │
│  Annual Rental Income:      │
│  $[21,600________________]  │
│                             │
│  Annual Expenses:           │
│  • Maintenance: $[2,400__]  │
│  • Insurance: $[1,200____]  │
│  • Property Tax: $[500____] │
│  • Management (10%): $2,160 │
│  Total: $6,260              │
│                             │
│  ────────────────────────   │
│                             │
│  🎯 Results:                │
│  Annual Cashflow: $15,340   │
│  Cash-on-Cash Return: 19.9% │
│  Annual ROI: 8.2%           │
│                             │
│  📈 5-Year Projection:      │
│  Total Cashflow: $76,700    │
│  Property Appreciation: 15% │
│  Profit: $134,470           │
│                             │
│  💾 [Save Calculation]      │
│  📄 [Export PDF]            │
│                             │
└─────────────────────────────┘
```

---

### 4.6 My Properties (Portfolio Management) Screen

```
┌─────────────────────────────┐
│  My Properties  ☰            │
├─────────────────────────────┤
│                             │
│  Portfolio Summary:         │
│  💰 Total Value: $2,450K    │
│  📈 Monthly Cashflow: $8.5K │
│  ⭐ Avg ROI: 8.3%            │
│                             │
├─────────────────────────────┤
│  [Active Properties] (2)    │
│                             │
│  1. San José Apartment      │
│     Value: $385K            │
│     Monthly Income: $1,800  │
│     ROI: 8.2%               │
│     ⚡ 2 Tenants            │
│                             │
│     [View Details]          │
│     [Manage Tenants]        │
│     [View Maintenance]      │
│                             │
│  2. Tamarindo Condo         │
│     Value: $450K            │
│     Monthly Income: $2,100  │
│     ROI: 9.1%               │
│     ⚡ 1 Tenant             │
│                             │
│     [View Details]          │
│     [Manage Tenants]        │
│     [View Maintenance]      │
│                             │
│  [+ Add Property]           │
│                             │
├─────────────────────────────┤
│  📋 Pending Actions:        │
│  • Rent due: San José (3d)  │
│  • Filter inspection due    │
│  • Update insurance docs    │
│                             │
└─────────────────────────────┘
```

---

### 4.7 Property Manager - Tenant Details

```
┌─────────────────────────────┐
│  Tenant Management  [<]      │
├─────────────────────────────┤
│                             │
│  🏠 San José Apartment      │
│                             │
│  👤 Tenant: Marco García    │
│  📞 Phone: +506 8765-4321   │
│  ✉️ Email: marco@email.com  │
│                             │
│  📋 Lease Info              │
│  Start: Jan 15, 2024        │
│  End: Jan 14, 2026          │
│  Rent: $1,800/month         │
│  Deposit: $1,800            │
│                             │
│  📄 Documents:              │
│  [Lease Agreement]          │
│  [ID Copy]                  │
│  [References]               │
│                             │
├─────────────────────────────┤
│  💳 Rent Payments           │
│  Expected: $1,800           │
│                             │
│  Feb 2026: PAID ✓ ($1,800)  │
│  Jan 2026: PAID ✓ ($1,800)  │
│  Dec 2025: PAID ✓ ($1,800)  │
│                             │
│  [Payment History >]        │
│  [+ Log Manual Payment]     │
│  [Send Payment Reminder]    │
│                             │
├─────────────────────────────┤
│  🔧 Maintenance Requests    │
│                             │
│  • AC unit not cooling      │
│    Status: Scheduled (2/27) │
│    Cost est.: $450          │
│                             │
│  • Door lock repair         │
│    Status: Completed (2/15) │
│    Cost: $120               │
│                             │
│  [+ New Maintenance Request]│
│                             │
├─────────────────────────────┤
│  📞 [Send Message]          │
│  [Renew Lease]              │
│  [Terminate Lease]          │
│                             │
└─────────────────────────────┘
```

---

### 4.8 Agent Contacts & Conversations Screen

```
┌─────────────────────────────┐
│  Agents & Contacts  ☰        │
├─────────────────────────────┤
│                             │
│  💬 Active Conversations(2) │
│                             │
│  1. Carlos Rodríguez        │
│     RE/MAX Costa Rica       │
│     ⭐⭐⭐⭐⭐ (24 reviews)     │
│                             │
│     Last message: Today     │
│     "Property visit confirm"│
│                             │
│     [View Chat]             │
│                             │
│  2. María Fernández         │
│     CENTURY 21 Pura Vida    │
│     ⭐⭐⭐⭐ (18 reviews)      │
│                             │
│     Last message: Yesterday │
│     "New listings incoming" │
│                             │
│     [View Chat]             │
│                             │
├─────────────────────────────┤
│  📇 Find Agents             │
│  [Search by region...]      │
│                             │
│  Recommended Agents:        │
│  Based on your searches     │
│                             │
│  • Carlos Rodríguez         │
│    Specialties: San José,   │
│    Residential              │
│    Rating: ⭐⭐⭐⭐⭐           │
│    [Contact]                │
│                             │
│  • Diego López              │
│    Specialties: Guanacaste, │
│    Vacation Rentals         │
│    Rating: ⭐⭐⭐⭐             │
│    [Contact]                │
│                             │
│  [View All Agents >]        │
│                             │
└─────────────────────────────┘
```

---

### 4.9 Chat Screen (Investor ↔ Agent)

```
┌─────────────────────────────┐
│  Carlos Rodríguez  [<]  [☰] │
│  RE/MAX Costa Rica          │
├─────────────────────────────┤
│                             │
│  [Chat history scrollable]  │
│                             │
│  Carlos: Hi! Thanks for     │
│  interest in San José prop. │
│  Can we schedule visit?     │
│  2:30 PM                    │
│                             │
│  [You replied]              │
│  Sure! How about Thursday?  │
│  2:45 PM                    │
│                             │
│  Carlos: Perfect! 3PM at    │
│  property entrance?         │
│  2:50 PM                    │
│                             │
│  [You replied]              │
│  Done! See you then.        │
│  2:52 PM                    │
│                             │
│  ────────────────────────   │
│                             │
│  [Photo sent]               │
│  Inspection report.pdf      │
│  (downloaded automatically) │
│                             │
│  [You replied]              │
│  Attached inspection        │
│  results. Overall good!     │
│  10:15 AM                   │
│                             │
├─────────────────────────────┤
│  Message: [____________]    │
│  [📎] [😊] [🎤] [Send]      │
│                             │
│  ☎️ Call    📞 WhatsApp      │
│                             │
└─────────────────────────────┘
```

---

### 4.10 Market Analytics Dashboard Screen

```
┌─────────────────────────────┐
│  Market Analytics  ☰         │
├─────────────────────────────┤
│                             │
│  📍 Market Overview         │
│  Select Region: ▼ All CR    │
│                             │
├─────────────────────────────┤
│                             │
│  📈 Price Trends (6 months) │
│                             │
│  [Line Graph showing prices]│
│  $500K avg property value   │
│  Trend: ↑ +2.8%             │
│                             │
├─────────────────────────────┤
│                             │
│  🗺️ Heatmap by Canton       │
│                             │
│  [Interactive map CR]       │
│  San José: $425K (↑3.2%)    │
│  Cartago: $350K (→ stable)  │
│  Guanacaste: $525K (↑5.1%)  │
│  Limón: $300K (↓1.2%)       │
│  Puntarenas: $475K (↑2.8%)  │
│                             │
│  [Click canton for details] │
│                             │
├─────────────────────────────┤
│                             │
│  🏆 Top Opportunities       │
│  (AI-identified)            │
│                             │
│  1. Guanacaste Properties   │
│     Avg ROI: 9.8%           │
│     Demand: HIGH ⚡         │
│     Price Change: +5.1%     │
│     Opportunity Score: 92   │
│                             │
│  2. Central Valley Land     │
│     Avg ROI: 7.2%           │
│     Demand: MEDIUM          │
│     Price Change: +2.1%     │
│     Opportunity Score: 78   │
│                             │
│  3. Caribbean Rentals       │
│     Avg ROI: 10.2%          │
│     Demand: HIGH ⚡         │
│     Price Change: +3.8%     │
│     Opportunity Score: 85   │
│                             │
├─────────────────────────────┤
│  📊 Your Portfolio Overlap  │
│  • You own in: San José     │
│  • Recommended: Guanacaste  │
│  • Diversification score: 72│
│                             │
└─────────────────────────────┘
```

---

### 4.11 Tools Hub Screen

```
┌─────────────────────────────┐
│  Tools & Calculators  ☰      │
├─────────────────────────────┤
│  [Search tools...]          │
│                             │
│  Recently Used:             │
│  • ROI Calculator (today)   │
│  • Mortgage Calculator (3d) │
│                             │
├─────────────────────────────┤
│                             │
│  ⭐ CALCULATORS             │
│                             │
│  💰 ROI Calculator          │
│  Calculate investment       │
│  returns on properties      │
│  [Open →]                   │
│                             │
│  🏦 Mortgage Calculator      │
│  CR bank rates, monthly     │
│  payments, amortization     │
│  [Open →]                   │
│                             │
│  💵 Closing Costs           │
│  Itemized costs breakdown   │
│  for property purchases     │
│  [Open →]                   │
│                             │
├─────────────────────────────┤
│  📋 PROPERTY TOOLS           │
│                             │
│  🔍 Property Inspection      │
│  Checklist with photos,     │
│  PDF export                 │
│  [Open →]                   │
│                             │
│  🏠 Property Manager         │
│  Tenants, rent, maintenance │
│  tracking                   │
│  [Open →]                   │
│                             │
│  ✅ Folio Real Lookup        │
│  Verify property titles,    │
│  check for liens            │
│  [Open →]                   │
│                             │
├─────────────────────────────┤
│  📊 MARKET & LEGAL           │
│                             │
│  🗺️ Market Heatmap          │
│  Price trends by canton,    │
│  investment opportunities   │
│  [Open →]                   │
│                             │
│  📜 Residency Guide         │
│  Investor/Pensionado/       │
│  Rentista paths, docs      │
│  [Open →]                   │
│                             │
│  📈 Market Analytics        │
│  Trends, comparables,       │
│  opportunity alerts         │
│  [Open →]                   │
│                             │
└─────────────────────────────┘
```

---

### 4.12 Settings & Subscription Screen

```
┌─────────────────────────────┐
│  Settings  ☰                 │
├─────────────────────────────┤
│                             │
│  👤 Your Profile            │
│  [Edit Profile]             │
│  [Account Settings]         │
│                             │
│  📧 [investor@email.com]    │
│  📞 [+506 87654321]         │
│                             │
├─────────────────────────────┤
│                             │
│  💳 Current Plan            │
│  PREMIUM - $9.99/month      │
│  Billing Date: Feb 28       │
│  Status: Active ✓           │
│                             │
│  [View Invoice]             │
│  [Upgrade to Professional]  │
│  [Manage Subscription]      │
│                             │
├─────────────────────────────┤
│                             │
│  🔔 Notifications           │
│  Push Notifications: ON     │
│  Email Alerts: ON           │
│  WhatsApp Updates: ON       │
│  [Configure Alert Types]    │
│                             │
├─────────────────────────────┤
│  🌐 Language                │
│  [English ▼]                │
│                             │
│  🌙 Dark Mode               │
│  [Toggle]                   │
│                             │
├─────────────────────────────┤
│                             │
│  ℹ️ About PuraEstate         │
│  [Help & Support]           │
│  [Privacy Policy]           │
│  [Terms of Service]         │
│  [Contact Us]               │
│  [Rate App]                 │
│                             │
│  Version 1.0.0              │
│                             │
│  [Logout]                   │
│                             │
└─────────────────────────────┘
```

---

## PART 5: MONETIZATION STRATEGY

### 5.1 Three-Tier Pricing Model

**TIER 1: FREE**
- All 10 basic tools (ROI, Mortgage, Closing Costs, etc.)
- Property search (limited to 20 listings/day)
- Market Heatmap (basic view)
- Folio Real lookups (limited 5/month)
- Inspection Checklist PDF
- Residency Guide
- No AI recommendations
- No agent connections
- No property manager
- Ad-supported interface
- Price: $0/month

**TIER 2: PREMIUM** ($9.99/month)
- Everything in FREE +
- AI-powered property matching (20 recommendations/month)
- Unlimited property search
- Unlimited Folio Real lookups
- Direct agent connections (WhatsApp)
- Agent messaging (unlimited)
- Saved favorites (unlimited)
- Market trend alerts (3/week)
- Portfolio tracking (up to 3 properties)
- No ads
- Price: $9.99/month (billed monthly) or $89.99/year (save 25%)

**TIER 3: PROFESSIONAL** ($29.99/month)
- Everything in PREMIUM +
- Unlimited AI recommendations
- Advanced property manager (unlimited properties)
- Tenant management + rent tracking
- Maintenance log + cost tracking
- Multiple portfolio management
- Daily market alerts (all regions)
- ROI prediction AI
- Priority agent matching
- Dedicated agent hotline (WhatsApp)
- API access for agents (optional)
- White-label property manager
- Price: $29.99/month (billed monthly) or $269.99/year (save 25%)

### 5.2 Monetization Channels

**Channel 1: Subscription Revenue (Primary)**
- Monthly/annual subscriptions via Stripe + SINPE Móvil
- Pricing optimized for Costa Rica market ($9.99 = ~¢5,300)
- Free tier drives user acquisition
- Premium tier for individual investors
- Professional tier for property managers/agents

**Channel 2: Agent Commissions (Secondary)**
- 5-10% commission on properties sold through app
- Agent listing fees ($0.99/month per listing or 2.5% of sale)
- Agent directory premium placement ($19.99/month for top agent)
- Agent leads subscription (pay-per-lead model)

**Channel 3: Financial Product Partnerships (Future)**
- Mortgage origination referrals (1-2% of loan value)
- Title insurance partnerships (referral fees)
- Property insurance partnerships
- Legal services referrals (notaries, lawyers)

**Channel 4: Data & Analytics (Future)**
- Anonymous market trend data to real estate professionals
- Institutional investor market reports
- API access for agents/brokers

---

## PART 6: 30-DAY LAUNCH PLAN

### WEEK 1: Infrastructure & Backend Setup

**Days 1-3: Firebase Setup & Database Schema**
- [ ] Set up Firebase project (Auth, Firestore, Storage, Functions, Messaging)
- [ ] Design & implement complete Firestore schema
- [ ] Set up authentication (email/phone OTP)
- [ ] Configure Cloud Storage for photos/documents
- [ ] Create sample data in Firestore

**Days 4-7: Backend API Development**
- [ ] Set up Node.js/Express backend (if needed beyond Firebase)
- [ ] Implement authentication endpoints
- [ ] Implement property search endpoints
- [ ] Set up OpenRouter integration for AI
- [ ] Set up Composio integration for WhatsApp

### WEEK 2: React Native App - Core Features

**Days 8-10: Auth & Profile Setup**
- [ ] Create React Native project (Expo)
- [ ] Build sign up/login screens
- [ ] Implement email + phone OTP authentication
- [ ] Build investor profile setup flow (3-step wizard)
- [ ] Connect to Firebase auth

**Days 11-14: Home & Search Screens**
- [ ] Build home/dashboard screen
- [ ] Implement property search screen with filters
- [ ] Connect to property database
- [ ] Build property list view with cards
- [ ] Implement favorite save functionality

### WEEK 3: Property Detail & Tools

**Days 15-17: Property Detail Screen**
- [ ] Build property detail layout with photo gallery
- [ ] Implement all embedded tool buttons
- [ ] Create property info sections (financial, legal, agent)
- [ ] Add agent contact UI

**Days 18-21: Calculator Tools**
- [ ] Build ROI Calculator screen
- [ ] Build Mortgage Calculator screen (with real CR rates)
- [ ] Build Closing Costs Calculator
- [ ] Implement PDF export for all
- [ ] Connect to calculation storage

### WEEK 4: AI Features, Polish & Testing

**Days 22-24: AI Integration & Matching**
- [ ] Integrate OpenRouter API for property matching
- [ ] Build AI recommendations screen
- [ ] Implement preference learning logic
- [ ] Build market alerts system
- [ ] Test AI scoring on sample properties

**Days 25-28: Agent Integration & Automation**
- [ ] Integrate Composio + WhatsApp for agent notifications
- [ ] Build agent contact flow
- [ ] Create messaging screen
- [ ] Build agent directory
- [ ] Test WhatsApp messaging end-to-end

**Days 29-30: Testing, Deployment & Launch**
- [ ] Full QA testing across all screens
- [ ] Firebase deployment + optimization
- [ ] iOS/Android build & signing
- [ ] TestFlight/Google Play beta submission
- [ ] Final bug fixes + launch prep

---

## PART 7: IMPLEMENTATION DETAILS

### 7.1 React Native Project Structure

```
PuraEstate/
├── app.json                  # Expo config
├── App.tsx                   # Root component
├── firebase.config.ts        # Firebase initialization
├── openrouter.config.ts      # OpenRouter config
├── composio.config.ts        # Composio config
│
├── src/
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── Welcome.tsx
│   │   │   ├── SignUp.tsx
│   │   │   ├── SignUpProfile.tsx
│   │   │   ├── Login.tsx
│   │   │   └── OTP.tsx
│   │   ├── home/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── HomeStack.tsx
│   │   │   └── PropertyList.tsx
│   │   ├── search/
│   │   │   ├── Search.tsx
│   │   │   ├── Recommendations.tsx
│   │   │   └── Filters.tsx
│   │   ├── property/
│   │   │   ├── PropertyDetail.tsx
│   │   │   ├── PropertyPhotos.tsx
│   │   │   ├── AgentProfile.tsx
│   │   │   └── ContactAgent.tsx
│   │   ├── tools/
│   │   │   ├── ToolsHub.tsx
│   │   │   ├── ROICalculator.tsx
│   │   │   ├── MortgageCalculator.tsx
│   │   │   ├── ClosingCosts.tsx
│   │   │   ├── PropertyManager.tsx
│   │   │   ├── TenantDetail.tsx
│   │   │   ├── InspectionChecklist.tsx
│   │   │   ├── FolioRealLookup.tsx
│   │   │   ├── MarketHeatmap.tsx
│   │   │   ├── ResidencyGuide.tsx
│   │   │   └── Inspection.tsx
│   │   ├── portfolio/
│   │   │   ├── MyProperties.tsx
│   │   │   └── PortfolioDetail.tsx
│   │   ├── agents/
│   │   │   ├── AgentDirectory.tsx
│   │   │   ├── AgentDetail.tsx
│   │   │   ├── Conversations.tsx
│   │   │   └── Chat.tsx
│   │   ├── analytics/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Heatmap.tsx
│   │   │   └── TrendAnalysis.tsx
│   │   ├── settings/
│   │   │   ├── Settings.tsx
│   │   │   ├── Subscription.tsx
│   │   │   └── Profile.tsx
│   │   └── index.ts
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── Modal.tsx
│   │   ├── property/
│   │   │   ├── PropertyCard.tsx
│   │   │   ├── PropertyGrid.tsx
│   │   │   └── MatchScore.tsx
│   │   ├── calculator/
│   │   │   ├── InputField.tsx
│   │   │   ├── ResultCard.tsx
│   │   │   └── ExportPDF.tsx
│   │   └── index.ts
│   │
│   ├── services/
│   │   ├── firebase/
│   │   │   ├── auth.ts          # Auth functions
│   │   │   ├── firestore.ts     # Database queries
│   │   │   ├── storage.ts       # File storage
│   │   │   ├── functions.ts     # Cloud functions
│   │   │   └── messaging.ts     # Push notifications
│   │   ├── ai/
│   │   │   ├── openrouter.ts    # OpenRouter API
│   │   │   ├── matching.ts      # Matching logic
│   │   │   └── predictions.ts   # ROI prediction
│   │   ├── automation/
│   │   │   ├── composio.ts      # Composio API
│   │   │   ├── alerts.ts        # Alert automation
│   │   │   └── whatsapp.ts      # WhatsApp integration
│   │   ├── property/
│   │   │   ├── search.ts        # Property search
│   │   │   ├── details.ts       # Property details
│   │   │   └── analysis.ts      # AI analysis
│   │   ├── calculators/
│   │   │   ├── roi.ts           # ROI logic
│   │   │   ├── mortgage.ts      # Mortgage logic
│   │   │   └── closing.ts       # Closing costs logic
│   │   └── index.ts
│   │
│   ├── state/
│   │   ├── store.ts             # Redux store
│   │   ├── slices/
│   │   │   ├── auth.ts
│   │   │   ├── properties.ts
│   │   │   ├── user.ts
│   │   │   ├── alerts.ts
│   │   │   └── ui.ts
│   │   └── index.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProperties.ts
│   │   ├── useMatching.ts
│   │   ├── useNotifications.ts
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── currency.ts          # Currency formatting
│   │   ├── dates.ts             # Date utilities
│   │   ├── validation.ts        # Form validation
│   │   ├── pdf.ts               # PDF generation
│   │   └── index.ts
│   │
│   ├── types/
│   │   ├── index.ts             # Type definitions
│   │   ├── property.ts
│   │   ├── user.ts
│   │   ├── agent.ts
│   │   └── calculations.ts
│   │
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   │
│   └── navigation/
│       ├── RootNavigator.tsx
│       ├── AuthNavigator.tsx
│       ├── AppNavigator.tsx
│       └── types.ts
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── package.json
├── tsconfig.json
└── README.md
```

### 7.2 Firebase Cloud Functions (TypeScript Examples)

**Function 1: Analyze New Property**

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { OpenRouter } from 'openrouter-ai';

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_KEY,
});

exports.analyzeNewProperty = functions.firestore
  .document('properties/{propertyId}')
  .onCreate(async (snap, context) => {
    const property = snap.data();
    const { propertyId } = context.params;

    try {
      // 1. Get comparable properties
      const comparables = await getComparableProperties(property);

      // 2. Get market data
      const marketData = await getMarketData(property.canton);

      // 3. AI analysis via OpenRouter
      const analysis = await openrouter.chat.completions.create({
        model: 'openrouter/auto',
        messages: [
          {
            role: 'user',
            content: `Analyze this property investment:
Property: ${JSON.stringify(property)}
Comparables: ${JSON.stringify(comparables)}
Market Data: ${JSON.stringify(marketData)}

Provide: {
  investmentViability: score (0-100),
  roiPotential: {min: number, max: number},
  redFlags: string[],
  comparablePrice: number,
  rentalEstimate: number,
  appreciationPotential: number,
  riskScore: number,
  opportunityScore: number,
  recommendations: string[]
}`
          }
        ],
        temperature: 0.7,
      });

      const analysisResult = JSON.parse(analysis.content);

      // 4. Store analysis in Firestore
      await admin.firestore()
        .collection('properties')
        .doc(propertyId)
        .update({
          aiAnalysis: analysisResult,
          analysisDate: admin.firestore.Timestamp.now(),
          riskScore: analysisResult.riskScore,
          opportunityScore: analysisResult.opportunityScore,
        });

      // 5. Notify matching investors
      await notifyMatchingInvestors(property, analysisResult);

      console.log(`Property ${propertyId} analyzed successfully`);
    } catch (error) {
      console.error(`Error analyzing property ${propertyId}:`, error);
      throw error;
    }
  });

async function getComparableProperties(property: any) {
  const snapshot = await admin.firestore()
    .collection('properties')
    .where('canton', '==', property.canton)
    .where('type', '==', property.type)
    .where('price', '>=', property.price * 0.8)
    .where('price', '<=', property.price * 1.2)
    .limit(5)
    .get();

  return snapshot.docs.map(doc => doc.data());
}

async function getMarketData(canton: string) {
  const doc = await admin.firestore()
    .collection('market_data')
    .doc(canton)
    .get();

  return doc.data();
}

async function notifyMatchingInvestors(property: any, analysis: any) {
  // Find investors whose preferences match this property
  const investorsSnapshot = await admin.firestore()
    .collection('users')
    .where('subscription.tier', 'in', ['PREMIUM', 'PROFESSIONAL'])
    .get();

  for (const investorDoc of investorsSnapshot.docs) {
    const investor = investorDoc.data();
    const match = calculateMatch(property, analysis, investor);

    if (match.score > 70) {
      // Send push notification
      await admin.messaging().send({
        token: investor.deviceToken,
        notification: {
          title: 'New Property Match!',
          body: `${property.address} - ${match.score}% match to your preferences`,
        },
        data: {
          propertyId: property.id,
          matchScore: match.score.toString(),
        },
      });

      // Store alert in Firestore
      await admin.firestore()
        .collection('alerts')
        .doc(investorDoc.id)
        .collection('items')
        .add({
          type: 'property_match',
          propertyId: property.id,
          matchScore: match.score,
          timestamp: admin.firestore.Timestamp.now(),
          read: false,
        });
    }
  }
}

function calculateMatch(property: any, analysis: any, investor: any): any {
  let score = 0;

  // Budget match
  if (property.price >= investor.minBudget &&
      property.price <= investor.maxBudget) {
    score += 25;
  }

  // ROI match
  if (analysis.roiPotential.min >= investor.roiTarget) {
    score += 25;
  }

  // Region match
  if (investor.preferredRegions.includes(property.region)) {
    score += 20;
  }

  // Type match
  if (investor.propertyTypes.includes(property.type)) {
    score += 15;
  }

  // Risk match
  if (analysis.riskScore <= investor.riskTolerance) {
    score += 15;
  }

  return { score: Math.min(score, 100) };
}
```

**Function 2: Send Market Alerts**

```typescript
exports.sendMarketAlerts = functions.pubsub
  .schedule('0 8 * * *') // Daily at 8 AM
  .timeZone('America/Costa_Rica')
  .onRun(async (context) => {
    try {
      // 1. Get yesterday's market data
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const cantonSnapshots = await admin.firestore()
        .collection('market_data')
        .get();

      for (const doc of cantonSnapshots.docs) {
        const marketData = doc.data();

        // Check for significant changes
        const priceChange = calculatePriceChange(marketData);
        const demandChange = calculateDemandChange(marketData);

        // Find investors interested in this canton
        const investors = await admin.firestore()
          .collection('users')
          .where('preferences.regions', 'array-contains', doc.id)
          .get();

        for (const investorDoc of investors.docs) {
          const investor = investorDoc.data();

          if (priceChange > 2 || demandChange > 10) {
            // Send alert
            await admin.messaging().send({
              token: investor.deviceToken,
              notification: {
                title: `Market Alert: ${doc.id}`,
                body: `Prices ${priceChange > 0 ? 'up' : 'down'} ${Math.abs(priceChange)}%`,
              },
            });
          }
        }
      }

      console.log('Market alerts sent successfully');
    } catch (error) {
      console.error('Error sending market alerts:', error);
      throw error;
    }
  });
```

**Function 3: Contact Agent (WhatsApp Notification)**

```typescript
exports.contactAgent = functions.https.onCall(async (data, context) => {
  const { propertyId, investorId, agentId } = data;

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User not authenticated');
  }

  try {
    // 1. Get investor, agent, and property data
    const [investorDoc, agentDoc, propertyDoc] = await Promise.all([
      admin.firestore().collection('users').doc(investorId).get(),
      admin.firestore().collection('agents').doc(agentId).get(),
      admin.firestore().collection('properties').doc(propertyId).get(),
    ]);

    const investor = investorDoc.data();
    const agent = agentDoc.data();
    const property = propertyDoc.data();

    // 2. Qualify the lead
    const leadScore = await qualifyLead(investor);

    // 3. Send WhatsApp message via Composio
    const whatsappMessage = `
🔔 New Investor Interest!

Property: ${property.address}
Price: $${property.price.toLocaleString()}

Investor: ${investor.name}
Budget: $${investor.budget.toLocaleString()}
ROI Target: ${investor.roiTarget}%

Contact: ${investor.phone}
Email: ${investor.email}

Lead Quality: ${leadScore}/100

Reply in PuraEstate app to connect.
`;

    await sendViaComposio('whatsapp', {
      to: agent.whatsappNumber,
      message: whatsappMessage,
      metadata: {
        investorId,
        propertyId,
        agentId,
      },
    });

    // 4. Create conversation record
    await admin.firestore()
      .collection('conversations')
      .add({
        investorId,
        agentId,
        propertyId,
        initiated: true,
        timestamp: admin.firestore.Timestamp.now(),
        status: 'active',
      });

    // 5. Notify investor
    await admin.messaging().send({
      token: investor.deviceToken,
      notification: {
        title: `${agent.name} from ${agent.company}`,
        body: `Contacted about ${property.address}. Waiting for response...`,
      },
    });

    return { success: true, message: 'Agent contacted successfully' };
  } catch (error) {
    console.error('Error contacting agent:', error);
    throw new functions.https.HttpsError('internal', 'Failed to contact agent');
  }
});

async function qualifyLead(investor: any): Promise<number> {
  let score = 0;

  // Profile completeness
  if (investor.profileComplete) score += 25;

  // Investment history (if available)
  if (investor.propertiesOwned && investor.propertiesOwned > 0) score += 25;

  // Engagement (days active, etc.)
  const daysSinceSignup =
    (Date.now() - investor.createdAt.toMillis()) / (1000 * 60 * 60 * 24);
  if (daysSinceSignup < 7) score += 20; // Fresh signup = higher urgency
  else if (daysSinceSignup < 30) score += 15;

  // Subscription tier
  if (investor.subscription.tier === 'PROFESSIONAL') score += 20;
  else if (investor.subscription.tier === 'PREMIUM') score += 15;

  return Math.min(score, 100);
}

async function sendViaComposio(
  platform: string,
  message: any
): Promise<void> {
  // Implementation would use Composio SDK
  // This is a placeholder
  console.log(`Sending via ${platform}:`, message);
}
```

---

## PART 8: KEY FEATURES SUMMARY TABLE

| Feature | FREE | PREMIUM | PROFESSIONAL |
|---------|------|---------|--------------|
| ROI Calculator | ✓ | ✓ | ✓ |
| Mortgage Calculator | ✓ | ✓ | ✓ |
| Closing Costs | ✓ | ✓ | ✓ |
| Folio Real Lookup | 5/mo | Unlimited | Unlimited |
| Residency Guide | ✓ | ✓ | ✓ |
| Market Heatmap | Basic | Full | Full |
| Inspection Checklist | ✓ | ✓ | ✓ |
| Property Search | 20/day | Unlimited | Unlimited |
| AI Matching | ✗ | 20/mo | Unlimited |
| Agent Connections | ✗ | ✓ | ✓ + Priority |
| Property Manager | ✗ | Up to 3 | Unlimited |
| Rent/Tenant Tracking | ✗ | Basic | Full |
| Market Alerts | ✗ | 3/week | Daily |
| ROI Predictions | ✗ | ✗ | ✓ |
| Price | Free | $9.99/mo | $29.99/mo |

---

## PART 9: SUCCESS METRICS & KPIs

**Launch Phase (Month 1-3):**
- User acquisition: 5,000 downloads
- Free-to-Premium conversion: 8%
- Premium-to-Professional upsell: 15%
- Monthly recurring revenue: $6,500+

**Growth Phase (Month 4-12):**
- User base: 50,000+
- Monthly active users: 15,000+
- Overall subscription rate: 12%
- Monthly recurring revenue: $75,000+
- Agent partnerships: 500+

**Maturity Phase (Year 2):**
- User base: 100,000+
- Properties listed: 10,000+
- Properties sold through app: 1,000+
- MRR: $300,000+

---

## PART 10: COMPETITIVE ADVANTAGES

1. **Mobile-First**: Only mobile real estate app in Costa Rica
2. **AI-Powered**: First AI-matching platform for CR real estate
3. **All-in-One**: 10 tools in one app (vs. scattered websites)
4. **Agent Integration**: WhatsApp automation reduces friction
5. **Cost**: $9.99/mo vs. $30-50+ for competitor tools separately
6. **Local**: Designed specifically for Costa Rica market
7. **Offline**: Core tools work without internet
8. **Privacy**: User owns their data, not a portal dependency

---

## CONCLUSION

The PuraEstate Mobile App blueprint is ready for development. Key next steps:

1. **Weeks 1-2:** Firebase setup + React Native foundation
2. **Weeks 3-4:** Core features + AI integration
3. **Week 5:** Testing + launch prep
4. **Target Launch:** Day 30

**Total Development Cost Estimate:** $80,000-150,000 (depending on team size)
**Projected Launch Date:** Early March 2026
**Target First-Year Users:** 50,000+
**Target First-Year Revenue:** $500,000+

The app fills a genuine market gap for mobile real estate investment tools in Costa Rica with AI-powered matching and agent integration—positioning PuraEstate as the market leader in this space.
