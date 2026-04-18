import { Router } from 'express';
import { auth } from '../../middleware/auth';
import * as c from './search.controller';

const router = Router();

router.use(auth());
router.get('/', c.search);

export { router as searchRoutes };
