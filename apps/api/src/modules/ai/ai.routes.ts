import { Router } from 'express';
import { auth } from '../../middleware/auth';
import * as ai from './ai.controller';

const router = Router();

router.use(auth());

router.get('/status', ai.status);
router.post('/chat', ai.chat);
router.post('/quotations/:quotationId/draft-email', ai.draftQuoteEmailHandler);
router.get('/quotations/:quotationId/win-probability', ai.winProbability);

router.get('/churn-risk', ai.churnRiskList);
router.post('/churn-risk/customers/:customerId/compute', ai.churnRiskCompute);

router.get('/coaching/:userId', ai.coaching);

export { router as aiRoutes };
