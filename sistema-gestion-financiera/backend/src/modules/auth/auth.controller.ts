import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { ValidationError } from '../../utils/errors';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLoginBody(body: unknown): { email: string; password: string } {
  if (typeof body !== 'object' || body === null) {
    throw new ValidationError('Solicitud inválida.');
  }
  const { email, password } = body as Record<string, unknown>;
  if (typeof email !== 'string' || email.trim() === '') {
    throw new ValidationError('El correo electrónico es obligatorio.');
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    throw new ValidationError('El correo electrónico no tiene un formato válido.');
  }
  if (typeof password !== 'string' || password === '') {
    throw new ValidationError('La contraseña es obligatoria.');
  }
  return { email: email.trim(), password };
}

function validateRegisterBody(body: unknown): {
  username: string;
  email: string;
  password: string;
  gender: 'male' | 'female' | 'other';
} {
  if (typeof body !== 'object' || body === null) {
    throw new ValidationError('Solicitud inválida.');
  }
  const { username, email, password, gender } = body as Record<string, unknown>;

  if (typeof username !== 'string' || username.trim() === '') {
    throw new ValidationError('El nombre de usuario es obligatorio.');
  }
  if (typeof email !== 'string' || email.trim() === '') {
    throw new ValidationError('El correo electrónico es obligatorio.');
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    throw new ValidationError('El correo electrónico no tiene un formato válido.');
  }
  if (typeof password !== 'string' || password.length < 6) {
    throw new ValidationError('La contraseña debe tener al menos 6 caracteres.');
  }
  if (gender !== 'male' && gender !== 'female' && gender !== 'other') {
    throw new ValidationError('El género debe ser male, female u other.');
  }
  return { username: username.trim(), email: email.trim(), password, gender };
}

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = validateLoginBody(req.body);
    const result = await authService.login(email, password);
    res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}

export async function registerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, email, password, gender } = validateRegisterBody(req.body);
    const result = await authService.register(username, email, password, gender);
    res.status(201).json({
      message: 'Usuario registrado exitosamente.',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}

export function getMeHandler(req: Request, res: Response) {
  const { sub, email, username, gender } = req.authUser;
  res.status(200).json({
    user: { id: sub, email, username, gender },
  });
}