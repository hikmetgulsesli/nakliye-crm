import { Worker } from 'bullmq';
import { getRedis } from '../config/redis';
import { logger } from '../config/logger';
import { getSetting } from '../services/system-settings.service';
import { fetchTcmbRates } from '../services/exchange-rates/tcmb.service';
import { QUEUE_NAMES, getQueue } from './queues';

const JOB_NAME = 'fetch-tcmb-rates';

export async function scheduleTcmb(): Promise<void> {
  const queue = getQueue(QUEUE_NAMES.exchangeRates);
  const repeatables = await queue.getRepeatableJobs();
  for (const r of repeatables) {
    if (r.name === JOB_NAME) await queue.removeRepeatableByKey(r.key);
  }
  await queue.add(
    JOB_NAME,
    {},
    {
      repeat: { pattern: '30 9 * * 1-5', tz: 'Europe/Istanbul' }, // is gunleri 09:30
      jobId: 'tcmb-repeatable',
    },
  );
  // Bootstrap: 2 dakika sonra bir kez cek
  await queue.add(JOB_NAME, {}, { delay: 2 * 60 * 1000, jobId: `tcmb-bootstrap-${Date.now()}` });
  logger.info('TCMB kur scheduler kuyrukta (is gunleri 09:30 TR)');
}

export function startTcmbWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.exchangeRates,
    async () => {
      const enabled = await getSetting<boolean>('exchange_rates.enabled');
      if (enabled === false) {
        logger.debug('exchange_rates.enabled=false, atlandi');
        return;
      }
      const result = await fetchTcmbRates();
      return result;
    },
    { connection: getRedis(), concurrency: 1 },
  );

  worker.on('completed', (job, result) => {
    logger.info({ jobId: job.id, result }, 'TCMB kur job tamamlandi');
  });
  worker.on('failed', (job, err) => {
    logger.warn({ jobId: job?.id, err: err.message }, 'TCMB kur job basarisiz');
  });

  return worker;
}
