import { Router } from 'express';
import { SettingController } from './setting.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new SettingController();

// Public routes (no auth required)
router.get('/public', controller.getPublicSettings.bind(controller));
router.get('/maintenance', controller.getMaintenanceStatus.bind(controller));

// All other routes require authentication
router.use(authenticate);

// Setting groups
router.get('/groups', controller.getSettingGroups.bind(controller));

// Settings list & CRUD
router.get('/', controller.listSettings.bind(controller));
router.get('/group/:group', controller.getSettingsByGroup.bind(controller));
router.get('/key/:key', controller.getSetting.bind(controller));

// Admin only routes
router.post('/', authorize(['Super Admin']), controller.createSetting.bind(controller));
router.put('/key/:key', authorize(['Super Admin', 'HR Manager']), controller.updateSetting.bind(controller));
router.put('/bulk', authorize(['Super Admin', 'HR Manager']), controller.bulkUpdateSettings.bind(controller));
router.delete('/key/:key', authorize(['Super Admin']), controller.deleteSetting.bind(controller));

// System settings (Super Admin only)
router.get('/system', authorize(['Super Admin']), controller.listSystemSettings.bind(controller));
router.get('/system/:key', authorize(['Super Admin']), controller.getSystemSetting.bind(controller));
router.put('/system/:key', authorize(['Super Admin']), controller.updateSystemSetting.bind(controller));

// Seed & Utilities
router.post('/seed', authorize(['Super Admin']), controller.seedDefaultSettings.bind(controller));
router.put('/maintenance', authorize(['Super Admin']), controller.setMaintenanceMode.bind(controller));

export default router;
