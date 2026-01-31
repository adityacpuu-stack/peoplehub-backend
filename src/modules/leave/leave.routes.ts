import { Router } from 'express';
import * as leaveController from './leave.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireHRStaffOrHigher, requireManagerOrHigher } from '../../middlewares/role.middleware';
import { validateCompanyAccessFromQuery } from '../../middlewares/company.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==========================================
// LEAVE TYPE ROUTES
// ==========================================

// List leave types (all authenticated users)
router.get('/types', leaveController.listLeaveTypes);

// Get leave type by ID
router.get('/types/:id', leaveController.getLeaveTypeById);

// Create leave type (HR only)
router.post('/types', requireHRStaffOrHigher, leaveController.createLeaveType);

// Update leave type (HR only)
router.put('/types/:id', requireHRStaffOrHigher, leaveController.updateLeaveType);

// Delete leave type (HR only)
router.delete('/types/:id', requireHRStaffOrHigher, leaveController.deleteLeaveType);

// ==========================================
// SELF-SERVICE ROUTES (must come before /:id)
// ==========================================

// Get current user's leaves
router.get('/me', leaveController.getMyLeaves);

// Get current user's leave balances
router.get('/me/balances', leaveController.getMyLeaveBalances);

// Create leave request for current user
router.post('/', leaveController.create);

// Cancel own leave request
router.post('/:id/cancel', leaveController.cancel);

// ==========================================
// MANAGER ROUTES
// ==========================================

// Get pending approvals for manager
router.get('/pending-approvals', requireManagerOrHigher, leaveController.getPendingApprovals);

// Approve leave request
router.post('/:id/approve', requireManagerOrHigher, leaveController.approve);

// Reject leave request
router.post('/:id/reject', requireManagerOrHigher, leaveController.reject);

// ==========================================
// HR ROUTES - Leave Management
// ==========================================

// List all leaves
router.get('/', requireManagerOrHigher, validateCompanyAccessFromQuery, leaveController.listLeaves);

// Create leave for an employee (HR only)
router.post('/employee', requireHRStaffOrHigher, leaveController.createForEmployee);

// Get leave by ID
router.get('/:id', requireManagerOrHigher, leaveController.getLeaveById);

// Update leave request
router.put('/:id', leaveController.update);

// Delete leave (HR only)
router.delete('/:id', requireHRStaffOrHigher, leaveController.remove);

// ==========================================
// HR ROUTES - Leave Balance Management
// ==========================================

// Get leave balances
router.get('/balances/list', requireManagerOrHigher, validateCompanyAccessFromQuery, leaveController.getLeaveBalances);

// Allocate leave to employee (HR only)
router.post('/balances/allocate', requireHRStaffOrHigher, leaveController.allocateLeave);

// Adjust leave balance (HR only)
router.post('/balances/adjust', requireHRStaffOrHigher, leaveController.adjustLeaveBalance);

// ==========================================
// HOLIDAY ROUTES
// ==========================================

// List holidays (all authenticated users)
router.get('/holidays', leaveController.listHolidays);

// Get holiday by ID
router.get('/holidays/:id', leaveController.getHolidayById);

// Create holiday (HR only)
router.post('/holidays', requireHRStaffOrHigher, leaveController.createHoliday);

// Update holiday (HR only)
router.put('/holidays/:id', requireHRStaffOrHigher, leaveController.updateHoliday);

// Delete holiday (HR only)
router.delete('/holidays/:id', requireHRStaffOrHigher, leaveController.deleteHoliday);

export default router;
