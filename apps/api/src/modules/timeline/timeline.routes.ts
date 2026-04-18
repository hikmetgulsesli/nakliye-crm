import { Router } from 'express';
import { auth } from '../../middleware/auth';
import * as c from './timeline.controller';

const router = Router();

router.use(auth());
router.get('/customers/:customerId', c.customerTimeline);

export { router as timelineRoutes };
