import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import { requireFeature } from '../../services/features.service';
import * as c from './shipments.controller';

const router = Router();

router.use(auth(), requireFeature('shipments'));

router.get('/', c.list);
router.get('/:id', c.getById);
router.post('/', c.create);
router.patch('/:id', c.update);
router.post('/:id/status', c.changeStatus);
router.post('/:id/containers', c.addContainer);
router.delete('/:id/containers/:containerId', c.removeContainer);
router.delete('/:id', rbac('ADMIN'), c.remove);

export { router as shipmentsRoutes };
