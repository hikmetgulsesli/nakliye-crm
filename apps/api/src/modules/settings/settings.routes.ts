import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import * as settings from './settings.controller';

const router = Router();

router.use(auth(), rbac('ADMIN'));

router.get('/', settings.getAll);
router.patch('/', settings.update);
router.get('/ai-usage', settings.aiUsageReport);

export { router as settingsRoutes };
