import { z } from 'zod';
import { paginationSchema, searchSchema, idParamSchema, dateStringSchema } from './common.schema';

// ==========================================
// ENUMS
// ==========================================

export const movementTypeSchema = z.enum([
  'promotion',
  'demotion',
  'transfer',
  'mutation',
  'salary_adjustment',
  'grade_change',
  'status_change',
  'department_change',
  'position_change',
  'company_transfer',
]);

export const movementStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'applied',
]);

// ==========================================
// QUERY SCHEMAS
// ==========================================

export const employeeMovementListQuerySchema = paginationSchema.merge(searchSchema).extend({
  employee_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  movement_type: movementTypeSchema.optional(),
  status: movementStatusSchema.optional(),
  effective_from: dateStringSchema.optional(),
  effective_to: dateStringSchema.optional(),
  is_applied: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
});

export const companyIdQuerySchema = z.object({
  company_id: z.coerce.number().int().positive().optional(),
});

export const employeeMovementsByEmployeeQuerySchema = z.object({
  status: movementStatusSchema.optional(),
});

export const employeeIdParamSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
});

// ==========================================
// BODY SCHEMAS
// ==========================================

export const createEmployeeMovementSchema = z.object({
  employee_id: z.coerce.number().int().positive(),
  company_id: z.coerce.number().int().positive().optional(),
  movement_type: movementTypeSchema,
  effective_date: z.coerce.date(),
  // New state
  new_position_id: z.coerce.number().int().positive().optional(),
  new_department_id: z.coerce.number().int().positive().optional(),
  new_company_id: z.coerce.number().int().positive().optional(),
  new_salary: z.coerce.number().nonnegative().optional(),
  new_grade: z.string().optional(),
  new_status: z.string().optional(),
  // Details
  reason: z.string().optional(),
  attachment: z.string().optional(),
  notes: z.string().optional(),
});

export const updateEmployeeMovementSchema = createEmployeeMovementSchema
  .omit({ employee_id: true })
  .partial();

export const approveMovementSchema = z.object({
  approval_notes: z.string().optional(),
});

export const rejectMovementSchema = z.object({
  rejection_reason: z.string().min(1, 'Rejection reason is required'),
});

// Re-export for convenience
export { idParamSchema };
