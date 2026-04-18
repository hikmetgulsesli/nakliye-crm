import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import * as c from './exchange-rates.controller';

const router = Router();

router.use(auth());

router.get('/latest', c.latest);
router.get('/history', c.history);
router.get('/convert', c.convert);
router.post('/refresh', rbac('ADMIN'), c.refresh);

export { router as exchangeRatesRoutes };
