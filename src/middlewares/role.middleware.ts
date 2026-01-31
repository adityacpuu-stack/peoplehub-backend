import { Request, Response, NextFunction } from 'express';
import { ROLE_HIERARCHY, RoleName } from '../types/auth.types';
import { getHighestRoleLevel } from './auth.middleware';

/**
 * Role-based access control middleware
 * Checks if user has one of the required roles
 *
 * @param allowedRoles - Array of role names that are allowed access
 */
export const requireRole = (...allowedRoles: RoleName[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const userRoles = req.user.roles;
    const hasRole = userRoles.some((role) => allowedRoles.includes(role as RoleName));

    if (!hasRole) {
      res.status(403).json({
        message: 'Access denied. Required roles: ' + allowedRoles.join(', '),
      });
      return;
    }

    next();
  };
};

/**
 * Role hierarchy middleware
 * Allows access if user's highest role is at or above minimum level
 *
 * @param minimumRole - The minimum role required
 */
export const requireRoleLevel = (minimumRole: RoleName) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const minimumLevel = ROLE_HIERARCHY[minimumRole] || 0;
    const userLevel = getHighestRoleLevel(req.user.roles);

    if (userLevel < minimumLevel) {
      res.status(403).json({
        message: `Access denied. Minimum role required: ${minimumRole}`,
      });
      return;
    }

    next();
  };
};

/**
 * Super Admin only middleware
 */
export const requireSuperAdmin = requireRole('Super Admin');

/**
 * Group CEO or higher middleware
 */
export const requireGroupCEOOrHigher = requireRoleLevel('Group CEO');

/**
 * CEO or higher middleware
 */
export const requireCEOOrHigher = requireRoleLevel('CEO');

/**
 * HR Manager or higher middleware
 */
export const requireHRManagerOrHigher = requireRoleLevel('HR Manager');

/**
 * HR Staff or higher middleware
 */
export const requireHRStaffOrHigher = requireRoleLevel('HR Staff');

/**
 * Manager or higher middleware
 */
export const requireManagerOrHigher = requireRoleLevel('Manager');

/**
 * Check if user is HR (HR Manager or HR Staff)
 */
export const requireHR = requireRole('HR Manager', 'HR Staff');

/**
 * Check if user is Tax (Tax Manager or Tax Staff)
 */
export const requireTax = requireRole('Tax Manager', 'Tax Staff');

/**
 * HR Staff or higher, OR Tax roles (for payroll/tax access)
 */
export const requireHRStaffOrTaxAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const userRoles = req.user.roles;
  const userLevel = getHighestRoleLevel(userRoles);
  const hrStaffLevel = ROLE_HIERARCHY['HR Staff'] || 0;

  // Allow if user has HR Staff level or higher
  const hasHRAccess = userLevel >= hrStaffLevel;
  // Or if user is Tax Manager or Tax Staff
  const hasTaxAccess = userRoles.includes('Tax Manager') || userRoles.includes('Tax Staff');

  if (!hasHRAccess && !hasTaxAccess) {
    res.status(403).json({
      message: 'Access denied. HR Staff or Tax role required.',
    });
    return;
  }

  next();
};

/**
 * Check if user can manage employees (HR or Manager)
 */
export const requireEmployeeManagement = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const canManage =
    req.user.roles.includes('Super Admin') ||
    req.user.roles.includes('Group CEO') ||
    req.user.roles.includes('CEO') ||
    req.user.roles.includes('HR Manager') ||
    req.user.roles.includes('HR Staff') ||
    req.user.roles.includes('Manager');

  if (!canManage) {
    res.status(403).json({
      message: 'Access denied. Employee management permission required.',
    });
    return;
  }

  next();
};

/**
 * Check if user is accessing their own resource or has elevated role
 */
export const requireSelfOrRole = (...elevatedRoles: RoleName[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const paramId = req.params.userId || req.params.id;
    const targetUserId = parseInt(paramId as string);
    const isSelf = req.user.id === targetUserId;
    const hasElevatedRole = req.user.roles.some((role) =>
      elevatedRoles.includes(role as RoleName)
    );

    if (!isSelf && !hasElevatedRole) {
      res.status(403).json({
        message: 'Access denied. You can only access your own resources.',
      });
      return;
    }

    next();
  };
};

/**
 * Check if user is accessing their own employee resource or has elevated role
 */
export const requireSelfEmployeeOrRole = (...elevatedRoles: RoleName[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const paramId = req.params.employeeId || req.params.id;
    const targetEmployeeId = parseInt(paramId as string);
    const isSelf = req.user.employee?.id === targetEmployeeId;
    const hasElevatedRole = req.user.roles.some((role) =>
      elevatedRoles.includes(role as RoleName)
    );

    if (!isSelf && !hasElevatedRole) {
      res.status(403).json({
        message: 'Access denied. You can only access your own resources.',
      });
      return;
    }

    next();
  };
};
