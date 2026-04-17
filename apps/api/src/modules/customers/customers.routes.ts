import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { customerCreateSchema, customerUpdateSchema } from '@nakliye-crm/shared';
import * as customersController from './customers.controller';
import * as conflictService from './conflict.service';

const router = Router();

router.use(auth());

router.get('/', customersController.list);
router.get('/:id', customersController.getById);
router.post('/', validate(customerCreateSchema), customersController.create);
router.post('/conflict-check', conflictService.checkConflicts);
router.patch('/:id', validate(customerUpdateSchema), customersController.update);
router.delete('/:id', rbac('ADMIN'), customersController.remove);
router.patch('/:id/restore', rbac('ADMIN'), customersController.restore);

export { router as customerRoutes };
