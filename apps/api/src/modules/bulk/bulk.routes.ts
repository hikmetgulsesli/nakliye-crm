import { Router } from 'express';
import { auth } from '../../middleware/auth';
import * as c from './bulk.controller';

const router = Router();

router.use(auth());

router.post('/customers', c.bulkCustomers);
router.post('/quotations', c.bulkQuotations);

export { router as bulkRoutes };
