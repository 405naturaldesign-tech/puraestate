import { Router, Request, Response } from 'express';
import composioClient from '../composio/client';
import messageService from '../services/message.service';
import automationService from '../services/automation.service';
import { WhatsAppMessageModel, WebhookEventModel } from '../db/schemas';
import logger from '../logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Webhook signature verification middleware
async function verifyWebhookSignature(
  req: Request,
  res: Response,
  next: Function
): Promise<void> {
  const signature = req.headers['x-composio-signature'] as string;
  const timestamp = req.headers['x-composio-timestamp'] as string;

  if (!signature || !timestamp) {
    logger.warn('Missing webhook headers');
    res.status(401).json({ error: 'Missing authentication headers' });
    return;
  }

  const isValid = await composioClient.verifyWebhookSignature(
    JSON.stringify(req.body),
    signature,
    timestamp
  );

  if (!isValid) {
    logger.warn('Invalid webhook signature');
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  next();
}

// WhatsApp message status webhook
router.post('/whatsapp/status', verifyWebhookSignature, async (req: Request, res: Response) => {
  try {
    const { message_id, status, timestamp, error_code, error_message } = req.body;

    logger.info('Received message status webhook', { message_id, status });

    // Save webhook event
    const webhookEvent = new WebhookEventModel({
      id: uuidv4(),
      type: 'whatsapp_status',
      timestamp: new Date(timestamp),
      data: req.body,
      processed: false,
    });

    await webhookEvent.save();

    // Find and update message
    const message = await WhatsAppMessageModel.findOne({
      composioMessageId: message_id,
    });

    if (message) {
      if (status === 'delivered') {
        message.status = 'delivered';
        message.deliveredAt = new Date();
      } else if (status === 'read') {
        message.status = 'read';
        message.readAt = new Date();
      } else if (status === 'failed') {
        message.status = 'failed';
        message.errorMessage = error_message || 'Unknown error';
      }

      await message.save();

      // Mark webhook as processed
      webhookEvent.processed = true;
      webhookEvent.processedAt = new Date();
      await webhookEvent.save();

      logger.info('Message status updated', { message_id, status });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Webhook processing failed', { error });
    res.status(500).json({ error: 'Processing failed' });
  }
});

// WhatsApp incoming message webhook
router.post('/whatsapp/incoming', verifyWebhookSignature, async (req: Request, res: Response) => {
  try {
    const { message_id, from_number, message_text, message_type, timestamp } = req.body;

    logger.info('Received incoming WhatsApp message', {
      message_id,
      from_number,
      message_type,
    });

    // Save webhook event
    const webhookEvent = new WebhookEventModel({
      id: uuidv4(),
      type: 'whatsapp_incoming',
      timestamp: new Date(timestamp),
      data: req.body,
      processed: false,
    });

    await webhookEvent.save();

    // TODO: Implement incoming message handling
    // - Route to appropriate agent/investor
    // - Handle conversational AI responses
    // - Log for analytics

    webhookEvent.processed = true;
    webhookEvent.processedAt = new Date();
    await webhookEvent.save();

    res.json({ success: true });
  } catch (error) {
    logger.error('Incoming message processing failed', { error });
    res.status(500).json({ error: 'Processing failed' });
  }
});

// Generic webhook for other Composio events
router.post('/composio/events', verifyWebhookSignature, async (req: Request, res: Response) => {
  try {
    const { event_type, data, timestamp } = req.body;

    logger.info('Received Composio event', { event_type });

    const webhookEvent = new WebhookEventModel({
      id: uuidv4(),
      type: event_type,
      timestamp: new Date(timestamp),
      data,
      processed: false,
    });

    await webhookEvent.save();

    // Handle different event types
    switch (event_type) {
      case 'rate_limit_exceeded':
        logger.warn('Composio rate limit exceeded');
        break;
      case 'api_error':
        logger.error('Composio API error', { data });
        break;
      default:
        logger.info('Unhandled event type', { event_type });
    }

    webhookEvent.processed = true;
    webhookEvent.processedAt = new Date();
    await webhookEvent.save();

    res.json({ success: true });
  } catch (error) {
    logger.error('Event processing failed', { error });
    res.status(500).json({ error: 'Processing failed' });
  }
});

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

export default router;
