import { Router } from 'express';
import {
  getEvents,
  getEvent,
  getEventsByMonth,
  updateEvent,
  deleteEvent,
  detectEvents,
} from '../controllers/eventController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getEvents);
router.post('/detect', detectEvents);
router.get('/month/:year/:month', getEventsByMonth);
router.get('/:id', getEvent);
router.patch('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
