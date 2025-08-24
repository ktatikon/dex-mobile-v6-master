const Bull = require('bull');
const logger = require('./logger');

class QueueManager {
  constructor() {
    this.queues = new Map();
    this.redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    };
    
    this.defaultJobOptions = {
      removeOnComplete: 100, // Keep last 100 completed jobs
      removeOnFail: 50,      // Keep last 50 failed jobs
      attempts: 3,           // Retry failed jobs 3 times
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    };
  }

  /**
   * Create or get a queue
   */
  getQueue(queueName, options = {}) {
    if (this.queues.has(queueName)) {
      return this.queues.get(queueName);
    }

    const queue = new Bull(queueName, {
      redis: this.redisConfig,
      defaultJobOptions: { ...this.defaultJobOptions, ...options },
    });

    // Add global error handlers
    queue.on('error', (error) => {
      logger.error(`Queue ${queueName} error:`, error);
    });

    queue.on('waiting', (jobId) => {
      logger.info(`Job ${jobId} is waiting in queue ${queueName}`);
    });

    queue.on('active', (job) => {
      logger.info(`Job ${job.id} started processing in queue ${queueName}`);
    });

    queue.on('completed', (job, result) => {
      logger.info(`Job ${job.id} completed in queue ${queueName}`, { result });
    });

    queue.on('failed', (job, err) => {
      logger.error(`Job ${job.id} failed in queue ${queueName}:`, err);
    });

    queue.on('stalled', (job) => {
      logger.warn(`Job ${job.id} stalled in queue ${queueName}`);
    });

    this.queues.set(queueName, queue);
    return queue;
  }

  /**
   * KYC Processing Queue
   */
  getKYCQueue() {
    return this.getQueue('kyc-processing', {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }

  /**
   * AML Screening Queue
   */
  getAMLQueue() {
    return this.getQueue('aml-screening', {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 10000,
      },
    });
  }

  /**
   * Document Processing Queue
   */
  getDocumentQueue() {
    return this.getQueue('document-processing', {
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 5000,
      },
    });
  }

  /**
   * Notification Queue
   */
  getNotificationQueue() {
    return this.getQueue('notifications', {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }

  /**
   * Periodic Re-screening Queue
   */
  getPeriodicScreeningQueue() {
    return this.getQueue('periodic-screening', {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 60000, // 1 minute delay for periodic tasks
      },
    });
  }

  /**
   * Add job to KYC processing queue
   */
  async addKYCJob(jobType, data, options = {}) {
    const queue = this.getKYCQueue();
    const job = await queue.add(jobType, data, {
      priority: options.priority || 0,
      delay: options.delay || 0,
      ...options,
    });
    
    logger.info(`Added KYC job ${job.id} of type ${jobType}`, { data });
    return job;
  }

  /**
   * Add job to AML screening queue
   */
  async addAMLJob(jobType, data, options = {}) {
    const queue = this.getAMLQueue();
    const job = await queue.add(jobType, data, {
      priority: options.priority || 0,
      delay: options.delay || 0,
      ...options,
    });
    
    logger.info(`Added AML job ${job.id} of type ${jobType}`, { data });
    return job;
  }

  /**
   * Add document processing job
   */
  async addDocumentJob(jobType, data, options = {}) {
    const queue = this.getDocumentQueue();
    const job = await queue.add(jobType, data, {
      priority: options.priority || 0,
      delay: options.delay || 0,
      ...options,
    });
    
    logger.info(`Added document job ${job.id} of type ${jobType}`, { data });
    return job;
  }

  /**
   * Add notification job
   */
  async addNotificationJob(jobType, data, options = {}) {
    const queue = this.getNotificationQueue();
    const job = await queue.add(jobType, data, {
      priority: options.priority || 10, // Higher priority for notifications
      delay: options.delay || 0,
      ...options,
    });
    
    logger.info(`Added notification job ${job.id} of type ${jobType}`, { data });
    return job;
  }

  /**
   * Schedule periodic re-screening
   */
  async schedulePeriodicScreening(userId, screeningType, scheduleOptions = {}) {
    const queue = this.getPeriodicScreeningQueue();
    
    const jobData = {
      userId,
      screeningType,
      scheduledAt: new Date().toISOString(),
    };

    const job = await queue.add('periodic-screening', jobData, {
      repeat: scheduleOptions.repeat || { cron: '0 2 * * 0' }, // Weekly by default
      jobId: `periodic-${screeningType}-${userId}`, // Unique job ID to prevent duplicates
      ...scheduleOptions,
    });
    
    logger.info(`Scheduled periodic screening job ${job.id}`, { jobData });
    return job;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      queueName,
      counts: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
      },
      jobs: {
        waiting: waiting.slice(0, 10), // First 10 waiting jobs
        active: active.slice(0, 10),   // First 10 active jobs
        failed: failed.slice(0, 10),   // First 10 failed jobs
      },
    };
  }

  /**
   * Get all queue statistics
   */
  async getAllQueueStats() {
    const stats = {};
    for (const queueName of this.queues.keys()) {
      try {
        stats[queueName] = await this.getQueueStats(queueName);
      } catch (error) {
        logger.error(`Error getting stats for queue ${queueName}:`, error);
        stats[queueName] = { error: error.message };
      }
    }
    return stats;
  }

  /**
   * Clean up old jobs
   */
  async cleanupQueues() {
    for (const [queueName, queue] of this.queues) {
      try {
        // Clean jobs older than 24 hours
        await queue.clean(24 * 60 * 60 * 1000, 'completed');
        await queue.clean(24 * 60 * 60 * 1000, 'failed');
        
        logger.info(`Cleaned up old jobs in queue ${queueName}`);
      } catch (error) {
        logger.error(`Error cleaning queue ${queueName}:`, error);
      }
    }
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    
    await queue.pause();
    logger.info(`Queue ${queueName} paused`);
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    
    await queue.resume();
    logger.info(`Queue ${queueName} resumed`);
  }

  /**
   * Close all queues
   */
  async closeAll() {
    for (const [queueName, queue] of this.queues) {
      try {
        await queue.close();
        logger.info(`Queue ${queueName} closed`);
      } catch (error) {
        logger.error(`Error closing queue ${queueName}:`, error);
      }
    }
    this.queues.clear();
  }

  /**
   * Health check for all queues
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      queues: {},
      timestamp: new Date().toISOString(),
    };

    for (const [queueName, queue] of this.queues) {
      try {
        const isReady = await queue.isReady();
        const isPaused = await queue.isPaused();
        
        health.queues[queueName] = {
          status: isReady ? 'ready' : 'not_ready',
          paused: isPaused,
        };
        
        if (!isReady) {
          health.status = 'degraded';
        }
      } catch (error) {
        health.queues[queueName] = {
          status: 'error',
          error: error.message,
        };
        health.status = 'unhealthy';
      }
    }

    return health;
  }
}

// Create singleton instance
const queueManager = new QueueManager();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, closing queues...');
  await queueManager.closeAll();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, closing queues...');
  await queueManager.closeAll();
  process.exit(0);
});

module.exports = queueManager;
