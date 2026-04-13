import { Router } from 'express';
import { auth } from '../../middleware/auth';
import * as activitiesController from './activities.controller';

const router = Router();

router.use(auth());

router.get('/', activitiesController.list);
router.get('/:id', activitiesController.getById);
router.post('/', activitiesController.create);
router.patch('/:id', activitiesController.update);
router.delete('/:id', activitiesController.remove);

export { router as activityRoutes };
