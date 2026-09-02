import { pool } from '../../db/pool';

export interface NotificationRecord {
  id: string;
  user_id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  icon: string;
  created_at: string;
}

export async function getNotificationsByUserId(userId: string): Promise<NotificationRecord[]> {
  const result = await pool.query<NotificationRecord>(
    `SELECT id, user_id, message, type, icon, created_at
     FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId]
  );
  return result.rows;
}

export async function createNotification(userId: string, message: string, type: NotificationRecord['type'] = 'info', icon = 'info'): Promise<void> {
  await pool.query(
    `INSERT INTO notifications (user_id, message, type, icon) VALUES ($1, $2, $3, $4)`,
    [userId, message, type, icon]
  );
}