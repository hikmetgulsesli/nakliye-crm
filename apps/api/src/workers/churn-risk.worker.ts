import { Worker } from 'bullmq';
import { getRedis } from '../config/redis';
import { logger } from '../config/logger';
import { runChurnRiskBatch } from '../services/ai/tasks/churn-risk';
import { QUEUE_NAMES, getQueue } from './queues';

const JOB_NAME = 'churn-risk-batch';

/**
 * Her gece 02:00'da tum musteriler icin churn risk hesaplanir.
 */
export async function scheduleChurnRisk(): Promise<void> {
  const queue = getQueue(QUEUE_NAMES.ai);
  const repeatables = await queue.getRepeatableJobs();
  for (const r of repeatables) {
    if (r.name === JOB_NAME) await queue.removeRepeatableByKey(r.key);
  }
  await queue.add(
    JOB_NAME,
    {},
    {
      repeat: { pattern: '0 2 * * *', tz: 'Europe/Istanbul' },
      jobId: 'churn-risk-repeatable',
    },
  );
  // Bootstrap: ilk calistırmayi 5 dakika sonra yap (dev icin)
  await queue.add(JOB_NAME, {}, { delay: 5 * 60 * 1000, jobId: `churn-bootstrap-${Date.now()}` });
  logger.info('Churn risk scheduler kuyrukta (her gece 02:00 TR)');
}

export function startChurnRiskWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.ai,
    async (job) => {
      if (job.name !== JOB_NAME) return;
      const result = await runChurnRiskBatch();
      return result;
    },
    { connection: getRedis(), concurrency: 1 },
  );

  worker.on('completed', (job, result) => {
    logger.info({ jobId: job.id, result }, 'Churn risk job tamamlandi');
  });

  return worker;
}
