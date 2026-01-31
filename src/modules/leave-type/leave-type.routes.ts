import { Router } from 'express';
import { LeaveTypeController } from './leave-type.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const leaveTypeController = new LeaveTypeController();

// All routes require authentication
router.use(authenticate);

// ==========================================
// LEAVE TYPE ROUTES
// ==========================================

// GET /api/v1/leave-types - List leave types
router.get('/', (req, res) => leaveTypeController.listLeaveTypes(req, res));

// POST /api/v1/leave-types/seed - Seed default leave types
router.post('/seed', authorize(['Super Admin', 'HR Manager']), (req, res) => leaveTypeController.seedDefaultLeaveTypes(req, res));

// GET /api/v1/leave-types/:id - Get by ID
router.get('/:id', (req, res) => leaveTypeController.getLeaveTypeById(req, res));

// POST /api/v1/leave-types - Create leave type
router.post('/', authorize(['Super Admin', 'HR Manager']), (req, res) => leaveTypeController.createLeaveType(req, res));

// PUT /api/v1/leave-types/:id - Update leave type
router.put('/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => leaveTypeController.updateLeaveType(req, res));

// DELETE /api/v1/leave-types/:id - Delete leave type
router.delete('/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => leaveTypeController.deleteLeaveType(req, res));

// ==========================================
// LEAVE ENTITLEMENT ROUTES
// ==========================================

// GET /api/v1/leave-types/entitlements - List entitlements
router.get('/entitlements/list', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => leaveTypeController.listLeaveEntitlements(req, res));

// GET /api/v1/leave-types/entitlements/:id - Get entitlement by ID
router.get('/entitlements/:id', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => leaveTypeController.getLeaveEntitlementById(req, res));

// POST /api/v1/leave-types/entitlements - Create entitlement
router.post('/entitlements', authorize(['Super Admin', 'HR Manager']), (req, res) => leaveTypeController.createLeaveEntitlement(req, res));

// PUT /api/v1/leave-types/entitlements/:id - Update entitlement
router.put('/entitlements/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => leaveTypeController.updateLeaveEntitlement(req, res));

// DELETE /api/v1/leave-types/entitlements/:id - Delete entitlement
router.delete('/entitlements/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => leaveTypeController.deleteLeaveEntitlement(req, res));

// ==========================================
// EMPLOYEE LEAVE BALANCE ROUTES
// ==========================================

// GET /api/v1/leave-types/balances - List balances
router.get('/balances/list', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => leaveTypeController.getEmployeeLeaveBalances(req, res));

// GET /api/v1/leave-types/balances/:employeeId/:leaveTypeId/:year - Get specific balance
router.get('/balances/:employeeId/:leaveTypeId/:year', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => leaveTypeController.getEmployeeBalanceByType(req, res));

// POST /api/v1/leave-types/balances - Create balance
router.post('/balances', authorize(['Super Admin', 'HR Manager']), (req, res) => leaveTypeController.createEmployeeLeaveBalance(req, res));

// PUT /api/v1/leave-types/balances/:employeeId/:leaveTypeId/:year - Update balance
router.put('/balances/:employeeId/:leaveTypeId/:year', authorize(['Super Admin', 'HR Manager']), (req, res) => leaveTypeController.updateEmployeeLeaveBalance(req, res));

// POST /api/v1/leave-types/balances/:employeeId/:leaveTypeId/:year/adjust - Adjust balance
router.post('/balances/:employeeId/:leaveTypeId/:year/adjust', authorize(['Super Admin', 'HR Manager']), (req, res) => leaveTypeController.adjustLeaveBalance(req, res));

// POST /api/v1/leave-types/balances/:employeeId/initialize - Initialize employee balances
router.post('/balances/:employeeId/initialize', authorize(['Super Admin', 'HR Manager']), (req, res) => leaveTypeController.initializeEmployeeBalances(req, res));

// POST /api/v1/leave-types/balances/:employeeId/carry-forward - Carry forward balances
router.post('/balances/:employeeId/carry-forward', authorize(['Super Admin', 'HR Manager']), (req, res) => leaveTypeController.carryForwardBalances(req, res));

export default router;
