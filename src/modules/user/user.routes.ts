import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==========================================
// SELF-SERVICE ROUTES (Current user)
// ==========================================

// GET /api/v1/users/me/preferences - Get current user's notification preferences
router.get('/me/preferences', userController.getMyPreferences.bind(userController));

// PUT /api/v1/users/me/preferences - Update current user's notification preferences
router.put('/me/preferences', userController.updateMyPreferences.bind(userController));

// ==========================================
// ADMIN ROUTES
// ==========================================

// Get user statistics
router.get('/stats', authorize(['Super Admin', 'HR Manager']), userController.getStats.bind(userController));

// Get available M365 licenses
router.get('/m365-licenses', authorize(['Super Admin', 'HR Manager']), userController.getM365Licenses.bind(userController));

// List users
router.get('/', authorize(['Super Admin', 'HR Manager']), userController.list.bind(userController));

// Get user by ID
router.get('/:id', authorize(['Super Admin', 'HR Manager']), userController.getById.bind(userController));

// Create user
router.post('/', authorize(['Super Admin', 'HR Manager']), userController.create.bind(userController));

// Update user
router.put('/:id', authorize(['Super Admin', 'HR Manager']), userController.update.bind(userController));

// Send credentials to user
router.post('/:id/send-credentials', authorize(['Super Admin', 'HR Manager']), userController.sendCredentials.bind(userController));

// Toggle user status
router.patch('/:id/toggle-status', authorize(['Super Admin', 'HR Manager']), userController.toggleStatus.bind(userController));

// Delete user
router.delete('/:id', authorize(['Super Admin', 'HR Manager']), userController.delete.bind(userController));

export default router;
