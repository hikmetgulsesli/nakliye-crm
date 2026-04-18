import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import * as emails from './emails.controller';

const router = Router();

router.use(auth());

router.post('/test', rbac('ADMIN'), emails.sendTest);
router.post('/daily-digest', rbac('ADMIN'), emails.sendDailyDigest);
router.post('/quotations/:quotationId/send', emails.sendQuotationEmail);

export { router as emailsRoutes };
