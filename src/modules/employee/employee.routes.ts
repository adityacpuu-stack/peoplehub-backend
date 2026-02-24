import { Router } from 'express';
import * as employeeController from './employee.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  requireHRStaffOrHigher,
  requireManagerOrHigher,
  requireSelfEmployeeOrRole,
} from '../../middlewares/role.middleware';
import {
  validateCompanyAccess,
  validateCompanyAccessFromQuery,
} from '../../middlewares/company.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Self-service routes (any authenticated user)
router.get('/me', employeeController.getMyProfile);
router.put('/me', employeeController.updateMyProfile);

// List employees (HR Staff+ or Manager for their subordinates)
router.get('/', requireManagerOrHigher, validateCompanyAccessFromQuery, employeeController.list);

// Export employees to Excel (HR Staff+)
router.get('/export', requireHRStaffOrHigher, employeeController.exportExcel);

// Get employee by employee_id (NIK)
router.get(
  '/by-employee-id/:employeeId',
  requireHRStaffOrHigher,
  employeeController.getByEmployeeId
);

// Get employees by company
router.get(
  '/company/:companyId',
  requireHRStaffOrHigher,
  validateCompanyAccess,
  employeeController.getByCompany
);

// Get employees by department
router.get(
  '/department/:departmentId',
  requireManagerOrHigher,
  employeeController.getByDepartment
);

// Get subordinates of a manager
router.get(
  '/:id/subordinates',
  requireManagerOrHigher,
  employeeController.getSubordinates
);

// Get next employee ID for a company
router.get(
  '/next-id/:companyId',
  requireHRStaffOrHigher,
  employeeController.getNextEmployeeId
);

// Get leadership team - employees who have direct reports (CEO+)
router.get(
  '/leadership-team',
  requireManagerOrHigher,
  employeeController.getLeadershipTeam
);

// Get single employee - self or HR Staff+
router.get(
  '/:id',
  requireSelfEmployeeOrRole('Super Admin', 'Group CEO', 'CEO', 'HR Manager', 'HR Staff', 'Manager'),
  employeeController.getById
);

// Create employee (HR Staff+)
router.post('/', requireHRStaffOrHigher, employeeController.create);

// Update employee (HR Staff+)
router.put('/:id', requireHRStaffOrHigher, employeeController.update);

// Delete employee (HR Manager+)
router.delete('/:id', requireHRStaffOrHigher, employeeController.remove);

export default router;
