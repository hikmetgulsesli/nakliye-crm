import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import * as brand from './brand.controller';

const router = Router();

// Public — login sayfasi vs. login oncesi de okumak ister
router.get('/', brand.getBrand);

// ADMIN-only
router.put('/', auth(), rbac('ADMIN'), brand.updateBrand);
router.post('/asset/upload-url', auth(), rbac('ADMIN'), brand.requestAssetUpload);
router.post('/asset/confirm', auth(), rbac('ADMIN'), brand.confirmAssetUpload);

export { router as brandRoutes };
