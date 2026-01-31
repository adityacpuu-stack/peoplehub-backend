import { Request, Response, NextFunction } from 'express';

/**
 * Permission-based access control middleware
 * Uses dot-notation permissions (e.g., 'payroll.view', 'employee.edit')
 *
 * @param requiredPermissions - Array of permission names required (OR logic)
 */
export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Super Admin bypasses all permission checks
    if (req.user.roles.includes('Super Admin')) {
      return next();
    }

    const hasPermission = requiredPermissions.some((permission) =>
      req.user!.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        message: 'Access denied. Required permissions: ' + requiredPermissions.join(' OR '),
      });
    }

    next();
  };
};

/**
 * Require ALL specified permissions (AND logic)
 */
export const requireAllPermissions = (...requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Super Admin bypasses all permission checks
    if (req.user.roles.includes('Super Admin')) {
      return next();
    }

    const hasAllPermissions = requiredPermissions.every((permission) =>
      req.user!.permissions.includes(permission)
    );

    if (!hasAllPermissions) {
      const missing = requiredPermissions.filter(
        (p) => !req.user!.permissions.includes(p)
      );
      return res.status(403).json({
        message: 'Access denied. Missing permissions: ' + missing.join(', '),
      });
    }

    next();
  };
};

/**
 * Check permission with wildcard support
 * e.g., 'employee.*' matches 'employee.view', 'employee.edit', etc.
 */
export const requirePermissionWildcard = (permissionPattern: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Super Admin bypasses all permission checks
    if (req.user.roles.includes('Super Admin')) {
      return next();
    }

    const pattern = permissionPattern.replace('*', '.*');
    const regex = new RegExp(`^${pattern}$`);

    const hasPermission = req.user.permissions.some((permission) =>
      regex.test(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        message: `Access denied. Required permission pattern: ${permissionPattern}`,
      });
    }

    next();
  };
};

// Common permission middleware shortcuts
export const canViewEmployees = requirePermission('employee.view', 'employee.view_all');
export const canEditEmployees = requirePermission('employee.edit', 'employee.edit_all');
export const canDeleteEmployees = requirePermission('employee.delete');

export const canViewPayroll = requirePermission('payroll.view', 'payroll.view_all');
export const canProcessPayroll = requirePermission('payroll.process');
export const canApprovePayroll = requirePermission('payroll.approve');

export const canViewAttendance = requirePermission('attendance.view', 'attendance.view_all');
export const canManageAttendance = requirePermission('attendance.manage');

export const canViewLeave = requirePermission('leave.view', 'leave.view_all');
export const canApproveLeave = requirePermission('leave.approve');

export const canViewPerformance = requirePermission('performance.view', 'performance.view_all');
export const canManagePerformance = requirePermission('performance.manage');

export const canViewReports = requirePermission('report.view');
export const canExportReports = requirePermission('report.export');

export const canManageSettings = requirePermission('settings.manage');
export const canManageRoles = requirePermission('role.manage');
export const canManageCompanies = requirePermission('company.manage');
