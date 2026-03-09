import { z } from 'zod';
import { paginationSchema } from './common.schema';

// ==========================================
// NOTIFICATION VALIDATION SCHEMAS
// ==========================================

/**
 * GET /api/v1/notifications
 * Query params for listing notifications
 */
export const notificationListQuerySchema = paginationSchema.extend({
  is_read: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

/**
 * Params for notification ID routes
 */
export const notificationIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
