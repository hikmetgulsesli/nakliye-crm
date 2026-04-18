import { initSentry } from './config/sentry';

// Sentry, app modulleri yuklenmeden once baslatilmali.
initSentry();

import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { startWorkers } from './workers';
import { initSocketIO } from './realtime/socket';

const httpServer = http.createServer(app);
initSocketIO(httpServer);

httpServer.listen(env.port, () => {
  logger.info({ port: env.port, env: env.nodeEnv }, 'NakliyeCRM API calisiyor');
  startWorkers().catch((err) => {
    logger.error({ err: err.message }, 'Worker baslatma hatasi');
  });
});
