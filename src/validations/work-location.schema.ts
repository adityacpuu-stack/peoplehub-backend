import { z } from 'zod';
import { paginationSchema, searchSchema, timeStringSchema } from './common.schema';

// ==========================================
// QUERY SCHEMAS
// ==========================================

export const listWorkLocationQuerySchema = paginationSchema.merge(searchSchema).extend({
  company_id: z.coerce.number().int().positive().optional(),
  is_active: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export const nearbyQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90, { message: 'Latitude must be between -90 and 90' }),
  longitude: z.coerce.number().min(-180).max(180, { message: 'Longitude must be between -180 and 180' }),
  radius: z.coerce.number().positive().default(10).optional(),
});

// ==========================================
// BODY SCHEMAS
// ==========================================

export const createWorkLocationSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }).max(255),
  code: z.string().max(50).optional(),
  description: z.string().max(1000).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  postal_code: z.string().max(10).optional(),
  country: z.string().max(100).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radius_meters: z.coerce.number().int().positive().optional(),
  enable_attendance: z.boolean().optional(),
  enable_shift_system: z.boolean().optional(),
  shift_schedules: z.any().optional(),
  require_location_verification: z.boolean().optional(),
  require_photo: z.boolean().optional(),
  strict_location_check: z.boolean().optional(),
  location_check_interval_minutes: z.coerce.number().int().positive().optional(),
  work_start_time: timeStringSchema.optional(),
  work_end_time: timeStringSchema.optional(),
  break_start_time: timeStringSchema.optional(),
  break_end_time: timeStringSchema.optional(),
  late_tolerance_minutes: z.coerce.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
  company_id: z.coerce.number().int().positive({ message: 'Company ID is required' }),
  settings: z.any().optional(),
});

export const updateWorkLocationSchema = createWorkLocationSchema.partial().omit({ company_id: true });

export const checkLocationValiditySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90, { message: 'Latitude must be between -90 and 90' }),
  longitude: z.coerce.number().min(-180).max(180, { message: 'Longitude must be between -180 and 180' }),
});
