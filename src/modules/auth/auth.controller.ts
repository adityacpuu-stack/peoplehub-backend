import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { asyncHandler } from '../../middlewares/error.middleware';

const authService = new AuthService();

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;
  const { token, refreshToken, user } = await authService.login(email, password, ipAddress);
  res.status(200).json({
    message: 'Login successful',
    data: { token, refreshToken, user },
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.id);
  res.status(200).json({
    message: 'User retrieved successfully',
    data: { user },
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refreshToken(refreshToken);
  res.status(200).json({
    message: 'Token refreshed successfully',
    data: tokens,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;
  await authService.logout(req.user!.id, ipAddress);
  res.status(200).json({ message: 'Logged out successfully' });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;
  await authService.changePassword(req.user!.id, currentPassword, newPassword, ipAddress);
  res.status(200).json({ message: 'Password changed successfully' });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;
  // Always return success to prevent email enumeration
  try {
    await authService.forgotPassword(email, ipAddress);
  } catch {
    // Swallow errors to prevent email enumeration
  }
  res.status(200).json({
    message: 'If an account exists with this email, a password reset link has been sent',
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, token, password } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;
  await authService.resetPassword(email, token, password, ipAddress);
  res.status(200).json({ message: 'Password reset successfully' });
});
