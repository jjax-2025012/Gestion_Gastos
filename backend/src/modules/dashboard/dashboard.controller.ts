import { Request, Response, NextFunction } from 'express';
import { getDashboardMetrics } from './dashboard.repository';
import { AuthTokenPayload } from '../../utils/jwt';

export async function getDashboardMetricsHandler(
  req: Request & { authUser?: AuthTokenPayload },
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.authUser?.sub;
    if (!userId) { res.status(401).json({ message: 'Usuario no autenticado.' }); return; }
    res.status(200).json({ data: await getDashboardMetrics(userId) });
  } catch (error) { next(error); }
}