import { Router } from 'express';
import { KpiController } from './kpi.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new KpiController();

// All routes require authentication
router.use(authenticate);

// ==========================================
// READ ROUTES
// ==========================================

// GET /api/v1/kpis - List all KPIs
router.get('/', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.list(req, res));

// GET /api/v1/kpis/statistics - Get KPI statistics
router.get('/statistics', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => controller.getStatistics(req, res));

// GET /api/v1/kpis/code/:code - Get KPI by code
router.get('/code/:code', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.getByCode(req, res));

// GET /api/v1/kpis/department/:departmentId - Get KPIs by department
router.get('/department/:departmentId', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.getByDepartment(req, res));

// GET /api/v1/kpis/position/:positionId - Get KPIs by position
router.get('/position/:positionId', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.getByPosition(req, res));

// GET /api/v1/kpis/category/:category - Get KPIs by category
router.get('/category/:category', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.getByCategory(req, res));

// GET /api/v1/kpis/:id - Get KPI by ID
router.get('/:id', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.getById(req, res));

// ==========================================
// CRUD ROUTES
// ==========================================

// POST /api/v1/kpis - Create KPI
router.post('/', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.create(req, res));

// POST /api/v1/kpis/seed-defaults - Seed default KPIs
router.post('/seed-defaults', authorize(['Super Admin']), (req, res) => controller.seedDefaults(req, res));

// PUT /api/v1/kpis/:id - Update KPI
router.put('/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.update(req, res));

// DELETE /api/v1/kpis/:id - Delete KPI
router.delete('/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.delete(req, res));

// ==========================================
// ASSIGNMENT ROUTES
// ==========================================

// POST /api/v1/kpis/:id/assign-department - Assign KPI to department
router.post('/:id/assign-department', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.assignToDepartment(req, res));

// POST /api/v1/kpis/:id/assign-position - Assign KPI to position
router.post('/:id/assign-position', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.assignToPosition(req, res));

export default router;
