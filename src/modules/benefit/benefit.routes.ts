import { Router } from 'express';
import { BenefitController } from './benefit.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new BenefitController();

router.use(authenticate);

// POST /api/v1/benefits/seed - Seed default benefits
router.post('/seed', authorize(['Super Admin']), (req, res) => controller.seedDefaults(req, res));

// GET /api/v1/benefits/statistics - Get statistics
router.get('/statistics', authorize(['Super Admin', 'HR Manager', 'Finance Manager']), (req, res) => controller.getStatistics(req, res));

// GET /api/v1/benefits/type/:type - Get by type
router.get('/type/:type', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => controller.getByType(req, res));

// GET /api/v1/benefits/category/:category - Get by category
router.get('/category/:category', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => controller.getByCategory(req, res));

// CRUD
router.get('/', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => controller.list(req, res));
router.post('/', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.create(req, res));
router.get('/:id', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => controller.getById(req, res));
router.put('/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.update(req, res));
router.delete('/:id', authorize(['Super Admin']), (req, res) => controller.delete(req, res));

export default router;
