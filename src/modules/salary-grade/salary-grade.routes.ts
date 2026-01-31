import { Router } from 'express';
import { SalaryGradeController } from './salary-grade.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new SalaryGradeController();

router.use(authenticate);

// POST /api/v1/salary-grades/seed - Seed default grades
router.post('/seed', authorize(['Super Admin']), (req, res) => controller.seedDefaults(req, res));

// GET /api/v1/salary-grades/analysis - Salary range analysis
router.get('/analysis', authorize(['Super Admin', 'HR Manager', 'Finance Manager']), (req, res) => controller.getSalaryRangeAnalysis(req, res));

// GET /api/v1/salary-grades/code/:code - Get by code
router.get('/code/:code', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Finance Manager']), (req, res) => controller.getByCode(req, res));

// GET /api/v1/salary-grades/:id/employees - Get employees by grade
router.get('/:id/employees', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => controller.getEmployeesByGrade(req, res));

// POST /api/v1/salary-grades/:id/assign - Assign employee to grade
router.post('/:id/assign', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.assignEmployeeToGrade(req, res));

// CRUD
router.get('/', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Finance Manager']), (req, res) => controller.list(req, res));
router.post('/', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.create(req, res));
router.get('/:id', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Finance Manager']), (req, res) => controller.getById(req, res));
router.put('/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.update(req, res));
router.delete('/:id', authorize(['Super Admin']), (req, res) => controller.delete(req, res));

export default router;
