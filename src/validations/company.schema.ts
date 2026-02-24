import { z } from 'zod';
import { paginationSchema, searchSchema } from './common.schema';

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  code: z.string().optional(),
  legal_name: z.string().optional(),
  company_type: z.string().optional(),
  parent_company_id: z.coerce.number().int().positive().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().optional(),
  npwp: z.string().optional(),
  logo: z.string().optional(),
  founded_date: z.string().optional(),
});

export const updateCompanySchema = createCompanySchema.partial();

export const listCompanyQuerySchema = paginationSchema.merge(searchSchema).extend({
  parent_company_id: z.coerce.number().int().positive().optional(),
  company_type: z.string().optional(),
  status: z.string().optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

export const updateFeatureTogglesSchema = z.object({
  attendance_enabled: z.boolean().optional(),
  leave_enabled: z.boolean().optional(),
  payroll_enabled: z.boolean().optional(),
  performance_enabled: z.boolean().optional(),
});
