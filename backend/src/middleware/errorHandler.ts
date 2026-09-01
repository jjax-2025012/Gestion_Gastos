import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

/**
 * Middleware de errores de Express (se reconoce por tener 4 parámetros).
 * Centraliza cómo se responde ante cualquier error de la aplicación,
 * para no repetir try/catch con formato de respuesta en cada controlador.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Error no esperado: no se expone el detalle interno al cliente,
  // solo se registra en el servidor para depuración.
  console.error("Error no controlado:", err);
  return res.status(500).json({ message: "Ocurrió un error inesperado en el servidor." });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ message: "Recurso no encontrado." });
}
