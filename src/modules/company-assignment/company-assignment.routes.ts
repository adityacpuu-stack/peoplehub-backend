import { Router } from 'express';
import { companyAssignmentController } from './company-assignment.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Self-service route - Get my assignments
router.get('/me', companyAssignmentController.getMyAssignments.bind(companyAssignmentController));

// List assignments (HR Manager+)
router.get('/', authorize(['Super Admin', 'HR Manager']), companyAssignmentController.list.bind(companyAssignmentController));

// Get available employees for a company (HR Manager+)
router.get('/available-employees/:companyId', authorize(['Super Admin', 'HR Manager']), companyAssignmentController.getAvailableEmployees.bind(companyAssignmentController));

// Get assignments by employee (HR Manager+)
router.get('/employee/:employeeId', authorize(['Super Admin', 'HR Manager']), companyAssignmentController.getByEmployeeId.bind(companyAssignmentController));

// Get assignment by ID (HR Manager+)
router.get('/:id', authorize(['Super Admin', 'HR Manager']), companyAssignmentController.getById.bind(companyAssignmentController));

// Create assignment (Super Admin only)
router.post('/', authorize(['Super Admin']), companyAssignmentController.create.bind(companyAssignmentController));

// Bulk assign (Super Admin only)
router.post('/bulk', authorize(['Super Admin']), companyAssignmentController.bulkAssign.bind(companyAssignmentController));

// Update assignment (Super Admin only)
router.put('/:id', authorize(['Super Admin']), companyAssignmentController.update.bind(companyAssignmentController));

// Delete assignment (Super Admin only)
router.delete('/:id', authorize(['Super Admin']), companyAssignmentController.delete.bind(companyAssignmentController));

export default router;
