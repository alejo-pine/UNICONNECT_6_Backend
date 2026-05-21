import { INotificacion } from './INotificacion';
import { NotificacionDecorador } from './NotificacionDecorador';

export interface AccionNotificacion {
  label: string;
  endpoint: string;
}

export class NotificacionConAccion extends NotificacionDecorador {
  constructor(
    wrapped: INotificacion,
    private readonly accion: AccionNotificacion,
  ) {
    super(wrapped);
  }

  override getMetadata(): Record<string, unknown> {
    return { ...super.getMetadata(), accion: this.accion };
  }
}
