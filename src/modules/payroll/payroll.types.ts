import { Prisma } from '@prisma/client';

// ==========================================
// STATUS CONSTANTS
// ==========================================

export const PAYROLL_STATUS = {
  DRAFT: 'draft',
  PROCESSING: 'processing',
  VALIDATED: 'validated',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid',
  CANCELLED: 'cancelled',
} as const;

export const PAY_TYPES = {
  GROSS: 'gross',
  NET: 'net',
  GROSS_UP: 'gross_up',
} as const;

export const COMPONENT_TYPES = {
  EARNING: 'earning',
  DEDUCTION: 'deduction',
  TAX: 'tax',
  BPJS: 'bpjs',
} as const;

export const ADJUSTMENT_TYPES = {
  BONUS: 'bonus',
  ALLOWANCE: 'allowance',
  REIMBURSEMENT: 'reimbursement',
  DEDUCTION: 'deduction',
  PENALTY: 'penalty',
  LOAN: 'loan',
  ADVANCE: 'advance',
} as const;

// ==========================================
// QUERY INTERFACES
// ==========================================

export interface PayrollListQuery {
  page?: number;
  limit?: number;
  employee_id?: number;
  company_id?: number;
  department_id?: number;
  period?: string;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PayrollSettingQuery {
  company_id: number;
}

export interface SalaryComponentQuery {
  page?: number;
  limit?: number;
  company_id?: number;
  type?: string;
  category?: string;
  is_active?: boolean;
}

export interface PayrollAdjustmentQuery {
  page?: number;
  limit?: number;
  employee_id?: number;
  company_id?: number;
  type?: string;
  status?: string;
  pay_period?: string;
}

// ==========================================
// DTOs - Payroll
// ==========================================

export interface GeneratePayrollDTO {
  company_id: number;
  period: string; // YYYY-MM format
  employee_ids?: number[]; // If not provided, generate for all employees
}

export interface CalculatePayrollDTO {
  employee_id: number;
  period: string;
  pay_type?: string;
  basic_salary?: number;
  allowances?: Record<string, number>;
  deductions?: Record<string, number>;
  overtime_hours?: number;
  overtime_pay?: number; // Pre-calculated overtime pay from approved overtime records
  additional_allowances?: number; // Pre-calculated allowances from approved allowance records (legacy)
  additional_allowances_by_type?: {
    position?: number;
    transport?: number;
    meal?: number;
    housing?: number;
    communication?: number;
    medical?: number;
    performance?: number;
    attendance?: number;
    thr?: number;
    bonus?: number;
    other?: number;
  }; // Allowances from table categorized by type
  allowance_details?: Array<{ name: string; type: string; amount: number }>; // Allowance breakdown
  working_days?: number;
  actual_working_days?: number;
  absent_days?: number;
  late_days?: number;
  leave_days?: number;
}

export interface UpdatePayrollDTO {
  basic_salary?: number;
  transport_allowance?: number;
  meal_allowance?: number;
  position_allowance?: number;
  other_allowances?: number;
  allowances_detail?: Record<string, any>;
  overtime_hours?: number;
  overtime_pay?: number;
  bonus?: number;
  thr?: number;
  incentive?: number;
  loan_deduction?: number;
  absence_deduction?: number;
  late_deduction?: number;
  other_deductions?: number;
  deductions_detail?: Record<string, any>;
  notes?: string;
  hr_notes?: string;
}

export interface ApprovePayrollDTO {
  approval_notes?: string;
}

export interface RejectPayrollDTO {
  rejection_reason: string;
}

export interface MarkAsPaidDTO {
  payment_reference?: string;
  payment_method?: string;
}

// ==========================================
// DTOs - Payroll Settings
// ==========================================

export interface UpdatePayrollSettingDTO {
  bpjs_kes_employee_rate?: number;
  bpjs_kes_company_rate?: number;
  bpjs_kes_max_salary?: number;
  bpjs_jht_employee_rate?: number;
  bpjs_jht_company_rate?: number;
  bpjs_jp_employee_rate?: number;
  bpjs_jp_company_rate?: number;
  bpjs_jp_max_salary?: number;
  bpjs_jkk_rate?: number;
  bpjs_jkm_rate?: number;
  use_ter_method?: boolean;
  position_cost_rate?: number;
  position_cost_max?: number;
  overtime_rate_weekday?: number;
  overtime_rate_weekend?: number;
  overtime_rate_holiday?: number;
  overtime_base?: string;
  payroll_cutoff_date?: number;
  payment_date?: number;
  prorate_method?: string;
  currency?: string;
  enable_rounding?: boolean;
  rounding_method?: string;
  rounding_precision?: number;
}

// ==========================================
// DTOs - Salary Component
// ==========================================

export interface CreateSalaryComponentDTO {
  company_id?: number;
  name: string;
  code?: string;
  type: string;
  category?: string;
  amount?: number;
  percentage?: number;
  formula?: string;
  calculation_base?: string;
  is_taxable?: boolean;
  is_bpjs_object?: boolean;
  is_recurring?: boolean;
  effective_from?: string;
  effective_until?: string;
  applicable_to?: Record<string, any>;
  description?: string;
  sort_order?: number;
}

export interface UpdateSalaryComponentDTO extends Partial<CreateSalaryComponentDTO> {
  is_active?: boolean;
}

// ==========================================
// DTOs - Salary Grade
// ==========================================

export interface CreateSalaryGradeDTO {
  grade_code: string;
  grade_name: string;
  level?: number;
  min_salary?: number;
  max_salary?: number;
  mid_salary?: number;
  allowances?: Record<string, any>;
  description?: string;
}

export interface UpdateSalaryGradeDTO extends Partial<CreateSalaryGradeDTO> {
  status?: string;
}

// ==========================================
// DTOs - Payroll Adjustment
// ==========================================

export interface CreatePayrollAdjustmentDTO {
  employee_id: number;
  type: string;
  category?: string;
  amount: number;
  description?: string;
  reason?: string;
  effective_date?: string;
  pay_period?: string;
  is_recurring?: boolean;
  recurring_frequency?: string;
  recurring_end_date?: string;
  is_taxable?: boolean;
  is_bpjs_object?: boolean;
  reference_number?: string;
}

export interface UpdatePayrollAdjustmentDTO extends Partial<CreatePayrollAdjustmentDTO> {}

export interface ApproveAdjustmentDTO {
  approval_notes?: string;
}

export interface RejectAdjustmentDTO {
  rejection_reason: string;
}

// ==========================================
// SELECT FIELDS
// ==========================================

export const PAYROLL_LIST_SELECT = {
  id: true,
  employee_id: true,
  payroll_number: true,
  period: true,
  period_start: true,
  period_end: true,
  pay_type: true,
  basic_salary: true,
  gross_salary: true,
  total_deductions: true,
  pph21: true,
  ter_rate: true,
  ter_category: true,
  bpjs_employee_total: true,
  net_salary: true,
  take_home_pay: true,
  thp: true,
  status: true,
  paid_at: true,
  created_at: true,
  employee: {
    select: {
      id: true,
      name: true,
      employee_id: true,
      employment_type: true,
      employment_status: true,
      department: { select: { id: true, name: true } },
      position: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.PayrollSelect;

export const PAYROLL_DETAIL_SELECT = {
  ...PAYROLL_LIST_SELECT,
  company_id: true,
  transport_allowance: true,
  meal_allowance: true,
  position_allowance: true,
  other_allowances: true,
  allowances_detail: true,
  overtime_hours: true,
  overtime_rate: true,
  overtime_pay: true,
  bonus: true,
  thr: true,
  incentive: true,
  commission: true,
  back_pay: true,
  deductions_detail: true,
  loan_deduction: true,
  absence_deduction: true,
  late_deduction: true,
  other_deductions: true,
  taxable_income: true,
  pph21_paid_by_company: true,
  ter_rate: true,
  ter_rate_initial: true,
  ter_category: true,
  ptkp_status: true,
  ptkp_amount: true,
  // Gross Up values
  gross_up_initial: true,
  final_gross_up: true,
  total_gross: true,
  bpjs_object_pph21: true,
  thp: true,
  total_cost_company: true,
  bpjs_kes_employee: true,
  bpjs_jht_employee: true,
  bpjs_jp_employee: true,
  bpjs_kes_company: true,
  bpjs_jht_company: true,
  bpjs_jp_company: true,
  bpjs_jkk_company: true,
  bpjs_jkm_company: true,
  bpjs_company_total: true,
  total_cost_to_company: true,
  working_days: true,
  actual_working_days: true,
  absent_days: true,
  late_days: true,
  leave_days: true,
  validated_by: true,
  validated_at: true,
  submitted_by: true,
  submitted_at: true,
  approved_by: true,
  approved_at: true,
  rejected_by: true,
  rejected_at: true,
  rejection_reason: true,
  paid_by: true,
  payment_reference: true,
  payment_method: true,
  notes: true,
  hr_notes: true,
  is_prorated: true,
  prorate_factor: true,
  prorate_reason: true,
  updated_at: true,
  details: {
    select: {
      id: true,
      component_type: true,
      component_name: true,
      component_code: true,
      description: true,
      amount: true,
      is_taxable: true,
      is_bpjs_object: true,
      calculation_base: true,
      calculation_value: true,
      sort_order: true,
    },
  },
} satisfies Prisma.PayrollSelect;

export const PAYROLL_SETTING_SELECT = {
  id: true,
  company_id: true,
  bpjs_kes_employee_rate: true,
  bpjs_kes_company_rate: true,
  bpjs_kes_max_salary: true,
  bpjs_jht_employee_rate: true,
  bpjs_jht_company_rate: true,
  bpjs_jp_employee_rate: true,
  bpjs_jp_company_rate: true,
  bpjs_jp_max_salary: true,
  bpjs_jkk_rate: true,
  bpjs_jkm_rate: true,
  use_ter_method: true,
  position_cost_rate: true,
  position_cost_max: true,
  overtime_rate_weekday: true,
  overtime_rate_weekend: true,
  overtime_rate_holiday: true,
  overtime_base: true,
  payroll_cutoff_date: true,
  payment_date: true,
  prorate_method: true,
  currency: true,
  enable_rounding: true,
  rounding_method: true,
  rounding_precision: true,
  is_active: true,
} satisfies Prisma.PayrollSettingSelect;

export const SALARY_COMPONENT_SELECT = {
  id: true,
  company_id: true,
  name: true,
  code: true,
  type: true,
  category: true,
  amount: true,
  percentage: true,
  formula: true,
  calculation_base: true,
  is_taxable: true,
  is_bpjs_object: true,
  is_active: true,
  is_recurring: true,
  effective_from: true,
  effective_until: true,
  description: true,
  sort_order: true,
} satisfies Prisma.SalaryComponentSelect;

export const SALARY_GRADE_SELECT = {
  id: true,
  grade_code: true,
  grade_name: true,
  level: true,
  min_salary: true,
  max_salary: true,
  mid_salary: true,
  allowances: true,
  description: true,
  status: true,
} satisfies Prisma.SalaryGradeSelect;

export const PAYROLL_ADJUSTMENT_SELECT = {
  id: true,
  employee_id: true,
  type: true,
  category: true,
  amount: true,
  description: true,
  reason: true,
  effective_date: true,
  pay_period: true,
  status: true,
  approved_by: true,
  approved_at: true,
  rejection_reason: true,
  is_recurring: true,
  recurring_frequency: true,
  recurring_end_date: true,
  is_taxable: true,
  is_bpjs_object: true,
  reference_number: true,
  created_at: true,
  employee: {
    select: {
      id: true,
      name: true,
      employee_id: true,
    },
  },
} satisfies Prisma.PayrollAdjustmentSelect;

// ==========================================
// CALCULATION INTERFACES
// ==========================================

export interface BPJSCalculation {
  // Employee contributions
  bpjs_kes_employee: number;
  bpjs_jht_employee: number;
  bpjs_jp_employee: number;
  bpjs_employee_total: number;
  // Company contributions
  bpjs_kes_company: number;
  bpjs_jht_company: number;
  bpjs_jp_company: number;
  bpjs_jkk_company: number;
  bpjs_jkm_company: number;
  bpjs_company_total: number;
}

export interface TaxCalculation {
  taxable_income: number;
  pph21: number;
  pph21_paid_by_company: boolean;  // True if NET/GROSS_UP method
  ter_rate?: number;
  ter_category?: string;
  ptkp_status?: string;
  ptkp_amount?: number;
}

export interface PayrollCalculationResult {
  basic_salary: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  take_home_pay: number;
  total_cost_to_company: number;
  bpjs: BPJSCalculation;
  tax: TaxCalculation;
  prorate?: ProrateCalculation;
  deductions?: DeductionCalculation;
  // Prorated allowances
  transport_allowance?: number;
  meal_allowance?: number;
  position_allowance?: number;
  // Overtime
  overtime_pay?: number;
}

// ==========================================
// PRORATE CALCULATION INTERFACES
// ==========================================

export const PRORATE_METHODS = {
  WORKING_DAYS: 'working_days',     // Hari kerja (Senin-Jumat) - libur
  CALENDAR_DAYS: 'calendar_days',   // Hari kalender
  CUSTOM: 'custom',                 // Manual input
} as const;

export interface ProrateCalculation {
  is_prorated: boolean;
  prorate_factor: number;           // 0.0 - 1.0
  actual_days: number;              // Hari kerja aktual
  total_days: number;               // Total hari kerja dalam periode
  prorate_reason?: string;          // Alasan prorate (join, resign, unpaid leave)
  employee_start_date?: Date;       // Tanggal mulai karyawan dalam periode
  employee_end_date?: Date;         // Tanggal akhir karyawan dalam periode
  unpaid_leave_days: number;        // Hari cuti tidak dibayar
}

export interface ProrateInput {
  period: string;                   // YYYY-MM format
  employee_id: number;
  join_date?: Date | string;        // Tanggal join karyawan
  resign_date?: Date | string;      // Tanggal resign karyawan
  unpaid_leave_days?: number;       // Hari cuti tidak dibayar
  prorate_method?: string;          // working_days | calendar_days | custom
  custom_factor?: number;           // Untuk manual prorate
  company_id?: number;              // Untuk ambil data holiday
}

// ==========================================
// DEDUCTION CALCULATION INTERFACES
// ==========================================

export const DEDUCTION_TYPES = {
  ABSENCE: 'absence',           // Potongan tidak hadir (alpha)
  LATE: 'late',                 // Potongan keterlambatan
  LOAN: 'loan',                 // Potongan pinjaman
  ADVANCE: 'advance',           // Potongan kasbon
  LEAVE: 'leave',               // Potongan cuti tidak dibayar
  PENALTY: 'penalty',           // Potongan denda
  OTHER: 'other',               // Potongan lainnya
} as const;

export interface DeductionCalculation {
  absence_deduction: number;      // Potongan tidak hadir
  late_deduction: number;         // Potongan keterlambatan
  loan_deduction: number;         // Potongan pinjaman
  advance_deduction: number;      // Potongan kasbon
  leave_deduction: number;        // Potongan cuti tidak dibayar
  penalty_deduction: number;      // Potongan denda
  other_deductions: number;       // Potongan lainnya
  total_deductions: number;       // Total semua potongan
  deduction_details: DeductionDetail[];
}

export interface DeductionDetail {
  type: string;
  description: string;
  amount: number;
  reference_id?: number;          // ID referensi (adjustment, attendance, leave)
}

export interface DeductionInput {
  employee_id: number;
  period: string;
  basic_salary: number;
  working_days: number;           // Total hari kerja dalam periode
  absent_days?: number;           // Hari tidak hadir (alpha)
  late_minutes?: number;          // Total menit keterlambatan
  late_days?: number;             // Hari keterlambatan (alternatif)
  unpaid_leave_days?: number;     // Hari cuti tidak dibayar
  company_id?: number;
}

export interface DeductionRates {
  absence_rate: number;           // Rate potongan per hari tidak hadir (default: 1.0 = 1 hari gaji)
  late_rate_per_minute: number;   // Rate potongan per menit keterlambatan
  late_rate_per_day: number;      // Rate potongan per hari keterlambatan (alternatif)
  late_tolerance_minutes: number; // Toleransi keterlambatan (menit)
  leave_rate: number;             // Rate potongan cuti tidak dibayar (default: 1.0)
}
