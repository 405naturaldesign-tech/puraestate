# PuraEstate Mobile App - Implementation & Integration Guide

**Version:** 1.0
**Created:** February 24, 2026

---

## QUICK START - 30 DAY CHECKLIST

### Week 1: Infrastructure Setup
- [ ] Create Firebase project + configure services
- [ ] Set up Stripe + SINPE Móvil payment processing
- [ ] Register OpenRouter API key + credits
- [ ] Register Composio account + WhatsApp Business API
- [ ] Initialize React Native project with Expo
- [ ] Set up GitHub repo + CI/CD pipeline
- [ ] Create API documentation template

### Week 2: Core Backend Development
- [ ] Implement Firebase Authentication (email + OTP)
- [ ] Build Firestore database schema
- [ ] Create Cloud Functions for property analysis
- [ ] Set up property database seeding (100+ test properties)
- [ ] Implement OpenRouter integration for AI matching
- [ ] Test all API endpoints

### Week 3: Mobile App Development
- [ ] Build auth screens (welcome, signup, login)
- [ ] Implement home dashboard
- [ ] Build property search + listing screens
- [ ] Create property detail screen with all tool links
- [ ] Implement 3 key calculators (ROI, Mortgage, Closing Costs)
- [ ] Test end-to-end flows

### Week 4: AI, Automation & Launch
- [ ] Integrate AI matching + recommendations
- [ ] Set up Composio + WhatsApp notifications
- [ ] Build agent matching workflow
- [ ] Create market alerts system
- [ ] Final QA + bug fixes
- [ ] Deploy to TestFlight + Google Play Beta
- [ ] Prepare launch marketing materials

---

## SECTION A: FIREBASE SETUP (Detailed)

### A.1 Firebase Project Creation

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Create new project
firebase init

# Select features to enable:
# - Firestore Database
# - Authentication
# - Cloud Functions
# - Cloud Storage
# - Hosting
# - Cloud Messaging
```

### A.2 Firebase Configuration File (firebase.config.ts)

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.REACT_NATIVE_FIREBASE_API_KEY,
  authDomain: 'puraestateapp.firebaseapp.com',
  projectId: 'puraestateapp',
  storageBucket: 'puraestateapp.appspot.com',
  messagingSenderId: process.env.REACT_NATIVE_FIREBASE_MESSAGING_ID,
  appId: process.env.REACT_NATIVE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);

export default app;
```

### A.3 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own documents
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Properties are publicly readable, readable by agent/owner only for edit
    match /properties/{propertyId} {
      allow read: if true;
      allow create: if request.auth != null &&
                       request.resource.data.agentId == request.auth.uid;
      allow update: if request.auth.uid == resource.data.agentId;
      allow delete: if request.auth.uid == resource.data.agentId;
    }

    // Agents can read/write their own profiles
    match /agents/{agentId} {
      allow read: if true;
      allow write: if request.auth.uid == agentId;
    }

    // Conversations - user can read their own
    match /conversations/{conversationId} {
      allow read, write: if request.auth.uid in
        [resource.data.investorId, resource.data.agentId];
    }

    // Alerts - user can only read their own
    match /alerts/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Subscriptions - user can only read their own
    match /subscriptions/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId ||
                     request.auth.token.admin == true;
    }

    // Market data - public read only
    match /market_data/{cantonId} {
      allow read: if true;
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

### A.4 Firebase Authentication Setup (React Native)

```typescript
// services/firebase/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendSignInLinkToEmail,
  getAuth,
} from 'firebase/auth';
import { auth, db } from '../../firebase.config';
import { doc, setDoc } from 'firebase/firestore';

export const signUpWithEmail = async (
  email: string,
  password: string,
  userData: any
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Store additional user data in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email,
      ...userData,
      createdAt: new Date(),
      subscription: {
        tier: 'FREE',
        startDate: null,
        expiryDate: null,
      },
    });

    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const sendPhoneOTP = async (phoneNumber: string) => {
  // Implementation using Firebase Phone Auth
  // This would use RecaptchaVerifier for mobile
};
```

---

## SECTION B: OPENROUTER AI INTEGRATION

### B.1 OpenRouter Setup

```bash
# Install OpenRouter SDK
npm install openrouter-ai

# Set environment variable
export OPENROUTER_API_KEY="your-api-key-here"
```

### B.2 OpenRouter Configuration (typescript)

```typescript
// services/ai/openrouter.ts
import { OpenRouter } from 'openrouter-ai';

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  httpReferer: 'https://puraestateapp.com',
  appName: 'PuraEstate Mobile App',
});

/**
 * Analyze property investment viability using Claude/Llama
 */
export const analyzePropertyMatch = async (
  investor: InvestorProfile,
  property: Property,
  marketData: MarketData
): Promise<PropertyAnalysis> => {
  const prompt = `
You are a Costa Rica real estate investment expert. Analyze if this property matches the investor profile.

INVESTOR PROFILE:
- Name: ${investor.name}
- Budget: $${investor.budget}
- ROI Target: ${investor.roiTarget}%
- Risk Tolerance: ${investor.riskTolerance}
- Preferred Regions: ${investor.preferredRegions.join(', ')}
- Property Types: ${investor.propertyTypes.join(', ')}
- Investment Horizon: ${investor.investmentHorizon}

PROPERTY:
- Address: ${property.address}
- Price: $${property.price}
- Size: ${property.size} sqm
- Type: ${property.type}
- Bedrooms: ${property.bedrooms}
- Bathrooms: ${property.bathrooms}
- Year Built: ${property.yearBuilt}
- Amenities: ${property.amenities.join(', ')}

MARKET DATA FOR ${property.canton}:
- Average Price: $${marketData.avgPrice}
- Average ROI: ${marketData.avgROI}%
- Price Trend: ${marketData.trend}
- Demand Level: ${marketData.demandLevel}
- Days on Market: ${marketData.avgDaysOnMarket}

Provide analysis in JSON format:
{
  "matchScore": 0-100,
  "investmentViability": "high/medium/low",
  "roiPotential": { "min": number, "max": number },
  "redFlags": ["flag1", "flag2"],
  "opportunities": ["opportunity1"],
  "comparablePrice": number,
  "estimatedRentalIncome": number,
  "appreciationPotential": number,
  "riskScore": 0-100,
  "opportunityScore": 0-100,
  "reasoning": "detailed explanation",
  "recommendations": ["rec1", "rec2"]
}
`;

  const response = await openrouter.chat.completions.create({
    model: 'openrouter/auto', // Auto-selects best model
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  try {
    const analysis = JSON.parse(response.content[0].text);
    return analysis as PropertyAnalysis;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    throw error;
  }
};

/**
 * Predict ROI for property based on market trends
 */
export const predictROI = async (
  property: Property,
  historicalData: any[],
  marketForecasts: any
): Promise<ROIPrediction> => {
  const prompt = `
Predict 1, 3, 5, and 10-year ROI for this Costa Rica property:

Property: ${property.address}
Type: ${property.type}
Location: ${property.canton}
Price: $${property.price}

Historical Data: ${JSON.stringify(historicalData)}
Market Forecasts: ${JSON.stringify(marketForecasts)}

Return JSON:
{
  "roi1Year": number,
  "roi3Year": number,
  "roi5Year": number,
  "roi10Year": number,
  "confidence": 0-100,
  "risks": ["risk1"],
  "factors": ["factor1"],
  "confidence_explanation": "explanation"
}
`;

  const response = await openrouter.chat.completions.create({
    model: 'claude-opus-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
  });

  return JSON.parse(response.content[0].text);
};

/**
 * Generate property description and highlights
 */
export const generatePropertyDescription = async (
  property: Property
): Promise<string> => {
  const response = await openrouter.chat.completions.create({
    model: 'openrouter/auto',
    messages: [
      {
        role: 'user',
        content: `Write a compelling 100-word property description for this Costa Rica real estate listing:
${JSON.stringify(property)}

Format as marketing copy for investors.`,
      },
    ],
    temperature: 0.8,
  });

  return response.content[0].text;
};
```

---

## SECTION C: COMPOSIO + WHATSAPP INTEGRATION

### C.1 Composio Setup

```bash
# Install Composio SDK
npm install composio-core

# Set environment variables
export COMPOSIO_API_KEY="your-composio-api-key"
export WHATSAPP_BUSINESS_PHONE_ID="your-phone-id"
export WHATSAPP_BUSINESS_API_TOKEN="your-api-token"
```

### C.2 Composio Configuration

```typescript
// services/automation/composio.ts
import Composio from 'composio-core';

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
});

/**
 * Send WhatsApp message to agent about property inquiry
 */
export const sendAgentNotification = async (
  agentWhatsAppNumber: string,
  investor: InvestorProfile,
  property: Property
): Promise<void> => {
  const message = `
🔔 *New Property Inquiry on PuraEstate*

📍 *Property:* ${property.address}
💵 *Price:* $${property.price.toLocaleString()}

👤 *Investor Details:*
📧 Email: ${investor.email}
📞 Phone: ${investor.phone}
💰 Budget: $${investor.budget.toLocaleString()}
🎯 ROI Target: ${investor.roiTarget}%

👉 *Respond in PuraEstate app to connect with this investor*
🔗 [Open PuraEstate](https://puraestateapp.com/conversations)

---
This is an automated notification from PuraEstate.
`;

  try {
    await composio.sendWhatsApp({
      to: agentWhatsAppNumber,
      message,
      mediaType: 'text',
    });

    console.log(`WhatsApp notification sent to ${agentWhatsAppNumber}`);
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    throw error;
  }
};

/**
 * Send market opportunity alert to investor
 */
export const sendMarketAlertToInvestor = async (
  investorWhatsAppNumber: string,
  alert: MarketAlert
): Promise<void> => {
  const message = `
🎯 *PuraEstate Market Alert*

${alert.title}

📊 Details: ${alert.description}
📈 Impact: ${alert.impact}

💡 ${alert.actionCTA}

🔗 [View in App](https://puraestateapp.com/alerts)
`;

  try {
    await composio.sendWhatsApp({
      to: investorWhatsAppNumber,
      message,
    });
  } catch (error) {
    console.error('Error sending alert:', error);
  }
};

/**
 * Create WhatsApp conversation between investor and agent
 */
export const initializeAgentConversation = async (
  investor: InvestorProfile,
  agent: Agent,
  property: Property
): Promise<string> => {
  // This would be handled primarily through app messaging
  // WhatsApp is used for notifications, not main chat

  const conversationId = `${investor.uid}_${agent.uid}_${property.id}`;

  // Notify both parties
  await sendAgentNotification(agent.whatsappNumber, investor, property);

  if (investor.whatsappOptIn) {
    const investorMessage = `
Agent ${agent.name} from ${agent.company} is interested in discussing ${property.address} with you.

💬 *Check your PuraEstate app for the full conversation.*
`;
    await composio.sendWhatsApp({
      to: investor.phone,
      message: investorMessage,
    });
  }

  return conversationId;
};
```

### C.3 Webhook Handler for WhatsApp Messages

```typescript
// Firebase Cloud Function to handle incoming WhatsApp messages
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

exports.handleWhatsAppIncoming = functions.https.onRequest(
  async (req, res) => {
    // Verify webhook authenticity
    const token = process.env.COMPOSIO_WEBHOOK_TOKEN;
    if (req.query.token !== token) {
      return res.status(403).send('Forbidden');
    }

    const message = req.body;

    try {
      // Extract data
      const { from, text, messageId } = message;

      // Find corresponding conversation
      const conversationsSnapshot = await admin.firestore()
        .collectionGroup('conversations')
        .where('whatsappLastMessage', '==', messageId)
        .limit(1)
        .get();

      if (conversationsSnapshot.empty) {
        console.log('Conversation not found for message:', messageId);
        return res.status(200).send('OK');
      }

      const conversation = conversationsSnapshot.docs[0];
      const data = conversation.data();

      // Store message in conversation
      await conversation.ref.update({
        lastMessage: text,
        lastMessageTime: admin.firestore.Timestamp.now(),
        lastMessageFrom: 'whatsapp',
        unreadCount: (data.unreadCount || 0) + 1,
      });

      // Send push notification to investor
      const investor = await admin.firestore()
        .collection('users')
        .doc(data.investorId)
        .get();

      await admin.messaging().send({
        token: investor.data()?.deviceToken,
        notification: {
          title: `Message from ${data.agentName}`,
          body: text.substring(0, 50),
        },
        data: {
          conversationId: conversation.id,
          type: 'agent_message',
        },
      });

      res.status(200).send('OK');
    } catch (error) {
      console.error('Error handling WhatsApp message:', error);
      res.status(500).send('Internal Server Error');
    }
  }
);
```

---

## SECTION D: REACT NATIVE SETUP & KEY COMPONENTS

### D.1 Expo Project Initialization

```bash
# Create new Expo project
npx create-expo-app PuraEstate

# cd into project
cd PuraEstate

# Install essential dependencies
npm install \
  react-native-maps \
  react-navigation \
  @react-navigation/native \
  @react-navigation/bottom-tabs \
  @react-navigation/stack \
  redux \
  @reduxjs/toolkit \
  react-redux \
  axios \
  react-native-camera \
  react-native-pdf \
  chart.js \
  react-native-chart-kit \
  @react-native-async-storage/async-storage \
  @react-native-firebase/app \
  @react-native-firebase/auth \
  @react-native-firebase/firestore \
  @react-native-firebase/storage \
  @react-native-firebase/messaging \
  react-hook-form \
  yup \
  moment \
  decimal.js

# Install dev dependencies
npm install --save-dev \
  @types/react \
  @types/react-native \
  typescript
```

### D.2 Core App Structure (App.tsx)

```typescript
// App.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { auth, messaging } from './firebase.config';
import { onAuthStateChanged } from 'firebase/auth';
import { requestUserPermission } from './services/firebase/messaging';
import { store } from './state/store';
import RootNavigator from './navigation/RootNavigator';
import SplashScreen from './screens/common/SplashScreen';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Request push notification permissions
    requestUserPermission();

    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <Provider store={store}>
      <NavigationContainer>
        <RootNavigator user={user} />
      </NavigationContainer>
    </Provider>
  );
}
```

### D.3 ROI Calculator Component

```typescript
// components/calculator/ROICalculator.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Decimal } from 'decimal.js';
import { generatePDF } from '../../utils/pdf';

interface ROIInputs {
  purchasePrice: number;
  downPayment: number;
  hasLoan: boolean;
  loanAmount: number;
  interestRate: number;
  loanTermYears: number;
  annualRent: number;
  maintenancePercent: number;
  propertyTax: number;
  insurance: number;
  management: number;
}

export const ROICalculator: React.FC<{ property?: any }> = ({ property }) => {
  const [inputs, setInputs] = useState<ROIInputs>({
    purchasePrice: property?.price || 0,
    downPayment: property ? property.price * 0.2 : 0,
    hasLoan: true,
    loanAmount: property ? property.price * 0.8 : 0,
    interestRate: 5.2,
    loanTermYears: 30,
    annualRent: property?.estimatedRent || 0,
    maintenancePercent: 10,
    propertyTax: 0,
    insurance: 1200,
    management: 0,
  });

  const [results, setResults] = useState(null);

  const calculateROI = () => {
    // Validate inputs
    if (!inputs.purchasePrice || !inputs.annualRent) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Using Decimal.js for financial precision
    const principal = new Decimal(inputs.purchasePrice);
    const downPayment = new Decimal(inputs.downPayment);
    const cashInvested = downPayment;

    // Calculate annual cashflow
    const annualRent = new Decimal(inputs.annualRent);
    const maintenance = principal
      .mul(inputs.maintenancePercent)
      .div(100)
      .div(12)
      .mul(12);
    const propertyTax = new Decimal(inputs.propertyTax);
    const insurance = new Decimal(inputs.insurance);

    // Monthly mortgage payment (if applicable)
    let monthlyMortgage = new Decimal(0);
    if (inputs.hasLoan && inputs.loanAmount > 0) {
      monthlyMortgage = calculateMortgagePayment(
        inputs.loanAmount,
        inputs.interestRate,
        inputs.loanTermYears
      );
    }

    const annualMortgage = monthlyMortgage.mul(12);

    // Management fees (10% of rent if not specified)
    const managementFee = inputs.management || annualRent.mul(0.1);

    // Net annual cashflow
    const annualExpenses = maintenance
      .add(propertyTax)
      .add(insurance)
      .add(annualMortgage)
      .add(managementFee);

    const annualCashflow = annualRent.minus(annualExpenses);

    // ROI Calculation
    const cashOnCashReturn = annualCashflow
      .div(cashInvested)
      .mul(100);

    const principalROI = annualCashflow.div(principal).mul(100);

    // 5-year projection (with 3% annual appreciation)
    const appreciation = principal.mul(0.03).mul(5);
    const totalCashflow = annualCashflow.mul(5);
    const fiveYearProfit = appreciation.add(totalCashflow);

    setResults({
      monthlyPayment: monthlyMortgage.toNumber(),
      annualMortgage: annualMortgage.toNumber(),
      annualExpenses: annualExpenses.toNumber(),
      annualCashflow: annualCashflow.toNumber(),
      cashOnCashReturn: cashOnCashReturn.toNumber(),
      roi: principalROI.toNumber(),
      fiveYearCashflow: totalCashflow.toNumber(),
      fiveYearAppreciation: appreciation.toNumber(),
      fiveYearProfit: fiveYearProfit.toNumber(),
      totalInvestment: downPayment.toNumber(),
    });
  };

  const calculateMortgagePayment = (
    principal: number,
    rate: number,
    years: number
  ): Decimal => {
    const p = new Decimal(principal);
    const r = new Decimal(rate).div(100).div(12); // Monthly rate
    const n = new Decimal(years * 12); // Number of payments

    // M = P * [r(1+r)^n] / [(1+r)^n - 1]
    const numerator = r.mul(r.plus(1).pow(n));
    const denominator = r.plus(1).pow(n).minus(1);

    return p.mul(numerator.div(denominator));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>ROI Investment Calculator</Text>

      {/* Input sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Purchase Details</Text>

        <InputField
          label="Purchase Price"
          value={inputs.purchasePrice.toString()}
          onChangeText={(text) =>
            setInputs({ ...inputs, purchasePrice: parseFloat(text) || 0 })
          }
          placeholder="$385,000"
          keyboardType="decimal-pad"
        />

        <InputField
          label="Down Payment"
          value={inputs.downPayment.toString()}
          onChangeText={(text) =>
            setInputs({ ...inputs, downPayment: parseFloat(text) || 0 })
          }
          placeholder="$77,000"
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Down Payment %: {((inputs.downPayment / inputs.purchasePrice) * 100).toFixed(1)}%</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financing</Text>

        <CheckboxField
          label="Include Mortgage"
          checked={inputs.hasLoan}
          onPress={() =>
            setInputs({
              ...inputs,
              hasLoan: !inputs.hasLoan,
              loanAmount: !inputs.hasLoan
                ? inputs.purchasePrice - inputs.downPayment
                : 0,
            })
          }
        />

        {inputs.hasLoan && (
          <>
            <InputField
              label="Interest Rate (%)"
              value={inputs.interestRate.toString()}
              onChangeText={(text) =>
                setInputs({
                  ...inputs,
                  interestRate: parseFloat(text) || 0,
                })
              }
              placeholder="5.2"
              keyboardType="decimal-pad"
            />

            <InputField
              label="Loan Term (Years)"
              value={inputs.loanTermYears.toString()}
              onChangeText={(text) =>
                setInputs({
                  ...inputs,
                  loanTermYears: parseInt(text) || 30,
                })
              }
              placeholder="30"
              keyboardType="number-pad"
            />
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Income & Expenses</Text>

        <InputField
          label="Annual Rental Income"
          value={inputs.annualRent.toString()}
          onChangeText={(text) =>
            setInputs({ ...inputs, annualRent: parseFloat(text) || 0 })
          }
          placeholder="$21,600"
          keyboardType="decimal-pad"
        />

        <InputField
          label="Insurance (Annual)"
          value={inputs.insurance.toString()}
          onChangeText={(text) =>
            setInputs({ ...inputs, insurance: parseFloat(text) || 0 })
          }
          placeholder="$1,200"
          keyboardType="decimal-pad"
        />

        <InputField
          label="Property Tax (Annual)"
          value={inputs.propertyTax.toString()}
          onChangeText={(text) =>
            setInputs({ ...inputs, propertyTax: parseFloat(text) || 0 })
          }
          placeholder="$500"
          keyboardType="decimal-pad"
        />

        <InputField
          label="Maintenance (%)"
          value={inputs.maintenancePercent.toString()}
          onChangeText={(text) =>
            setInputs({
              ...inputs,
              maintenancePercent: parseFloat(text) || 10,
            })
          }
          placeholder="10"
          keyboardType="decimal-pad"
        />
      </View>

      {/* Calculate Button */}
      <TouchableOpacity
        style={styles.calculateButton}
        onPress={calculateROI}
      >
        <Text style={styles.calculateButtonText}>Calculate ROI</Text>
      </TouchableOpacity>

      {/* Results */}
      {results && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>📊 ROI Analysis</Text>

          <ResultRow
            label="Monthly Mortgage Payment"
            value={`$${results.monthlyPayment.toLocaleString('en-US', {
              maximumFractionDigits: 0,
            })}`}
          />

          <ResultRow
            label="Annual Cashflow"
            value={`$${results.annualCashflow.toLocaleString('en-US', {
              maximumFractionDigits: 0,
            })}`}
            highlight={results.annualCashflow > 0}
          />

          <ResultRow
            label="Cash-on-Cash Return"
            value={`${results.cashOnCashReturn.toFixed(1)}%`}
            highlight={true}
          />

          <ResultRow
            label="Annual ROI"
            value={`${results.roi.toFixed(1)}%`}
            highlight={true}
          />

          <Text style={styles.projectionTitle}>5-Year Projection</Text>

          <ResultRow
            label="Total Cashflow"
            value={`$${results.fiveYearCashflow.toLocaleString('en-US', {
              maximumFractionDigits: 0,
            })}`}
          />

          <ResultRow
            label="Appreciation (3%/year)"
            value={`$${results.fiveYearAppreciation.toLocaleString('en-US', {
              maximumFractionDigits: 0,
            })}`}
          />

          <ResultRow
            label="Total Profit"
            value={`$${results.fiveYearProfit.toLocaleString('en-US', {
              maximumFractionDigits: 0,
            })}`}
            highlight={true}
          />

          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => generatePDF(results, 'ROI_Calculation')}
          >
            <Text style={styles.exportButtonText}>📄 Export PDF</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

// Helper Components
const InputField: React.FC<any> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      placeholderTextColor="#999"
    />
  </View>
);

const ResultRow: React.FC<any> = ({
  label,
  value,
  highlight,
}) => (
  <View style={[styles.resultRow, highlight && styles.highlightRow]}>
    <Text style={styles.resultLabel}>{label}</Text>
    <Text style={[styles.resultValue, highlight && styles.highlightValue]}>
      {value}
    </Text>
  </View>
);

const CheckboxField: React.FC<any> = ({
  label,
  checked,
  onPress,
}) => (
  <TouchableOpacity
    style={styles.checkboxContainer}
    onPress={onPress}
  >
    <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
    <Text style={styles.checkboxLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#666',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  calculateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 20,
  },
  calculateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#333',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  highlightRow: {
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 8,
    marginHorizontal: -8,
    paddingVertical: 12,
  },
  highlightValue: {
    color: '#007AFF',
    fontSize: 16,
  },
  projectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#666',
  },
  exportButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
});
```

---

## SECTION E: PAYMENT INTEGRATION

### E.1 SINPE Móvil Integration (Costa Rica Payments)

```typescript
// services/payments/sinpe.ts
import * as Stripe from '@stripe/react-native';

export const processSINPEPayment = async (
  amount: number,
  currency: 'CRC' | 'USD' = 'USD',
  description: string
): Promise<PaymentResult> => {
  try {
    // Initialize Stripe (supports SINPE via local payment methods)
    await Stripe.initStripe({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });

    // Create payment intent on backend
    const paymentIntentResponse = await fetch(
      'https://api.puraestateapp.com/create-payment-intent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Stripe uses cents
          currency: currency.toLowerCase(),
          description,
        }),
      }
    );

    const { clientSecret, paymentIntentId } = await paymentIntentResponse.json();

    // Present payment options (including local Costa Rica methods)
    const result = await Stripe.presentPaymentSheet();

    if (result.error) {
      throw new Error(result.error.message);
    }

    // Confirm payment
    const confirmResult = await Stripe.confirmPaymentSheetPayment();

    if (confirmResult.error) {
      throw new Error(confirmResult.error.message);
    }

    return {
      success: true,
      paymentIntentId,
      amount,
      currency,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Payment error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const updateSubscription = async (
  userId: string,
  tier: 'PREMIUM' | 'PROFESSIONAL'
): Promise<void> => {
  const pricing = {
    PREMIUM: { amount: 9.99, description: 'PuraEstate Premium - Monthly' },
    PROFESSIONAL: {
      amount: 29.99,
      description: 'PuraEstate Professional - Monthly',
    },
  };

  const paymentResult = await processSINPEPayment(
    pricing[tier].amount,
    'USD',
    pricing[tier].description
  );

  if (paymentResult.success) {
    // Update Firestore subscription
    await admin.firestore().collection('subscriptions').doc(userId).set({
      tier,
      status: 'active',
      startDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      paymentIntentId: paymentResult.paymentIntentId,
      autoRenew: true,
    });
  } else {
    throw new Error(`Payment failed: ${paymentResult.error}`);
  }
};
```

### E.2 Stripe Backend Setup (Node.js)

```typescript
// backend/routes/payments.ts
import express from 'express';
import Stripe from 'stripe';
import admin from 'firebase-admin';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, description, userId } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description,
      metadata: { userId },
      payment_method_types: ['card'], // Can add SINPE support
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Webhook for payment completion
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const userId = paymentIntent.metadata.userId;

      // Update user subscription in Firestore
      const tierMap: {[key: string]: 'PREMIUM' | 'PROFESSIONAL'} = {
        '999': 'PREMIUM',
        '2999': 'PROFESSIONAL',
      };

      const tier = tierMap[paymentIntent.amount.toString()];

      if (tier) {
        await admin.firestore()
          .collection('subscriptions')
          .doc(userId)
          .set({
            tier,
            status: 'active',
            startDate: new Date(),
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            paymentIntentId: paymentIntent.id,
            autoRenew: true,
          });
      }
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

export default router;
```

---

## SECTION F: TESTING CHECKLIST

### F.1 Unit Tests

```typescript
// __tests__/utils/roi.test.ts
import { calculateMortgagePayment, calculateROI } from '../../utils/roi';

describe('ROI Calculator', () => {
  test('calculates monthly mortgage payment correctly', () => {
    const payment = calculateMortgagePayment({
      principal: 308000,
      rate: 5.2,
      years: 30,
    });
    expect(payment).toBeCloseTo(1649, 0);
  });

  test('calculates ROI correctly', () => {
    const roi = calculateROI({
      purchasePrice: 385000,
      downPayment: 77000,
      annualRent: 21600,
      annualExpenses: 6260,
      monthlyMortgage: 1649,
    });
    expect(roi.cashOnCashReturn).toBeGreaterThan(15);
  });
});
```

### F.2 Integration Tests

```typescript
// __tests__/services/firebase/auth.test.ts
import { signUpWithEmail, signInWithEmail } from '../../services/firebase/auth';

describe('Firebase Authentication', () => {
  test('signs up user with email and password', async () => {
    const user = await signUpWithEmail(
      'test@example.com',
      'TestPassword123',
      {
        name: 'Test User',
      }
    );
    expect(user.email).toBe('test@example.com');
  });

  test('signs in user with valid credentials', async () => {
    const user = await signInWithEmail(
      'test@example.com',
      'TestPassword123'
    );
    expect(user.email).toBe('test@example.com');
  });
});
```

### F.3 E2E Tests (Detox)

```typescript
// e2e/signup.e2e.ts
describe('Sign Up Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete signup with valid data', async () => {
    // Navigate to signup
    await element(by.id('signup-button')).tap();

    // Fill form
    await element(by.id('email-input')).typeText('newuser@test.com');
    await element(by.id('password-input')).typeText('SecurePassword123');
    await element(by.id('confirm-password-input')).typeText(
      'SecurePassword123'
    );

    // Submit
    await element(by.id('create-account-button')).tap();

    // Verify navigation to profile setup
    await expect(element(by.text('Tell us about your investment goals'))).toBeVisible();
  });
});
```

---

## SECTION G: DEPLOYMENT & LAUNCH

### G.1 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Build & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test

      - name: Run linter
        run: npm run lint

      - name: Build app
        run: npm run build

  deploy-firebase:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install Firebase CLI
        run: npm install -g firebase-tools

      - name: Deploy to Firebase
        run: firebase deploy --token ${{ secrets.FIREBASE_TOKEN }}

  deploy-mobile:
    needs: build
    runs-on: macos-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v2

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm ci

      - name: Build for iOS
        run: eas build --platform ios --non-interactive

      - name: Build for Android
        run: eas build --platform android --non-interactive
```

### G.2 Environment Configuration

```bash
# .env.example
# Firebase
REACT_NATIVE_FIREBASE_API_KEY=your_api_key
REACT_NATIVE_FIREBASE_APP_ID=your_app_id
REACT_NATIVE_FIREBASE_MESSAGING_ID=your_messaging_id

# OpenRouter AI
OPENROUTER_API_KEY=your_openrouter_key

# Composio
COMPOSIO_API_KEY=your_composio_key
WHATSAPP_BUSINESS_PHONE_ID=your_phone_id
WHATSAPP_BUSINESS_API_TOKEN=your_token

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Config
APP_ENV=production
API_BASE_URL=https://api.puraestateapp.com
```

---

## QUICK REFERENCE - COMMAND CHEAT SHEET

```bash
# Development
npm run dev                    # Start dev server
npm run test                   # Run tests
npm run lint                   # Run linter
npm run build                  # Build app

# Firebase
firebase init                  # Initialize Firebase
firebase deploy                # Deploy to Firebase
firebase emulator:start        # Start local emulator
firebase functions:log         # View Cloud Function logs

# Expo (React Native)
npx expo start                 # Start Expo dev server
npx eas build                  # Build iOS/Android
npx eas submit                 # Submit to stores

# Git
git commit -m "message"        # Commit changes
git push origin main           # Push to main

# Docker (optional)
docker build -t puraestateapp .
docker run -p 3000:3000 puraestateapp
```

---

## FINAL 30-DAY TIMELINE

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Infrastructure | Firebase setup, API structure, schema design |
| 2 | Backend | Auth, Cloud Functions, Property database seeding |
| 3 | Frontend | Auth UI, Home, Search, Property detail screens |
| 4 | Integration | AI matching, WhatsApp automation, Payments |
| Launch | Testing & Deploy | Final QA, TestFlight/Play Store beta, go live |

---

**Next Steps:**
1. Clone this guide into a GitHub repo as your single source of truth
2. Assign each section to team members
3. Use GitHub Projects to track progress
4. Hold daily 15-min stand-ups to discuss blockers
5. Deploy to staging at Day 20 for user testing

Good luck with the launch!
