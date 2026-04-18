import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { requireFeature } from '../../services/features.service';
import * as c from './contacts.controller';

const router = Router();

router.use(auth(), requireFeature('customer_contacts'));

router.get('/', c.list);
router.get('/birthdays/upcoming', c.upcomingBirthdays);
router.post('/', c.create);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);

export { router as customerContactsRoutes };
