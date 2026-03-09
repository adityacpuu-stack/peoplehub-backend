import { z } from 'zod';
import { paginationSchema, searchSchema, idParamSchema } from './common.schema';

// ==========================================
// ENUMS
// ==========================================

export const goalCategorySchema = z.enum(['performance', 'development', 'behavioral', 'strategic', 'team']);
export const goalPrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const goalStatusSchema = z.enum(['draft', 'active', 'in_progress', 'completed', 'cancelled', 'deferred']);

// ==========================================
// QUERY SCHEMAS
// ==========================================

export const goalListQuerySchema = paginationSchema.merge(searchSchema).extend({
  employee_id: z.coerce.number().int().positive().optional(),
  performance_review_id: z.coerce.number().int().positive().optional(),
  kpi_id: z.coerce.number().int().positive().optional(),
  category: goalCategorySchema.optional(),
  priority: goalPrioritySchema.optional(),
  status: goalStatusSchema.optional(),
  start_from: z.string().optional(),
  target_to: z.string().optional(),
});

export const goalFilterQuerySchema = z.object({
  status: goalStatusSchema.optional(),
  category: goalCategorySchema.optional(),
});

export const goalTeamQuerySchema = z.object({
  status: goalStatusSchema.optional(),
});

export const goalOverdueQuerySchema = z.object({
  company_id: z.coerce.number().int().positive().optional(),
});

export const goalStatisticsQuerySchema = z.object({
  employee_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
});

// ==========================================
// PARAM SCHEMAS
// ==========================================

export const goalIdParamSchema = idParamSchema;

export const employeeIdParamSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
});

// ==========================================
// BODY SCHEMAS
// ==========================================

export const createGoalSchema = z.object({
  employee_id: z.coerce.number().int().positive(),
  performance_review_id: z.coerce.number().int().positive().optional(),
  kpi_id: z.coerce.number().int().positive().optional(),
  parent_goal_id: z.coerce.number().int().positive().optional(),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  category: goalCategorySchema.optional(),
  priority: goalPrioritySchema.optional(),
  target_value: z.coerce.number().optional(),
  current_value: z.coerce.number().optional(),
  unit_of_measure: z.string().optional(),
  start_date: z.coerce.date().optional(),
  target_date: z.coerce.date().optional(),
  weight: z.coerce.number().min(0).max(100).optional(),
  is_stretch_goal: z.boolean().optional(),
});

export const updateGoalSchema = createGoalSchema.omit({ employee_id: true }).partial().extend({
  status: goalStatusSchema.optional(),
  progress_percentage: z.coerce.number().int().min(0).max(100).optional(),
  achievement_notes: z.string().optional(),
  manager_feedback: z.string().optional(),
  employee_comments: z.string().optional(),
  blockers: z.string().optional(),
  score: z.coerce.number().min(0).optional(),
  completed_date: z.coerce.date().optional(),
});

export const updateGoalProgressSchema = z.object({
  progress_percentage: z.coerce.number().int().min(0).max(100),
  current_value: z.coerce.number().optional(),
  achievement_notes: z.string().optional(),
  blockers: z.string().optional(),
});

export const managerFeedbackSchema = z.object({
  feedback: z.string().min(1, 'Feedback is required'),
  score: z.coerce.number().min(0).optional(),
});

export const employeeCommentSchema = z.object({
  comment: z.string().min(1, 'Comment is required'),
});
