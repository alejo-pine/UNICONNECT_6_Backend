import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { Express, NextFunction, Request, Response } from 'express';

type HttpErrorLike = { statusCode?: number; message: string };

const mockFrom = jest.fn();

jest.unstable_mockModule('../src/utils/supabaseClient', async () => ({
  default: { from: mockFrom },
  supabase: { from: mockFrom },
}));

const { default: express } = await import('express');
const { default: supertest } = await import('supertest');
const { asyncHandler } = await import('../../src/utils/controller');
const { syncAuthProfile } = await import('../../src/interfaces/http/authController');
const queryQueue: unknown[] = [];

const createMockBuilder = (result: unknown): Record<string, unknown> => {
  const b: Record<string, unknown> = {};
  const self = (): Record<string, unknown> => b;
  b['select'] = jest.fn(self);
  b['insert'] = jest.fn(self);
  b['update'] = jest.fn(self);
  b['delete'] = jest.fn(self);
  b['eq'] = jest.fn(self);
  b['neq'] = jest.fn(self);
  b['limit'] = jest.fn(self);
  b['single'] = jest.fn(() => Promise.resolve(result));
  b['maybeSingle'] = jest.fn(() => Promise.resolve(result));
  b['then'] = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown): void => {
    void Promise.resolve(result).then(resolve, reject);
  };
  b['catch'] = (reject: (e: unknown) => unknown): Promise<unknown> =>
    Promise.resolve(result).catch(reject);
  return b;
};

const createTestApp = (): Express => {
  const app = express() as Express;
  app.use(express.json());

  const requireJsonContentType = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.is('application/json')) {
      res.status(415).json({ error: 'Content-Type debe ser application/json', statusCode: 415 });
      return;
    }
    next();
  };

  app.post('/auth/sync', requireJsonContentType, asyncHandler(syncAuthProfile));

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    const httpErr = err as HttpErrorLike;
    const statusCode = httpErr.statusCode ?? 500;
    res.status(statusCode).json({ error: httpErr.message, statusCode });
  });

  return app;
};

// POST /auth/sync — Sincroniza el perfil Auth0 con la base de datos interna y emite un JWT de sesión
describe('POST /auth/sync', () => {
  let app: Express;

  beforeEach(() => {
    queryQueue.length = 0;
    mockFrom.mockImplementation(() => {
      const result = queryQueue.shift() ?? { data: null, error: null };
      return createMockBuilder(result);
    });
    app = createTestApp();
  });

  it('Caso 1: token válido con email institucional retorna 201 con token y userId', async () => {
    jest.spyOn(global, 'fetch').mockImplementationOnce(async () => ({
      ok: true,
      json: async () => ({
        sub: 'auth0|test-user-001',
        email: 'estudiante@ucaldas.edu.co',
        name: 'Estudiante Prueba',
      }),
    } as unknown as Awaited<ReturnType<typeof fetch>>));

    queryQueue.push({ data: null, error: null });
    queryQueue.push({ data: null, error: null });
    queryQueue.push({
      data: {
        id: 'profile-uuid-001',
        auth0_id: 'auth0|test-user-001',
        email: 'estudiante@ucaldas.edu.co',
        name: 'Estudiante Prueba',
      },
      error: null,
    });

    const response = await supertest(app)
      .post('/auth/sync')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer valid-institutional-token')
      .send({});

    expect(response.status).toBe(201);
    expect(response.body.token).toBeTruthy();
    expect(response.body.userId).toBe('profile-uuid-001');
  });

  it('Caso 2: email de dominio externo (@gmail.com) retorna 403 con mensaje de error', async () => {
    jest.spyOn(global, 'fetch').mockImplementationOnce(async () => ({
      ok: true,
      json: async () => ({
        sub: 'auth0|gmail-user-001',
        email: 'usuario@gmail.com',
        name: 'Usuario Externo',
      }),
    } as unknown as Awaited<ReturnType<typeof fetch>>));

    const response = await supertest(app)
      .post('/auth/sync')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer valid-external-token')
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.error).toBeTruthy();
  });

  it('Caso 3: ausencia de header Authorization retorna 401', async () => {
    const response = await supertest(app)
      .post('/auth/sync')
      .set('Content-Type', 'application/json')
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.error).toBeTruthy();
  });

  it('Caso 3b: fallo al contactar Auth0 /userinfo retorna 502', async () => {
    jest.spyOn(global, 'fetch').mockImplementationOnce(async () => {
      throw new Error('Connection refused');
    });

    const response = await supertest(app)
      .post('/auth/sync')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer malformed-or-rejected-token')
      .send({});

    expect(response.status).toBe(502);
    expect(response.body.error).toBeTruthy();
  });
});
