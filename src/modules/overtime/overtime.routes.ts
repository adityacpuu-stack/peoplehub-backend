import { Router } from 'express';
import * as overtimeController from './overtime.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireHRStaffOrHigher, requireManagerOrHigher } from '../../middlewares/role.middleware';
import { validateCompanyAccessFromQuery } from '../../middlewares/company.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== SELF-SERVICE ROUTES ====================

// Get current user's overtime requests
router.get('/me', overtimeController.getMyOvertimes);

// Create overtime request for current user
router.post('/', overtimeController.create);

// Cancel own overtime request
router.post('/:id/cancel', overtimeController.cancel);

// ==================== MANAGER ROUTES ====================

// Get pending approvals for manager
router.get('/pending-approvals', requireManagerOrHigher, overtimeController.getPendingApprovals);

// Approve overtime request
router.post('/:id/approve', requireManagerOrHigher, overtimeController.approve);

// Reject overtime request
router.post('/:id/reject', requireManagerOrHigher, overtimeController.reject);

// ==================== HR ROUTES ====================

// List all overtime requests
router.get('/', requireManagerOrHigher, validateCompanyAccessFromQuery, overtimeController.list);

// Create overtime for an employee (HR only)
router.post('/employee', requireHRStaffOrHigher, overtimeController.createForEmployee);

// Get overtime by ID
router.get('/:id', requireManagerOrHigher, overtimeController.getById);

// Update overtime request
router.put('/:id', overtimeController.update);

// Delete overtime (HR only)
router.delete('/:id', requireHRStaffOrHigher, overtimeController.remove);

export default router;
