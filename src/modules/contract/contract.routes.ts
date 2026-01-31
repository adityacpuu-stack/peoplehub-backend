import { Router } from 'express';
import * as contractController from './contract.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireHRStaffOrHigher, requireHRManagerOrHigher, requireGroupCEOOrHigher } from '../../middlewares/role.middleware';
import { validateCompanyAccessFromQuery } from '../../middlewares/company.middleware';

const router = Router();

router.use(authenticate);

// ==========================================
// SELF-SERVICE ROUTES
// ==========================================

router.get('/me', contractController.getMyContracts);
router.get('/movements/me', contractController.getMyMovements);

// ==========================================
// GROUP CEO / EXECUTIVE ROUTES
// ==========================================

// Get group contract statistics (Group CEO / Super Admin)
router.get('/group/statistics', requireGroupCEOOrHigher, contractController.getGroupContractStatistics);

// ==========================================
// CONTRACT ROUTES
// ==========================================

// Get expiring contracts
router.get('/expiring', requireHRStaffOrHigher, contractController.getExpiringContracts);

// Get active contract for employee
router.get('/employee/:employeeId/active', requireHRStaffOrHigher, contractController.getActiveContract);

// List contracts
router.get('/', requireHRStaffOrHigher, validateCompanyAccessFromQuery, contractController.listContracts);

// Get contract by ID
router.get('/:id', requireHRStaffOrHigher, contractController.getContractById);

// Create contract
router.post('/', requireHRStaffOrHigher, contractController.createContract);

// Update contract
router.put('/:id', requireHRStaffOrHigher, contractController.updateContract);

// Activate contract
router.post('/:id/activate', requireHRStaffOrHigher, contractController.activateContract);

// Renew contract
router.post('/:id/renew', requireHRStaffOrHigher, contractController.renewContract);

// Terminate contract
router.post('/:id/terminate', requireHRManagerOrHigher, contractController.terminateContract);

// ==========================================
// MOVEMENT ROUTES
// ==========================================

// List movements
router.get('/movements', requireHRStaffOrHigher, validateCompanyAccessFromQuery, contractController.listMovements);

// Get movement by ID
router.get('/movements/:id', requireHRStaffOrHigher, contractController.getMovementById);

// Create movement
router.post('/movements', requireHRStaffOrHigher, contractController.createMovement);

// Approve movement
router.post('/movements/:id/approve', requireHRManagerOrHigher, contractController.approveMovement);

// Reject movement
router.post('/movements/:id/reject', requireHRManagerOrHigher, contractController.rejectMovement);

// Apply movement
router.post('/movements/:id/apply', requireHRManagerOrHigher, contractController.applyMovement);

// Delete movement
router.delete('/movements/:id', requireHRStaffOrHigher, contractController.deleteMovement);

export default router;
