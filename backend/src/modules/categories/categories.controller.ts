import { Request, Response, NextFunction } from 'express';
import { CategoryType, getCategoriesByType } from './categories.repository';
import { DatabaseUnavailableError, ValidationError } from '../../utils/errors';
import { AuthTokenPayload } from '../../utils/jwt';

const VALID_TYPES: CategoryType[] = ['expense', 'income', 'both'];

/**
 * GET /api/categories?type=income|expense|both
 * Devuelve las categorías del usuario autenticado, filtradas por tipo.
 */
export async function getCategoriesHandler(
  req: Request & { authUser?: AuthTokenPayload },
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.authUser?.sub;
    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    const rawType = (req.query.type as string | undefined) ?? 'both';
    if (!VALID_TYPES.includes(rawType as CategoryType)) {
      throw new ValidationError('El tipo de categoría debe ser expense, income o both.');
    }

    const type = rawType as CategoryType;
    const categories = await getCategoriesByType(type, userId);
    res.status(200).json({ data: categories });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof DatabaseUnavailableError) {
      next(error);
    } else {
      next(new DatabaseUnavailableError());
    }
  }
}