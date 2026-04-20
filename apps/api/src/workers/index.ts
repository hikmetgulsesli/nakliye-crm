import { logger } from '../config/logger';
import { scheduleNotifications, startNotificationsWorker } from './notifications.worker';
import { startEmailsWorker } from './emails.worker';
import { scheduleDailyDigest, startDailyDigestWorker } from './daily-digest.worker';
import { scheduleChurnRisk, startChurnRiskWorker } from './churn-risk.worker';
import { scheduleTcmb, startTcmbWorker } from './tcmb.worker';
import { scheduleImap, startImapWorker } from './imap.worker';
import { closeAllQueues } from './queues';
import { closeRedis, isRedisEnabled } from '../config/redis';

/**
 * Start all background workers + repeatable jobs.
 * Falls back to in-process setInterval if Redis is unavailable/disabled.
 */
export async function startWorkers(): Promise<void> {
  const enabled = await isRedisEnabled();
  if (!enabled) {
    logger.info('Redis kapalı (env veya ayardan) — in-process scheduler ile devam.');
    const { startNotificationScheduler } = await import('../utils/notification-generator');
    startNotificationScheduler();
    return;
  }

  try {
    await scheduleNotifications();
    startNotificationsWorker();
    startEmailsWorker();
    await scheduleDailyDigest();
    startDailyDigestWorker();
    await scheduleChurnRisk();
    startChurnRiskWorker();
    await scheduleTcmb();
    startTcmbWorker();
    await scheduleImap();
    startImapWorker();
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
