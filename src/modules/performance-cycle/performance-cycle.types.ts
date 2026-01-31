import { Prisma } from '@prisma/client';

// ==========================================
// ENUMS / CONSTANTS
// ==========================================

export const CYCLE_TYPES = ['annual', 'semi_annual', 'quarterly'] as const;
export const CYCLE_STATUSES = ['draft', 'active', 'in_progress', 'calibration', 'completed'] as const;

export type CycleType = typeof CYCLE_TYPES[number];
export type CycleStatus = typeof CYCLE_STATUSES[number];

// ==========================================
// QUERY INTERFACES
// ==========================================

export interface PerformanceCycleListQuery {
  page?: number;
  limit?: number;
  search?: string;
  year?: number;
  cycle_type?: string;
  status?: string;
}

// ==========================================
// DTOs
// ==========================================

export interface CreatePerformanceCycleDTO {
  name: string;
  description?: string;
  year: number;
  cycle_type?: string;
  start_date: Date;
  end_date: Date;
  self_assessment_start?: Date;
  self_assessment_end?: Date;
  manager_review_start?: Date;
  manager_review_end?: Date;
  calibration_start?: Date;
  calibration_end?: Date;
  status?: string;
}

export interface UpdatePerformanceCycleDTO extends Partial<CreatePerformanceCycleDTO> {}

// ==========================================
// SELECT FIELDS
// ==========================================

export const PERFORMANCE_CYCLE_SELECT = {
  id: true,
  name: true,
  description: true,
  year: true,
  cycle_type: true,
  start_date: true,
  end_date: true,
  self_assessment_start: true,
  self_assessment_end: true,
  manager_review_start: true,
  manager_review_end: true,
  calibration_start: true,
  calibration_end: true,
  status: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.PerformanceCycleSelect;

export const PERFORMANCE_CYCLE_DETAIL_SELECT = {
  ...PERFORMANCE_CYCLE_SELECT,
  _count: {
    select: {
      reviews: true,
    },
  },
} satisfies Prisma.PerformanceCycleSelect;
