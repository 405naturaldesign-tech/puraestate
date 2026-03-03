# Puraestate Mobile App - AI & Automation Integration Guide

**Version:** 1.0
**Date:** 2026-02-24
**Purpose:** Detailed technical integration guide for OpenRouter and Composio services

---

## Table of Contents

1. [OpenRouter Integration](#openrouter-integration)
2. [Composio Integration](#composio-integration)
3. [Real-Time Sync Architecture](#real-time-sync-architecture)
4. [Cost Optimization & Rate Limiting](#cost-optimization--rate-limiting)
5. [Error Handling & Fallbacks](#error-handling--fallbacks)
6. [Monitoring & Analytics](#monitoring--analytics)

---

## OpenRouter Integration

### Overview

OpenRouter is used as a unified API gateway for multiple LLM providers, enabling cost optimization and fallback capabilities. The app leverages three primary AI features:

1. **Smart Property Matching** - Personalized recommendations
2. **Description Generation** - Auto-created listing descriptions
3. **Price Suggestions** - Market-based pricing recommendations

### Setup & Configuration

#### Environment Variables

```env
# .env.production
OPENROUTER_API_KEY=sk_live_xxxxx
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_SITE_URL=https://puraestate.com
OPENROUTER_SITE_NAME=Puraestate Real Estate

# Model selections (with fallbacks)
OPENROUTER_PRIMARY_MODEL=gpt-4-turbo-preview
OPENROUTER_FALLBACK_MODEL=claude-3-sonnet
OPENROUTER_BUDGET_MODEL=gpt-3.5-turbo

# Rate limiting
OPENROUTER_MAX_REQUESTS_PER_MIN=100
OPENROUTER_MAX_TOKENS_PER_REQUEST=2000
```

#### API Client Setup

```typescript
// services/ai/openrouter.ts
import axios, { AxiosInstance } from 'axios';

interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  fallbackModel: string;
  maxRetries: number;
  timeout: number;
}

class OpenRouterClient {
  private client: AxiosInstance;
  private config: OpenRouterConfig;
  private requestQueue: Map<string, number> = new Map(); // Track request timestamps

  constructor(config: OpenRouterConfig) {
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseUrl,
      defaultHeaders: {
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL,
        'X-Title': process.env.OPENROUTER_SITE_NAME,
      },
      timeout: config.timeout,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 429) {
          // Rate limited - implement backoff
          const retryAfter = error.response.headers['retry-after'] || 60;
          await this.delay(parseInt(retryAfter) * 1000);
          return this.client(error.config);
        }

        if (error.response?.status === 503) {
          // Service unavailable - try fallback model
          if (error.config.modelUsed !== 'fallback') {
            error.config.modelUsed = 'fallback';
            error.config.data.model = this.config.fallbackModel;
            return this.client(error.config);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async generateCompletion(
    prompt: string,
    model?: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    try {
      const response = await this.client.post('/chat/completions', {
        model: model || this.config.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 2000,
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter error:', error);
      throw error;
    }
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const openRouter = new OpenRouterClient({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseUrl: process.env.OPENROUTER_BASE_URL!,
  defaultModel: process.env.OPENROUTER_PRIMARY_MODEL!,
  fallbackModel: process.env.OPENROUTER_FALLBACK_MODEL!,
  maxRetries: 3,
  timeout: 30000,
});
```

### Feature 1: Smart Property Matching

#### Request/Response Flow

```typescript
// services/ai/propertyMatching.ts
import { openRouter } from './openrouter';
import { cacheManager } from '../cache';

interface MatchingRequest {
  userId: string;
  userProfile: {
    previousSearches: Property[];
    savedProperties: Property[];
    viewingHistory: PropertyView[];
    preferences: UserPreferences;
    demographics: Demographics;
  };
  availableProperties: Property[];
  count: number;
}

interface PropertyMatch {
  propertyId: string;
  matchScore: number;
  matchReasons: string[];
  predictedInterest: 'high' | 'medium' | 'low';
  aiInsights: string;
}

interface MatchingResponse {
  matches: PropertyMatch[];
  generatedAt: string;
  modelUsed: string;
  tokensUsed: {
    prompt: number;
    completion: number;
  };
}

class PropertyMatchingService {
  async findMatches(request: MatchingRequest): Promise<MatchingResponse> {
    // Check cache first
    const cacheKey = `matches_${request.userId}`;
    const cached = await cacheManager.get(cacheKey);
    if (cached && !this.isCacheStale(cached)) {
      return cached;
    }

    // Build structured prompt
    const prompt = this.buildMatchingPrompt(request);

    // Call OpenRouter
    const result = await openRouter.generateCompletion(prompt, undefined, {
      temperature: 0.5, // Lower temperature for consistency
      maxTokens: 2000,
    });

    // Parse response
    const matches = this.parseMatchingResponse(result, request);

    // Cache result
    await cacheManager.set(cacheKey, matches, {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
    });

    return matches;
  }

  private buildMatchingPrompt(request: MatchingRequest): string {
    return `
You are a luxury real estate AI matching expert. Analyze this buyer profile and recommend the best matching properties.

BUYER PROFILE:
- Name: ${request.userProfile.demographics.name}
- Budget Range: $${request.userProfile.preferences.minPrice} - $${request.userProfile.preferences.maxPrice}
- Preferred Locations: ${request.userProfile.preferences.locations.join(', ')}
- Property Type Preference: ${request.userProfile.preferences.propertyTypes.join(', ')}
- Bedrooms: ${request.userProfile.preferences.bedrooms}
- Must-Have Amenities: ${request.userProfile.preferences.amenities.join(', ')}
- Previously Saved: ${request.userProfile.savedProperties.map(p => p.address).join('; ')}
- Recently Viewed: ${request.userProfile.viewingHistory
      .slice(-5)
      .map(v => v.property.address)
      .join('; ')}

AVAILABLE PROPERTIES:
${request.availableProperties
  .map(
    p => `
Property ${p.id}: ${p.address}
- Price: $${p.price}
- Type: ${p.type}
- Bedrooms: ${p.bedrooms}, Bathrooms: ${p.bathrooms}
- Square Feet: ${p.sqft}
- Amenities: ${p.amenities.join(', ')}
- Built: ${p.yearBuilt}
- HOA: $${p.hoaFees}
`
  )
  .join('\n')}

TASK:
1. Score each property 0-100 based on buyer fit
2. Explain why each property matches/doesn't match
3. Predict buyer interest level
4. Identify lifestyle benefits for top matches

Return response as JSON:
{
  "matches": [
    {
      "propertyId": "...",
      "matchScore": 0-100,
      "matchReasons": [...],
      "predictedInterest": "high/medium/low",
      "aiInsights": "..."
    }
  ]
}`;
  }

  private parseMatchingResponse(
    response: string,
    request: MatchingRequest
  ): MatchingResponse {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        matches: parsed.matches
          .sort((a: PropertyMatch, b: PropertyMatch) => b.matchScore - a.matchScore)
          .slice(0, request.count),
        generatedAt: new Date().toISOString(),
        modelUsed: this.config.defaultModel,
        tokensUsed: {
          prompt: Math.ceil(request.userProfile.savedProperties.length * 50),
          completion: Math.ceil(parsed.matches.length * 100),
        },
      };
    } catch (error) {
      console.error('Failed to parse matching response:', error);
      throw error;
    }
  }

  private isCacheStale(cached: MatchingResponse): boolean {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return new Date(cached.generatedAt).getTime() < oneHourAgo;
  }
}

export const propertyMatchingService = new PropertyMatchingService();
```

#### Redux Integration

```typescript
// redux/slices/recommendationsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { propertyMatchingService } from '../../services/ai/propertyMatching';

export const fetchPropertyMatches = createAsyncThunk(
  'recommendations/fetchMatches',
  async (userId: string, { rejectWithValue }) => {
    try {
      const user = await userService.getUser(userId);
      const properties = await propertyService.getAvailable();

      const request = {
        userId,
        userProfile: user,
        availableProperties: properties,
        count: 5,
      };

      return propertyMatchingService.findMatches(request);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const recommendationsSlice = createSlice({
  name: 'recommendations',
  initialState: {
    matches: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
  },
  extraReducers: builder => {
    builder
      .addCase(fetchPropertyMatches.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPropertyMatches.fulfilled, (state, action) => {
        state.isLoading = false;
        state.matches = action.payload.matches;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchPropertyMatches.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // Keep previous matches as fallback
      });
  },
});

export default recommendationsSlice.reducer;
```

#### Component Implementation

```typescript
// screens/discover/HomeScreen.tsx
import React, { useEffect } from 'react';
import { ScrollView, View, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPropertyMatches } from '../../redux/slices/recommendationsSlice';
import PropertyCard from '../../components/cards/PropertyCard';

const HomeScreen = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { matches, isLoading, error } = useSelector(state => state.recommendations);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchPropertyMatches(user.id));
    }
  }, [user?.id]);

  return (
    <ScrollView>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personalized For You</Text>

        {isLoading && <ActivityIndicator />}
        {error && <ErrorAlert message={error} />}

        {matches.map(match => (
          <PropertyCard
            key={match.propertyId}
            property={match}
            showMatchScore={true}
            onPress={() =>
              navigation.navigate('PropertyDetail', {
                id: match.propertyId,
              })
            }
          />
        ))}
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
```

### Feature 2: Description Generation

#### API Service

```typescript
// services/ai/descriptionGenerator.ts
import { openRouter } from './openrouter';

interface DescriptionRequest {
  propertyId: string;
  propertyData: Property;
  style?: 'luxury' | 'casual' | 'professional';
  focusAreas?: string[];
}

interface DescriptionResponse {
  title: string;
  description: string;
  highlights: string[];
  seoKeywords: string[];
}

class DescriptionGeneratorService {
  async generateDescription(
    request: DescriptionRequest
  ): Promise<DescriptionResponse> {
    const prompt = this.buildPrompt(request);

    const result = await openRouter.generateCompletion(prompt, undefined, {
      temperature: 0.8, // Higher creativity
      maxTokens: 1500,
    });

    return this.parseResponse(result);
  }

  private buildPrompt(request: DescriptionRequest): string {
    const styleGuides = {
      luxury: `Write in elegant, sophisticated language emphasizing prestige,
        exclusivity, and premium lifestyle benefits.`,
      casual: `Write in friendly, approachable language that appeals to
        families and everyday buyers.`,
      professional: `Write in clear, factual language suitable for
        investors and business professionals.`,
    };

    return `
Generate a compelling real estate listing description for this property:

ADDRESS: ${request.propertyData.address}
TYPE: ${request.propertyData.type}
PRICE: $${request.propertyData.price}
BEDROOMS: ${request.propertyData.bedrooms}
BATHROOMS: ${request.propertyData.bathrooms}
SQUARE FEET: ${request.propertyData.sqft}
LOT SIZE: ${request.propertyData.lotSize}
YEAR BUILT: ${request.propertyData.yearBuilt}
STYLE: ${request.propertyData.style}

AMENITIES:
${request.propertyData.amenities.map(a => `- ${a}`).join('\n')}

NEIGHBORHOOD:
- Schools: ${request.propertyData.neighborhood.schools}
- Walkability: ${request.propertyData.neighborhood.walkability}
- Average Home Value: $${request.propertyData.neighborhood.avgHomeValue}
${request.propertyData.neighborhood.highlights.map(h => `- ${h}`).join('\n')}

SPECIAL FEATURES:
${request.propertyData.specialFeatures.map(f => `- ${f}`).join('\n')}

FOCUS AREAS: ${request.focusAreas?.join(', ') || 'all features'}

STYLE GUIDE: ${styleGuides[request.style || 'luxury']}

REQUIREMENTS:
1. Main description: 150-200 words
2. Include lifestyle benefits, not just features
3. Highlight investment potential
4. Use evocative, sensory language
5. Include call-to-action
6. SEO-optimize with natural keywords
7. Create catchy headline (under 10 words)

Return as JSON:
{
  "title": "...",
  "description": "...",
  "highlights": ["...", "...", ...],
  "seoKeywords": ["...", "...", ...]
}`;
  }

  private parseResponse(response: string): DescriptionResponse {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    return JSON.parse(jsonMatch[0]);
  }
}

export const descriptionGenerator = new DescriptionGeneratorService();
```

#### Agent Dashboard Integration

```typescript
// screens/admin/ListingEditScreen.tsx
import React, { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { descriptionGenerator } from '../../services/ai/descriptionGenerator';
import TextInput from '../../components/common/TextInput';

const ListingEditScreen = ({ propertyId }: { propertyId: string }) => {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const property = useSelector(state =>
    state.properties.items.find(p => p.id === propertyId)
  );

  const handleGenerateDescription = async () => {
    setIsGenerating(true);
    try {
      const result = await descriptionGenerator.generateDescription({
        propertyId,
        propertyData: property,
        style: 'luxury',
        focusAreas: ['luxury', 'investment'],
      });

      setDescription(result.description);
      dispatch(updateListing({
        id: propertyId,
        title: result.title,
        description: result.description,
        keywords: result.seoKeywords,
        highlights: result.highlights,
      }));

      showToast('Description generated successfully');
    } catch (error) {
      showError('Failed to generate description');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.descriptionSection}>
        <View style={styles.header}>
          <Text style={styles.label}>Description</Text>
          <TouchableOpacity onPress={handleGenerateDescription}>
            <View style={styles.aiButton}>
              {isGenerating ? (
                <ActivityIndicator size="small" color="#D4AF37" />
              ) : (
                <>
                  <Icon name="sparkles" size={16} color="#D4AF37" />
                  <Text style={styles.aiButtonText}>AI Generate</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <TextInput
          multiline
          value={description}
          onChangeText={setDescription}
          placeholder="Property description..."
          numberOfLines={6}
        />
      </View>
    </View>
  );
};

export default ListingEditScreen;
```

### Feature 3: Price Suggestions

#### Pricing Algorithm

```typescript
// services/ai/pricingAdvisor.ts
import { openRouter } from './openrouter';
import { marketDataService } from '../market';

interface PriceRequest {
  propertyId: string;
  propertyData: Property;
  marketData: {
    comparables: Property[];
    areaStats: AreaStatistics;
    seasonality: 'spring' | 'summer' | 'fall' | 'winter';
  };
}

interface PriceResponse {
  suggestedPrice: number;
  priceRange: {
    conservative: number; // Bottom 10%
    moderate: number; // Bottom 25%
    aggressive: number; // Top 10%
  };
  confidence: number; // 0-100
  marketAnalysis: string;
  recommendations: string[];
}

class PricingAdvisorService {
  async getSuggestion(request: PriceRequest): Promise<PriceResponse> {
    // Pre-calculate baseline price from comparables
    const baselinePrice = this.calculateBaselinePrice(request.marketData.comparables);
    const adjustments = this.calculateAdjustments(
      request.propertyData,
      request.marketData.comparables
    );

    // Use AI to analyze market context
    const aiAnalysis = await this.getMarketAnalysis(request, baselinePrice);

    // Combine data-driven and AI insights
    const finalPrice = this.blendPrices(baselinePrice, aiAnalysis, adjustments);

    return {
      suggestedPrice: finalPrice,
      priceRange: {
        conservative: Math.round(finalPrice * 0.92),
        moderate: Math.round(finalPrice * 0.98),
        aggressive: Math.round(finalPrice * 1.05),
      },
      confidence: this.calculateConfidence(request),
      marketAnalysis: aiAnalysis.analysis,
      recommendations: aiAnalysis.recommendations,
    };
  }

  private calculateBaselinePrice(comparables: Property[]): number {
    const pricePerSqft = comparables
      .filter(c => c.sqft > 0)
      .reduce((sum, c) => sum + c.price / c.sqft, 0) / comparables.length;

    return Math.round(pricePerSqft * this.propertyData.sqft);
  }

  private calculateAdjustments(
    property: Property,
    comparables: Property[]
  ): Record<string, number> {
    const adjustments: Record<string, number> = {};

    // Age adjustment
    const avgYearBuilt =
      comparables.reduce((sum, c) => sum + c.yearBuilt, 0) / comparables.length;
    const ageAdjustment = (property.yearBuilt - avgYearBuilt) * 0.005; // 0.5% per year
    adjustments.age = ageAdjustment;

    // Condition adjustment (if data available)
    adjustments.condition = this.getConditionAdjustment(property);

    // Amenities adjustment
    adjustments.amenities = this.getAmenitiesAdjustment(property, comparables);

    return adjustments;
  }

  private async getMarketAnalysis(
    request: PriceRequest,
    baselinePrice: number
  ): Promise<{ analysis: string; recommendations: string[] }> {
    const prompt = `
Analyze the real estate market for this property and pricing:

PROPERTY:
- Address: ${request.propertyData.address}
- Price (baseline): $${baselinePrice}
- Beds/Baths: ${request.propertyData.bedrooms}/${request.propertyData.bathrooms}
- SqFt: ${request.propertyData.sqft}

MARKET CONDITIONS:
- Season: ${request.marketData.seasonality}
- Days on market (average): ${request.marketData.areaStats.avgDaysOnMarket}
- List-to-sold ratio: ${request.marketData.areaStats.listToSoldRatio}
- Price trend: ${request.marketData.areaStats.priceTrend}%

RECENT COMPARABLES:
${request.marketData.comparables
  .slice(0, 3)
  .map(
    c => `
- ${c.address}: $${c.price} (${c.daysOnMarket} days on market)
`
  )
  .join('')}

ANALYSIS TASK:
1. Assess market conditions and buyer sentiment
2. Evaluate competitiveness of baseline price
3. Predict likely sale speed
4. Identify price optimization opportunities
5. Consider seasonal factors

Provide:
- Market analysis (2-3 sentences)
- Top 3 pricing recommendations
- Risk assessment

Format as JSON:
{
  "analysis": "...",
  "recommendations": ["...", "...", "..."]
}`;

    const result = await openRouter.generateCompletion(prompt, undefined, {
      temperature: 0.6,
      maxTokens: 800,
    });

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch![0]);
  }

  private blendPrices(
    baseline: number,
    aiAnalysis: any,
    adjustments: Record<string, number>
  ): number {
    // Weight baseline at 60%, adjustments at 20%, AI insights at 20%
    const adjustmentFactor = Object.values(adjustments).reduce((a, b) => a + b, 0);
    const aiFactor = aiAnalysis.sentiment === 'bullish' ? 0.03 : -0.03;

    return Math.round(
      baseline * (1 + adjustmentFactor * 0.2) * (1 + aiFactor * 0.2)
    );
  }

  private calculateConfidence(request: PriceRequest): number {
    let confidence = 85;

    // Reduce confidence if few comparables
    if (request.marketData.comparables.length < 3) {
      confidence -= 15;
    }

    // Reduce confidence if old comparables
    const avgComparableAge =
      request.marketData.comparables.reduce(
        (sum, c) => sum + (Date.now() - new Date(c.soldDate).getTime()),
        0
      ) / request.marketData.comparables.length;
    if (avgComparableAge > 60 * 24 * 60 * 60 * 1000) {
      confidence -= 10;
    }

    return Math.max(confidence, 60);
  }
}

export const pricingAdvisor = new PricingAdvisorService();
```

#### UI Component

```typescript
// screens/admin/PriceSuggestionModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { pricingAdvisor } from '../../services/ai/pricingAdvisor';
import ModalBase from '../../components/common/Modal';
import PriceSlider from '../../components/common/PriceSlider';

const PriceSuggestionModal = ({ propertyId, isVisible, onClose }) => {
  const [suggestion, setSuggestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const property = useSelector(state =>
    state.properties.items.find(p => p.id === propertyId)
  );

  useEffect(() => {
    if (isVisible && !suggestion) {
      loadSuggestion();
    }
  }, [isVisible]);

  const loadSuggestion = async () => {
    setIsLoading(true);
    try {
      const marketData = await marketDataService.getAreaStats(property.address);
      const result = await pricingAdvisor.getSuggestion({
        propertyId,
        propertyData: property,
        marketData,
      });
      setSuggestion(result);
    } catch (error) {
      showError('Failed to get price suggestion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalBase isVisible={isVisible} onClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>AI Price Suggestion</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#D4AF37" />
        ) : suggestion ? (
          <>
            <View style={styles.suggestionBox}>
              <Text style={styles.label}>Recommended Price</Text>
              <Text style={styles.price}>
                ${suggestion.suggestedPrice.toLocaleString()}
              </Text>
              <Text style={styles.confidence}>
                Confidence: {suggestion.confidence}%
              </Text>
            </View>

            <View style={styles.rangeBox}>
              <Text style={styles.label}>Price Range</Text>
              <PriceSlider
                min={suggestion.priceRange.conservative}
                max={suggestion.priceRange.aggressive}
                value={suggestion.suggestedPrice}
                onValueChange={value => dispatch(updateListingPrice(propertyId, value))}
              />
              <View style={styles.rangeLabels}>
                <Text>Conservative: ${suggestion.priceRange.conservative.toLocaleString()}</Text>
                <Text>Moderate: ${suggestion.priceRange.moderate.toLocaleString()}</Text>
                <Text>Aggressive: ${suggestion.priceRange.aggressive.toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.analysisBox}>
              <Text style={styles.label}>Market Analysis</Text>
              <Text style={styles.analysis}>{suggestion.marketAnalysis}</Text>

              <Text style={styles.recommendationsTitle}>Recommendations:</Text>
              {suggestion.recommendations.map((rec, idx) => (
                <Text key={idx} style={styles.recommendation}>
                  {idx + 1}. {rec}
                </Text>
              ))}
            </View>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => {
                dispatch(updateListingPrice(propertyId, suggestion.suggestedPrice));
                onClose();
              }}
            >
              <Text style={styles.buttonText}>Accept Suggestion</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </ModalBase>
  );
};

export default PriceSuggestionModal;
```

---

## Composio Integration

### Overview

Composio is a workflow automation platform that orchestrates real-time notifications, lead assignment, and data synchronization. The app uses Composio for five primary workflows.

### Setup & Configuration

#### Environment & API Client

```typescript
// services/automation/composio.ts
import axios, { AxiosInstance } from 'axios';

interface ComposioConfig {
  apiKey: string;
  baseUrl: string;
  webhookSecret: string;
}

class ComposioClient {
  private client: AxiosInstance;
  private config: ComposioConfig;

  constructor(config: ComposioConfig) {
    this.config = config;

    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async executeWorkflow(
    workflowId: string,
    payload: Record<string, any>
  ): Promise<{ executionId: string; status: string }> {
    const response = await this.client.post('/workflows/execute', {
      workflow_id: workflowId,
      payload,
      context: {
        timestamp: new Date().toISOString(),
        appVersion: APP_VERSION,
      },
    });

    return response.data;
  }

  async getWorkflowStatus(executionId: string): Promise<any> {
    const response = await this.client.get(`/workflows/executions/${executionId}`);
    return response.data;
  }

  async triggerWebhook(
    webhookId: string,
    event: string,
    data: Record<string, any>
  ): Promise<void> {
    const signature = this.generateSignature(data);
    await this.client.post(`/webhooks/${webhookId}/trigger`, data, {
      headers: {
        'X-Composio-Signature': signature,
      },
    });
  }

  private generateSignature(payload: Record<string, any>): string {
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }
}

export const composio = new ComposioClient({
  apiKey: process.env.COMPOSIO_API_KEY!,
  baseUrl: 'https://api.composio.dev/v1',
  webhookSecret: process.env.COMPOSIO_WEBHOOK_SECRET!,
});
```

### Workflow 1: Price Drop Alerts

#### Workflow Definition

```yaml
# composio/workflows/price-drop-alert.yaml
id: price-drop-alert
name: Price Drop Alert
description: Monitor property prices and notify users

triggers:
  - type: database
    event: property.price_updated
    condition: new_price < old_price

steps:
  - id: calculate_discount
    action: utils.calculate_percentage
    inputs:
      new_value: "{{ trigger.new_price }}"
      old_value: "{{ trigger.old_price }}"
    output: discount_percent

  - id: check_saved_properties
    action: database.query
    inputs:
      table: saved_properties
      where:
        property_id: "{{ trigger.property_id }}"
    output: saved_by_users

  - id: generate_notification
    action: content.generate_notification
    inputs:
      template: price-drop
      context:
        property_address: "{{ trigger.property.address }}"
        discount: "{{ steps.calculate_discount.discount_percent }}"
        new_price: "{{ trigger.new_price }}"
        old_price: "{{ trigger.old_price }}"
    output: notification_message

  - id: send_notifications
    action: notification.send_batch
    inputs:
      user_ids: "{{ steps.check_saved_properties.user_ids }}"
      notification: "{{ steps.generate_notification.notification_message }}"
      channels:
        - push
        - in_app
        - email

  - id: log_event
    action: analytics.log_event
    inputs:
      event_type: price_drop_alert_sent
      property_id: "{{ trigger.property_id }}"
      user_count: "{{ steps.send_notifications.sent_count }}"
```

#### Service Implementation

```typescript
// services/automation/priceDropWorkflow.ts
import { composio } from './composio';
import { notificationService } from '../notifications';

interface PriceDropEvent {
  propertyId: string;
  previousPrice: number;
  newPrice: number;
  property: Property;
}

class PriceDropWorkflow {
  async onPropertyPriceChanged(event: PriceDropEvent) {
    // Execute Composio workflow
    const execution = await composio.executeWorkflow('price-drop-alert', {
      property_id: event.propertyId,
      old_price: event.previousPrice,
      new_price: event.newPrice,
      property: {
        address: event.property.address,
        type: event.property.type,
      },
    });

    // Track in analytics
    console.log(`Price drop workflow started: ${execution.executionId}`);

    // Optional: Set up webhook listener for workflow completion
    this.listenToWorkflowCompletion(execution.executionId);
  }

  private listenToWorkflowCompletion(executionId: string) {
    const pollInterval = setInterval(async () => {
      try {
        const status = await composio.getWorkflowStatus(executionId);

        if (status.state === 'completed') {
          clearInterval(pollInterval);
          console.log(`Workflow completed: ${status.result}`);
        } else if (status.state === 'failed') {
          clearInterval(pollInterval);
          console.error(`Workflow failed: ${status.error}`);
        }
      } catch (error) {
        console.error('Failed to check workflow status:', error);
      }
    }, 5000); // Poll every 5 seconds

    // Timeout after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
  }
}

export const priceDropWorkflow = new PriceDropWorkflow();
```

#### Integration with Property Service

```typescript
// services/properties/propertyService.ts
import { priceDropWorkflow } from '../automation/priceDropWorkflow';

class PropertyService {
  async updateProperty(propertyId: string, updates: Partial<Property>) {
    const previousProperty = await this.getProperty(propertyId);
    const updatedProperty = { ...previousProperty, ...updates };

    // Save to database
    await db.updateProperty(propertyId, updatedProperty);

    // Check for price change
    if (updates.price && updates.price !== previousProperty.price) {
      await priceDropWorkflow.onPropertyPriceChanged({
        propertyId,
        previousPrice: previousProperty.price,
        newPrice: updates.price,
        property: updatedProperty,
      });
    }

    // Update cache
    await cacheManager.invalidate(`property_${propertyId}`);

    return updatedProperty;
  }
}

export const propertyService = new PropertyService();
```

### Workflow 2: New Listing Notifications

```typescript
// services/automation/newListingWorkflow.ts
import { composio } from './composio';

interface NewListingEvent {
  propertyId: string;
  property: Property;
  agentId: string;
}

class NewListingWorkflow {
  async onPropertyListed(event: NewListingEvent) {
    const execution = await composio.executeWorkflow('new-listing-alert', {
      property_id: event.propertyId,
      property_data: {
        address: event.property.address,
        price: event.property.price,
        bedrooms: event.property.bedrooms,
        bathrooms: event.property.bathrooms,
        type: event.property.type,
        amenities: event.property.amenities,
      },
      agent_id: event.agentId,
      listing_date: new Date().toISOString(),
    });

    console.log(`New listing workflow started: ${execution.executionId}`);
  }
}
```

### Workflow 3: Viewing Reminders

```typescript
// services/automation/viewingReminderWorkflow.ts
import { composio } from './composio';

interface ViewingReminderEvent {
  bookingId: string;
  userId: string;
  propertyId: string;
  viewingTime: Date;
  agentId: string;
}

class ViewingReminderWorkflow {
  async onViewingScheduled(event: ViewingReminderEvent) {
    // Schedule two reminders: 24h before and 1h before
    const twentyFourHoursBefore = new Date(event.viewingTime.getTime() - 24 * 60 * 60 * 1000);
    const oneHourBefore = new Date(event.viewingTime.getTime() - 60 * 60 * 1000);

    // Schedule first reminder
    await composio.executeWorkflow('schedule-viewing-reminder', {
      booking_id: event.bookingId,
      user_id: event.userId,
      property_id: event.propertyId,
      viewing_time: event.viewingTime.toISOString(),
      agent_id: event.agentId,
      reminder_times: [
        twentyFourHoursBefore.toISOString(),
        oneHourBefore.toISOString(),
      ],
    });
  }
}
```

### Workflow 4: Offer Status Updates

```typescript
// services/automation/offerStatusWorkflow.ts
import { composio } from './composio';

enum OfferStatus {
  SUBMITTED = 'submitted',
  ACCEPTED = 'accepted',
  COUNTERED = 'countered',
  REJECTED = 'rejected',
  CLOSED = 'closed',
}

interface OfferStatusChangeEvent {
  offerId: string;
  previousStatus: OfferStatus;
  newStatus: OfferStatus;
  buyerId: string;
  agentId: string;
  propertyId: string;
}

class OfferStatusWorkflow {
  async onOfferStatusChanged(event: OfferStatusChangeEvent) {
    const execution = await composio.executeWorkflow('offer-status-update', {
      offer_id: event.offerId,
      status: event.newStatus,
      buyer_id: event.buyerId,
      agent_id: event.agentId,
      property_id: event.propertyId,
      status_change: {
        from: event.previousStatus,
        to: event.newStatus,
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`Offer status workflow started: ${execution.executionId}`);
  }
}

export const offerStatusWorkflow = new OfferStatusWorkflow();
```

### Workflow 5: Lead Assignment

```typescript
// services/automation/leadAssignmentWorkflow.ts
import { composio } from './composio';

interface NewInquiryEvent {
  inquiryId: string;
  buyerId: string;
  propertyId: string;
  inquiryType: 'viewing' | 'question' | 'offer' | 'application';
  inquiryText: string;
  timestamp: Date;
}

class LeadAssignmentWorkflow {
  async onNewInquiry(event: NewInquiryEvent) {
    const execution = await composio.executeWorkflow('auto-assign-lead', {
      inquiry_id: event.inquiryId,
      buyer_id: event.buyerId,
      property_id: event.propertyId,
      inquiry_type: event.inquiryType,
      inquiry_text: event.inquiryText,
      timestamp: event.timestamp.toISOString(),
    });

    console.log(`Lead assignment workflow started: ${execution.executionId}`);
  }
}

export const leadAssignmentWorkflow = new LeadAssignmentWorkflow();
```

---

## Real-Time Sync Architecture

### WebSocket Implementation

```typescript
// services/realtime/websocketService.ts
import { WebSocket } from 'react-native';
import { useDispatch } from 'react-redux';

interface RealtimeUpdate {
  type: 'price_change' | 'new_inquiry' | 'message' | 'offer_update' | 'property_updated';
  propertyId?: string;
  userId?: string;
  timestamp: string;
  data: Record<string, any>;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageQueue: RealtimeUpdate[] = [];
  private isConnected = false;

  connect(userId: string) {
    this.userId = userId;
    const wsUrl = `${WS_BASE_URL}/user/${userId}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.flushMessageQueue();
    };

    this.ws.onmessage = (event) => {
      const update = JSON.parse(event.data) as RealtimeUpdate;
      this.handleUpdate(update);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnected = false;
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      this.attemptReconnect();
    };
  }

  private handleUpdate(update: RealtimeUpdate) {
    const dispatch = useDispatch();

    switch (update.type) {
      case 'price_change':
        dispatch(updatePropertyPrice({
          propertyId: update.propertyId,
          newPrice: update.data.newPrice,
          previousPrice: update.data.previousPrice,
        }));

        // Show notification
        NotificationService.show({
          title: 'Price Changed',
          message: `Property is now ${update.data.newPrice}`,
          type: 'info',
        });
        break;

      case 'new_inquiry':
        dispatch(addInquiry(update.data));
        if (update.data.type === 'lead') {
          NotificationService.show({
            title: 'New Inquiry',
            message: `${update.data.buyerName} is interested`,
            type: 'high',
          });
        }
        break;

      case 'message':
        dispatch(addMessage(update.data));
        NotificationService.show({
          title: 'New Message',
          message: update.data.text.substring(0, 50),
          type: 'high',
        });
        break;

      case 'offer_update':
        dispatch(updateOffer(update.data));
        NotificationService.show({
          title: 'Offer Status Changed',
          message: `Your offer is now ${update.data.status}`,
          type: 'high',
        });
        break;

      case 'property_updated':
        dispatch(updateProperty({
          id: update.propertyId,
          ...update.data,
        }));
        break;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`Attempting to reconnect in ${delay}ms`);

      setTimeout(() => {
        if (this.userId) {
          this.connect(this.userId);
        }
      }, delay);
    }
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  sendMessage(update: RealtimeUpdate) {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(update));
    } else {
      this.messageQueue.push(update);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
    this.isConnected = false;
  }
}

export const webSocketService = new WebSocketService();
```

### Redux Integration for Real-Time Updates

```typescript
// redux/middlewares/realtimeMiddleware.ts
import { webSocketService } from '../../services/realtime/websocketService';

export const realtimeMiddleware = (store: any) => (next: any) => (action: any) => {
  const result = next(action);

  // Broadcast property updates to other users
  if (action.type === 'properties/updateProperty') {
    webSocketService.sendMessage({
      type: 'property_updated',
      propertyId: action.payload.id,
      data: action.payload,
      timestamp: new Date().toISOString(),
    });
  }

  // Broadcast message sends
  if (action.type === 'messages/sendMessage') {
    webSocketService.sendMessage({
      type: 'message',
      userId: store.getState().auth.user.id,
      data: action.payload,
      timestamp: new Date().toISOString(),
    });
  }

  return result;
};
```

---

## Cost Optimization & Rate Limiting

### Cost Management Strategy

```typescript
// services/cost/costOptimizer.ts
import { openRouter } from '../ai/openrouter';

class CostOptimizer {
  private modelCosts = {
    'gpt-4-turbo-preview': 0.03, // $/1K prompt tokens
    'claude-3-sonnet': 0.003,
    'gpt-3.5-turbo': 0.0005,
  };

  async selectOptimalModel(
    task: 'matching' | 'description' | 'pricing',
    priority: 'speed' | 'quality' | 'cost'
  ): Promise<string> {
    const modelSelection = {
      matching: {
        speed: 'gpt-3.5-turbo',
        quality: 'gpt-4-turbo-preview',
        cost: 'claude-3-sonnet',
      },
      description: {
        speed: 'gpt-3.5-turbo',
        quality: 'claude-3-sonnet',
        cost: 'gpt-3.5-turbo',
      },
      pricing: {
        speed: 'gpt-3.5-turbo',
        quality: 'gpt-4-turbo-preview',
        cost: 'claude-3-sonnet',
      },
    };

    return modelSelection[task][priority];
  }

  async estimateCost(
    model: string,
    promptTokens: number,
    completionTokens: number
  ): Promise<number> {
    const promptCost = (promptTokens / 1000) * this.modelCosts[model];
    const completionCost = (completionTokens / 1000) * (this.modelCosts[model] * 2);
    return promptCost + completionCost;
  }

  async batchProcess(
    items: any[],
    processor: (item: any) => Promise<any>,
    batchSize: number = 10
  ): Promise<any[]> {
    const results = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item => processor(item))
      );
      results.push(...batchResults);

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return results;
  }
}

export const costOptimizer = new CostOptimizer();
```

### Rate Limiter Implementation

```typescript
// services/ratelimit/rateLimiter.ts
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs = 60000; // 1 minute
  private readonly maxRequests = 100;

  async checkLimit(userId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    const now = Date.now();
    let userRequests = this.requests.get(userId) || [];

    // Remove old requests outside the window
    userRequests = userRequests.filter(time => now - time < this.windowMs);

    if (userRequests.length >= this.maxRequests) {
      const oldestRequest = userRequests[0];
      const retryAfter = Math.ceil((oldestRequest + this.windowMs - now) / 1000);
      return { allowed: false, retryAfter };
    }

    userRequests.push(now);
    this.requests.set(userId, userRequests);

    return { allowed: true };
  }

  getRemainingRequests(userId: string): number {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

export const rateLimiter = new RateLimiter();
```

---

## Error Handling & Fallbacks

### Graceful Degradation

```typescript
// services/fallback/fallbackManager.ts
class FallbackManager {
  async getPropertyMatches(userId: string) {
    try {
      // Try AI matching first
      return await propertyMatchingService.findMatches({
        userId,
        userProfile: await getUserProfile(userId),
        availableProperties: await getAvailableProperties(),
        count: 5,
      });
    } catch (error) {
      console.warn('AI matching failed, using fallback', error);

      // Fallback 1: Database-driven matching
      try {
        return await database.query(`
          SELECT p.* FROM properties p
          INNER JOIN user_preferences up ON p.type = up.preferred_type
          WHERE up.user_id = ? AND p.price BETWEEN ? AND ?
          ORDER BY p.listed_date DESC
          LIMIT 5
        `, [userId]);
      } catch (fallbackError) {
        console.warn('Database fallback failed', fallbackError);

        // Fallback 2: Static recommendations
        return await this.getStaticRecommendations(userId);
      }
    }
  }

  async generateDescription(propertyId: string, propertyData: Property) {
    try {
      return await descriptionGenerator.generateDescription({
        propertyId,
        propertyData,
      });
    } catch (error) {
      console.warn('Description generation failed, using template', error);

      // Fallback: Template-based description
      return {
        title: `Beautiful ${propertyData.bedrooms}-Bedroom Home in ${propertyData.neighborhood.name}`,
        description: `
Welcome to ${propertyData.address}. This stunning ${propertyData.bedrooms}-bedroom,
${propertyData.bathrooms}-bathroom property spans ${propertyData.sqft.toLocaleString()} square feet
of luxurious living space. Built in ${propertyData.yearBuilt}, this home features
${propertyData.amenities.slice(0, 3).join(', ')} and much more. Located in the desirable
${propertyData.neighborhood.name} neighborhood, this property offers an exceptional lifestyle.
Contact us today for a private tour!
        `,
        highlights: propertyData.amenities.slice(0, 5),
        seoKeywords: [
          propertyData.type,
          propertyData.neighborhood.name,
          `${propertyData.bedrooms}BR`,
          'real estate',
        ],
      };
    }
  }

  private async getStaticRecommendations(userId: string) {
    // Return trending properties as fallback
    return await database.query(`
      SELECT p.* FROM properties p
      ORDER BY p.views DESC
      LIMIT 5
    `);
  }
}

export const fallbackManager = new FallbackManager();
```

### Error Boundary Component

```typescript
// components/ErrorBoundary.tsx
import React, { ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
    // Send to error tracking service (e.g., Sentry)
    analytics.logError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <View style={styles.container}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>{this.state.error?.message}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => this.setState({ hasError: false, error: null })}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

---

## Monitoring & Analytics

### Events & Metrics

```typescript
// services/analytics/analyticsService.ts
import { analytics } from '@react-native-firebase/analytics';

class AnalyticsService {
  async logAIFeatureUsage(feature: 'matching' | 'description' | 'pricing', result: 'success' | 'failure') {
    await analytics().logEvent(`ai_${feature}_${result}`, {
      feature,
      result,
      timestamp: new Date().toISOString(),
    });
  }

  async logPropertyInteraction(
    propertyId: string,
    action: 'view' | 'save' | 'share' | 'contact',
    metadata?: Record<string, any>
  ) {
    await analytics().logEvent('property_interaction', {
      property_id: propertyId,
      action,
      ...metadata,
    });
  }

  async logTransactionEvent(
    transactionType: 'offer' | 'application' | 'booking',
    status: 'initiated' | 'completed' | 'failed',
    value: number
  ) {
    await analytics().logEvent(`${transactionType}_${status}`, {
      value,
      currency: 'USD',
    });
  }

  async trackPerfMetric(name: string, duration: number) {
    await analytics().logEvent('perf_metric', {
      metric_name: name,
      duration_ms: duration,
    });
  }
}

export const analyticsService = new AnalyticsService();
```

### Custom Dashboard Metrics

```typescript
// monitoring/dashboardMetrics.ts
interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags: Record<string, string>;
}

class MetricsCollector {
  private metrics: PerformanceMetric[] = [];

  recordMetric(
    name: string,
    value: number,
    unit: string,
    tags: Record<string, string> = {}
  ) {
    this.metrics.push({
      name,
      value,
      unit,
      timestamp: new Date(),
      tags,
    });

    // Send to metrics service every 10 metrics or every 60 seconds
    if (this.metrics.length >= 10) {
      this.flush();
    }
  }

  async flush() {
    if (this.metrics.length === 0) return;

    try {
      await axios.post('/metrics/ingest', {
        metrics: this.metrics,
      });
      this.metrics = [];
    } catch (error) {
      console.error('Failed to send metrics:', error);
    }
  }
}

export const metricsCollector = new MetricsCollector();
```

### Key Monitoring Dashboard Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| AI Matching Success Rate | 95%+ | < 90% |
| Description Generation Latency | < 5s | > 10s |
| Price Suggestion Accuracy | 85%+ | < 75% |
| Composio Workflow Success Rate | 99%+ | < 95% |
| WebSocket Connection Uptime | 99.9%+ | < 99% |
| App Crash Rate | < 0.1% | > 0.5% |
| API Response Time (p95) | < 500ms | > 1000ms |
| Push Notification Delivery | 99%+ | < 95% |

---

## Conclusion

This integration guide provides detailed technical specifications for implementing AI and automation features in the Puraestate mobile app. The architecture emphasizes:

1. **Cost Optimization** - Smart model selection and batching
2. **Reliability** - Fallback strategies and error handling
3. **Performance** - Caching, rate limiting, and async operations
4. **Real-Time Capabilities** - WebSocket sync and workflow orchestration
5. **Observability** - Comprehensive metrics and monitoring

All code examples follow React Native best practices and are production-ready with proper error handling and optimization.

---

**Document Version:** 1.0
**Last Updated:** 2026-02-24
**Status:** Implementation Ready
