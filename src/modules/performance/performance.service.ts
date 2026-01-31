import { PrismaClient, Prisma } from '@prisma/client';
import {
  PerformanceReviewListQuery,
  GoalListQuery,
  KPIListQuery,
  PerformanceCycleListQuery,
  CreatePerformanceReviewDTO,
  UpdatePerformanceReviewDTO,
  SubmitSelfAssessmentDTO,
  SubmitManagerReviewDTO,
  CreateGoalDTO,
  UpdateGoalDTO,
  UpdateGoalProgressDTO,
  ManagerFeedbackDTO,
  CreateKPIDTO,
  UpdateKPIDTO,
  CreatePerformanceCycleDTO,
  UpdatePerformanceCycleDTO,
  CreateFeedbackDTO,
  REVIEW_STATUS,
  GOAL_STATUS,
  PERFORMANCE_REVIEW_LIST_SELECT,
  PERFORMANCE_REVIEW_DETAIL_SELECT,
  GOAL_LIST_SELECT,
  GOAL_DETAIL_SELECT,
  KPI_SELECT,
  PERFORMANCE_CYCLE_SELECT,
  FEEDBACK_SELECT,
} from './performance.types';
import { AuthUser, hasCompanyAccess, canAccessEmployee, getHighestRoleLevel, ROLE_HIERARCHY } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class PerformanceService {
  // ==========================================
  // PERFORMANCE REVIEW METHODS
  // ==========================================

  async listReviews(query: PerformanceReviewListQuery, user: AuthUser) {
    const {
      page = 1,
      limit = 10,
      employee_id,
      reviewer_id,
      company_id,
      department_id,
      cycle_id,
      review_type,
      status,
      year,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PerformanceReviewWhereInput = {};

    if (employee_id) where.employee_id = employee_id;
    if (reviewer_id) where.reviewer_id = reviewer_id;
    if (cycle_id) where.cycle_id = cycle_id;
    if (review_type) where.review_type = review_type;
    if (status) where.status = status;

    if (company_id) {
      where.employee = { company_id };
    } else if (user.employee?.company_id && getHighestRoleLevel(user.roles) < ROLE_HIERARCHY['CEO']) {
      where.employee = { company_id: user.employee.company_id };
    }

    if (department_id) {
      where.employee = { ...where.employee as object, department_id };
    }

    if (year) {
      where.cycle = { year };
    }

    const orderBy: Prisma.PerformanceReviewOrderByWithRelationInput = {};
    (orderBy as any)[sort_by] = sort_order;

    const [data, total] = await Promise.all([
      prisma.performanceReview.findMany({
        where,
        select: PERFORMANCE_REVIEW_LIST_SELECT,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.performanceReview.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getReviewById(id: number, user: AuthUser) {
    const review = await prisma.performanceReview.findUnique({
      where: { id },
      select: PERFORMANCE_REVIEW_DETAIL_SELECT,
    });

    if (!review) {
      throw new Error('Performance review not found');
    }

    if (!await canAccessEmployee(user, review.employee_id)) {
      throw new Error('Access denied');
    }

    return review;
  }

  async getMyReviews(query: PerformanceReviewListQuery, user: AuthUser) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    return this.listReviews({ ...query, employee_id: user.employee.id }, user);
  }

  async getMyCurrentReview(user: AuthUser) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    // Get active cycle
    const activeCycle = await prisma.performanceCycle.findFirst({
      where: { status: { in: ['active', 'in_progress'] } },
      orderBy: { start_date: 'desc' },
    });

    if (!activeCycle) {
      return null;
    }

    return prisma.performanceReview.findFirst({
      where: {
        employee_id: user.employee.id,
        cycle_id: activeCycle.id,
      },
      select: PERFORMANCE_REVIEW_DETAIL_SELECT,
    });
  }

  async createReview(data: CreatePerformanceReviewDTO, user: AuthUser) {
    if (!await canAccessEmployee(user, data.employee_id)) {
      throw new Error('Access denied to this employee');
    }

    return prisma.performanceReview.create({
      data: {
        employee_id: data.employee_id,
        reviewer_id: data.reviewer_id,
        cycle_id: data.cycle_id,
        review_period_start: data.review_period_start ? new Date(data.review_period_start) : undefined,
        review_period_end: data.review_period_end ? new Date(data.review_period_end) : undefined,
        review_type: data.review_type,
        status: REVIEW_STATUS.DRAFT,
      },
      select: PERFORMANCE_REVIEW_DETAIL_SELECT,
    });
  }

  async updateReview(id: number, data: UpdatePerformanceReviewDTO, user: AuthUser) {
    const existing = await prisma.performanceReview.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Performance review not found');
    }

    if (!await canAccessEmployee(user, existing.employee_id)) {
      throw new Error('Access denied');
    }

    return prisma.performanceReview.update({
      where: { id },
      data,
      select: PERFORMANCE_REVIEW_DETAIL_SELECT,
    });
  }

  async submitSelfAssessment(id: number, data: SubmitSelfAssessmentDTO, user: AuthUser) {
    const existing = await prisma.performanceReview.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Performance review not found');
    }

    // Only the employee can submit their self-assessment
    if (user.employee?.id !== existing.employee_id) {
      throw new Error('Only the employee can submit self-assessment');
    }

    if (existing.status !== REVIEW_STATUS.DRAFT && existing.status !== REVIEW_STATUS.SELF_ASSESSMENT) {
      throw new Error('Cannot submit self-assessment at this stage');
    }

    return prisma.performanceReview.update({
      where: { id },
      data: {
        ...data,
        status: REVIEW_STATUS.MANAGER_REVIEW,
      },
      select: PERFORMANCE_REVIEW_DETAIL_SELECT,
    });
  }

  async submitManagerReview(id: number, data: SubmitManagerReviewDTO, user: AuthUser) {
    const existing = await prisma.performanceReview.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!existing) {
      throw new Error('Performance review not found');
    }

    // Only the reviewer/manager can submit
    const isReviewer = existing.reviewer_id === user.employee?.id;
    const isManager = existing.employee.manager_id === user.employee?.id ||
                      existing.employee.direct_manager_id === user.employee?.id;
    const isHR = getHighestRoleLevel(user.roles) >= ROLE_HIERARCHY['HR Staff'];

    if (!isReviewer && !isManager && !isHR) {
      throw new Error('Not authorized to submit manager review');
    }

    if (existing.status !== REVIEW_STATUS.MANAGER_REVIEW) {
      throw new Error('Review is not ready for manager submission');
    }

    return prisma.performanceReview.update({
      where: { id },
      data: {
        ...data,
        status: REVIEW_STATUS.HR_REVIEW,
      },
      select: PERFORMANCE_REVIEW_DETAIL_SELECT,
    });
  }

  async completeReview(id: number, user: AuthUser) {
    const existing = await prisma.performanceReview.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Performance review not found');
    }

    // Only HR can complete
    if (getHighestRoleLevel(user.roles) < ROLE_HIERARCHY['HR Staff']) {
      throw new Error('Only HR can complete reviews');
    }

    return prisma.performanceReview.update({
      where: { id },
      data: {
        status: REVIEW_STATUS.COMPLETED,
        final_score: existing.overall_rating,
        completed_at: new Date(),
        approved_by: user.employee?.id,
        approved_at: new Date(),
      },
      select: PERFORMANCE_REVIEW_DETAIL_SELECT,
    });
  }

  async getTeamReviews(user: AuthUser) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    // Get active cycle
    const activeCycle = await prisma.performanceCycle.findFirst({
      where: { status: { in: ['active', 'in_progress'] } },
      orderBy: { start_date: 'desc' },
    });

    if (!activeCycle) {
      return [];
    }

    return prisma.performanceReview.findMany({
      where: {
        cycle_id: activeCycle.id,
        OR: [
          { reviewer_id: user.employee.id },
          { employee: { manager_id: user.employee.id } },
          { employee: { direct_manager_id: user.employee.id } },
        ],
      },
      select: PERFORMANCE_REVIEW_LIST_SELECT,
      orderBy: { status: 'asc' },
    });
  }

  // ==========================================
  // GOAL METHODS
  // ==========================================

  async listGoals(query: GoalListQuery, user: AuthUser) {
    const {
      page = 1,
      limit = 10,
      employee_id,
      performance_review_id,
      category,
      status,
      priority,
      year,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.GoalWhereInput = {};

    if (employee_id) where.employee_id = employee_id;
    if (performance_review_id) where.performance_review_id = performance_review_id;
    if (category) where.category = category;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31);
      where.target_date = { gte: startOfYear, lte: endOfYear };
    }

    const orderBy: Prisma.GoalOrderByWithRelationInput = {};
    (orderBy as any)[sort_by] = sort_order;

    const [data, total] = await Promise.all([
      prisma.goal.findMany({
        where,
        select: GOAL_LIST_SELECT,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.goal.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getGoalById(id: number, user: AuthUser) {
    const goal = await prisma.goal.findUnique({
      where: { id },
      select: GOAL_DETAIL_SELECT,
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    if (!await canAccessEmployee(user, goal.employee_id)) {
      throw new Error('Access denied');
    }

    return goal;
  }

  async getMyGoals(query: GoalListQuery, user: AuthUser) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    return this.listGoals({ ...query, employee_id: user.employee.id }, user);
  }

  async createGoal(data: CreateGoalDTO, user: AuthUser) {
    if (!await canAccessEmployee(user, data.employee_id)) {
      throw new Error('Access denied to this employee');
    }

    return prisma.goal.create({
      data: {
        employee_id: data.employee_id,
        performance_review_id: data.performance_review_id,
        kpi_id: data.kpi_id,
        parent_goal_id: data.parent_goal_id,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        target_value: data.target_value,
        unit_of_measure: data.unit_of_measure,
        start_date: data.start_date ? new Date(data.start_date) : undefined,
        target_date: data.target_date ? new Date(data.target_date) : undefined,
        weight: data.weight,
        is_stretch_goal: data.is_stretch_goal ?? false,
        status: GOAL_STATUS.ACTIVE,
        created_by: user.employee?.id,
      },
      select: GOAL_DETAIL_SELECT,
    });
  }

  async updateGoal(id: number, data: UpdateGoalDTO, user: AuthUser) {
    const existing = await prisma.goal.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Goal not found');
    }

    // Employee can update their own goals, manager/HR can update any
    const isOwner = user.employee?.id === existing.employee_id;
    const canManage = await canAccessEmployee(user, existing.employee_id);

    if (!isOwner && !canManage) {
      throw new Error('Access denied');
    }

    return prisma.goal.update({
      where: { id },
      data: {
        ...data,
        start_date: data.start_date ? new Date(data.start_date) : undefined,
        target_date: data.target_date ? new Date(data.target_date) : undefined,
        updated_by: user.employee?.id,
      },
      select: GOAL_DETAIL_SELECT,
    });
  }

  async updateGoalProgress(id: number, data: UpdateGoalProgressDTO, user: AuthUser) {
    const existing = await prisma.goal.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Goal not found');
    }

    // Only employee can update their own goal progress
    if (user.employee?.id !== existing.employee_id) {
      throw new Error('Only the goal owner can update progress');
    }

    // Auto-complete if 100%
    const status = data.progress_percentage >= 100 ? GOAL_STATUS.COMPLETED : GOAL_STATUS.IN_PROGRESS;
    const completedDate = data.progress_percentage >= 100 ? new Date() : null;

    return prisma.goal.update({
      where: { id },
      data: {
        current_value: data.current_value,
        progress_percentage: data.progress_percentage,
        achievement_notes: data.achievement_notes,
        blockers: data.blockers,
        status,
        completed_date: completedDate,
        updated_by: user.employee?.id,
      },
      select: GOAL_DETAIL_SELECT,
    });
  }

  async addManagerFeedback(id: number, data: ManagerFeedbackDTO, user: AuthUser) {
    const existing = await prisma.goal.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!existing) {
      throw new Error('Goal not found');
    }

    // Only manager can add feedback
    const isManager = existing.employee.manager_id === user.employee?.id ||
                      existing.employee.direct_manager_id === user.employee?.id;
    const isHR = getHighestRoleLevel(user.roles) >= ROLE_HIERARCHY['HR Staff'];

    if (!isManager && !isHR) {
      throw new Error('Only manager or HR can add feedback');
    }

    return prisma.goal.update({
      where: { id },
      data: {
        manager_feedback: data.manager_feedback,
        score: data.score,
        updated_by: user.employee?.id,
      },
      select: GOAL_DETAIL_SELECT,
    });
  }

  async deleteGoal(id: number, user: AuthUser) {
    const existing = await prisma.goal.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Goal not found');
    }

    if (!await canAccessEmployee(user, existing.employee_id)) {
      throw new Error('Access denied');
    }

    return prisma.goal.update({
      where: { id },
      data: { status: GOAL_STATUS.CANCELLED },
    });
  }

  // ==========================================
  // KPI METHODS
  // ==========================================

  async listKPIs(query: KPIListQuery, user: AuthUser) {
    const { page = 1, limit = 50, department_id, position_id, category, is_active } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.KPIWhereInput = {};

    if (department_id) where.department_id = department_id;
    if (position_id) where.position_id = position_id;
    if (category) where.category = category;
    if (is_active !== undefined) where.is_active = is_active;

    const [data, total] = await Promise.all([
      prisma.kPI.findMany({
        where,
        select: KPI_SELECT,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.kPI.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getKPIById(id: number) {
    const kpi = await prisma.kPI.findUnique({
      where: { id },
      select: KPI_SELECT,
    });

    if (!kpi) {
      throw new Error('KPI not found');
    }

    return kpi;
  }

  async createKPI(data: CreateKPIDTO, user: AuthUser) {
    return prisma.kPI.create({
      data: {
        ...data,
        effective_from: data.effective_from ? new Date(data.effective_from) : undefined,
        effective_until: data.effective_until ? new Date(data.effective_until) : undefined,
        created_by: user.employee?.id,
      },
      select: KPI_SELECT,
    });
  }

  async updateKPI(id: number, data: UpdateKPIDTO, user: AuthUser) {
    const existing = await prisma.kPI.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('KPI not found');
    }

    return prisma.kPI.update({
      where: { id },
      data: {
        ...data,
        effective_from: data.effective_from ? new Date(data.effective_from) : undefined,
        effective_until: data.effective_until ? new Date(data.effective_until) : undefined,
        updated_by: user.employee?.id,
      },
      select: KPI_SELECT,
    });
  }

  async deleteKPI(id: number, user: AuthUser) {
    const existing = await prisma.kPI.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('KPI not found');
    }

    return prisma.kPI.update({
      where: { id },
      data: { is_active: false },
    });
  }

  // ==========================================
  // PERFORMANCE CYCLE METHODS
  // ==========================================

  async listCycles(query: PerformanceCycleListQuery, user: AuthUser) {
    const { page = 1, limit = 10, year, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PerformanceCycleWhereInput = {};

    if (year) where.year = year;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.performanceCycle.findMany({
        where,
        select: PERFORMANCE_CYCLE_SELECT,
        skip,
        take: limit,
        orderBy: { start_date: 'desc' },
      }),
      prisma.performanceCycle.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCycleById(id: number) {
    const cycle = await prisma.performanceCycle.findUnique({
      where: { id },
      select: PERFORMANCE_CYCLE_SELECT,
    });

    if (!cycle) {
      throw new Error('Performance cycle not found');
    }

    return cycle;
  }

  async getActiveCycle() {
    return prisma.performanceCycle.findFirst({
      where: { status: { in: ['active', 'in_progress'] } },
      select: PERFORMANCE_CYCLE_SELECT,
      orderBy: { start_date: 'desc' },
    });
  }

  async createCycle(data: CreatePerformanceCycleDTO, user: AuthUser) {
    return prisma.performanceCycle.create({
      data: {
        name: data.name,
        description: data.description,
        year: data.year,
        cycle_type: data.cycle_type,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        self_assessment_start: data.self_assessment_start ? new Date(data.self_assessment_start) : undefined,
        self_assessment_end: data.self_assessment_end ? new Date(data.self_assessment_end) : undefined,
        manager_review_start: data.manager_review_start ? new Date(data.manager_review_start) : undefined,
        manager_review_end: data.manager_review_end ? new Date(data.manager_review_end) : undefined,
        calibration_start: data.calibration_start ? new Date(data.calibration_start) : undefined,
        calibration_end: data.calibration_end ? new Date(data.calibration_end) : undefined,
        status: 'draft',
      },
      select: PERFORMANCE_CYCLE_SELECT,
    });
  }

  async updateCycle(id: number, data: UpdatePerformanceCycleDTO, user: AuthUser) {
    const existing = await prisma.performanceCycle.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Performance cycle not found');
    }

    return prisma.performanceCycle.update({
      where: { id },
      data: {
        ...data,
        start_date: data.start_date ? new Date(data.start_date) : undefined,
        end_date: data.end_date ? new Date(data.end_date) : undefined,
        self_assessment_start: data.self_assessment_start ? new Date(data.self_assessment_start) : undefined,
        self_assessment_end: data.self_assessment_end ? new Date(data.self_assessment_end) : undefined,
        manager_review_start: data.manager_review_start ? new Date(data.manager_review_start) : undefined,
        manager_review_end: data.manager_review_end ? new Date(data.manager_review_end) : undefined,
        calibration_start: data.calibration_start ? new Date(data.calibration_start) : undefined,
        calibration_end: data.calibration_end ? new Date(data.calibration_end) : undefined,
      },
      select: PERFORMANCE_CYCLE_SELECT,
    });
  }

  async activateCycle(id: number, user: AuthUser) {
    // Deactivate other active cycles first
    await prisma.performanceCycle.updateMany({
      where: { status: 'active' },
      data: { status: 'completed' },
    });

    return prisma.performanceCycle.update({
      where: { id },
      data: { status: 'active' },
      select: PERFORMANCE_CYCLE_SELECT,
    });
  }

  // ==========================================
  // FEEDBACK METHODS
  // ==========================================

  async createFeedback(data: CreateFeedbackDTO, user: AuthUser) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    return prisma.performanceFeedback.create({
      data: {
        performance_review_id: data.performance_review_id,
        employee_id: data.employee_id,
        feedback_from: user.employee.id,
        feedback_type: data.feedback_type,
        relationship: data.relationship,
        rating: data.rating,
        comments: data.comments,
        strengths: data.strengths,
        improvements: data.improvements,
        is_anonymous: data.is_anonymous ?? false,
        submitted_at: new Date(),
      },
      select: FEEDBACK_SELECT,
    });
  }

  async getFeedbackForReview(reviewId: number, user: AuthUser) {
    const review = await prisma.performanceReview.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new Error('Performance review not found');
    }

    if (!await canAccessEmployee(user, review.employee_id)) {
      throw new Error('Access denied');
    }

    return prisma.performanceFeedback.findMany({
      where: { performance_review_id: reviewId },
      select: FEEDBACK_SELECT,
    });
  }
}
