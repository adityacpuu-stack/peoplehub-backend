import { Prisma } from '@prisma/client';

// ==========================================
// STATUS CONSTANTS
// ==========================================

export const REVIEW_STATUS = {
  DRAFT: 'draft',
  SELF_ASSESSMENT: 'self_assessment',
  MANAGER_REVIEW: 'manager_review',
  HR_REVIEW: 'hr_review',
  CALIBRATION: 'calibration',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const GOAL_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DEFERRED: 'deferred',
} as const;

export const CYCLE_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  IN_PROGRESS: 'in_progress',
  CALIBRATION: 'calibration',
  COMPLETED: 'completed',
} as const;

export const REVIEW_TYPES = {
  ANNUAL: 'annual',
  MID_YEAR: 'mid_year',
  QUARTERLY: 'quarterly',
  PROBATION: 'probation',
  PROMOTION: 'promotion',
  FEEDBACK_360: '360_feedback',
} as const;

export const GOAL_CATEGORIES = {
  PERFORMANCE: 'performance',
  DEVELOPMENT: 'development',
  BEHAVIORAL: 'behavioral',
  STRATEGIC: 'strategic',
  TEAM: 'team',
} as const;

// ==========================================
// QUERY INTERFACES
// ==========================================

export interface PerformanceReviewListQuery {
  page?: number;
  limit?: number;
  employee_id?: number;
  reviewer_id?: number;
  company_id?: number;
  department_id?: number;
  cycle_id?: number;
  review_type?: string;
  status?: string;
  year?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface GoalListQuery {
  page?: number;
  limit?: number;
  employee_id?: number;
  performance_review_id?: number;
  category?: string;
  status?: string;
  priority?: string;
  year?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface KPIListQuery {
  page?: number;
  limit?: number;
  department_id?: number;
  position_id?: number;
  category?: string;
  is_active?: boolean;
}

export interface PerformanceCycleListQuery {
  page?: number;
  limit?: number;
  year?: number;
  status?: string;
}

// ==========================================
// DTOs - Performance Review
// ==========================================

export interface CreatePerformanceReviewDTO {
  employee_id: number;
  reviewer_id?: number;
  cycle_id?: number;
  review_period_start?: string;
  review_period_end?: string;
  review_type: string;
}

export interface UpdatePerformanceReviewDTO {
  overall_rating?: number;
  goal_achievement_score?: number;
  competency_score?: number;
  strengths?: string;
  areas_for_improvement?: string;
  goals_achievement?: string;
  development_needs?: string;
  manager_comments?: string;
  employee_comments?: string;
  recommendations?: string;
  promotion_eligible?: boolean;
  salary_increase_eligible?: boolean;
  suggested_increase_percentage?: number;
}

export interface SubmitSelfAssessmentDTO {
  overall_rating?: number;
  goal_achievement_score?: number;
  strengths?: string;
  areas_for_improvement?: string;
  goals_achievement?: string;
  employee_comments?: string;
}

export interface SubmitManagerReviewDTO {
  overall_rating: number;
  final_score?: number;
  goal_achievement_score?: number;
  competency_score?: number;
  strengths?: string;
  areas_for_improvement?: string;
  development_needs?: string;
  manager_comments: string;
  recommendations?: string;
  promotion_eligible?: boolean;
  salary_increase_eligible?: boolean;
  suggested_increase_percentage?: number;
}

// ==========================================
// DTOs - Goal
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
  unit_of_measure?: string;
  start_date?: string;
  target_date?: string;
  weight?: number;
  is_stretch_goal?: boolean;
}

export interface UpdateGoalDTO {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  target_value?: number;
  current_value?: number;
  unit_of_measure?: string;
  start_date?: string;
  target_date?: string;
  progress_percentage?: number;
  achievement_notes?: string;
  employee_comments?: string;
  blockers?: string;
  weight?: number;
  is_stretch_goal?: boolean;
}

export interface UpdateGoalProgressDTO {
  current_value?: number;
  progress_percentage: number;
  achievement_notes?: string;
  blockers?: string;
}

export interface ManagerFeedbackDTO {
  manager_feedback: string;
  score?: number;
}

// ==========================================
// DTOs - KPI
// ==========================================

export interface CreateKPIDTO {
  name: string;
  code?: string;
  description?: string;
  category?: string;
  department_id?: number;
  position_id?: number;
  unit_of_measure?: string;
  target_frequency?: string;
  target_type?: string;
  weight?: number;
  calculation_method?: string;
  formula?: string;
  data_source?: string;
  benchmark_value?: number;
  threshold_red?: number;
  threshold_yellow?: number;
  threshold_green?: number;
  effective_from?: string;
  effective_until?: string;
}

export interface UpdateKPIDTO extends Partial<CreateKPIDTO> {
  is_active?: boolean;
}

// ==========================================
// DTOs - Performance Cycle
// ==========================================

export interface CreatePerformanceCycleDTO {
  name: string;
  description?: string;
  year: number;
  cycle_type?: string;
  start_date: string;
  end_date: string;
  self_assessment_start?: string;
  self_assessment_end?: string;
  manager_review_start?: string;
  manager_review_end?: string;
  calibration_start?: string;
  calibration_end?: string;
}

export interface UpdatePerformanceCycleDTO extends Partial<CreatePerformanceCycleDTO> {
  status?: string;
}

// ==========================================
// DTOs - Feedback
// ==========================================

export interface CreateFeedbackDTO {
  performance_review_id?: number;
  employee_id: number;
  feedback_type?: string;
  relationship?: string;
  rating?: number;
  comments?: string;
  strengths?: string;
  improvements?: string;
  is_anonymous?: boolean;
}

// ==========================================
// SELECT FIELDS
// ==========================================

export const PERFORMANCE_REVIEW_LIST_SELECT = {
  id: true,
  employee_id: true,
  reviewer_id: true,
  cycle_id: true,
  review_period_start: true,
  review_period_end: true,
  review_type: true,
  status: true,
  overall_rating: true,
  final_score: true,
  completed_at: true,
  created_at: true,
  employee: {
    select: {
      id: true,
      name: true,
      employee_id: true,
      department: { select: { id: true, name: true } },
      position: { select: { id: true, name: true } },
    },
  },
  reviewer: {
    select: {
      id: true,
      name: true,
    },
  },
  cycle: {
    select: {
      id: true,
      name: true,
      year: true,
    },
  },
} satisfies Prisma.PerformanceReviewSelect;

export const PERFORMANCE_REVIEW_DETAIL_SELECT = {
  ...PERFORMANCE_REVIEW_LIST_SELECT,
  goal_achievement_score: true,
  competency_score: true,
  strengths: true,
  areas_for_improvement: true,
  goals_achievement: true,
  development_needs: true,
  manager_comments: true,
  employee_comments: true,
  hr_comments: true,
  calibration_notes: true,
  recommendations: true,
  promotion_eligible: true,
  salary_increase_eligible: true,
  suggested_increase_percentage: true,
  self_assessment_due: true,
  manager_review_due: true,
  next_review_date: true,
  approved_by: true,
  approved_at: true,
  updated_at: true,
  goals: {
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      progress_percentage: true,
      weight: true,
      score: true,
    },
  },
  feedback: {
    select: {
      id: true,
      feedback_type: true,
      rating: true,
      comments: true,
      is_anonymous: true,
    },
  },
} satisfies Prisma.PerformanceReviewSelect;

export const GOAL_LIST_SELECT = {
  id: true,
  employee_id: true,
  performance_review_id: true,
  title: true,
  category: true,
  priority: true,
  target_value: true,
  current_value: true,
  unit_of_measure: true,
  start_date: true,
  target_date: true,
  status: true,
  progress_percentage: true,
  weight: true,
  score: true,
  is_stretch_goal: true,
  created_at: true,
  employee: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.GoalSelect;

export const GOAL_DETAIL_SELECT = {
  ...GOAL_LIST_SELECT,
  description: true,
  completed_date: true,
  achievement_notes: true,
  manager_feedback: true,
  employee_comments: true,
  blockers: true,
  kpi_id: true,
  parent_goal_id: true,
  created_by: true,
  updated_at: true,
  kpi: {
    select: {
      id: true,
      name: true,
      code: true,
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

export const KPI_SELECT = {
  id: true,
  name: true,
  code: true,
  description: true,
  category: true,
  department_id: true,
  position_id: true,
  unit_of_measure: true,
  target_frequency: true,
  target_type: true,
  weight: true,
  calculation_method: true,
  benchmark_value: true,
  threshold_red: true,
  threshold_yellow: true,
  threshold_green: true,
  is_active: true,
  effective_from: true,
  effective_until: true,
  department: {
    select: { id: true, name: true },
  },
  position: {
    select: { id: true, name: true },
  },
} satisfies Prisma.KPISelect;

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
} satisfies Prisma.PerformanceCycleSelect;

export const FEEDBACK_SELECT = {
  id: true,
  performance_review_id: true,
  employee_id: true,
  feedback_from: true,
  feedback_type: true,
  relationship: true,
  rating: true,
  comments: true,
  strengths: true,
  improvements: true,
  is_anonymous: true,
  submitted_at: true,
  giver: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.PerformanceFeedbackSelect;
