import app from './app';
import { config } from './config/env';
import { connectRedis, disconnectRedis } from './config/redis';
import { logger } from './utils/logger';

// ==========================================
// INITIALIZE SERVICES
// ==========================================

const initializeServices = async () => {
  try {
    // Connect to Redis
    await connectRedis();
  } catch (error) {
    logger.warn({ error }, 'Redis connection failed, continuing without Redis');
  }
};

// ==========================================
// START SERVER
// ==========================================

const startServer = async () => {
  await initializeServices();

  const server = app.listen(config.port, () => {
    logger.info(`Server running in ${config.env} mode on port http://localhost:${config.port}`);
    logger.info(`API Documentation: http://localhost:${config.port}/api/docs`);
  });

  // ==========================================
  // GRACEFUL SHUTDOWN
  // ==========================================

  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received, starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        // Disconnect Redis
        await disconnectRedis();

        logger.info('All connections closed, exiting...');
        process.exit(0);
      } catch (error) {
        logger.error({ error }, 'Error during shutdown');
        process.exit(1);
      }
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  // ==========================================
  // ERROR HANDLERS
  // ==========================================

  const unexpectedErrorHandler = (error: Error) => {
    logger.error({ error }, 'Unexpected error');
    gracefulShutdown('UNEXPECTED_ERROR');
  };

  process.on('uncaughtException', unexpectedErrorHandler);
  process.on('unhandledRejection', unexpectedErrorHandler);
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer();
