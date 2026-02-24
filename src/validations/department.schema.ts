import { z } from 'zod';
import { paginationSchema, searchSchema } from './common.schema';

// ==========================================
// DEPARTMENT VALIDATION SCHEMAS
// ==========================================

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  code: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  parent_id: z.coerce.number().int().positive().optional().nullable(),
  manager_id: z.coerce.number().int().positive().optional().nullable(),
  budget: z.coerce.number().optional().nullable(),
  location: z.string().optional().nullable(),
  contact_person: z.string().optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  established_date: z.string().optional().nullable(),
  department_type: z.string().optional().nullable(),
  headcount_limit: z.coerce.number().int().optional().nullable(),
  cost_center: z.string().optional().nullable(),
  sort_order: z.coerce.number().int().optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export const listDepartmentQuerySchema = paginationSchema.merge(searchSchema).extend({
  company_id: z.coerce.number().int().positive().optional(),
  parent_id: z.coerce.number().int().optional(),
  status: z.string().optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});
