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

const globalMockInsert = jest.fn();
const globalMockUpdate = jest.fn();

const createMockBuilder = (result: unknown): Record<string, unknown> => {
  const b: Record<string, unknown> = {};
  const self = (): Record<string, unknown> => b;
  b['select'] = jest.fn(self);
  b['insert'] = (...args: any[]) => {
    globalMockInsert(...args);
    return self();
  };
  b['update'] = (...args: any[]) => {
    globalMockUpdate(...args);
    return self();
  };
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

// Criterio: "POST /grupos/:id/invitar" pero el endpoint real es POST /study-groups/:groupId/join
describe('POST /study-groups/:groupId/join', () => {
  let app: Express;

  beforeEach(() => {
    queryQueue.length = 0;
    globalMockInsert.mockClear();
    globalMockUpdate.mockClear();
    mockFrom.mockImplementation(() => {
      const result = queryQueue.shift() ?? { data: null, error: null };
      return createMockBuilder(result);
    });
    app = createTestApp();
  });

  // Caso 1 — Solicitud exitosa: grupo existe, usuario cursa materia, no es miembro, sin solicitud.
  it('Caso 1: Solicitud exitosa retorna 200 y registra la solicitud', async () => {
    const groupData = { id: 'group-uuid-1', subject_id: 'sub-1', creator_id: 'admin-uuid' };

    // 1. findById
    queryQueue.push({ data: groupData, error: null });
    // 2. verifyEnrollment (profile_subject)
    queryQueue.push({ data: { profile_id: TEST_USER_ID }, error: null });
    // 3. isMember (group_member)
    queryQueue.push({ data: null, error: null });
    // 4. hasPendingRequest -> resolvePendingRequestTable
    queryQueue.push({ data: [{ group_id: 'group-uuid-1' }], error: null });
    // 5. hasPendingRequest -> maybeSingle
    queryQueue.push({ data: null, error: null });
    // 6. addPendingRequest -> hasPendingRequest -> resolvePendingRequestTable
    queryQueue.push({ data: [{ group_id: 'group-uuid-1' }], error: null });
    // 7. addPendingRequest -> hasPendingRequest -> maybeSingle
    queryQueue.push({ data: null, error: null });
    // 8. addPendingRequest -> resolvePendingRequestTable
    queryQueue.push({ data: [{ group_id: 'group-uuid-1' }], error: null });
    // 9. addPendingRequest -> insert
    queryQueue.push({ error: null });
    
    // -- get updated group detail --
    // 8. findById
    queryQueue.push({ data: groupData, error: null });
    // 9. members fetch
    queryQueue.push({ data: [], error: null });
    // 10. resolvePendingRequestTable
    queryQueue.push({ data: [{ group_id: 'group-uuid-1' }], error: null });
    // 11. pending requests fetch
    queryQueue.push({ data: [{ profile_id: TEST_USER_ID }], error: null });
    // 12. pending admin transfer
    queryQueue.push({ data: null, error: null });

    const response = await supertest(app)
      .post('/study-groups/group-uuid-1/join')
      .set('Authorization', `Bearer ${testToken}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.data.is_member).toBe(false);
    expect(globalMockInsert).toHaveBeenCalled();
  });

  // Caso 2 — Usuario no inscrito en la materia
  it('Caso 2: Usuario no inscrito en la materia retorna 403', async () => {
    // 1. findById
    queryQueue.push({ data: { id: 'group-uuid-1', subject_id: 'sub-1' }, error: null });
    // 2. verifyEnrollment (vacio)
    queryQueue.push({ data: null, error: null });

    const response = await supertest(app)
      .post('/study-groups/group-uuid-1/join')
      .set('Authorization', `Bearer ${testToken}`)
      .send();

    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/not enrolled/i);
  });

  // Caso 3 — Solicitud duplicada
  it('Caso 3: Solicitud duplicada retorna 409', async () => {
    // 1. findById
    queryQueue.push({ data: { id: 'group-uuid-1', subject_id: 'sub-1' }, error: null });
    // 2. verifyEnrollment
    queryQueue.push({ data: { profile_id: TEST_USER_ID }, error: null });
    // 3. isMember
    queryQueue.push({ data: null, error: null });
    // 4. hasPendingRequest -> resolve table
    queryQueue.push({ data: [{ group_id: 'group-uuid-1' }], error: null });
    // 5. hasPendingRequest -> maybeSingle
    queryQueue.push({ data: { profile_id: TEST_USER_ID }, error: null });

    const response = await supertest(app)
      .post('/study-groups/group-uuid-1/join')
      .set('Authorization', `Bearer ${testToken}`)
      .send();

    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/pending request/i);
  });

  // Caso 4 — Usuario ya es miembro
  it('Caso 4: Usuario ya es miembro retorna 409', async () => {
    // 1. findById
    queryQueue.push({ data: { id: 'group-uuid-1', subject_id: 'sub-1' }, error: null });
    // 2. verifyEnrollment
    queryQueue.push({ data: { profile_id: TEST_USER_ID }, error: null });
    // 3. isMember
    queryQueue.push({ data: { profile_id: TEST_USER_ID }, error: null });

    const response = await supertest(app)
      .post('/study-groups/group-uuid-1/join')
      .set('Authorization', `Bearer ${testToken}`)
      .send();

    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/already a member/i);
  });
});
