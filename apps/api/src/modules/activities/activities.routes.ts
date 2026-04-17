import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { activityCreateSchema, activityUpdateSchema } from '@nakliye-crm/shared';
import * as activitiesController from './activities.controller';

const router = Router();

router.use(auth());

router.get('/', activitiesController.list);
router.get('/:id', activitiesController.getById);
router.post('/', validate(activityCreateSchema), activitiesController.create);
router.patch('/:id', validate(activityUpdateSchema), activitiesController.update);
router.delete('/:id', activitiesController.remove);
router.patch('/:id/restore', rbac('ADMIN'), activitiesController.restore);

export { router as activityRoutes };
