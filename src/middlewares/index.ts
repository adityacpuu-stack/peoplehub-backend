// Authentication middleware
export { authenticate, optionalAuthenticate, getHighestRoleLevel } from './auth.middleware';

// Role-based access control
export {
  requireRole,
  requireRoleLevel,
  requireSuperAdmin,
  requireGroupCEOOrHigher,
  requireCEOOrHigher,
  requireHRManagerOrHigher,
  requireHRStaffOrHigher,
  requireManagerOrHigher,
  requireHR,
  requireEmployeeManagement,
  requireSelfOrRole,
  requireSelfEmployeeOrRole,
} from './role.middleware';

// Permission-based access control
export {
  requirePermission,
  requireAllPermissions,
  requirePermissionWildcard,
  canViewEmployees,
  canEditEmployees,
  canDeleteEmployees,
  canViewPayroll,
  canProcessPayroll,
  canApprovePayroll,
  canViewAttendance,
  canManageAttendance,
  canViewLeave,
  canApproveLeave,
  canViewPerformance,
  canManagePerformance,
  canViewReports,
  canExportReports,
  canManageSettings,
  canManageRoles,
  canManageCompanies,
} from './permission.middleware';

// Company access control
export {
  validateCompanyAccess,
  validateCompanyAccessFromBody,
  validateCompanyAccessFromQuery,
  requireCompanyAccess,
  getDefaultCompanyId,
  setDefaultCompany,
  getCompanyFilter,
  getRequestedCompanyFilter,
} from './company.middleware';
