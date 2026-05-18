import supabase from '../utils/supabaseClient';
import { Notification, CreateNotificationInput, NotificationType } from '../domain/entities/notification';
import { NotificationRepositoryPort } from '../domain/ports/notificationRepositoryPort';

interface SupabaseNotificationRow {
  id: string;
  user_id: string;
  message: string;
  type: string;
  group_id?: string;
  read: boolean;
  created_at: string;
}

const NOTIFICATION_FIELDS = 'id, user_id, message, type, group_id, read, created_at';

const getTitleForType = (type: string): string => {
  switch (type) {
    case 'SOLICITUD_INGRESO': return 'Nueva Solicitud';
    case 'MIEMBRO_ACEPTADO': return 'Solicitud Aceptada';
    case 'MIEMBRO_RECHAZADO': return 'Solicitud Rechazada';
    case 'NUEVO_MENSAJE': return 'Nuevo Mensaje';
    case 'EVENTO_GRUPO': return 'Evento de Grupo';
    case 'TRANSFERENCIA_ADMIN': return 'Transferencia de Admin';
    case 'SISTEMA': return 'Aviso del Sistema';
    default: return 'Notificación';
  }
};

const toEntity = (row: SupabaseNotificationRow): Notification => ({
  id: row.id,
  recipientUserId: row.user_id,
  title: getTitleForType(row.type),
  message: row.message,
  type: row.type as NotificationType,
  groupId: row.group_id,
  read: row.read,
  createdAt: new Date(row.created_at),
});

export class SupabaseNotificationRepository implements NotificationRepositoryPort {
  async create(input: CreateNotificationInput): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: input.recipientUserId,
        message: input.message,
        type: input.type,
        group_id: input.groupId,
        read: false,
      })
      .select(NOTIFICATION_FIELDS)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toEntity(data as SupabaseNotificationRow);
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select(NOTIFICATION_FIELDS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data as SupabaseNotificationRow[]).map(toEntity);
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select(NOTIFICATION_FIELDS)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toEntity(data as SupabaseNotificationRow);
  }

  async findById(notificationId: string): Promise<Notification | null> {
    const { data, error } = await supabase
      .from('notifications')
      .select(NOTIFICATION_FIELDS)
      .eq('id', notificationId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toEntity(data as SupabaseNotificationRow) : null;
  }
}
