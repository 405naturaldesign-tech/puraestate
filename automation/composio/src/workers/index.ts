import queueManager from '../queue/manager';
import composioClient from '../composio/client';
import messageService from '../services/message.service';
import automationService from '../services/automation.service';
import { WhatsAppMessageModel, ViewingModel } from '../db/schemas';
import { getTemplate, interpolateTemplate } from '../templates';
import logger from '../logger';

export function setupWorkers(): void {
  // WhatsApp Messages Worker
  queueManager.processQueue('whatsapp-messages', async (job) => {
    const { messageId, phoneNumber, message, mediaUrl, mediaType } = job.data;

    try {
      // Send via Composio
      const result = await composioClient.sendWhatsAppMessage({
        phoneNumber,
        message,
        mediaUrl,
        mediaType,
      });

      // Update message status
      await messageService.updateMessageStatus(
        messageId,
        'sent',
        result.messageId
      );

      logger.info('WhatsApp message sent successfully', {
        messageId,
        composioMessageId: result.messageId,
      });
    } catch (error) {
      logger.error('Failed to send WhatsApp message', { error, messageId });

      const message = await WhatsAppMessageModel.findOne({ id: messageId });
      if (message) {
        message.retries += 1;
        if (message.retries >= message.maxRetries) {
          message.status = 'failed';
          message.errorMessage = (error as Error).message;
        } else {
          message.status = 'queued';
        }
        await message.save();
      }

      throw error;
    }
  });

  // Property Matches Worker
  queueManager.processQueue('property-matches', async (job) => {
    const { investorId, propertyIds } = job.data;

    try {
      await automationService.notifyPropertyMatch({
        investorId,
        propertyIds,
        topAgentsCount: 3,
      });

      logger.info('Property match workflow completed', { investorId });
    } catch (error) {
      logger.error('Property match workflow failed', { error, investorId });
      throw error;
    }
  });

  // Booking Confirmations Worker
  queueManager.processQueue('booking-confirmations', async (job) => {
    const { investorId, propertyId, agentId, preferredDate, notes } = job.data;

    try {
      await automationService.sendBookingConfirmation({
        investorId,
        propertyId,
        agentId,
        preferredDate: new Date(preferredDate),
        notes,
      });

      logger.info('Booking confirmation workflow completed', { investorId });
    } catch (error) {
      logger.error('Booking confirmation workflow failed', { error, investorId });
      throw error;
    }
  });

  // Viewing Reminders Worker
  queueManager.processQueue('reminders', async (job) => {
    const {
      type,
      viewingId,
      phoneNumber,
      language,
      propertyTitle,
      propertyAddress,
      viewingTime,
      viewingDuration,
      agentPhone,
    } = job.data;

    try {
      let templateKey: string;
      let variables: Record<string, string>;

      if (type === 'viewing_reminder_24h') {
        templateKey = 'viewing_reminder_24h';
        variables = {
          investor_name: '', // Will be loaded
          property_title: propertyTitle,
          property_address: propertyAddress,
          viewing_time: viewingTime,
          viewing_duration: viewingDuration,
          agent_phone: agentPhone,
        };
      } else if (type === 'viewing_reminder_1h') {
        templateKey = 'viewing_reminder_24h'; // Can use same template
        variables = {
          investor_name: '',
          property_title: propertyTitle,
          property_address: propertyAddress,
          viewing_time: viewingTime,
          viewing_duration: viewingDuration,
          agent_phone: agentPhone,
        };
      } else {
        throw new Error(`Unknown reminder type: ${type}`);
      }

      const template = getTemplate(templateKey, language);
      if (!template) {
        throw new Error(`Template not found: ${templateKey}`);
      }

      const message = interpolateTemplate(template, variables);

      await messageService.sendMessage({
        phoneNumber,
        message,
      });

      logger.info('Viewing reminder sent', { viewingId, type });
    } catch (error) {
      logger.error('Failed to send viewing reminder', { error, viewingId });
      throw error;
    }
  });

  // Payment Notifications Worker
  queueManager.processQueue('payments', async (job) => {
    const { type, investorId, paymentData } = job.data;

    try {
      await automationService.sendPaymentNotification(
        investorId,
        type,
        paymentData
      );

      logger.info('Payment notification sent', { investorId, type });
    } catch (error) {
      logger.error('Failed to send payment notification', { error, investorId });
      throw error;
    }
  });

  // Portfolio Updates Worker
  queueManager.processQueue('portfolio-updates', async (job) => {
    const { investorId, updateType, data } = job.data;

    try {
      await automationService.sendPortfolioUpdate(
        investorId,
        updateType,
        data
      );

      logger.info('Portfolio update sent', { investorId, updateType });
    } catch (error) {
      logger.error('Failed to send portfolio update', { error, investorId });
      throw error;
    }
  });

  logger.info('All workers initialized');
}

export default setupWorkers;
