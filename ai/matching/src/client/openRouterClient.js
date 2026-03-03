/**
 * OpenRouter AI Client Setup
 * Manages API interactions with OpenRouter for Groq and Claude models
 */

const axios = require('axios');
const Logger = require('../utils/logger');

const logger = new Logger('OpenRouterClient');

class OpenRouterClient {
  constructor(apiKey, options = {}) {
    if (!apiKey) {
      throw new Error('OpenRouter API key is required');
    }

    this.apiKey = apiKey;
    this.baseURL = 'https://openrouter.io/api/v1';
    this.defaultHeaders = {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': options.referer || 'https://property-matcher.local',
      'X-Title': options.title || 'Property Matching Algorithm',
      'Content-Type': 'application/json'
    };

    // Model configuration with pricing
    this.models = {
      groq_ranking: {
        id: 'groq/mixtral-8x7b-32768',
        name: 'Groq Mixtral 8x7B (Fast Ranking)',
        pricing: {
          input: 0.27 / 1000000,    // $0.27 per 1M tokens
          output: 0.27 / 1000000
        },
        maxTokens: 32768,
        speed: 'fast'
      },
      claude_scoring: {
        id: 'anthropic/claude-3-haiku-20240307',
        name: 'Claude 3 Haiku (Final Scoring)',
        pricing: {
          input: 0.80 / 1000000,    // $0.80 per 1M tokens
          output: 4 / 1000000
        },
        maxTokens: 8000,
        speed: 'medium'
      },
      claude_reasoning: {
        id: 'anthropic/claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet (Reasoning)',
        pricing: {
          input: 3 / 1000000,       // $3 per 1M tokens
          output: 15 / 1000000
        },
        maxTokens: 8000,
        speed: 'medium'
      }
    };

    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.timeout = options.timeout || 30000;
    this.costTracking = { total: 0, byModel: {}, history: [] };
  }

  /**
   * Make a request to OpenRouter API with retry logic
   */
  async makeRequest(model, messages, options = {}) {
    const modelConfig = this.models[model];
    if (!modelConfig) {
      throw new Error(`Unknown model: ${model}`);
    }

    const payload = {
      model: modelConfig.id,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? modelConfig.maxTokens,
      top_p: options.topP ?? 0.95,
      ...options.additional
    };

    let lastError;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.info(`Making request to ${modelConfig.name} (attempt ${attempt}/${this.maxRetries})`);

        const response = await axios.post(
          `${this.baseURL}/chat/completions`,
          payload,
          {
            headers: this.defaultHeaders,
            timeout: this.timeout
          }
        );

        // Track costs
        this._trackCosts(modelConfig, response.data.usage);

        logger.info(`Request successful for ${modelConfig.name}`, {
          tokens: response.data.usage,
          cost: this._calculateCost(modelConfig, response.data.usage)
        });

        return {
          content: response.data.choices[0].message.content,
          usage: response.data.usage,
          model: modelConfig.name,
          cost: this._calculateCost(modelConfig, response.data.usage),
          timestamp: new Date()
        };

      } catch (error) {
        lastError = error;
        const statusCode = error.response?.status;
        const errorMessage = error.response?.data?.error?.message || error.message;

        logger.warn(`Request failed for ${modelConfig.name}`, {
          attempt,
          status: statusCode,
          error: errorMessage
        });

        // Don't retry on client errors (400, 401, 403)
        if (statusCode && statusCode < 500 && statusCode !== 429) {
          throw error;
        }

        // Wait before retrying
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          logger.info(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error(`Failed to complete request after ${this.maxRetries} attempts`);
  }

  /**
   * Batch process multiple requests with rate limiting
   */
  async batchRequests(requests, options = {}) {
    const concurrency = options.concurrency || 5;
    const results = [];
    const errors = [];

    logger.info(`Processing ${requests.length} batch requests with concurrency ${concurrency}`);

    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchPromises = batch.map(req =>
        this.makeRequest(req.model, req.messages, req.options)
          .catch(error => {
            errors.push({ request: req, error });
            return null;
          })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(r => r !== null));

      // Rate limiting delay between batches
      if (i + concurrency < requests.length) {
        await new Promise(resolve => setTimeout(resolve, options.delayBetweenBatches || 500));
      }
    }

    logger.info(`Batch processing complete: ${results.length} successful, ${errors.length} failed`);

    return { results, errors };
  }

  /**
   * Calculate cost for a single request
   */
  _calculateCost(modelConfig, usage) {
    const inputCost = (usage.prompt_tokens || 0) * modelConfig.pricing.input;
    const outputCost = (usage.completion_tokens || 0) * modelConfig.pricing.output;
    return {
      input: inputCost,
      output: outputCost,
      total: inputCost + outputCost,
      tokens: usage
    };
  }

  /**
   * Track API costs for analytics
   */
  _trackCosts(modelConfig, usage) {
    const cost = this._calculateCost(modelConfig, usage);
    const modelKey = modelConfig.id;

    this.costTracking.total += cost.total;

    if (!this.costTracking.byModel[modelKey]) {
      this.costTracking.byModel[modelKey] = { count: 0, total: 0, tokens: 0 };
    }

    this.costTracking.byModel[modelKey].count += 1;
    this.costTracking.byModel[modelKey].total += cost.total;
    this.costTracking.byModel[modelKey].tokens += (usage.prompt_tokens || 0) + (usage.completion_tokens || 0);

    this.costTracking.history.push({
      model: modelConfig.id,
      cost: cost.total,
      timestamp: new Date(),
      tokens: usage
    });

    logger.debug(`Cost tracked: $${cost.total.toFixed(6)} (Total: $${this.costTracking.total.toFixed(4)})`);
  }

  /**
   * Get cost tracking summary
   */
  getCostSummary() {
    return {
      total: parseFloat(this.costTracking.total.toFixed(4)),
      byModel: Object.entries(this.costTracking.byModel).reduce((acc, [model, data]) => {
        acc[model] = {
          requests: data.count,
          totalCost: parseFloat(data.total.toFixed(4)),
          avgTokens: Math.round(data.tokens / data.count)
        };
        return acc;
      }, {}),
      requestCount: this.costTracking.history.length,
      history: this.costTracking.history.slice(-10) // Last 10 requests
    };
  }

  /**
   * Reset cost tracking
   */
  resetCostTracking() {
    this.costTracking = { total: 0, byModel: {}, history: [] };
    logger.info('Cost tracking reset');
  }

  /**
   * Get available models configuration
   */
  getModels() {
    return this.models;
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      logger.info('Testing OpenRouter API connection...');

      const response = await this.makeRequest(
        'groq_ranking',
        [{ role: 'user', content: 'Say "Connection successful" and nothing else.' }],
        { maxTokens: 10 }
      );

      logger.info('API connection test successful', {
        response: response.content,
        cost: response.cost
      });

      return { success: true, response: response.content, cost: response.cost };
    } catch (error) {
      logger.error('API connection test failed', { error: error.message });
      throw error;
    }
  }
}

module.exports = OpenRouterClient;
