import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { loginSchema } from '@nakliye-crm/shared';
import * as authController from './auth.controller';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', auth(), authController.logout);
router.get('/me', auth(), authController.me);

export { router as authRoutes };
