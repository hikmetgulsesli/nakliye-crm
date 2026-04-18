import IORedis from 'ioredis';
import { logger } from './logger';

let client: IORedis | null = null;

export function getRedis(): IORedis {
  if (client) return client;

  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  client = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });

  client.on('error', (err) => {
    logger.warn({ err: err.message }, 'Redis baglanti hatasi');
  });

  client.on('connect', () => {
    logger.info('Redis bagli');
  });

  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
