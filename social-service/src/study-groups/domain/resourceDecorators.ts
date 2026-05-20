// src/study-groups/domain/resourceDecorators.ts

// Interfaz para hacer compatible con Sprint 3 (IMensaje)
export interface IMensajeCompatible {
  getPayload(): Record<string, unknown>;
}

export interface IRecurso extends IMensajeCompatible {
  getContenido(): Record<string, unknown>;
  getMetadata(): Record<string, unknown>;
}

export class RecursoBase implements IRecurso {
  constructor(private payload: Record<string, unknown>) {}

  getContenido(): Record<string, unknown> {
    return this.payload.contenido as Record<string, unknown> || {};
  }

  getMetadata(): Record<string, unknown> {
    return this.payload.metadata as Record<string, unknown> || {};
  }

  getPayload(): Record<string, unknown> {
    return {
      ...this.payload,
      contenido: this.getContenido(),
      metadata: this.getMetadata()
    };
  }
}

// Decorator Base
export abstract class RecursoDecorator implements IRecurso {
  constructor(protected recurso: IRecurso) {}

  getContenido(): Record<string, unknown> {
    return this.recurso.getContenido();
  }

  getMetadata(): Record<string, unknown> {
    return this.recurso.getMetadata();
  }

  getPayload(): Record<string, unknown> {
    return this.recurso.getPayload();
  }
}

// Criterio 2: RecursoConEtiquetas, RecursoConValoracion y RecursoConComentarios

export class RecursoConEtiquetas extends RecursoDecorator {
  constructor(recurso: IRecurso, private etiquetas: string[]) {
    super(recurso);
  }

  getMetadata(): Record<string, unknown> {
    const meta = super.getMetadata();
    return { ...meta, etiquetas: this.etiquetas };
  }

  getPayload(): Record<string, unknown> {
    const basePayload = super.getPayload();
    return {
      ...basePayload,
      metadata: this.getMetadata()
    };
  }
}

export class RecursoConValoracion extends RecursoDecorator {
  constructor(recurso: IRecurso, private valoracion: number) {
    super(recurso);
  }

  getMetadata(): Record<string, unknown> {
    const meta = super.getMetadata();
    return { ...meta, valoracion: this.valoracion };
  }

  getPayload(): Record<string, unknown> {
    const basePayload = super.getPayload();
    return {
      ...basePayload,
      metadata: this.getMetadata()
    };
  }
}

export class RecursoConComentarios extends RecursoDecorator {
  constructor(recurso: IRecurso, private comentario: string) {
    super(recurso);
  }

  getMetadata(): Record<string, unknown> {
    const meta = super.getMetadata();
    return { ...meta, comentario: this.comentario };
  }

  getPayload(): Record<string, unknown> {
    const basePayload = super.getPayload();
    return {
      ...basePayload,
      metadata: this.getMetadata()
    };
  }
}
