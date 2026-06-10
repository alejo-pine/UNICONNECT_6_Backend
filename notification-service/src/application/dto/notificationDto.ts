export interface CreateNotificationDto {
  recipientUserId: string;
  title: string;
  message: string;
  type: string;
  groupId?: string;
  emailHtml?: string;
}

export interface NotificationResponseDto {
  id: string;
  recipientUserId: string;
  title: string;
  message: string;
  type: string;
  groupId?: string;
  read: boolean;
  createdAt: string;
}

export interface GetUserNotificationsDto {
  userId: string;
}

export interface MarkAsReadDto {
  notificationId: string;
}
