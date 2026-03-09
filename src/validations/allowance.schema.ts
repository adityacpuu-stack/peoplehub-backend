import { z } from 'zod';
import {
  paginationSchema,
  searchSchema,
  idParamSchema,
  dateStringSchema,
} from './common.schema';
import {
  ALLOWANCE_TYPES,
  ALLOWANCE_STATUSES,
  CALCULATION_BASES,
  FREQUENCIES,
} from '../modules/allowance/allowance.types';

// ==========================================
// ALLOWANCE VALIDATION SCHEMAS
// ==========================================

// Allowance type enum
const allowanceTypeSchema = z.enum(ALLOWANCE_TYPES);
const allowanceStatusSchema = z.enum(ALLOWANCE_STATUSES);
const calculationBaseSchema = z.enum(CALCULATION_BASES);
const frequencySchema = z.enum(FREQUENCIES);

// ==========================================
// BODY SCHEMAS
// ==========================================

// Create allowance
export const createAllowanceSchema = z.object({
  employee_id: z.number().int().positive().optional(),
  company_id: z.number().int().positive().optional(),
  name: z.string().min(1, { message: 'Name is required' }),
  type: allowanceTypeSchema,
  amount: z.number().nonnegative().optional(),
  percentage: z.number().min(0).max(100).optional(),
  calculation_base: calculationBaseSchema.optional(),
  formula: z.string().optional(),
  frequency: frequencySchema.optional(),
  effective_date: dateStringSchema.optional(),
  end_date: dateStringSchema.optional(),
  status: allowanceStatusSchema.optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  is_taxable: z.boolean().optional(),
  is_bpjs_object: z.boolean().optional(),
  is_recurring: z.boolean().optional(),
  metadata: z.any().optional(),
});

// Update allowance (all fields optional)
export const updateAllowanceSchema = createAllowanceSchema.partial().extend({
  approved_by: z.number().int().positive().optional(),
  approved_at: z.string().optional(),
  rejection_reason: z.string().optional(),
});

// Bulk create allowances
export const bulkCreateAllowanceSchema = z.object({
  employee_ids: z.array(z.number().int().positive()).min(1, { message: 'At least one employee ID is required' }),
  name: z.string().min(1, { message: 'Name is required' }),
  type: allowanceTypeSchema,
  amount: z.number().nonnegative().optional(),
  percentage: z.number().min(0).max(100).optional(),
  calculation_base: calculationBaseSchema.optional(),
  frequency: frequencySchema.optional(),
  effective_date: dateStringSchema.optional(),
  end_date: dateStringSchema.optional(),
  is_taxable: z.boolean().optional(),
  is_bpjs_object: z.boolean().optional(),
  is_recurring: z.boolean().optional(),
  description: z.string().optional(),
});

// Bulk delete
export const bulkDeleteSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, { message: 'At least one ID is required' }),
});

// Bulk update status
export const bulkUpdateStatusSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, { message: 'At least one ID is required' }),
  status: allowanceStatusSchema,
});

// Reject allowance
export const rejectAllowanceSchema = z.object({
  reason: z.string().min(1, { message: 'Rejection reason is required' }),
});

// Apply template to employees
export const applyTemplateSchema = z.object({
  employee_ids: z.array(z.number().int().positive()).min(1, { message: 'At least one employee ID is required' }),
});

// Create company allowance (same as create but without employee_id)
export const createCompanyAllowanceSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  type: allowanceTypeSchema,
  amount: z.number().nonnegative().optional(),
  percentage: z.number().min(0).max(100).optional(),
  calculation_base: calculationBaseSchema.optional(),
  formula: z.string().optional(),
  frequency: frequencySchema.optional(),
  effective_date: dateStringSchema.optional(),
  end_date: dateStringSchema.optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  is_taxable: z.boolean().optional(),
  is_bpjs_object: z.boolean().optional(),
  is_recurring: z.boolean().optional(),
  metadata: z.any().optional(),
});

// ==========================================
// QUERY SCHEMAS
// ==========================================

// List allowances query
export const listAllowancesQuerySchema = paginationSchema.merge(searchSchema).extend({
  employee_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  type: allowanceTypeSchema.optional(),
  status: allowanceStatusSchema.optional(),
  is_taxable: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  is_recurring: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  frequency: frequencySchema.optional(),
  effective_from: dateStringSchema.optional(),
  effective_to: dateStringSchema.optional(),
});

// Employee allowances query (for getByEmployeeId / getMyAllowances)
export const employeeAllowancesQuerySchema = z.object({
  status: allowanceStatusSchema.optional(),
  type: allowanceTypeSchema.optional(),
});

// Calculate allowances query
export const calculateAllowancesQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

// Statistics query
export const statisticsQuerySchema = z.object({
  company_id: z.coerce.number().int().positive().optional(),
  employee_id: z.coerce.number().int().positive().optional(),
});

// ==========================================
// PARAM SCHEMAS
// ==========================================

export const employeeIdParamSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
});

export const companyIdParamSchema = z.object({
  companyId: z.coerce.number().int().positive(),
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type CreateAllowanceInput = z.infer<typeof createAllowanceSchema>;
export type UpdateAllowanceInput = z.infer<typeof updateAllowanceSchema>;
export type BulkCreateAllowanceInput = z.infer<typeof bulkCreateAllowanceSchema>;
export type ListAllowancesQueryInput = z.infer<typeof listAllowancesQuerySchema>;
