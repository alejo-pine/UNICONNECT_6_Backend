// src/domain/mensaje/ArchivoAdjuntoDecorator.ts
// Decorador que enriquece el payload con la lista normalizada de adjuntos.
// Si el mensaje base ya incluye el array "attachments", este decorador
// lo sustituye por una versión limpia (sólo los campos públicos seguros).

import { IMensaje } from './IMensaje';

interface AttachmentSlim {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export class ArchivoAdjuntoDecorator implements IMensaje {
  constructor(
    private readonly wrapped: IMensaje,
    private readonly attachments: AttachmentSlim[]
  ) {}

  getPayload(): Record<string, unknown> {
    const base = this.wrapped.getPayload();

    // Normaliza el array de adjuntos al subconjunto de campos que el cliente necesita.
    const normalized: AttachmentSlim[] = this.attachments.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      fileType: a.fileType,
      fileSize: a.fileSize,
    }));

    return {
      ...base,
      attachments: normalized,
    };
  }
}
