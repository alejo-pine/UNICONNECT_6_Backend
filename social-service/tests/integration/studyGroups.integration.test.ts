import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { Express, NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const TEST_JWT_SECRET = 'test-jwt-secret-min-length-ok!!!!!';
const TEST_USER_ID = 'test-user-uuid-001';

const testToken = jwt.sign(
  { sub: TEST_USER_ID, email: 'test@ucaldas.edu.co', type: 'session' },
  TEST_JWT_SECRET,
  { algorithm: 'HS256', audience: 'uniconnect-mobile', expiresIn: '1h' },
);

const mockFrom = jest.fn();

jest.unstable_mockModule('../../src/utils/supabaseClient', async () => ({
  default: { from: mockFrom },
  supabase: { from: mockFrom },
}));

const { default: express } = await import('express');
const { default: supertest } = await import('supertest');
const { default: studyGroupsRouter } = await import('../../src/study-groups/interfaces/http/studyGroupRoutes');

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
  app.use('/study-groups', studyGroupsRouter);
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    const e = err as { statusCode?: number; message?: string };
    res.status(e.statusCode ?? 500).json({ error: e.message, statusCode: e.statusCode ?? 500 });
  });
  return app;
};

// POST /study-groups — Crea un nuevo grupo de estudio con límite de 3 por materia
describe('POST /study-groups', () => {
  let app: Express;

  beforeEach(() => {
    queryQueue.length = 0;
    mockFrom.mockImplementation(() => {
      const result = queryQueue.shift() ?? { data: null, error: null };
      return createMockBuilder(result);
    });
    app = createTestApp();
  });

  it('Caso 1: creación exitosa retorna 201 con id, name e is_admin: true', async () => {
    queryQueue.push({ data: { id: 'subject-uuid-001' }, error: null });
    queryQueue.push({ count: 0, data: null, error: null });
    queryQueue.push({
      data: {
        id: 'group-uuid-001',
        name: 'Grupo de Cálculo',
        description: 'Grupo de estudio para Cálculo Diferencial',
        subject_id: 'subject-uuid-001',
        creator_id: TEST_USER_ID,
        created_at: new Date().toISOString(),
      },
      error: null,
    });
    queryQueue.push({ data: { group_id: 'group-uuid-001', profile_id: TEST_USER_ID }, error: null });

    const response = await supertest(app)
      .post('/study-groups')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        name: 'Grupo de Cálculo',
        description: 'Grupo de estudio para Cálculo Diferencial',
        subject_id: 'subject-uuid-001',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe('group-uuid-001');
    expect(response.body.data.name).toBe('Grupo de Cálculo');
    expect(response.body.data.is_admin).toBe(true);
  });

  it('Caso 2: límite de 3 grupos por materia retorna 409 con mensaje de conflicto', async () => {
    queryQueue.push({ data: { id: 'subject-uuid-001' }, error: null });
    queryQueue.push({ count: 3, data: null, error: null });

    const response = await supertest(app)
      .post('/study-groups')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        name: 'Cuarto Grupo',
        description: 'Este grupo excede el límite',
        subject_id: 'subject-uuid-001',
      });

    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/maximum.*3/i);
  });

  it('Caso 3: subject_id inexistente retorna 400', async () => {
    queryQueue.push({ data: null, error: null });

    const response = await supertest(app)
      .post('/study-groups')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        name: 'Grupo Inválido',
        description: 'Subject no existe',
        subject_id: 'subject-inexistente-999',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeTruthy();
  });
});
