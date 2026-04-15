import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import * as auditController from './audit.controller';

const router = Router();

router.use(auth(), rbac('ADMIN'));

router.get('/', auditController.list);
router.get('/export/csv', auditController.exportCsv);
router.get('/record/:type/:id', auditController.getByRecord);

export { router as auditRoutes };
