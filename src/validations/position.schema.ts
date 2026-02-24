import { z } from 'zod';
import { paginationSchema, searchSchema } from './common.schema';

export const createPositionSchema = z.object({
  name: z.string().min(1, 'Position name is required'),
  company_id: z.coerce.number().int().positive('Company ID is required'),
  code: z.string().optional(),
  description: z.string().optional(),
  department_id: z.coerce.number().int().positive().optional().nullable(),
  level: z.coerce.number().int().optional().nullable(),
  min_salary: z.coerce.number().optional().nullable(),
  max_salary: z.coerce.number().optional().nullable(),
  requirements: z.string().optional().nullable(),
  responsibilities: z.string().optional().nullable(),
  qualifications: z.string().optional().nullable(),
  headcount: z.coerce.number().int().optional().nullable(),
  status: z.string().optional(),
});

export const updatePositionSchema = createPositionSchema.partial();

export const listPositionQuerySchema = paginationSchema.merge(searchSchema).extend({
  company_id: z.coerce.number().int().positive().optional(),
  department_id: z.coerce.number().int().positive().optional(),
  level: z.coerce.number().int().optional(),
  status: z.string().optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});
