import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { Express, NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const TEST_JWT_SECRET = 'test-jwt-secret-min-length-ok!!!!!';
const TEST_USER_ID = 'test-user-uuid-001';
const NEW_ADMIN_ID = 'uuid-nuevo-admin';

// Token for the current user (TEST_USER_ID)
const testToken = jwt.sign(
  { sub: TEST_USER_ID, email: 'test@ucaldas.edu.co', type: 'session' },
  TEST_JWT_SECRET,
  { algorithm: 'HS256', audience: 'uniconnect-mobile', expiresIn: '1h' },
);

// Token for the new admin (NEW_ADMIN_ID)
const newAdminToken = jwt.sign(
  { sub: NEW_ADMIN_ID, email: 'newadmin@ucaldas.edu.co', type: 'session' },
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

const mockFindDetailById = (groupId: string, creatorId: string) => {
  const groupData = { id: groupId, subject_id: 'sub-1', creator_id: creatorId };
  // 1. findById
  queryQueue.push({ data: groupData, error: null });
  // 2. group_member fetch
  queryQueue.push({ data: [{ profile_id: creatorId }, { profile_id: NEW_ADMIN_ID }], error: null });
  // 3. pending resolve table
  queryQueue.push({ data: [{ group_id: groupId }], error: null });
  // 4. pending fetch
  queryQueue.push({ data: [], error: null });
  // 5. getPendingAdminTransfer
  queryQueue.push({ data: null, error: null });
};

// Criterio: "PATCH /grupos/:id/transferir-admin" pero flujo real son dos endpoints
describe('POST /study-groups/:groupId/transfer-admin (Flujo Completo)', () => {
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

  // Caso 1 — Flujo completo solicitud → aceptación
  it('Caso 1: Flujo completo solicitud → aceptación', async () => {
    const groupId = 'group-uuid-1';

    // === Paso A: Iniciar transferencia ===
    mockFindDetailById(groupId, TEST_USER_ID); // findDetailById returns group with TEST_USER_ID as creator
    // 6. userExists (profile)
    queryQueue.push({ data: { id: NEW_ADMIN_ID }, error: null });
    // 7. isMember
    queryQueue.push({ data: { profile_id: NEW_ADMIN_ID }, error: null });
    // 8. getPendingAdminTransfer
    queryQueue.push({ data: null, error: null });
    // 9. setPendingAdminTransfer (update)
    queryQueue.push({ error: null });
    // 10. findDetailById (after update)
    mockFindDetailById(groupId, TEST_USER_ID);

    const initResponse = await supertest(app)
      .post(`/study-groups/${groupId}/transfer-admin`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ newAdminUserId: NEW_ADMIN_ID });

    expect(initResponse.status).toBe(200);

    // === Paso B: Aceptar transferencia ===
    const transferPayload = { fromUserId: TEST_USER_ID, toUserId: NEW_ADMIN_ID, status: 'pending' };
    
    // 1. findDetailById
    mockFindDetailById(groupId, TEST_USER_ID);
    // 2. getPendingAdminTransfer (initial check)
    queryQueue.push({ data: { pending_admin_transfer: transferPayload }, error: null });
    // 3. acceptAdminTransfer -> getPendingAdminTransfer
    queryQueue.push({ data: { pending_admin_transfer: transferPayload }, error: null });
    // 4. acceptAdminTransfer -> update (changing creator_id)
    queryQueue.push({ error: null });
    // 5. findDetailById (after accept, creator is now NEW_ADMIN_ID)
    mockFindDetailById(groupId, NEW_ADMIN_ID);

    const respondResponse = await supertest(app)
      .post(`/study-groups/${groupId}/transfer-admin/respond`)
      .set('Authorization', `Bearer ${newAdminToken}`) // Call with new admin token
      .send({ action: 'accept' });

    expect(respondResponse.status).toBe(200);
    expect(globalMockUpdate).toHaveBeenCalled();
  });

  // Caso 2 — Rechazo de transferencia
  it('Caso 2: Rechazo de transferencia mantiene al administrador original', async () => {
    const groupId = 'group-uuid-2';
    const transferPayload = { fromUserId: TEST_USER_ID, toUserId: NEW_ADMIN_ID, status: 'pending' };

    // 1. findDetailById
    mockFindDetailById(groupId, TEST_USER_ID);
    // 2. getPendingAdminTransfer
    queryQueue.push({ data: { pending_admin_transfer: transferPayload }, error: null });
    // 3. clearPendingAdminTransfer -> update
    queryQueue.push({ error: null });
    // 4. findDetailById (after reject)
    mockFindDetailById(groupId, TEST_USER_ID);

    const respondResponse = await supertest(app)
      .post(`/study-groups/${groupId}/transfer-admin/respond`)
      .set('Authorization', `Bearer ${newAdminToken}`)
      .send({ action: 'reject' });

    expect(respondResponse.status).toBe(200);
  });

  // Caso 3 — No administrador intenta iniciar transferencia
  it('Caso 3: No administrador intenta iniciar transferencia retorna 403', async () => {
    const groupId = 'group-uuid-3';
    
    // 1. findDetailById -> returns group where creator is NOT the current user
    mockFindDetailById(groupId, 'other-admin-uuid');

    const initResponse = await supertest(app)
      .post(`/study-groups/${groupId}/transfer-admin`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ newAdminUserId: NEW_ADMIN_ID });

    expect(initResponse.status).toBe(403);
    expect(initResponse.body.error).toMatch(/only admin/i);
  });

  // Caso 4 — Usuario incorrecto intenta responder
  it('Caso 4: Usuario incorrecto intenta responder retorna 403', async () => {
    const groupId = 'group-uuid-4';
    const transferPayload = { fromUserId: 'other-admin-uuid', toUserId: 'some-other-user', status: 'pending' };

    // 1. findDetailById
    mockFindDetailById(groupId, 'other-admin-uuid');
    // 2. getPendingAdminTransfer
    queryQueue.push({ data: { pending_admin_transfer: transferPayload }, error: null });

    // Try to respond with the current user, but the transfer is for 'some-other-user'
    const respondResponse = await supertest(app)
      .post(`/study-groups/${groupId}/transfer-admin/respond`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ action: 'accept' });

    expect(respondResponse.status).toBe(403);
    expect(respondResponse.body.error).toMatch(/not for you/i);
  });
});
