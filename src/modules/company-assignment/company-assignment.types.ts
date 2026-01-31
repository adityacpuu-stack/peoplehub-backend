import { Prisma } from '@prisma/client';

export interface CompanyAssignmentListQuery {
  page?: number;
  limit?: number;
  employee_id?: number;
  company_id?: number;
  status?: string;
  search?: string;
}

export interface CreateCompanyAssignmentDTO {
  employee_id: number;
  company_id: number;
  permissions?: Record<string, boolean>;
  notes?: string;
  expires_at?: Date | string;
}

export interface UpdateCompanyAssignmentDTO {
  status?: string;
  permissions?: Record<string, boolean>;
  notes?: string;
  expires_at?: Date | string | null;
}

export interface BulkAssignDTO {
  employee_id: number;
  company_ids: number[];
  permissions?: Record<string, boolean>;
  notes?: string;
  expires_at?: Date | string;
}

export const ASSIGNMENT_LIST_SELECT = {
  id: true,
  employee_id: true,
  company_id: true,
  status: true,
  permissions: true,
  notes: true,
  assigned_by: true,
  assigned_at: true,
  expires_at: true,
  created_at: true,
  updated_at: true,
  employee: {
    select: {
      id: true,
      employee_id: true,
      name: true,
      email: true,
      position: {
        select: {
          id: true,
          name: true,
        },
      },
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  company: {
    select: {
      id: true,
      name: true,
      code: true,
      company_type: true,
    },
  },
  assigner: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.HrStaffCompanyAssignmentSelect;

export const ASSIGNMENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  EXPIRED: 'expired',
} as const;

// Default permissions for company assignment
export const DEFAULT_PERMISSIONS = {
  view_employees: true,
  manage_employees: false,
  view_attendance: true,
  manage_attendance: false,
  view_leave: true,
  manage_leave: false,
  view_payroll: true,
  process_payroll: false,
  approve_payroll: false,
} as const;
