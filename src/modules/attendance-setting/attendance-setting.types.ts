import { Prisma } from '@prisma/client';

// ==========================================
// SECURITY RULE TYPES
// ==========================================

export const SECURITY_RULE_TYPES = {
  LOCATION_RADIUS: 'location_radius',
  TIME_WINDOW: 'time_window',
  PHOTO_REQUIRED: 'photo_required',
  DEVICE_VERIFICATION: 'device_verification',
  IP_WHITELIST: 'ip_whitelist',
} as const;

export const SECURITY_RULE_ACTIONS = {
  WARN: 'warn',
  BLOCK: 'block',
  FLAG: 'flag',
} as const;

// ==========================================
// QUERY INTERFACES
// ==========================================

export interface AttendanceSettingQuery {
  company_id?: number;
}

export interface SecurityRuleListQuery {
  page?: number;
  limit?: number;
  company_id?: number;
  type?: string;
  is_active?: boolean;
}

// ==========================================
// DTOs - Attendance Setting
// ==========================================

export interface CreateAttendanceSettingDTO {
  company_id: number;
  work_start_time?: string;
  work_end_time?: string;
  break_start_time?: string;
  break_end_time?: string;
  working_hours_per_day?: number;
  working_days_per_week?: number;
  working_days?: string[];
  check_in_tolerance_minutes?: number;
  check_out_tolerance_minutes?: number;
  require_check_out?: boolean;
  allow_remote_check_in?: boolean;
  max_remote_distance_km?: number;
  late_threshold_minutes?: number;
  late_affects_salary?: boolean;
  late_deduction_per_minute?: number;
  late_deduction_percentage?: number;
  max_late_minutes_per_month?: number;
  accumulate_late_minutes?: boolean;
  absent_affects_salary?: boolean;
  absent_deduction_per_day?: number;
  absent_deduction_percentage?: number;
  allow_half_day_absent?: boolean;
  half_day_threshold_hours?: number;
  allow_overtime?: boolean;
  overtime_threshold_minutes?: number;
  weekday_overtime_rate?: number;
  weekend_overtime_rate?: number;
  holiday_overtime_rate?: number;
  max_overtime_hours_per_day?: number;
  max_overtime_hours_per_week?: number;
  max_overtime_hours_per_month?: number;
  require_overtime_approval?: boolean;
  enable_time_rounding?: boolean;
  rounding_interval_minutes?: number;
  rounding_method?: string;
  round_check_in?: boolean;
  round_check_out?: boolean;
  enable_location_tracking?: boolean;
  office_latitude?: number;
  office_longitude?: number;
  location_radius_meters?: number;
  enable_geofencing?: boolean;
  geofence_locations?: any;
  require_photo_check_in?: boolean;
  require_photo_check_out?: boolean;
  track_break_time?: boolean;
  break_duration_minutes?: number;
  require_break?: boolean;
  max_break_minutes?: number;
  attendance_affects_payroll?: boolean;
  prorate_salary_for_partial_attendance?: boolean;
  auto_generate_attendance_report?: boolean;
  attendance_report_frequency?: string;
  notify_late_employees?: boolean;
  notify_absent_employees?: boolean;
  notify_manager_on_late?: boolean;
  notify_hr_on_absent?: boolean;
}

export interface UpdateAttendanceSettingDTO extends Partial<Omit<CreateAttendanceSettingDTO, 'company_id'>> {}

// ==========================================
// DTOs - Security Rule
// ==========================================

export interface CreateSecurityRuleDTO {
  name: string;
  description?: string;
  type: string;
  config?: any;
  action?: string;
  is_active?: boolean;
  priority?: number;
  company_id?: number;
}

export interface UpdateSecurityRuleDTO {
  name?: string;
  description?: string;
  type?: string;
  config?: any;
  action?: string;
  is_active?: boolean;
  priority?: number;
}

// ==========================================
// SELECT FIELDS
// ==========================================

export const ATTENDANCE_SETTING_SELECT = {
  id: true,
  company_id: true,
  work_start_time: true,
  work_end_time: true,
  break_start_time: true,
  break_end_time: true,
  working_hours_per_day: true,
  working_days_per_week: true,
  working_days: true,
  check_in_tolerance_minutes: true,
  check_out_tolerance_minutes: true,
  require_check_out: true,
  allow_remote_check_in: true,
  max_remote_distance_km: true,
  late_threshold_minutes: true,
  late_affects_salary: true,
  late_deduction_per_minute: true,
  late_deduction_percentage: true,
  max_late_minutes_per_month: true,
  accumulate_late_minutes: true,
  absent_affects_salary: true,
  absent_deduction_per_day: true,
  absent_deduction_percentage: true,
  allow_half_day_absent: true,
  half_day_threshold_hours: true,
  allow_overtime: true,
  overtime_threshold_minutes: true,
  weekday_overtime_rate: true,
  weekend_overtime_rate: true,
  holiday_overtime_rate: true,
  max_overtime_hours_per_day: true,
  max_overtime_hours_per_week: true,
  max_overtime_hours_per_month: true,
  require_overtime_approval: true,
  enable_time_rounding: true,
  rounding_interval_minutes: true,
  rounding_method: true,
  round_check_in: true,
  round_check_out: true,
  enable_location_tracking: true,
  office_latitude: true,
  office_longitude: true,
  location_radius_meters: true,
  enable_geofencing: true,
  geofence_locations: true,
  require_photo_check_in: true,
  require_photo_check_out: true,
  track_break_time: true,
  break_duration_minutes: true,
  require_break: true,
  max_break_minutes: true,
  attendance_affects_payroll: true,
  prorate_salary_for_partial_attendance: true,
  auto_generate_attendance_report: true,
  attendance_report_frequency: true,
  notify_late_employees: true,
  notify_absent_employees: true,
  notify_manager_on_late: true,
  notify_hr_on_absent: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.AttendanceSettingSelect;

export const ATTENDANCE_SETTING_DETAIL_SELECT = {
  ...ATTENDANCE_SETTING_SELECT,
  company: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
} satisfies Prisma.AttendanceSettingSelect;

export const SECURITY_RULE_SELECT = {
  id: true,
  name: true,
  description: true,
  type: true,
  config: true,
  action: true,
  is_active: true,
  priority: true,
  company_id: true,
  created_by: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.AttendanceSecurityRuleSelect;

export const SECURITY_RULE_DETAIL_SELECT = {
  ...SECURITY_RULE_SELECT,
  company: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
} satisfies Prisma.AttendanceSecurityRuleSelect;

// ==========================================
// DEFAULT SETTINGS
// ==========================================

export const DEFAULT_ATTENDANCE_SETTINGS = {
  work_start_time: '08:00',
  work_end_time: '17:00',
  break_start_time: '12:00',
  break_end_time: '13:00',
  working_hours_per_day: 8,
  working_days_per_week: 5,
  working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  check_in_tolerance_minutes: 15,
  check_out_tolerance_minutes: 15,
  require_check_out: true,
  allow_remote_check_in: false,
  late_threshold_minutes: 15,
  late_affects_salary: false,
  absent_affects_salary: true,
  allow_half_day_absent: true,
  half_day_threshold_hours: 4,
  allow_overtime: true,
  overtime_threshold_minutes: 30,
  weekday_overtime_rate: 1.5,
  weekend_overtime_rate: 2.0,
  holiday_overtime_rate: 3.0,
  require_overtime_approval: true,
  enable_time_rounding: false,
  rounding_interval_minutes: 15,
  rounding_method: 'nearest',
  enable_location_tracking: true,
  location_radius_meters: 100,
  enable_geofencing: false,
  require_photo_check_in: false,
  require_photo_check_out: false,
  track_break_time: true,
  break_duration_minutes: 60,
  attendance_affects_payroll: true,
  prorate_salary_for_partial_attendance: true,
  notify_late_employees: true,
  notify_absent_employees: true,
  notify_manager_on_late: true,
  notify_hr_on_absent: true,
};
