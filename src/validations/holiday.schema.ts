import { z } from 'zod';
import {
  paginationSchema,
  searchSchema,
  dateStringSchema,
} from './common.schema';

// ==========================================
// HOLIDAY VALIDATION SCHEMAS
// ==========================================

// Holiday type enum
const holidayTypeSchema = z.enum(['national', 'company', 'religious', 'cuti_bersama']);

// Create holiday
export const createHolidaySchema = z.object({
  name: z.string().min(1, { message: 'Holiday name is required' }),
  date: dateStringSchema,
  type: holidayTypeSchema,
  company_id: z.number().int().positive().optional(),
  description: z.string().optional(),
  is_recurring: z.boolean().optional(),
});

// Update holiday
export const updateHolidaySchema = z.object({
  name: z.string().min(1, { message: 'Holiday name is required' }).optional(),
  date: dateStringSchema.optional(),
  type: holidayTypeSchema.optional(),
  description: z.string().optional(),
  is_recurring: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

// Bulk create holiday
export const bulkCreateHolidaySchema = z.object({
  holidays: z.array(createHolidaySchema).min(1, { message: 'At least one holiday is required' }),
  company_id: z.number().int().positive().optional(),
});

// List holidays query
export const listHolidayQuerySchema = paginationSchema.merge(searchSchema).extend({
  company_id: z.coerce.number().int().positive().optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  type: holidayTypeSchema.optional(),
  is_active: z.coerce.boolean().optional(),
  sort_by: z.enum(['date', 'name', 'created_at']).default('date'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

// Calendar query
export const calendarQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).default(new Date().getFullYear()),
  month: z.coerce.number().int().min(1).max(12).optional(),
  company_id: z.coerce.number().int().positive().optional(),
});

// Upcoming query
export const upcomingQuerySchema = z.object({
  company_id: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).default(5),
});

// Seed year param
export const seedYearParamSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
});

// Type exports
export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;
export type UpdateHolidayInput = z.infer<typeof updateHolidaySchema>;
export type BulkCreateHolidayInput = z.infer<typeof bulkCreateHolidaySchema>;
export type ListHolidayQuery = z.infer<typeof listHolidayQuerySchema>;
export type CalendarQuery = z.infer<typeof calendarQuerySchema>;
export type UpcomingQuery = z.infer<typeof upcomingQuerySchema>;
