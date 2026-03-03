import Bull, { Queue, Job } from 'bull';
import config from '../config';
import logger from '../logger';
import { JobData } from '../types';

class QueueManager {
  private queues: Map<string, Queue> = new Map();

  private getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const queue = new Bull(name, config.redis.url, {
        prefix: config.redis.prefix,
        settings: {
          maxStalledCount: 2,
          maxStalledInterval: 5000,
          lockDuration: 30000,
          lockRenewTime: 15000,
          retryProcessDelay: 5000,
        },
      });

      // Setup event listeners
      queue.on('failed', (job: Job, err: Error) => {
        logger.error('Job failed', {
          jobId: job.id,
          queue: name,
          error: err.message,
          attempts: job.attemptsMade,
        });
      });

      queue.on('completed', (job: Job) => {
        logger.info('Job completed', {
          jobId: job.id,
          queue: name,
          duration: job.finishedOn - job.processedOn,
        });
      });

      this.queues.set(name, queue);
    }

    return this.queues.get(name)!;
  }

  async addWhatsAppMessageJob(data: JobData): Promise<Job> {
    const queue = this.getQueue('whatsapp-messages');
    return await queue.add(data, {
      attempts: config.queue.attempts,
      backoff: {
        type: 'exponential',
        delay: config.queue.backoffDelay,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  async addPropertyMatchJob(data: JobData): Promise<Job> {
    const queue = this.getQueue('property-matches');
    return await queue.add(data, {
      attempts: config.queue.attempts,
      backoff: {
        type: 'exponential',
        delay: config.queue.backoffDelay,
      },
    });
  }

  async addBookingConfirmationJob(data: JobData): Promise<Job> {
    const queue = this.getQueue('booking-confirmations');
    return await queue.add(data, {
      attempts: config.queue.attempts,
      backoff: {
        type: 'exponential',
        delay: config.queue.backoffDelay,
      },
    });
  }

  async addReminderJob(data: JobData, delayMs: number): Promise<Job> {
    const queue = this.getQueue('reminders');
    return await queue.add(data, {
      delay: delayMs,
      attempts: config.queue.attempts,
      backoff: {
        type: 'exponential',
        delay: config.queue.backoffDelay,
      },
    });
  }

  async addPaymentJob(data: JobData): Promise<Job> {
    const queue = this.getQueue('payments');
    return await queue.add(data, {
      attempts: config.queue.attempts,
      backoff: {
        type: 'exponential',
        delay: config.queue.backoffDelay,
      },
    });
  }

  async addPortfolioUpdateJob(data: JobData): Promise<Job> {
    const queue = this.getQueue('portfolio-updates');
    return await queue.add(data, {
      attempts: config.queue.attempts,
      backoff: {
        type: 'exponential',
        delay: config.queue.backoffDelay,
      },
    });
  }

  processQueue(
    queueName: string,
    handler: (job: Job<JobData>) => Promise<void>
  ): void {
    const queue = this.getQueue(queueName);
    queue.process(config.queue.concurrency, async (job: Job<JobData>) => {
      try {
        logger.info(`Processing ${queueName} job`, {
          jobId: job.id,
          data: job.data,
        });
        await handler(job);
      } catch (error) {
        logger.error(`Error processing ${queueName} job`, {
          jobId: job.id,
          error,
        });
        throw error;
      }
    });
  }

  async getQueueStats(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const queue = this.getQueue(queueName);
    const counts = await queue.getJobCounts();
    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
    };
  }

  async getAllQueuesStats(): Promise<
    Record<string, Awaited<ReturnType<typeof this.getQueueStats>>>
  > {
    const stats: Record<string, any> = {};
    for (const [name] of this.queues) {
      stats[name] = await this.getQueueStats(name);
    }
    return stats;
  }

  async closeAll(): Promise<void> {
    for (const [name, queue] of this.queues) {
      await queue.close();
      logger.info(`Queue ${name} closed`);
    }
    this.queues.clear();
  }

  async clearQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.empty();
    logger.info(`Queue ${queueName} cleared`);
  }
}

export default new QueueManager();
