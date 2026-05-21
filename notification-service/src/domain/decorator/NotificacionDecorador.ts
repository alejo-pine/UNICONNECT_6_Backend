import { INotificacion } from './INotificacion';

export abstract class NotificacionDecorador implements INotificacion {
  constructor(protected readonly wrapped: INotificacion) {}

  getMensaje(): string {
    return this.wrapped.getMensaje();
  }

  getDestinatario(): string {
    return this.wrapped.getDestinatario();
  }

  getTimestamp(): Date {
    return this.wrapped.getTimestamp();
  }

  getMetadata(): Record<string, unknown> {
    return this.wrapped.getMetadata();
  }
}
