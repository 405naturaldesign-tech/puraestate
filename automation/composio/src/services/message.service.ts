import composioClient from '../composio/client';
import queueManager from '../queue/manager';
import { WhatsAppMessageModel, InvestorModel, AgentModel } from '../db/schemas';
import { WhatsAppMessage, SendMessageRequest } from '../types';
import logger from '../logger';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from '../utils/rateLimit';

export class MessageService {
  async sendMessage(request: SendMessageRequest): Promise<WhatsAppMessage> {
    const messageId = uuidv4();

    // Check rate limit
    const canProceed = await rateLimit.checkLimit(request.phoneNumber);
    if (!canProceed) {
      logger.warn('Rate limit exceeded', { phoneNumber: request.phoneNumber });
      throw new Error('Rate limit exceeded');
    }

    // Create message record
    const message = new WhatsAppMessageModel({
      id: messageId,
      recipientPhoneNumber: request.phoneNumber,
      recipientType: 'investor',
      recipientId: request.phoneNumber, // Will be populated from request
      messageType: 'text',
      content: {
        text: request.message,
        mediaUrl: request.mediaUrl,
        mediaType: request.mediaType,
      },
      status: 'queued',
      retries: 0,
      maxRetries: 3,
    });

    await message.save();

    // Add to queue
    await queueManager.addWhatsAppMessageJob({
      type: 'send_message',
      messageId,
      phoneNumber: request.phoneNumber,
      message: request.message,
      mediaUrl: request.mediaUrl,
      mediaType: request.mediaType,
      retryCount: 0,
    });

    logger.info('Message queued for sending', { messageId, phoneNumber: request.phoneNumber });

    return message as any;
  }

  async sendTemplateMessage(
    phoneNumber: string,
    templateKey: string,
    variables: Record<string, string>,
    language: 'es' | 'en' = 'en'
  ): Promise<WhatsAppMessage> {
    const messageId = uuidv4();

    // Check rate limit
    const canProceed = await rateLimit.checkLimit(phoneNumber);
    if (!canProceed) {
      logger.warn('Rate limit exceeded', { phoneNumber });
      throw new Error('Rate limit exceeded');
    }

    // Create message record
    const message = new WhatsAppMessageModel({
      id: messageId,
      recipientPhoneNumber: phoneNumber,
      recipientType: 'investor',
      recipientId: '',
      messageType: templateKey,
      content: {
        text: `Template: ${templateKey}`, // Will be replaced
      },
      status: 'queued',
      retries: 0,
      maxRetries: 3,
    });

    await message.save();

    // Add to queue
    await queueManager.addWhatsAppMessageJob({
      type: 'send_template_message',
      messageId,
      phoneNumber,
      templateKey,
      variables,
      language,
      retryCount: 0,
    });

    logger.info('Template message queued', { messageId, phoneNumber, templateKey });

    return message as any;
  }

  async sendBulkMessages(
    phoneNumbers: string[],
    message: string,
    delayBetweenMs: number = 100
  ): Promise<WhatsAppMessage[]> {
    const messages: WhatsAppMessage[] = [];

    for (let i = 0; i < phoneNumbers.length; i++) {
      const phoneNumber = phoneNumbers[i];

      try {
        const msg = await this.sendMessage({
          phoneNumber,
          message,
        });
        messages.push(msg);

        // Respect rate limiting
        if (i < phoneNumbers.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayBetweenMs));
        }
      } catch (error) {
        logger.error('Failed to send bulk message', { phoneNumber, error });
      }
    }

    logger.info('Bulk messages sent', {
      total: phoneNumbers.length,
      sent: messages.length,
    });

    return messages;
  }

  async getMessageStatus(messageId: string): Promise<WhatsAppMessage | null> {
    const message = await WhatsAppMessageModel.findOne({ id: messageId });

    if (!message) {
      return null;
    }

    // If not yet sent, check Composio for status
    if (message.status === 'sent' && message.composioMessageId) {
      try {
        const composioStatus = await composioClient.getMessageStatus(
          message.composioMessageId
        );

        // Update message status
        if (composioStatus.status === 'delivered' && !message.deliveredAt) {
          message.status = 'delivered';
          message.deliveredAt = new Date();
          await message.save();
        }

        if (composioStatus.status === 'read' && !message.readAt) {
          message.status = 'read';
          message.readAt = new Date();
          await message.save();
        }
      } catch (error) {
        logger.error('Failed to check message status with Composio', { error, messageId });
      }
    }

    return message as any;
  }

  async getMessageHistory(
    recipientId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<WhatsAppMessage[]> {
    const messages = await WhatsAppMessageModel.find({ recipientId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    return messages as any;
  }

  async retryFailedMessage(messageId: string): Promise<void> {
    const message = await WhatsAppMessageModel.findOne({ id: messageId });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.status !== 'failed') {
      throw new Error('Message is not in failed status');
    }

    if (message.retries >= message.maxRetries) {
      throw new Error('Max retries exceeded');
    }

    message.retries += 1;
    message.status = 'queued';
    await message.save();

    // Re-queue the message
    await queueManager.addWhatsAppMessageJob({
      type: 'send_message',
      messageId,
      phoneNumber: message.recipientPhoneNumber,
      message: message.content.text,
      mediaUrl: message.content.mediaUrl,
      mediaType: message.content.mediaType,
      retryCount: message.retries,
    });

    logger.info('Failed message re-queued', { messageId });
  }

  async updateMessageStatus(
    messageId: string,
    status: WhatsAppMessage['status'],
    composioMessageId?: string
  ): Promise<void> {
    const message = await WhatsAppMessageModel.findOne({ id: messageId });

    if (!message) {
      throw new Error('Message not found');
    }

    message.status = status;
    if (composioMessageId) {
      message.composioMessageId = composioMessageId;
    }

    if (status === 'sent') {
      message.sentAt = new Date();
    } else if (status === 'delivered') {
      message.deliveredAt = new Date();
    } else if (status === 'read') {
      message.readAt = new Date();
    }

    await message.save();

    logger.info('Message status updated', { messageId, status });
  }

  async getFailedMessages(limit: number = 100): Promise<WhatsAppMessage[]> {
    return WhatsAppMessageModel.find({
      status: 'failed',
      retries: { $lt: 3 },
    })
      .limit(limit)
      .sort({ createdAt: 1 }) as any;
  }

  async getQueuedMessages(limit: number = 100): Promise<WhatsAppMessage[]> {
    return WhatsAppMessageModel.find({
      status: 'queued',
    })
      .limit(limit)
      .sort({ createdAt: 1 }) as any;
  }
}

export default new MessageService();
