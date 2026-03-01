import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validate.middleware';
import {
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from '../../validations/auth.schema';

const router = Router();

// Public routes
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/refresh', validateBody(refreshTokenSchema), authController.refresh);
router.post('/forgot-password', validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, authController.logout);
router.post('/change-password', authenticate, validateBody(changePasswordSchema), authController.changePassword);

export default router;
