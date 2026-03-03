import { Router, Request, Response } from 'express';
import messageService from '../services/message.service';
import automationService from '../services/automation.service';
import queueManager from '../queue/manager';
import { SendMessageRequest, PropertyMatchRequest, BookingRequest } from '../types';
import logger from '../logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Send message endpoint
router.post('/messages/send', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, message, mediaUrl, mediaType } = req.body as SendMessageRequest;

    if (!phoneNumber || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const msg = await messageService.sendMessage({
      phoneNumber,
      message,
      mediaUrl,
      mediaType,
    });

    res.json({
      success: true,
      data: msg,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to send message', { error });
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Send bulk messages endpoint
router.post('/messages/bulk', async (req: Request, res: Response) => {
  try {
    const { phoneNumbers, message, delayBetweenMs } = req.body;

    if (!phoneNumbers || !Array.isArray(phoneNumbers) || !message) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const messages = await messageService.sendBulkMessages(
      phoneNumbers,
      message,
      delayBetweenMs
    );

    res.json({
      success: true,
      data: {
        totalSent: messages.length,
        messages,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to send bulk messages', { error });
    res.status(500).json({ error: 'Failed to send bulk messages' });
  }
});

// Get message status endpoint
router.get('/messages/:messageId/status', async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;

    const message = await messageService.getMessageStatus(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({
      success: true,
      data: message,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get message status', { error });
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Get message history endpoint
router.get('/messages/:recipientId', async (req: Request, res: Response) => {
  try {
    const { recipientId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await messageService.getMessageHistory(
      recipientId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      success: true,
      data: messages,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get message history', { error });
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// Property match notification endpoint
router.post('/automations/property-match', async (req: Request, res: Response) => {
  try {
    const request = req.body as PropertyMatchRequest;

    if (!request.investorId || !request.propertyIds || request.propertyIds.length === 0) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Queue the property match job
    await queueManager.addPropertyMatchJob({
      type: 'property_match',
      investorId: request.investorId,
      propertyIds: request.propertyIds,
      topAgentsCount: request.topAgentsCount || 3,
      retryCount: 0,
    });

    res.json({
      success: true,
      message: 'Property match notification queued',
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to queue property match', { error });
    res.status(500).json({ error: 'Failed to queue property match' });
  }
});

// Booking confirmation endpoint
router.post('/automations/booking', async (req: Request, res: Response) => {
  try {
    const request = req.body as BookingRequest;

    if (!request.investorId || !request.propertyId || !request.agentId || !request.preferredDate) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Queue the booking job
    await queueManager.addBookingConfirmationJob({
      type: 'booking_confirmation',
      investorId: request.investorId,
      propertyId: request.propertyId,
      agentId: request.agentId,
      preferredDate: request.preferredDate,
      notes: request.notes,
      retryCount: 0,
    });

    res.json({
      success: true,
      message: 'Booking confirmation queued',
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to queue booking confirmation', { error });
    res.status(500).json({ error: 'Failed to queue booking' });
  }
});

// Payment notification endpoint
router.post('/automations/payment', async (req: Request, res: Response) => {
  try {
    const { investorId, type, paymentData } = req.body;

    if (!investorId || !type || !['confirmation', 'failed'].includes(type)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Queue payment job
    await queueManager.addPaymentJob({
      type: 'payment_notification',
      investorId,
      paymentType: type,
      paymentData,
      retryCount: 0,
    });

    res.json({
      success: true,
      message: 'Payment notification queued',
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to queue payment notification', { error });
    res.status(500).json({ error: 'Failed to queue payment notification' });
  }
});

// Portfolio update endpoint
router.post('/automations/portfolio-update', async (req: Request, res: Response) => {
  try {
    const { investorId, updateType, data } = req.body;

    if (!investorId || !updateType || !['price_alert', 'new_property', 'market_news'].includes(updateType)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Queue portfolio update job
    await queueManager.addPortfolioUpdateJob({
      type: 'portfolio_update',
      investorId,
      updateType,
      data,
      retryCount: 0,
    });

    res.json({
      success: true,
      message: 'Portfolio update queued',
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to queue portfolio update', { error });
    res.status(500).json({ error: 'Failed to queue portfolio update' });
  }
});

// Get queue statistics
router.get('/queue/stats', async (req: Request, res: Response) => {
  try {
    const stats = await queueManager.getAllQueuesStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get queue stats', { error });
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get failed messages
router.get('/messages/failed', async (req: Request, res: Response) => {
  try {
    const { limit = 100 } = req.query;

    const messages = await messageService.getFailedMessages(parseInt(limit as string));

    res.json({
      success: true,
      data: messages,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get failed messages', { error });
    res.status(500).json({ error: 'Failed to get failed messages' });
  }
});

// Retry failed message
router.post('/messages/:messageId/retry', async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;

    await messageService.retryFailedMessage(messageId);

    res.json({
      success: true,
      message: 'Message queued for retry',
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to retry message', { error });
    res.status(500).json({ error: 'Failed to retry message' });
  }
});

export default router;
