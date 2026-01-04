import { Router } from 'express';
import {
  exportEventAsJson,
  exportEventAsZip,
  exportAllUserData,
} from '../controllers/exportController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// Export single event
router.get('/events/:eventId/json', exportEventAsJson);
router.get('/events/:eventId/zip', exportEventAsZip);

// Export all user data
router.get('/all', exportAllUserData);

export default router;
