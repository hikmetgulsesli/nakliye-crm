import { Router } from 'express';
import { auth } from '../../middleware/auth';
import * as c from './saved-views.controller';

const router = Router();

router.use(auth());

router.get('/', c.list);
router.post('/', c.create);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);

export { router as savedViewsRoutes };
