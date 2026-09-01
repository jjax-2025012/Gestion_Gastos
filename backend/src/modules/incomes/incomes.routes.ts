import { Router } from 'express';
import {
  getIncomesHandler,
  createIncomeHandler,
  updateIncomeHandler,
  deleteIncomeHandler,
} from './incomes.controller';
import { requireAuth } from '../../middleware/auth.middleware';

export const incomesRouter = Router();

// GET /api/incomes — obtiene todos los ingresos del usuario autenticado
incomesRouter.get('/', requireAuth, getIncomesHandler);

// POST /api/incomes — crea un nuevo ingreso
incomesRouter.post('/', requireAuth, createIncomeHandler);

// PUT /api/incomes/:id — actualiza un ingreso existente
incomesRouter.put('/:id', requireAuth, updateIncomeHandler);

// DELETE /api/incomes/:id — elimina un ingreso
incomesRouter.delete('/:id', requireAuth, deleteIncomeHandler);