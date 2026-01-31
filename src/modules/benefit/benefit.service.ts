import { PrismaClient, Prisma } from '@prisma/client';
import {
  BenefitListQuery,
  CreateBenefitDTO,
  UpdateBenefitDTO,
  BENEFIT_SELECT,
  BENEFIT_DETAIL_SELECT,
  DEFAULT_BENEFITS,
} from './benefit.types';
import { AuthUser } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class BenefitService {
  async list(query: BenefitListQuery, user: AuthUser) {
    const { page = 1, limit = 50, search, company_id, type, category, is_active } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BenefitWhereInput = {};

    if (company_id) {
      where.company_id = company_id;
    } else if (user.accessibleCompanyIds?.length) {
      where.OR = [{ company_id: { in: user.accessibleCompanyIds } }, { company_id: null }];
    }

    if (search) {
      where.AND = [{ OR: [{ name: { contains: search } }, { description: { contains: search } }] }];
    }

    if (type) where.type = type;
    if (category) where.category = category;
    if (is_active !== undefined) where.is_active = is_active;

    const [data, total] = await Promise.all([
      prisma.benefit.findMany({
        where,
        select: BENEFIT_DETAIL_SELECT,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.benefit.count({ where }),
    ]);

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: number) {
    const benefit = await prisma.benefit.findUnique({
      where: { id },
      select: BENEFIT_DETAIL_SELECT,
    });
    if (!benefit) throw new Error('Benefit not found');
    return benefit;
  }

  async create(data: CreateBenefitDTO, user: AuthUser) {
    return prisma.benefit.create({
      data: {
        ...data,
        is_active: data.is_active ?? true,
        created_by: user.id,
      },
      select: BENEFIT_DETAIL_SELECT,
    });
  }

  async update(id: number, data: UpdateBenefitDTO, user: AuthUser) {
    const existing = await prisma.benefit.findUnique({ where: { id } });
    if (!existing) throw new Error('Benefit not found');

    return prisma.benefit.update({
      where: { id },
      data,
      select: BENEFIT_DETAIL_SELECT,
    });
  }

  async delete(id: number, user: AuthUser) {
    const existing = await prisma.benefit.findUnique({ where: { id } });
    if (!existing) throw new Error('Benefit not found');
    return prisma.benefit.delete({ where: { id } });
  }

  async seedDefaults(companyId: number | null, user: AuthUser) {
    const results = { created: 0, skipped: 0 };

    for (const benefit of DEFAULT_BENEFITS) {
      try {
        const existing = await prisma.benefit.findFirst({
          where: { name: benefit.name, company_id: companyId },
        });
        if (existing) {
          results.skipped++;
          continue;
        }

        await prisma.benefit.create({
          data: {
            ...benefit,
            company_id: companyId,
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

  async getByType(type: string, companyId?: number) {
    return prisma.benefit.findMany({
      where: {
        type,
        is_active: true,
        OR: companyId ? [{ company_id: companyId }, { company_id: null }] : undefined,
      },
      select: BENEFIT_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async getByCategory(category: string, companyId?: number) {
    return prisma.benefit.findMany({
      where: {
        category,
        is_active: true,
        OR: companyId ? [{ company_id: companyId }, { company_id: null }] : undefined,
      },
      select: BENEFIT_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async getStatistics(companyId?: number) {
    const where: Prisma.BenefitWhereInput = { is_active: true };
    if (companyId) where.company_id = companyId;

    const [byType, byCategory, total] = await Promise.all([
      prisma.benefit.groupBy({
        by: ['type'],
        where,
        _count: true,
        _sum: { amount: true },
      }),
      prisma.benefit.groupBy({
        by: ['category'],
        where,
        _count: true,
      }),
      prisma.benefit.aggregate({
        where,
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    return {
      total_benefits: total._count,
      total_amount: total._sum.amount,
      by_type: byType.map((t) => ({ type: t.type, count: t._count, amount: t._sum.amount })),
      by_category: byCategory.map((c) => ({ category: c.category, count: c._count })),
    };
  }
}
