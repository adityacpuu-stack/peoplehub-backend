import { z } from 'zod';
import { paginationSchema, dateStringSchema, timeStringSchema } from './common.schema';

// ==========================================
// OVERTIME ENUMS
// ==========================================

export const overtimeStatusSchema = z.enum(['pending', 'approved', 'rejected', 'cancelled']);
export const overtimeTypeSchema = z.enum(['regular', 'weekend', 'holiday']);

// ==========================================
// QUERY SCHEMAS
// ==========================================

export const overtimeListQuerySchema = paginationSchema.extend({
  employee_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  department_id: z.coerce.number().int().positive().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: overtimeStatusSchema.optional(),
  overtime_type: overtimeTypeSchema.optional(),
  sort_by: z.enum(['date', 'created_at', 'hours', 'status']).default('date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export const myOvertimeQuerySchema = paginationSchema.extend({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: overtimeStatusSchema.optional(),
  sort_by: z.enum(['date', 'created_at', 'hours', 'status']).default('date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// ==========================================
// BODY SCHEMAS
// ==========================================

export const createOvertimeSchema = z.object({
  date: dateStringSchema,
  start_time: timeStringSchema.optional(),
  end_time: timeStringSchema.optional(),
  hours: z.number().positive().optional(),
  break_duration: z.number().nonnegative().optional(),
  reason: z.string().min(1, 'Reason is required'),
  task_description: z.string().optional(),
  overtime_type: overtimeTypeSchema.optional(),
  rate_multiplier: z.number().positive().optional(),
});

export const createOvertimeForEmployeeSchema = createOvertimeSchema.extend({
  employee_id: z.number().int().positive(),
});

export const updateOvertimeSchema = z.object({
  date: dateStringSchema.optional(),
  start_time: timeStringSchema.optional(),
  end_time: timeStringSchema.optional(),
  break_duration: z.number().nonnegative().optional(),
  reason: z.string().min(1).optional(),
  task_description: z.string().optional(),
  overtime_type: overtimeTypeSchema.optional(),
});

export const approveOvertimeSchema = z.object({
  approval_notes: z.string().optional(),
});

export const rejectOvertimeSchema = z.object({
  rejection_reason: z.string().min(1, 'Rejection reason is required'),
});
