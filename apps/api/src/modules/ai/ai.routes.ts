import { Router } from 'express';
import express from 'express';
import { auth } from '../../middleware/auth';
import { requireFeature } from '../../services/features.service';
import * as ai from './ai.controller';

const router = Router();

// Audio base64 25MB'a kadar
router.use(express.json({ limit: '25mb' }));
router.use(auth());

router.get('/status', ai.status);
router.post('/chat', ai.chat);
router.post(
  '/quotations/:quotationId/draft-email',
  requireFeature('ai_email_draft'),
  ai.draftQuoteEmailHandler,
);
router.get(
  '/quotations/:quotationId/win-probability',
  requireFeature('win_probability'),
  ai.winProbability,
);
router.post(
  '/quotations/:quotationId/negotiation-coach',
  requireFeature('ai_negotiation_coach'),
  ai.negotiationCoach,
);

router.get(
  '/customers/:customerId/summary',
  requireFeature('ai_customer_summary'),
  ai.customerSummary,
);

router.get('/churn-risk', requireFeature('churn_risk'), ai.churnRiskList);
router.post(
  '/churn-risk/customers/:customerId/compute',
  requireFeature('churn_risk'),
  ai.churnRiskCompute,
);

router.get('/coaching/:userId', requireFeature('coaching'), ai.coaching);

router.get('/smart-queue', requireFeature('smart_queue'), ai.smartQueue);
router.post('/voice-to-activity', requireFeature('voice_memo'), ai.voiceToActivity);

export { router as aiRoutes };
