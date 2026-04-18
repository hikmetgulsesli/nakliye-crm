import { Router } from 'express';
import * as c from './lead-forms.controller';

const router = Router();

// PUBLIC — auth yok (form embed edilebilir)
router.post('/', c.submitLead);

export { router as leadFormsRoutes };
