import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { requireFeature } from '../../services/features.service';
import * as c from './checkin.controller';

const router = Router();

router.use(auth(), requireFeature('geo_checkin'));

router.post('/', c.createCheckin);

export { router as checkinRoutes };
