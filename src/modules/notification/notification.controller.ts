import { Request, Response } from 'express';
import { NotificationService } from './notification.service';
import { NotificationListQuery } from './notification.types';

const notificationService = new NotificationService();

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

/**
 * Get my notifications
 */
export const getMyNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
      return;
    }

    const query: NotificationListQuery = {
      page: parseInt(getParam(req.query.page as string)) || 1,
      limit: parseInt(getParam(req.query.limit as string)) || 20,
      is_read: req.query.is_read !== undefined ? getParam(req.query.is_read as string) === 'true' : undefined,
    };

    const result = await notificationService.getMyNotifications(query, req.user);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

/**
 * Get unread count
 */
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
      return;
    }

    const result = await notificationService.getUnreadCount(req.user);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: { message: 'Invalid notification ID' } });
      return;
    }

    const notification = await notificationService.markAsRead(id, req.user);
    res.status(200).json({ success: true, data: notification });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, error: { message: error.message } });
  }
};

/**
 * Mark all as read
 */
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
      return;
    }

    const result = await notificationService.markAllAsRead(req.user);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: { message: 'Invalid notification ID' } });
      return;
    }

    const result = await notificationService.deleteNotification(id, req.user);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, error: { message: error.message } });
  }
};

/**
 * Delete all read notifications
 */
export const deleteAllRead = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
      return;
    }

    const result = await notificationService.deleteAllRead(req.user);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
