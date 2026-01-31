import { Prisma } from '@prisma/client';

// ==========================================
// QUERY INTERFACES
// ==========================================

export interface WorkLocationListQuery {
  page?: number;
  limit?: number;
  search?: string;
  company_id?: number;
  is_active?: boolean;
}

// ==========================================
// DTOs
// ==========================================

export interface CreateWorkLocationDTO {
  name: string;
  code?: string;
  description?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
  enable_attendance?: boolean;
  enable_shift_system?: boolean;
  shift_schedules?: any;
  require_location_verification?: boolean;
  require_photo?: boolean;
  strict_location_check?: boolean;
  location_check_interval_minutes?: number;
  work_start_time?: string;
  work_end_time?: string;
  break_start_time?: string;
  break_end_time?: string;
  late_tolerance_minutes?: number;
  is_active?: boolean;
  company_id: number;
  settings?: any;
}

export interface UpdateWorkLocationDTO {
  name?: string;
  code?: string;
  description?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
  enable_attendance?: boolean;
  enable_shift_system?: boolean;
  shift_schedules?: any;
  require_location_verification?: boolean;
  require_photo?: boolean;
  strict_location_check?: boolean;
  location_check_interval_minutes?: number;
  work_start_time?: string;
  work_end_time?: string;
  break_start_time?: string;
  break_end_time?: string;
  late_tolerance_minutes?: number;
  is_active?: boolean;
  settings?: any;
}

// ==========================================
// SELECT FIELDS
// ==========================================

export const WORK_LOCATION_SELECT = {
  id: true,
  name: true,
  code: true,
  description: true,
  address: true,
  city: true,
  province: true,
  postal_code: true,
  country: true,
  latitude: true,
  longitude: true,
  radius_meters: true,
  enable_attendance: true,
  enable_shift_system: true,
  shift_schedules: true,
  require_location_verification: true,
  require_photo: true,
  strict_location_check: true,
  location_check_interval_minutes: true,
  work_start_time: true,
  work_end_time: true,
  break_start_time: true,
  break_end_time: true,
  late_tolerance_minutes: true,
  is_active: true,
  company_id: true,
  settings: true,
  created_at: true,
  updated_at: true,
  _count: {
    select: {
      employees: true,
      attendances: true,
    },
  },
} satisfies Prisma.WorkLocationSelect;

export const WORK_LOCATION_DETAIL_SELECT = {
  ...WORK_LOCATION_SELECT,
  company: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
} satisfies Prisma.WorkLocationSelect;
