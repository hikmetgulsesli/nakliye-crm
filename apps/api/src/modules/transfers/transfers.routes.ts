import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import * as transfersController from './transfers.controller';

const router = Router();

router.use(auth(), rbac('ADMIN'));

router.post('/preview', transfersController.preview);
router.post('/execute', transfersController.execute);

export { router as transferRoutes };
