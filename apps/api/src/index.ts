import { app } from './app';
import { env } from './config/env';

app.listen(env.port, () => {
  console.log(`NakliyeCRM API running on port ${env.port}`);
});
