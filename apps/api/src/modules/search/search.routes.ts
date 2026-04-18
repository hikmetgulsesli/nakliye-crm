import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { requireFeature } from '../../services/features.service';
import * as c from './search.controller';

const router = Router();

router.use(auth(), requireFeature('command_palette'));
router.get('/', c.search);

export { router as searchRoutes };
