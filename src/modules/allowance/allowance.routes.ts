import { Router } from 'express';
import { AllowanceController } from './allowance.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const allowanceController = new AllowanceController();

// All routes require authentication
router.use(authenticate);

// ==========================================
// SELF-SERVICE ROUTES (Employee)
// ==========================================

// GET /api/v1/allowances/me - Get my allowances
router.get('/me', (req, res) => allowanceController.getMyAllowances(req, res));

// GET /api/v1/allowances/me/calculate - Calculate my allowances
router.get('/me/calculate', (req, res) => allowanceController.calculateMyAllowances(req, res));

// ==========================================
// EMPLOYEE ALLOWANCES ROUTES
// ==========================================

// GET /api/v1/allowances/employee/:employeeId - Get employee's allowances
router.get('/employee/:employeeId', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Finance Manager']), (req, res) => allowanceController.getByEmployeeId(req, res));

// GET /api/v1/allowances/employee/:employeeId/calculate - Calculate employee allowances
router.get('/employee/:employeeId/calculate', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Finance Manager']), (req, res) => allowanceController.calculateEmployeeAllowances(req, res));

// ==========================================
// COMPANY TEMPLATE ROUTES
// ==========================================

// GET /api/v1/allowances/company/:companyId/templates - Get company allowance templates
router.get('/company/:companyId/templates', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => allowanceController.getCompanyAllowances(req, res));

// POST /api/v1/allowances/company/:companyId/templates - Create company allowance template
router.post('/company/:companyId/templates', authorize(['Super Admin', 'HR Manager']), (req, res) => allowanceController.createCompanyAllowance(req, res));

// POST /api/v1/allowances/company/:companyId/templates/seed - Seed default templates
router.post('/company/:companyId/templates/seed', authorize(['Super Admin']), (req, res) => allowanceController.seedDefaultTemplates(req, res));

// POST /api/v1/allowances/templates/:id/apply - Apply template to employees
router.post('/templates/:id/apply', authorize(['Super Admin', 'HR Manager']), (req, res) => allowanceController.applyCompanyAllowanceToEmployees(req, res));

// ==========================================
// BULK OPERATIONS
// ==========================================

// POST /api/v1/allowances/bulk - Bulk create allowances
router.post('/bulk', authorize(['Super Admin', 'HR Manager']), (req, res) => allowanceController.bulkCreate(req, res));

// DELETE /api/v1/allowances/bulk - Bulk delete allowances
router.delete('/bulk', authorize(['Super Admin', 'HR Manager']), (req, res) => allowanceController.bulkDelete(req, res));

// PATCH /api/v1/allowances/bulk/status - Bulk update status
router.patch('/bulk/status', authorize(['Super Admin', 'HR Manager']), (req, res) => allowanceController.bulkUpdateStatus(req, res));

// ==========================================
// APPROVAL ROUTES
// ==========================================

// POST /api/v1/allowances/:id/approve - Approve allowance
router.post('/:id/approve', authorize(['Super Admin', 'HR Manager', 'Finance Manager']), (req, res) => allowanceController.approve(req, res));

// POST /api/v1/allowances/:id/reject - Reject allowance
router.post('/:id/reject', authorize(['Super Admin', 'HR Manager', 'Finance Manager']), (req, res) => allowanceController.reject(req, res));

// ==========================================
// STATISTICS
// ==========================================

// GET /api/v1/allowances/statistics - Get allowance statistics
router.get('/statistics', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Finance Manager']), (req, res) => allowanceController.getStatistics(req, res));

// ==========================================
// CRUD ROUTES
// ==========================================

// GET /api/v1/allowances - List all allowances
router.get('/', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Finance Manager']), (req, res) => allowanceController.list(req, res));

// POST /api/v1/allowances - Create allowance
router.post('/', authorize(['Super Admin', 'HR Manager']), (req, res) => allowanceController.create(req, res));

// GET /api/v1/allowances/:id - Get allowance by ID
router.get('/:id', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Finance Manager']), (req, res) => allowanceController.getById(req, res));

// PUT /api/v1/allowances/:id - Update allowance
router.put('/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => allowanceController.update(req, res));

// DELETE /api/v1/allowances/:id - Soft delete allowance
router.delete('/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => allowanceController.delete(req, res));

// DELETE /api/v1/allowances/:id/permanent - Hard delete allowance
router.delete('/:id/permanent', authorize(['Super Admin']), (req, res) => allowanceController.hardDelete(req, res));

export default router;
