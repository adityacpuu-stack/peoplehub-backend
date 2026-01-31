import { Router } from 'express';
import { SalaryComponentController } from './salary-component.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new SalaryComponentController();

router.use(authenticate);

// GET /api/v1/salary-components/earnings - Get earning components
router.get('/earnings', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Finance Manager']), (req, res) => controller.getEarnings(req, res));

// GET /api/v1/salary-components/deductions - Get deduction components
router.get('/deductions', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Finance Manager']), (req, res) => controller.getDeductions(req, res));

// POST /api/v1/salary-components/seed - Seed default components
router.post('/seed', authorize(['Super Admin']), (req, res) => controller.seedDefaults(req, res));

// GET /api/v1/salary-components/code/:code - Get by code
router.get('/code/:code', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Finance Manager']), (req, res) => controller.getByCode(req, res));

// CRUD
router.get('/', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Finance Manager']), (req, res) => controller.list(req, res));
router.post('/', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.create(req, res));
router.get('/:id', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Finance Manager']), (req, res) => controller.getById(req, res));
router.put('/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.update(req, res));
router.delete('/:id', authorize(['Super Admin']), (req, res) => controller.delete(req, res));

export default router;
