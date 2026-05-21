import { INotificacion } from './INotificacion';
import { NotificacionDecorador } from './NotificacionDecorador';

export type NivelPrioridad = 'normal' | 'urgente' | 'critica';

export class NotificacionConPrioridad extends NotificacionDecorador {
  constructor(
    wrapped: INotificacion,
    private readonly nivel: NivelPrioridad,
  ) {
    super(wrapped);
  }

  override getMetadata(): Record<string, unknown> {
    return { ...super.getMetadata(), prioridad: this.nivel };
  }
}
