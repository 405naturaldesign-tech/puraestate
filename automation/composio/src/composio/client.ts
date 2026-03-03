import axios, { AxiosInstance } from 'axios';
import config from '../config';
import logger from '../logger';

export class ComposioClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = config.composio.apiKey;
    this.baseUrl = config.composio.baseUrl;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Composio API error', {
          status: error.response?.status,
          message: error.response?.data?.message,
          url: error.config?.url,
        });
        throw error;
      }
    );
  }

  async sendWhatsAppMessage(params: {
    phoneNumber: string;
    message: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'document' | 'video';
  }): Promise<{ messageId: string; status: string }> {
    try {
      logger.info('Sending WhatsApp message via Composio', {
        phoneNumber: params.phoneNumber,
        hasMedia: !!params.mediaUrl,
      });

      const payload = {
        recipient_number: params.phoneNumber,
        message_text: params.message,
        ...(params.mediaUrl && {
          media_url: params.mediaUrl,
          media_type: params.mediaType,
        }),
      };

      const response = await this.executeAction('send_whatsapp_message', payload);

      return {
        messageId: response.data.message_id,
        status: response.data.status,
      };
    } catch (error) {
      logger.error('Failed to send WhatsApp message', { error, params });
      throw error;
    }
  }

  async getMessageStatus(messageId: string): Promise<{
    status: string;
    deliveredAt?: string;
    readAt?: string;
  }> {
    try {
      const response = await this.executeAction('get_message_status', {
        message_id: messageId,
      });

      return {
        status: response.data.status,
        deliveredAt: response.data.delivered_at,
        readAt: response.data.read_at,
      };
    } catch (error) {
      logger.error('Failed to get message status', { error, messageId });
      throw error;
    }
  }

  async createTemplate(params: {
    name: string;
    language: string;
    category: string;
    content: string;
  }): Promise<{ templateId: string }> {
    try {
      const response = await this.executeAction('create_whatsapp_template', {
        name: params.name,
        language: params.language,
        category: params.category,
        content: params.content,
      });

      return {
        templateId: response.data.template_id,
      };
    } catch (error) {
      logger.error('Failed to create template', { error, params });
      throw error;
    }
  }

  async sendTemplateMessage(params: {
    phoneNumber: string;
    templateId: string;
    variables?: Record<string, string>;
  }): Promise<{ messageId: string; status: string }> {
    try {
      logger.info('Sending WhatsApp template message', {
        phoneNumber: params.phoneNumber,
        templateId: params.templateId,
      });

      const response = await this.executeAction('send_whatsapp_template_message', {
        recipient_number: params.phoneNumber,
        template_id: params.templateId,
        parameters: params.variables || {},
      });

      return {
        messageId: response.data.message_id,
        status: response.data.status,
      };
    } catch (error) {
      logger.error('Failed to send template message', { error, params });
      throw error;
    }
  }

  async executeAction(
    action: string,
    params: Record<string, any>
  ): Promise<any> {
    const maxAttempts = config.composio.retryAttempts;
    let lastError: any;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this.client.post('/v1/actions/execute', {
          action,
          input: params,
        });

        return response.data;
      } catch (error) {
        lastError = error;

        if (attempt < maxAttempts - 1) {
          const delay = config.composio.retryDelayMs * Math.pow(2, attempt);
          logger.warn('Composio action failed, retrying', {
            action,
            attempt: attempt + 1,
            maxAttempts,
            delayMs: delay,
          });
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  async getWebhooks(): Promise<any[]> {
    try {
      const response = await this.client.get('/v1/webhooks');
      return response.data.data || [];
    } catch (error) {
      logger.error('Failed to get webhooks', { error });
      throw error;
    }
  }

  async createWebhook(url: string, events: string[]): Promise<{ webhookId: string }> {
    try {
      const response = await this.client.post('/v1/webhooks', {
        url,
        events,
      });

      return {
        webhookId: response.data.data.id,
      };
    } catch (error) {
      logger.error('Failed to create webhook', { error, url });
      throw error;
    }
  }

  async verifyWebhookSignature(
    payload: string,
    signature: string,
    timestamp: string
  ): Promise<boolean> {
    // Verify using Composio's signature verification
    // This is a placeholder - implement according to Composio's spec
    try {
      const crypto = require('crypto');
      const secret = config.security.webhookSecret;
      const message = `${timestamp}.${payload}`;
      const hash = crypto.createHmac('sha256', secret).update(message).digest('hex');
      return hash === signature;
    } catch (error) {
      logger.error('Webhook signature verification failed', { error });
      return false;
    }
  }
}

export default new ComposioClient();
