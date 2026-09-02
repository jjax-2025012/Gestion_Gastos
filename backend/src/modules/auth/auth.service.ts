import { OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'crypto';
import {
  findUserByEmail,
  findUserByUsername,
  createUser,
  updateUserAvatar,
} from '../users/user.repository';
import { toPublicUser, PublicUser } from '../users/user.model';
import { hashPassword, verifyPassword } from '../../utils/password';
import { signAuthToken } from '../../utils/jwt';
import { env } from '../../config/env';
import {
  AppError,
  InvalidCredentialsError,
  DatabaseUnavailableError,
  ValidationError,
  GoogleAuthError,
  GoogleNotConfiguredError,
} from '../../utils/errors';

export interface AuthResult {
  token: string;
  user: PublicUser;
}

export async function login(email: string, password: string): Promise<AuthResult> {
  let userRecord;
  try {
    userRecord = await findUserByEmail(email.toLowerCase().trim());
  } catch (error) {
    console.error("❌ ERROR EN LOGIN (DATABASE):", error);
    throw new DatabaseUnavailableError();
  }

  if (!userRecord) {
    throw new InvalidCredentialsError();
  }

  // Verifica el campo de contraseña según cómo venga en la BD (password_hash o password)
  const storedPassword = userRecord.password_hash || userRecord.password;
  const passwordMatches = await verifyPassword(password, storedPassword);
  
  if (!passwordMatches) {
    throw new InvalidCredentialsError();
  }

  const publicUser = toPublicUser(userRecord);
  const token = signAuthToken(publicUser);
  return { token, user: publicUser };
}

export async function register(
  username: string,
  email: string,
  password: string,
  gender: 'male' | 'female' | 'other'
): Promise<AuthResult> {
  // Validaciones básicas
  if (!username || !email || !password || !gender) {
    throw new ValidationError('Todos los campos son obligatorios.');
  }
  if (!['male', 'female', 'other'].includes(gender)) {
    throw new ValidationError('El género debe ser male, female u other.');
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Verificar unicidad de email y username
  try {
    const existingEmail = await findUserByEmail(normalizedEmail);
    if (existingEmail) {
      throw new ValidationError('El correo electrónico ya está registrado.');
    }
    const existingUsername = await findUserByUsername(username.trim());
    if (existingUsername) {
      throw new ValidationError('El nombre de usuario ya está en uso.');
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    console.error("❌ ERROR EN VALIDACIÓN DE REGISTRO (DATABASE):", error);
    throw new DatabaseUnavailableError();
  }

  // Hashear contraseña
  const passwordHash = await hashPassword(password);

  // Crear usuario en BD
  let newUser;
  try {
    newUser = await createUser(username.trim(), normalizedEmail, passwordHash, gender);
  } catch (error) {
    console.error("❌ ERROR AL CREAR USUARIO EN BD:", error);
    throw new DatabaseUnavailableError();
  }

  const publicUser = toPublicUser(newUser);
  const token = signAuthToken(publicUser);
  return { token, user: publicUser };
}

/**
 * Convierte el nombre/correo de una cuenta de Google en un nombre de
 * usuario seguro (minúsculas, sin acentos, solo caracteres permitidos).
 */
function deriveUsername(name: string | undefined, email: string): string {
  const base =
    (name ?? email.split('@')[0] ?? 'usuario_google')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '')
      .replace(/[._-]{2,}/g, '.')
      .replace(/^[._-]+|[._-]+$/g, '')
      .slice(0, 40) || 'usuario_google';
  return base;
}

export async function loginWithGoogle(idToken: string): Promise<AuthResult> {
  if (!env.google.clientId) {
    throw new GoogleNotConfiguredError();
  }
  if (!idToken || typeof idToken !== 'string' || idToken.trim() === '') {
    throw new ValidationError('El token de Google es obligatorio.');
  }

  // Verifica la firma y el público (audience) del ID token emitido por Google.
  const client = new OAuth2Client(env.google.clientId);
  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.google.clientId,
    });
    payload = ticket.getPayload();
  } catch (error) {
    console.error("❌ ERROR AL VERIFICAR TOKEN DE GOOGLE:", error);
    throw new GoogleAuthError();
  }

  if (!payload || !payload.email || !payload.email_verified) {
    throw new GoogleAuthError();
  }

  const email = payload.email.toLowerCase().trim();

  let userRecord;
  try {
    userRecord = await findUserByEmail(email);

    // Si el usuario no existe, se crea automáticamente
    if (!userRecord) {
      const baseUsername = deriveUsername(payload.name, payload.email);
      let username = baseUsername;
      let existing = await findUserByUsername(username);
      let suffix = 1;
      while (existing) {
        username = `${baseUsername.slice(0, 32)}_${suffix++}`;
        existing = await findUserByUsername(username);
      }

      const randomPassword = randomBytes(24).toString('hex');
      const passwordHash = await hashPassword(randomPassword);

      userRecord = await createUser(username, email, passwordHash, 'other', payload.picture);
    } else if (payload.picture && userRecord.avatar_url !== payload.picture) {
      await updateUserAvatar(userRecord.id, payload.picture);
      userRecord.avatar_url = payload.picture;
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("❌ ERROR EN PROCESO DE GOOGLE BD:", error);
    throw new DatabaseUnavailableError();
  }

  const publicUser = toPublicUser(userRecord);
  publicUser.picture = payload.picture;
  publicUser.avatar_url = payload.picture;
  publicUser.avatar = payload.picture;
  publicUser.avatarUrl = payload.picture;
  const token = signAuthToken(publicUser);
  return { token, user: publicUser };
}