import { Router } from 'express';
import { auth } from '../../middleware/auth';
import * as c from './notes.controller';

const router = Router();

router.use(auth());

router.get('/', c.list);
router.post('/', c.create);
router.delete('/:id', c.remove);

export { router as notesRoutes };
