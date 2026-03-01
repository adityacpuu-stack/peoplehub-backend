import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from '../../config/env';
import { prisma } from '../../config/prisma';
import { AuthUser, JWTPayload, CompanyFeatures } from '../../types/auth.types';
import { emailService } from '../email/email.service';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} from '../../middlewares/error.middleware';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;
const TOKEN_EXPIRY = '1d';
const REFRESH_TOKEN_EXPIRY = '7d';

export class AuthService {
  /**
   * Authenticate user and return tokens
   */
  async login(
    email: string,
    password: string,
    ipAddress?: string
  ): Promise<{ token: string; refreshToken: string; user: AuthUser }> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        is_active: true,
        failed_login_attempts: true,
        account_locked_until: true,
        password_expires_at: true,
        force_password_change: true,
        employee: {
          select: {
            id: true,
            employee_id: true,
            name: true,
            company_id: true,
            department_id: true,
            position_id: true,
            employment_status: true,
            profile_completed: true,
            national_id: true,
            position: { select: { name: true } },
          },
        },
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
        userPermissions: {
          include: { permission: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if account is locked
    if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
      const remainingMinutes = Math.ceil(
        (new Date(user.account_locked_until).getTime() - Date.now()) / 60000
      );
      throw new ForbiddenError(`Account is locked. Try again in ${remainingMinutes} minutes.`);
    }

    // Check if account is active
    if (!user.is_active) {
      throw new ForbiddenError('Account is disabled. Please contact administrator.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const newAttempts = user.failed_login_attempts + 1;
      const updateData: any = { failed_login_attempts: newAttempts };

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        updateData.account_locked_until = new Date(
          Date.now() + LOCK_DURATION_MINUTES * 60 * 1000
        );
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        throw new ForbiddenError(`Account locked due to too many failed attempts. Try again in ${LOCK_DURATION_MINUTES} minutes.`);
      }

      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if password has expired
    if (user.password_expires_at && new Date(user.password_expires_at) < new Date()) {
      throw new UnauthorizedError('Password has expired. Please reset your password.');
    }

    // Reset failed attempts and update login info
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failed_login_attempts: 0,
        account_locked_until: null,
        last_login_at: new Date(),
        last_login_ip: ipAddress || null,
      },
    });

    // Extract roles and permissions
    const roles = user.userRoles.map((ur) => ur.role.name);
    const rolePermissions = user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => rp.permission.name)
    );
    const directPermissions = user.userPermissions.map((up) => up.permission.name);
    const permissions = [...new Set([...rolePermissions, ...directPermissions])];

    const accessibleCompanyIds = await this.getAccessibleCompanyIds(user, roles);
    const companyFeatures = await this.getCompanyFeatures(user.employee?.company_id, roles);

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      is_active: user.is_active,
      force_password_change: user.force_password_change,
      employee: user.employee,
      roles,
      permissions,
      accessibleCompanyIds,
      companyFeatures,
    };

    const token = this.generateToken(user.id, user.email);
    const refreshToken = this.generateRefreshToken(user.id, user.email);

    await this.logAudit(user.id, 'login', 'User logged in successfully', ipAddress);

    return { token, refreshToken, user: authUser };
  }

  /**
   * Get current user info
   */
  async getCurrentUser(userId: number): Promise<AuthUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          select: {
            id: true,
            employee_id: true,
            name: true,
            company_id: true,
            department_id: true,
            position_id: true,
            employment_status: true,
            profile_completed: true,
            national_id: true,
            position: { select: { name: true } },
          },
        },
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
        userPermissions: {
          include: { permission: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const rolePermissions = user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => rp.permission.name)
    );
    const directPermissions = user.userPermissions.map((up) => up.permission.name);
    const permissions = [...new Set([...rolePermissions, ...directPermissions])];
    const accessibleCompanyIds = await this.getAccessibleCompanyIds(user, roles);
    const companyFeatures = await this.getCompanyFeatures(user.employee?.company_id, roles);

    return {
      id: user.id,
      email: user.email,
      is_active: user.is_active,
      force_password_change: user.force_password_change,
      employee: user.employee,
      roles,
      permissions,
      accessibleCompanyIds,
      companyFeatures,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(refreshToken, config.jwtSecret + '_refresh') as JWTPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, is_active: true },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const newToken = this.generateToken(user.id, user.email);
    const newRefreshToken = this.generateRefreshToken(user.id, user.email);

    return { token: newToken, refreshToken: newRefreshToken };
  }

  /**
   * Change password
   */
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
    ipAddress?: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestError('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        last_password_change: new Date(),
        force_password_change: false,
        password_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
    });

    await this.logAudit(userId, 'password_change', 'Password changed successfully', ipAddress);
  }

  /**
   * Logout
   */
  async logout(userId: number, ipAddress?: string): Promise<void> {
    await this.logAudit(userId, 'logout', 'User logged out', ipAddress);
  }

  /**
   * Request password reset (forgot password)
   */
  async forgotPassword(email: string, ipAddress?: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        employee: {
          select: { name: true },
        },
      },
    });

    // Always return silently to prevent email enumeration
    if (!user) {
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        remember_token: resetTokenHash,
        password_expires_at: resetTokenExpiry,
      },
    });

    const resetUrl = `${config.app.url}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    emailService.sendResetPasswordEmail(email, {
      name: user.employee?.name || email,
      resetUrl,
      expiresIn: '1 jam',
    }).catch(err => console.error('Failed to send reset email:', err));

    this.logAudit(user.id, 'forgot_password', 'Password reset requested', ipAddress)
      .catch(err => console.error('Failed to log audit:', err));
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
    ipAddress?: string
  ): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        email,
        remember_token: tokenHash,
        password_expires_at: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        remember_token: null,
        last_password_change: new Date(),
        force_password_change: false,
        password_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
    });

    await this.logAudit(user.id, 'password_reset', 'Password reset successfully', ipAddress);
  }

  private generateToken(userId: number, email: string): string {
    return jwt.sign({ id: userId, email }, config.jwtSecret, {
      expiresIn: TOKEN_EXPIRY,
    });
  }

  private generateRefreshToken(userId: number, email: string): string {
    return jwt.sign({ id: userId, email }, config.jwtSecret + '_refresh', {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });
  }

  private async getAccessibleCompanyIds(user: any, roles: string[]): Promise<number[]> {
    if (roles.includes('Super Admin')) {
      const companies = await prisma.company.findMany({
        where: { status: 'active' },
        select: { id: true },
      });
      return companies.map((c) => c.id);
    }

    if (roles.includes('Group CEO') && user.employee?.company_id) {
      const userCompany = await prisma.company.findUnique({
        where: { id: user.employee.company_id },
        select: { parent_company_id: true },
      });

      const parentId = userCompany?.parent_company_id || user.employee.company_id;

      const groupCompanies = await prisma.company.findMany({
        where: {
          OR: [{ id: parentId }, { parent_company_id: parentId }],
          status: 'active',
        },
        select: { id: true },
      });
      return groupCompanies.map((c) => c.id);
    }

    if (roles.includes('HR Staff') && user.employee) {
      const assignments = await prisma.hrStaffCompanyAssignment.findMany({
        where: {
          employee_id: user.employee.id,
          status: 'active',
          OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
        },
        select: { company_id: true },
      });

      const companyIds = assignments.map((a) => a.company_id);
      if (user.employee.company_id) {
        companyIds.push(user.employee.company_id);
      }
      return [...new Set(companyIds)];
    }

    if (user.employee?.company_id) {
      return [user.employee.company_id];
    }

    return [];
  }

  private async getCompanyFeatures(
    companyId: number | null | undefined,
    roles: string[]
  ): Promise<CompanyFeatures | undefined> {
    if (roles.includes('Super Admin')) {
      return {
        attendance_enabled: true,
        leave_enabled: true,
        payroll_enabled: true,
        performance_enabled: true,
      };
    }

    if (!companyId) {
      return {
        attendance_enabled: true,
        leave_enabled: true,
        payroll_enabled: true,
        performance_enabled: true,
      };
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        attendance_enabled: true,
        leave_enabled: true,
        payroll_enabled: true,
        performance_enabled: true,
      },
    });

    if (!company) {
      return {
        attendance_enabled: true,
        leave_enabled: true,
        payroll_enabled: true,
        performance_enabled: true,
      };
    }

    return {
      attendance_enabled: company.attendance_enabled,
      leave_enabled: company.leave_enabled,
      payroll_enabled: company.payroll_enabled,
      performance_enabled: company.performance_enabled,
    };
  }

  private async logAudit(
    userId: number,
    action: string,
    description: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          user_id: userId,
          action,
          model: 'auth',
          description,
          ip_address: ipAddress,
        },
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }
  }
}
