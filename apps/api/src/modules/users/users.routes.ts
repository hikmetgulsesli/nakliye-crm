import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import * as usersController from './users.controller';

const router = Router();

router.use(auth());

// GET /users: tüm auth'lu kullanıcılar (temsilci filter, atama dropdown'i için)
router.get('/', usersController.list);

// Yazma işlemleri admin only
router.post('/', rbac('ADMIN'), usersController.create);
router.patch('/:id', rbac('ADMIN'), usersController.update);
router.patch('/:id/deactivate', rbac('ADMIN'), usersController.deactivate);

export { router as userRoutes };
