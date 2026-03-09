import { z } from 'zod';
import { paginationSchema, searchSchema, idParamSchema } from './common.schema';

// ==========================================
// ENUMS
// ==========================================

export const cycleTypeSchema = z.enum(['annual', 'semi_annual', 'quarterly']);
export const cycleStatusSchema = z.enum(['draft', 'active', 'in_progress', 'calibration', 'completed']);

// ==========================================
// QUERY SCHEMAS
// ==========================================

export const performanceCycleListQuerySchema = paginationSchema.merge(searchSchema).extend({
  year: z.coerce.number().int().positive().optional(),
  cycle_type: cycleTypeSchema.optional(),
  status: cycleStatusSchema.optional(),
});

export const yearParamSchema = z.object({
  year: z.coerce.number().int().positive(),
});

export const statisticsQuerySchema = z.object({
  year: z.coerce.number().int().positive().optional(),
});

// ==========================================
// BODY SCHEMAS
// ==========================================

export const createPerformanceCycleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional(),
  year: z.coerce.number().int().positive(),
  cycle_type: cycleTypeSchema.optional(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  self_assessment_start: z.coerce.date().optional(),
  self_assessment_end: z.coerce.date().optional(),
  manager_review_start: z.coerce.date().optional(),
  manager_review_end: z.coerce.date().optional(),
  calibration_start: z.coerce.date().optional(),
  calibration_end: z.coerce.date().optional(),
  status: cycleStatusSchema.optional(),
});

export const updatePerformanceCycleSchema = createPerformanceCycleSchema.partial();
