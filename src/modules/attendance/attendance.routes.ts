import { Router } from 'express';
import * as attendanceController from './attendance.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireHRStaffOrHigher, requireManagerOrHigher } from '../../middlewares/role.middleware';
import { validateCompanyAccessFromQuery } from '../../middlewares/company.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== SELF-SERVICE ROUTES ====================
// These must come BEFORE parameterized routes like /:id

// Get current user's today attendance
router.get('/me/today', attendanceController.getMyToday);

// Get current user's attendance history
router.get('/me/history', attendanceController.getMyHistory);

// Get current user's attendance summary
router.get('/me/summary', attendanceController.getMySummary);

// Check-in
router.post('/check-in', attendanceController.checkIn);

// Check-out
router.post('/check-out', attendanceController.checkOut);

// Break management
router.post('/break/start', attendanceController.startBreak);
router.post('/break/end', attendanceController.endBreak);

// ==================== MANAGER ROUTES ====================

// Get team attendance (for managers)
router.get('/team', requireManagerOrHigher, attendanceController.getTeamAttendance);

// Get attendance summary for an employee
router.get(
  '/summary/:employeeId',
  requireManagerOrHigher,
  attendanceController.getSummary
);

// ==================== HR ROUTES ====================

// List all attendance records (HR Staff+ or Manager for their team)
router.get('/', requireManagerOrHigher, validateCompanyAccessFromQuery, attendanceController.list);

// Get attendance by ID
router.get('/:id', requireManagerOrHigher, attendanceController.getById);

// Create manual attendance (HR Staff+)
router.post('/', requireHRStaffOrHigher, attendanceController.create);

// Update attendance (HR Staff+)
router.put('/:id', requireHRStaffOrHigher, attendanceController.update);

// Delete attendance (HR Staff+)
router.delete('/:id', requireHRStaffOrHigher, attendanceController.remove);

export default router;
