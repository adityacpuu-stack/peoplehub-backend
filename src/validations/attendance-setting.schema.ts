import { z } from 'zod';
import { paginationSchema, searchSchema, timeStringSchema } from './common.schema';

// ==========================================
// ATTENDANCE SETTING VALIDATION SCHEMAS
// ==========================================

const workingDaySchema = z.enum([
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
]);

const roundingMethodSchema = z.enum(['nearest', 'up', 'down']);

const reportFrequencySchema = z.enum(['daily', 'weekly', 'monthly']);

export const createAttendanceSettingSchema = z.object({
  company_id: z.coerce.number().int().positive({ message: 'Company ID must be a positive integer' }),
  work_start_time: timeStringSchema.optional(),
  work_end_time: timeStringSchema.optional(),
  break_start_time: timeStringSchema.optional(),
  break_end_time: timeStringSchema.optional(),
  working_hours_per_day: z.coerce.number().int().min(1).max(24).optional(),
  working_days_per_week: z.coerce.number().int().min(1).max(7).optional(),
  working_days: z.array(workingDaySchema).optional(),
  check_in_tolerance_minutes: z.coerce.number().int().nonnegative().optional(),
  check_out_tolerance_minutes: z.coerce.number().int().nonnegative().optional(),
  require_check_out: z.boolean().optional(),
  allow_remote_check_in: z.boolean().optional(),
  max_remote_distance_km: z.coerce.number().nonnegative().optional().nullable(),
  late_threshold_minutes: z.coerce.number().int().nonnegative().optional(),
  late_affects_salary: z.boolean().optional(),
  late_deduction_per_minute: z.coerce.number().nonnegative().optional().nullable(),
  late_deduction_percentage: z.coerce.number().min(0).max(100).optional().nullable(),
  max_late_minutes_per_month: z.coerce.number().int().nonnegative().optional().nullable(),
  accumulate_late_minutes: z.boolean().optional(),
  absent_affects_salary: z.boolean().optional(),
  absent_deduction_per_day: z.coerce.number().nonnegative().optional().nullable(),
  absent_deduction_percentage: z.coerce.number().min(0).max(100).optional().nullable(),
  allow_half_day_absent: z.boolean().optional(),
  half_day_threshold_hours: z.coerce.number().min(0).max(24).optional(),
  allow_overtime: z.boolean().optional(),
  overtime_threshold_minutes: z.coerce.number().int().nonnegative().optional(),
  weekday_overtime_rate: z.coerce.number().nonnegative().optional(),
  weekend_overtime_rate: z.coerce.number().nonnegative().optional(),
  holiday_overtime_rate: z.coerce.number().nonnegative().optional(),
  max_overtime_hours_per_day: z.coerce.number().nonnegative().optional().nullable(),
  max_overtime_hours_per_week: z.coerce.number().nonnegative().optional().nullable(),
  max_overtime_hours_per_month: z.coerce.number().nonnegative().optional().nullable(),
  require_overtime_approval: z.boolean().optional(),
  enable_time_rounding: z.boolean().optional(),
  rounding_interval_minutes: z.coerce.number().int().positive().optional(),
  rounding_method: roundingMethodSchema.optional(),
  round_check_in: z.boolean().optional(),
  round_check_out: z.boolean().optional(),
  enable_location_tracking: z.boolean().optional(),
  office_latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  office_longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  location_radius_meters: z.coerce.number().int().positive().optional(),
  enable_geofencing: z.boolean().optional(),
  geofence_locations: z.any().optional(),
  require_photo_check_in: z.boolean().optional(),
  require_photo_check_out: z.boolean().optional(),
  track_break_time: z.boolean().optional(),
  break_duration_minutes: z.coerce.number().int().nonnegative().optional(),
  require_break: z.boolean().optional(),
  max_break_minutes: z.coerce.number().int().nonnegative().optional().nullable(),
  attendance_affects_payroll: z.boolean().optional(),
  prorate_salary_for_partial_attendance: z.boolean().optional(),
  auto_generate_attendance_report: z.boolean().optional(),
  attendance_report_frequency: reportFrequencySchema.optional(),
  notify_late_employees: z.boolean().optional(),
  notify_absent_employees: z.boolean().optional(),
  notify_manager_on_late: z.boolean().optional(),
  notify_hr_on_absent: z.boolean().optional(),
});

export const updateAttendanceSettingSchema = createAttendanceSettingSchema.omit({ company_id: true }).partial();

// ==========================================
// SECURITY RULE VALIDATION SCHEMAS
// ==========================================

const securityRuleTypeSchema = z.enum([
  'location_radius', 'time_window', 'photo_required', 'device_verification', 'ip_whitelist',
]);

const securityRuleActionSchema = z.enum(['warn', 'block', 'flag']);

export const createSecurityRuleSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().optional(),
  type: securityRuleTypeSchema,
  config: z.any().optional(),
  action: securityRuleActionSchema.optional(),
  is_active: z.boolean().optional(),
  priority: z.coerce.number().int().nonnegative().optional(),
  company_id: z.coerce.number().int().positive().optional().nullable(),
});

export const updateSecurityRuleSchema = createSecurityRuleSchema.partial();

// ==========================================
// QUERY SCHEMAS
// ==========================================

export const securityRuleListQuerySchema = paginationSchema.merge(searchSchema).extend({
  company_id: z.coerce.number().int().positive().optional(),
  type: securityRuleTypeSchema.optional(),
  is_active: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export const activeSecurityRuleQuerySchema = z.object({
  company_id: z.coerce.number().int().positive().optional(),
});
