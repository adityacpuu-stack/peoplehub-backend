import { Request, Response } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();

/**
 * POST /api/v1/auth/login
 * Authenticate user and return tokens
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;
    const { token, refreshToken, user } = await authService.login(email, password, ipAddress);

    return res.status(200).json({
      message: 'Login successful',
      data: {
        token,
        refreshToken,
        user,
      },
    });
  } catch (error: any) {
    return res.status(401).json({ message: error.message || 'Login failed' });
  }
};

/**
 * GET /api/v1/auth/me
 * Get current authenticated user
 */
export const me = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await authService.getCurrentUser(req.user.id);

    return res.status(200).json({
      message: 'User retrieved successfully',
      data: { user },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Failed to get user' });
  }
};

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const tokens = await authService.refreshToken(refreshToken);

    return res.status(200).json({
      message: 'Token refreshed successfully',
      data: tokens,
    });
  } catch (error: any) {
    return res.status(401).json({ message: error.message || 'Token refresh failed' });
  }
};

/**
 * POST /api/v1/auth/logout
 * Logout current user
 */
export const logout = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;
    await authService.logout(req.user.id, ipAddress);

    return res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Logout failed' });
  }
};

/**
 * POST /api/v1/auth/change-password
 * Change user password
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters',
      });
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;
    await authService.changePassword(req.user.id, currentPassword, newPassword, ipAddress);

    return res.status(200).json({
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Password change failed' });
  }
};

/**
 * POST /api/v1/auth/forgot-password
 * Request password reset email
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;
    await authService.forgotPassword(email, ipAddress);

    // Always return success to prevent email enumeration
    return res.status(200).json({
      message: 'If an account exists with this email, a password reset link has been sent',
    });
  } catch (error: any) {
    // Still return success to prevent email enumeration
    return res.status(200).json({
      message: 'If an account exists with this email, a password reset link has been sent',
    });
  }
};

/**
 * POST /api/v1/auth/reset-password
 * Reset password with token
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, token, password } = req.body;

    if (!email || !token || !password) {
      return res.status(400).json({
        message: 'Email, token, and password are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters',
      });
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string;
    await authService.resetPassword(email, token, password, ipAddress);

    return res.status(200).json({
      message: 'Password reset successfully',
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Password reset failed' });
  }
};
