import { Router } from 'express';
import { AuditLogController } from './audit-log.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new AuditLogController();

// All routes require authentication
router.use(authenticate);

// ==========================================
// SELF-SERVICE ROUTES
// ==========================================

// GET /api/v1/audit-logs/my - Get my activity
router.get('/my', controller.getMyActivity);

// ==========================================
// READ ROUTES
// ==========================================

// GET /api/v1/audit-logs - List all logs
router.get('/', authorize(['Super Admin', 'HR Manager']), controller.list);

// GET /api/v1/audit-logs/recent - Get recent activity
router.get('/recent', authorize(['Super Admin', 'HR Manager']), controller.getRecentActivity);

// GET /api/v1/audit-logs/statistics - Get statistics
router.get('/statistics', authorize(['Super Admin', 'HR Manager']), controller.getStatistics);

// GET /api/v1/audit-logs/export - Export logs
router.get('/export', authorize(['Super Admin']), controller.export);

// GET /api/v1/audit-logs/model/:model/:modelId - Get logs by model
router.get('/model/:model/:modelId', authorize(['Super Admin', 'HR Manager']), controller.getByModel);

// GET /api/v1/audit-logs/user/:userId - Get logs by user
router.get('/user/:userId', authorize(['Super Admin', 'HR Manager']), controller.getByUser);

// GET /api/v1/audit-logs/:id - Get by ID
router.get('/:id', authorize(['Super Admin', 'HR Manager']), controller.getById);

// ==========================================
// MAINTENANCE ROUTES
// ==========================================

// POST /api/v1/audit-logs/cleanup - Cleanup old logs
router.post('/cleanup', authorize(['Super Admin']), controller.cleanup);

export default router;
