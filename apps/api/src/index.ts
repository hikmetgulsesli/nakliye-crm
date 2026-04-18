import { initSentry } from './config/sentry';

// Sentry, app modulleri yuklenmeden once baslatilmali.
initSentry();

import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { startNotificationScheduler } from './utils/notification-generator';

app.listen(env.port, () => {
  logger.info({ port: env.port, env: env.nodeEnv }, 'NakliyeCRM API calisiyor');
  startNotificationScheduler();
});
