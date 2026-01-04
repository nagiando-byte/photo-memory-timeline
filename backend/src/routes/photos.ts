import { Router } from 'express';
import {
  getPhotos,
  getPhoto,
  uploadPhoto,
  deletePhoto,
  analyzePhoto,
} from '../controllers/photoController';
import { authMiddleware } from '../middleware/auth';
import { uploadPhoto as uploadMiddleware } from '../middleware/upload';

const router = Router();

router.use(authMiddleware);

router.get('/', getPhotos);
router.get('/:id', getPhoto);
router.post('/upload', uploadMiddleware, uploadPhoto);
router.delete('/:id', deletePhoto);
router.post('/:id/analyze', analyzePhoto);

export default router;
