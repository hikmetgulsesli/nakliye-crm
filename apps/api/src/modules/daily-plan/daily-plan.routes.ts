import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { requireFeature } from '../../services/features.service';
import * as c from './daily-plan.controller';

const router = Router();

router.use(auth(), requireFeature('daily_plan'));

router.get('/today', c.today);

export { router as dailyPlanRoutes };
