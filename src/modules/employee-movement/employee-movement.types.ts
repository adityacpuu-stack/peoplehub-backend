import { Prisma } from '@prisma/client';

// ==========================================
// ENUMS / CONSTANTS
// ==========================================

export const MOVEMENT_TYPES = [
  'promotion',
  'demotion',
  'transfer',
  'mutation',
  'salary_adjustment',
  'grade_change',
  'status_change',
  'department_change',
  'position_change',
  'company_transfer',
] as const;

export const MOVEMENT_STATUSES = ['pending', 'approved', 'rejected', 'cancelled', 'applied'] as const;

export type MovementType = typeof MOVEMENT_TYPES[number];
export type MovementStatus = typeof MOVEMENT_STATUSES[number];

// ==========================================
// QUERY INTERFACES
// ==========================================

export interface EmployeeMovementListQuery {
  page?: number;
  limit?: number;
  search?: string;
  employee_id?: number;
  company_id?: number;
  movement_type?: string;
  status?: string;
  effective_from?: string;
  effective_to?: string;
  is_applied?: boolean;
}

// ==========================================
// DTOs
// ==========================================

export interface CreateEmployeeMovementDTO {
  employee_id: number;
  company_id?: number;
  movement_type: string;
  effective_date: Date;
  // New state
  new_position_id?: number;
  new_department_id?: number;
  new_company_id?: number;
  new_salary?: number;
  new_grade?: string;
  new_status?: string;
  // Details
  reason?: string;
  attachment?: string;
  notes?: string;
}

export interface UpdateEmployeeMovementDTO extends Partial<Omit<CreateEmployeeMovementDTO, 'employee_id'>> {}

export interface ApproveMovementDTO {
  approval_notes?: string;
}

export interface RejectMovementDTO {
  rejection_reason: string;
}

// ==========================================
// SELECT FIELDS
// ==========================================

export const EMPLOYEE_MOVEMENT_SELECT = {
  id: true,
  employee_id: true,
  company_id: true,
  movement_type: true,
  effective_date: true,
  // Previous state
  previous_position_id: true,
  previous_position_name: true,
  previous_department_id: true,
  previous_department_name: true,
  previous_company_id: true,
  previous_company_name: true,
  previous_salary: true,
  previous_grade: true,
  previous_status: true,
  // New state
  new_position_id: true,
  new_position_name: true,
  new_department_id: true,
  new_department_name: true,
  new_company_id: true,
  new_company_name: true,
  new_salary: true,
  new_grade: true,
  new_status: true,
  // Details
  salary_change: true,
  salary_change_percentage: true,
  reason: true,
  attachment: true,
  notes: true,
  // Approval
  status: true,
  requested_by: true,
  requested_at: true,
  approved_by: true,
  approved_at: true,
  rejected_by: true,
  rejected_at: true,
  approval_notes: true,
  rejection_reason: true,
  // Application
  is_applied: true,
  applied_at: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.EmployeeMovementSelect;

export const EMPLOYEE_MOVEMENT_DETAIL_SELECT = {
  ...EMPLOYEE_MOVEMENT_SELECT,
  employee: {
    select: {
      id: true,
      employee_id: true,
      name: true,
      basic_salary: true,
      department: {
        select: { id: true, name: true },
      },
      position: {
        select: { id: true, name: true },
      },
      company: {
        select: { id: true, name: true },
      },
    },
  },
  requester: {
    select: {
      id: true,
      name: true,
    },
  },
  approver: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.EmployeeMovementSelect;
