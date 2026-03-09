import { z } from 'zod';
import { paginationSchema, searchSchema, idParamSchema } from './common.schema';
import { TEMPLATE_CATEGORIES, TEMPLATE_FILE_TYPES } from '../modules/template/template.types';

// ==========================================
// TEMPLATE SCHEMAS
// ==========================================

export const createTemplateSchema = z.object({
  company_id: z.coerce.number().int().positive('Company ID is required'),
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  category: z.enum(TEMPLATE_CATEGORIES, {
    message: `Category must be one of: ${TEMPLATE_CATEGORIES.join(', ')}`,
  }),
  file_type: z.enum(TEMPLATE_FILE_TYPES, {
    message: `File type must be one of: ${TEMPLATE_FILE_TYPES.join(', ')}`,
  }),
  file_path: z.string().min(1, 'File path is required'),
  file_name: z.string().optional(),
  file_size: z.coerce.number().nonnegative().optional(),
  mime_type: z.string().optional(),
  version: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1, 'Template name cannot be empty').optional(),
  description: z.string().optional(),
  category: z.enum(TEMPLATE_CATEGORIES, {
    message: `Category must be one of: ${TEMPLATE_CATEGORIES.join(', ')}`,
  }).optional(),
  file_type: z.enum(TEMPLATE_FILE_TYPES, {
    message: `File type must be one of: ${TEMPLATE_FILE_TYPES.join(', ')}`,
  }).optional(),
  file_path: z.string().min(1).optional(),
  file_name: z.string().optional(),
  file_size: z.coerce.number().nonnegative().optional(),
  mime_type: z.string().optional(),
  version: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const listTemplateQuerySchema = paginationSchema.merge(searchSchema).extend({
  company_id: z.coerce.number().int().positive().optional(),
  category: z.enum(TEMPLATE_CATEGORIES).optional(),
  file_type: z.enum(TEMPLATE_FILE_TYPES).optional(),
  is_active: z.preprocess(
    (val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return val;
    },
    z.boolean().optional(),
  ),
  sort_by: z.enum(['name', 'category', 'file_type', 'created_at', 'updated_at']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

export const statisticsQuerySchema = z.object({
  company_id: z.coerce.number().int().positive().optional(),
});

export const categoryParamSchema = z.object({
  category: z.string().min(1, 'Category is required'),
});

export const companyIdParamSchema = z.object({
  companyId: z.coerce.number().int().positive('Invalid company ID'),
});

export { idParamSchema };
