import { Router } from 'express';
import * as departmentController from './department.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireHRStaffOrHigher, requireManagerOrHigher } from '../../middlewares/role.middleware';
import { validateCompanyAccess, validateCompanyAccessFromQuery } from '../../middlewares/company.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List departments (Manager+ for their company)
router.get('/', requireManagerOrHigher, validateCompanyAccessFromQuery, departmentController.list);

// Get departments by company
router.get(
  '/company/:companyId',
  requireManagerOrHigher,
  validateCompanyAccess,
  departmentController.getByCompany
);

// Get department hierarchy by company
router.get(
  '/company/:companyId/hierarchy',
  requireManagerOrHigher,
  validateCompanyAccess,
  departmentController.getHierarchy
);

// Get single department
router.get('/:id', requireManagerOrHigher, departmentController.getById);

// Create department (HR Staff+)
router.post('/', requireHRStaffOrHigher, departmentController.create);

// Update department (HR Staff+)
router.put('/:id', requireHRStaffOrHigher, departmentController.update);

// Delete department (HR Staff+)
router.delete('/:id', requireHRStaffOrHigher, departmentController.remove);

export default router;
