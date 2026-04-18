import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { requireFeature } from '../../services/features.service';
import * as c from './notes.controller';

const router = Router();

router.use(auth(), requireFeature('internal_notes'));

router.get('/', c.list);
router.post('/', c.create);
router.delete('/:id', c.remove);

export { router as notesRoutes };
