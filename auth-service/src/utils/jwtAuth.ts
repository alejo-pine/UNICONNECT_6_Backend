import jwt, { JwtHeader, JwtPayload, VerifyOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { getPublicKeyByKid } from './jwksClient';

export interface VerifiedAccessTokenClaims {
  sub: string;
  email: string;
  name?: string;
  iss?: string;
  aud?: string | string[];
}

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

      if (!sub || !email) {
        throw new AuthError(401, 'Token invalido');
      }

      return {
        sub,
        email,
        name,
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

    if (!sub || !email) {
      throw new AuthError(401, 'Token invalido');
    }

    return {
      sub,
      email,
      name,
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
