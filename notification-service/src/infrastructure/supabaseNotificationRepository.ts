import supabase from '../utils/supabaseClient';
import { Notification, CreateNotificationInput, NotificationType } from '../domain/entities/notification';
import { NotificationRepositoryPort } from '../domain/ports/notificationRepositoryPort';

interface SupabaseNotificationRow {
  id: string;
  recipient_user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

const NOTIFICATION_FIELDS = 'id, recipient_user_id, title, message, type, read, created_at';

const toEntity = (row: SupabaseNotificationRow): Notification => ({
  id: row.id,
  recipientUserId: row.recipient_user_id,
  title: row.title,
  message: row.message,
  type: row.type as NotificationType,
  read: row.read,
  createdAt: new Date(row.created_at),
});

export class SupabaseNotificationRepository implements NotificationRepositoryPort {
  async create(input: CreateNotificationInput): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        recipient_user_id: input.recipientUserId,
        title: input.title,
        message: input.message,
        type: input.type,
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
      .eq('recipient_user_id', userId)
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
