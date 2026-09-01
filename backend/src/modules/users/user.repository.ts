import { pool } from '../../db/pool';
import { UserRecord } from './user.model';

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    `SELECT id, username, email, password_hash AS password, gender, created_at
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email]
  );
  return result.rows[0] ?? null;
}

export async function findUserByUsername(username: string): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    `SELECT id, username, email, password_hash AS password, gender, created_at
     FROM users
     WHERE username = $1
     LIMIT 1`,
    [username]
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    `SELECT id, username, email, password_hash AS password, gender, created_at
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
  gender: 'male' | 'female' | 'other'
): Promise<UserRecord> {
  const result = await pool.query<UserRecord>(
    `INSERT INTO users (username, email, password_hash, gender)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, email, password_hash AS password, gender, created_at`,
    [username, email, passwordHash, gender]
  );
  return result.rows[0];
}