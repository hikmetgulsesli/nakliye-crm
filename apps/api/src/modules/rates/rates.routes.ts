import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import * as c from './rates.controller';

const router = Router();

router.use(auth());

// Carriers
router.get('/carriers', c.listCarriers);
router.post('/carriers', rbac('ADMIN'), c.createCarrier);
router.patch('/carriers/:id', rbac('ADMIN'), c.updateCarrier);
router.delete('/carriers/:id', rbac('ADMIN'), c.removeCarrier);

// Rates
router.get('/', c.listRates);
router.get('/suggest', c.suggestRates);
router.post('/', rbac('ADMIN'), c.createRate);
router.patch('/:id', rbac('ADMIN'), c.updateRate);
router.delete('/:id', rbac('ADMIN'), c.removeRate);

export { router as ratesRoutes };
