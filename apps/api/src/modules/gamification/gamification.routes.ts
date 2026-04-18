import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import { requireFeature } from '../../services/features.service';
import * as c from './gamification.controller';

const router = Router();

router.use(auth(), requireFeature('gamification'));

router.get('/badges', c.listBadges);
router.post('/badges', rbac('ADMIN'), c.createBadge);
router.patch('/badges/:id', rbac('ADMIN'), c.updateBadge);
router.delete('/badges/:id', rbac('ADMIN'), c.removeBadge);
router.post('/badges/evaluate', rbac('ADMIN'), c.evaluateNow);

router.get('/my-badges', c.myBadges);
router.get('/leaderboard', c.leaderboard);

export { router as gamificationRoutes };
