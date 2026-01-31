import { Router } from 'express';
import { AnnouncementController } from './announcement.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new AnnouncementController();

// All routes require authentication
router.use(authenticate);

// ==========================================
// READ ROUTES
// ==========================================

// GET /api/v1/announcements - List all announcements
router.get('/', authorize(['Super Admin', 'Group CEO', 'CEO', 'HR Manager', 'HR Staff', 'Manager', 'Employee']), (req, res) => controller.list(req, res));

// GET /api/v1/announcements/statistics - Get statistics
router.get('/statistics', authorize(['Super Admin', 'Group CEO', 'CEO', 'HR Manager', 'HR Staff', 'Manager', 'Employee']), (req, res) => controller.getStatistics(req, res));

// GET /api/v1/announcements/published/:companyId - Get published announcements for employees
router.get('/published/:companyId', authorize(['Super Admin', 'Group CEO', 'CEO', 'HR Manager', 'HR Staff', 'Manager', 'Employee']), (req, res) => controller.getPublished(req, res));

// GET /api/v1/announcements/:id - Get by ID
router.get('/:id', authorize(['Super Admin', 'Group CEO', 'CEO', 'HR Manager', 'HR Staff', 'Manager', 'Employee']), (req, res) => controller.getById(req, res));

// ==========================================
// CRUD ROUTES (HR Only)
// ==========================================

// POST /api/v1/announcements - Create announcement
router.post('/', authorize(['Super Admin', 'Group CEO', 'HR Manager', 'HR Staff']), (req, res) => controller.create(req, res));

// PUT /api/v1/announcements/:id - Update announcement
router.put('/:id', authorize(['Super Admin', 'Group CEO', 'HR Manager', 'HR Staff']), (req, res) => controller.update(req, res));

// DELETE /api/v1/announcements/:id - Delete announcement
router.delete('/:id', authorize(['Super Admin', 'Group CEO', 'HR Manager']), (req, res) => controller.delete(req, res));

// ==========================================
// ACTION ROUTES (HR Only)
// ==========================================

// POST /api/v1/announcements/:id/publish - Publish announcement
router.post('/:id/publish', authorize(['Super Admin', 'Group CEO', 'HR Manager', 'HR Staff']), (req, res) => controller.publish(req, res));

// POST /api/v1/announcements/:id/unpublish - Unpublish announcement
router.post('/:id/unpublish', authorize(['Super Admin', 'Group CEO', 'HR Manager', 'HR Staff']), (req, res) => controller.unpublish(req, res));

// POST /api/v1/announcements/:id/toggle-pin - Toggle pin status
router.post('/:id/toggle-pin', authorize(['Super Admin', 'Group CEO', 'HR Manager', 'HR Staff']), (req, res) => controller.togglePin(req, res));

// POST /api/v1/announcements/:id/view - Track view
router.post('/:id/view', authorize(['Super Admin', 'Group CEO', 'CEO', 'HR Manager', 'HR Staff', 'Manager', 'Employee']), (req, res) => controller.trackView(req, res));

export default router;
