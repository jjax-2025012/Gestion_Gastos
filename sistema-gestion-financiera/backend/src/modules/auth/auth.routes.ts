import { Router } from 'express';
import { loginHandler, registerHandler, getMeHandler } from './auth.controller';
import { requireAuth } from '../../middleware/auth.middleware';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', registerHandler);

// POST /api/auth/login
authRouter.post('/login', loginHandler);

// GET /api/auth/me — valida el JWT y devuelve el usuario de la sesión.
authRouter.get('/me', requireAuth, getMeHandler);