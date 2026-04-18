import { Router } from 'express';
import express from 'express';
import { auth } from '../../middleware/auth';
import * as c from './whatsapp.controller';

const router = Router();

// Inbound webhook Twilio'dan gelir — auth degil form body
router.post(
  '/inbound',
  express.urlencoded({ extended: false }),
  c.inbound,
);

// Giden mesaj — authenticated
router.post('/customers/:customerId/send', auth(), c.sendToCustomer);

export { router as whatsappRoutes };
