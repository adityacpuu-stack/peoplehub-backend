import { PrismaClient, Prisma } from '@prisma/client';
import { CreateNotificationDTO, NotificationListQuery, NOTIFICATION_SELECT } from './notification.types';
import { AuthUser } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class NotificationService {
  /**
   * Get notifications for the current user
   */
  async getMyNotifications(query: NotificationListQuery, user: AuthUser) {
    const { page = 1, limit = 20, is_read } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      user_id: user.id,
    };

    if (is_read !== undefined) {
      where.is_read = is_read;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        select: NOTIFICATION_SELECT,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { user_id: user.id, is_read: false },
      }),
    ]);

    return {
      data: notifications,
      unread_count: unreadCount,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(user: AuthUser) {
    const count = await prisma.notification.count({
      where: {
        user_id: user.id,
        is_read: false,
      },
    });

    return { unread_count: count };
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: number, user: AuthUser) {
    const notification = await prisma.notification.findFirst({
      where: { id, user_id: user.id },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return prisma.notification.update({
      where: { id },
      data: {
        is_read: true,
        read_at: new Date(),
      },
      select: NOTIFICATION_SELECT,
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(user: AuthUser) {
    await prisma.notification.updateMany({
      where: {
        user_id: user.id,
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    return { message: 'All notifications marked as read' };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: number, user: AuthUser) {
    const notification = await prisma.notification.findFirst({
      where: { id, user_id: user.id },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await prisma.notification.delete({ where: { id } });
    return { message: 'Notification deleted' };
  }

  /**
   * Delete all read notifications
   */
  async deleteAllRead(user: AuthUser) {
    await prisma.notification.deleteMany({
      where: {
        user_id: user.id,
        is_read: true,
      },
    });

    return { message: 'All read notifications deleted' };
  }

  /**
   * Create a notification (internal use)
   */
  async createNotification(data: CreateNotificationDTO) {
    return prisma.notification.create({
      data: {
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || undefined,
        link: data.link,
      },
      select: NOTIFICATION_SELECT,
    });
  }

  /**
   * Create notifications for multiple users (e.g., for announcements)
   */
  async createBulkNotifications(userIds: number[], notification: Omit<CreateNotificationDTO, 'user_id'>) {
    const notifications = userIds.map((user_id) => ({
      user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || Prisma.JsonNull,
      link: notification.link,
    }));

    await prisma.notification.createMany({
      data: notifications,
    });

    return { message: `Notifications sent to ${userIds.length} users` };
  }

  /**
   * Create notifications for all employees in a company
   */
  async notifyCompanyEmployees(companyId: number, notification: Omit<CreateNotificationDTO, 'user_id'>) {
    // Get all user IDs from employees in this company
    const employees = await prisma.employee.findMany({
      where: { company_id: companyId },
      select: { user_id: true },
    });

    const userIds = employees.map((e) => e.user_id);

    if (userIds.length === 0) {
      return { message: 'No employees found in this company' };
    }

    return this.createBulkNotifications(userIds, notification);
  }

  /**
   * Create notifications for all employees across all companies
   */
  async notifyAllEmployees(notification: Omit<CreateNotificationDTO, 'user_id'>) {
    // Get all user IDs from all employees
    const employees = await prisma.employee.findMany({
      select: { user_id: true },
    });

    const userIds = employees.map((e) => e.user_id);

    if (userIds.length === 0) {
      return { message: 'No employees found' };
    }

    return this.createBulkNotifications(userIds, notification);
  }
}
