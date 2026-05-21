export interface INotificacion {
  getMensaje(): string;
  getDestinatario(): string;
  getTimestamp(): Date;
  getMetadata(): Record<string, unknown>;
}
