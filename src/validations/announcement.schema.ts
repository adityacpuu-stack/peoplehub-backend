import { z } from 'zod';
import { paginationSchema, searchSchema } from './common.schema';

// ==========================================
// ENUMS
// ==========================================

const announcementCategorySchema = z.enum(['general', 'policy', 'event', 'hr', 'urgent']);
const announcementPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);
const announcementVisibilitySchema = z.enum(['all', 'department', 'role']);

// ==========================================
// QUERY SCHEMAS
// ==========================================

export const listAnnouncementsQuerySchema = paginationSchema.merge(searchSchema).extend({
  company_id: z.coerce.number().int().positive().optional(),
  category: announcementCategorySchema.optional(),
  priority: announcementPrioritySchema.optional(),
  visibility: announcementVisibilitySchema.optional(),
  is_pinned: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  is_published: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  sort_by: z.enum(['title', 'category', 'priority', 'published_at', 'updated_at', 'created_at']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

export const statisticsQuerySchema = z.object({
  company_id: z.coerce.number().int().positive().optional(),
});

export const companyIdParamSchema = z.object({
  companyId: z.coerce.number().int().positive(),
});

// ==========================================
// BODY SCHEMAS
// ==========================================

export const createAnnouncementSchema = z.object({
  company_id: z.number().int().positive().optional(),
  target_company_ids: z.array(z.number().int().positive()).optional(),
  is_global: z.boolean().optional(),
  title: z.string().min(1, 'Title is required').max(255),
  content: z.string().min(1, 'Content is required'),
  category: announcementCategorySchema,
  priority: announcementPrioritySchema.optional(),
  visibility: announcementVisibilitySchema.optional(),
  target_audience: z.string().optional(),
  target_ids: z.array(z.number().int().positive()).optional(),
  is_pinned: z.boolean().optional(),
  is_published: z.boolean().optional(),
  expires_at: z.string().optional(),
});

export const updateAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255).optional(),
  content: z.string().min(1, 'Content is required').optional(),
  category: announcementCategorySchema.optional(),
  priority: announcementPrioritySchema.optional(),
  visibility: announcementVisibilitySchema.optional(),
  target_audience: z.string().optional(),
  target_ids: z.array(z.number().int().positive()).optional(),
  is_pinned: z.boolean().optional(),
  expires_at: z.string().nullable().optional(),
});
