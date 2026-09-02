import { Request, Response, NextFunction } from 'express';
import { getNotificationsByUserId } from './notifications.repository';
import { AuthTokenPayload } from '../../utils/jwt';

export async function getNotificationsHandler(
  req: Request & { authUser?: AuthTokenPayload },
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.authUser?.sub;
    if (!userId) { res.status(401).json({ error: 'Usuario no autenticado.' }); return; }
    res.status(200).json({ data: await getNotificationsByUserId(userId) });
  } catch (error) { next(error); }
}