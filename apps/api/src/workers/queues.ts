import { Queue, QueueEvents } from 'bullmq';
import { getRedis } from '../config/redis';
import { logger } from '../config/logger';

export const QUEUE_NAMES = {
  notifications: 'notifications',
  emails: 'emails',
  ai: 'ai',
  exchangeRates: 'exchange-rates',
  imap: 'imap',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

const queues = new Map<QueueName, Queue>();

export function getQueue(name: QueueName): Queue {
  const cached = queues.get(name);
  if (cached) return cached;
  const q = new Queue(name, {
    connection: getRedis(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { age: 24 * 3600, count: 500 },
      removeOnFail: { age: 7 * 24 * 3600 },
    },
  });
  queues.set(name, q);
  return q;
}

export function attachQueueEvents(name: QueueName): QueueEvents {
  const events = new QueueEvents(name, { connection: getRedis() });
  events.on('failed', ({ jobId, failedReason }) => {
    logger.warn({ queue: name, jobId, failedReason }, 'BullMQ job basarisiz');
  });
  events.on('completed', ({ jobId }) => {
    logger.debug({ queue: name, jobId }, 'BullMQ job tamamlandi');
  });
  return events;
}

export async function closeAllQueues(): Promise<void> {
  for (const q of queues.values()) {
    await q.close();
  }
  queues.clear();
}
