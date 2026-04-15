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
router.patch('/profile', auth(), authController.updateProfile);
router.patch('/profile/password', auth(), authController.changePassword);
router.post('/2fa/enable', auth(), authController.enable2FA);
router.post('/2fa/disable', auth(), authController.disable2FA);

export { router as authRoutes };
