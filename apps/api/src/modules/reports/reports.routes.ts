import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import * as reportsController from './reports.controller';
import * as analyticsController from './analytics.controller';

const router = Router();

router.use(auth(), rbac('ADMIN'));

// Klasik raporlar (export ve liste)
router.get('/periodic-quotes', reportsController.periodicQuotes);
router.get('/staff-performance', reportsController.staffPerformance);
router.get('/win-loss', reportsController.winLoss);
router.get('/country-mode-volume', reportsController.countryModeVolume);
router.get('/loss-reasons', reportsController.lossReasons);
router.get('/export/:type', reportsController.exportReport);

// Yonetici analitik dashboard'u
router.get('/analytics/overview', analyticsController.overview);
router.get('/analytics/team-performance', analyticsController.teamPerformance);
router.get('/analytics/quote-funnel', analyticsController.quoteFunnel);
router.get('/analytics/customer-segments', analyticsController.customerSegments);
router.get('/analytics/lane-analysis', analyticsController.laneAnalysis);
router.get('/analytics/activity-heatmap', analyticsController.activityHeatmap);
router.get('/analytics/revenue-trend', analyticsController.revenueTrend);
router.get('/analytics/top-customers', analyticsController.topCustomers);
router.get('/analytics/pipeline', analyticsController.pipeline);
router.get('/analytics/shipments', analyticsController.shipments);

export { router as reportRoutes };
