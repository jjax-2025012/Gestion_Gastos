import { Router } from 'express';
import { getExpensesHandler } from './expenses.controller';
import { requireAuth } from '../../middleware/auth.middleware';

export const expensesRouter = Router();

// GET /api/expenses — obtiene todos los gastos del usuario autenticado
expensesRouter.get('/', requireAuth, getExpensesHandler);
