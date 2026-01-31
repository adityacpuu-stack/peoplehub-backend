import { Prisma } from '@prisma/client';

// ==========================================
// QUERY INTERFACES
// ==========================================

export interface LeaveTypeListQuery {
  page?: number;
  limit?: number;
  search?: string;
  company_id?: number;
  is_active?: boolean;
  is_paid?: boolean;
}

export interface LeaveEntitlementListQuery {
  page?: number;
  limit?: number;
  company_id?: number;
  leave_type_id?: number;
  is_active?: boolean;
}

export interface EmployeeLeaveBalanceQuery {
  employee_id?: number;
  leave_type_id?: number;
  year?: number;
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
  is_active?: boolean;
  sort_order?: number;
  color?: string;
  icon?: string;
  can_carry_forward?: boolean;
  max_carry_forward_days?: number;
  carry_forward_expiry_months?: number;
  prorate_on_join?: boolean;
  eligibility_rules?: any;
  gender_specific?: string;
}

export interface UpdateLeaveTypeDTO extends Partial<CreateLeaveTypeDTO> {}

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
  effective_from?: Date;
  effective_until?: Date;
  is_active?: boolean;
}

export interface UpdateLeaveEntitlementDTO extends Partial<CreateLeaveEntitlementDTO> {}

// ==========================================
// DTOs - Employee Leave Balance
// ==========================================

export interface CreateEmployeeLeaveBalanceDTO {
  employee_id: number;
  leave_type_id?: number;
  year: number;
  allocated_days: number;
  carried_forward_days?: number;
  adjustment_days?: number;
  adjustment_reason?: string;
  expires_at?: Date;
}

export interface UpdateEmployeeLeaveBalanceDTO {
  allocated_days?: number;
  used_days?: number;
  pending_days?: number;
  carried_forward_days?: number;
  adjustment_days?: number;
  adjustment_reason?: string;
  expires_at?: Date;
}

export interface AdjustLeaveBalanceDTO {
  adjustment_days: number;
  adjustment_reason: string;
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
  document_types: true,
  requires_approval: true,
  min_notice_days: true,
  max_advance_days: true,
  approval_flow: true,
  is_active: true,
  sort_order: true,
  color: true,
  icon: true,
  can_carry_forward: true,
  max_carry_forward_days: true,
  carry_forward_expiry_months: true,
  prorate_on_join: true,
  eligibility_rules: true,
  gender_specific: true,
  created_at: true,
  updated_at: true,
  _count: {
    select: {
      leaves: true,
      leaveRequests: true,
      employeeBalances: true,
    },
  },
} satisfies Prisma.LeaveTypeSelect;

export const LEAVE_ENTITLEMENT_SELECT = {
  id: true,
  company_id: true,
  leave_type_id: true,
  name: true,
  description: true,
  quota_type: true,
  quota_days: true,
  accrual_frequency: true,
  accrual_rate: true,
  accrual_cap: true,
  allow_carry_forward: true,
  max_carry_forward: true,
  carry_forward_expiry_months: true,
  allow_negative_balance: true,
  max_negative_balance: true,
  prorate_on_join: true,
  prorate_on_resign: true,
  min_service_months: true,
  applicable_departments: true,
  applicable_positions: true,
  applicable_employment_types: true,
  effective_from: true,
  effective_until: true,
  is_active: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.LeaveEntitlementSelect;

export const LEAVE_ENTITLEMENT_DETAIL_SELECT = {
  ...LEAVE_ENTITLEMENT_SELECT,
  company: {
    select: {
      id: true,
      name: true,
    },
  },
  leaveType: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
} satisfies Prisma.LeaveEntitlementSelect;

export const EMPLOYEE_LEAVE_BALANCE_SELECT = {
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
  created_at: true,
  updated_at: true,
} satisfies Prisma.EmployeeLeaveBalanceSelect;

export const EMPLOYEE_LEAVE_BALANCE_DETAIL_SELECT = {
  ...EMPLOYEE_LEAVE_BALANCE_SELECT,
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
      is_paid: true,
    },
  },
} satisfies Prisma.EmployeeLeaveBalanceSelect;

// ==========================================
// DEFAULT LEAVE TYPES
// ==========================================

export const DEFAULT_LEAVE_TYPES = [
  {
    name: 'Cuti Tahunan',
    code: 'ANNUAL',
    description: 'Cuti tahunan untuk karyawan tetap',
    default_days: 12,
    max_days_per_request: 12,
    min_days_per_request: 0.5,
    is_paid: true,
    requires_approval: true,
    min_notice_days: 3,
    can_carry_forward: true,
    max_carry_forward_days: 6,
    carry_forward_expiry_months: 6,
    prorate_on_join: true,
    color: '#4CAF50',
    sort_order: 1,
  },
  {
    name: 'Cuti Sakit',
    code: 'SICK',
    description: 'Cuti sakit dengan surat keterangan dokter',
    default_days: 12,
    max_days_per_request: 30,
    min_days_per_request: 0.5,
    is_paid: true,
    requires_document: true,
    document_types: ['medical_certificate'],
    requires_approval: true,
    min_notice_days: 0,
    color: '#F44336',
    sort_order: 2,
  },
  {
    name: 'Cuti Melahirkan',
    code: 'MATERNITY',
    description: 'Cuti melahirkan untuk karyawan wanita',
    default_days: 90,
    max_days_per_request: 90,
    min_days_per_request: 90,
    is_paid: true,
    requires_document: true,
    document_types: ['medical_certificate'],
    requires_approval: true,
    min_notice_days: 30,
    gender_specific: 'female',
    color: '#E91E63',
    sort_order: 3,
  },
  {
    name: 'Cuti Ayah',
    code: 'PATERNITY',
    description: 'Cuti untuk karyawan pria yang istrinya melahirkan',
    default_days: 2,
    max_days_per_request: 2,
    min_days_per_request: 1,
    is_paid: true,
    requires_document: true,
    document_types: ['birth_certificate'],
    requires_approval: true,
    min_notice_days: 0,
    gender_specific: 'male',
    color: '#2196F3',
    sort_order: 4,
  },
  {
    name: 'Cuti Menikah',
    code: 'MARRIAGE',
    description: 'Cuti untuk karyawan yang menikah',
    default_days: 3,
    max_days_per_request: 3,
    min_days_per_request: 3,
    is_paid: true,
    requires_document: true,
    document_types: ['marriage_certificate'],
    requires_approval: true,
    min_notice_days: 14,
    color: '#9C27B0',
    sort_order: 5,
  },
  {
    name: 'Cuti Duka',
    code: 'BEREAVEMENT',
    description: 'Cuti karena keluarga meninggal',
    default_days: 3,
    max_days_per_request: 3,
    min_days_per_request: 1,
    is_paid: true,
    requires_document: true,
    document_types: ['death_certificate'],
    requires_approval: true,
    min_notice_days: 0,
    color: '#607D8B',
    sort_order: 6,
  },
  {
    name: 'Cuti Tanpa Gaji',
    code: 'UNPAID',
    description: 'Cuti tanpa dibayar',
    default_days: 0,
    max_days_per_request: 30,
    min_days_per_request: 1,
    is_paid: false,
    requires_approval: true,
    min_notice_days: 7,
    color: '#795548',
    sort_order: 7,
  },
  {
    name: 'Cuti Haji/Umroh',
    code: 'HAJJ',
    description: 'Cuti untuk menunaikan ibadah haji/umroh',
    default_days: 40,
    max_days_per_request: 40,
    min_days_per_request: 14,
    is_paid: true,
    requires_document: true,
    document_types: ['hajj_documents'],
    requires_approval: true,
    min_notice_days: 30,
    color: '#00BCD4',
    sort_order: 8,
  },
];
