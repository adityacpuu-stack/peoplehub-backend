import { Prisma } from '@prisma/client';

// ==========================================
// STATUS & TYPE CONSTANTS
// ==========================================

export const CONTRACT_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  TERMINATED: 'terminated',
  RENEWED: 'renewed',
} as const;

export const CONTRACT_TYPES = {
  PERMANENT: 'permanent',
  CONTRACT: 'contract',
  PROBATION: 'probation',
  INTERNSHIP: 'internship',
  PART_TIME: 'part_time',
} as const;

export const MOVEMENT_TYPES = {
  PROMOTION: 'promotion',
  DEMOTION: 'demotion',
  TRANSFER: 'transfer',
  MUTATION: 'mutation',
  SALARY_ADJUSTMENT: 'salary_adjustment',
  GRADE_CHANGE: 'grade_change',
  STATUS_CHANGE: 'status_change',
} as const;

// ==========================================
// QUERY INTERFACES
// ==========================================

export interface ContractListQuery {
  page?: number;
  limit?: number;
  employee_id?: number;
  company_id?: number;
  contract_type?: string;
  status?: string;
  expiring_within_days?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface MovementListQuery {
  page?: number;
  limit?: number;
  employee_id?: number;
  company_id?: number;
  movement_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ==========================================
// DTOs - Contract
// ==========================================

export interface CreateContractDTO {
  employee_id: number;
  contract_type: string;
  start_date: string;
  end_date?: string;
  duration_months?: number;
  salary?: number;
  position?: string;
  department?: string;
  terms?: string;
  benefits?: Record<string, any>;
  notes?: string;
}

export interface UpdateContractDTO {
  contract_type?: string;
  start_date?: string;
  end_date?: string;
  duration_months?: number;
  salary?: number;
  position?: string;
  department?: string;
  terms?: string;
  benefits?: Record<string, any>;
  notes?: string;
  status?: string;
}

export interface RenewContractDTO {
  new_start_date: string;
  new_end_date?: string;
  duration_months?: number;
  new_salary?: number;
  terms?: string;
  notes?: string;
}

export interface TerminateContractDTO {
  termination_date: string;
  termination_reason: string;
}

// ==========================================
// DTOs - Employee Movement
// ==========================================

export interface CreateMovementDTO {
  employee_id: number;
  movement_type: string;
  effective_date: string;
  new_position_id?: number;
  new_department_id?: number;
  new_company_id?: number;
  new_salary?: number;
  new_grade?: string;
  new_status?: string;
  reason?: string;
  notes?: string;
}

export interface ApproveMovementDTO {
  approval_notes?: string;
}

export interface RejectMovementDTO {
  rejection_reason: string;
}

// ==========================================
// SELECT FIELDS
// ==========================================

export const CONTRACT_LIST_SELECT = {
  id: true,
  employee_id: true,
  contract_number: true,
  contract_type: true,
  start_date: true,
  end_date: true,
  duration_months: true,
  salary: true,
  position: true,
  department: true,
  status: true,
  signed_date: true,
  signed_by_employee: true,
  signed_by_company: true,
  created_at: true,
  employee: {
    select: {
      id: true,
      name: true,
      employee_id: true,
    },
  },
} satisfies Prisma.ContractSelect;

export const CONTRACT_DETAIL_SELECT = {
  ...CONTRACT_LIST_SELECT,
  terms: true,
  benefits: true,
  notes: true,
  attachment_path: true,
  termination_date: true,
  termination_reason: true,
  renewed_from: true,
  updated_at: true,
} satisfies Prisma.ContractSelect;

export const MOVEMENT_LIST_SELECT = {
  id: true,
  employee_id: true,
  movement_type: true,
  effective_date: true,
  previous_position_name: true,
  new_position_name: true,
  previous_department_name: true,
  new_department_name: true,
  previous_salary: true,
  new_salary: true,
  salary_change: true,
  salary_change_percentage: true,
  status: true,
  is_applied: true,
  created_at: true,
  employee: {
    select: {
      id: true,
      name: true,
      employee_id: true,
    },
  },
} satisfies Prisma.EmployeeMovementSelect;

export const MOVEMENT_DETAIL_SELECT = {
  ...MOVEMENT_LIST_SELECT,
  company_id: true,
  previous_position_id: true,
  new_position_id: true,
  previous_department_id: true,
  new_department_id: true,
  previous_company_id: true,
  new_company_id: true,
  previous_company_name: true,
  new_company_name: true,
  previous_grade: true,
  new_grade: true,
  previous_status: true,
  new_status: true,
  reason: true,
  attachment: true,
  notes: true,
  requested_by: true,
  requested_at: true,
  approved_by: true,
  approved_at: true,
  rejected_by: true,
  rejected_at: true,
  approval_notes: true,
  rejection_reason: true,
  applied_at: true,
  updated_at: true,
  requester: {
    select: { id: true, name: true },
  },
  approver: {
    select: { id: true, name: true },
  },
} satisfies Prisma.EmployeeMovementSelect;
