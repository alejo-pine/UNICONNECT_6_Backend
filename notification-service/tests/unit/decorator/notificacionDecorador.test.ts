import { describe, it, expect } from '@jest/globals';
import {
  NotificacionBase,
  NotificacionConPrioridad,
  NotificacionConAccion,
} from '../../../src/domain/decorator/index';

describe('Patrón Decorator — Notificaciones (US-D03)', () => {
  const MENSAJE = 'Tu solicitud fue aceptada';
  const DESTINATARIO = 'user-abc-123';
  const TIMESTAMP = new Date('2026-05-20T10:00:00.000Z');

  describe('NotificacionBase (Criterio 1)', () => {
    it('retorna los valores iniciales y metadata vacía', () => {
      const notif = new NotificacionBase(MENSAJE, DESTINATARIO, TIMESTAMP);

      expect(notif.getMensaje()).toBe(MENSAJE);
      expect(notif.getDestinatario()).toBe(DESTINATARIO);
      expect(notif.getTimestamp()).toBe(TIMESTAMP);
      expect(notif.getMetadata()).toEqual({});
    });

    it('usa la fecha actual si no se provee timestamp', () => {
      const before = Date.now();
      const notif = new NotificacionBase(MENSAJE, DESTINATARIO);
      const after = Date.now();

      const ts = notif.getTimestamp().getTime();
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);
    });
  });

  describe('NotificacionConPrioridad (Criterio 2)', () => {
    it('añade nivel "normal" al metadata sin alterar campos base', () => {
      const decorada = new NotificacionConPrioridad(
        new NotificacionBase(MENSAJE, DESTINATARIO, TIMESTAMP),
        'normal',
      );

      expect(decorada.getMensaje()).toBe(MENSAJE);
      expect(decorada.getDestinatario()).toBe(DESTINATARIO);
      expect(decorada.getTimestamp()).toBe(TIMESTAMP);
      expect(decorada.getMetadata()).toEqual({ prioridad: 'normal' });
    });

    it('añade nivel "urgente" al metadata', () => {
      const decorada = new NotificacionConPrioridad(
        new NotificacionBase(MENSAJE, DESTINATARIO, TIMESTAMP),
        'urgente',
      );

      expect(decorada.getMetadata()).toEqual({ prioridad: 'urgente' });
    });

    it('añade nivel "critica" al metadata', () => {
      const decorada = new NotificacionConPrioridad(
        new NotificacionBase(MENSAJE, DESTINATARIO, TIMESTAMP),
        'critica',
      );

      expect(decorada.getMetadata()).toEqual({ prioridad: 'critica' });
    });
  });

  describe('NotificacionConAccion (Criterio 3)', () => {
    it('añade acción con label y endpoint al metadata', () => {
      const accion = { label: 'Ver grupo', endpoint: '/grupos/123' };
      const decorada = new NotificacionConAccion(
        new NotificacionBase(MENSAJE, DESTINATARIO, TIMESTAMP),
        accion,
      );

      expect(decorada.getMensaje()).toBe(MENSAJE);
      expect(decorada.getDestinatario()).toBe(DESTINATARIO);
      expect(decorada.getMetadata()).toEqual({ accion });
    });
  });

  describe('Composición encadenada (Criterios 1-3)', () => {
    it('compone NotificacionConAccion(NotificacionConPrioridad(NotificacionBase))', () => {
      const accion = { label: 'Aceptar solicitud', endpoint: '/grupos/456/miembros/aceptar' };

      const notif = new NotificacionConAccion(
        new NotificacionConPrioridad(
          new NotificacionBase(MENSAJE, DESTINATARIO, TIMESTAMP),
          'urgente',
        ),
        accion,
      );

      expect(notif.getMensaje()).toBe(MENSAJE);
      expect(notif.getDestinatario()).toBe(DESTINATARIO);
      expect(notif.getTimestamp()).toBe(TIMESTAMP);
      expect(notif.getMetadata()).toEqual({ prioridad: 'urgente', accion });
    });

    it('compone NotificacionConPrioridad(NotificacionConAccion(NotificacionBase)) en orden inverso', () => {
      const accion = { label: 'Ver evento', endpoint: '/eventos/789' };

      const notif = new NotificacionConPrioridad(
        new NotificacionConAccion(
          new NotificacionBase(MENSAJE, DESTINATARIO, TIMESTAMP),
          accion,
        ),
        'critica',
      );

      expect(notif.getMetadata()).toEqual({ accion, prioridad: 'critica' });
    });

    it('la NotificacionBase no es mutada por los decoradores', () => {
      const base = new NotificacionBase(MENSAJE, DESTINATARIO, TIMESTAMP);
      new NotificacionConPrioridad(base, 'urgente');

      expect(base.getMetadata()).toEqual({});
    });
  });
});
