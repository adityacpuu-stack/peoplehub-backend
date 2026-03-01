import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  UserListQuery,
  CreateUserDTO,
  UpdateUserDTO,
  USER_LIST_SELECT,
  USER_DETAIL_SELECT,
} from './user.types';
import { AuthUser } from '../../middlewares/auth.middleware';
import { emailService } from '../email/email.service';
import { microsoft365Service } from '../microsoft365/microsoft365.service';
import { config } from '../../config/env';

const prisma = new PrismaClient();

export class UserService {
  /**
   * List users with pagination and filters
   */
  async list(query: UserListQuery, user: AuthUser) {
    const page = parseInt(String(query.page)) || 1;
    const limit = parseInt(String(query.limit)) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    // Search by email or employee name
    if (query.search) {
      where.OR = [
        { email: { contains: query.search } },
        { employee: { name: { contains: query.search } } },
      ];
    }

    // Filter by active status
    if (query.is_active !== undefined) {
      where.is_active = query.is_active;
    }

    // Filter by role
    if (query.role_id) {
      where.userRoles = {
        some: { role_id: query.role_id },
      };
    }

    // Filter by company (non-super admin can only see users from accessible companies)
    if (!user.roles.includes('Super Admin')) {
      where.employee = {
        company_id: { in: user.accessibleCompanyIds },
      };
    } else if (query.company_id) {
      where.employee = {
        company_id: query.company_id,
      };
    }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: USER_LIST_SELECT,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    // Transform data to include roles array
    const transformedData = data.map((u) => ({
      ...u,
      roles: u.userRoles.map((ur) => ur.role),
    }));

    return {
      data: transformedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async getById(id: number, authUser: AuthUser) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: USER_DETAIL_SELECT,
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check access for non-super admin
    if (!authUser.roles.includes('Super Admin')) {
      if (user.employee && !authUser.accessibleCompanyIds.includes(user.employee.company?.id || 0)) {
        throw new Error('Access denied');
      }
    }

    return {
      ...user,
      roles: user.userRoles.map((ur) => ur.role),
      permissions: user.userPermissions.map((up) => up.permission),
    };
  }

  /**
   * Create new user
   */
  async create(data: CreateUserDTO, authUser: AuthUser) {
    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new Error('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user with roles
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        is_active: data.is_active ?? true,
        userRoles: data.role_ids
          ? {
              create: data.role_ids.map((roleId) => ({ role_id: roleId })),
            }
          : undefined,
      },
      select: USER_LIST_SELECT,
    });

    // Link to employee if provided
    let employeeName = 'User';
    if (data.employee_id) {
      const employee = await prisma.employee.update({
        where: { id: data.employee_id },
        data: { user_id: user.id },
        select: { name: true },
      });
      employeeName = employee.name;
    }

    // Send welcome email (async, don't wait)
    emailService.sendWelcomeEmail(data.email, {
      name: employeeName,
      email: data.email,
      temporaryPassword: data.password, // Send original password before hashing
      loginUrl: `${config.app.url}/login`,
    }).catch((err) => console.error('Failed to send welcome email:', err));

    return {
      ...user,
      roles: user.userRoles.map((ur) => ur.role),
    };
  }

  /**
   * Update user
   */
  async update(id: number, data: UpdateUserDTO, authUser: AuthUser) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check access for non-super admin
    if (!authUser.roles.includes('Super Admin')) {
      if (user.employee && !authUser.accessibleCompanyIds.includes(user.employee.company_id || 0)) {
        throw new Error('Access denied');
      }
    }

    // Prepare update data
    const updateData: Prisma.UserUpdateInput = {};

    if (data.email) {
      // Check if new email already exists
      const existing = await prisma.user.findFirst({
        where: { email: data.email, id: { not: id } },
      });
      if (existing) {
        throw new Error('Email already exists');
      }
      updateData.email = data.email;
    }

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
      updateData.last_password_change = new Date();
    }

    if (data.is_active !== undefined) {
      updateData.is_active = data.is_active;
    }

    // Update user
    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_LIST_SELECT,
    });

    // Update roles if provided
    if (data.role_ids) {
      // Remove existing roles
      await prisma.userRole.deleteMany({ where: { user_id: id } });

      // Add new roles
      await prisma.userRole.createMany({
        data: data.role_ids.map((roleId) => ({
          user_id: id,
          role_id: roleId,
        })),
      });

      // Fetch updated user with roles
      const userWithRoles = await prisma.user.findUnique({
        where: { id },
        select: USER_LIST_SELECT,
      });

      return {
        ...userWithRoles,
        roles: userWithRoles?.userRoles.map((ur) => ur.role) || [],
      };
    }

    return {
      ...updated,
      roles: updated.userRoles.map((ur) => ur.role),
    };
  }

  /**
   * Delete user
   */
  async delete(id: number, authUser: AuthUser) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Prevent deleting own account
    if (user.id === authUser.id) {
      throw new Error('Cannot delete your own account');
    }

    // Check access for non-super admin
    if (!authUser.roles.includes('Super Admin')) {
      if (user.employee && !authUser.accessibleCompanyIds.includes(user.employee.company_id || 0)) {
        throw new Error('Access denied');
      }
    }

    // Delete user (cascade will handle userRoles, userPermissions, and related employee data)
    await prisma.user.delete({ where: { id } });

    return { success: true };
  }

  /**
   * Toggle user active status
   */
  async toggleStatus(id: number, authUser: AuthUser) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, is_active: true, employee: { select: { company_id: true } } },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Prevent deactivating own account
    if (user.id === authUser.id) {
      throw new Error('Cannot deactivate your own account');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { is_active: !user.is_active },
      select: USER_LIST_SELECT,
    });

    return {
      ...updated,
      roles: updated.userRoles.map((ur) => ur.role),
    };
  }

  /**
   * Get user statistics
   */
  async getStats(authUser: AuthUser) {
    const where: Prisma.UserWhereInput = {};

    if (!authUser.roles.includes('Super Admin')) {
      where.employee = {
        company_id: { in: authUser.accessibleCompanyIds },
      };
    }

    const [total, active, inactive, recentLogins] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ where: { ...where, is_active: true } }),
      prisma.user.count({ where: { ...where, is_active: false } }),
      prisma.user.count({
        where: {
          ...where,
          last_login_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    // Get role distribution
    const roleStats = await prisma.userRole.groupBy({
      by: ['role_id'],
      _count: true,
    });

    const roles = await prisma.role.findMany({
      where: { id: { in: roleStats.map((r) => r.role_id) } },
      select: { id: true, name: true },
    });

    const roleDistribution = roleStats.map((rs) => ({
      role: roles.find((r) => r.id === rs.role_id)?.name || 'Unknown',
      count: rs._count,
    }));

    return {
      total,
      active,
      inactive,
      recentLogins,
      roleDistribution,
    };
  }

  /**
   * Send credentials to user
   * - If username provided: create M365 mailbox, set as login email
   * - Generate temp password, update DB, send credential to personal email
   */
  async sendCredentials(id: number, authUser: AuthUser, username?: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            personal_email: true,
            email: true,
            company_id: true,
            company: { select: { id: true, name: true, email_domain: true } },
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.employee) {
      throw new Error('User has no linked employee. Please link an employee first.');
    }

    // Check access for non-super admin
    if (!authUser.roles.includes('Super Admin')) {
      if (!authUser.accessibleCompanyIds.includes(user.employee.company_id || 0)) {
        throw new Error('Access denied');
      }
    }

    // Determine send-to email (personal email)
    const personalEmail = user.employee.personal_email || user.employee.email;
    if (!personalEmail || personalEmail.endsWith('@temp.local')) {
      throw new Error('Employee has no personal email. Please update employee personal email first.');
    }

    // Generate random temporary password
    const tempPassword = this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    let officeEmail = user.email;

    // If username provided, create M365 mailbox and set office email
    if (username) {
      const company = user.employee.company;
      if (!company?.email_domain) {
        throw new Error(`Company "${company?.name || 'Unknown'}" has no email domain configured.`);
      }

      officeEmail = `${username}@${company.email_domain}`;

      // Check if another user already uses this email
      const existingUser = await prisma.user.findFirst({
        where: { email: officeEmail, id: { not: id } },
      });
      if (existingUser) {
        throw new Error(`Email ${officeEmail} is already used by another user.`);
      }

      // Create mailbox in Microsoft 365
      if (microsoft365Service.isReady()) {
        await microsoft365Service.createUser({
          displayName: user.employee.name,
          mailNickname: username,
          email: officeEmail,
          password: tempPassword,
        });
      }

      // Update employee work email
      await prisma.employee.update({
        where: { id: user.employee.id },
        data: { email: officeEmail },
      });
    }

    // Update user login email + password
    await prisma.user.update({
      where: { id },
      data: {
        email: officeEmail,
        password: hashedPassword,
        force_password_change: true,
        last_password_change: new Date(),
      },
    });

    // Send credentials to personal email
    const sent = await emailService.sendWelcomeEmail(personalEmail, {
      name: user.employee.name,
      email: officeEmail,
      temporaryPassword: tempPassword,
      loginUrl: `${config.app.url}/login`,
    });

    if (!sent) {
      throw new Error('Account created but failed to send email. Please check email configuration.');
    }

    return {
      success: true,
      officeEmail,
      sentTo: personalEmail,
    };
  }

  /**
   * Generate random password (12 chars, alphanumeric + special)
   */
  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const special = '!@#$%&*';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Add 2 special chars at random positions
    for (let i = 0; i < 2; i++) {
      const pos = Math.floor(Math.random() * (password.length + 1));
      const char = special.charAt(Math.floor(Math.random() * special.length));
      password = password.slice(0, pos) + char + password.slice(pos);
    }
    return password;
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notification_preferences: true },
    });

    // Default preferences
    const defaultPreferences = {
      email_attendance_reminder: true,
      email_leave_request: true,
      email_leave_approval: true,
      email_payslip: true,
      email_birthday: true,
      email_contract_expiry: true,
      whatsapp_enabled: false,
      whatsapp_attendance: false,
      whatsapp_approval: false,
    };

    // Merge with stored preferences if any
    if (user?.notification_preferences && typeof user.notification_preferences === 'object') {
      return { ...defaultPreferences, ...(user.notification_preferences as object) };
    }

    return defaultPreferences;
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(userId: number, preferences: Record<string, boolean>) {
    // Get existing preferences
    const existingPrefs = await this.getPreferences(userId);

    // Merge with new preferences
    const mergedPreferences = { ...existingPrefs, ...preferences };

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: { notification_preferences: mergedPreferences },
    });

    return mergedPreferences;
  }
}

export const userService = new UserService();
