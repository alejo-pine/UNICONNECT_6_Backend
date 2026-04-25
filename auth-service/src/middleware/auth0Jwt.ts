import { NextFunction, Request, Response } from 'express';
import { auth, UnauthorizedError } from 'express-oauth2-jwt-bearer';
import { env } from '../config/env';

type Auth0JwtCheck = ReturnType<typeof auth>;

const buildAuth0JwtCheck = (): Auth0JwtCheck =>
  auth({
    audience: env.auth0Audience ?? '',
    issuerBaseURL: env.auth0Issuer ?? '',
    tokenSigningAlg: 'RS256',
  });

let cachedAuth0JwtCheck: Auth0JwtCheck | null = null;

const getAuth0JwtCheck = (): Auth0JwtCheck => {
  if (!cachedAuth0JwtCheck) {
    cachedAuth0JwtCheck = buildAuth0JwtCheck();
  }
  return cachedAuth0JwtCheck;
};

const mapAuth0ErrorMessage = (error: UnauthorizedError): string => {
  const normalized = `${error.message ?? ''}`.toLowerCase();

  if (normalized.includes('expired')) {
    return 'Token expirado';
  }

  if (normalized.includes('missing') || normalized.includes('authorization')) {
    return 'Token de autenticacion requerido';
  }

  return 'Token invalido';
};

export const requireAuth0Jwt = (req: Request, res: Response, next: NextFunction): void => {
  if (!env.auth0Issuer || !env.auth0Audience) {
    res.status(500).json({
      error: 'Auth0 no configurado',
      statusCode: 500,
    });
    return;
  }

  const check = getAuth0JwtCheck();

  check(req, res, (error?: unknown): void => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof UnauthorizedError) {
      const statusCode = error.status ?? 401;
      const message = mapAuth0ErrorMessage(error);

      res.status(statusCode).json({
        error: message,
        statusCode,
      });
      return;
    }

    const statusCode = 500;
    const message = 'Error validando token Auth0';

    res.status(statusCode).json({
      error: message,
      statusCode,
    });
  });
};
