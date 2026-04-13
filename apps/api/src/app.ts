import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
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

const app = express();

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

// Error handler
app.use(errorHandler);

export { app };
