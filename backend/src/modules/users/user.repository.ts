import { pool } from '../../db/pool';
import { UserRecord } from './user.model';

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    `SELECT id, username, email, password_hash AS password, gender, avatar_url, google_id, created_at
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email]
  );
  return result.rows[0] ?? null;
}

export async function findUserByUsername(username: string): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    `SELECT id, username, email, password_hash AS password, gender, avatar_url, google_id, created_at
     FROM users
     WHERE username = $1
     LIMIT 1`,
    [username]
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    `SELECT *
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
    RETURNING id, username, email, password_hash AS password, gender, avatar_url, google_id, created_at`,
    [username, email, passwordHash, gender, avatarUrl ?? null]
  );
  return result.rows[0];
}

export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<void> {
  await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, userId]);
}

export async function updateGoogleIdentity(
  userId: string,
  googleId: string,
  avatarUrl?: string
): Promise<void> {
  await pool.query(
    `UPDATE users
     SET google_id = $1,
         avatar_url = COALESCE($2, avatar_url)
     WHERE id = $3`,
    [googleId, avatarUrl ?? null, userId]
  );
}

export async function upsertGoogleUser(
  username: string,
  email: string,
  passwordHash: string,
  avatarUrl: string | undefined,
  googleId: string
): Promise<UserRecord> {
  const result = await pool.query<UserRecord>(
    `INSERT INTO users (username, email, password_hash, gender, avatar_url, google_id)
     VALUES ($1, $2, $3, 'other', $4, $5)
     ON CONFLICT (email) DO UPDATE SET
       avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
       google_id = EXCLUDED.google_id
     RETURNING id, username, email, password_hash AS password, gender, avatar_url, google_id, created_at`,
    [username, email, passwordHash, avatarUrl ?? null, googleId]
  );
  return result.rows[0];
}