import { Router } from 'express';
import {
  batchAnalyze,
  batchDetectFaces,
  getEventSummary,
  getAnalysisStatus,
} from '../controllers/analysisController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// Get analysis status
router.get('/status', getAnalysisStatus);

// Batch analyze photos
router.post('/photos', batchAnalyze);

// Batch detect faces
router.post('/faces', batchDetectFaces);

// Generate event summary
router.post('/events/:id/summary', getEventSummary);

export default router;
