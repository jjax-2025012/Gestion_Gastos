/**
 * Error base de la aplicación. Permite asociar cada error a un código
 * HTTP y a un mensaje seguro para mostrar al usuario final.
 */
export class AppError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/** 400 — el cuerpo de la solicitud no cumple lo esperado. */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

/** 401 — usuario no encontrado o contraseña incorrecta. */
export class InvalidCredentialsError extends AppError {
  constructor() {
    super(401, "Correo o contraseña incorrectos.");
  }
}

/** 503 — no se pudo hablar con PostgreSQL. */
export class DatabaseUnavailableError extends AppError {
  constructor() {
    super(503, "No se pudo conectar con la base de datos. Intenta de nuevo en unos momentos.");
  }
}

/** 401 — token ausente, inválido o expirado. */
export class UnauthorizedError extends AppError {
  constructor(message = "Sesión expirada o token inválido.") {
    super(401, message);
  }
}
