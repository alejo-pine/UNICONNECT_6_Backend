import jwt, { JwtHeader, JwtPayload, VerifyOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { getPublicKeyByKid } from './jwksClient';

export interface VerifiedAccessTokenClaims {
  sub: string;
  email: string;
  name?: string;
  /** Rol de aplicación del usuario (ej. 'super_admin'). Leído desde el JWT, nunca desde BD. */
  role?: string;
  iss?: string;
  aud?: string | string[];
}

/**
 * Extrae el rol de aplicación del payload JWT.
 *
 * Estrategia de lectura (orden de prioridad):
 *  1. `app_metadata.role` — claim personalizado configurado vía Supabase Admin API.
 *     Es la forma canónica de asignar roles de aplicación en Supabase.
 *  2. Campo `role` de nivel raíz — usado en tokens HS256 custom (uniconnect-backend).
 *     Se excluyen los roles internos de Supabase ('authenticated', 'anon').
 *
 * No realiza ninguna consulta a base de datos.
 */
export const extractAppRole = (payload: JwtPayload): string | undefined => {
  // 1. Supabase app_metadata.role (set via Admin API / triggers)
  if (typeof payload['app_metadata'] === 'object' && payload['app_metadata'] !== null) {
    const appMeta = payload['app_metadata'] as Record<string, unknown>;
    if (typeof appMeta['role'] === 'string' && appMeta['role'].length > 0) {
      return appMeta['role'];
    }
  }

  // 2. Top-level role claim for custom uniconnect-backend HS256 tokens.
  // Supabase built-in roles ('authenticated', 'anon') are explicitly excluded.
  const SUPABASE_INTERNAL_ROLES = new Set(['authenticated', 'anon']);
  if (
    typeof payload['role'] === 'string' &&
    payload['role'].length > 0 &&
    !SUPABASE_INTERNAL_ROLES.has(payload['role'])
  ) {
    return payload['role'];
  }

  return undefined;
};

export class AuthError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const extractBearerToken = (authorizationHeader?: string): string => {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    throw new AuthError(401, 'Token de autenticacion requerido');
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();
  if (!token) {
    throw new AuthError(401, 'Token de autenticacion requerido');
  }

  return token;
};

export const verifyAccessToken = (token: string): VerifiedAccessTokenClaims => {
  try {
    const decoded = jwt.decode(token, { complete: true });
    const header = decoded?.header as JwtHeader | undefined;
    const algorithm = header?.alg;

    if (algorithm === 'HS256') {
      const verified = jwt.verify(token, env.supabaseJwtSecret, {
        algorithms: ['HS256'],
        issuer: env.backendPublicUrl ?? 'uniconnect-backend',
        audience: 'uniconnect-mobile',
      });

      if (typeof verified === 'string') {
        throw new AuthError(401, 'Token invalido');
      }

      const payload = verified as JwtPayload;
      const sub = typeof payload.sub === 'string' ? payload.sub : undefined;
      const email = typeof payload.email === 'string' ? payload.email : undefined;
      const name = typeof payload.name === 'string' ? payload.name : undefined;
      const role = extractAppRole(payload);

      if (!sub || !email) {
        throw new AuthError(401, 'Token invalido');
      }

      return {
        sub,
        email,
        name,
        role,
        iss: typeof payload.iss === 'string' ? payload.iss : undefined,
        aud: payload.aud,
      };
    }

    const kid = header?.kid ?? '';
    const publicKey = getPublicKeyByKid(kid);

    if (!publicKey) {
      throw new AuthError(401, 'Token invalido');
    }

    const verifyOptions: VerifyOptions = {
      algorithms: ['ES256'],
    };

    if (env.auth0Issuer) {
      verifyOptions.issuer = env.auth0Issuer;
    }

    if (env.auth0Audience) {
      verifyOptions.audience = env.auth0Audience;
    }

    const verified = jwt.verify(token, publicKey, verifyOptions);

    if (typeof verified === 'string') {
      throw new AuthError(401, 'Token invalido');
    }

    const payload = verified as JwtPayload;
    const sub = typeof payload.sub === 'string' ? payload.sub : undefined;
    const email = typeof payload.email === 'string' ? payload.email : undefined;
    const name = typeof payload.name === 'string' ? payload.name : undefined;
    const role = extractAppRole(payload);

    if (!sub || !email) {
      throw new AuthError(401, 'Token invalido');
    }

    return {
      sub,
      email,
      name,
      role,
      iss: typeof payload.iss === 'string' ? payload.iss : undefined,
      aud: payload.aud,
    };
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      throw error;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthError(401, 'Token invalido');
    }

    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError(401, 'Token expirado');
    }

    throw new AuthError(401, 'Error al verificar token');
  }
};
