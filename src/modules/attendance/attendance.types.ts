// Attendance status enum
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  HALF_DAY: 'half_day',
  ON_LEAVE: 'on_leave',
  HOLIDAY: 'holiday',
  WORK_FROM_HOME: 'work_from_home',
} as const;

// Shift types
export const SHIFT_TYPES = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  NIGHT: 'night',
  FLEXIBLE: 'flexible',
} as const;

// Query parameters for listing attendance
export interface AttendanceListQuery {
  page?: number;
  limit?: number;
  employee_id?: number;
  company_id?: number;
  department_id?: number;
  date?: string; // Single date
  start_date?: string;
  end_date?: string;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Check-in DTO
export interface CheckInDTO {
  latitude?: number;
  longitude?: number;
  address?: string;
  location_accuracy_meters?: number;
  work_location_id?: number;
  photo?: string;
  device_id?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  notes?: string;
}

// Check-out DTO
export interface CheckOutDTO {
  latitude?: number;
  longitude?: number;
  address?: string;
  location_accuracy_meters?: number;
  photo?: string;
  notes?: string;
}

// Manual attendance DTO (for HR)
export interface CreateAttendanceDTO {
  employee_id: number;
  date: string;
  check_in?: string;
  check_out?: string;
  break_start?: string;
  break_end?: string;
  status?: string;
  shift_type?: string;
  notes?: string;
  work_location_id?: number;
}

// Update attendance DTO
export interface UpdateAttendanceDTO {
  check_in?: string;
  check_out?: string;
  break_start?: string;
  break_end?: string;
  status?: string;
  shift_type?: string;
  notes?: string;
  approval_notes?: string;
}

// Attendance response
export interface AttendanceResponse {
  id: number;
  date: Date;
  check_in: Date | null;
  check_out: Date | null;
  total_hours: number | null;
  overtime_hours: number | null;
  status: string | null;
  shift_type: string | null;
  employee: {
    id: number;
    name: string;
    employee_id: string | null;
  };
}

// Attendance summary
export interface AttendanceSummary {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  half_days: number;
  leave_days: number;
  holiday_days: number;
  wfh_days: number;
  total_hours: number;
  total_overtime_hours: number;
  average_check_in: string | null;
  average_check_out: string | null;
}

// Attendance select fields for list view
export const ATTENDANCE_LIST_SELECT = {
  id: true,
  date: true,
  check_in: true,
  check_out: true,
  break_start: true,
  break_end: true,
  total_hours: true,
  overtime_hours: true,
  status: true,
  shift_type: true,
  notes: true,
  employee: {
    select: {
      id: true,
      name: true,
      employee_id: true,
      department: { select: { id: true, name: true } },
    },
  },
  workLocation: {
    select: { id: true, name: true },
  },
} as const;

// Attendance select fields for detail view
export const ATTENDANCE_DETAIL_SELECT = {
  ...ATTENDANCE_LIST_SELECT,
  check_in_location: true,
  check_out_location: true,
  check_in_latitude: true,
  check_in_longitude: true,
  check_out_latitude: true,
  check_out_longitude: true,
  check_in_address: true,
  check_out_address: true,
  location_accuracy_meters: true,
  approved_by: true,
  approved_at: true,
  approval_notes: true,
  check_in_photo: true,
  check_out_photo: true,
  device_id: true,
  device_type: true,
  browser: true,
  os: true,
  ip_address: true,
  shift_start_time: true,
  shift_end_time: true,
  approver: {
    select: { id: true, name: true },
  },
  created_at: true,
  updated_at: true,
} as const;
