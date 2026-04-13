import { Router } from 'express';
import { auth } from '../../middleware/auth';
import * as notificationsController from './notifications.controller';

const router = Router();

router.use(auth());

router.get('/', notificationsController.list);
router.patch('/:id/read', notificationsController.markAsRead);
router.patch('/read-all', notificationsController.markAllAsRead);

export { router as notificationRoutes };
