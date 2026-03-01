import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { asyncHandler } from '../../middlewares/error.middleware';

const authService = new AuthService();

/**
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;

  const { token, refreshToken, user } = await authService.login(email, password, ipAddress);

  res.json({
    success: true,
    message: 'Login successful',
    data: { token, refreshToken, user },
  });
});

/**
 * GET /api/v1/auth/me
 */
export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.id);

  res.json({
    success: true,
    message: 'User retrieved successfully',
    data: { user },
  });
});

/**
 * POST /api/v1/auth/refresh
 */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refreshToken(refreshToken);

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: tokens,
  });
});

/**
 * POST /api/v1/auth/logout
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;
  await authService.logout(req.user!.id, ipAddress);

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * POST /api/v1/auth/change-password
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;

  await authService.changePassword(req.user!.id, currentPassword, newPassword, ipAddress);

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

/**
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;

  await authService.forgotPassword(email, ipAddress);

  // Always return success to prevent email enumeration
  res.json({
    success: true,
    message: 'If an account exists with this email, a password reset link has been sent',
  });
});

/**
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, token, password } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;

  await authService.resetPassword(email, token, password, ipAddress);

  res.json({
    success: true,
    message: 'Password reset successfully',
  });
});
