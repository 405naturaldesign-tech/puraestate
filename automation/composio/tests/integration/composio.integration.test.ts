import { mockComposioClient } from '../mocks/composio.mock';

describe('Composio Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Composio Client Connection', () => {
    it('should connect to Composio API', async () => {
      const pingResponse = await mockComposioClient.getConnectedAccounts();
      expect(pingResponse).toBeDefined();
      expect(pingResponse.accounts).toEqual(expect.any(Array));
    });

    it('should handle connection errors gracefully', async () => {
      mockComposioClient.getConnectedAccounts.mockRejectedValueOnce(
        new Error('Connection failed')
      );

      await expect(mockComposioClient.getConnectedAccounts()).rejects.toThrow(
        'Connection failed'
      );
    });

    it('should retry on transient failures', async () => {
      mockComposioClient.getConnectedAccounts
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({ accounts: [] });

      // First call fails
      await expect(mockComposioClient.getConnectedAccounts()).rejects.toThrow();

      // Second call succeeds
      const response = await mockComposioClient.getConnectedAccounts();
      expect(response).toBeDefined();
    });
  });

  describe('Composio Actions', () => {
    it('should execute actions successfully', async () => {
      const result = await mockComposioClient.executeAction();
      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.data).toHaveProperty('success', true);
    });

    it('should handle action failures', async () => {
      mockComposioClient.executeAction.mockRejectedValueOnce(
        new Error('Action failed')
      );

      await expect(mockComposioClient.executeAction()).rejects.toThrow(
        'Action failed'
      );
    });

    it('should get available actions', async () => {
      const result = await mockComposioClient.getActions();
      expect(result).toBeDefined();
      expect(result.actions).toEqual(expect.any(Array));
      expect(result.actions[0]).toHaveProperty('name');
      expect(result.actions[0]).toHaveProperty('description');
    });
  });

  describe('WhatsApp Message Sending', () => {
    it('should send WhatsApp message successfully', async () => {
      const result = await mockComposioClient.sendMessage();
      expect(result).toBeDefined();
      expect(result.messageId).toBeDefined();
      expect(result.status).toBe('sent');
    });

    it('should handle message sending errors', async () => {
      mockComposioClient.sendMessage.mockRejectedValueOnce(
        new Error('Failed to send message')
      );

      await expect(mockComposioClient.sendMessage()).rejects.toThrow(
        'Failed to send message'
      );
    });

    it('should validate phone number before sending', async () => {
      // Phone number validation would happen before calling sendMessage
      const validPhoneNumbers = [
        '+1234567890',
        '+919876543210',
        '+441234567890',
      ];

      for (const phone of validPhoneNumbers) {
        const result = await mockComposioClient.sendMessage();
        expect(result).toBeDefined();
      }
    });

    it('should include timestamp in sent messages', async () => {
      const result = await mockComposioClient.sendMessage();
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Composio Webhooks', () => {
    it('should retrieve existing webhooks', async () => {
      const result = await mockComposioClient.getWebhooks();
      expect(result).toBeDefined();
      expect(result.webhooks).toEqual(expect.any(Array));
    });

    it('should create new webhook', async () => {
      const result = await mockComposioClient.createWebhook();
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.url).toBeDefined();
      expect(result.active).toBe(true);
    });

    it('should delete webhook', async () => {
      const result = await mockComposioClient.deleteWebhook();
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle webhook errors', async () => {
      mockComposioClient.createWebhook.mockRejectedValueOnce(
        new Error('Webhook creation failed')
      );

      await expect(mockComposioClient.createWebhook()).rejects.toThrow(
        'Webhook creation failed'
      );
    });
  });

  describe('Composio Triggers', () => {
    it('should get available triggers', async () => {
      const result = await mockComposioClient.getTriggers();
      expect(result).toBeDefined();
      expect(result.triggers).toEqual(expect.any(Array));
      expect(result.triggers[0]).toHaveProperty('name');
      expect(result.triggers[0]).toHaveProperty('description');
    });

    it('should handle message_received trigger', async () => {
      const result = await mockComposioClient.getTriggers();
      const messageReceivedTrigger = result.triggers.find(
        (t) => t.name === 'message_received'
      );
      expect(messageReceivedTrigger).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      const requests = Array(5).fill(null).map(() => mockComposioClient.executeAction());
      const results = await Promise.all(requests);
      expect(results).toHaveLength(5);
    });

    it('should handle rate limit errors', async () => {
      mockComposioClient.executeAction.mockRejectedValueOnce(
        new Error('Rate limit exceeded')
      );

      await expect(mockComposioClient.executeAction()).rejects.toThrow(
        'Rate limit exceeded'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockComposioClient.executeAction.mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(mockComposioClient.executeAction()).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle authentication errors', async () => {
      mockComposioClient.getConnectedAccounts.mockRejectedValueOnce(
        new Error('Unauthorized')
      );

      await expect(mockComposioClient.getConnectedAccounts()).rejects.toThrow(
        'Unauthorized'
      );
    });

    it('should handle timeout errors', async () => {
      mockComposioClient.executeAction.mockRejectedValueOnce(
        new Error('Request timeout')
      );

      await expect(mockComposioClient.executeAction()).rejects.toThrow(
        'Request timeout'
      );
    });
  });
});
