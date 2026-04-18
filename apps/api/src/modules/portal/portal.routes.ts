import { Router } from 'express';
import * as c from './portal.controller';

const router = Router();

// Public — auth gerekmez
router.post('/auth/request-otp', c.requestOtp);
router.post('/auth/verify-otp', c.verifyOtp);

// Portal JWT koruma
router.get('/me', c.portalAuth, c.me);
router.get('/quotations', c.portalAuth, c.myQuotations);
router.get('/shipments', c.portalAuth, c.myShipments);

export { router as portalRoutes };
