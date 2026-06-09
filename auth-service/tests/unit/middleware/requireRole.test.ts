/**
 * Tests unitarios — requireRole middleware (US-EV01)
 *
 * Cobertura requerida por la historia:
 *   ✅ Sin token (req.user ausente)        → 401
 *   ✅ Token inválido / firma incorrecta   → 401  (responsabilidad de authMiddleware;
 *                                                  se prueba que requireRole no los pasa)
 *   ✅ Rol insuficiente                   → 403 con mensaje exacto
 *   ✅ Acceso permitido con super_admin   → next() sin respuesta HTTP
 *
 * Convenciones del proyecto:
 *   - ts-jest con preset ESM
 *   - imports explícitos desde @jest/globals
 *   - jest.clearAllMocks() / jest.restoreAllMocks() vía jest.setup.ts global
 *   - mocks de módulos via jest.mock (evita top-level await del test de integración)
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';

// ── Mocks ──────────────────────────────────────────────────────────────────

// Silencia el eventLogger para no contaminar la salida de los tests.
jest.mock('../../../src/utils/eventLogger', () => ({
  eventLogger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Import bajo test (después de los mocks).
import { requireRole } from '../../../src/middleware/requireRole';
import { eventLogger } from '../../../src/utils/eventLogger';

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Construye un objeto Request mínimo que simula una petición Express.
 * `user` puede ser undefined (sin token) o un objeto parcial.
 */
const buildReq = (user?: { id: string; email: string; role?: string }): Request => {
  const req: Partial<Request> & { user?: typeof user } = {
    path: '/admin/status',
    method: 'GET',
    headers: {},
    user,
  };
  return req as Request;
};

/** Construye un objeto Response con los métodos relevantes espiados. */
const buildRes = (): Response => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

/** Crea un spy next() para verificar si fue invocado. */
const buildNext = (): NextFunction => jest.fn() as unknown as NextFunction;

// ── Suite principal ─────────────────────────────────────────────────────────

describe('requireRole middleware (US-EV01)', () => {
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    res = buildRes();
    next = buildNext();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Escenario 1: Sin token — req.user ausente
  // Ocurre cuando requireRole se invoca sin authMiddleware previo,
  // o cuando authMiddleware rechazó el token y next('error') no detuvo la cadena
  // (situación de uso incorrecto documentada en el JSDoc del middleware).
  // ─────────────────────────────────────────────────────────────────────────
  describe('sin token (req.user ausente)', () => {
    it('responde 401 y no llama next()', () => {
      const req = buildReq(undefined);
      requireRole('super_admin')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('registra advertencia en el logger', () => {
      const req = buildReq(undefined);
      requireRole('super_admin')(req, res, next);

      expect(eventLogger.warn).toHaveBeenCalledTimes(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Escenario 2: Token inválido (authMiddleware falló pero req.user es parcial)
  // En la cadena normal authMiddleware devuelve 401 antes de que llegue requireRole.
  // Este test prueba el comportamiento defensivo: req.user existe pero sin role.
  // ─────────────────────────────────────────────────────────────────────────
  describe('token con payload sin rol (rol insuficiente — role undefined)', () => {
    it('responde 403 con el mensaje exacto requerido por US-EV01', () => {
      const req = buildReq({ id: 'user-123', email: 'alumno@ucaldas.edu.co' });
      requireRole('super_admin')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Acceso restringido a super_admin',
          statusCode: 403,
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Escenario 3: Rol insuficiente — usuario autenticado pero sin rol admin
  // ─────────────────────────────────────────────────────────────────────────
  describe('rol insuficiente (usuario estándar con role="student")', () => {
    it('responde 403 con mensaje exacto "Acceso restringido a super_admin"', () => {
      const req = buildReq({ id: 'user-456', email: 'alumno@ucaldas.edu.co', role: 'student' });
      requireRole('super_admin')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Acceso restringido a super_admin',
        statusCode: 403,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('registra auditoría warn con userId y timestamp', () => {
      const req = buildReq({ id: 'user-456', email: 'alumno@ucaldas.edu.co', role: 'student' });
      requireRole('super_admin')(req, res, next);

      expect(eventLogger.warn).toHaveBeenCalledTimes(1);
      expect(eventLogger.warn).toHaveBeenCalledWith(
        'requireRole',
        'Acceso denegado por rol insuficiente',
        expect.objectContaining({
          userId: 'user-456',
          timestamp: expect.any(String),
        }),
      );
    });

    it('registra también ruta y método en la auditoría', () => {
      const req = buildReq({ id: 'user-456', email: 'alumno@ucaldas.edu.co', role: 'student' });
      requireRole('super_admin')(req, res, next);

      expect(eventLogger.warn).toHaveBeenCalledWith(
        'requireRole',
        'Acceso denegado por rol insuficiente',
        expect.objectContaining({
          path: '/admin/status',
          method: 'GET',
        }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Escenario 4: Acceso permitido — super_admin con JWT válido
  // ─────────────────────────────────────────────────────────────────────────
  describe('acceso permitido (role="super_admin")', () => {
    it('llama next() sin respuesta HTTP', () => {
      const req = buildReq({ id: 'admin-001', email: 'admin@ucaldas.edu.co', role: 'super_admin' });
      requireRole('super_admin')(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('no registra ninguna advertencia en el logger', () => {
      const req = buildReq({ id: 'admin-001', email: 'admin@ucaldas.edu.co', role: 'super_admin' });
      requireRole('super_admin')(req, res, next);

      expect(eventLogger.warn).not.toHaveBeenCalled();
    });

    it('registra auditoría info con userId y ruta al permitir el acceso', () => {
      const req = buildReq({ id: 'admin-001', email: 'admin@ucaldas.edu.co', role: 'super_admin' });
      requireRole('super_admin')(req, res, next);

      expect(eventLogger.info).toHaveBeenCalledTimes(1);
      expect(eventLogger.info).toHaveBeenCalledWith(
        'requireRole',
        'Acceso permitido a ruta administrativa',
        expect.objectContaining({
          userId: 'admin-001',
          role: 'super_admin',
          path: '/admin/status',
        })
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Escenario 5: Guard reutilizable — funciona con cualquier rol requerido
  // ─────────────────────────────────────────────────────────────────────────
  describe('genericidad del guard (roles distintos a super_admin)', () => {
    it('permite acceso cuando el rol coincide con el requerido (moderador)', () => {
      const req = buildReq({ id: 'mod-001', email: 'mod@ucaldas.edu.co', role: 'moderator' });
      requireRole('moderator')(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('deniega cuando el rol no coincide con el requerido (moderador vs admin)', () => {
      const req = buildReq({ id: 'mod-001', email: 'mod@ucaldas.edu.co', role: 'moderator' });
      requireRole('super_admin')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
