import {
  findUserByEmail,
  findUserByUsername,
  createUser,
} from '../users/user.repository';
import { toPublicUser, PublicUser } from '../users/user.model';
import { hashPassword, verifyPassword } from '../../utils/password';
import { signAuthToken } from '../../utils/jwt';
import {
  InvalidCredentialsError,
  DatabaseUnavailableError,
  ValidationError,
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
    throw new DatabaseUnavailableError();
  }

  if (!userRecord) {
    throw new InvalidCredentialsError();
  }

  const passwordMatches = await verifyPassword(password, userRecord.password);
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
  // Validaciones básicas (puedes agregar más)
  if (!username || !email || !password || !gender) {
    throw new ValidationError('Todos los campos son obligatorios.');
  }
  if (!['male', 'female', 'other'].includes(gender)) {
    throw new ValidationError('El género debe ser male, female u other.');
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Verificar unicidad de email y username
  let existing;
  try {
    existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      throw new ValidationError('El correo electrónico ya está registrado.');
    }
    existing = await findUserByUsername(username.trim());
    if (existing) {
      throw new ValidationError('El nombre de usuario ya está en uso.');
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new DatabaseUnavailableError();
  }

  // Hashear contraseña
  const passwordHash = await hashPassword(password);

  // Crear usuario
  const newUser = await createUser(username.trim(), normalizedEmail, passwordHash, gender);

  const publicUser = toPublicUser(newUser);
  const token = signAuthToken(publicUser);
  return { token, user: publicUser };
}