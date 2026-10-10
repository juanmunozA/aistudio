import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { HttpError } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';

/** Asigna un id de correlación a cada petición y lo devuelve en la cabecera X-Request-Id. */
export function requestId(req: Request, res: Response, next: NextFunction) {
  const incoming = req.headers['x-request-id'];
  const id = typeof incoming === 'string' && /^[\w-]{1,64}$/.test(incoming) ? incoming : randomUUID();
  res.locals.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(HttpError.notFound('Ruta no encontrada'));
}

interface BodyParserError extends Error {
  type?: string;
  status?: number;
}

/** Formato único de errores: { error: { code, message, details?, requestId } }. */
export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = res.locals.requestId as string | undefined;
  let httpError: HttpError;

  if (error instanceof HttpError) {
    httpError = error;
  } else if (error instanceof multer.MulterError) {
    httpError = HttpError.badRequest(error.code === 'LIMIT_FILE_SIZE' ? 'El archivo supera el tamaño permitido' : error.message);
  } else if ((error as BodyParserError)?.type === 'entity.too.large') {
    httpError = new HttpError(413, 'PAYLOAD_TOO_LARGE', 'La petición supera el tamaño permitido');
  } else if ((error as BodyParserError)?.type === 'entity.parse.failed') {
    httpError = HttpError.badRequest('El cuerpo de la petición no es un JSON válido');
  } else {
    logger.error('Error no controlado', { requestId, path: req.path, error: error instanceof Error ? error.stack : String(error) });
    httpError = new HttpError(500, 'INTERNAL_ERROR', 'Error interno del servidor');
  }

  res.status(httpError.status).json({
    error: {
      code: httpError.code,
      message: httpError.message,
      ...(httpError.details !== undefined && { details: httpError.details }),
      requestId,
    },
  });
}
