import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, authController.logout);
router.post('/change-password', authenticate, authController.changePassword);

export default router;
