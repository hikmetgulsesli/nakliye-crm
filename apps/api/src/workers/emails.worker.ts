import { Worker } from 'bullmq';
import { getRedis } from '../config/redis';
import { logger } from '../config/logger';
import { sendEmail, type EmailMessage } from '../services/email/transport';
import { QUEUE_NAMES } from './queues';

export function startEmailsWorker(): Worker {
  const worker = new Worker<EmailMessage>(
    QUEUE_NAMES.emails,
    async (job) => {
      const result = await sendEmail(job.data);
      return result;
    },
    {
      connection: getRedis(),
      concurrency: 5,
    },
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, to: job.data.to }, 'E-posta job tamamlandi');
  });
  worker.on('failed', (job, err) => {
    logger.error(
      { jobId: job?.id, to: job?.data?.to, err: err.message },
      'E-posta job basarisiz',
    );
  });

  return worker;
}
