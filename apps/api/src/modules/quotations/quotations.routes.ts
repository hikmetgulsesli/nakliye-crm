import { Router } from 'express';
import { auth } from '../../middleware/auth';
import * as quotationsController from './quotations.controller';

const router = Router();

router.use(auth());

router.get('/', quotationsController.list);
router.get('/:id', quotationsController.getById);
router.get('/:id/revisions', quotationsController.getRevisions);
router.post('/', quotationsController.create);
router.patch('/:id', quotationsController.update);
router.delete('/:id', quotationsController.remove);

export { router as quotationRoutes };
