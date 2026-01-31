import { PrismaClient, Prisma } from '@prisma/client';
import {
  GoalListQuery,
  CreateGoalDTO,
  UpdateGoalDTO,
  UpdateGoalProgressDTO,
  GOAL_SELECT,
  GOAL_DETAIL_SELECT,
} from './goal.types';
import { AuthUser } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class GoalService {
  async list(query: GoalListQuery, user: AuthUser) {
    const { page = 1, limit = 20, search, employee_id, performance_review_id, kpi_id, category, priority, status, start_from, target_to } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.GoalWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { employee: { name: { contains: search } } },
      ];
    }

    if (employee_id) where.employee_id = employee_id;
    if (performance_review_id) where.performance_review_id = performance_review_id;
    if (kpi_id) where.kpi_id = kpi_id;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (status) where.status = status;

    if (start_from || target_to) {
      if (start_from) where.start_date = { gte: new Date(start_from) };
      if (target_to) where.target_date = { lte: new Date(target_to) };
    }

    const [data, total] = await Promise.all([
      prisma.goal.findMany({
        where,
        select: GOAL_DETAIL_SELECT,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { target_date: 'asc' }],
      }),
      prisma.goal.count({ where }),
    ]);

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: number) {
    const goal = await prisma.goal.findUnique({
      where: { id },
      select: GOAL_DETAIL_SELECT,
    });
    if (!goal) throw new Error('Goal not found');
    return goal;
  }

  async getByEmployeeId(employeeId: number, query: { status?: string; category?: string } = {}) {
    const where: Prisma.GoalWhereInput = { employee_id: employeeId };
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;

    return prisma.goal.findMany({
      where,
      select: GOAL_DETAIL_SELECT,
      orderBy: [{ priority: 'desc' }, { target_date: 'asc' }],
    });
  }

  async getMyGoals(user: AuthUser, query: { status?: string; category?: string } = {}) {
    if (!user.employee?.id) throw new Error('No employee record found');
    return this.getByEmployeeId(user.employee.id, query);
  }

  async create(data: CreateGoalDTO, user: AuthUser) {
    const employee = await prisma.employee.findUnique({ where: { id: data.employee_id } });
    if (!employee) throw new Error('Employee not found');

    return prisma.goal.create({
      data: {
        ...data,
        status: 'active',
        progress_percentage: 0,
        created_by: user.employee?.id,
      },
      select: GOAL_DETAIL_SELECT,
    });
  }

  async update(id: number, data: UpdateGoalDTO, user: AuthUser) {
    const existing = await prisma.goal.findUnique({ where: { id } });
    if (!existing) throw new Error('Goal not found');

    return prisma.goal.update({
      where: { id },
      data: { ...data, updated_by: user.employee?.id },
      select: GOAL_DETAIL_SELECT,
    });
  }

  async updateProgress(id: number, data: UpdateGoalProgressDTO, user: AuthUser) {
    const existing = await prisma.goal.findUnique({ where: { id } });
    if (!existing) throw new Error('Goal not found');

    const updateData: any = {
      progress_percentage: data.progress_percentage,
      updated_by: user.employee?.id,
    };

    if (data.current_value !== undefined) updateData.current_value = data.current_value;
    if (data.achievement_notes) updateData.achievement_notes = data.achievement_notes;
    if (data.blockers) updateData.blockers = data.blockers;

    // Auto-complete if 100%
    if (data.progress_percentage >= 100) {
      updateData.status = 'completed';
      updateData.completed_date = new Date();
    } else if (existing.status === 'active') {
      updateData.status = 'in_progress';
    }

    return prisma.goal.update({
      where: { id },
      data: updateData,
      select: GOAL_DETAIL_SELECT,
    });
  }

  async delete(id: number, user: AuthUser) {
    const existing = await prisma.goal.findUnique({ where: { id } });
    if (!existing) throw new Error('Goal not found');
    return prisma.goal.delete({ where: { id } });
  }

  async addManagerFeedback(id: number, feedback: string, score: number | undefined, user: AuthUser) {
    const goal = await prisma.goal.findUnique({ where: { id } });
    if (!goal) throw new Error('Goal not found');

    return prisma.goal.update({
      where: { id },
      data: {
        manager_feedback: feedback,
        score: score,
        updated_by: user.employee?.id,
      },
      select: GOAL_DETAIL_SELECT,
    });
  }

  async addEmployeeComment(id: number, comment: string, user: AuthUser) {
    const goal = await prisma.goal.findUnique({ where: { id } });
    if (!goal) throw new Error('Goal not found');

    return prisma.goal.update({
      where: { id },
      data: {
        employee_comments: comment,
        updated_by: user.employee?.id,
      },
      select: GOAL_DETAIL_SELECT,
    });
  }

  async getTeamGoals(managerId: number, query: { status?: string } = {}) {
    const where: Prisma.GoalWhereInput = {
      employee: { manager_id: managerId },
    };
    if (query.status) where.status = query.status;

    return prisma.goal.findMany({
      where,
      select: GOAL_DETAIL_SELECT,
      orderBy: [{ priority: 'desc' }, { target_date: 'asc' }],
    });
  }

  async getOverdueGoals(companyId?: number) {
    const where: Prisma.GoalWhereInput = {
      target_date: { lt: new Date() },
      status: { in: ['active', 'in_progress'] },
    };

    if (companyId) {
      where.employee = { company_id: companyId };
    }

    return prisma.goal.findMany({
      where,
      select: GOAL_DETAIL_SELECT,
      orderBy: { target_date: 'asc' },
    });
  }

  async getStatistics(query: { employee_id?: number; company_id?: number }) {
    const where: Prisma.GoalWhereInput = {};
    if (query.employee_id) where.employee_id = query.employee_id;
    if (query.company_id) where.employee = { company_id: query.company_id };

    const [byStatus, byCategory, byPriority, totals] = await Promise.all([
      prisma.goal.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.goal.groupBy({
        by: ['category'],
        where,
        _count: true,
      }),
      prisma.goal.groupBy({
        by: ['priority'],
        where,
        _count: true,
      }),
      prisma.goal.aggregate({
        where,
        _count: true,
        _avg: { progress_percentage: true, score: true },
      }),
    ]);

    return {
      total_goals: totals._count,
      avg_progress: totals._avg.progress_percentage,
      avg_score: totals._avg.score,
      by_status: byStatus.map((s) => ({ status: s.status, count: s._count })),
      by_category: byCategory.map((c) => ({ category: c.category, count: c._count })),
      by_priority: byPriority.map((p) => ({ priority: p.priority, count: p._count })),
    };
  }
}
