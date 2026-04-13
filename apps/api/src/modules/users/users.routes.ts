import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import * as usersController from './users.controller';

const router = Router();

router.use(auth(), rbac('ADMIN'));

router.get('/', usersController.list);
router.post('/', usersController.create);
router.patch('/:id', usersController.update);
router.patch('/:id/deactivate', usersController.deactivate);

export { router as userRoutes };
