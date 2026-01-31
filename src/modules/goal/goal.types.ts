import { Prisma } from '@prisma/client';

// ==========================================
// ENUMS / CONSTANTS
// ==========================================

export const GOAL_CATEGORIES = ['performance', 'development', 'behavioral', 'strategic', 'team'] as const;
export const GOAL_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export const GOAL_STATUSES = ['draft', 'active', 'in_progress', 'completed', 'cancelled', 'deferred'] as const;

export type GoalCategory = typeof GOAL_CATEGORIES[number];
export type GoalPriority = typeof GOAL_PRIORITIES[number];
export type GoalStatus = typeof GOAL_STATUSES[number];

// ==========================================
// QUERY INTERFACES
// ==========================================

export interface GoalListQuery {
  page?: number;
  limit?: number;
  search?: string;
  employee_id?: number;
  performance_review_id?: number;
  kpi_id?: number;
  category?: string;
  priority?: string;
  status?: string;
  start_from?: string;
  target_to?: string;
}

// ==========================================
// DTOs
// ==========================================

export interface CreateGoalDTO {
  employee_id: number;
  performance_review_id?: number;
  kpi_id?: number;
  parent_goal_id?: number;
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  target_value?: number;
  current_value?: number;
  unit_of_measure?: string;
  start_date?: Date;
  target_date?: Date;
  weight?: number;
  is_stretch_goal?: boolean;
}

export interface UpdateGoalDTO extends Partial<Omit<CreateGoalDTO, 'employee_id'>> {
  status?: string;
  progress_percentage?: number;
  achievement_notes?: string;
  manager_feedback?: string;
  employee_comments?: string;
  blockers?: string;
  score?: number;
  completed_date?: Date;
}

export interface UpdateGoalProgressDTO {
  current_value?: number;
  progress_percentage: number;
  achievement_notes?: string;
  blockers?: string;
}

// ==========================================
// SELECT FIELDS
// ==========================================

export const GOAL_SELECT = {
  id: true,
  employee_id: true,
  performance_review_id: true,
  kpi_id: true,
  parent_goal_id: true,
  title: true,
  description: true,
  category: true,
  priority: true,
  target_value: true,
  current_value: true,
  unit_of_measure: true,
  start_date: true,
  target_date: true,
  completed_date: true,
  status: true,
  progress_percentage: true,
  achievement_notes: true,
  manager_feedback: true,
  employee_comments: true,
  blockers: true,
  weight: true,
  score: true,
  is_stretch_goal: true,
  created_by: true,
  updated_by: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.GoalSelect;

export const GOAL_DETAIL_SELECT = {
  ...GOAL_SELECT,
  employee: {
    select: {
      id: true,
      employee_id: true,
      name: true,
      department: { select: { id: true, name: true } },
      position: { select: { id: true, name: true } },
    },
  },
  kpi: {
    select: {
      id: true,
      name: true,
      code: true,
      target_type: true,
    },
  },
  parent: {
    select: {
      id: true,
      title: true,
    },
  },
  children: {
    select: {
      id: true,
      title: true,
      status: true,
      progress_percentage: true,
    },
  },
} satisfies Prisma.GoalSelect;
