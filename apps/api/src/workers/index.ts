import { logger } from '../config/logger';
import { scheduleNotifications, startNotificationsWorker } from './notifications.worker';
import { closeAllQueues } from './queues';
import { closeRedis } from '../config/redis';

const USE_REDIS = process.env.USE_REDIS !== 'false';

/**
 * Start all background workers + repeatable jobs.
 * Falls back to in-process setInterval if Redis is unavailable.
 */
export async function startWorkers(): Promise<void> {
  if (!USE_REDIS) {
    logger.info('USE_REDIS=false, BullMQ worker kapali (dev fallback).');
    // Legacy fallback: in-process scheduler
    const { startNotificationScheduler } = await import('../utils/notification-generator');
    startNotificationScheduler();
    return;
  }

  try {
    await scheduleNotifications();
    startNotificationsWorker();
    logger.info('Worker katmani baslatildi (BullMQ).');
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'Worker baslatma hatasi, in-process fallback kullaniliyor.');
    const { startNotificationScheduler } = await import('../utils/notification-generator');
    startNotificationScheduler();
  }
}

export async function stopWorkers(): Promise<void> {
  await closeAllQueues();
  await closeRedis();
}
