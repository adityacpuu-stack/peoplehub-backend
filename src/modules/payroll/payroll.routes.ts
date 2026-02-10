import { Router } from 'express';
import * as payrollController from './payroll.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireHRStaffOrHigher, requireHRManagerOrHigher, requireHRStaffOrTaxAccess } from '../../middlewares/role.middleware';
import { validateCompanyAccessFromQuery, validateCompanyAccess } from '../../middlewares/company.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==========================================
// SELF-SERVICE ROUTES (must come before /:id)
// ==========================================

// Get current user's payrolls
router.get('/me', payrollController.getMyPayrolls);

// Get current user's payslip
router.get('/me/:id', payrollController.getMyPayslip);

// ==========================================
// SALARY COMPONENT ROUTES
// ==========================================

// List salary components (HR Staff+ or Tax roles for view)
router.get('/components', requireHRStaffOrTaxAccess, payrollController.listSalaryComponents);

// Create salary component
router.post('/components', requireHRManagerOrHigher, payrollController.createSalaryComponent);

// Update salary component
router.put('/components/:id', requireHRManagerOrHigher, payrollController.updateSalaryComponent);

// Delete salary component
router.delete('/components/:id', requireHRManagerOrHigher, payrollController.deleteSalaryComponent);

// ==========================================
// SALARY GRADE ROUTES
// ==========================================

// List salary grades (HR Staff+ or Tax roles for view)
router.get('/grades', requireHRStaffOrTaxAccess, payrollController.listSalaryGrades);

// Create salary grade
router.post('/grades', requireHRManagerOrHigher, payrollController.createSalaryGrade);

// Update salary grade
router.put('/grades/:id', requireHRManagerOrHigher, payrollController.updateSalaryGrade);

// Delete salary grade
router.delete('/grades/:id', requireHRManagerOrHigher, payrollController.deleteSalaryGrade);

// ==========================================
// PAYROLL ADJUSTMENT ROUTES
// ==========================================

// List adjustments (HR Staff+ or Tax roles for view)
router.get('/adjustments', requireHRStaffOrTaxAccess, validateCompanyAccessFromQuery, payrollController.listAdjustments);

// Create adjustment
router.post('/adjustments', requireHRStaffOrHigher, payrollController.createAdjustment);

// Approve adjustment
router.post('/adjustments/:id/approve', requireHRManagerOrHigher, payrollController.approveAdjustment);

// Reject adjustment
router.post('/adjustments/:id/reject', requireHRManagerOrHigher, payrollController.rejectAdjustment);

// ==========================================
// PAYROLL SETTINGS ROUTES
// ==========================================

// Get payroll settings for company (HR Staff+ or Tax roles for view)
router.get('/settings/:companyId', requireHRStaffOrTaxAccess, validateCompanyAccess, payrollController.getSettings);

// Update payroll settings
router.put('/settings/:companyId', requireHRManagerOrHigher, validateCompanyAccess, payrollController.updateSettings);

// ==========================================
// PAYROLL GENERATION & CALCULATION
// ==========================================

// Generate payroll for company/period
router.post('/generate', requireHRStaffOrHigher, payrollController.generate);

// Calculate payroll (preview without saving)
router.post('/calculate', requireHRStaffOrHigher, payrollController.calculate);

// Export payroll to Excel (company_id is optional - if not provided, exports all accessible companies)
router.get('/export', requireHRStaffOrTaxAccess, payrollController.exportExcel);

// Export freelance/internship payroll to Excel (exports all accessible companies)
router.get('/export/freelance-internship', requireHRStaffOrTaxAccess, payrollController.exportFreelanceInternship);

// ==========================================
// BULK OPERATIONS
// ==========================================

// Bulk submit payrolls
router.post('/bulk/submit', requireHRStaffOrHigher, payrollController.bulkSubmit);

// Bulk approve payrolls
router.post('/bulk/approve', requireHRManagerOrHigher, payrollController.bulkApprove);

// Bulk reject payrolls
router.post('/bulk/reject', requireHRManagerOrHigher, payrollController.bulkReject);

// ==========================================
// PAYROLL MANAGEMENT ROUTES
// ==========================================

// List all payrolls (HR Staff+ or Tax roles)
router.get('/', requireHRStaffOrTaxAccess, validateCompanyAccessFromQuery, payrollController.list);

// Get payroll by ID (HR Staff+ or Tax roles)
router.get('/:id', requireHRStaffOrTaxAccess, payrollController.getById);

// Update payroll
router.put('/:id', requireHRStaffOrHigher, payrollController.update);

// Validate payroll
router.post('/:id/validate', requireHRStaffOrHigher, payrollController.validate);

// Submit payroll for approval
router.post('/:id/submit', requireHRStaffOrHigher, payrollController.submit);

// Approve payroll
router.post('/:id/approve', requireHRManagerOrHigher, payrollController.approve);

// Reject payroll
router.post('/:id/reject', requireHRManagerOrHigher, payrollController.reject);

// Mark payroll as paid
router.post('/:id/paid', requireHRManagerOrHigher, payrollController.markAsPaid);

export default router;
