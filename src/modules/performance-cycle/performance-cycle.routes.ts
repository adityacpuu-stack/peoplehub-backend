import { Router } from 'express';
import { PerformanceCycleController } from './performance-cycle.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new PerformanceCycleController();

// All routes require authentication
router.use(authenticate);

// ==========================================
// READ ROUTES
// ==========================================

// GET /api/v1/performance-cycles - List all cycles
router.get('/', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.list(req, res));

// GET /api/v1/performance-cycles/active - Get active cycles
router.get('/active', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.getActive(req, res));

// GET /api/v1/performance-cycles/statistics - Get statistics
router.get('/statistics', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => controller.getStatistics(req, res));

// GET /api/v1/performance-cycles/year/:year - Get cycles by year
router.get('/year/:year', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.getByYear(req, res));

// GET /api/v1/performance-cycles/:id - Get cycle by ID
router.get('/:id', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.getById(req, res));

// GET /api/v1/performance-cycles/:id/phase - Get current phase
router.get('/:id/phase', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.getCurrentPhase(req, res));

// ==========================================
// CRUD ROUTES
// ==========================================

// POST /api/v1/performance-cycles - Create cycle
router.post('/', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.create(req, res));

// PUT /api/v1/performance-cycles/:id - Update cycle
router.put('/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.update(req, res));

// DELETE /api/v1/performance-cycles/:id - Delete cycle
router.delete('/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.delete(req, res));

// ==========================================
// STATUS TRANSITION ROUTES
// ==========================================

// POST /api/v1/performance-cycles/:id/activate - Activate cycle
router.post('/:id/activate', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.activate(req, res));

// POST /api/v1/performance-cycles/:id/start-review - Start review phase
router.post('/:id/start-review', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.startReview(req, res));

// POST /api/v1/performance-cycles/:id/start-calibration - Start calibration phase
router.post('/:id/start-calibration', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.startCalibration(req, res));

// POST /api/v1/performance-cycles/:id/complete - Complete cycle
router.post('/:id/complete', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.complete(req, res));

export default router;
