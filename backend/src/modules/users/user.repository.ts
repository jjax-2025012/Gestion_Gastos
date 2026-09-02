import { pool } from '../../db/pool';
import { UserRecord } from './user.model';

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    `SELECT id, username, email, password_hash AS password, gender, avatar_url, created_at
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email]
  );
  return result.rows[0] ?? null;
}

export async function findUserByUsername(username: string): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    `SELECT id, username, email, password_hash AS password, gender, avatar_url, created_at
     FROM users
     WHERE username = $1
     LIMIT 1`,
    [username]
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    `SELECT id, username, email, password_hash AS password, gender, avatar_url, created_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function createUser(
  username: string,
  email: string,
  passwordHash: string,
  gender: 'male' | 'female' | 'other',
  avatarUrl?: string
): Promise<UserRecord> {
  const result = await pool.query<UserRecord>(
    `INSERT INTO users (username, email, password_hash, gender, avatar_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, username, email, password_hash AS password, gender, avatar_url, created_at`,
    [username, email, passwordHash, gender, avatarUrl ?? null]
  );
  return result.rows[0];
}

export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<void> {
  await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, userId]);
}