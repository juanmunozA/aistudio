import bcrypt from 'bcryptjs';
import { createRemoteJWKSet, jwtVerify, SignJWT, type JWTPayload } from 'jose';
import { env } from '../config/env.js';
import type { AuthUser, LoginInput } from '../models/user.js';
import { userRepository } from '../repositories/userRepository.js';
import { HttpError } from '../utils/httpError.js';

const localSecret = env.JWT_SECRET ? new TextEncoder().encode(env.JWT_SECRET) : undefined;
const remoteJwks = env.OIDC_JWKS_URI ? createRemoteJWKSet(new URL(env.OIDC_JWKS_URI)) : undefined;

// Hash fijo para comparar cuando el usuario no existe: el tiempo de respuesta
// es el mismo y no se revela qué usuarios están registrados.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 12);

export interface IssuedToken {
  accessToken: string;
  expiresAt: string;
  user: AuthUser;
}

async function issueToken(user: AuthUser): Promise<IssuedToken> {
  if (!localSecret) throw new Error('JWT_SECRET no configurado');
  const expiresAt = new Date(Date.now() + env.JWT_EXPIRES_IN_SECONDS * 1000);
  const accessToken = await new SignJWT({ username: user.username, name: user.displayName })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.sub)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(localSecret);
  return { accessToken, expiresAt: expiresAt.toISOString(), user };
}

function toAuthUser(payload: JWTPayload): AuthUser {
  if (!payload.sub) throw HttpError.unauthorized('Token sin identificador de usuario');
  const claims = payload as JWTPayload & Record<string, unknown>;
  const username = String(claims.username ?? claims.preferred_username ?? claims.email ?? claims.upn ?? payload.sub);
  const displayName = String(claims.name ?? username);
  return { sub: payload.sub, username, displayName };
}

export const authService = {
  hashPassword(password: string) {
    return bcrypt.hash(password, 12);
  },

  async login({ username, password }: LoginInput): Promise<IssuedToken> {
    if (env.AUTH_MODE !== 'local') throw HttpError.badRequest('El inicio de sesión se realiza con el proveedor corporativo');

    const user = await userRepository.findByUsername(username);
    const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid || !user.isActive) throw HttpError.unauthorized('Usuario o contraseña incorrectos');

    return issueToken({ sub: user.id, username: user.username, displayName: user.displayName });
  },

  /** Renueva el token de un usuario con sesión válida. */
  async refresh(user: AuthUser): Promise<IssuedToken> {
    if (env.AUTH_MODE !== 'local') throw HttpError.badRequest('La renovación la hace el proveedor corporativo');
    const stored = await userRepository.findById(user.sub);
    if (!stored || !stored.isActive) throw HttpError.unauthorized('Usuario inactivo');
    return issueToken({ sub: stored.id, username: stored.username, displayName: stored.displayName });
  },

  /** Valida firma, emisor, audiencia y expiración del token. */
  async verifyToken(token: string): Promise<AuthUser> {
    try {
      if (env.AUTH_MODE === 'oidc' && remoteJwks) {
        const { payload } = await jwtVerify(token, remoteJwks, { issuer: env.OIDC_ISSUER, audience: env.OIDC_AUDIENCE });
        return toAuthUser(payload);
      }
      if (!localSecret) throw new Error('JWT_SECRET no configurado');
      const { payload } = await jwtVerify(token, localSecret, {
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
        algorithms: ['HS256'],
      });
      return toAuthUser(payload);
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw HttpError.unauthorized('Sesión inválida o expirada');
    }
  },
};
