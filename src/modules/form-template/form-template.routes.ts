import { Router } from 'express';
import { FormTemplateController } from './form-template.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new FormTemplateController();

// All routes require authentication
router.use(authenticate);

// ==========================================
// READ ROUTES
// ==========================================

// GET /api/v1/form-templates - List all templates
router.get('/', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.list(req, res));

// GET /api/v1/form-templates/statistics - Get statistics
router.get('/statistics', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => controller.getStatistics(req, res));

// GET /api/v1/form-templates/code/:code - Get by code
router.get('/code/:code', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.getByCode(req, res));

// GET /api/v1/form-templates/type/:type - Get by type
router.get('/type/:type', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.getByType(req, res));

// GET /api/v1/form-templates/category/:category - Get by category
router.get('/category/:category', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.getByCategory(req, res));

// GET /api/v1/form-templates/:id - Get by ID
router.get('/:id', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.getById(req, res));

// ==========================================
// CRUD ROUTES
// ==========================================

// POST /api/v1/form-templates - Create template
router.post('/', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.create(req, res));

// POST /api/v1/form-templates/seed-defaults - Seed default templates
router.post('/seed-defaults', authorize(['Super Admin']), (req, res) => controller.seedDefaults(req, res));

// PUT /api/v1/form-templates/:id - Update template
router.put('/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.update(req, res));

// DELETE /api/v1/form-templates/:id - Delete template
router.delete('/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.delete(req, res));

// ==========================================
// ACTION ROUTES
// ==========================================

// POST /api/v1/form-templates/:id/duplicate - Duplicate template
router.post('/:id/duplicate', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.duplicate(req, res));

// POST /api/v1/form-templates/:id/render - Render template with data
router.post('/:id/render', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.render(req, res));

export default router;
