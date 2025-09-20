import { Router } from 'express';
import { register, login } from '../controllers/authController';

const router = Router();

// POST /auth/register
router.post('/register', register);

export default router;

// POST /auth/login
router.post('/login', login);
