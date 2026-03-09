import { z } from 'zod';
import { paginationSchema } from './common.schema';

// ==========================================
// PAYROLL SETTING SCHEMAS
// ==========================================

export const createPayrollSettingSchema = z.object({
  company_id: z.coerce.number().int().positive({ message: 'company_id must be a positive integer' }),
  bpjs_kes_employee_rate: z.coerce.number().min(0).max(1).optional(),
  bpjs_kes_company_rate: z.coerce.number().min(0).max(1).optional(),
  bpjs_kes_max_salary: z.coerce.number().nonnegative().optional(),
  bpjs_jht_employee_rate: z.coerce.number().min(0).max(1).optional(),
  bpjs_jht_company_rate: z.coerce.number().min(0).max(1).optional(),
  bpjs_jp_employee_rate: z.coerce.number().min(0).max(1).optional(),
  bpjs_jp_company_rate: z.coerce.number().min(0).max(1).optional(),
  bpjs_jp_max_salary: z.coerce.number().nonnegative().optional(),
  bpjs_jkk_rate: z.coerce.number().min(0).max(1).optional(),
  bpjs_jkm_rate: z.coerce.number().min(0).max(1).optional(),
  use_ter_method: z.boolean().optional(),
  position_cost_rate: z.coerce.number().min(0).max(1).optional(),
  position_cost_max: z.coerce.number().nonnegative().optional(),
  overtime_rate_weekday: z.coerce.number().nonnegative().optional(),
  overtime_rate_weekend: z.coerce.number().nonnegative().optional(),
  overtime_rate_holiday: z.coerce.number().nonnegative().optional(),
  overtime_base: z.string().optional(),
  payroll_cutoff_date: z.coerce.number().int().min(1).max(31).optional(),
  payment_date: z.coerce.number().int().min(1).max(31).optional(),
  prorate_method: z.string().optional(),
  currency: z.string().max(3).optional(),
  enable_rounding: z.boolean().optional(),
  rounding_method: z.string().optional(),
  rounding_precision: z.coerce.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
});

export const updatePayrollSettingSchema = createPayrollSettingSchema
  .omit({ company_id: true })
  .partial();

// ==========================================
// TAX CONFIGURATION SCHEMAS (TER Rates)
// ==========================================

export const taxConfigurationListQuerySchema = paginationSchema.extend({
  tax_category: z.string().optional(),
  is_active: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
});

export const createTaxConfigurationSchema = z.object({
  tax_category: z.string().min(1, { message: 'tax_category is required' }),
  description: z.string().optional(),
  min_income: z.coerce.number().nonnegative().optional(),
  max_income: z.coerce.number().nonnegative().nullable().optional(),
  tax_rate: z.coerce.number().min(0).max(1).optional(),
  tax_amount: z.coerce.number().nonnegative().optional(),
  is_active: z.boolean().optional(),
  effective_from: z.coerce.date().optional(),
  effective_until: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const updateTaxConfigurationSchema = createTaxConfigurationSchema.partial();

// ==========================================
// TAX BRACKET SCHEMAS (Progressive)
// ==========================================

export const taxBracketListQuerySchema = paginationSchema.extend({
  company_id: z.coerce.number().int().positive().optional(),
  is_active: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
});

export const createTaxBracketSchema = z.object({
  bracket_name: z.string().min(1, { message: 'bracket_name is required' }),
  rate: z.coerce.number().min(0).max(1, { message: 'rate must be between 0 and 1' }),
  min_income: z.coerce.number().nonnegative({ message: 'min_income must be non-negative' }),
  max_income: z.coerce.number().nonnegative().nullable().optional(),
  is_active: z.boolean().optional(),
  company_id: z.coerce.number().int().positive().nullable().optional(),
});

export const updateTaxBracketSchema = createTaxBracketSchema.partial();

// ==========================================
// PTKP SCHEMAS
// ==========================================

export const ptkpListQuerySchema = paginationSchema.extend({
  company_id: z.coerce.number().int().positive().optional(),
  is_active: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
});

export const createPtkpSchema = z.object({
  status: z.string().min(1, { message: 'status is required' }),
  description: z.string().optional(),
  amount: z.coerce.number().nonnegative({ message: 'amount must be non-negative' }),
  is_active: z.boolean().optional(),
  company_id: z.coerce.number().int().positive().nullable().optional(),
});

export const updatePtkpSchema = createPtkpSchema.omit({ status: true }).partial();

// ==========================================
// UTILITY SCHEMAS
// ==========================================

export const terRateQuerySchema = z.object({
  income: z.coerce.number().nonnegative({ message: 'income is required and must be non-negative' }),
  ptkp_status: z.string().min(1, { message: 'ptkp_status is required' }),
});

export const progressiveTaxQuerySchema = z.object({
  income: z.coerce.number().nonnegative({ message: 'income is required and must be non-negative' }),
  company_id: z.coerce.number().int().positive().optional(),
});

export const seedBodySchema = z.object({
  company_id: z.coerce.number().int().positive().nullable().optional(),
});

export const companyIdParamSchema = z.object({
  companyId: z.coerce.number().int().positive({ message: 'companyId must be a positive integer' }),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive({ message: 'id must be a positive integer' }),
});
