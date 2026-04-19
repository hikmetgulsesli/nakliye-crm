import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import * as settings from './settings.controller';

const router = Router();

// /feature-flags herkese acik (sadece hangi feature aktif)
router.get('/feature-flags', auth(), settings.getFeatureFlags);

// Diger tum settings admin-only
router.use(auth(), rbac('ADMIN'));

router.get('/', settings.getAll);
router.patch('/', settings.update);
router.get('/features', settings.listFeatures);
router.get('/secrets', settings.listSecrets);
router.put('/secrets', settings.updateSecret);
router.get('/ai-usage', settings.aiUsageReport);

export { router as settingsRoutes };
