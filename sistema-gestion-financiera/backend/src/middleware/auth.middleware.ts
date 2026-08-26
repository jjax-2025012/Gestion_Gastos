import { Request, Response, NextFunction } from "express";
import { verifyAuthToken, AuthTokenPayload } from "../utils/jwt";
import { UnauthorizedError } from "../utils/errors";

declare global {
  namespace Express {
    interface Request {
      authUser: AuthTokenPayload;
    }
  }
}

/**
 * Middleware de autenticación por JWT.
 *
 * Espera el token en el header:
 * Authorization: Bearer <token>
 *
 * Si el token no existe, es inválido o ya expiró, devuelve 401.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Se requiere un token de autenticación."));
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const payload = verifyAuthToken(token);
    req.authUser = payload;
    next();
  } catch {
    next(new UnauthorizedError("Sesión expirada o token inválido."));
  }
}