// src/domain/mensaje/MencionDecorator.ts
// Decorador que detecta patrones @username en el campo "content" del payload
// y agrega un array "mentions" con los nombres de usuario encontrados.
// Si no hay menciones, el campo "mentions" queda como array vacío.

import { IMensaje } from './IMensaje';

// Patrón: una @ seguida de letras, números, guiones o puntos (sin espacios).
const MENTION_REGEX = /@([\w.\-]+)/g;

export class MencionDecorator implements IMensaje {
  constructor(private readonly wrapped: IMensaje) {}

  getPayload(): Record<string, unknown> {
    const base = this.wrapped.getPayload();
    const content = typeof base['content'] === 'string' ? base['content'] : '';

    const mentions: string[] = [];
    let match: RegExpExecArray | null;

    // Reinicia el índice del regex en cada llamada (regex es stateless aquí
    // porque MENTION_REGEX se declara en el módulo, pero lastIndex se resetea
    // asignándolo o usando exec en un bucle con una nueva instancia).
    const regex = new RegExp(MENTION_REGEX.source, 'g');
    while ((match = regex.exec(content)) !== null) {
      const username = match[1];
      if (username && !mentions.includes(username)) {
        mentions.push(username);
      }
    }

    return {
      ...base,
      mentions,
    };
  }
}
