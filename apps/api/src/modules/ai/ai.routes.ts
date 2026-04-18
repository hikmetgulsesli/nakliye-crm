import { Router } from 'express';
import { auth } from '../../middleware/auth';
import * as ai from './ai.controller';

const router = Router();

router.use(auth());

router.get('/status', ai.status);
router.post('/chat', ai.chat);

export { router as aiRoutes };
