import * as Sentry from '@sentry/node';
import { logger } from './logger';

let initialized = false;

export function initSentry() {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.info('Sentry DSN tanimlanmadi, hata raporlama devredisi.');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    sendDefaultPii: false,
  });

  initialized = true;
  logger.info({ dsn: dsn.slice(0, 20) + '...' }, 'Sentry etkin');
}

export { Sentry };
