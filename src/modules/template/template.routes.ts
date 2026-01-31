import { Router } from 'express';
import { TemplateController } from './template.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new TemplateController();

// All routes require authentication
router.use(authenticate);

// ==========================================
// READ ROUTES
// ==========================================

// GET /api/v1/templates - List all templates
router.get('/', authorize(['Super Admin', 'Group CEO', 'HR Manager', 'HR Staff', 'Manager', 'Employee']), (req, res) => controller.list(req, res));

// GET /api/v1/templates/statistics - Get statistics
router.get('/statistics', authorize(['Super Admin', 'Group CEO', 'HR Manager', 'HR Staff', 'Manager', 'Employee']), (req, res) => controller.getStatistics(req, res));

// GET /api/v1/templates/company/:companyId - Get by company
router.get('/company/:companyId', authorize(['Super Admin', 'Group CEO', 'HR Manager', 'HR Staff', 'Manager', 'Employee']), (req, res) => controller.getByCompany(req, res));

// GET /api/v1/templates/category/:category - Get by category
router.get('/category/:category', authorize(['Super Admin', 'Group CEO', 'HR Manager', 'HR Staff', 'Manager', 'Employee']), (req, res) => controller.getByCategory(req, res));

// GET /api/v1/templates/:id - Get by ID
router.get('/:id', authorize(['Super Admin', 'Group CEO', 'HR Manager', 'HR Staff', 'Manager', 'Employee']), (req, res) => controller.getById(req, res));

// ==========================================
// CRUD ROUTES
// ==========================================

// POST /api/v1/templates - Create template
router.post('/', authorize(['Super Admin', 'Group CEO', 'HR Manager', 'HR Staff']), (req, res) => controller.create(req, res));

// PUT /api/v1/templates/:id - Update template
router.put('/:id', authorize(['Super Admin', 'Group CEO', 'HR Manager', 'HR Staff']), (req, res) => controller.update(req, res));

// DELETE /api/v1/templates/:id - Delete template
router.delete('/:id', authorize(['Super Admin', 'Group CEO', 'HR Manager']), (req, res) => controller.delete(req, res));

// ==========================================
// ACTION ROUTES
// ==========================================

// POST /api/v1/templates/:id/duplicate - Duplicate template
router.post('/:id/duplicate', authorize(['Super Admin', 'Group CEO', 'HR Manager', 'HR Staff']), (req, res) => controller.duplicate(req, res));

// POST /api/v1/templates/:id/download - Track download
router.post('/:id/download', authorize(['Super Admin', 'Group CEO', 'HR Manager', 'HR Staff', 'Manager', 'Employee']), (req, res) => controller.download(req, res));

export default router;
