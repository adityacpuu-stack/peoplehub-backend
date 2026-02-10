import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import * as notificationController from './notification.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/notifications - Get my notifications
router.get('/', notificationController.getMyNotifications);

// GET /api/v1/notifications/unread-count - Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// GET /api/v1/notifications/announcement-popups - Get unread announcements for popup
router.get('/announcement-popups', notificationController.getAnnouncementPopups);

// POST /api/v1/notifications/announcement-popups/dismiss-all - Dismiss all announcement popups
router.post('/announcement-popups/dismiss-all', notificationController.dismissAllAnnouncementPopups);

// POST /api/v1/notifications/announcement-popups/:id/dismiss - Dismiss single announcement popup
router.post('/announcement-popups/:id/dismiss', notificationController.dismissAnnouncementPopup);

// POST /api/v1/notifications/mark-all-read - Mark all as read
router.post('/mark-all-read', notificationController.markAllAsRead);

// POST /api/v1/notifications/:id/read - Mark as read
router.post('/:id/read', notificationController.markAsRead);

// DELETE /api/v1/notifications/read - Delete all read notifications
router.delete('/read', notificationController.deleteAllRead);

// DELETE /api/v1/notifications/:id - Delete notification
router.delete('/:id', notificationController.deleteNotification);

export default router;
