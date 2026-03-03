# Puraestate Mobile App - Complete Design Specification

**Version:** 1.0
**Platform:** React Native (iOS & Android)
**Release Date:** Q2 2026
**Last Updated:** 2026-02-24

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Brand Identity & Design System](#brand-identity--design-system)
3. [Architecture Overview](#architecture-overview)
4. [Feature Specifications](#feature-specifications)
5. [Screen Flows & UI Design](#screen-flows--ui-design)
6. [AI & Automation Integration](#ai--automation-integration)
7. [Mobile-Specific Capabilities](#mobile-specific-capabilities)
8. [Technical Implementation](#technical-implementation)
9. [Performance & UX Optimization](#performance--ux-optimization)
10. [Development Roadmap](#development-roadmap)

---

## Executive Summary

**Puraestate Mobile** is a premium real estate marketplace mobile application that brings the desktop experience to mobile while introducing AI-enhanced features and native mobile capabilities. The app enables users to discover, manage, and transact on high-end properties with intelligent matching, real-time notifications, and frictionless booking experiences.

### Key Objectives
- Maintain brand consistency while optimizing for mobile-first interaction
- Reduce time-to-action from 5+ steps to 2-3 taps
- Leverage AI for personalized property recommendations
- Enable offline-first data access for seamless experience
- Implement push notifications for market-driven opportunities
- Integrate native mobile capabilities (camera, biometrics, location)

### Target Users
- Luxury property buyers/sellers
- Real estate agents/brokers
- Property managers
- Investors
- Renters seeking premium accommodations

---

## Brand Identity & Design System

### Color Palette

#### Primary Colors
| Color | Hex | Usage |
|-------|-----|-------|
| **Puraestate Navy** | `#1A2B3D` | Primary headers, buttons, navigation |
| **Gold Accent** | `#D4AF37` | Premium highlights, CTAs, success states |
| **Warm White** | `#F8F7F2` | Backgrounds, card surfaces |
| **Light Gray** | `#E8E6E1` | Borders, dividers, subtle elements |

#### Secondary Colors
| Color | Hex | Usage |
|-------|-----|-------|
| **Deep Teal** | `#2E5A6E` | Secondary buttons, alternative actions |
| **Sage Green** | `#A8B89F` | Eco-friendly/sustainability features |
| **Coral Red** | `#E74C3C` | Error states, alerts, urgent notifications |
| **Success Green** | `#27AE60` | Confirmations, successful transactions |

#### Semantic Colors
- **Error:** `#E74C3C` (Coral Red)
- **Warning:** `#F39C12` (Amber)
- **Success:** `#27AE60` (Green)
- **Info:** `#3498DB` (Blue)

### Typography

#### Font Family: **Inter** (Primary) + **Georgia** (Accent)
- **Inter:** Modern, clean sans-serif for body text and UI
- **Georgia:** Serif accent font for premium headings and quotes

#### Font Sizes & Hierarchy
```
Display 1 (Hero):     32px / Bold / Line Height 1.2
Display 2 (Section):  28px / Bold / Line Height 1.3
Heading 1:            24px / Bold / Line Height 1.4
Heading 2:            20px / Semi-bold / Line Height 1.4
Heading 3:            18px / Semi-bold / Line Height 1.4
Body Large:           16px / Regular / Line Height 1.5
Body Regular:         14px / Regular / Line Height 1.5
Body Small:           12px / Regular / Line Height 1.4
Caption:              11px / Regular / Line Height 1.3
Overline:             11px / Bold / Line Height 1.2 / Uppercase
```

### Logo & Icon System

#### Logo Variants
- **Primary Logo:** Full wordmark with icon (for headers/splash)
- **Icon Only:** Monogram for app icon and small spaces
- **Horizontal Lock-up:** Logo + tagline (landing screens)
- **Vertical Lock-up:** Stacked layout (small screens)

#### Icon System
- **Style:** Rounded corners (2-4px radius)
- **Weight:** 2px stroke for consistency
- **Grid:** 24px × 24px (mobile standard)
- **Categories:**
  - Navigation icons (home, search, profile)
  - Feature icons (properties, messages, calendar)
  - Action icons (save, share, filter)
  - Status icons (verified, premium, new)

### Spacing & Layout

#### Spacing Scale (Base 8px)
```
XS: 4px
SM: 8px
MD: 16px
LG: 24px
XL: 32px
2XL: 48px
3XL: 64px
```

#### Safe Areas
- **Top:** 44px (status bar) + 16px padding
- **Bottom:** 34px (home indicator) + 16px padding
- **Sides:** 16px padding minimum

#### Card Design
- **Border Radius:** 12px
- **Elevation:** 2px shadow (light mode) / 8px shadow (dark emphasis)
- **Padding:** 16px inside
- **Margin:** 12px between cards

---

## Architecture Overview

### Technology Stack

#### Frontend
- **Framework:** React Native 0.73+
- **State Management:** Redux Toolkit + Redux Persist
- **Navigation:** React Navigation 6.x (Bottom Tabs + Stack)
- **UI Components:** React Native Paper 5.x + custom components
- **HTTP Client:** Axios with interceptors
- **Local Database:** SQLite (via react-native-sqlite-storage)
- **Real-time:** Socket.io-client or WebSocket
- **Animations:** React Native Reanimated 3.x
- **Image Handling:** Image Cache Manager + Cloudinary SDK

#### Backend Integration Points
- **REST API:** Node.js/Express backend (existing puraestate)
- **Real-time Database:** Firebase Realtime DB or custom WebSocket
- **File Storage:** AWS S3 / Cloudinary
- **Push Notifications:** Firebase Cloud Messaging (FCM) / APNs

#### External Services
- **AI/LLM:** OpenRouter (gpt-4 turbo for descriptions, Claude for matching)
- **Automation Platform:** Composio (workflow orchestration)
- **Payment Processing:** Stripe / PayPal SDK
- **Maps:** Google Maps API
- **Authentication:** Firebase Auth + custom JWT
- **Analytics:** Firebase Analytics + Segment

### App Structure

```
puraestate-mobile/
├── ios/
├── android/
├── src/
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── AuthStack.tsx
│   │   ├── MainStack.tsx
│   │   └── LinkingConfiguration.tsx
│   ├── screens/
│   │   ├── auth/
│   │   ├── discover/
│   │   ├── search/
│   │   ├── profile/
│   │   ├── messages/
│   │   ├── bookings/
│   │   └── admin/
│   ├── components/
│   │   ├── cards/
│   │   ├── common/
│   │   ├── forms/
│   │   ├── modals/
│   │   └── navigation/
│   ├── services/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── notifications/
│   │   ├── storage/
│   │   └── ai/
│   ├── redux/
│   │   ├── slices/
│   │   ├── thunks/
│   │   └── store.ts
│   ├── utils/
│   ├── hooks/
│   ├── types/
│   ├── constants/
│   └── App.tsx
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── app.json
├── package.json
└── tsconfig.json
```

---

## Feature Specifications

### Core Features

#### 1. Authentication & Onboarding

**Login/Signup Flows:**
- Email/Password authentication
- Social login (Google, Apple, Facebook)
- Biometric login (Face ID, Touch ID)
- Phone number verification
- Two-factor authentication (optional)
- Remember device option

**Onboarding Steps:**
1. Welcome screen (brand intro)
2. Account creation (email or social)
3. Profile setup (name, photo, type: buyer/seller/agent)
4. Preferences (property types, price range, location)
5. Permission grants (location, notifications, camera)
6. App tour (5 key screens)

**User Types:**
- **Buyers:** Browse, save, schedule viewings
- **Sellers/Agents:** List properties, manage inquiries, analytics
- **Property Managers:** Manage multiple listings, tenant communications
- **Investors:** Portfolio tracking, deal analysis

#### 2. Property Discovery & Search

**Discover Screen (Home Tab)**
- Personalized property recommendations
- AI-matched properties based on history
- Trending properties in user's area
- Featured/premium listings
- Recent view history (offline-cached)
- Filters panel overlay

**Search Screen**
- Full-text search (property address, neighborhood)
- Advanced filters:
  - Property type (apartment, house, commercial)
  - Price range (min-max slider)
  - Bedrooms/bathrooms quick select
  - Square footage range
  - Amenities multi-select
  - Listing status (for sale, for rent, sold)
  - Dates (listed after, open house)
  - Agent/agency name
- Map view toggle (Google Maps integration)
- List view (vertical scroll)
- Grid view (2-column cards)
- Sort options (newest, price, relevance, distance)
- Search history save
- Saved searches with alerts

**Property Listing Card**
- High-quality image carousel (swipe)
- Property headline
- Address with distance badge
- Price display (with sale/rent badge)
- Quick info (beds, baths, sqft, lot size)
- Property type icon
- Agent/seller photo + name
- Save/heart button
- Share button
- Verification badge (if applicable)

**Property Detail Screen**
- Full image gallery (20+ images)
- Image upload button (agents/sellers)
- Property headline + description
- Address + map embed
- Price + financing calculator
- Detailed specifications
  - Structure info (year built, sqft, lot size)
  - Amenities checklist
  - HOA/taxes/insurance estimates
- Agent/seller card (photo, name, contact options)
- Floor plans (if available)
- 3D tour link (Matterport, Zillow 3D)
- Video tour (if available)
- Ownership history (if applicable)
- Tax history chart
- Neighborhood info (schools, walkability)
- Similar properties carousel
- Review section (if rental)
- Action buttons:
  - "Schedule Viewing"
  - "Make Offer" (sales)
  - "Apply" (rentals)
  - "Contact Agent"
  - "Share"
  - "Save"

#### 3. Booking & Transaction Flow

**Schedule Viewing**
- Calendar picker (availability from agent)
- Time slot selection
- Duration option (30min/1hr)
- Tour type (in-person, virtual, video call)
- Notes field
- Confirmation with agent details
- Automatic reminder notifications

**Make Offer (Sales)**
- Quick offer form:
  - Offer price
  - Earnest money amount
  - Proposed closing date
  - Contingencies (inspection, appraisal)
  - Personal note to seller
- Document upload (pre-approval letter)
- Signature pad (e-signature integration)
- Offer submission tracking
- Counter-offer notifications

**Apply (Rentals)**
- Application form:
  - Personal info (prefilled from profile)
  - Employment verification
  - Income documentation
  - Rental history
  - References
- Background check authorization
- Move-in date preference
- Application status tracking

**Payment Integration**
- In-app payment processing (for service fees)
- Multiple payment methods:
  - Credit/debit cards
  - Digital wallets (Apple Pay, Google Pay)
  - Bank transfer (ACH)
- Secure PCI-compliant payment flow
- Transaction history
- Receipts/invoices generation

#### 4. Profile & Preferences

**User Profile Screen**
- Profile photo (editable, camera/gallery)
- Name, email, phone
- User type badge
- Verification status
- Bio/headline (agents)
- Contact information
- Address (saved locations)
- Profile settings access

**Saved Properties**
- Organized by lists/folders
- Rename/create lists
- Move between lists
- Delete saves
- Share lists with others
- Price change alerts

**Preferences**
- Notification settings:
  - Push notifications (toggle)
  - Email notifications (toggle)
  - SMS notifications (toggle)
  - Alert types (new listings, price drops, open houses)
- Property preferences:
  - Saved searches
  - Saved filters
  - Location preferences (map radius)
- Privacy settings:
  - Profile visibility
  - Activity visibility
  - Data collection opt-out
- Dark mode toggle
- Language selection

**Account Settings**
- Change password
- Two-factor authentication
- Active sessions
- Linked accounts (social logins)
- Data export
- Delete account

#### 5. Messaging & Communication

**Messages Tab**
- Conversation list (sorted by recency)
- Unread count badge
- Last message preview
- Agent avatar + name
- Timestamp
- Search conversations
- Archive/mute options

**Chat Screen**
- Conversation header (agent info, call button)
- Message history (infinite scroll)
- Message input field
- Emoji picker
- Photo/document upload
- Voice message recording
- Read receipts
- Typing indicator
- Quick reply suggestions

**Notifications**
- Push notification center
- In-app notification banner
- Notification types:
  - Message alerts
  - Booking reminders
  - Price changes
  - New listings (saved search)
  - Open houses
  - Offers/counter-offers
  - Application status updates
  - Admin alerts

#### 6. Bookings & Calendar

**My Bookings Screen**
- Upcoming viewings (sorted by date)
- Past viewings (archived)
- Calendar view toggle
- Booking details:
  - Property address
  - Date/time
  - Duration
  - Agent name/contact
  - Tour type (in-person/virtual)
- Action buttons:
  - "Directions" (maps integration)
  - "Call Agent"
  - "Message Agent"
  - "Join Virtual Tour" (video call link)
  - "Reschedule"
  - "Cancel"

**Calendar View**
- Month/week/day toggle
- Booked slots highlighted
- Tap to view details
- Add notes to bookings
- Integration with device calendar (iOS Calendar, Google Calendar)

#### 7. Agent/Seller Dashboard (Admin Panel)

**Seller Dashboard**
- Property listings management
- Create new listing wizard
- Edit existing listings
- Listing statistics:
  - Views (chart)
  - Saves/favorites count
  - Contact requests
  - Showings booked
  - Lead management
- Leads/inquiries panel:
  - New inquiries (list)
  - Contact info
  - Inquiry type (viewing request, offer, question)
  - Response status
  - Quick reply templates
- Analytics dashboard:
  - Listing performance
  - Traffic source breakdown
  - Conversion funnel
  - ROI metrics

**Agent Dashboard**
- Manage multiple client properties
- Portfolio view (all listings)
- Commission tracking
- Transaction history
- Client communications
- Scheduling interface
- Document repository

---

## Screen Flows & UI Design

### User Journey Map

```
┌─────────────────────────────────────────────────────────────────┐
│                         ONBOARDING FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│  Splash → Auth Selection → Login/Signup → Profile Setup →       │
│  Preferences → Permissions → App Tour → Home                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      PROPERTY DISCOVERY FLOW                     │
├─────────────────────────────────────────────────────────────────┤
│  Home → Browse/Search → Property Card → Property Detail →       │
│  Schedule Viewing / Make Offer / Contact Agent                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    TRANSACTION FLOW (Sales)                      │
├─────────────────────────────────────────────────────────────────┤
│  Property Detail → Make Offer → Offer Form → Payment →          │
│  E-signature → Offer Submitted → Tracking → Closed              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    COMMUNICATION FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│  Messages Tab → Conversation → Chat → Send Message →            │
│  Schedule Follow-up → Notifications                             │
└─────────────────────────────────────────────────────────────────┘
```

### Bottom Tab Navigation

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                        MAIN CONTENT AREA                         │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  [Home]  [Search]  [Messages]  [Bookings]  [Profile]            │
│  [Icon]  [Icon]    [Icon]      [Icon]      [Icon]               │
│  (2 unread)                                                      │
│                        Unread Badge: 3                          │
└──────────────────────────────────────────────────────────────────┘
```

### Screen Breakdown

#### Tab 1: Home (Discover)

```
┌──────────────────────────────────────┐
│  ☀️ 14°F Neighborhood, CA             │  Status Bar
├──────────────────────────────────────┤
│  ✌️ Welcome back, Sarah!              │  Greeting
│  See 4 new listings matching your    │
│  preferences                         │
├──────────────────────────────────────┤
│  [Filter] [Sort] [List/Map]          │  Action Buttons
├──────────────────────────────────────┤
│  ┌─ Personalized For You ────────┐   │
│  │ ┌────────────────────────────┐ │   │
│  │ │ [Image Carousel]           │ │   │
│  │ │ 3456 Oak Street            │ │   │
│  │ │ $1.2M • 4BR 3BA • 3,500sqft│ │   │  Property Card
│  │ │ ♥ Share Contact Agent      │ │   │
│  │ └────────────────────────────┘ │   │
│  │ ┌────────────────────────────┐ │   │
│  │ │ (next property)            │ │   │
│  │ └────────────────────────────┘ │   │
│  └────────────────────────────────┘   │
├──────────────────────────────────────┤
│  ┌─ Trending In Your Area ───────┐   │
│  │ [Similar card carousel]       │   │
│  └────────────────────────────────┘   │
├──────────────────────────────────────┤
│  ┌─ Open Houses This Weekend ────┐   │
│  │ [Same card structure]         │   │
│  └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

#### Tab 2: Search

```
┌──────────────────────────────────────┐
│  Search Properties                   │  Header
├──────────────────────────────────────┤
│  ┌──────────────────────────────┐   │
│  │ 🔍 Address or neighborhood   │   │  Search Bar
│  └──────────────────────────────┘   │
├──────────────────────────────────────┤
│  [Advanced Filters ▼]                │  Filter Toggle
├──────────────────────────────────────┤
│  ┌─ Filter Panel (Collapsed) ────┐   │
│  │ Property Type  [Apartment ▼]  │   │
│  │ Price Range    [$200K - $2M]  │   │
│  │ Bedrooms       [2] [3] [4+]   │   │  Expanded View
│  │ Bathrooms      [1] [2] [3+]   │   │
│  │ Amenities      [🏊][🏋️]...    │   │
│  │ [Apply Filters] [Clear All]   │   │
│  └────────────────────────────────┘   │
├──────────────────────────────────────┤
│  Showing 147 properties               │  Results Count
│  [List] [Grid] [Map]                 │  View Options
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │ Search Result Cards (scroll)   │  │  Results
│  │ • 3456 Oak Street - $1.2M      │  │
│  │ • 789 Elm Avenue - $850K       │  │
│  │ • 321 Main Road - $1.5M        │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

#### Tab 3: Messages

```
┌──────────────────────────────────────┐
│  Messages                            │  Header
├──────────────────────────────────────┤
│  ┌──────────────────────────────┐   │
│  │ 🔍 Search conversations      │   │  Search Bar
│  └──────────────────────────────┘   │
├──────────────────────────────────────┤
│  ┌─ Conversation List ───────────┐   │
│  │ ┌──────────────────────────┐  │   │
│  │ │ [Agent Avatar]           │  │   │
│  │ │ John Smith, Luxury Homes │  │   │  Message Card
│  │ │ Last message: "Great!..." │  │   │ (swipe options)
│  │ │ 2 min ago    [Badge: 2]  │  │   │
│  │ └──────────────────────────┘  │   │
│  │ ┌──────────────────────────┐  │   │
│  │ │ (next conversation)      │  │   │
│  │ └──────────────────────────┘  │   │
│  └────────────────────────────────┘   │
├──────────────────────────────────────┤
│  New Inquiry from Search Results     │  Section
│  ┌──────────────────────────────┐   │
│  │ Sarah Williams (Buyer)       │   │
│  │ "Interested in your listing" │   │
│  │ [Accept] [Decline]           │   │
│  └──────────────────────────────┘   │
└──────────────────────────────────────┘
```

#### Tab 4: Bookings/Calendar

```
┌──────────────────────────────────────┐
│  My Viewings                         │  Header
│  [Calendar] [List]                   │  Toggle Views
├──────────────────────────────────────┤
│  ┌─ Calendar View ───────────────┐   │
│  │  February 2026                │   │
│  │  S  M  T  W  T  F  S         │   │
│  │           1  2  3  4  5       │   │  Calendar
│  │  6  7 [8] 9  10 11 12       │   │  (Booked: 8, 15)
│  │  13 14 [15]16 17 18 19       │   │
│  │  20 21 22 23 24 25 26       │   │
│  │  27 28                       │   │
│  └────────────────────────────────┘   │
├──────────────────────────────────────┤
│  ┌─ Upcoming (Selected Day) ─────┐   │
│  │ ┌──────────────────────────┐  │   │
│  │ │ Saturday, Feb 8          │  │   │
│  │ │ 2:00 PM - 3:00 PM       │  │   │  Booking Card
│  │ │ 3456 Oak Street          │  │   │
│  │ │ John Smith, Luxury Homes │  │   │
│  │ │ [Directions] [Call] [Map]│  │   │
│  │ └──────────────────────────┘  │   │
│  │ ┌──────────────────────────┐  │   │
│  │ │ Sunday, Feb 9            │  │   │
│  │ │ (next booking)           │  │   │
│  │ └──────────────────────────┘  │   │
│  └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

#### Tab 5: Profile

```
┌──────────────────────────────────────┐
│  Profile Settings                    │  Header
├──────────────────────────────────────┤
│  ┌─ User Info ───────────────────┐   │
│  │ [Profile Photo - Tap to Edit]  │   │
│  │ Sarah Johnson                  │   │
│  │ sarah@example.com              │   │  Profile Section
│  │ (555) 123-4567                 │   │
│  │ [Verified Buyer ✓]             │   │
│  └────────────────────────────────┘   │
├──────────────────────────────────────┤
│  ┌─ Quick Links ─────────────────┐   │
│  │ [♥ Saved Properties]           │   │
│  │ [📄 Active Offers]             │   │  Quick Access
│  │ [💬 Help & Support]            │   │
│  └────────────────────────────────┘   │
├──────────────────────────────────────┤
│  Settings                            │  Section Header
│  ┌─────────────────────────────────┐ │
│  │ Notifications          [Toggle] │ │
│  │ Dark Mode              [Toggle] │ │  Settings Items
│  │ Language               [English]│ │
│  │ Privacy & Security     [>]      │ │
│  │ About & Legal          [>]      │ │
│  └─────────────────────────────────┘ │
├──────────────────────────────────────┤
│  [Sign Out]  [Delete Account]        │  Action Buttons
└──────────────────────────────────────┘
```

#### Property Detail Screen (Full Page)

```
┌──────────────────────────────────────┐
│ < 3456 Oak Street          [Share] ♥ │  Header
├──────────────────────────────────────┤
│ ┌────────────────────────────────┐   │
│ │  [← Image Carousel →]          │   │
│ │  (High-res images, swipe)      │   │  Image Gallery
│ │  [20 images] [Floor Plans] [📹]│   │
│ └────────────────────────────────┘   │
├──────────────────────────────────────┤
│ $1,200,000 | For Sale                │
│ 4 Beds | 3 Baths | 3,500 sqft        │  Key Details
│ 0.75 acres | Built 2015              │
├──────────────────────────────────────┤
│ ┌─ Listing Agent ──────────────────┐ │
│ │ [Avatar] John Smith              │ │
│ │ Luxury Homes Realty              │ │  Agent Card
│ │ ⭐ 4.9 (234 reviews)             │ │
│ │ [Call] [Message] [More Info]     │ │
│ └──────────────────────────────────┘ │
├──────────────────────────────────────┤
│ ┌─ Description ────────────────────┐ │
│ │ Beautiful 4-bedroom home in      │ │
│ │ prestigious Oak Valley estates...│ │
│ │ [Show More]                      │ │
│ └──────────────────────────────────┘ │
├──────────────────────────────────────┤
│ ┌─ Amenities ──────────────────────┐ │
│ │ 🏊 Swimming Pool  🏋️ Gym         │ │
│ │ 🚗 2-Car Garage   🌳 Large Lot  │ │
│ │ 🏡 Gated Entry    🔐 Security   │ │
│ │ ♿ Accessible     🌳 Landscaping │ │
│ └──────────────────────────────────┘ │
├──────────────────────────────────────┤
│ ┌─ Location ───────────────────────┐ │
│ │ [Google Maps Embed]              │ │
│ │ ┌──────────────────────────────┐ │ │
│ │ │ Map with property pin        │ │ │
│ │ └──────────────────────────────┘ │ │
│ │ Neighborhood Info:               │ │
│ │ • Top-rated schools nearby       │ │
│ │ • Walkability Score: 78/100      │ │
│ │ • Average home value: $1.1M      │ │
│ └──────────────────────────────────┘ │
├──────────────────────────────────────┤
│ ┌─ Financing Calculator ──────────┐ │
│ │ Price: $1,200,000               │ │
│ │ Down Payment: [20%] $240,000     │ │
│ │ Loan Amount: $960,000            │ │
│ │ Monthly Payment: $5,847*         │ │
│ │ *At 6% APR, 30 years             │ │
│ └──────────────────────────────────┘ │
├──────────────────────────────────────┤
│ ┌─ Similar Properties ────────────┐ │
│ │ [Horizontal Carousel]            │ │
│ │ • $1.1M - 4BR near you          │ │
│ │ • $1.3M - 5BR in neighborhood   │ │
│ └──────────────────────────────────┘ │
├──────────────────────────────────────┤
│ [Schedule Viewing] [Make Offer]      │  Action Buttons
│ [Contact Agent]    [Save Property]   │  (Sticky Bottom)
└──────────────────────────────────────┘
```

#### Schedule Viewing Modal

```
┌──────────────────────────────────────┐
│ ✕ Schedule a Viewing                 │
├──────────────────────────────────────┤
│ 3456 Oak Street                      │
│ with John Smith                      │
├──────────────────────────────────────┤
│ Tour Type:                           │
│ ○ In-Person  ○ Virtual  ○ Video Call │
├──────────────────────────────────────┤
│ Select Date:                         │
│ ┌──────────────────────────────────┐ │
│ │ [Calendar Picker - Shows Agent   │ │
│ │  Available Times Only]           │ │
│ │ ┌─ Saturday, Feb 8 ────────────┐ │ │
│ │ │ [2:00 PM] [3:00 PM] [4:00 PM]│ │ │
│ │ └──────────────────────────────┘ │ │
│ │ ┌─ Sunday, Feb 9 ──────────────┐ │ │
│ │ │ [10:00 AM] [11:00 AM] [12 PM]│ │ │
│ │ └──────────────────────────────┘ │ │
│ └──────────────────────────────────┘ │
├──────────────────────────────────────┤
│ Duration:  [30 minutes] ▼            │
├──────────────────────────────────────┤
│ Notes (optional):                    │
│ ┌──────────────────────────────────┐ │
│ │ I'm interested in the kitchen... │ │
│ └──────────────────────────────────┘ │
├──────────────────────────────────────┤
│ [Cancel]           [Confirm Viewing] │
└──────────────────────────────────────┘
```

#### Make Offer Form

```
┌──────────────────────────────────────┐
│ ✕ Make an Offer                      │
├──────────────────────────────────────┤
│ Property: 3456 Oak Street            │
│ List Price: $1,200,000               │
├──────────────────────────────────────┤
│ Your Offer Details:                  │
├──────────────────────────────────────┤
│ Offer Price: [$___________]          │
│ Earnest Money Deposit: [$___________]│
│ Proposed Closing Date: [Date Picker] │
├──────────────────────────────────────┤
│ Contingencies:                       │
│ ☑ Home Inspection                    │
│ ☑ Appraisal                          │
│ ☑ Financing                          │
│ ☐ Appraisal Guarantee                │
│ ☐ Selling Current Home                │
├──────────────────────────────────────┤
│ Personal Note to Seller:             │
│ ┌──────────────────────────────────┐ │
│ │ "We love this home and plan to..." │ │
│ └──────────────────────────────────┘ │
├──────────────────────────────────────┤
│ Upload Pre-Approval Letter:          │
│ [+ Add Document]                     │
├──────────────────────────────────────┤
│ ☐ I agree to the terms               │
│ [Cancel]           [Review & Submit] │
└──────────────────────────────────────┘
```

#### Admin Seller Dashboard

```
┌──────────────────────────────────────┐
│  My Listings                         │
│  [+ New Listing] [Analytics]         │  Header
├──────────────────────────────────────┤
│ Active Listings: 3                   │  Stats
│ Total Views: 1,247  |  This Week: 89 │
│ Average Days Listed: 18              │
├──────────────────────────────────────┤
│ ┌─ 3456 Oak Street ────────────────┐ │
│ │ $1,200,000 | Listed 18 days ago  │ │  Listing Card
│ │ 👁️ 287 views | ♥ 54 saves        │ │  (Swipe for more)
│ │ 📞 12 inquiries | ✓ 8 scheduled   │ │
│ │ Status: [Active ▼]               │ │
│ │ [Edit] [Photos] [Share] [Analyze]│ │
│ └────────────────────────────────────┘ │
│ ┌─ 789 Elm Avenue ──────────────────┐ │
│ │ (next listing)                   │ │
│ └────────────────────────────────────┘ │
├──────────────────────────────────────┤
│ ┌─ Recent Inquiries ────────────────┐ │
│ │ ▶ New (2)                        │ │
│ │   • Sarah Williams - Viewing Req │ │
│ │   • Mike Johnson - Price Q.      │ │
│ │ • Responded (5)                  │ │
│ └────────────────────────────────────┘ │
└──────────────────────────────────────┘
```

---

## AI & Automation Integration

### 1. OpenRouter Integration

#### Smart Property Matching Algorithm

**Service:** OpenRouter (GPT-4 Turbo for cost-effectiveness)

**Feature:** Intelligent Property Recommendations

**Integration Point:** Home Tab - "Personalized For You" Section

**API Endpoint:** `POST /api/ai/match-properties`

```typescript
// Request Payload
interface PropertyMatchRequest {
  userId: string;
  userProfile: {
    previousSearches: Property[];
    savedProperties: Property[];
    viewingHistory: PropertyView[];
    userPreferences: UserPreference;
    demographics: {
      income: string;
      family_size: number;
      employment: string;
    };
  };
  availableProperties: Property[];
  count: number; // Default: 5
}

// Response
interface PropertyMatchResponse {
  matches: PropertyMatch[];
  timestamp: string;
}

interface PropertyMatch {
  propertyId: string;
  matchScore: number; // 0-100
  reasons: string[]; // ["Price in range", "Similar style to saved properties"]
  recommendedAction: "view" | "schedule" | "contact";
}
```

**Caching Strategy:**
- Cache results for 24 hours per user
- Invalidate on: new property listing, user preference change, viewing completion
- Store in Redis with TTL

**Prompt Engineering:**
```
You are a luxury real estate matching expert. Analyze the buyer profile and
available properties to find the best matches. Consider:

1. Price Range: User's budget and viewing history
2. Preferences: Size, style, location, amenities
3. Patterns: Similar properties they've saved/viewed
4. Lifestyle: Job location, family needs, commute preferences
5. Investment Potential: Appreciation trends, neighborhood growth

Return a ranked list with match scores (0-100) and explanations.
```

#### AI-Powered Property Descriptions

**Service:** OpenRouter (Claude Opus for better writing)

**Feature:** Automated Listing Descriptions & SEO Optimization

**Integration Point:** Agent/Seller Dashboard - "Generate Description"

**API Endpoint:** `POST /api/ai/generate-description`

```typescript
interface DescriptionRequest {
  propertyId: string;
  propertyData: {
    address: string;
    type: string;
    year_built: number;
    sqft: number;
    beds: number;
    baths: number;
    amenities: string[];
    neighborhood: string;
    priceHistory?: PricePoint[];
    images?: Image[];
  };
  style?: "luxury" | "casual" | "professional"; // Default: luxury
  focusAreas?: string[]; // e.g., ["investment", "family", "sustainability"]
}

interface DescriptionResponse {
  title: string;
  description: string;
  seoKeywords: string[];
  highlights: string[];
}
```

**Prompt:**
```
Write a compelling luxury real estate listing description for this property:
[Property data]

Requirements:
- 150-200 words for main description
- Emphasize unique features
- Use evocative language
- Include lifestyle benefits
- Mention investment potential if applicable
- SEO optimized with keywords

Format as JSON with: title, description, highlights, keywords
```

#### Price & Rent Suggestions

**Service:** OpenRouter (GPT-4 Turbo for data analysis)

**Feature:** AI-Driven Pricing Recommendations

**Integration Point:** Seller Dashboard - "Suggest Price"

**API Endpoint:** `POST /api/ai/suggest-price`

```typescript
interface PriceRequest {
  propertyId: string;
  propertyData: Property;
  marketData: {
    comparable_sales: Property[]; // Last 3-6 months
    areaStats: {
      average_price_sqft: number;
      price_trends: number[]; // % change month-over-month
      days_on_market: number;
      sold_percentage: number;
    };
    seasonality: string; // "spring_peak" | "summer_active" | "fall_declining" | "winter_slow"
  };
}

interface PriceResponse {
  suggestedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  confidence: number; // 0-100
  reasoning: string[];
  marketTrends: string;
}
```

**Data Analysis Prompt:**
```
Analyze comparable sales and market conditions to suggest optimal pricing.

Comparables: [List of similar recent sales]
Market Metrics: [Area statistics]
Property Unique Features: [Distinguishing factors]

Provide:
1. Suggested list price
2. Acceptable price range (95%-105%)
3. Confidence level
4. Reasoning for price
5. Market trend interpretation

Consider: comparable values, market momentum, seasonality, unique features
```

### 2. Composio Integration

#### Automated Notification Workflows

**Service:** Composio (Workflow Orchestration)

**Feature 1: Price Drop Alerts**
- **Trigger:** Property price reduction detected
- **Action:** Send push notification + in-app alert
- **Workflow:**
  ```
  Monitor property price changes
  → If (new_price < original_price)
  → Calculate discount %
  → Create notification content
  → Send via FCM
  → Update user activity log
  ```

**Feature 2: New Listing Notifications**
- **Trigger:** New property matches saved search criteria
- **Workflow:**
  ```
  Property listed
  → Extract: location, price, amenities
  → Query user saved searches
  → Filter matches
  → Generate personalized message
  → Send push notification
  → Increment user notification count
  ```

**Feature 3: Viewing Reminders**
- **Trigger:** Scheduled viewing time approaching
- **Workflow:**
  ```
  24 hours before viewing
  → Create reminder notification
  → Schedule agent notification
  → Add to device calendar
  → Send 1 hour before: "Reminder: Viewing at 2 PM"
  → Send 15 minutes before: "Leaving soon? Get directions"
  ```

**Feature 4: Offer Status Updates**
- **Trigger:** Offer state changes (submitted → accepted → countered → closed)
- **Workflow:**
  ```
  On offer status change
  → Determine event type
  → Create notification message
  → Update offer record
  → Send to buyer + agent
  → Log notification in activity
  ```

**Feature 5: Lead Assignment (Agent/Seller)**
- **Trigger:** New inquiry received
- **Workflow:**
  ```
  New inquiry submitted
  → Check agent availability
  → Auto-assign if available
  → Send notification to agent
  → Create chat thread
  → Send welcome message to buyer
  → Log lead in CRM
  ```

**API Integration Pattern:**

```typescript
// Composio Workflow Trigger
interface ComposioWorkflowPayload {
  workflowId: string; // e.g., "price-drop-alert"
  userId: string;
  propertyId?: string;
  data: {
    // Workflow-specific payload
    propertyData?: Partial<Property>;
    changeDetails?: Record<string, any>;
    metadata?: Record<string, any>;
  };
}

// Service Implementation
class ComposioService {
  async triggerWorkflow(payload: ComposioWorkflowPayload) {
    const response = await axios.post(
      'https://api.composio.dev/workflows/execute',
      {
        workflow_id: payload.workflowId,
        payload: payload.data,
        context: {
          userId: payload.userId,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${COMPOSIO_API_KEY}`,
        },
      }
    );
    return response.data;
  }
}
```

#### Real-Time Data Sync

**Service:** Composio + WebSocket

**Feature: Live Property Updates**

**Implementation:**
- WebSocket connection to backend on app startup
- Composio monitors database changes
- Real-time updates pushed to connected clients
- Update types:
  - Price changes
  - New offers/counter-offers
  - Availability updates
  - New inquiries
  - Message received

**Data Structure:**
```typescript
interface RealtimeUpdate {
  type: 'price_change' | 'offer_update' | 'new_inquiry' | 'message' | 'availability';
  propertyId?: string;
  userId?: string;
  timestamp: string;
  data: Record<string, any>;
}
```

---

## Mobile-Specific Capabilities

### 1. Push Notifications

**Service:** Firebase Cloud Messaging (FCM) & Apple Push Notification (APNs)

**Permission Flow:**
- Request on first app open
- Rationale dialog explaining benefits
- Direct to settings if denied
- Re-ask option in preferences

**Notification Types:**

| Type | Priority | Silent | Badge | Sound |
|------|----------|--------|-------|-------|
| Price Drop | High | No | Yes | Yes |
| New Listing | Normal | No | Yes | Yes |
| Viewing Reminder (24h) | Normal | Yes | No | No |
| Viewing Reminder (15m) | High | No | No | Yes |
| Message Received | High | No | Yes | Yes |
| Offer Status Change | High | No | Yes | Yes |
| Admin Alert | Critical | No | Yes | Yes |

**Implementation:**

```typescript
// FCM Service
class NotificationService {
  async requestPermission() {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      return authStatus !== messaging.AuthorizationStatus.DENIED;
    }
    return true; // Android auto-grants
  }

  async handleNotification(message: FirebaseMessagingTypes.RemoteMessage) {
    const { data, notification } = message;

    // Parse notification type
    const type = data?.type as NotificationType;

    // Generate deep link
    const link = this.generateDeepLink(type, data);

    // Update app state
    if (AppState.currentState === 'active') {
      // Show in-app banner
      this.showInAppNotification(notification);
    } else {
      // Create local notification
      await notifee.displayNotification({
        title: notification?.title,
        body: notification?.body,
        android: {
          channelId: 'high_priority',
          pressAction: {
            id: 'default',
          },
          actions: [
            {
              title: 'View',
              pressAction: { id: 'view' },
            },
          ],
        },
      });
    }
  }
}
```

### 2. Offline-First Data Access

**Strategy:** Local-first sync with eventual consistency

**Technology:** SQLite + Redux Persist

**Implementation:**

```typescript
// Redux Slice with Offline Support
const propertySlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    // Offline actions
    addPropertyOffline: (state, action) => {
      state.items.push({
        ...action.payload,
        _status: 'pending', // Track sync status
        _id: generateLocalId(),
      });
    },

    // After sync
    markPropertySynced: (state, action) => {
      const prop = state.items.find(p => p._id === action.payload.localId);
      if (prop) {
        prop._status = 'synced';
        prop.id = action.payload.remoteId;
      }
    },
  },
});

// Persistence Setup
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['properties', 'savedSearches', 'bookings'], // Offline data
  version: 1,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);
```

**Sync Queue Pattern:**

```typescript
class SyncQueue {
  private queue: SyncItem[] = [];
  private syncing = false;

  async enqueue(item: SyncItem) {
    this.queue.push(item);
    if (!this.syncing) {
      this.syncWhenConnected();
    }
  }

  async syncWhenConnected() {
    // Wait for connection
    const isConnected = await this.checkConnection();
    if (!isConnected) {
      // Listen for connection event
      NetInfo.addEventListener(state => {
        if (state.isConnected) {
          this.sync();
        }
      });
      return;
    }

    await this.sync();
  }

  private async sync() {
    this.syncing = true;
    while (this.queue.length > 0) {
      const item = this.queue[0];
      try {
        await this.sendToServer(item);
        dispatch(markPropertySynced(item));
        this.queue.shift();
      } catch (error) {
        console.error('Sync failed:', error);
        break; // Stop on first failure, retry later
      }
    }
    this.syncing = false;
  }
}
```

### 3. Camera Integration

**Feature 1: Property Photos (Seller)**

```typescript
// Photo Upload Component
const PropertyPhotoUpload = () => {
  const handleLaunchCamera = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      cameraType: 'back',
      includeBase64: false,
      quality: 0.8, // Compress to save bandwidth
      maxWidth: 1920,
      maxHeight: 1080,
    });

    if (result.assets) {
      const photo = result.assets[0];

      // Upload to Cloudinary
      await uploadToCloudinary(photo.uri, {
        folder: `properties/${propertyId}/photos`,
        tags: ['property', propertyId],
      });

      dispatch(addPropertyPhoto(photo));
    }
  };

  return (
    <TouchableOpacity onPress={handleLaunchCamera}>
      <Text>Take Photo</Text>
    </TouchableOpacity>
  );
};
```

**Feature 2: Document Scan (Offer Submission)**

```typescript
// Document Scanner (for pre-approval letters, etc.)
const DocumentScanner = ({ onCapture }) => {
  const handleScan = async () => {
    const result = await RNDocumentScanner.scanDocument();
    if (result) {
      onCapture(result);
    }
  };

  return (
    <TouchableOpacity onPress={handleScan}>
      <Text>Scan Document</Text>
    </TouchableOpacity>
  );
};
```

### 4. Location Services

**Feature 1: Property Location Search**

```typescript
// Geolocation-based search
const LocationSearch = () => {
  const getPermission = async () => {
    const permission = await Geolocation.requestAuthorization('whenInUse');
    return permission === 'granted';
  };

  const searchNearby = async () => {
    const granted = await getPermission();
    if (!granted) return;

    Geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;

        // Query API for nearby properties
        const properties = await api.get('/properties/nearby', {
          params: {
            lat: latitude,
            lng: longitude,
            radius: 5, // miles
          },
        });

        dispatch(setNearbyProperties(properties));
      }
    );
  };

  return (
    <TouchableOpacity onPress={searchNearby}>
      <Text>Search Nearby</Text>
    </TouchableOpacity>
  );
};
```

**Feature 2: Commute Time Calculation**

```typescript
// Show commute times from property
const CommuteEstimates = ({ propertyLocation, userWorkLocation }) => {
  const [commuteTimes, setCommuteTimes] = useState<CommuteTimes | null>(null);

  useEffect(() => {
    const calculateCommute = async () => {
      const response = await GoogleMapsAPI.getDistanceMatrix({
        origins: [propertyLocation],
        destinations: [userWorkLocation],
        mode: 'driving',
        departure_time: new Date(), // Current traffic
      });

      const duration = response.rows[0].elements[0].duration;
      setCommuteTimes({
        driving: duration,
        transit: await getTransitTime(), // If applicable
        walking: await getWalkingTime(), // If applicable
      });
    };

    calculateCommute();
  }, [propertyLocation]);

  return (
    <View>
      <Text>Commute Times to Work:</Text>
      <Text>Driving: {commuteTimes?.driving}</Text>
      <Text>Transit: {commuteTimes?.transit}</Text>
    </View>
  );
};
```

### 5. Biometric Login

```typescript
// Biometric Authentication
class BiometricAuth {
  async requestBiometricLogin() {
    try {
      const compatible = await ReactNativeBiometrics.isSensorAvailable();
      if (!compatible) {
        return null;
      }

      const result = await ReactNativeBiometrics.simplePrompt({
        promptMessage: 'Authenticate to access Puraestate',
        fallbackPromptMessage: 'Use passcode',
      });

      if (result.success) {
        // Biometric authenticated
        const token = await this.getStoredToken();
        return this.validateToken(token);
      }
    } catch (error) {
      console.error('Biometric auth failed:', error);
    }
  }

  async enableBiometric(userId: string) {
    // After successful password login
    const { available } = await ReactNativeBiometrics.isSensorAvailable();
    if (available) {
      // Store encrypted biometric key
      await SecureStore.setItem(`biometric_${userId}`, true);
    }
  }
}
```

### 6. One-Click Booking

**Feature: Quick Viewing Reservation**

```typescript
// One-Click Booking Button (after first-time setup)
const OneClickBooking = ({ propertyId, agentId }) => {
  const user = useSelector(state => state.auth.user);

  const quickBook = async () => {
    if (!user.quickBookingPreferences) {
      // Show setup wizard
      navigation.navigate('SetupQuickBooking');
      return;
    }

    // Use saved preferences
    const booking = {
      propertyId,
      agentId,
      userId: user.id,
      date: user.quickBookingPreferences.preferredDate,
      time: user.quickBookingPreferences.preferredTime,
      tourType: user.quickBookingPreferences.tourType || 'in-person',
      notes: user.quickBookingPreferences.defaultNotes,
    };

    try {
      const result = await api.post('/bookings', booking);
      dispatch(addBooking(result.data));

      // Trigger confirmation notification
      await NotificationService.show({
        title: 'Viewing Confirmed!',
        message: `Your viewing is scheduled for ${booking.date}`,
      });
    } catch (error) {
      showError('Could not book viewing. Please try again.');
    }
  };

  return (
    <TouchableOpacity
      style={styles.quickBookButton}
      onPress={quickBook}
    >
      <Icon name="calendar-check" size={20} />
      <Text>Quick Book</Text>
    </TouchableOpacity>
  );
};
```

---

## Technical Implementation

### API Integration Architecture

#### Authentication Flow

```typescript
// Auth Service with Token Management
class AuthService {
  private refreshTimer: NodeJS.Timeout | null = null;

  async login(email: string, password: string) {
    const response = await axios.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data;

    // Store securely
    await SecureStore.setItem('accessToken', accessToken);
    await SecureStore.setItem('refreshToken', refreshToken);

    // Set up auto-refresh
    this.setupTokenRefresh(accessToken);

    return user;
  }

  private setupTokenRefresh(token: string) {
    const decoded = jwtDecode<{ exp: number }>(token);
    const expiresIn = decoded.exp * 1000 - Date.now();
    const refreshBefore = expiresIn - 5 * 60 * 1000; // Refresh 5min before expiry

    this.refreshTimer = setTimeout(() => {
      this.refreshAccessToken();
    }, refreshBefore);
  }

  async refreshAccessToken() {
    const refreshToken = await SecureStore.getItem('refreshToken');
    const response = await axios.post('/auth/refresh', { refreshToken });
    const { accessToken } = response.data;

    await SecureStore.setItem('accessToken', accessToken);
    this.setupTokenRefresh(accessToken);
  }
}
```

#### API Interceptors

```typescript
// Axios Instance with Interceptors
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request Interceptor
apiClient.interceptors.request.use(
  async config => {
    const token = await SecureStore.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await AuthService.refreshAccessToken();
        const token = await SecureStore.getItem('accessToken');
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        dispatch(logout());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

#### API Endpoints Map

| Endpoint | Method | Purpose | AI/Automation |
|----------|--------|---------|----------------|
| `/auth/login` | POST | User authentication | - |
| `/auth/refresh` | POST | Token refresh | - |
| `/properties/search` | GET | Search properties | - |
| `/properties/{id}` | GET | Property details | - |
| `/properties` | POST | Create listing (seller) | - |
| `/ai/match-properties` | POST | Smart matching | OpenRouter |
| `/ai/generate-description` | POST | Description generation | OpenRouter |
| `/ai/suggest-price` | POST | Price suggestions | OpenRouter |
| `/bookings` | POST/GET | Viewing management | Composio |
| `/offers` | POST/GET | Offer management | - |
| `/messages` | GET/POST | Chat messages | - |
| `/notifications` | GET | User notifications | Composio |
| `/users/{id}/preferences` | PATCH | Update preferences | - |
| `/admin/listings` | GET | Seller listings | - |
| `/admin/analytics` | GET | Dashboard analytics | - |

### State Management (Redux Structure)

```typescript
// Store configuration
const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    properties: propertySlice.reducer,
    search: searchSlice.reducer,
    bookings: bookingSlice.reducer,
    messages: messageSlice.reducer,
    notifications: notificationSlice.reducer,
    ui: uiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['properties/setError'],
        ignoredPaths: ['properties.error'],
      },
    })
      .concat(apiMiddleware)
      .concat(offlineSyncMiddleware),
});

// Type definitions
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Redux Slices

**Auth Slice:**
```typescript
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
  },
});
```

**Properties Slice:**
```typescript
const propertySlice = createSlice({
  name: 'properties',
  initialState: {
    items: [],
    selectedProperty: null,
    isLoading: false,
    error: null,
    hasMore: true,
    pageNumber: 0,
    filters: {},
    recommendations: [],
  },
  reducers: {
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pageNumber = 0;
    },
    addProperties: (state, action) => {
      state.items = [...state.items, ...action.payload];
    },
    setRecommendations: (state, action) => {
      state.recommendations = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProperties.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.properties;
        state.hasMore = action.payload.hasMore;
      });
  },
});
```

### Real-Time Features (WebSocket)

```typescript
// WebSocket Service for Real-Time Updates
class RealtimeService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(userId: string) {
    this.ws = new WebSocket(`${WS_URL}/user/${userId}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const update: RealtimeUpdate = JSON.parse(event.data);
      this.handleUpdate(update);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.attemptReconnect(userId);
    };

    this.ws.onclose = () => {
      this.attemptReconnect(userId);
    };
  }

  private handleUpdate(update: RealtimeUpdate) {
    switch (update.type) {
      case 'price_change':
        dispatch(updatePropertyPrice(update.data));
        NotificationService.show({
          title: 'Price Changed',
          message: `${update.data.property} is now ${update.data.newPrice}`,
        });
        break;

      case 'new_inquiry':
        dispatch(addInquiry(update.data));
        break;

      case 'message':
        dispatch(addMessage(update.data));
        break;

      case 'offer_update':
        dispatch(updateOffer(update.data));
        break;
    }
  }

  private attemptReconnect(userId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      setTimeout(() => this.connect(userId), delay);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
```

---

## Performance & UX Optimization

### Load Time Optimization

#### Initial App Load Strategy

```typescript
// Lazy Load Root Navigator
const RootNavigator = lazy(() => import('./navigation/RootNavigator'));

const App = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        // Load fonts
        await Font.loadAsync({
          'inter': require('./assets/fonts/Inter-Regular.ttf'),
          'georgia': require('./assets/fonts/Georgia.ttf'),
        });

        // Initialize services
        await NotificationService.initialize();
        await RealtimeService.connect(userId);

        // Pre-cache critical data
        await store.dispatch(fetchUserPreferences());
      } catch (error) {
        console.error('App initialization failed:', error);
      } finally {
        setIsReady(true);
      }
    };

    prepare();
  }, []);

  if (!isReady) {
    return <SplashScreen />;
  }

  return <RootNavigator />;
};
```

#### Image Optimization

```typescript
// Image Cache Manager
class ImageCacheManager {
  private cache = new Map<string, string>();

  async cacheImage(url: string, propertyId: string): Promise<string> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    const filename = `${propertyId}_${Date.now()}.jpg`;
    const filepath = `${RNFS.DocumentDirectoryPath}/${filename}`;

    await RNFS.downloadFile({
      fromUrl: url,
      toFile: filepath,
      cacheable: true,
    }).promise;

    this.cache.set(url, filepath);
    return filepath;
  }

  async getOptimizedImage(
    url: string,
    dimensions: { width: number; height: number }
  ): Promise<string> {
    // Cloudinary URL transformation for responsive images
    return `${url}?q=auto&w=${dimensions.width * 2}`;
  }
}
```

#### Code Splitting

```typescript
// Dynamic imports for screens
const HomeScreen = lazy(() => import('./screens/discover/HomeScreen'));
const SearchScreen = lazy(() => import('./screens/search/SearchScreen'));
const PropertyDetailScreen = lazy(() =>
  import('./screens/discover/PropertyDetailScreen')
);

// Suspense boundaries
const HomeScreenWithFallback = () => (
  <Suspense fallback={<SkeletonLoader />}>
    <HomeScreen />
  </Suspense>
);
```

### Caching Strategies

#### Cache Levels

```typescript
// Multi-tier caching
class CacheManager {
  // Tier 1: Memory Cache (Redux)
  private memoryCache: Map<string, CacheEntry> = new Map();

  // Tier 2: Persistent Storage (SQLite)
  private db: SQLiteDatabase;

  // Tier 3: File System Cache (Images)
  private fsCache: ImageCacheManager;

  async getProperty(id: string): Promise<Property> {
    // Check memory first
    const cached = this.memoryCache.get(`property_${id}`);
    if (cached && !cached.isExpired()) {
      return cached.value;
    }

    // Check database
    const dbResult = await this.db.executeSql(
      'SELECT * FROM properties WHERE id = ?',
      [id]
    );
    if (dbResult.rows.length > 0) {
      return dbResult.rows[0];
    }

    // Fetch from API
    const property = await api.get(`/properties/${id}`);

    // Store in all tiers
    this.memoryCache.set(`property_${id}`, {
      value: property,
      expiresAt: Date.now() + 1 * 60 * 60 * 1000, // 1 hour
    });
    await this.db.executeSql(
      'INSERT OR REPLACE INTO properties VALUES (?, ?)',
      [id, JSON.stringify(property)]
    );

    return property;
  }
}

// Cache expiration config
const CACHE_CONFIG = {
  properties: 1 * 60 * 60 * 1000, // 1 hour
  search_results: 30 * 60 * 1000, // 30 minutes
  user_profile: 24 * 60 * 60 * 1000, // 24 hours
  recommendations: 3 * 60 * 60 * 1000, // 3 hours
  images: 7 * 24 * 60 * 60 * 1000, // 7 days
};
```

#### Redux Persist Configuration

```typescript
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  blacklist: ['ui.loading', 'ui.errors'], // Don't persist
  whitelist: [
    'auth',
    'properties',
    'bookings',
    'savedSearches',
    'userPreferences',
  ],
  version: 1,
  migrate: createMigrate(migrations, { debug: false }),
  debounce: 1000, // Debounce writes to AsyncStorage
};
```

### Network Resilience

#### Slow Connection Fallback

```typescript
// Detect slow connections and adjust UX
class NetworkManager {
  async detectConnectionQuality(): Promise<ConnectionQuality> {
    const startTime = Date.now();

    try {
      await fetch('https://api.example.com/ping', {
        method: 'HEAD',
        cache: 'no-cache',
      });

      const duration = Date.now() - startTime;

      if (duration < 200) return 'excellent';
      if (duration < 500) return 'good';
      if (duration < 1000) return 'fair';
      return 'poor';
    } catch {
      return 'offline';
    }
  }

  applyQualitySettings(quality: ConnectionQuality) {
    const settings = {
      excellent: { imageQuality: 'high', imagePreload: true, videoQuality: '1080p' },
      good: { imageQuality: 'medium', imagePreload: true, videoQuality: '720p' },
      fair: { imageQuality: 'low', imagePreload: false, videoQuality: '480p' },
      poor: { imageQuality: 'thumbnail', imagePreload: false, videoQuality: false },
      offline: { imageQuality: 'offline', imagePreload: false, videoQuality: false },
    };

    dispatch(setNetworkSettings(settings[quality]));
  }
}
```

#### Error Handling & Retry Logic

```typescript
// Retry middleware with exponential backoff
const retryMiddleware = (store: any) => (next: any) => (action: any) => {
  if (action.type.endsWith('pending')) {
    return next(action);
  }

  if (action.type.endsWith('rejected')) {
    const { error, meta } = action;

    if (meta.arg?.retryCount < 3 && isRetryableError(error)) {
      const delay = Math.pow(2, meta.arg?.retryCount || 0) * 1000;

      setTimeout(() => {
        store.dispatch({
          ...action,
          meta: {
            ...meta,
            arg: {
              ...meta.arg,
              retryCount: (meta.arg?.retryCount || 0) + 1,
            },
          },
        });
      }, delay);
    }
  }

  return next(action);
};
```

### UI/UX Performance

#### Virtualization for Large Lists

```typescript
// Virtualized property list
const PropertyListVirtualized = ({ properties }: { properties: Property[] }) => {
  return (
    <FlashList
      data={properties}
      renderItem={({ item }) => (
        <PropertyCard
          property={item}
          onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
        />
      )}
      estimatedItemSize={280}
      numColumns={1}
      horizontal={false}
      onEndReached={() => dispatch(fetchMoreProperties())}
      onEndReachedThreshold={0.5}
    />
  );
};
```

#### Skeleton Loaders

```typescript
// Skeleton loader for property cards
const PropertyCardSkeleton = () => (
  <View style={styles.card}>
    <Skeleton width="100%" height={200} />
    <Skeleton width="80%" height={20} marginVertical={8} />
    <Skeleton width="60%" height={16} />
    <Skeleton width="70%" height={16} marginTop={8} />
  </View>
);

// Show during initial load
const PropertyList = () => {
  const { properties, isLoading } = useSelector(state => state.properties);

  return (
    <FlashList
      data={isLoading && properties.length === 0
        ? Array(5).fill({})
        : properties
      }
      renderItem={({ item }) =>
        Object.keys(item).length === 0 ? (
          <PropertyCardSkeleton />
        ) : (
          <PropertyCard property={item} />
        )
      }
      estimatedItemSize={280}
    />
  );
};
```

---

## Development Roadmap

### Phase 1: MVP (Weeks 1-8)

**Features:**
- Authentication (email/password)
- Property search and browse
- Property details with images
- Viewing scheduling
- Basic messaging
- User profile

**AI/Automation:**
- Basic property matching (database queries)
- Manual notifications setup

**Deliverables:**
- iOS and Android builds
- TestFlight beta (iOS)
- Google Play Internal Testing (Android)

**Success Metrics:**
- App loads in < 2 seconds
- 100+ beta testers
- 4.5+ star rating

### Phase 2: AI Enhancement (Weeks 9-14)

**Features:**
- AI-powered smart matching (OpenRouter)
- Automated notifications (Composio)
- Make offer functionality
- One-click booking setup
- Biometric login

**AI/Automation:**
- Price suggestions (OpenRouter)
- Description generation (OpenRouter)
- Real-time property updates (Composio + WebSocket)

**Success Metrics:**
- Match accuracy: 85%+
- Offer conversion rate: 15%+
- Repeat engagement: 60%

### Phase 3: Advanced Features (Weeks 15-20)

**Features:**
- Full rental application flow
- Agent dashboard MVP
- In-app payment processing
- Chat with real-time typing
- Advanced analytics

**Optimization:**
- Offline-first data sync
- Advanced caching strategies
- Image optimization

**Success Metrics:**
- App retention: 40%+ at 30 days
- Transaction volume: $X

### Phase 4: Scale & Polish (Weeks 21+)

**Features:**
- Seller listing creation wizard
- Commission/ROI tracking (agents)
- Community features (reviews, ratings)
- Advanced filtering
- AR property tours (if 3D partner available)

**Platform Expansion:**
- Web app parity features
- Admin dashboard
- Analytics engine

---

## Appendix

### Dependencies & Libraries

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-native": "^0.73.0",
    "react-native-paper": "^5.10.0",
    "react-navigation": "^6.1.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/native-stack": "^6.9.0",
    "redux": "^4.2.0",
    "@reduxjs/toolkit": "^1.9.0",
    "react-redux": "^8.1.0",
    "redux-persist": "^6.0.0",
    "axios": "^1.6.0",
    "socket.io-client": "^4.5.0",
    "react-native-reanimated": "^3.0.0",
    "react-native-gesture-handler": "^2.13.0",
    "react-native-screens": "^3.25.0",
    "react-native-safe-area-context": "^4.7.0",
    "react-native-sqlite-storage": "^6.0.0",
    "react-native-secure-storage": "^3.0.0",
    "react-native-geolocation-service": "^5.3.0",
    "react-native-maps": "^1.4.0",
    "react-native-camera": "^4.2.0",
    "react-native-document-scanner": "^0.2.0",
    "react-native-biometrics": "^3.0.0",
    "react-native-image-crop-picker": "^0.39.0",
    "react-native-fast-image": "^8.6.0",
    "react-native-netinfo": "^9.3.0",
    "react-native-app-state": "^1.0.0",
    "firebase": "^10.0.0",
    "@react-native-firebase/app": "^18.0.0",
    "@react-native-firebase/messaging": "^18.0.0",
    "@react-native-firebase/analytics": "^18.0.0",
    "react-native-notifee": "^7.7.0",
    "react-native-stripe-sdk": "^4.0.0",
    "stripe": "^14.0.0",
    "jwt-decode": "^4.0.0",
    "date-fns": "^2.30.0",
    "lodash-es": "^4.17.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-native": "^0.73.0",
    "typescript": "^5.2.0",
    "babel-preset-react-native": "^4.0.0",
    "eslint": "^8.50.0",
    "prettier": "^3.0.0",
    "jest": "^29.7.0",
    "@testing-library/react-native": "^12.0.0",
    "detox": "^20.0.0",
    "detox-cli": "^20.0.0"
  }
}
```

### Deployment Checklist

- [ ] All tests passing (unit, integration, E2E)
- [ ] Code coverage > 80%
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Accessibility (WCAG 2.1 AA) compliance
- [ ] Localization (if required)
- [ ] App Store & Play Store submission
- [ ] Analytics setup confirmed
- [ ] Crash reporting configured
- [ ] Error tracking setup
- [ ] Feature flags configured
- [ ] Documentation complete

---

## Conclusion

The Puraestate Mobile App specification provides a comprehensive roadmap for building a premium, AI-enhanced real estate marketplace application. By combining mobile-native capabilities with intelligent matching and automated workflows, the app will deliver superior user experience while maintaining brand consistency.

Key differentiators:
- **AI-Driven Personalization** via OpenRouter
- **Intelligent Automation** via Composio
- **Offline-First Architecture** for reliability
- **Native Mobile Capabilities** (camera, biometrics, location)
- **Performance-First Design** for mobile networks
- **Seamless Transaction Flows** reducing friction

The phased development approach ensures rapid MVP delivery while building toward advanced features and scale.

---

**Document Version:** 1.0
**Last Updated:** 2026-02-24
**Status:** Ready for Development
