import { pool } from '../../db/pool';

export interface NotificationRecord {
  id: string;
  user_id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  icon: string;
  is_read: boolean;
  created_at: string;
}

export async function getNotificationsByUserId(userId: string): Promise<NotificationRecord[]> {
  const result = await pool.query<NotificationRecord>(
    `SELECT id, user_id, message, type, icon, is_read, created_at
     FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId]
  );
  return result.rows;
}

export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  const result = await pool.query(
    `UPDATE notifications SET is_read = TRUE
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return result.rowCount ?? 0;
}

export async function deleteNotification(notificationId: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
    [notificationId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function createNotification(userId: string, message: string, type: NotificationRecord['type'] = 'info', icon = 'info'): Promise<void> {
  await pool.query(
    `INSERT INTO notifications (user_id, message, type, icon) VALUES ($1, $2, $3, $4)`,
    [userId, message, type, icon]
  );
}