import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { requireFeature } from '../../services/features.service';
import * as c from './goals.controller';

const router = Router();

router.use(auth(), requireFeature('sales_goals'));

router.get('/', c.list);
router.get('/my-progress', c.myProgress);
router.post('/', c.create);
router.delete('/:id', c.remove);

export { router as goalsRoutes };
