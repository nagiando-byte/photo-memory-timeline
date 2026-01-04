import { Router } from 'express';
import {
  createEventShare,
  getEventShares,
  revokeEventShare,
  getSharedEvent,
  downloadSharedEventPhotos,
} from '../controllers/shareController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes (no auth required)
router.get('/public/:shareToken', getSharedEvent);
router.get('/public/:shareToken/download', downloadSharedEventPhotos);

// Protected routes
router.use(authMiddleware);

// Event share management
router.post('/events/:eventId', createEventShare);
router.get('/events/:eventId', getEventShares);
router.delete('/events/:eventId/:shareId', revokeEventShare);

export default router;
