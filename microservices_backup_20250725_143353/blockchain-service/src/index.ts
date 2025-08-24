/**
 * DEX Mobile v6 - Blockchain Service
 * Multi-chain blockchain interaction service
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { validateRequest } from './middleware/validation';
import { blockchainRoutes } from './routes/blockchain';
import { healthRoutes } from './routes/health';
import { metricsRoutes } from './routes/metrics';
import { RedisClient } from './services/redis';
import { DatabaseClient } from './services/database';
import { BlockchainManager } from './services/blockchainManager';

class BlockchainService {
  private app: express.Application;
  private server: any;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Compression
    this.app.use(compression());

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim())
      }
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Request validation middleware
    this.app.use(validateRequest);
  }

  private setupRoutes(): void {
    // Health check routes (no auth required)
    this.app.use('/health', healthRoutes);
    this.app.use('/metrics', metricsRoutes);

    // API routes (auth required)
    this.app.use('/api/blockchain', authMiddleware, blockchainRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'DEX Blockchain Service',
        version: '1.0.0',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          metrics: '/metrics',
          blockchain: '/api/blockchain'
        }
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        code: 'ENDPOINT_NOT_FOUND',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Initialize Redis connection
      await RedisClient.connect();
      logger.info('Redis connection established');

      // Initialize Database connection
      await DatabaseClient.connect();
      logger.info('Database connection established');

      // Initialize Blockchain Manager
      await BlockchainManager.initialize();
      logger.info('Blockchain Manager initialized');

      // Start server
      this.server = this.app.listen(config.port, () => {
        logger.info(`🚀 Blockchain Service started on port ${config.port}`);
        logger.info(`📊 Environment: ${config.nodeEnv}`);
        logger.info(`🔗 Supported Networks: ${Object.keys(config.networks).join(', ')}`);
      });

      // Graceful shutdown handling
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start Blockchain Service:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      if (this.server) {
        this.server.close(async () => {
          logger.info('HTTP server closed');

          try {
            // Close database connections
            await DatabaseClient.disconnect();
            logger.info('Database connection closed');

            // Close Redis connection
            await RedisClient.disconnect();
            logger.info('Redis connection closed');

            // Close blockchain connections
            await BlockchainManager.cleanup();
            logger.info('Blockchain connections closed');

            logger.info('Graceful shutdown completed');
            process.exit(0);
          } catch (error) {
            logger.error('Error during graceful shutdown:', error);
            process.exit(1);
          }
        });
      }

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Start the service if this file is run directly
if (require.main === module) {
  const service = new BlockchainService();
  service.start().catch((error) => {
    logger.error('Failed to start service:', error);
    process.exit(1);
  });
}

export { BlockchainService };
