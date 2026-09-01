import { Router } from 'express';
import { getCategoriesHandler } from './categories.controller';
import { requireAuth } from '../../middleware/auth.middleware';

export const categoriesRouter = Router();

// GET /api/categories?type=income — obtiene las categorías del usuario autenticado
categoriesRouter.get('/', requireAuth, getCategoriesHandler);