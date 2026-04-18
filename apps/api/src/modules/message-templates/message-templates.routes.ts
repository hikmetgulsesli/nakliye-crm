import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import { requireFeature } from '../../services/features.service';
import * as c from './message-templates.controller';

const router = Router();

router.use(auth(), requireFeature('message_templates'));

router.get('/', c.list);
router.post('/:id/render', c.renderForCustomer);

router.post('/', rbac('ADMIN'), c.create);
router.patch('/:id', rbac('ADMIN'), c.update);
router.delete('/:id', rbac('ADMIN'), c.remove);

export { router as messageTemplatesRoutes };
