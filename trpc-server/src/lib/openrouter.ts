/**
 * OpenRouter AI Integration
 * Handles smart matching, auto-descriptions, price suggestions, and dispute mediation
 * Uses multi-model approach: Groq (fast/cheap) → Claude (smart)
 */

export interface AIResponse {
  success: boolean;
  data?: string;
  error?: string;
}

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

    if (!this.apiKey) {
      console.warn('[OpenRouter] API key not configured');
    }
  }

  /**
   * Call OpenRouter API
   */
  private async callAPI(
    model: string,
    messages: Array<{ role: string; content: string }>,
    temperature: number = 0.7
  ): Promise<AIResponse> {
    if (!this.apiKey) {
      return { success: false, error: 'OpenRouter not configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://puraestate.com',
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: temperature,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`[OpenRouter] Error ${response.status}: ${error}`);
        return { success: false, error: `API error: ${response.status}` };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      console.log(`[OpenRouter] ${model} success (${data.usage?.total_tokens} tokens)`);
      return { success: true, data: content };
    } catch (error) {
      console.error('[OpenRouter] Exception:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Smart Property Matching (30 seconds)
   * Rankings buyers with properties using Groq (fast, cheap)
   */
  async rankBuyersForProperty(
    propertyDescription: string,
    buyerProfiles: Array<{
      id: string;
      preferences: string;
      budget: number;
      location: string;
    }>
  ): Promise<AIResponse> {
    const prompt = `
Given this property:
${propertyDescription}

Rank these buyers by match score (0-100):
${buyerProfiles.map((b) => `- ${b.id}: Budget $${b.budget}, Preferences: ${b.preferences}`).join('\n')}

Format: JSON array with {id, score, reason}
    `;

    return this.callAPI('groq/mixtral-8x7b-32768', [
      { role: 'system', content: 'You are a real estate matching expert.' },
      { role: 'user', content: prompt },
    ]);
  }

  /**
   * Auto-Generate Property Descriptions
   * Three styles: professional, casual, poetic
   */
  async generateDescription(
    propertyData: {
      title: string;
      bedrooms: number;
      bathrooms: number;
      squareMeters: number;
      amenities: string[];
      location: string;
      highlights: string[];
    },
    style: 'professional' | 'casual' | 'poetic' = 'professional'
  ): Promise<AIResponse> {
    const styleGuides = {
      professional: 'Write a detailed, formal property description suitable for luxury real estate.',
      casual: 'Write a friendly, conversational description that feels warm and inviting.',
      poetic: 'Write a lyrical, evocative description that captures the essence and lifestyle.',
    };

    const prompt = `
${styleGuides[style]}

Property Details:
- Title: ${propertyData.title}
- Bedrooms: ${propertyData.bedrooms}, Bathrooms: ${propertyData.bathrooms}
- Size: ${propertyData.squareMeters} m²
- Location: ${propertyData.location}
- Amenities: ${propertyData.amenities.join(', ')}
- Highlights: ${propertyData.highlights.join(', ')}

Write a 150-200 word description.
    `;

    return this.callAPI('claude-3-5-haiku', [
      { role: 'system', content: 'You are an expert real estate copywriter.' },
      { role: 'user', content: prompt },
    ]);
  }

  /**
   * Price Suggestions Based on Market Data
   */
  async suggestPrice(
    propertyData: {
      location: string;
      propertyType: string;
      bedrooms: number;
      bathrooms: number;
      squareMeters: number;
      condition: string;
      recentSales: Array<{ price: number; date: string }>;
    }
  ): Promise<AIResponse> {
    const recentAvg =
      propertyData.recentSales.length > 0
        ? (
            propertyData.recentSales.reduce((sum, s) => sum + s.price, 0) /
            propertyData.recentSales.length
          ).toFixed(0)
        : 'N/A';

    const prompt = `
Suggest a fair market price for this property in Costa Rica:
- Type: ${propertyData.propertyType}
- Location: ${propertyData.location}
- Bedrooms: ${propertyData.bedrooms}, Bathrooms: ${propertyData.bathrooms}
- Size: ${propertyData.squareMeters} m²
- Condition: ${propertyData.condition}
- Recent similar sales avg: $${recentAvg}

Provide:
1. Suggested price range
2. Market trend analysis
3. Justification
    `;

    return this.callAPI('claude-3-5-haiku', [
      { role: 'system', content: 'You are a Costa Rican real estate appraiser.' },
      { role: 'user', content: prompt },
    ]);
  }

  /**
   * Dispute Mediation (Claude Opus for complex reasoning)
   */
  async mediateDispute(
    dispute: {
      type: 'payment' | 'condition' | 'timeline' | 'misrepresentation';
      buyerClaim: string;
      sellerResponse: string;
      evidence: string[];
      contractTerms: string;
    }
  ): Promise<AIResponse> {
    const prompt = `
Mediate this real estate dispute fairly:

Type: ${dispute.type}
Buyer Claim: ${dispute.buyerClaim}
Seller Response: ${dispute.sellerResponse}
Contract Terms: ${dispute.contractTerms}
Evidence: ${dispute.evidence.join('; ')}

Provide:
1. Fair assessment of each party's position
2. Recommended resolution
3. Justification based on Costa Rican real estate law
    `;

    return this.callAPI('claude-3-opus', [
      { role: 'system', content: 'You are an expert in Costa Rican real estate law and mediation.' },
      { role: 'user', content: prompt },
    ]);
  }

  /**
   * Translate property listings
   */
  async translateListing(text: string, targetLanguage: string): Promise<AIResponse> {
    return this.callAPI('groq/mixtral-8x7b-32768', [
      { role: 'system', content: `You are a translator. Translate to ${targetLanguage}.` },
      { role: 'user', content: text },
    ]);
  }

  /**
   * Generate keyword tags for SEO
   */
  async generateKeywords(
    propertyDescription: string,
    location: string
  ): Promise<AIResponse> {
    const prompt = `
Generate 10-15 SEO keywords for this property in ${location}:

${propertyDescription}

Format: comma-separated list
    `;

    return this.callAPI('groq/mixtral-8x7b-32768', [
      { role: 'system', content: 'You are an SEO expert for real estate.' },
      { role: 'user', content: prompt },
    ]);
  }
}

// Export singleton instance
export const openrouter = new OpenRouterClient();
