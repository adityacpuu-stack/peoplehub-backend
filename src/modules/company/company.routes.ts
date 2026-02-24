import { Router } from 'express';
import * as companyController from './company.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validateBody, validateQuery } from '../../middlewares/validate.middleware';
import { createCompanySchema, updateCompanySchema, listCompanyQuerySchema, updateFeatureTogglesSchema } from '../../validations/company.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List & Hierarchy
router.get('/', validateQuery(listCompanyQuerySchema), companyController.list);
router.get('/hierarchy', companyController.getHierarchy);

// Feature Toggles (Super Admin Only) - Must be before /:id routes
router.get('/feature-toggles/all', authorize(['Super Admin', 'Group CEO', 'HR Manager', 'HR Staff']), companyController.listWithFeatureToggles);

// CRUD
router.get('/:id', companyController.getById);
router.post('/', authorize(['Super Admin', 'Group CEO', 'CEO']), validateBody(createCompanySchema), companyController.create);
router.put('/:id', authorize(['Super Admin', 'Group CEO', 'CEO', 'HR Manager']), validateBody(updateCompanySchema), companyController.update);
router.delete('/:id', authorize(['Super Admin']), companyController.remove);

// Statistics & Settings
router.get('/:id/statistics', companyController.getStatistics);
router.get('/:id/settings', companyController.getSettings);
router.put('/:id/settings', authorize(['Super Admin', 'Group CEO', 'CEO', 'HR Manager']), companyController.updateSettings);

// Feature Toggles per company
router.get('/:id/feature-toggles', authorize(['Super Admin', 'Group CEO']), companyController.getFeatureToggles);
router.put('/:id/feature-toggles', authorize(['Super Admin', 'Group CEO']), validateBody(updateFeatureTogglesSchema), companyController.updateFeatureToggles);

export default router;
