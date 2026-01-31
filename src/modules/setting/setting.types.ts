import { Prisma } from '@prisma/client';

// ==========================================
// SETTING GROUPS & TYPES
// ==========================================

export const SETTING_GROUPS = {
  GENERAL: 'general',
  COMPANY: 'company',
  ATTENDANCE: 'attendance',
  LEAVE: 'leave',
  PAYROLL: 'payroll',
  NOTIFICATION: 'notification',
  INTEGRATION: 'integration',
  SECURITY: 'security',
} as const;

export const SETTING_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  JSON: 'json',
  SELECT: 'select',
  DATE: 'date',
  TIME: 'time',
  EMAIL: 'email',
  URL: 'url',
} as const;

// ==========================================
// QUERY INTERFACES
// ==========================================

export interface SettingListQuery {
  group?: string;
  is_public?: boolean;
  search?: string;
}

export interface SystemSettingListQuery {
  is_editable?: boolean;
  search?: string;
}

// ==========================================
// DTOs
// ==========================================

export interface CreateSettingDTO {
  key: string;
  value?: string;
  group?: string;
  type?: string;
  options?: Record<string, any>;
  description?: string;
  is_public?: boolean;
  sort_order?: number;
}

export interface UpdateSettingDTO {
  value?: string;
  description?: string;
  is_public?: boolean;
  sort_order?: number;
}

export interface BulkUpdateSettingDTO {
  settings: {
    key: string;
    value: string;
  }[];
}

export interface CreateSystemSettingDTO {
  key: string;
  value?: string;
  type?: string;
  description?: string;
}

export interface UpdateSystemSettingDTO {
  value?: string;
  description?: string;
}

// ==========================================
// SELECT FIELDS
// ==========================================

export const SETTING_SELECT = {
  id: true,
  key: true,
  value: true,
  group: true,
  type: true,
  options: true,
  description: true,
  is_public: true,
  is_system: true,
  sort_order: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.SettingSelect;

export const SYSTEM_SETTING_SELECT = {
  id: true,
  key: true,
  value: true,
  type: true,
  description: true,
  is_editable: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.SystemSettingSelect;

// ==========================================
// DEFAULT SETTINGS
// ==========================================

export const DEFAULT_SETTINGS = [
  // General
  { key: 'app_name', value: 'HR Management System', group: 'general', type: 'text', description: 'Application name', is_public: true },
  { key: 'app_logo', value: '', group: 'general', type: 'text', description: 'Application logo URL', is_public: true },
  { key: 'app_favicon', value: '', group: 'general', type: 'text', description: 'Application favicon URL', is_public: true },
  { key: 'timezone', value: 'Asia/Jakarta', group: 'general', type: 'select', description: 'Default timezone', is_public: true, options: ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'] },
  { key: 'date_format', value: 'DD/MM/YYYY', group: 'general', type: 'select', description: 'Date format', is_public: true, options: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] },
  { key: 'currency', value: 'IDR', group: 'general', type: 'text', description: 'Default currency', is_public: true },
  { key: 'language', value: 'id', group: 'general', type: 'select', description: 'Default language', is_public: true, options: ['id', 'en'] },

  // Attendance
  { key: 'work_start_time', value: '08:00', group: 'attendance', type: 'time', description: 'Default work start time' },
  { key: 'work_end_time', value: '17:00', group: 'attendance', type: 'time', description: 'Default work end time' },
  { key: 'break_duration_minutes', value: '60', group: 'attendance', type: 'number', description: 'Break duration in minutes' },
  { key: 'late_tolerance_minutes', value: '15', group: 'attendance', type: 'number', description: 'Late tolerance in minutes' },
  { key: 'require_photo_checkin', value: 'true', group: 'attendance', type: 'boolean', description: 'Require photo for check-in' },
  { key: 'require_location_checkin', value: 'true', group: 'attendance', type: 'boolean', description: 'Require GPS location for check-in' },
  { key: 'max_location_radius_meters', value: '100', group: 'attendance', type: 'number', description: 'Maximum location radius in meters' },

  // Leave
  { key: 'annual_leave_days', value: '12', group: 'leave', type: 'number', description: 'Default annual leave days' },
  { key: 'carry_over_enabled', value: 'true', group: 'leave', type: 'boolean', description: 'Allow leave carry over' },
  { key: 'max_carry_over_days', value: '5', group: 'leave', type: 'number', description: 'Maximum carry over days' },
  { key: 'min_leave_request_days', value: '3', group: 'leave', type: 'number', description: 'Minimum days before leave request' },

  // Payroll
  { key: 'payroll_cutoff_date', value: '20', group: 'payroll', type: 'number', description: 'Payroll cutoff date (day of month)' },
  { key: 'payment_date', value: '25', group: 'payroll', type: 'number', description: 'Payment date (day of month)' },
  { key: 'use_ter_method', value: 'true', group: 'payroll', type: 'boolean', description: 'Use TER method for tax calculation' },
  { key: 'enable_bpjs', value: 'true', group: 'payroll', type: 'boolean', description: 'Enable BPJS calculation' },

  // Notification
  { key: 'email_notifications', value: 'true', group: 'notification', type: 'boolean', description: 'Enable email notifications' },
  { key: 'push_notifications', value: 'true', group: 'notification', type: 'boolean', description: 'Enable push notifications' },
  { key: 'notification_email', value: '', group: 'notification', type: 'email', description: 'Admin notification email' },

  // Security
  { key: 'password_min_length', value: '8', group: 'security', type: 'number', description: 'Minimum password length' },
  { key: 'password_require_uppercase', value: 'true', group: 'security', type: 'boolean', description: 'Require uppercase in password' },
  { key: 'password_require_number', value: 'true', group: 'security', type: 'boolean', description: 'Require number in password' },
  { key: 'session_timeout_minutes', value: '480', group: 'security', type: 'number', description: 'Session timeout in minutes' },
  { key: 'max_login_attempts', value: '5', group: 'security', type: 'number', description: 'Maximum login attempts before lockout' },
];

export const DEFAULT_SYSTEM_SETTINGS = [
  { key: 'maintenance_mode', value: 'false', type: 'boolean', description: 'Enable maintenance mode', is_editable: true },
  { key: 'api_version', value: 'v1', type: 'text', description: 'Current API version', is_editable: false },
  { key: 'max_upload_size_mb', value: '10', type: 'number', description: 'Maximum file upload size in MB', is_editable: true },
  { key: 'allowed_file_types', value: 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png', type: 'text', description: 'Allowed file types', is_editable: true },
  { key: 'enable_audit_log', value: 'true', type: 'boolean', description: 'Enable audit logging', is_editable: true },
  { key: 'backup_enabled', value: 'false', type: 'boolean', description: 'Enable automatic backup', is_editable: true },
  { key: 'backup_frequency', value: 'daily', type: 'select', description: 'Backup frequency', is_editable: true },
];
