export type NotificationType =
  | 'SOLICITUD_INGRESO'
  | 'MIEMBRO_ACEPTADO'
  | 'MIEMBRO_RECHAZADO'
  | 'NUEVO_MENSAJE'
  | 'EVENTO_GRUPO'
  | 'SISTEMA';

export interface Notification {
  id: string;
  recipientUserId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
}

export interface CreateNotificationInput {
  recipientUserId: string;
  title: string;
  message: string;
  type: NotificationType;
}
