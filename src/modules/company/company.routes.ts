import { Router } from 'express';
import { CompanyController } from './company.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new CompanyController();

// All routes require authentication
router.use(authenticate);

// List & Hierarchy
router.get('/', controller.list.bind(controller));
router.get('/hierarchy', controller.getHierarchy.bind(controller));

// Feature Toggles (Super Admin Only) - Must be before /:id routes
router.get('/feature-toggles/all', authorize(['Super Admin', 'Group CEO']), controller.listWithFeatureToggles.bind(controller));

// CRUD
router.get('/:id', controller.getById.bind(controller));
router.post('/', authorize(['Super Admin', 'Group CEO', 'CEO']), controller.create.bind(controller));
router.put('/:id', authorize(['Super Admin', 'Group CEO', 'CEO', 'HR Manager']), controller.update.bind(controller));
router.delete('/:id', authorize(['Super Admin']), controller.delete.bind(controller));

// Statistics & Settings
router.get('/:id/statistics', controller.getStatistics.bind(controller));
router.get('/:id/settings', controller.getSettings.bind(controller));
router.put('/:id/settings', authorize(['Super Admin', 'Group CEO', 'CEO', 'HR Manager']), controller.updateSettings.bind(controller));

// Feature Toggles per company
router.get('/:id/feature-toggles', authorize(['Super Admin', 'Group CEO']), controller.getFeatureToggles.bind(controller));
router.put('/:id/feature-toggles', authorize(['Super Admin', 'Group CEO']), controller.updateFeatureToggles.bind(controller));

export default router;
