import { Prisma } from '@prisma/client';

// ==========================================
// ENUMS / CONSTANTS
// ==========================================

export const ADJUSTMENT_TYPES = [
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
] as const;

export const ADJUSTMENT_STATUSES = ['pending', 'approved', 'rejected', 'processed', 'cancelled'] as const;
export const RECURRING_FREQUENCIES = ['monthly', 'quarterly', 'yearly'] as const;

export type AdjustmentType = typeof ADJUSTMENT_TYPES[number];
export type AdjustmentStatus = typeof ADJUSTMENT_STATUSES[number];

// ==========================================
// QUERY INTERFACES
// ==========================================

export interface PayrollAdjustmentListQuery {
  page?: number;
  limit?: number;
  search?: string;
  employee_id?: number;
  company_id?: number;
  type?: string;
  status?: string;
  pay_period?: string;
  effective_from?: string;
  effective_to?: string;
  is_recurring?: boolean;
}

// ==========================================
// DTOs
// ==========================================

export interface CreatePayrollAdjustmentDTO {
  employee_id: number;
  type: string;
  category?: string;
  amount: number;
  description?: string;
  reason?: string;
  effective_date?: Date;
  pay_period?: string;
  is_recurring?: boolean;
  recurring_frequency?: string;
  recurring_end_date?: Date;
  is_taxable?: boolean;
  is_bpjs_object?: boolean;
  reference_number?: string;
  attachment_path?: string;
  company_id?: number;
  total_loan_amount?: number;
  installment_amount?: number;
}

export interface UpdatePayrollAdjustmentDTO extends Partial<Omit<CreatePayrollAdjustmentDTO, 'employee_id'>> {
  status?: string;
  approved_by?: number;
  approved_at?: Date;
  rejection_reason?: string;
}

export interface BulkCreateAdjustmentDTO {
  employee_ids: number[];
  type: string;
  category?: string;
  amount: number;
  description?: string;
  reason?: string;
  effective_date?: Date;
  pay_period?: string;
  is_taxable?: boolean;
}

// ==========================================
// SELECT FIELDS
// ==========================================

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
  attachment_path: true,
  total_loan_amount: true,
  installment_amount: true,
  total_installments: true,
  current_installment: true,
  remaining_balance: true,
  company_id: true,
  created_by: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.PayrollAdjustmentSelect;

export const PAYROLL_ADJUSTMENT_DETAIL_SELECT = {
  ...PAYROLL_ADJUSTMENT_SELECT,
  employee: {
    select: {
      id: true,
      employee_id: true,
      name: true,
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      position: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.PayrollAdjustmentSelect;
