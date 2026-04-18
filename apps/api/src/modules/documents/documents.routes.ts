import { Router } from 'express';
import { auth } from '../../middleware/auth';
import * as c from './documents.controller';

const router = Router();

router.use(auth());

router.get('/', c.list);
router.post('/request-upload', c.requestUpload);
router.post('/confirm-upload', c.confirmUpload);
router.get('/:id/download-url', c.downloadUrl);
router.delete('/:id', c.remove);

export { router as documentsRoutes };
