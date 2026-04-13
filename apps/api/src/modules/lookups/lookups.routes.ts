import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import * as lookupsController from './lookups.controller';

const router = Router();

router.use(auth());

router.get('/', lookupsController.listAll);
router.get('/category/:category', lookupsController.listByCategory);

// Admin-only routes - specific paths BEFORE parameterized ones
router.post('/', rbac('ADMIN'), lookupsController.create);
router.patch('/reorder', rbac('ADMIN'), lookupsController.reorder);
router.patch('/:id/toggle', rbac('ADMIN'), lookupsController.toggle);
router.patch('/:id', rbac('ADMIN'), lookupsController.update);

export { router as lookupRoutes };
