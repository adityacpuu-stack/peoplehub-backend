import { Prisma } from '@prisma/client';

// ==========================================
// PERMISSION GROUPS
// ==========================================

export const PERMISSION_GROUPS = {
  EMPLOYEE: 'employee',
  DEPARTMENT: 'department',
  POSITION: 'position',
  ATTENDANCE: 'attendance',
  LEAVE: 'leave',
  OVERTIME: 'overtime',
  PAYROLL: 'payroll',
  PERFORMANCE: 'performance',
  CONTRACT: 'contract',
  DOCUMENT: 'document',
  COMPANY: 'company',
  HOLIDAY: 'holiday',
  SETTING: 'setting',
  USER: 'user',
  ROLE: 'role',
  REPORT: 'report',
} as const;

// ==========================================
// QUERY INTERFACES
// ==========================================

export interface RoleListQuery {
  page?: number;
  limit?: number;
  search?: string;
  is_system?: boolean;
}

export interface PermissionListQuery {
  page?: number;
  limit?: number;
  group?: string;
  search?: string;
}

export interface UserRoleQuery {
  user_id?: number;
  role_id?: number;
}

// ==========================================
// DTOs - Role
// ==========================================

export interface CreateRoleDTO {
  name: string;
  description?: string;
  level?: number;
  permission_ids?: number[];
}

export interface UpdateRoleDTO {
  name?: string;
  description?: string;
  level?: number;
}

// ==========================================
// DTOs - Permission
// ==========================================

export interface CreatePermissionDTO {
  name: string;
  group?: string;
  description?: string;
}

export interface UpdatePermissionDTO {
  name?: string;
  group?: string;
  description?: string;
}

// ==========================================
// DTOs - Assignments
// ==========================================

export interface AssignRoleDTO {
  user_id: number;
  role_ids: number[];
}

export interface AssignPermissionToRoleDTO {
  role_id: number;
  permission_ids: number[];
}

export interface AssignPermissionToUserDTO {
  user_id: number;
  permission_ids: number[];
}

// ==========================================
// SELECT FIELDS
// ==========================================

export const ROLE_SELECT = {
  id: true,
  name: true,
  guard_name: true,
  description: true,
  level: true,
  is_system: true,
  created_at: true,
  updated_at: true,
  _count: {
    select: {
      userRoles: true,
      rolePermissions: true,
    },
  },
} satisfies Prisma.RoleSelect;

export const ROLE_DETAIL_SELECT = {
  ...ROLE_SELECT,
  rolePermissions: {
    select: {
      permission: {
        select: {
          id: true,
          name: true,
          group: true,
          description: true,
        },
      },
    },
  },
} satisfies Prisma.RoleSelect;

export const PERMISSION_SELECT = {
  id: true,
  name: true,
  guard_name: true,
  group: true,
  description: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.PermissionSelect;

export const USER_ROLE_SELECT = {
  id: true,
  user_id: true,
  role_id: true,
  created_at: true,
  user: {
    select: {
      id: true,
      email: true,
      employee: {
        select: {
          id: true,
          name: true,
          employee_id: true,
        },
      },
    },
  },
  role: {
    select: {
      id: true,
      name: true,
      level: true,
    },
  },
} satisfies Prisma.UserRoleSelect;

// ==========================================
// DEFAULT ROLES
// ==========================================

export const DEFAULT_ROLES = [
  { name: 'Super Admin', level: 1, description: 'Full system access, can manage all companies', is_system: true },
  { name: 'Group CEO', level: 2, description: 'Access to all companies in the group', is_system: true },
  { name: 'CEO', level: 3, description: 'Company executive, full access to own company', is_system: true },
  { name: 'HR Manager', level: 4, description: 'HR department manager, can manage HR operations', is_system: true },
  { name: 'HR Staff', level: 5, description: 'HR staff, can handle day-to-day HR tasks', is_system: true },
  { name: 'Finance Manager', level: 4, description: 'Finance department manager, payroll access', is_system: true },
  { name: 'Manager', level: 6, description: 'Department/Team manager, can manage team members', is_system: true },
  { name: 'Supervisor', level: 7, description: 'Team supervisor, limited management access', is_system: true },
  { name: 'Employee', level: 8, description: 'Regular employee, self-service access only', is_system: true },
];

// ==========================================
// DEFAULT PERMISSIONS
// ==========================================

export const DEFAULT_PERMISSIONS = [
  // Employee
  { name: 'employee.view', group: 'employee', description: 'View employee list and details' },
  { name: 'employee.create', group: 'employee', description: 'Create new employee' },
  { name: 'employee.update', group: 'employee', description: 'Update employee data' },
  { name: 'employee.delete', group: 'employee', description: 'Delete/deactivate employee' },
  { name: 'employee.view_salary', group: 'employee', description: 'View employee salary information' },
  { name: 'employee.update_salary', group: 'employee', description: 'Update employee salary' },
  { name: 'employee.view_own', group: 'employee', description: 'View own profile' },
  { name: 'employee.update_own', group: 'employee', description: 'Update own profile' },

  // Department
  { name: 'department.view', group: 'department', description: 'View departments' },
  { name: 'department.create', group: 'department', description: 'Create department' },
  { name: 'department.update', group: 'department', description: 'Update department' },
  { name: 'department.delete', group: 'department', description: 'Delete department' },

  // Position
  { name: 'position.view', group: 'position', description: 'View positions' },
  { name: 'position.create', group: 'position', description: 'Create position' },
  { name: 'position.update', group: 'position', description: 'Update position' },
  { name: 'position.delete', group: 'position', description: 'Delete position' },

  // Attendance
  { name: 'attendance.view', group: 'attendance', description: 'View attendance records' },
  { name: 'attendance.view_all', group: 'attendance', description: 'View all employees attendance' },
  { name: 'attendance.checkin', group: 'attendance', description: 'Check-in/out' },
  { name: 'attendance.update', group: 'attendance', description: 'Update attendance records' },
  { name: 'attendance.approve', group: 'attendance', description: 'Approve attendance corrections' },
  { name: 'attendance.export', group: 'attendance', description: 'Export attendance data' },

  // Leave
  { name: 'leave.view', group: 'leave', description: 'View leave requests' },
  { name: 'leave.view_all', group: 'leave', description: 'View all employees leave' },
  { name: 'leave.request', group: 'leave', description: 'Submit leave request' },
  { name: 'leave.approve', group: 'leave', description: 'Approve/reject leave requests' },
  { name: 'leave.manage_balance', group: 'leave', description: 'Manage leave balances' },
  { name: 'leave.manage_type', group: 'leave', description: 'Manage leave types' },

  // Overtime
  { name: 'overtime.view', group: 'overtime', description: 'View overtime requests' },
  { name: 'overtime.view_all', group: 'overtime', description: 'View all employees overtime' },
  { name: 'overtime.request', group: 'overtime', description: 'Submit overtime request' },
  { name: 'overtime.approve', group: 'overtime', description: 'Approve/reject overtime' },

  // Payroll
  { name: 'payroll.view', group: 'payroll', description: 'View payroll data' },
  { name: 'payroll.view_own', group: 'payroll', description: 'View own payslip' },
  { name: 'payroll.generate', group: 'payroll', description: 'Generate payroll' },
  { name: 'payroll.calculate', group: 'payroll', description: 'Calculate payroll' },
  { name: 'payroll.approve', group: 'payroll', description: 'Approve payroll' },
  { name: 'payroll.pay', group: 'payroll', description: 'Mark payroll as paid' },
  { name: 'payroll.settings', group: 'payroll', description: 'Manage payroll settings' },
  { name: 'payroll.export', group: 'payroll', description: 'Export payroll data' },

  // Performance
  { name: 'performance.view', group: 'performance', description: 'View performance reviews' },
  { name: 'performance.view_all', group: 'performance', description: 'View all performance reviews' },
  { name: 'performance.create', group: 'performance', description: 'Create performance review' },
  { name: 'performance.submit', group: 'performance', description: 'Submit self-assessment' },
  { name: 'performance.approve', group: 'performance', description: 'Approve performance reviews' },
  { name: 'performance.manage_cycle', group: 'performance', description: 'Manage performance cycles' },

  // Contract
  { name: 'contract.view', group: 'contract', description: 'View contracts' },
  { name: 'contract.create', group: 'contract', description: 'Create contract' },
  { name: 'contract.update', group: 'contract', description: 'Update contract' },
  { name: 'contract.terminate', group: 'contract', description: 'Terminate contract' },

  // Document
  { name: 'document.view', group: 'document', description: 'View documents' },
  { name: 'document.upload', group: 'document', description: 'Upload documents' },
  { name: 'document.delete', group: 'document', description: 'Delete documents' },
  { name: 'document.verify', group: 'document', description: 'Verify employee documents' },

  // Company
  { name: 'company.view', group: 'company', description: 'View companies' },
  { name: 'company.create', group: 'company', description: 'Create company' },
  { name: 'company.update', group: 'company', description: 'Update company' },
  { name: 'company.delete', group: 'company', description: 'Delete company' },
  { name: 'company.settings', group: 'company', description: 'Manage company settings' },

  // Holiday
  { name: 'holiday.view', group: 'holiday', description: 'View holidays' },
  { name: 'holiday.create', group: 'holiday', description: 'Create holiday' },
  { name: 'holiday.update', group: 'holiday', description: 'Update holiday' },
  { name: 'holiday.delete', group: 'holiday', description: 'Delete holiday' },

  // Settings
  { name: 'setting.view', group: 'setting', description: 'View settings' },
  { name: 'setting.update', group: 'setting', description: 'Update settings' },
  { name: 'setting.system', group: 'setting', description: 'Manage system settings' },

  // User Management
  { name: 'user.view', group: 'user', description: 'View users' },
  { name: 'user.create', group: 'user', description: 'Create user' },
  { name: 'user.update', group: 'user', description: 'Update user' },
  { name: 'user.delete', group: 'user', description: 'Delete user' },
  { name: 'user.reset_password', group: 'user', description: 'Reset user password' },

  // Role & Permission
  { name: 'role.view', group: 'role', description: 'View roles' },
  { name: 'role.create', group: 'role', description: 'Create role' },
  { name: 'role.update', group: 'role', description: 'Update role' },
  { name: 'role.delete', group: 'role', description: 'Delete role' },
  { name: 'role.assign', group: 'role', description: 'Assign roles to users' },
  { name: 'permission.view', group: 'role', description: 'View permissions' },
  { name: 'permission.assign', group: 'role', description: 'Assign permissions to roles' },

  // Reports
  { name: 'report.attendance', group: 'report', description: 'View attendance reports' },
  { name: 'report.payroll', group: 'report', description: 'View payroll reports' },
  { name: 'report.leave', group: 'report', description: 'View leave reports' },
  { name: 'report.employee', group: 'report', description: 'View employee reports' },
  { name: 'report.export', group: 'report', description: 'Export reports' },
];

// ==========================================
// ROLE-PERMISSION MAPPING
// ==========================================

export const ROLE_PERMISSIONS_MAP: Record<string, string[]> = {
  'Super Admin': ['*'], // All permissions

  'Group CEO': [
    'employee.*', 'department.*', 'position.*', 'attendance.*', 'leave.*',
    'overtime.*', 'payroll.*', 'performance.*', 'contract.*', 'document.*',
    'company.view', 'company.update', 'company.settings',
    'holiday.*', 'setting.view', 'setting.update',
    'user.view', 'role.view', 'report.*',
  ],

  'CEO': [
    'employee.*', 'department.*', 'position.*', 'attendance.*', 'leave.*',
    'overtime.*', 'payroll.*', 'performance.*', 'contract.*', 'document.*',
    'company.view', 'company.update', 'company.settings',
    'holiday.*', 'setting.view', 'setting.update',
    'user.view', 'role.view', 'report.*',
  ],

  'HR Manager': [
    'employee.*', 'department.*', 'position.*',
    'attendance.view', 'attendance.view_all', 'attendance.update', 'attendance.approve', 'attendance.export',
    'leave.view', 'leave.view_all', 'leave.approve', 'leave.manage_balance', 'leave.manage_type',
    'overtime.view', 'overtime.view_all', 'overtime.approve',
    'payroll.view', 'payroll.generate', 'payroll.calculate', 'payroll.settings', 'payroll.export',
    'performance.view', 'performance.view_all', 'performance.create', 'performance.approve', 'performance.manage_cycle',
    'contract.*', 'document.*',
    'company.view', 'holiday.view', 'holiday.create', 'holiday.update',
    'user.view', 'role.view', 'role.assign',
    'report.*',
  ],

  'HR Staff': [
    'employee.view', 'employee.create', 'employee.update',
    'department.view', 'position.view',
    'attendance.view', 'attendance.view_all', 'attendance.update',
    'leave.view', 'leave.view_all', 'leave.approve', 'leave.manage_balance',
    'overtime.view', 'overtime.view_all', 'overtime.approve',
    'payroll.view', 'payroll.generate', 'payroll.calculate',
    'performance.view', 'performance.view_all', 'performance.create',
    'contract.view', 'contract.create', 'contract.update',
    'document.view', 'document.upload', 'document.verify',
    'holiday.view',
    'report.attendance', 'report.leave', 'report.employee',
  ],

  'Finance Manager': [
    'employee.view', 'employee.view_salary',
    'payroll.*',
    'report.payroll', 'report.export',
  ],

  'Manager': [
    'employee.view',
    'attendance.view', 'attendance.approve',
    'leave.view', 'leave.approve',
    'overtime.view', 'overtime.approve',
    'performance.view', 'performance.create',
    'document.view',
    'report.attendance', 'report.leave',
  ],

  'Supervisor': [
    'employee.view',
    'attendance.view',
    'leave.view', 'leave.approve',
    'overtime.view', 'overtime.approve',
    'performance.view', 'performance.create',
  ],

  'Employee': [
    'employee.view_own', 'employee.update_own',
    'attendance.checkin',
    'leave.request',
    'overtime.request',
    'payroll.view_own',
    'performance.submit',
    'document.upload',
  ],
};
