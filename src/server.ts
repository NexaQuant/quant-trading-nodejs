import http from 'http';
import { config } from '@/config';
import logger from '@/utils/logger';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Welcome to Binance API Node.js Service!' }));
});

async function main() {
  try {
    server.listen(config.PORT, () => {
      logger.info(`Server is running on port ${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`Log level: ${config.LOG_LEVEL}`);
      // TODO: Initialize WebSocket connection
      // TODO: Initialize REST API client
    });
  } catch (error) {
    logger.error('Failed to start the server:', error);
    process.exit(1);
  }
}

main();

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
signals.forEach(signal => {
  process.on(signal, () => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    server.close(() => {
      logger.info('Server closed.');
      // TODO: Close WebSocket connection
      // TODO: Clean up resources
      process.exit(0);
    });
  });
});