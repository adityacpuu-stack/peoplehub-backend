import { User, Employee, Role, Permission } from '@prisma/client';

// Company feature toggles
export interface CompanyFeatures {
  attendance_enabled: boolean;
  leave_enabled: boolean;
  payroll_enabled: boolean;
  performance_enabled: boolean;
}

// User context dalam request (setelah auth middleware)
export interface AuthUser {
  id: number;
  email: string;
  is_active: boolean;
  force_password_change: boolean;
  employee: {
    id: number;
    employee_id: string | null;
    name: string;
    company_id: number | null;
    department_id: number | null;
    position_id: number | null;
    employment_status: string | null;
    profile_completed: boolean;
  } | null;
  roles: string[];
  permissions: string[];
  accessibleCompanyIds: number[];
  companyFeatures?: CompanyFeatures;
}

// Extended Express Request dengan auth context
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// JWT Payload
export interface JWTPayload {
  id: number;
  email: string;
  iat?: number;
  exp?: number;
}

// Login response
export interface LoginResponse {
  message: string;
  token: string;
  refreshToken?: string;
  user: AuthUser;
}

// Role hierarchy (higher number = higher authority)
export const ROLE_HIERARCHY: Record<string, number> = {
  'Super Admin': 100,
  'Group CEO': 90,
  'CEO': 80,
  'HR Manager': 70,
  'Finance Manager': 65,
  'Tax Manager': 64,
  'HR Staff': 60,
  'Tax Staff': 58,
  'Manager': 50,
  'Employee': 10,
};

// Role names constant
export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  GROUP_CEO: 'Group CEO',
  CEO: 'CEO',
  HR_MANAGER: 'HR Manager',
  FINANCE_MANAGER: 'Finance Manager',
  TAX_MANAGER: 'Tax Manager',
  HR_STAFF: 'HR Staff',
  TAX_STAFF: 'Tax Staff',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];
