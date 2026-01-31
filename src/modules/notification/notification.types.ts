// ==========================================
// NOTIFICATION TYPES
// ==========================================

export const NOTIFICATION_TYPES = {
  // Announcements
  ANNOUNCEMENT_NEW: 'announcement_new',
  ANNOUNCEMENT_URGENT: 'announcement_urgent',

  // Leave
  LEAVE_REQUEST_SUBMITTED: 'leave_request_submitted',
  LEAVE_REQUEST_APPROVED: 'leave_request_approved',
  LEAVE_REQUEST_REJECTED: 'leave_request_rejected',
  LEAVE_APPROVAL_PENDING: 'leave_approval_pending',

  // Documents
  DOCUMENT_UPLOADED: 'document_uploaded',
  DOCUMENT_VERIFIED: 'document_verified',
  DOCUMENT_EXPIRING: 'document_expiring',

  // General
  SYSTEM: 'system',
  REMINDER: 'reminder',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

export interface CreateNotificationDTO {
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  link?: string;
}

export interface NotificationListQuery {
  page?: number;
  limit?: number;
  is_read?: boolean;
}

export const NOTIFICATION_SELECT = {
  id: true,
  user_id: true,
  type: true,
  title: true,
  message: true,
  data: true,
  link: true,
  is_read: true,
  read_at: true,
  created_at: true,
};
