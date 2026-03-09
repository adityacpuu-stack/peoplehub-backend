import { z } from 'zod';
import { paginationSchema, searchSchema, idParamSchema } from './common.schema';

// ==========================================
// ENUMS
// ==========================================

export const kpiCategorySchema = z.enum([
  'financial', 'customer', 'process', 'learning', 'quality', 'productivity',
]);

export const targetFrequencySchema = z.enum([
  'daily', 'weekly', 'monthly', 'quarterly', 'annually',
]);

export const targetTypeSchema = z.enum([
  'higher_better', 'lower_better', 'target_range',
]);

export const calculationMethodSchema = z.enum([
  'sum', 'average', 'percentage', 'ratio', 'count', 'custom',
]);

// ==========================================
// QUERY SCHEMAS
// ==========================================

export const kpiListQuerySchema = paginationSchema.merge(searchSchema).extend({
  category: kpiCategorySchema.optional(),
  department_id: z.coerce.number().int().positive().optional(),
  position_id: z.coerce.number().int().positive().optional(),
  target_frequency: targetFrequencySchema.optional(),
  is_active: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
});

export const kpiCodeParamSchema = z.object({
  code: z.string().min(1, 'KPI code is required'),
});

export const departmentIdParamSchema = z.object({
  departmentId: z.coerce.number().int().positive(),
});

export const positionIdParamSchema = z.object({
  positionId: z.coerce.number().int().positive(),
});

export const categoryParamSchema = z.object({
  category: kpiCategorySchema,
});

// ==========================================
// BODY SCHEMAS
// ==========================================

export const createKpiSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  code: z.string().max(50).optional(),
  description: z.string().optional(),
  category: kpiCategorySchema.optional(),
  department_id: z.number().int().positive().optional(),
  position_id: z.number().int().positive().optional(),
  unit_of_measure: z.string().max(50).optional(),
  target_frequency: targetFrequencySchema.optional(),
  target_type: targetTypeSchema.optional(),
  weight: z.number().min(0).max(100).optional(),
  calculation_method: calculationMethodSchema.optional(),
  formula: z.string().optional(),
  data_source: z.string().optional(),
  benchmark_value: z.number().optional(),
  threshold_red: z.number().optional(),
  threshold_yellow: z.number().optional(),
  threshold_green: z.number().optional(),
  is_active: z.boolean().optional(),
  effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  effective_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

export const updateKpiSchema = createKpiSchema.partial();

export const assignDepartmentSchema = z.object({
  department_id: z.number().int().positive({ message: 'department_id is required' }),
});

export const assignPositionSchema = z.object({
  position_id: z.number().int().positive({ message: 'position_id is required' }),
});
