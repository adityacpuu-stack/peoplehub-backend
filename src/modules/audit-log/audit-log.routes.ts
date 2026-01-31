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
router.get('/my', (req, res) => controller.getMyActivity(req, res));

// ==========================================
// READ ROUTES
// ==========================================

// GET /api/v1/audit-logs - List all logs
router.get('/', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.list(req, res));

// GET /api/v1/audit-logs/recent - Get recent activity
router.get('/recent', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.getRecentActivity(req, res));

// GET /api/v1/audit-logs/statistics - Get statistics
router.get('/statistics', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.getStatistics(req, res));

// GET /api/v1/audit-logs/export - Export logs
router.get('/export', authorize(['Super Admin']), (req, res) => controller.export(req, res));

// GET /api/v1/audit-logs/model/:model/:modelId - Get logs by model
router.get('/model/:model/:modelId', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.getByModel(req, res));

// GET /api/v1/audit-logs/user/:userId - Get logs by user
router.get('/user/:userId', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.getByUser(req, res));

// GET /api/v1/audit-logs/:id - Get by ID
router.get('/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.getById(req, res));

// ==========================================
// MAINTENANCE ROUTES
// ==========================================

// POST /api/v1/audit-logs/cleanup - Cleanup old logs
router.post('/cleanup', authorize(['Super Admin']), (req, res) => controller.cleanup(req, res));

export default router;
