import { Router } from 'express';
import { EmployeeMovementController } from './employee-movement.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new EmployeeMovementController();

router.use(authenticate);

// GET /api/v1/employee-movements/pending - Get pending approvals
router.get('/pending', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.getPendingApprovals(req, res));

// GET /api/v1/employee-movements/ready-to-apply - Get approved movements ready to apply
router.get('/ready-to-apply', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.getApprovedPendingApplication(req, res));

// GET /api/v1/employee-movements/statistics - Get statistics
router.get('/statistics', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.getStatistics(req, res));

// GET /api/v1/employee-movements/employee/:employeeId - Get by employee
router.get('/employee/:employeeId', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => controller.getByEmployeeId(req, res));

// Approval & Application
router.post('/:id/approve', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.approve(req, res));
router.post('/:id/reject', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.reject(req, res));
router.post('/:id/apply', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.apply(req, res));

// CRUD
router.get('/', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => controller.list(req, res));
router.post('/', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.create(req, res));
router.get('/:id', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => controller.getById(req, res));
router.put('/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.update(req, res));
router.delete('/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.delete(req, res));

export default router;
