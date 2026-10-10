import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { HttpError } from '../utils/httpError.js';

type Source = 'body' | 'params' | 'query';

/** Valida y normaliza una parte de la petición con un schema de zod; responde 400 si no cumple. */
export const validate =
  (schema: z.ZodType, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(HttpError.badRequest('Datos de entrada inválidos', z.treeifyError(result.error)));
    }
    if (source === 'body') req.body = result.data;
    else Object.assign(req[source], result.data);
    next();
  };
