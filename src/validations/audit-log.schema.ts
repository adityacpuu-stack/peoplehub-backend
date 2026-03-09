import { z } from 'zod';
import { paginationSchema } from './common.schema';

// ==========================================
// QUERY SCHEMAS
// ==========================================

// GET /api/v1/audit-logs - List query
export const auditLogListQuerySchema = paginationSchema.extend({
  user_id: z.coerce.number().int().positive().optional(),
  action: z.string().optional(),
  model: z.string().optional(),
  model_id: z.coerce.number().int().positive().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  ip_address: z.string().optional(),
});

// GET /api/v1/audit-logs/statistics - Statistics query
export const auditLogStatisticsQuerySchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

// GET /api/v1/audit-logs/recent, /my, /user/:userId - Limit query
export const auditLogLimitQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(1000).optional(),
});

// ==========================================
// PARAMS SCHEMAS
// ==========================================

// GET /api/v1/audit-logs/:id
export const auditLogIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// GET /api/v1/audit-logs/model/:model/:modelId
export const auditLogModelParamSchema = z.object({
  model: z.string().min(1),
  modelId: z.coerce.number().int().positive(),
});

// GET /api/v1/audit-logs/user/:userId
export const auditLogUserParamSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

// ==========================================
// BODY SCHEMAS
// ==========================================

// POST /api/v1/audit-logs/cleanup
export const auditLogCleanupBodySchema = z.object({
  days_to_keep: z.coerce.number().int().positive().max(365).default(90),
});
