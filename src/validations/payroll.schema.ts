import { z } from 'zod';
import { paginationSchema } from './common.schema';

// ==========================================
// PERIOD FORMAT
// ==========================================

const periodSchema = z.string().regex(/^\d{4}-\d{2}$/, 'Invalid period format. Use YYYY-MM');

// ==========================================
// QUERY SCHEMAS
// ==========================================

export const payrollListQuerySchema = paginationSchema.extend({
  employee_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  department_id: z.coerce.number().int().positive().optional(),
  period: periodSchema.optional(),
  status: z.string().optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

export const myPayrollQuerySchema = paginationSchema.extend({
  period: periodSchema.optional(),
  status: z.string().optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

export const salaryComponentQuerySchema = paginationSchema.extend({
  company_id: z.coerce.number().int().positive().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  is_active: z.enum(['true', 'false']).optional(),
});

export const adjustmentQuerySchema = paginationSchema.extend({
  employee_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  pay_period: periodSchema.optional(),
});

export const exportQuerySchema = z.object({
  company_id: z.coerce.number().int().positive().optional(),
  period: periodSchema,
});

export const freelanceExportQuerySchema = z.object({
  period: periodSchema,
  cutoff_date: z.coerce.number().int().min(1).max(31).optional(),
});

// ==========================================
// BODY SCHEMAS - Payroll
// ==========================================

export const generatePayrollSchema = z.object({
  company_id: z.coerce.number().int().positive(),
  period: periodSchema,
  employee_ids: z.array(z.coerce.number().int().positive()).optional(),
});

export const calculatePayrollSchema = z.object({
  employee_id: z.coerce.number().int().positive(),
  period: periodSchema,
  pay_type: z.string().optional(),
  basic_salary: z.number().nonnegative().optional(),
  overtime_hours: z.number().nonnegative().optional(),
  overtime_pay: z.number().nonnegative().optional(),
  working_days: z.number().int().nonnegative().optional(),
  actual_working_days: z.number().int().nonnegative().optional(),
  absent_days: z.number().int().nonnegative().optional(),
  late_days: z.number().int().nonnegative().optional(),
  leave_days: z.number().int().nonnegative().optional(),
});

export const updatePayrollSchema = z.object({
  basic_salary: z.number().nonnegative().optional(),
  transport_allowance: z.number().nonnegative().optional(),
  meal_allowance: z.number().nonnegative().optional(),
  position_allowance: z.number().nonnegative().optional(),
  other_allowances: z.number().nonnegative().optional(),
  allowances_detail: z.record(z.string(), z.any()).optional(),
  overtime_hours: z.number().nonnegative().optional(),
  overtime_pay: z.number().nonnegative().optional(),
  bonus: z.number().nonnegative().optional(),
  thr: z.number().nonnegative().optional(),
  incentive: z.number().nonnegative().optional(),
  loan_deduction: z.number().nonnegative().optional(),
  absence_deduction: z.number().nonnegative().optional(),
  late_deduction: z.number().nonnegative().optional(),
  other_deductions: z.number().nonnegative().optional(),
  deductions_detail: z.record(z.string(), z.any()).optional(),
  notes: z.string().optional(),
  hr_notes: z.string().optional(),
});

export const approvePayrollSchema = z.object({
  approval_notes: z.string().optional(),
});

export const rejectPayrollSchema = z.object({
  rejection_reason: z.string().min(1, 'Rejection reason is required'),
});

export const markAsPaidSchema = z.object({
  payment_reference: z.string().optional(),
  payment_method: z.string().optional(),
});

// ==========================================
// BODY SCHEMAS - Bulk Operations
// ==========================================

export const bulkIdsSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1, 'Payroll IDs array is required'),
});

export const bulkApproveSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1, 'Payroll IDs array is required'),
  approval_notes: z.string().optional(),
});

export const bulkRejectSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1, 'Payroll IDs array is required'),
  rejection_reason: z.string().min(1, 'Rejection reason is required'),
});

// ==========================================
// BODY SCHEMAS - Payroll Settings
// ==========================================

export const updatePayrollSettingSchema = z.object({
  bpjs_kes_employee_rate: z.number().min(0).max(1).optional(),
  bpjs_kes_company_rate: z.number().min(0).max(1).optional(),
  bpjs_kes_max_salary: z.number().nonnegative().optional(),
  bpjs_jht_employee_rate: z.number().min(0).max(1).optional(),
  bpjs_jht_company_rate: z.number().min(0).max(1).optional(),
  bpjs_jp_employee_rate: z.number().min(0).max(1).optional(),
  bpjs_jp_company_rate: z.number().min(0).max(1).optional(),
  bpjs_jp_max_salary: z.number().nonnegative().optional(),
  bpjs_jkk_rate: z.number().min(0).max(1).optional(),
  bpjs_jkm_rate: z.number().min(0).max(1).optional(),
  use_ter_method: z.boolean().optional(),
  position_cost_rate: z.number().min(0).max(1).optional(),
  position_cost_max: z.number().nonnegative().optional(),
  overtime_rate_weekday: z.number().nonnegative().optional(),
  overtime_rate_weekend: z.number().nonnegative().optional(),
  overtime_rate_holiday: z.number().nonnegative().optional(),
  overtime_base: z.string().optional(),
  payroll_cutoff_date: z.number().int().min(1).max(31).optional(),
  payment_date: z.number().int().min(1).max(31).optional(),
  prorate_method: z.string().optional(),
  currency: z.string().optional(),
  enable_rounding: z.boolean().optional(),
  rounding_method: z.string().optional(),
  rounding_precision: z.number().int().nonnegative().optional(),
});

// ==========================================
// BODY SCHEMAS - Salary Component
// ==========================================

export const createSalaryComponentSchema = z.object({
  company_id: z.coerce.number().int().positive().optional(),
  name: z.string().min(1, 'Name is required'),
  code: z.string().optional(),
  type: z.string().min(1, 'Type is required'),
  category: z.string().optional(),
  amount: z.number().nonnegative().optional(),
  percentage: z.number().min(0).max(100).optional(),
  formula: z.string().optional(),
  calculation_base: z.string().optional(),
  is_taxable: z.boolean().optional(),
  is_bpjs_object: z.boolean().optional(),
  is_recurring: z.boolean().optional(),
  effective_from: z.string().optional(),
  effective_until: z.string().optional(),
  applicable_to: z.record(z.string(), z.any()).optional(),
  description: z.string().optional(),
  sort_order: z.number().int().nonnegative().optional(),
});

export const updateSalaryComponentSchema = createSalaryComponentSchema.partial().extend({
  is_active: z.boolean().optional(),
});

// ==========================================
// BODY SCHEMAS - Salary Grade
// ==========================================

export const createSalaryGradeSchema = z.object({
  grade_code: z.string().min(1, 'Grade code is required'),
  grade_name: z.string().min(1, 'Grade name is required'),
  level: z.number().int().nonnegative().optional(),
  min_salary: z.number().nonnegative().optional(),
  max_salary: z.number().nonnegative().optional(),
  mid_salary: z.number().nonnegative().optional(),
  allowances: z.record(z.string(), z.any()).optional(),
  description: z.string().optional(),
});

export const updateSalaryGradeSchema = createSalaryGradeSchema.partial().extend({
  status: z.string().optional(),
});

// ==========================================
// BODY SCHEMAS - Payroll Adjustment
// ==========================================

export const createAdjustmentSchema = z.object({
  employee_id: z.coerce.number().int().positive(),
  type: z.string().min(1, 'Type is required'),
  category: z.string().optional(),
  amount: z.number({ message: 'Amount is required' }),
  description: z.string().optional(),
  reason: z.string().optional(),
  effective_date: z.string().optional(),
  pay_period: periodSchema.optional(),
  is_recurring: z.boolean().optional(),
  recurring_frequency: z.string().optional(),
  recurring_end_date: z.string().optional(),
  is_taxable: z.boolean().optional(),
  is_bpjs_object: z.boolean().optional(),
  reference_number: z.string().optional(),
});

export const approveAdjustmentSchema = z.object({
  approval_notes: z.string().optional(),
});

export const rejectAdjustmentSchema = z.object({
  rejection_reason: z.string().min(1, 'Rejection reason is required'),
});

// ==========================================
// PARAM SCHEMAS
// ==========================================

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const companyIdParamSchema = z.object({
  companyId: z.coerce.number().int().positive(),
});
