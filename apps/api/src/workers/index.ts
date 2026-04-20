import { logger } from '../config/logger';
import { scheduleNotifications, startNotificationsWorker } from './notifications.worker';
import { startEmailsWorker } from './emails.worker';
import { scheduleDailyDigest, startDailyDigestWorker } from './daily-digest.worker';
import { scheduleChurnRisk, startChurnRiskWorker } from './churn-risk.worker';
import { scheduleTcmb, startTcmbWorker } from './tcmb.worker';
import { scheduleImap, startImapWorker } from './imap.worker';
import { closeAllQueues } from './queues';
import { closeRedis, isRedisEnabled, testRedisConnectivity } from '../config/redis';

async function startFallback(reason: string) {
  logger.info({ reason }, 'BullMQ kapali — in-process scheduler baslatiliyor');
  const { startNotificationScheduler } = await import('../utils/notification-generator');
  startNotificationScheduler();
}

/**
 * Start all background workers + repeatable jobs.
 * Falls back to in-process setInterval if Redis is unavailable/disabled.
 */
export async function startWorkers(): Promise<void> {
  const enabled = await isRedisEnabled();
  if (!enabled) {
    await startFallback('Redis ayardan kapalı');
    return;
  }

  // 2sn timeout'lu tek test — Redis gerçekten erişilebilir mi?
  const reachable = await testRedisConnectivity(true);
  if (!reachable) {
    logger.warn(
      'Redis erişilemiyor (2sn timeout) — in-process fallback. ' +
        'Redis başlatın veya Sistem Ayarları > Genel > Redis kapatın (log kirliliğini önler).',
    );
    await startFallback('Redis erişilemiyor');
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
    await startFallback('Worker hatası');
  }
}

export async function stopWorkers(): Promise<void> {
  await closeAllQueues();
  await closeRedis();
}
