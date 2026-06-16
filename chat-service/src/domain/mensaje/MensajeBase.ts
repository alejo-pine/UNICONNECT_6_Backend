// src/domain/mensaje/MensajeBase.ts
// Implementación concreta base del patrón Decorator.
// Envuelve el payload crudo (ya serializado) y lo retorna sin modificaciones.
// Los decoradores extienden esta clase añadiendo campos al resultado.

import { IMensaje } from './IMensaje';

export class MensajeBase implements IMensaje {
  constructor(private readonly rawPayload: Record<string, unknown>) {}

  getPayload(): Record<string, unknown> {
    // Retorna una copia superficial para que los decoradores no muten
    // el objeto original de manera inesperada.
    return { ...this.rawPayload };
  }
}
