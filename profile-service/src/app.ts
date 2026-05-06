import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { eventLogger } from './utils/eventLogger';
import { HttpError } from './utils/httpError';
import authMiddleware from './middleware/authMiddleware';
import profilesRoutes from './profiles/interfaces/http/profilesRoutes';
import profileSubjectsRoutes from './profile-subjects/interfaces/http/profileSubjectsRoutes';
import onboardingRoutes from './onboarding/interfaces/http/onboardingRoutes';
import subjectRoutes from './subjects/interfaces/http/subjectRoutes';
import studentsRoutes from './students/interfaces/http/studentsRoutes';

type RequestError = Error & {
  statusCode?: number;
  status?: number;
  headers?: Record<string, string>;
  code?: string;
  details?: unknown;
};

const normalizeRequestError = (err: unknown): RequestError => {
  if (err instanceof Error) {
    return err as RequestError;
  }

  const fallback = new Error(
    typeof err === 'string' ? err : 'Error desconocido en el servidor'
  ) as RequestError;

  if (typeof err === 'object' && err !== null) {
    const maybeStatusCode = (err as { statusCode?: unknown }).statusCode;
    const maybeStatus = (err as { status?: unknown }).status;
    const maybeCode = (err as { code?: unknown }).code;
    const maybeDetails = (err as { details?: unknown }).details;

    if (typeof maybeStatusCode === 'number') {
      fallback.statusCode = maybeStatusCode;
    }
    if (typeof maybeStatus === 'number') {
      fallback.status = maybeStatus;
    }
    if (typeof maybeCode === 'string') {
      fallback.code = maybeCode;
    }
    if (maybeDetails !== undefined) {
      fallback.details = maybeDetails;
    }
  }

  return fallback;
};

const formatUnknownError = (error: unknown): { message: string; stack?: string } => {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }

  return { message: typeof error === 'string' ? error : 'Error desconocido' };
};

const app = express();

/**
 * Configuración de seguridad y middleware
 */
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/**
 * Parsers
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Health check
 */
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', version: '1.0.0', service: 'profile-service' });
});

/**
 * Rutas de perfiles
 */
app.use('/profiles', authMiddleware, profilesRoutes);

/**
 * Rutas de asignaturas por perfil
 */
app.use('/profile-subjects', authMiddleware, profileSubjectsRoutes);

/**
 * Rutas de onboarding (protegidas con JWT)
 */
app.use('/onboarding', authMiddleware, onboardingRoutes);

/**
 * Rutas de materias (parcialmente protegidas - /my-subjects requiere auth)
 */
app.use('/subjects', subjectRoutes);

/**
 * Rutas de estudiantes (compañeros)
 */
app.use('/students', authMiddleware, studentsRoutes);

/**
 * Manejo de errores global
 */
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const normalizedError = normalizeRequestError(err);
  const statusCode = normalizedError.statusCode || normalizedError.status || 500;
  const formatted = formatUnknownError(normalizedError);

  if (statusCode >= 500) {
    eventLogger.error('Global Error Handler', formatted.message, {
      stack: formatted.stack,
      code: normalizedError.code,
      details: normalizedError.details,
    });
  } else if (statusCode >= 400) {
    eventLogger.warn('Global Error Handler', formatted.message, {
      code: normalizedError.code,
      details: normalizedError.details,
    });
  }

  res.status(statusCode).json({
    error: normalizedError.message,
    statusCode,
    ...(env.nodeEnv === 'development' && {
      details: normalizedError.details,
      code: normalizedError.code,
    }),
  });
});

/**
 * Ruta no encontrada
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    statusCode: 404,
  });
});

export default app;
