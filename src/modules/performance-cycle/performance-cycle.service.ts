import { PrismaClient, Prisma } from '@prisma/client';
import {
  PerformanceCycleListQuery,
  CreatePerformanceCycleDTO,
  UpdatePerformanceCycleDTO,
  PERFORMANCE_CYCLE_SELECT,
  PERFORMANCE_CYCLE_DETAIL_SELECT,
} from './performance-cycle.types';
import { AuthUser } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class PerformanceCycleService {
  async list(query: PerformanceCycleListQuery, user: AuthUser) {
    const { page = 1, limit = 20, search, year, cycle_type, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PerformanceCycleWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (year) where.year = year;
    if (cycle_type) where.cycle_type = cycle_type;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.performanceCycle.findMany({
        where,
        select: PERFORMANCE_CYCLE_DETAIL_SELECT,
        skip,
        take: limit,
        orderBy: [{ year: 'desc' }, { start_date: 'desc' }],
      }),
      prisma.performanceCycle.count({ where }),
    ]);

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: number) {
    const cycle = await prisma.performanceCycle.findUnique({
      where: { id },
      select: PERFORMANCE_CYCLE_DETAIL_SELECT,
    });
    if (!cycle) throw new Error('Performance cycle not found');
    return cycle;
  }

  async getActive() {
    return prisma.performanceCycle.findFirst({
      where: { status: { in: ['active', 'in_progress'] } },
      select: PERFORMANCE_CYCLE_DETAIL_SELECT,
      orderBy: { start_date: 'desc' },
    });
  }

  async getByYear(year: number) {
    return prisma.performanceCycle.findMany({
      where: { year },
      select: PERFORMANCE_CYCLE_DETAIL_SELECT,
      orderBy: { start_date: 'asc' },
    });
  }

  async create(data: CreatePerformanceCycleDTO, user: AuthUser) {
    // Validate dates
    if (new Date(data.end_date) <= new Date(data.start_date)) {
      throw new Error('End date must be after start date');
    }

    return prisma.performanceCycle.create({
      data: { ...data, status: data.status || 'draft' },
      select: PERFORMANCE_CYCLE_DETAIL_SELECT,
    });
  }

  async update(id: number, data: UpdatePerformanceCycleDTO, user: AuthUser) {
    const existing = await prisma.performanceCycle.findUnique({ where: { id } });
    if (!existing) throw new Error('Performance cycle not found');

    return prisma.performanceCycle.update({
      where: { id },
      data,
      select: PERFORMANCE_CYCLE_DETAIL_SELECT,
    });
  }

  async delete(id: number, user: AuthUser) {
    const existing = await prisma.performanceCycle.findUnique({
      where: { id },
      include: { _count: { select: { reviews: true } } },
    });

    if (!existing) throw new Error('Performance cycle not found');
    if (existing._count.reviews > 0) {
      throw new Error(`Cannot delete cycle with ${existing._count.reviews} reviews`);
    }

    return prisma.performanceCycle.delete({ where: { id } });
  }

  async activate(id: number, user: AuthUser) {
    const cycle = await prisma.performanceCycle.findUnique({ where: { id } });
    if (!cycle) throw new Error('Performance cycle not found');
    if (cycle.status !== 'draft') throw new Error('Only draft cycles can be activated');

    return prisma.performanceCycle.update({
      where: { id },
      data: { status: 'active' },
      select: PERFORMANCE_CYCLE_DETAIL_SELECT,
    });
  }

  async startReview(id: number, user: AuthUser) {
    const cycle = await prisma.performanceCycle.findUnique({ where: { id } });
    if (!cycle) throw new Error('Performance cycle not found');
    if (cycle.status !== 'active') throw new Error('Only active cycles can start review');

    return prisma.performanceCycle.update({
      where: { id },
      data: { status: 'in_progress' },
      select: PERFORMANCE_CYCLE_DETAIL_SELECT,
    });
  }

  async startCalibration(id: number, user: AuthUser) {
    const cycle = await prisma.performanceCycle.findUnique({ where: { id } });
    if (!cycle) throw new Error('Performance cycle not found');
    if (cycle.status !== 'in_progress') throw new Error('Only in-progress cycles can start calibration');

    return prisma.performanceCycle.update({
      where: { id },
      data: { status: 'calibration' },
      select: PERFORMANCE_CYCLE_DETAIL_SELECT,
    });
  }

  async complete(id: number, user: AuthUser) {
    const cycle = await prisma.performanceCycle.findUnique({ where: { id } });
    if (!cycle) throw new Error('Performance cycle not found');
    if (!['in_progress', 'calibration'].includes(cycle.status)) {
      throw new Error('Only in-progress or calibration cycles can be completed');
    }

    return prisma.performanceCycle.update({
      where: { id },
      data: { status: 'completed' },
      select: PERFORMANCE_CYCLE_DETAIL_SELECT,
    });
  }

  async getCurrentPhase(id: number) {
    const cycle = await prisma.performanceCycle.findUnique({ where: { id } });
    if (!cycle) throw new Error('Performance cycle not found');

    const now = new Date();
    let phase = 'pending';

    if (cycle.self_assessment_start && cycle.self_assessment_end) {
      if (now >= new Date(cycle.self_assessment_start) && now <= new Date(cycle.self_assessment_end)) {
        phase = 'self_assessment';
      }
    }

    if (cycle.manager_review_start && cycle.manager_review_end) {
      if (now >= new Date(cycle.manager_review_start) && now <= new Date(cycle.manager_review_end)) {
        phase = 'manager_review';
      }
    }

    if (cycle.calibration_start && cycle.calibration_end) {
      if (now >= new Date(cycle.calibration_start) && now <= new Date(cycle.calibration_end)) {
        phase = 'calibration';
      }
    }

    if (now > new Date(cycle.end_date)) {
      phase = 'completed';
    }

    return { cycle_id: id, current_phase: phase, cycle_status: cycle.status };
  }

  async getStatistics(year?: number) {
    const where: Prisma.PerformanceCycleWhereInput = {};
    if (year) where.year = year;

    const [byStatus, byType, total] = await Promise.all([
      prisma.performanceCycle.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.performanceCycle.groupBy({
        by: ['cycle_type'],
        where,
        _count: true,
      }),
      prisma.performanceCycle.count({ where }),
    ]);

    return {
      total_cycles: total,
      by_status: byStatus.map((s) => ({ status: s.status, count: s._count })),
      by_type: byType.map((t) => ({ type: t.cycle_type, count: t._count })),
    };
  }
}
