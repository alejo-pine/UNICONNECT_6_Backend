import { INotificacion } from './INotificacion';

export class NotificacionBase implements INotificacion {
  constructor(
    private readonly mensaje: string,
    private readonly destinatario: string,
    private readonly timestamp: Date = new Date(),
  ) {}

  getMensaje(): string {
    return this.mensaje;
  }

  getDestinatario(): string {
    return this.destinatario;
  }

  getTimestamp(): Date {
    return this.timestamp;
  }

  getMetadata(): Record<string, unknown> {
    return {};
  }
}
