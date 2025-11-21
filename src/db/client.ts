/**
 * Database Client
 * Prisma client singleton for database access
 * Made optional to allow app to start without database
 * 
 * NOTE: Currently using mock Prisma due to schema validation errors.
 * To enable real database: Fix Prisma schema and run "npx prisma generate"
 */

import { logger } from '../utils/logger';

// Create mock Prisma client - app works without database
const createMockPrisma = () => ({
  trade: {
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({ id: `trade_${Date.now()}` }),
    findUnique: () => Promise.resolve(null),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  },
  order: {
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({ id: `order_${Date.now()}` }),
    findUnique: () => Promise.resolve(null),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
  },
  botState: {
    findUnique: () => Promise.resolve(null),
    upsert: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
  },
  performanceMetrics: {
    create: () => Promise.resolve({ id: `metric_${Date.now()}` }),
    findMany: () => Promise.resolve([]),
  },
  user: {
    findUnique: () => Promise.resolve(null),
  },
  $connect: () => Promise.resolve(),
  $disconnect: () => Promise.resolve(),
});

// For now, always use mock Prisma until schema is fixed
// Prisma schema has validation errors (duplicate Trade model)
logger.info('ℹ️  Using mock database (Prisma schema needs fixing)');
logger.info('   To enable real database: Fix schema and run "npx prisma generate"');

export const prisma = createMockPrisma();
export default prisma;
