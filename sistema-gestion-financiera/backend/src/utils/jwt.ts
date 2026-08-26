import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { PublicUser } from "../modules/users/user.model";

export interface AuthTokenPayload {
  sub: string;
  email: string;
  username: string;
  gender: "male" | "female" | "other";
}

/**
 * Firma un JWT (JSON Web Token) usando JWS con el algoritmo HS256.
 * El token demuestra, sin volver a consultar la base de datos, que el
 * usuario ya inició sesión correctamente.
 */
export function signAuthToken(user: PublicUser): string {
  const payload: AuthTokenPayload = {
    sub: user.id,
    email: user.email,
    username: user.username,
    gender: user.gender,
  };

  const options: SignOptions = {
    algorithm: "HS256",
    expiresIn: env.jwt.expiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, env.jwt.secret, options);
}

/**
 * Verifica y decodifica un JWT. Lanza un error si el token es inválido,
 * fue alterado o ya expiró.
 */
export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwt.secret) as unknown as AuthTokenPayload;
}
