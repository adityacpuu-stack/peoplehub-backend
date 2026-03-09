import { z } from 'zod';
import { paginationSchema, searchSchema, idParamSchema } from './common.schema';

// ==========================================
// ENUMS
// ==========================================

export const templateTypeSchema = z.enum([
  'policy',
  'form',
  'letter',
  'certificate',
  'contract',
  'memo',
  'announcement',
]);

export const templateCategorySchema = z.enum([
  'hr',
  'finance',
  'operations',
  'legal',
  'general',
]);

// ==========================================
// QUERY SCHEMAS
// ==========================================

export const formTemplateListQuerySchema = paginationSchema.merge(searchSchema).extend({
  type: templateTypeSchema.optional(),
  category: templateCategorySchema.optional(),
  is_active: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

// ==========================================
// PARAM SCHEMAS
// ==========================================

export { idParamSchema };

export const codeParamSchema = z.object({
  code: z.string().min(1, 'Code is required'),
});

export const typeParamSchema = z.object({
  type: templateTypeSchema,
});

export const categoryParamSchema = z.object({
  category: templateCategorySchema,
});

// ==========================================
// BODY SCHEMAS
// ==========================================

export const createFormTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  code: z.string().max(100).optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  type: templateTypeSchema.optional(),
  category: templateCategorySchema.optional(),
  variables: z.record(z.string(), z.any()).optional(),
  is_active: z.boolean().optional(),
});

export const updateFormTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  code: z.string().max(100).optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  type: templateTypeSchema.optional(),
  category: templateCategorySchema.optional(),
  variables: z.record(z.string(), z.any()).optional(),
  is_active: z.boolean().optional(),
});

export const renderTemplateSchema = z.record(z.string(), z.any());
