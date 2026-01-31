import { Prisma } from '@prisma/client';

// ==========================================
// TYPE CONSTANTS
// ==========================================

export const HOLIDAY_TYPES = {
  NATIONAL: 'national',         // Libur nasional
  COMPANY: 'company',           // Libur perusahaan
  RELIGIOUS: 'religious',       // Libur keagamaan
  CUTI_BERSAMA: 'cuti_bersama', // Cuti bersama
} as const;

export const HOLIDAY_SOURCE = {
  MANUAL: 'manual',
  API: 'api',
  IMPORT: 'import',
} as const;

// ==========================================
// QUERY INTERFACES
// ==========================================

export interface HolidayListQuery {
  page?: number;
  limit?: number;
  company_id?: number;
  year?: number;
  month?: number;
  type?: string;
  is_active?: boolean;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface HolidayCalendarQuery {
  company_id?: number;
  year: number;
  month?: number;
}

// ==========================================
// DTOs
// ==========================================

export interface CreateHolidayDTO {
  name: string;
  date: string;
  type: string;
  company_id?: number;
  description?: string;
  is_recurring?: boolean;
}

export interface UpdateHolidayDTO {
  name?: string;
  date?: string;
  type?: string;
  description?: string;
  is_recurring?: boolean;
  is_active?: boolean;
}

export interface BulkCreateHolidayDTO {
  holidays: CreateHolidayDTO[];
  company_id?: number;
}

// ==========================================
// SELECT FIELDS
// ==========================================

export const HOLIDAY_LIST_SELECT = {
  id: true,
  name: true,
  date: true,
  type: true,
  company_id: true,
  description: true,
  is_recurring: true,
  source: true,
  is_active: true,
  created_at: true,
  company: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
} satisfies Prisma.HolidaySelect;

export const HOLIDAY_DETAIL_SELECT = {
  ...HOLIDAY_LIST_SELECT,
  created_by: true,
  updated_at: true,
} satisfies Prisma.HolidaySelect;

// ==========================================
// NATIONAL HOLIDAYS DATA (Indonesia)
// ==========================================

export const INDONESIA_NATIONAL_HOLIDAYS_2025 = [
  { date: '2025-01-01', name: 'Tahun Baru Masehi', type: 'national' },
  { date: '2025-01-29', name: 'Tahun Baru Imlek', type: 'religious' },
  { date: '2025-03-29', name: 'Hari Raya Nyepi', type: 'religious' },
  { date: '2025-03-31', name: 'Hari Raya Idul Fitri', type: 'religious' },
  { date: '2025-04-01', name: 'Hari Raya Idul Fitri', type: 'religious' },
  { date: '2025-04-18', name: 'Wafat Isa Almasih', type: 'religious' },
  { date: '2025-05-01', name: 'Hari Buruh Internasional', type: 'national' },
  { date: '2025-05-12', name: 'Hari Raya Waisak', type: 'religious' },
  { date: '2025-05-29', name: 'Kenaikan Isa Almasih', type: 'religious' },
  { date: '2025-06-01', name: 'Hari Lahir Pancasila', type: 'national' },
  { date: '2025-06-06', name: 'Hari Raya Idul Adha', type: 'religious' },
  { date: '2025-06-27', name: 'Tahun Baru Islam', type: 'religious' },
  { date: '2025-08-17', name: 'Hari Kemerdekaan RI', type: 'national' },
  { date: '2025-09-05', name: 'Maulid Nabi Muhammad SAW', type: 'religious' },
  { date: '2025-12-25', name: 'Hari Raya Natal', type: 'religious' },
];

export const INDONESIA_NATIONAL_HOLIDAYS_2026 = [
  { date: '2026-01-01', name: 'Tahun Baru Masehi', type: 'national' },
  { date: '2026-02-17', name: 'Tahun Baru Imlek', type: 'religious' },
  { date: '2026-03-19', name: 'Hari Raya Nyepi', type: 'religious' },
  { date: '2026-03-20', name: 'Hari Raya Idul Fitri', type: 'religious' },
  { date: '2026-03-21', name: 'Hari Raya Idul Fitri', type: 'religious' },
  { date: '2026-04-03', name: 'Wafat Isa Almasih', type: 'religious' },
  { date: '2026-05-01', name: 'Hari Buruh Internasional', type: 'national' },
  { date: '2026-05-14', name: 'Kenaikan Isa Almasih', type: 'religious' },
  { date: '2026-05-27', name: 'Hari Raya Idul Adha', type: 'religious' },
  { date: '2026-06-01', name: 'Hari Lahir Pancasila', type: 'national' },
  { date: '2026-06-01', name: 'Hari Raya Waisak', type: 'religious' },
  { date: '2026-06-17', name: 'Tahun Baru Islam', type: 'religious' },
  { date: '2026-08-17', name: 'Hari Kemerdekaan RI', type: 'national' },
  { date: '2026-08-26', name: 'Maulid Nabi Muhammad SAW', type: 'religious' },
  { date: '2026-12-25', name: 'Hari Raya Natal', type: 'religious' },
];
