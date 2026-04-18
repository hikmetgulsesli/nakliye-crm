import { Worker } from 'bullmq';
import { getRedis } from '../config/redis';
import { logger } from '../config/logger';
import { syncImapOnce } from '../services/email/imap.service';
import { QUEUE_NAMES, getQueue } from './queues';

const JOB_NAME = 'imap-sync';

export async function scheduleImap(): Promise<void> {
  const queue = getQueue(QUEUE_NAMES.imap);
  const repeatables = await queue.getRepeatableJobs();
  for (const r of repeatables) {
    if (r.name === JOB_NAME) await queue.removeRepeatableByKey(r.key);
  }
  // Her 5 dakikada bir cek
  await queue.add(
    JOB_NAME,
    {},
    {
      repeat: { every: 5 * 60 * 1000 },
      jobId: 'imap-repeatable',
    },
  );
  logger.info('IMAP scheduler kuyrukta (her 5 dk)');
}

export function startImapWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.imap,
    async () => {
      const result = await syncImapOnce();
      return result;
    },
    { connection: getRedis(), concurrency: 1 },
  );

  worker.on('completed', (job, result) => {
    logger.debug({ jobId: job.id, result }, 'IMAP job tamamlandi');
  });
  worker.on('failed', (job, err) => {
    logger.warn({ jobId: job?.id, err: err.message }, 'IMAP job basarisiz');
  });

  return worker;
}
