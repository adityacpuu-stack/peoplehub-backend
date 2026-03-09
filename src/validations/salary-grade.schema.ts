import { z } from 'zod';
import { paginationSchema, searchSchema } from './common.schema';

// ==========================================
// SALARY GRADE SCHEMAS
// ==========================================

export const createSalaryGradeSchema = z.object({
  grade_code: z.string().min(1, { message: 'Grade code is required' }),
  grade_name: z.string().min(1, { message: 'Grade name is required' }),
  level: z.coerce.number().int().positive().optional(),
  min_salary: z.coerce.number().nonnegative().optional(),
  max_salary: z.coerce.number().nonnegative().optional(),
  mid_salary: z.coerce.number().nonnegative().optional(),
  allowances: z.any().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
});

export const updateSalaryGradeSchema = createSalaryGradeSchema
  .omit({ grade_code: true })
  .partial();

export const listSalaryGradeQuerySchema = paginationSchema.merge(searchSchema).extend({
  status: z.string().optional(),
  level: z.coerce.number().int().positive().optional(),
});

export const assignEmployeeToGradeSchema = z.object({
  employee_id: z.coerce.number().int().positive({ message: 'Employee ID is required' }),
});
