import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import * as reportsController from './reports.controller';

const router = Router();

router.use(auth(), rbac('ADMIN'));

router.get('/periodic-quotes', reportsController.periodicQuotes);
router.get('/staff-performance', reportsController.staffPerformance);
router.get('/win-loss', reportsController.winLoss);
router.get('/country-mode-volume', reportsController.countryModeVolume);
router.get('/loss-reasons', reportsController.lossReasons);
router.get('/export/:type', reportsController.exportReport);

export { router as reportRoutes };
