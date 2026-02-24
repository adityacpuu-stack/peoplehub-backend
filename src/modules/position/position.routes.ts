import { Router } from 'express';
import * as positionController from './position.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireHRStaffOrHigher, requireManagerOrHigher } from '../../middlewares/role.middleware';
import { validateCompanyAccess, validateCompanyAccessFromQuery } from '../../middlewares/company.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List positions (Manager+ for their company)
router.get('/', requireManagerOrHigher, validateCompanyAccessFromQuery, positionController.list);

// Get positions by company
router.get(
  '/company/:companyId',
  requireManagerOrHigher,
  validateCompanyAccess,
  positionController.getByCompany
);

// Get positions by department
router.get(
  '/department/:departmentId',
  requireManagerOrHigher,
  positionController.getByDepartment
);

// Get single position
router.get('/:id', requireManagerOrHigher, positionController.getById);

// Create position (HR Staff+)
router.post('/', requireHRStaffOrHigher, positionController.create);

// Update position (HR Staff+)
router.put('/:id', requireHRStaffOrHigher, positionController.update);

// Delete position (HR Staff+)
router.delete('/:id', requireHRStaffOrHigher, positionController.remove);

export default router;
