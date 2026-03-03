import { Router, Request, Response } from 'express';
import messageService from '../services/message.service';
import queueManager from '../queue/manager';
import { WhatsAppMessageModel, MessageAnalyticsModel } from '../db/schemas';
import logger from '../logger';

const router = Router();

// Middleware for admin authentication
const adminAuth = (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.split(' ')[1];

  // Simple auth - in production, use proper JWT
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

// Apply auth to all admin routes
router.use(adminAuth);

// Dashboard stats
router.get('/dashboard/stats', async (req: Request, res: Response) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalMessages,
      sentMessages,
      failedMessages,
      deliveredMessages,
      readMessages,
      queueStats,
    ] = await Promise.all([
      WhatsAppMessageModel.countDocuments(),
      WhatsAppMessageModel.countDocuments({ status: 'sent' }),
      WhatsAppMessageModel.countDocuments({ status: 'failed' }),
      WhatsAppMessageModel.countDocuments({ status: 'delivered' }),
      WhatsAppMessageModel.countDocuments({ status: 'read' }),
      queueManager.getAllQueuesStats(),
    ]);

    const deliveryRate = totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0;
    const readRate = totalMessages > 0 ? (readMessages / totalMessages) * 100 : 0;
    const failureRate = totalMessages > 0 ? (failedMessages / totalMessages) * 100 : 0;

    res.json({
      success: true,
      data: {
        messages: {
          total: totalMessages,
          sent: sentMessages,
          delivered: deliveredMessages,
          read: readMessages,
          failed: failedMessages,
          queued: queueStats['whatsapp-messages']?.waiting || 0,
        },
        rates: {
          deliveryRate: deliveryRate.toFixed(2) + '%',
          readRate: readRate.toFixed(2) + '%',
          failureRate: failureRate.toFixed(2) + '%',
        },
        queues: queueStats,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    logger.error('Failed to get dashboard stats', { error });
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Message analytics
router.get('/analytics/messages', async (req: Request, res: Response) => {
  try {
    const { days = 7, type } = req.query;

    const startDate = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);

    let query: any = { createdAt: { $gte: startDate } };
    if (type) {
      query.messageType = type;
    }

    const messages = await WhatsAppMessageModel.find(query).sort({ createdAt: -1 });

    // Group by date
    const groupedByDate: Record<string, any> = {};
    for (const msg of messages) {
      const date = msg.createdAt.toISOString().split('T')[0];
      if (!groupedByDate[date]) {
        groupedByDate[date] = {
          sent: 0,
          delivered: 0,
          read: 0,
          failed: 0,
        };
      }
      groupedByDate[date][msg.status]++;
    }

    res.json({
      success: true,
      data: {
        period: `Last ${days} days`,
        total: messages.length,
        byDate: groupedByDate,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    logger.error('Failed to get message analytics', { error });
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// Campaign performance
router.get('/analytics/campaigns', async (req: Request, res: Response) => {
  try {
    const campaigns = await MessageAnalyticsModel.find().sort({ createdAt: -1 }).limit(50);

    const campaignData = campaigns.map((c) => ({
      id: c.id,
      type: c.campaignType,
      sent: c.sentCount,
      delivered: c.deliveredCount,
      read: c.readCount,
      failed: c.failedCount,
      responses: c.responseCount,
      avgDeliveryTime: `${(c.averageDeliveryTime / 1000).toFixed(2)}s`,
      deliveryRate: c.sentCount > 0 ? ((c.deliveredCount / c.sentCount) * 100).toFixed(2) + '%' : '0%',
      readRate: c.sentCount > 0 ? ((c.readCount / c.sentCount) * 100).toFixed(2) + '%' : '0%',
    }));

    res.json({
      success: true,
      data: campaignData,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get campaign analytics', { error });
    res.status(500).json({ error: 'Failed to get campaign analytics' });
  }
});

// Message search/filter
router.get('/messages/search', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, status, type, limit = 50, offset = 0 } = req.query;

    let query: any = {};
    if (phoneNumber) query.recipientPhoneNumber = new RegExp(phoneNumber as string, 'i');
    if (status) query.status = status;
    if (type) query.messageType = type;

    const messages = await WhatsAppMessageModel.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

    const total = await WhatsAppMessageModel.countDocuments(query);

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      },
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to search messages', { error });
    res.status(500).json({ error: 'Failed to search messages' });
  }
});

// Queue management
router.get('/queue', async (req: Request, res: Response) => {
  try {
    const stats = await queueManager.getAllQueuesStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get queue info', { error });
    res.status(500).json({ error: 'Failed to get queue info' });
  }
});

// Clear queue
router.delete('/queue/:queueName', async (req: Request, res: Response) => {
  try {
    const { queueName } = req.params;

    await queueManager.clearQueue(queueName);

    logger.warn('Queue cleared by admin', { queueName });

    res.json({
      success: true,
      message: `Queue ${queueName} cleared`,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to clear queue', { error });
    res.status(500).json({ error: 'Failed to clear queue' });
  }
});

// Bulk retry failed messages
router.post('/messages/retry-all', async (req: Request, res: Response) => {
  try {
    const failedMessages = await messageService.getFailedMessages(1000);

    let retried = 0;
    for (const msg of failedMessages) {
      try {
        if (msg.retries < msg.maxRetries) {
          await messageService.retryFailedMessage(msg.id);
          retried++;
        }
      } catch (error) {
        logger.error('Failed to retry message', { messageId: msg.id, error });
      }
    }

    logger.info('Bulk retry completed', { total: failedMessages.length, retried });

    res.json({
      success: true,
      data: {
        total: failedMessages.length,
        retried,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Bulk retry failed', { error });
    res.status(500).json({ error: 'Bulk retry failed' });
  }
});

// System health
router.get('/health', async (req: Request, res: Response) => {
  try {
    const queueStats = await queueManager.getAllQueuesStats();

    const health = {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      queues: queueStats,
      timestamp: new Date(),
    };

    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
