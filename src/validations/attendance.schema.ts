import { z } from 'zod';
import { paginationSchema, dateStringSchema, timeStringSchema } from './common.schema';

// ==========================================
// ATTENDANCE ENUM SCHEMAS
// ==========================================

export const attendanceStatusSchema = z.enum([
  'present',
  'absent',
  'late',
  'half_day',
  'on_leave',
  'holiday',
  'work_from_home',
]);

export const shiftTypeSchema = z.enum([
  'morning',
  'afternoon',
  'night',
  'flexible',
]);

export const sortOrderSchema = z.enum(['asc', 'desc']);

// ==========================================
// QUERY SCHEMAS
// ==========================================

export const attendanceListQuerySchema = paginationSchema.extend({
  employee_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  department_id: z.coerce.number().int().positive().optional(),
  date: dateStringSchema.optional(),
  start_date: dateStringSchema.optional(),
  end_date: dateStringSchema.optional(),
  status: attendanceStatusSchema.optional(),
  sort_by: z.string().optional(),
  sort_order: sortOrderSchema.optional(),
});

export const attendanceMyHistoryQuerySchema = paginationSchema.extend({
  start_date: dateStringSchema.optional(),
  end_date: dateStringSchema.optional(),
  status: attendanceStatusSchema.optional(),
  sort_by: z.string().optional(),
  sort_order: sortOrderSchema.optional(),
});

export const attendanceSummaryQuerySchema = z.object({
  start_date: dateStringSchema,
  end_date: dateStringSchema,
});

export const attendanceTeamQuerySchema = z.object({
  date: dateStringSchema.optional(),
});

export const attendanceSummaryParamsSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
});

export const attendanceIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// ==========================================
// BODY SCHEMAS
// ==========================================

export const checkInSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
  location_accuracy_meters: z.number().optional(),
  work_location_id: z.number().int().positive().optional(),
  photo: z.string().optional(),
  device_id: z.string().optional(),
  device_type: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
  notes: z.string().optional(),
});

export const checkOutSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
  location_accuracy_meters: z.number().optional(),
  photo: z.string().optional(),
  notes: z.string().optional(),
});

export const createAttendanceSchema = z.object({
  employee_id: z.number().int().positive(),
  date: dateStringSchema,
  check_in: timeStringSchema.optional(),
  check_out: timeStringSchema.optional(),
  break_start: timeStringSchema.optional(),
  break_end: timeStringSchema.optional(),
  status: attendanceStatusSchema.optional(),
  shift_type: shiftTypeSchema.optional(),
  notes: z.string().optional(),
  work_location_id: z.number().int().positive().optional(),
});

export const updateAttendanceSchema = z.object({
  check_in: timeStringSchema.optional(),
  check_out: timeStringSchema.optional(),
  break_start: timeStringSchema.optional(),
  break_end: timeStringSchema.optional(),
  status: attendanceStatusSchema.optional(),
  shift_type: shiftTypeSchema.optional(),
  notes: z.string().optional(),
  approval_notes: z.string().optional(),
});
