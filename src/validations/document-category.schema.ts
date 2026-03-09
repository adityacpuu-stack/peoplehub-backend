import { z } from 'zod';
import { paginationSchema, searchSchema, idParamSchema } from './common.schema';

// ==========================================
// QUERY SCHEMAS
// ==========================================

export const documentCategoryListQuerySchema = paginationSchema.merge(searchSchema).extend({
  parent_id: z.coerce.number().int().positive().optional(),
  is_active: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  include_children: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export const codeParamSchema = z.object({
  code: z.string().min(1, 'Category code is required'),
});

// ==========================================
// BODY SCHEMAS
// ==========================================

export const createDocumentCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
  parent_id: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().nonnegative().optional(),
});

export const updateDocumentCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(1).max(50).optional(),
  description: z.string().max(500).nullable().optional(),
  parent_id: z.number().int().positive().nullable().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().nonnegative().optional(),
});

export const reorderDocumentCategorySchema = z.object({
  category_ids: z
    .array(z.number().int().positive())
    .min(1, 'category_ids array is required'),
});
