import { Router } from 'express';
import { DocumentCategoryController } from './document-category.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new DocumentCategoryController();

// All routes require authentication
router.use(authenticate);

// ==========================================
// READ ROUTES
// ==========================================

// GET /api/v1/document-categories - List all categories
router.get('/', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.list(req, res));

// GET /api/v1/document-categories/root - Get root categories
router.get('/root', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.getRootCategories(req, res));

// GET /api/v1/document-categories/tree - Get category tree
router.get('/tree', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.getTree(req, res));

// GET /api/v1/document-categories/statistics - Get statistics
router.get('/statistics', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => controller.getStatistics(req, res));

// GET /api/v1/document-categories/code/:code - Get by code
router.get('/code/:code', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.getByCode(req, res));

// GET /api/v1/document-categories/:id - Get by ID
router.get('/:id', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.getById(req, res));

// ==========================================
// CRUD ROUTES
// ==========================================

// POST /api/v1/document-categories - Create category
router.post('/', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.create(req, res));

// POST /api/v1/document-categories/seed-defaults - Seed default categories
router.post('/seed-defaults', authorize(['Super Admin']), (req, res) => controller.seedDefaults(req, res));

// POST /api/v1/document-categories/reorder - Reorder categories
router.post('/reorder', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.reorder(req, res));

// PUT /api/v1/document-categories/:id - Update category
router.put('/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.update(req, res));

// DELETE /api/v1/document-categories/:id - Delete category
router.delete('/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.delete(req, res));

export default router;
