import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { quotationCreateSchema, quotationUpdateSchema } from '@nakliye-crm/shared';
import * as quotationsController from './quotations.controller';

const router = Router();

router.use(auth());

router.get('/', quotationsController.list);
router.get('/:id', quotationsController.getById);
router.get('/:id/revisions', quotationsController.getRevisions);
router.post('/', validate(quotationCreateSchema), quotationsController.create);
router.patch('/:id', validate(quotationUpdateSchema), quotationsController.update);
router.delete('/:id', quotationsController.remove);
router.patch('/:id/restore', rbac('ADMIN'), quotationsController.restore);

export { router as quotationRoutes };
