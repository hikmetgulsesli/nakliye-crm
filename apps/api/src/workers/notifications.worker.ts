import { Worker } from 'bullmq';
import { getRedis } from '../config/redis';
import { logger } from '../config/logger';
import { generateNotifications } from '../utils/notification-generator';
import { QUEUE_NAMES, getQueue } from './queues';

/**
 * Notification scheduler — BullMQ repeatable job.
 * Replaces the older setInterval-based scheduler in utils/notification-generator.
 */

const JOB_NAME = 'generate-notifications';
const EVERY_MS = 60 * 60 * 1000; // 60 minutes

export async function scheduleNotifications(): Promise<void> {
  const queue = getQueue(QUEUE_NAMES.notifications);
  // Remove old repeatable if changed (idempotent).
  const repeatables = await queue.getRepeatableJobs();
  for (const r of repeatables) {
    if (r.name === JOB_NAME) {
      await queue.removeRepeatableByKey(r.key);
    }
  }
  await queue.add(
    JOB_NAME,
    {},
    {
      repeat: { every: EVERY_MS },
      jobId: 'notifications-repeatable',
    },
  );
  // First-run after 30s so DB connection stabilizes.
  await queue.add(JOB_NAME, {}, { delay: 30_000, jobId: `notifications-bootstrap-${Date.now()}` });
  logger.info({ everyMs: EVERY_MS }, 'Notification scheduler kuyrukta');
}

export function startNotificationsWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.notifications,
    async () => {
      await generateNotifications();
    },
    {
      connection: getRedis(),
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Notification job tamamlandi');
  });
  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, 'Notification job basarisiz');
  });

  return worker;
}
