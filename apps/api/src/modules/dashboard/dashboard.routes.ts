import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import * as dashboardController from './dashboard.controller';

const router = Router();

router.use(auth());

router.get('/user', dashboardController.userDashboard);
router.get('/admin', rbac('ADMIN'), dashboardController.adminDashboard);
router.get('/alerts', dashboardController.alerts);

export { router as dashboardRoutes };
