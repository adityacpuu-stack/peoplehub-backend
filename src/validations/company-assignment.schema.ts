import { z } from 'zod';
import { paginationSchema, searchSchema, idParamSchema } from './common.schema';

// ==========================================
// QUERY SCHEMAS
// ==========================================

export const companyAssignmentListQuerySchema = paginationSchema.merge(searchSchema).extend({
  employee_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  status: z.enum(['active', 'inactive', 'expired']).optional(),
});

// ==========================================
// PARAM SCHEMAS
// ==========================================

export const companyAssignmentIdParamSchema = idParamSchema;

export const employeeIdParamSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
});

export const companyIdParamSchema = z.object({
  companyId: z.coerce.number().int().positive(),
});

// ==========================================
// BODY SCHEMAS
// ==========================================

export const createCompanyAssignmentSchema = z.object({
  employee_id: z.number().int().positive(),
  company_id: z.number().int().positive(),
  permissions: z.record(z.string(), z.boolean()).optional(),
  notes: z.string().optional(),
  expires_at: z.string().datetime().optional(),
});

export const bulkAssignSchema = z.object({
  employee_id: z.number().int().positive(),
  company_ids: z.array(z.number().int().positive()).min(1, 'At least one company ID is required'),
  permissions: z.record(z.string(), z.boolean()).optional(),
  notes: z.string().optional(),
  expires_at: z.string().datetime().optional(),
});

export const updateCompanyAssignmentSchema = z.object({
  status: z.enum(['active', 'inactive', 'expired']).optional(),
  permissions: z.record(z.string(), z.boolean()).optional(),
  notes: z.string().optional(),
  expires_at: z.string().datetime().nullable().optional(),
});
