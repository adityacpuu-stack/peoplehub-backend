import { Prisma } from '@prisma/client';

// ==========================================
// STATUS CONSTANTS
// ==========================================

export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
} as const;

export const HOLIDAY_TYPES = {
  NATIONAL: 'national',
  COMPANY: 'company',
  RELIGIOUS: 'religious',
  CUTI_BERSAMA: 'cuti_bersama',
} as const;

// ==========================================
// QUERY INTERFACES
// ==========================================

export interface LeaveTypeListQuery {
  page?: number;
  limit?: number;
  company_id?: number;
  is_active?: boolean;
  search?: string;
}

export interface LeaveListQuery {
  page?: number;
  limit?: number;
  employee_id?: number;
  company_id?: number;
  department_id?: number;
  leave_type_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface LeaveRequestListQuery extends LeaveListQuery {}

export interface LeaveBalanceQuery {
  employee_id?: number;
  company_id?: number;
  department_id?: number;
  year?: number;
  leave_type_id?: number;
}

export interface HolidayListQuery {
  page?: number;
  limit?: number;
  company_id?: number;
  year?: number;
  type?: string;
  is_active?: boolean;
}

// ==========================================
// DTOs - Leave Type
// ==========================================

export interface CreateLeaveTypeDTO {
  company_id?: number;
  name: string;
  code?: string;
  description?: string;
  default_days?: number;
  max_days_per_request?: number;
  min_days_per_request?: number;
  is_paid?: boolean;
  requires_document?: boolean;
  document_types?: string[];
  requires_approval?: boolean;
  min_notice_days?: number;
  max_advance_days?: number;
  approval_flow?: string[];
  color?: string;
  icon?: string;
  can_carry_forward?: boolean;
  max_carry_forward_days?: number;
  carry_forward_expiry_months?: number;
  prorate_on_join?: boolean;
  eligibility_rules?: Record<string, any>;
  gender_specific?: string;
  sort_order?: number;
}

export interface UpdateLeaveTypeDTO extends Partial<CreateLeaveTypeDTO> {
  is_active?: boolean;
}

// ==========================================
// DTOs - Leave
// ==========================================

export interface CreateLeaveDTO {
  leave_type_id?: number;
  start_date: string;
  end_date: string;
  start_half_day?: boolean;
  end_half_day?: boolean;
  reason?: string;
  is_emergency?: boolean;
  contact_during_leave?: string;
  work_handover?: string;
}

export interface CreateLeaveForEmployeeDTO extends CreateLeaveDTO {
  employee_id: number;
}

export interface UpdateLeaveDTO {
  start_date?: string;
  end_date?: string;
  start_half_day?: boolean;
  end_half_day?: boolean;
  reason?: string;
  is_emergency?: boolean;
  contact_during_leave?: string;
  work_handover?: string;
}

export interface ApproveLeaveDTO {
  approval_notes?: string;
}

export interface RejectLeaveDTO {
  rejection_reason: string;
}

// ==========================================
// DTOs - Leave Request
// ==========================================

export interface CreateLeaveRequestDTO {
  leave_type_id?: number;
  start_date: string;
  end_date: string;
  start_half_day?: boolean;
  end_half_day?: boolean;
  reason?: string;
  contact_during_leave?: string;
  work_handover_notes?: string;
  delegate_to?: number;
}

export interface UpdateLeaveRequestDTO extends Partial<CreateLeaveRequestDTO> {}

// ==========================================
// DTOs - Leave Balance
// ==========================================

export interface AdjustLeaveBalanceDTO {
  employee_id: number;
  leave_type_id: number;
  year: number;
  adjustment_days: number;
  adjustment_reason: string;
}

export interface AllocateLeaveDTO {
  employee_id: number;
  leave_type_id: number;
  year: number;
  allocated_days: number;
  carried_forward_days?: number;
  expires_at?: string;
}

// ==========================================
// DTOs - Leave Entitlement
// ==========================================

export interface CreateLeaveEntitlementDTO {
  company_id?: number;
  leave_type_id?: number;
  name: string;
  description?: string;
  quota_type?: string;
  quota_days?: number;
  accrual_frequency?: string;
  accrual_rate?: number;
  accrual_cap?: number;
  allow_carry_forward?: boolean;
  max_carry_forward?: number;
  carry_forward_expiry_months?: number;
  allow_negative_balance?: boolean;
  max_negative_balance?: number;
  prorate_on_join?: boolean;
  prorate_on_resign?: boolean;
  min_service_months?: number;
  applicable_departments?: number[];
  applicable_positions?: number[];
  applicable_employment_types?: string[];
  effective_from?: string;
  effective_until?: string;
}

export interface UpdateLeaveEntitlementDTO extends Partial<CreateLeaveEntitlementDTO> {
  is_active?: boolean;
}

// ==========================================
// DTOs - Holiday
// ==========================================

export interface CreateHolidayDTO {
  company_id?: number;
  name: string;
  date: string;
  type: string;
  description?: string;
  is_recurring?: boolean;
}

export interface UpdateHolidayDTO extends Partial<CreateHolidayDTO> {
  is_active?: boolean;
}

// ==========================================
// SELECT FIELDS
// ==========================================

export const LEAVE_TYPE_SELECT = {
  id: true,
  company_id: true,
  name: true,
  code: true,
  description: true,
  default_days: true,
  max_days_per_request: true,
  min_days_per_request: true,
  is_paid: true,
  requires_document: true,
  requires_approval: true,
  min_notice_days: true,
  is_active: true,
  color: true,
  icon: true,
  can_carry_forward: true,
  max_carry_forward_days: true,
  gender_specific: true,
  sort_order: true,
} satisfies Prisma.LeaveTypeSelect;

export const LEAVE_LIST_SELECT = {
  id: true,
  employee_id: true,
  leave_type_id: true,
  start_date: true,
  end_date: true,
  start_half_day: true,
  end_half_day: true,
  total_days: true,
  reason: true,
  status: true,
  is_emergency: true,
  approved_by: true,
  approved_at: true,
  rejection_reason: true,
  created_at: true,
  employee: {
    select: {
      id: true,
      name: true,
      employee_id: true,
      department: { select: { id: true, name: true } },
      position: { select: { id: true, name: true } },
    },
  },
  leaveType: {
    select: {
      id: true,
      name: true,
      code: true,
      is_paid: true,
      color: true,
    },
  },
  approver: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.LeaveSelect;

export const LEAVE_DETAIL_SELECT = {
  ...LEAVE_LIST_SELECT,
  document_path: true,
  document_name: true,
  approval_notes: true,
  rejected_by: true,
  rejected_at: true,
  cancelled_at: true,
  cancelled_reason: true,
  contact_during_leave: true,
  work_handover: true,
  deduction_amount: true,
  updated_at: true,
} satisfies Prisma.LeaveSelect;

export const LEAVE_REQUEST_LIST_SELECT = {
  id: true,
  employee_id: true,
  leave_type_id: true,
  start_date: true,
  end_date: true,
  start_half_day: true,
  end_half_day: true,
  days_requested: true,
  total_days: true,
  reason: true,
  status: true,
  current_approver: true,
  approval_level: true,
  requested_at: true,
  created_at: true,
  employee: {
    select: {
      id: true,
      name: true,
      employee_id: true,
      department: { select: { id: true, name: true } },
      position: { select: { id: true, name: true } },
    },
  },
  leaveType: {
    select: {
      id: true,
      name: true,
      code: true,
      is_paid: true,
      color: true,
    },
  },
} satisfies Prisma.LeaveRequestSelect;

export const LEAVE_BALANCE_SELECT = {
  id: true,
  employee_id: true,
  leave_type_id: true,
  year: true,
  allocated_days: true,
  used_days: true,
  pending_days: true,
  remaining_days: true,
  carried_forward_days: true,
  adjustment_days: true,
  adjustment_reason: true,
  expires_at: true,
  employee: {
    select: {
      id: true,
      name: true,
      employee_id: true,
    },
  },
  leaveType: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
} satisfies Prisma.EmployeeLeaveBalanceSelect;

export const HOLIDAY_SELECT = {
  id: true,
  company_id: true,
  name: true,
  date: true,
  type: true,
  description: true,
  is_recurring: true,
  is_active: true,
  created_at: true,
} satisfies Prisma.HolidaySelect;
