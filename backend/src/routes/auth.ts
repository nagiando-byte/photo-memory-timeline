import { Router } from 'express';
import { register, login, getMe, logout, refreshToken } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.post('/refresh', authMiddleware, refreshToken);
router.get('/me', authMiddleware, getMe);

export default router;
