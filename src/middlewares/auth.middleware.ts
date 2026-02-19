import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { prisma } from '../config/prisma';
import { AuthUser, JWTPayload, ROLE_HIERARCHY } from '../types/auth.types';

// Re-export AuthUser and ROLE_HIERARCHY for services
export { AuthUser, ROLE_HIERARCHY } from '../types/auth.types';

/**
 * JWT Authentication Middleware
 * Verifies token and loads user with roles & permissions
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT
    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;

    // Fetch user with relationships
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
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
          },
        },
        // force_password_change is a direct User field, included automatically
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    if (!user.is_active) {
      res.status(401).json({ message: 'Account is disabled' });
      return;
    }

    if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
      res.status(401).json({ message: 'Account is locked' });
      return;
    }

    // Extract roles
    const roles = user.userRoles.map((ur) => ur.role.name);

    // Extract permissions (from roles + direct user permissions)
    const rolePermissions = user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => rp.permission.name)
    );
    const directPermissions = user.userPermissions.map((up) => up.permission.name);
    const permissions = [...new Set([...rolePermissions, ...directPermissions])];

    // Calculate accessible company IDs based on role
    const accessibleCompanyIds = await getAccessibleCompanyIds(user, roles);

    // Build auth user object
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      is_active: user.is_active,
      force_password_change: user.force_password_change,
      employee: user.employee,
      roles,
      permissions,
      accessibleCompanyIds,
    };

    req.user = authUser;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Token expired' });
      return;
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Optional authentication - proceeds even without token
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  await authenticate(req, res, next);
};

/**
 * Get accessible company IDs based on user's role
 */
async function getAccessibleCompanyIds(
  user: any,
  roles: string[]
): Promise<number[]> {
  // Super Admin has access to all companies
  if (roles.includes('Super Admin')) {
    const allCompanies = await prisma.company.findMany({
      where: { status: 'active' },
      select: { id: true },
    });
    return allCompanies.map((c) => c.id);
  }

  // Group CEO, CEO, and HR Manager have access to all companies in the group
  if (roles.includes('Group CEO') || roles.includes('CEO') || roles.includes('HR Manager')) {
    const userCompanyId = user.employee?.company_id;
    if (userCompanyId) {
      // Get parent company (holding)
      const userCompany = await prisma.company.findUnique({
        where: { id: userCompanyId },
        select: { parent_company_id: true },
      });

      const parentId = userCompany?.parent_company_id || userCompanyId;

      // Get all companies under the parent
      const groupCompanies = await prisma.company.findMany({
        where: {
          OR: [
            { id: parentId },
            { parent_company_id: parentId },
          ],
          status: 'active',
        },
        select: { id: true },
      });
      return groupCompanies.map((c) => c.id);
    }
  }

  // HR Staff can be assigned to multiple companies
  if (roles.includes('HR Staff') && user.employee) {
    const assignments = await prisma.hrStaffCompanyAssignment.findMany({
      where: {
        employee_id: user.employee.id,
        status: 'active',
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } },
        ],
      },
      select: { company_id: true },
    });

    const assignedIds = assignments.map((a) => a.company_id);

    // Only use assigned companies (from admin company assignment)
    // If no assignments, fallback to own company
    if (assignedIds.length > 0) {
      return [...new Set(assignedIds)];
    }

    // Fallback: own company only
    if (user.employee.company_id) {
      return [user.employee.company_id];
    }

    return [];
  }

  // Other roles: only own company
  if (user.employee?.company_id) {
    return [user.employee.company_id];
  }

  return [];
}

/**
 * Get highest role level for a user
 */
export function getHighestRoleLevel(roles: string[]): number {
  return Math.max(...roles.map((r) => ROLE_HIERARCHY[r] || 0));
}

/**
 * Check if user has access to a specific company
 */
export function hasCompanyAccess(user: AuthUser, companyId: number): boolean {
  // Super Admin has access to all companies
  if (user.roles.includes('Super Admin')) {
    return true;
  }

  // Tax roles have access to all companies for tax reporting purposes
  if (user.roles.includes('Tax Manager') || user.roles.includes('Tax Staff')) {
    return true;
  }

  // Check if company is in user's accessible companies list
  return user.accessibleCompanyIds.includes(companyId);
}

/**
 * Check if user can access a specific employee's data
 */
export async function canAccessEmployee(user: AuthUser, employeeId: number): Promise<boolean> {
  // Super Admin can access all employees
  if (user.roles.includes('Super Admin')) {
    return true;
  }

  // Tax roles can access all employees for tax reporting purposes
  if (user.roles.includes('Tax Manager') || user.roles.includes('Tax Staff')) {
    return true;
  }

  // User can access their own data
  if (user.employee?.id === employeeId) {
    return true;
  }

  // Get the target employee's company
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { company_id: true, department_id: true },
  });

  if (!employee) {
    return false;
  }

  // Check company access
  if (employee.company_id && !hasCompanyAccess(user, employee.company_id)) {
    return false;
  }

  // Managers can access employees in their department
  if (user.roles.includes('Manager') && user.employee?.department_id) {
    if (employee.department_id === user.employee.department_id) {
      return true;
    }
  }

  // HR Staff and above can access employees in their accessible companies
  const hrLevel = getHighestRoleLevel(user.roles);
  if (hrLevel >= ROLE_HIERARCHY['HR Staff']) {
    return employee.company_id ? hasCompanyAccess(user, employee.company_id) : false;
  }

  return false;
}

/**
 * Role-based Authorization Middleware
 * Checks if user has one of the required roles
 */
export function authorize(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as AuthUser;

    if (!user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Super Admin always has access
    if (user.roles.includes('Super Admin')) {
      next();
      return;
    }

    // Check if user has any of the allowed roles
    const hasRole = user.roles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      return;
    }

    next();
  };
}

/**
 * Permission-based Authorization Middleware
 * Checks if user has one of the required permissions
 */
export function requirePermission(requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as AuthUser;

    if (!user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Super Admin always has access
    if (user.roles.includes('Super Admin')) {
      next();
      return;
    }

    // Check if user has any of the required permissions
    const hasPermission = user.permissions.some((perm) => requiredPermissions.includes(perm));

    if (!hasPermission) {
      res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      return;
    }

    next();
  };
}
