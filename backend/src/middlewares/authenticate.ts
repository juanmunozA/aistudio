import type { NextFunction, Request, Response } from 'express';
import type { AuthUser } from '../models/user.js';
import { authService } from '../services/authService.js';
import { HttpError } from '../utils/httpError.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

/** Exige un token válido en "Authorization: Bearer" y deja el usuario en req.user. */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : undefined;
  if (!token) return next(HttpError.unauthorized());

  try {
    req.user = await authService.verifyToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

/** Usuario autenticado de la petición; solo se usa en rutas protegidas por authenticate. */
export function currentUser(req: Request): AuthUser {
  if (!req.user) throw HttpError.unauthorized();
  return req.user;
}
