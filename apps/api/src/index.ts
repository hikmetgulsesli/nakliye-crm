import { initSentry } from './config/sentry';

// Sentry, app modulleri yuklenmeden once baslatilmali.
initSentry();

import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { startWorkers } from './workers';

app.listen(env.port, () => {
  logger.info({ port: env.port, env: env.nodeEnv }, 'NakliyeCRM API calisiyor');
  startWorkers().catch((err) => {
    logger.error({ err: err.message }, 'Worker baslatma hatasi');
  });
});
