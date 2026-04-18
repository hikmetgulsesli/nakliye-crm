import 'express-async-errors';
import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { logger } from './config/logger';
import { env } from './config/env';
import { errorHandler } from './middleware/error-handler';
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/users/users.routes';
import { customerRoutes } from './modules/customers/customers.routes';
import { quotationRoutes } from './modules/quotations/quotations.routes';
import { activityRoutes } from './modules/activities/activities.routes';
import { lookupRoutes } from './modules/lookups/lookups.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { reportRoutes } from './modules/reports/reports.routes';
import { transferRoutes } from './modules/transfers/transfers.routes';
import { auditRoutes } from './modules/audit/audit.routes';
import { notificationRoutes } from './modules/notifications/notifications.routes';
import { settingsRoutes } from './modules/settings/settings.routes';
import { aiRoutes } from './modules/ai/ai.routes';

const app = express();

app.use(
  pinoHttp({
    logger,
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    serializers: {
      req: (req) => ({ method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
    autoLogging: {
      ignore: (req) => req.url === '/api/health',
    },
  }),
);

app.use(cors({
  origin: env.corsOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/lookups', lookupRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ai', aiRoutes);

// Error handler
app.use(errorHandler);

// Production: ayni container'da web static dosyalarini da serve et
// Docker image'inda web build ciktisi /app/apps/web/dist'e kopyalanir
if (env.nodeEnv === 'production') {
  const webDistCandidates = [
    path.resolve(process.cwd(), 'apps/web/dist'),
    path.resolve(__dirname, '../../web/dist'),
  ];
  const webDist = webDistCandidates.find((p) => fs.existsSync(path.join(p, 'index.html')));

  if (webDist) {
    app.use(express.static(webDist));
    // SPA fallback: /api disindaki tum GET istekleri index.html'e
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.sendFile(path.join(webDist, 'index.html'));
    });
  }
}

export { app };
