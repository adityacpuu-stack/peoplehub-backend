import { Router } from 'express';
import { PayrollAdjustmentController } from './payroll-adjustment.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new PayrollAdjustmentController();

router.use(authenticate);

// GET /api/v1/payroll-adjustments/pending - Get pending approvals
router.get('/pending', authorize(['Super Admin', 'HR Manager', 'Finance Manager']), (req, res) => controller.getPendingApprovals(req, res));

// GET /api/v1/payroll-adjustments/statistics - Get statistics
router.get('/statistics', authorize(['Super Admin', 'HR Manager', 'Finance Manager']), (req, res) => controller.getStatistics(req, res));

// GET /api/v1/payroll-adjustments/employee/:employeeId - Get by employee
router.get('/employee/:employeeId', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Finance Manager']), (req, res) => controller.getByEmployeeId(req, res));

// Bulk operations
router.post('/bulk', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.bulkCreate(req, res));
router.post('/bulk/approve', authorize(['Super Admin', 'HR Manager', 'Finance Manager']), (req, res) => controller.bulkApprove(req, res));

// Approval
router.post('/:id/approve', authorize(['Super Admin', 'HR Manager', 'Finance Manager']), (req, res) => controller.approve(req, res));
router.post('/:id/reject', authorize(['Super Admin', 'HR Manager', 'Finance Manager']), (req, res) => controller.reject(req, res));

// CRUD
router.get('/', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Finance Manager']), (req, res) => controller.list(req, res));
router.post('/', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => controller.create(req, res));
router.get('/:id', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Finance Manager']), (req, res) => controller.getById(req, res));
router.put('/:id', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => controller.update(req, res));
router.delete('/:id', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => controller.delete(req, res));

export default router;
