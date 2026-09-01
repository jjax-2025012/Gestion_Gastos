import bcrypt from "bcryptjs";

// Número de "rondas" de bcrypt. 10-12 es un estándar razonable:
// suficientemente lento para dificultar ataques de fuerza bruta,
// sin volver el login perceptiblemente lento para el usuario.
const SALT_ROUNDS = 10;

/**
 * Genera el hash de una contraseña en texto plano.
 * Se usa al crear un usuario (nunca se guarda la contraseña tal cual).
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Compara una contraseña en texto plano contra un hash almacenado.
 * Se usa durante el login.
 */
export async function verifyPassword(
  plainPassword: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}
