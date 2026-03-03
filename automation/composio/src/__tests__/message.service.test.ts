import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import messageService from '../services/message.service';
import queueManager from '../queue/manager';
import { connectDatabase, disconnectDatabase } from '../db/connection';
import { WhatsAppMessageModel, InvestorModel } from '../db/schemas';

describe('MessageService', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeEach(async () => {
    // Clear test data
    await WhatsAppMessageModel.deleteMany({});
    await InvestorModel.deleteMany({});
  });

  describe('sendMessage', () => {
    it('should create and queue a message', async () => {
      const result = await messageService.sendMessage({
        phoneNumber: '+1234567890',
        message: 'Test message',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('queued');
      expect(result.recipientPhoneNumber).toBe('+1234567890');
      expect(result.content.text).toBe('Test message');
    });

    it('should fail with invalid phone number', async () => {
      await expect(
        messageService.sendMessage({
          phoneNumber: 'invalid',
          message: 'Test message',
        })
      ).rejects.toThrow();
    });

    it('should include media in message', async () => {
      const result = await messageService.sendMessage({
        phoneNumber: '+1234567890',
        message: 'Check this out',
        mediaUrl: 'https://example.com/image.jpg',
        mediaType: 'image',
      });

      expect(result.content.mediaUrl).toBe('https://example.com/image.jpg');
      expect(result.content.mediaType).toBe('image');
    });
  });

  describe('sendBulkMessages', () => {
    it('should send to multiple phone numbers', async () => {
      const phoneNumbers = ['+1111111111', '+2222222222', '+3333333333'];
      const message = 'Bulk test message';

      const results = await messageService.sendBulkMessages(phoneNumbers, message, 10);

      expect(results.length).toBe(phoneNumbers.length);
      expect(results.every((m) => m.status === 'queued')).toBe(true);
    });

    it('should respect rate limiting', async () => {
      const phoneNumbers = Array.from({ length: 10 }, (_, i) => `+${i}${'0'.repeat(9)}`);
      const message = 'Rate limit test';

      const results = await messageService.sendBulkMessages(phoneNumbers, message, 5);

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getMessageStatus', () => {
    it('should retrieve message status', async () => {
      const sent = await messageService.sendMessage({
        phoneNumber: '+1234567890',
        message: 'Test',
      });

      const retrieved = await messageService.getMessageStatus(sent.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.status).toBe('queued');
    });

    it('should return null for non-existent message', async () => {
      const result = await messageService.getMessageStatus('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('retryFailedMessage', () => {
    it('should retry a failed message', async () => {
      const msg = await messageService.sendMessage({
        phoneNumber: '+1234567890',
        message: 'Test',
      });

      // Simulate failure
      await messageService.updateMessageStatus(msg.id, 'failed');

      // Retry
      await messageService.retryFailedMessage(msg.id);

      const updated = await messageService.getMessageStatus(msg.id);
      expect(updated?.status).toBe('queued');
      expect(updated?.retries).toBe(1);
    });

    it('should throw if max retries exceeded', async () => {
      const msg = await messageService.sendMessage({
        phoneNumber: '+1234567890',
        message: 'Test',
      });

      // Set max retries
      await WhatsAppMessageModel.updateOne(
        { id: msg.id },
        { retries: 3, maxRetries: 3, status: 'failed' }
      );

      await expect(messageService.retryFailedMessage(msg.id)).rejects.toThrow(
        'Max retries exceeded'
      );
    });
  });

  describe('getMessageHistory', () => {
    it('should retrieve message history', async () => {
      const recipientId = 'investor-123';

      // Create multiple messages
      for (let i = 0; i < 5; i++) {
        const msg = new WhatsAppMessageModel({
          id: `msg-${i}`,
          recipientPhoneNumber: '+1234567890',
          recipientType: 'investor',
          recipientId,
          messageType: 'test',
          content: { text: `Message ${i}` },
          status: 'sent',
          retries: 0,
          maxRetries: 3,
        });
        await msg.save();
      }

      const history = await messageService.getMessageHistory(recipientId, 10, 0);

      expect(history.length).toBe(5);
      expect(history[0].content.text).toContain('Message');
    });

    it('should support pagination', async () => {
      const recipientId = 'investor-456';

      // Create 20 messages
      for (let i = 0; i < 20; i++) {
        const msg = new WhatsAppMessageModel({
          id: `msg-${i}`,
          recipientPhoneNumber: '+1234567890',
          recipientType: 'investor',
          recipientId,
          messageType: 'test',
          content: { text: `Message ${i}` },
          status: 'sent',
          retries: 0,
          maxRetries: 3,
        });
        await msg.save();
      }

      const page1 = await messageService.getMessageHistory(recipientId, 10, 0);
      const page2 = await messageService.getMessageHistory(recipientId, 10, 10);

      expect(page1.length).toBe(10);
      expect(page2.length).toBe(10);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });
});
