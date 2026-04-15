import { app } from './app';
import { env } from './config/env';
import { startNotificationScheduler } from './utils/notification-generator';

app.listen(env.port, () => {
  console.log(`NakliyeCRM API running on port ${env.port}`);
  startNotificationScheduler();
});
