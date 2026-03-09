import { z } from 'zod';
import { idParamSchema } from './common.schema';

// GET /api/v1/org-chart - query params
export const orgChartQuerySchema = z.object({
  company_id: z.coerce.number().int().positive().optional(),
  department_id: z.coerce.number().int().positive().optional(),
  root_employee_id: z.coerce.number().int().positive().optional(),
  max_depth: z.coerce.number().int().positive().max(50).default(10),
});

// GET /api/v1/org-chart/employee/:id - query params
export const subtreeQuerySchema = z.object({
  max_depth: z.coerce.number().int().positive().max(50).default(5),
});

// GET /api/v1/org-chart/employee/:id - path params
export const subtreeParamsSchema = idParamSchema;
