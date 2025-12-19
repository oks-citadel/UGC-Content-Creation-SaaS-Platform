import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import logger from './logger';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: config.isDevelopment()
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ]
      : [{ emit: 'event', level: 'error' }],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (config.isDevelopment()) {
  globalThis.prisma = prisma;

  // Log queries in development
  prisma.$on('query', (e) => {
    logger.debug({
      query: e.query,
      params: e.params,
      duration: e.duration,
    }, 'Prisma Query');
  });
}

// Log errors
prisma.$on('error', (e) => {
  logger.error({
    message: e.message,
    target: e.target,
  }, 'Prisma Error');
});

// Log warnings
prisma.$on('warn', (e) => {
  logger.warn({
    message: e.message,
    target: e.target,
  }, 'Prisma Warning');
});

// Graceful shutdown
process.on('beforeExit', async () => {
  logger.info('Disconnecting Prisma Client...');
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received: Disconnecting Prisma Client...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received: Disconnecting Prisma Client...');
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
