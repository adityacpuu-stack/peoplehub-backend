import { PrismaClient, Prisma } from '@prisma/client';
import {
  KpiListQuery,
  CreateKpiDTO,
  UpdateKpiDTO,
  KPI_SELECT,
  KPI_DETAIL_SELECT,
  DEFAULT_KPIS,
} from './kpi.types';
import { AuthUser } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class KpiService {
  async list(query: KpiListQuery, user: AuthUser) {
    const { page = 1, limit = 50, search, category, department_id, position_id, target_frequency, is_active } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.KPIWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (category) where.category = category;
    if (department_id) where.department_id = department_id;
    if (position_id) where.position_id = position_id;
    if (target_frequency) where.target_frequency = target_frequency;
    if (is_active !== undefined) where.is_active = is_active;

    const [data, total] = await Promise.all([
      prisma.kPI.findMany({
        where,
        select: KPI_DETAIL_SELECT,
        skip,
        take: limit,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      }),
      prisma.kPI.count({ where }),
    ]);

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: number) {
    const kpi = await prisma.kPI.findUnique({
      where: { id },
      select: KPI_DETAIL_SELECT,
    });
    if (!kpi) throw new Error('KPI not found');
    return kpi;
  }

  async getByCode(code: string) {
    const kpi = await prisma.kPI.findFirst({
      where: { code },
      select: KPI_DETAIL_SELECT,
    });
    if (!kpi) throw new Error('KPI not found');
    return kpi;
  }

  async getByDepartment(departmentId: number) {
    return prisma.kPI.findMany({
      where: { department_id: departmentId, is_active: true },
      select: KPI_DETAIL_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async getByPosition(positionId: number) {
    return prisma.kPI.findMany({
      where: { position_id: positionId, is_active: true },
      select: KPI_DETAIL_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async create(data: CreateKpiDTO, user: AuthUser) {
    if (data.code) {
      const existing = await prisma.kPI.findFirst({ where: { code: data.code } });
      if (existing) throw new Error('KPI code already exists');
    }

    return prisma.kPI.create({
      data: {
        ...data,
        is_active: data.is_active ?? true,
        created_by: user.id,
      },
      select: KPI_DETAIL_SELECT,
    });
  }

  async update(id: number, data: UpdateKpiDTO, user: AuthUser) {
    const existing = await prisma.kPI.findUnique({ where: { id } });
    if (!existing) throw new Error('KPI not found');

    return prisma.kPI.update({
      where: { id },
      data: { ...data, updated_by: user.id },
      select: KPI_DETAIL_SELECT,
    });
  }

  async delete(id: number, user: AuthUser) {
    const existing = await prisma.kPI.findUnique({
      where: { id },
      include: { _count: { select: { goals: true } } },
    });

    if (!existing) throw new Error('KPI not found');
    if (existing._count.goals > 0) {
      throw new Error(`Cannot delete KPI with ${existing._count.goals} goals linked`);
    }

    return prisma.kPI.delete({ where: { id } });
  }

  async seedDefaults(user: AuthUser) {
    const results = { created: 0, skipped: 0 };

    for (const kpi of DEFAULT_KPIS) {
      try {
        const existing = await prisma.kPI.findFirst({ where: { code: kpi.code } });
        if (existing) {
          results.skipped++;
          continue;
        }

        await prisma.kPI.create({
          data: {
            ...kpi,
            is_active: true,
            created_by: user.id,
          },
        });
        results.created++;
      } catch {
        results.skipped++;
      }
    }

    return results;
  }

  async getByCategory(category: string) {
    return prisma.kPI.findMany({
      where: { category, is_active: true },
      select: KPI_DETAIL_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async getStatistics() {
    const [byCategory, byFrequency, totals] = await Promise.all([
      prisma.kPI.groupBy({
        by: ['category'],
        where: { is_active: true },
        _count: true,
      }),
      prisma.kPI.groupBy({
        by: ['target_frequency'],
        where: { is_active: true },
        _count: true,
      }),
      prisma.kPI.aggregate({
        where: { is_active: true },
        _count: true,
      }),
    ]);

    return {
      total_kpis: totals._count,
      by_category: byCategory.map((c) => ({ category: c.category, count: c._count })),
      by_frequency: byFrequency.map((f) => ({ frequency: f.target_frequency, count: f._count })),
    };
  }

  async assignToDepartment(kpiId: number, departmentId: number, user: AuthUser) {
    const kpi = await prisma.kPI.findUnique({ where: { id: kpiId } });
    if (!kpi) throw new Error('KPI not found');

    return prisma.kPI.update({
      where: { id: kpiId },
      data: { department_id: departmentId, updated_by: user.id },
      select: KPI_DETAIL_SELECT,
    });
  }

  async assignToPosition(kpiId: number, positionId: number, user: AuthUser) {
    const kpi = await prisma.kPI.findUnique({ where: { id: kpiId } });
    if (!kpi) throw new Error('KPI not found');

    return prisma.kPI.update({
      where: { id: kpiId },
      data: { position_id: positionId, updated_by: user.id },
      select: KPI_DETAIL_SELECT,
    });
  }
}
