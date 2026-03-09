import { z } from 'zod';
import { paginationSchema, searchSchema } from './common.schema';

// ==========================================
// SALARY COMPONENT VALIDATION SCHEMAS
// ==========================================

const componentTypeSchema = z.enum(['earning', 'deduction']);
const componentCategorySchema = z.enum(['basic', 'allowance', 'bonus', 'tax', 'bpjs', 'insurance', 'loan', 'other']);
const calculationBaseSchema = z.enum(['fixed', 'basic_salary', 'gross_salary', 'custom']);

// Create salary component
export const createSalaryComponentSchema = z.object({
  company_id: z.number().int().positive().optional(),
  name: z.string().min(1, { message: 'Name is required' }),
  code: z.string().min(1).optional(),
  type: componentTypeSchema,
  category: componentCategorySchema.optional(),
  amount: z.number().nonnegative().optional(),
  percentage: z.number().min(0).max(100).optional(),
  formula: z.string().optional(),
  calculation_base: calculationBaseSchema.optional(),
  is_taxable: z.boolean().optional(),
  is_bpjs_object: z.boolean().optional(),
  is_active: z.boolean().optional(),
  is_recurring: z.boolean().optional(),
  effective_from: z.string().datetime().optional(),
  effective_until: z.string().datetime().optional(),
  applicable_to: z.any().optional(),
  description: z.string().optional(),
  sort_order: z.number().int().nonnegative().optional(),
});

// Update salary component (all fields optional)
export const updateSalaryComponentSchema = createSalaryComponentSchema.partial();

// Seed defaults body
export const seedDefaultsSchema = z.object({
  company_id: z.number().int().positive().nullable().optional(),
});

// List salary components query
export const listSalaryComponentsQuerySchema = paginationSchema.merge(searchSchema).extend({
  company_id: z.coerce.number().int().positive().optional(),
  type: componentTypeSchema.optional(),
  category: componentCategorySchema.optional(),
  is_active: z.coerce.boolean().optional(),
  is_taxable: z.coerce.boolean().optional(),
});

// Company ID query (for earnings/deductions endpoints)
export const companyIdQuerySchema = z.object({
  company_id: z.coerce.number().int().positive().optional(),
});

// Type exports
export type CreateSalaryComponentInput = z.infer<typeof createSalaryComponentSchema>;
export type UpdateSalaryComponentInput = z.infer<typeof updateSalaryComponentSchema>;
export type ListSalaryComponentsQuery = z.infer<typeof listSalaryComponentsQuerySchema>;
