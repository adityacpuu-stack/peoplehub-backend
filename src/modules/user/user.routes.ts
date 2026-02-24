import { Router } from 'express';
import * as userController from './user.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Self-service routes
router.get('/me/preferences', userController.getMyPreferences);
router.put('/me/preferences', userController.updateMyPreferences);

// Admin routes
router.get('/stats', authorize(['Super Admin', 'HR Manager']), userController.getStats);
router.get('/', authorize(['Super Admin', 'HR Manager']), userController.list);
router.get('/:id', authorize(['Super Admin', 'HR Manager']), userController.getById);
router.post('/', authorize(['Super Admin', 'HR Manager']), userController.create);
router.put('/:id', authorize(['Super Admin', 'HR Manager']), userController.update);
router.patch('/:id/toggle-status', authorize(['Super Admin', 'HR Manager']), userController.toggleStatus);
router.delete('/:id', authorize(['Super Admin', 'HR Manager']), userController.remove);

export default router;
