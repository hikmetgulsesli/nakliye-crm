import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import { requireFeature } from '../../services/features.service';
import * as c from './commission.controller';

const router = Router();

router.use(auth(), requireFeature('commission'));

router.get('/me', c.myCommission);
router.get('/rules', rbac('ADMIN'), c.listRules);
router.post('/rules', rbac('ADMIN'), c.createRule);
router.patch('/rules/:id', rbac('ADMIN'), c.updateRule);
router.delete('/rules/:id', rbac('ADMIN'), c.removeRule);

export { router as commissionRoutes };
