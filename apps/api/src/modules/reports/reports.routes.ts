import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import * as reportsController from './reports.controller';

const router = Router();

router.use(auth(), rbac('ADMIN'));

router.get('/sales-performance', reportsController.salesPerformance);
router.get('/customer-acquisition', reportsController.customerAcquisition);
router.get('/quotation-conversion', reportsController.quotationConversion);
router.get('/activity-summary', reportsController.activitySummary);
router.get('/loss-analysis', reportsController.lossAnalysis);
router.get('/export', reportsController.exportReport);

export { router as reportRoutes };
