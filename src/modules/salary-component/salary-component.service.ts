import { PrismaClient, Prisma } from '@prisma/client';
import {
  SalaryComponentListQuery,
  CreateSalaryComponentDTO,
  UpdateSalaryComponentDTO,
  SALARY_COMPONENT_SELECT,
  SALARY_COMPONENT_DETAIL_SELECT,
  DEFAULT_SALARY_COMPONENTS,
} from './salary-component.types';
import { AuthUser } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class SalaryComponentService {
  async list(query: SalaryComponentListQuery, user: AuthUser) {
    const { page = 1, limit = 50, search, company_id, type, category, is_active, is_taxable } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SalaryComponentWhereInput = {};

    if (company_id) {
      where.OR = [{ company_id }, { company_id: null }];
    } else if (user.accessibleCompanyIds?.length) {
      where.OR = [{ company_id: { in: user.accessibleCompanyIds } }, { company_id: null }];
    }

    if (search) {
      where.AND = [{ OR: [{ name: { contains: search } }, { code: { contains: search } }] }];
    }

    if (type) where.type = type;
    if (category) where.category = category;
    if (is_active !== undefined) where.is_active = is_active;
    if (is_taxable !== undefined) where.is_taxable = is_taxable;

    const [data, total] = await Promise.all([
      prisma.salaryComponent.findMany({
        where,
        select: SALARY_COMPONENT_DETAIL_SELECT,
        skip,
        take: limit,
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      }),
      prisma.salaryComponent.count({ where }),
    ]);

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: number) {
    const component = await prisma.salaryComponent.findUnique({
      where: { id },
      select: SALARY_COMPONENT_DETAIL_SELECT,
    });
    if (!component) throw new Error('Salary component not found');
    return component;
  }

  async getByCode(code: string, companyId?: number) {
    return prisma.salaryComponent.findFirst({
      where: { code, OR: [{ company_id: companyId }, { company_id: null }] },
      select: SALARY_COMPONENT_SELECT,
    });
  }

  async create(data: CreateSalaryComponentDTO, user: AuthUser) {
    if (data.code) {
      const existing = await prisma.salaryComponent.findFirst({
        where: { code: data.code, company_id: data.company_id },
      });
      if (existing) throw new Error('Component code already exists');
    }

    return prisma.salaryComponent.create({
      data: { ...data, is_active: data.is_active ?? true },
      select: SALARY_COMPONENT_DETAIL_SELECT,
    });
  }

  async update(id: number, data: UpdateSalaryComponentDTO, user: AuthUser) {
    const existing = await prisma.salaryComponent.findUnique({ where: { id } });
    if (!existing) throw new Error('Salary component not found');

    return prisma.salaryComponent.update({
      where: { id },
      data,
      select: SALARY_COMPONENT_DETAIL_SELECT,
    });
  }

  async delete(id: number, user: AuthUser) {
    const existing = await prisma.salaryComponent.findUnique({ where: { id } });
    if (!existing) throw new Error('Salary component not found');
    return prisma.salaryComponent.delete({ where: { id } });
  }

  async seedDefaults(companyId: number | null, user: AuthUser) {
    const results = { created: 0, skipped: 0 };

    for (const comp of DEFAULT_SALARY_COMPONENTS) {
      try {
        const existing = await prisma.salaryComponent.findFirst({
          where: { code: comp.code, company_id: companyId },
        });
        if (existing) {
          results.skipped++;
          continue;
        }

        await prisma.salaryComponent.create({
          data: { ...comp, company_id: companyId, is_active: true, is_recurring: true },
        });
        results.created++;
      } catch {
        results.skipped++;
      }
    }

    return results;
  }

  async getEarnings(companyId?: number) {
    return prisma.salaryComponent.findMany({
      where: {
        type: 'earning',
        is_active: true,
        OR: companyId ? [{ company_id: companyId }, { company_id: null }] : [{ company_id: null }],
      },
      select: SALARY_COMPONENT_SELECT,
      orderBy: { sort_order: 'asc' },
    });
  }

  async getDeductions(companyId?: number) {
    return prisma.salaryComponent.findMany({
      where: {
        type: 'deduction',
        is_active: true,
        OR: companyId ? [{ company_id: companyId }, { company_id: null }] : [{ company_id: null }],
      },
      select: SALARY_COMPONENT_SELECT,
      orderBy: { sort_order: 'asc' },
    });
  }
}
