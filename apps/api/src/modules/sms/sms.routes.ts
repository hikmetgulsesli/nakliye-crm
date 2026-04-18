import { Router } from 'express';
import { auth } from '../../middleware/auth';
import * as c from './sms.controller';

const router = Router();

router.use(auth());

router.post('/customers/:customerId/send', c.sendToCustomer);

export { router as smsRoutes };
