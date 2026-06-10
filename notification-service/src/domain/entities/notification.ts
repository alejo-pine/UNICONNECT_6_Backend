export type NotificationType =
  | 'SOLICITUD_INGRESO'
  | 'MIEMBRO_ACEPTADO'
  | 'MIEMBRO_RECHAZADO'
  | 'NUEVO_MENSAJE'
  | 'EVENTO_GRUPO'
  | 'SISTEMA'
  | 'TRANSFERENCIA_ADMIN';

export interface Notification {
  id: string;
  recipientUserId: string;
  title: string;
  message: string;
  type: NotificationType;
  groupId?: string;
  read: boolean;
  createdAt: Date;
  emailHtml?: string;
}

export interface CreateNotificationInput {
  recipientUserId: string;
  title: string;
  message: string;
  type: NotificationType;
  groupId?: string;
  emailHtml?: string;
}
