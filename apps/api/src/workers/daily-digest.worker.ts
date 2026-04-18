import { Worker } from 'bullmq';
import { getRedis } from '../config/redis';
import { logger } from '../config/logger';
import { prisma } from '../config/database';
import { getSetting } from '../services/system-settings.service';
import { queueEmail } from '../services/email';
import { dailyDigestTemplate } from '../services/email/templates';
import { QUEUE_NAMES, getQueue } from './queues';

const JOB_NAME = 'daily-digest';

/**
 * Her sabah 09:00'da ADMIN'lere gunluk ozet gonder.
 * Ayar 'email.daily_digest' = true iken aktif.
 */
export async function scheduleDailyDigest(): Promise<void> {
  const queue = getQueue(QUEUE_NAMES.emails);
  const repeatables = await queue.getRepeatableJobs();
  for (const r of repeatables) {
    if (r.name === JOB_NAME) await queue.removeRepeatableByKey(r.key);
  }
  // Her sabah 09:00 (Istanbul TZ).
  await queue.add(
    JOB_NAME,
    {},
    {
      repeat: { pattern: '0 9 * * *', tz: 'Europe/Istanbul' },
      jobId: 'daily-digest-repeatable',
    },
  );
  logger.info('Daily digest scheduler kuyrukta (her sabah 09:00 TR)');
}

export function startDailyDigestWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.emails,
    async (job) => {
      if (job.name !== JOB_NAME) return; // sadece digest
      const enabled = await getSetting<boolean>('email.daily_digest');
      if (enabled === false) {
        logger.debug('daily_digest kapali, atlandi');
        return;
      }

      const baseUrl = process.env.APP_BASE_URL || 'https://nakliye.setrox.com.tr';
      const today = new Date().toLocaleDateString('tr-TR');

      const admins = await prisma.user.findMany({
        where: { isActive: true, role: 'ADMIN' },
        select: { id: true, email: true, fullName: true },
      });

      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 24);

      const [uncontacted, pending, expired] = await Promise.all([
        prisma.notification.count({
          where: { title: 'Aranmayan Müşteri', createdAt: { gte: cutoff } },
        }),
        prisma.notification.count({
          where: { title: 'Bekleyen Teklif', createdAt: { gte: cutoff } },
        }),
        prisma.notification.count({
          where: { title: 'Süresi Dolmus Teklif', createdAt: { gte: cutoff } },
        }),
      ]);

      if (uncontacted + pending + expired === 0) {
        logger.info('Digest icin madde yok, gonderim yapilmadi');
        return;
      }

      for (const admin of admins) {
        const tpl = dailyDigestTemplate({
          recipientName: admin.fullName,
          date: today,
          uncontactedCount: uncontacted,
          pendingQuoteCount: pending,
          expiredQuoteCount: expired,
          baseUrl,
        });
        await queueEmail({ to: admin.email, subject: tpl.subject, html: tpl.html });
      }
      logger.info({ recipients: admins.length }, 'Daily digest kuyruga eklendi');
    },
    { connection: getRedis(), concurrency: 1 },
  );

  return worker;
}
