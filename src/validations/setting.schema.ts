import { z } from 'zod';
import { searchSchema } from './common.schema';

// ==========================================
// SETTING SCHEMAS
// ==========================================

// Setting list query
export const settingListQuerySchema = searchSchema.extend({
  group: z.string().optional(),
  is_public: z.preprocess(
    (val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return val;
    },
    z.boolean().optional()
  ),
});

// System setting list query
export const systemSettingListQuerySchema = searchSchema.extend({
  is_editable: z.preprocess(
    (val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return val;
    },
    z.boolean().optional()
  ),
});

// Key param
export const keyParamSchema = z.object({
  key: z.string().min(1, 'Setting key is required'),
});

// Group param
export const groupParamSchema = z.object({
  group: z.string().min(1, 'Setting group is required'),
});

// Create setting body
export const createSettingSchema = z.object({
  key: z.string().min(1, 'Setting key is required').max(255),
  value: z.string().optional(),
  group: z.string().optional(),
  type: z.string().optional(),
  options: z.record(z.string(), z.any()).optional(),
  description: z.string().optional(),
  is_public: z.boolean().optional(),
  sort_order: z.coerce.number().int().optional(),
});

// Update setting body
export const updateSettingSchema = z.object({
  value: z.string().optional(),
  description: z.string().optional(),
  is_public: z.boolean().optional(),
  sort_order: z.coerce.number().int().optional(),
});

// Bulk update settings body
export const bulkUpdateSettingSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string(),
    })
  ).min(1, 'At least one setting is required'),
});

// Update system setting body
export const updateSystemSettingSchema = z.object({
  value: z.string().optional(),
  description: z.string().optional(),
});

// Maintenance mode body
export const maintenanceModeSchema = z.object({
  enabled: z.boolean(),
});
