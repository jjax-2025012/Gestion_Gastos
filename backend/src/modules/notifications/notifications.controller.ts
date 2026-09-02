import { Request, Response, NextFunction } from 'express';
import { deleteNotification, getNotificationsByUserId, markAllNotificationsAsRead } from './notifications.repository';
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

export async function markAllNotificationsAsReadHandler(
  req: Request & { authUser?: AuthTokenPayload },
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.authUser?.sub;
    if (!userId) { res.status(401).json({ error: 'Usuario no autenticado.' }); return; }
    const updated = await markAllNotificationsAsRead(userId);
    res.status(200).json({ success: true, updated });
  } catch (error) { next(error); }
}

export async function deleteNotificationHandler(
  req: Request & { authUser?: AuthTokenPayload },
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.authUser?.sub;
    if (!userId) { res.status(401).json({ error: 'Usuario no autenticado.' }); return; }
    const deleted = await deleteNotification(req.params.id, userId);
    if (!deleted) { res.status(404).json({ message: 'Notificación no encontrada.' }); return; }
    res.status(200).json({ success: true });
  } catch (error) { next(error); }
}