import { z } from 'zod';
import { paginationSchema, searchSchema } from './common.schema';

// ==========================================
// PAYROLL ADJUSTMENT ENUMS
// ==========================================

const adjustmentTypeSchema = z.enum([
  'bonus',
  'allowance',
  'reimbursement',
  'deduction',
  'penalty',
  'loan',
  'advance',
  'correction',
  'incentive',
  'commission',
]);

const adjustmentStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'processed',
  'cancelled',
]);

const recurringFrequencySchema = z.enum(['monthly', 'quarterly', 'yearly']);

// ==========================================
// CREATE PAYROLL ADJUSTMENT
// ==========================================

export const createPayrollAdjustmentSchema = z.object({
  employee_id: z.number().int().positive({ message: 'Employee ID must be a positive integer' }),
  type: adjustmentTypeSchema,
  category: z.string().optional(),
  amount: z.number().positive({ message: 'Amount must be a positive number' }),
  description: z.string().optional(),
  reason: z.string().optional(),
  effective_date: z.string().optional(),
  pay_period: z.string().optional(),
  is_recurring: z.boolean().optional(),
  recurring_frequency: recurringFrequencySchema.optional(),
  recurring_end_date: z.string().optional(),
  is_taxable: z.boolean().optional(),
  is_bpjs_object: z.boolean().optional(),
  reference_number: z.string().optional(),
  attachment_path: z.string().optional(),
  company_id: z.number().int().positive().optional(),
  total_loan_amount: z.number().positive({ message: 'Total loan amount must be positive' }).optional(),
  installment_amount: z.number().positive({ message: 'Installment amount must be positive' }).optional(),
});

// ==========================================
// UPDATE PAYROLL ADJUSTMENT
// ==========================================

export const updatePayrollAdjustmentSchema = z.object({
  type: adjustmentTypeSchema.optional(),
  category: z.string().optional(),
  amount: z.number().positive({ message: 'Amount must be a positive number' }).optional(),
  description: z.string().optional(),
  reason: z.string().optional(),
  effective_date: z.string().optional(),
  pay_period: z.string().optional(),
  is_recurring: z.boolean().optional(),
  recurring_frequency: recurringFrequencySchema.optional(),
  recurring_end_date: z.string().optional(),
  is_taxable: z.boolean().optional(),
  is_bpjs_object: z.boolean().optional(),
  reference_number: z.string().optional(),
  attachment_path: z.string().optional(),
  total_loan_amount: z.number().positive({ message: 'Total loan amount must be positive' }).optional(),
  installment_amount: z.number().positive({ message: 'Installment amount must be positive' }).optional(),
});

// ==========================================
// REJECT PAYROLL ADJUSTMENT
// ==========================================

export const rejectPayrollAdjustmentSchema = z.object({
  reason: z.string().min(1, { message: 'Rejection reason is required' }),
});

// ==========================================
// BULK CREATE
// ==========================================

export const bulkCreateAdjustmentSchema = z.object({
  employee_ids: z.array(z.number().int().positive()).min(1, { message: 'At least one employee ID is required' }),
  type: adjustmentTypeSchema,
  category: z.string().optional(),
  amount: z.number().positive({ message: 'Amount must be a positive number' }),
  description: z.string().optional(),
  reason: z.string().optional(),
  effective_date: z.string().optional(),
  pay_period: z.string().optional(),
  is_taxable: z.boolean().optional(),
});

// ==========================================
// BULK APPROVE
// ==========================================

export const bulkApproveSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, { message: 'At least one adjustment ID is required' }),
});

// ==========================================
// LIST QUERY
// ==========================================

export const listPayrollAdjustmentQuerySchema = paginationSchema.merge(searchSchema).extend({
  employee_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  type: adjustmentTypeSchema.optional(),
  status: adjustmentStatusSchema.optional(),
  pay_period: z.string().optional(),
  effective_from: z.string().optional(),
  effective_to: z.string().optional(),
  is_recurring: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

// ==========================================
// EMPLOYEE ADJUSTMENTS QUERY
// ==========================================

export const employeeAdjustmentQuerySchema = z.object({
  status: adjustmentStatusSchema.optional(),
  type: adjustmentTypeSchema.optional(),
});

// ==========================================
// PENDING / STATISTICS QUERY
// ==========================================

export const pendingApprovalsQuerySchema = z.object({
  company_id: z.coerce.number().int().positive().optional(),
});

export const statisticsQuerySchema = z.object({
  company_id: z.coerce.number().int().positive().optional(),
  pay_period: z.string().optional(),
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type CreatePayrollAdjustmentInput = z.infer<typeof createPayrollAdjustmentSchema>;
export type UpdatePayrollAdjustmentInput = z.infer<typeof updatePayrollAdjustmentSchema>;
export type ListPayrollAdjustmentQuery = z.infer<typeof listPayrollAdjustmentQuerySchema>;
