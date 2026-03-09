import { z } from 'zod';
import {
  paginationSchema,
  dateStringSchema,
  percentageSchema,
} from './common.schema';

// ==========================================
// PERFORMANCE VALIDATION SCHEMAS
// ==========================================

// Enums
const reviewStatusSchema = z.enum([
  'draft',
  'self_assessment',
  'manager_review',
  'hr_review',
  'calibration',
  'completed',
  'cancelled',
]);

const goalStatusSchema = z.enum([
  'draft',
  'active',
  'in_progress',
  'completed',
  'cancelled',
  'deferred',
]);

const cycleStatusSchema = z.enum([
  'draft',
  'active',
  'in_progress',
  'calibration',
  'completed',
]);

const reviewTypeSchema = z.enum([
  'annual',
  'mid_year',
  'quarterly',
  'probation',
  'promotion',
  '360_feedback',
]);

const goalCategorySchema = z.enum([
  'performance',
  'development',
  'behavioral',
  'strategic',
  'team',
]);

const goalPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

// ==========================================
// PERFORMANCE REVIEW SCHEMAS
// ==========================================

export const createReviewSchema = z.object({
  employee_id: z.number().int().positive({ message: 'Employee ID is required' }),
  reviewer_id: z.number().int().positive().optional(),
  cycle_id: z.number().int().positive().optional(),
  review_period_start: dateStringSchema.optional(),
  review_period_end: dateStringSchema.optional(),
  review_type: z.string().min(1, 'Review type is required'),
});

export const updateReviewSchema = z.object({
  overall_rating: z.number().min(0).max(5).optional(),
  goal_achievement_score: z.number().min(0).max(100).optional(),
  competency_score: z.number().min(0).max(100).optional(),
  strengths: z.string().optional(),
  areas_for_improvement: z.string().optional(),
  goals_achievement: z.string().optional(),
  development_needs: z.string().optional(),
  manager_comments: z.string().optional(),
  employee_comments: z.string().optional(),
  recommendations: z.string().optional(),
  promotion_eligible: z.boolean().optional(),
  salary_increase_eligible: z.boolean().optional(),
  suggested_increase_percentage: z.number().min(0).max(100).optional(),
});

export const submitSelfAssessmentSchema = z.object({
  overall_rating: z.number().min(0).max(5).optional(),
  goal_achievement_score: z.number().min(0).max(100).optional(),
  strengths: z.string().optional(),
  areas_for_improvement: z.string().optional(),
  goals_achievement: z.string().optional(),
  employee_comments: z.string().optional(),
});

export const submitManagerReviewSchema = z.object({
  overall_rating: z.number().min(0).max(5, 'Overall rating is required'),
  final_score: z.number().min(0).optional(),
  goal_achievement_score: z.number().min(0).max(100).optional(),
  competency_score: z.number().min(0).max(100).optional(),
  strengths: z.string().optional(),
  areas_for_improvement: z.string().optional(),
  development_needs: z.string().optional(),
  manager_comments: z.string().min(1, 'Manager comments are required'),
  recommendations: z.string().optional(),
  promotion_eligible: z.boolean().optional(),
  salary_increase_eligible: z.boolean().optional(),
  suggested_increase_percentage: z.number().min(0).max(100).optional(),
});

export const listReviewsQuerySchema = paginationSchema.extend({
  employee_id: z.coerce.number().int().positive().optional(),
  reviewer_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  department_id: z.coerce.number().int().positive().optional(),
  cycle_id: z.coerce.number().int().positive().optional(),
  review_type: z.string().optional(),
  status: z.string().optional(),
  year: z.coerce.number().int().positive().optional(),
  sort_by: z.string().default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// ==========================================
// GOAL SCHEMAS
// ==========================================

export const createGoalSchema = z.object({
  employee_id: z.number().int().positive({ message: 'Employee ID is required' }),
  performance_review_id: z.number().int().positive().optional(),
  kpi_id: z.number().int().positive().optional(),
  parent_goal_id: z.number().int().positive().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  target_value: z.number().optional(),
  unit_of_measure: z.string().optional(),
  start_date: dateStringSchema.optional(),
  target_date: dateStringSchema.optional(),
  weight: z.number().min(0).max(100).optional(),
  is_stretch_goal: z.boolean().optional(),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  target_value: z.number().optional(),
  current_value: z.number().optional(),
  unit_of_measure: z.string().optional(),
  start_date: dateStringSchema.optional(),
  target_date: dateStringSchema.optional(),
  progress_percentage: percentageSchema.optional(),
  achievement_notes: z.string().optional(),
  employee_comments: z.string().optional(),
  blockers: z.string().optional(),
  weight: z.number().min(0).max(100).optional(),
  is_stretch_goal: z.boolean().optional(),
});

export const updateGoalProgressSchema = z.object({
  current_value: z.number().optional(),
  progress_percentage: percentageSchema,
  achievement_notes: z.string().optional(),
  blockers: z.string().optional(),
});

export const managerFeedbackSchema = z.object({
  manager_feedback: z.string().min(1, 'Manager feedback is required'),
  score: z.number().min(0).max(5).optional(),
});

export const listGoalsQuerySchema = paginationSchema.extend({
  employee_id: z.coerce.number().int().positive().optional(),
  performance_review_id: z.coerce.number().int().positive().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  year: z.coerce.number().int().positive().optional(),
  sort_by: z.string().default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// ==========================================
// KPI SCHEMAS
// ==========================================

export const createKPISchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  department_id: z.number().int().positive().optional(),
  position_id: z.number().int().positive().optional(),
  unit_of_measure: z.string().optional(),
  target_frequency: z.string().optional(),
  target_type: z.string().optional(),
  weight: z.number().min(0).max(100).optional(),
  calculation_method: z.string().optional(),
  formula: z.string().optional(),
  data_source: z.string().optional(),
  benchmark_value: z.number().optional(),
  threshold_red: z.number().optional(),
  threshold_yellow: z.number().optional(),
  threshold_green: z.number().optional(),
  effective_from: dateStringSchema.optional(),
  effective_until: dateStringSchema.optional(),
});

export const updateKPISchema = createKPISchema.partial().extend({
  is_active: z.boolean().optional(),
});

export const listKPIsQuerySchema = paginationSchema.extend({
  department_id: z.coerce.number().int().positive().optional(),
  position_id: z.coerce.number().int().positive().optional(),
  category: z.string().optional(),
  is_active: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

// ==========================================
// PERFORMANCE CYCLE SCHEMAS
// ==========================================

export const createCycleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  year: z.number().int().positive({ message: 'Year is required' }),
  cycle_type: z.string().optional(),
  start_date: dateStringSchema,
  end_date: dateStringSchema,
  self_assessment_start: dateStringSchema.optional(),
  self_assessment_end: dateStringSchema.optional(),
  manager_review_start: dateStringSchema.optional(),
  manager_review_end: dateStringSchema.optional(),
  calibration_start: dateStringSchema.optional(),
  calibration_end: dateStringSchema.optional(),
});

export const updateCycleSchema = createCycleSchema.partial().extend({
  status: z.string().optional(),
});

export const listCyclesQuerySchema = paginationSchema.extend({
  year: z.coerce.number().int().positive().optional(),
  status: z.string().optional(),
});

// ==========================================
// FEEDBACK SCHEMAS
// ==========================================

export const createFeedbackSchema = z.object({
  performance_review_id: z.number().int().positive().optional(),
  employee_id: z.number().int().positive({ message: 'Employee ID is required' }),
  feedback_type: z.string().optional(),
  relationship: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  comments: z.string().optional(),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
  is_anonymous: z.boolean().optional(),
});

// ==========================================
// SHARED PARAM SCHEMAS
// ==========================================

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const reviewIdParamSchema = z.object({
  reviewId: z.coerce.number().int().positive(),
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type SubmitSelfAssessmentInput = z.infer<typeof submitSelfAssessmentSchema>;
export type SubmitManagerReviewInput = z.infer<typeof submitManagerReviewSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type UpdateGoalProgressInput = z.infer<typeof updateGoalProgressSchema>;
export type ManagerFeedbackInput = z.infer<typeof managerFeedbackSchema>;
export type ListGoalsQuery = z.infer<typeof listGoalsQuerySchema>;
export type CreateKPIInput = z.infer<typeof createKPISchema>;
export type UpdateKPIInput = z.infer<typeof updateKPISchema>;
export type ListKPIsQuery = z.infer<typeof listKPIsQuerySchema>;
export type CreateCycleInput = z.infer<typeof createCycleSchema>;
export type UpdateCycleInput = z.infer<typeof updateCycleSchema>;
export type ListCyclesQuery = z.infer<typeof listCyclesQuerySchema>;
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
