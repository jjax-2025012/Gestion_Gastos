import { Request, Response, NextFunction } from 'express';
import { getExpensesByUserId } from './expenses.repository';
import { DatabaseUnavailableError } from '../../utils/errors';
import { AuthTokenPayload } from '../../utils/jwt';

/**
 * Obtiene todos los gastos del usuario autenticado.
 * El userId viene del middleware requireAuth (req.authUser.id).
 */
export async function getExpensesHandler(
  req: Request & { authUser?: AuthTokenPayload },
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.authUser?.sub;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado.' });
      return;
    }

    const expenses = await getExpensesByUserId(userId);
    res.status(200).json({ data: expenses });
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      next(error);
    } else {
      next(new DatabaseUnavailableError());
    }
  }
}
