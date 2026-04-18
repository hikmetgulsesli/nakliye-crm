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
import { emailsRoutes } from './modules/emails/emails.routes';
import { shipmentsRoutes } from './modules/shipments/shipments.routes';
import { documentsRoutes } from './modules/documents/documents.routes';
import { exchangeRatesRoutes } from './modules/exchange-rates/exchange-rates.routes';
import { ratesRoutes } from './modules/rates/rates.routes';
import { searchRoutes } from './modules/search/search.routes';
import { savedViewsRoutes } from './modules/saved-views/saved-views.routes';
import { notesRoutes } from './modules/notes/notes.routes';
import { bulkRoutes } from './modules/bulk/bulk.routes';
import { timelineRoutes } from './modules/timeline/timeline.routes';
import { whatsappRoutes } from './modules/whatsapp/whatsapp.routes';
import { smsRoutes } from './modules/sms/sms.routes';
import { portalRoutes } from './modules/portal/portal.routes';
import { messageTemplatesRoutes } from './modules/message-templates/message-templates.routes';
import { dailyPlanRoutes } from './modules/daily-plan/daily-plan.routes';
import { customerContactsRoutes } from './modules/customer-contacts/contacts.routes';
import { commissionRoutes } from './modules/commission/commission.routes';
import { gamificationRoutes } from './modules/gamification/gamification.routes';
import { goalsRoutes } from './modules/goals/goals.routes';
import swaggerUi from 'swagger-ui-express';
import { openapiSpec } from './config/openapi';

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
app.use('/api/emails', emailsRoutes);
app.use('/api/shipments', shipmentsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/exchange-rates', exchangeRatesRoutes);
app.use('/api/rates', ratesRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/saved-views', savedViewsRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/message-templates', messageTemplatesRoutes);
app.use('/api/daily-plan', dailyPlanRoutes);
app.use('/api/customer-contacts', customerContactsRoutes);
app.use('/api/commission', commissionRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/goals', goalsRoutes);

// API documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, {
  customSiteTitle: 'Nakliye CRM API',
}));
app.get('/api/openapi.json', (_req, res) => res.json(openapiSpec));

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
