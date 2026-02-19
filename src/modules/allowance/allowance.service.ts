import { PrismaClient, Prisma } from '@prisma/client';
import {
  AllowanceListQuery,
  CreateAllowanceDTO,
  UpdateAllowanceDTO,
  BulkCreateAllowanceDTO,
  CalculateAllowanceDTO,
  ALLOWANCE_SELECT,
  ALLOWANCE_DETAIL_SELECT,
  DEFAULT_ALLOWANCE_TEMPLATES,
} from './allowance.types';
import { AuthUser } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class AllowanceService {
  // ==========================================
  // CRUD OPERATIONS
  // ==========================================

  async list(query: AllowanceListQuery, user: AuthUser) {
    const {
      page = 1,
      limit = 20,
      search,
      employee_id,
      company_id,
      type,
      status,
      is_taxable,
      is_recurring,
      frequency,
      effective_from,
      effective_to,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.AllowanceWhereInput = {
      deleted_at: null,
    };

    // Filter by accessible companies
    if (user.accessibleCompanyIds && user.accessibleCompanyIds.length > 0) {
      where.OR = [
        { company_id: { in: user.accessibleCompanyIds } },
        { employee: { company_id: { in: user.accessibleCompanyIds } } },
      ];
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
            { employee: { name: { contains: search } } },
            { employee: { employee_id: { contains: search } } },
          ],
        },
      ];
    }

    if (employee_id) {
      where.employee_id = employee_id;
    }

    if (company_id) {
      where.company_id = company_id;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (is_taxable !== undefined) {
      where.is_taxable = is_taxable;
    }

    if (is_recurring !== undefined) {
      where.is_recurring = is_recurring;
    }

    if (frequency) {
      where.frequency = frequency;
    }

    if (effective_from) {
      where.effective_date = { gte: new Date(effective_from) };
    }

    if (effective_to) {
      where.end_date = { lte: new Date(effective_to) };
    }

    const [data, total] = await Promise.all([
      prisma.allowance.findMany({
        where,
        select: ALLOWANCE_DETAIL_SELECT,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.allowance.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: number) {
    const allowance = await prisma.allowance.findFirst({
      where: { id, deleted_at: null },
      select: ALLOWANCE_DETAIL_SELECT,
    });

    if (!allowance) {
      throw new Error('Allowance not found');
    }

    return allowance;
  }

  async getByEmployeeId(employeeId: number, query: { status?: string; type?: string } = {}) {
    const where: Prisma.AllowanceWhereInput = {
      employee_id: employeeId,
      deleted_at: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.type) {
      where.type = query.type;
    }

    return prisma.allowance.findMany({
      where,
      select: ALLOWANCE_DETAIL_SELECT,
      orderBy: { created_at: 'desc' },
    });
  }

  async create(data: CreateAllowanceDTO, user: AuthUser) {
    // Validate employee exists if employee_id provided
    if (data.employee_id) {
      const employee = await prisma.employee.findUnique({
        where: { id: data.employee_id },
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      // Set company_id from employee if not provided
      if (!data.company_id && employee.company_id) {
        data.company_id = employee.company_id;
      }
    }

    return prisma.allowance.create({
      data: {
        ...data,
        status: data.status || 'active',
      },
      select: ALLOWANCE_DETAIL_SELECT,
    });
  }

  async update(id: number, data: UpdateAllowanceDTO, user: AuthUser) {
    const existing = await prisma.allowance.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new Error('Allowance not found');
    }

    // Strip fields that can't be passed directly to Prisma update
    const { employee_id, company_id, ...updateData } = data;

    return prisma.allowance.update({
      where: { id },
      data: updateData,
      select: ALLOWANCE_DETAIL_SELECT,
    });
  }

  async delete(id: number, user: AuthUser) {
    const existing = await prisma.allowance.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new Error('Allowance not found');
    }

    // Soft delete
    return prisma.allowance.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async hardDelete(id: number, user: AuthUser) {
    const existing = await prisma.allowance.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Allowance not found');
    }

    return prisma.allowance.delete({ where: { id } });
  }

  // ==========================================
  // BULK OPERATIONS
  // ==========================================

  async bulkCreate(data: BulkCreateAllowanceDTO, user: AuthUser) {
    const { employee_ids, ...allowanceData } = data;

    const results = { created: 0, failed: 0, errors: [] as string[] };

    for (const employeeId of employee_ids) {
      try {
        const employee = await prisma.employee.findUnique({
          where: { id: employeeId },
          select: { id: true, company_id: true },
        });

        if (!employee) {
          results.failed++;
          results.errors.push(`Employee ID ${employeeId} not found`);
          continue;
        }

        await prisma.allowance.create({
          data: {
            ...allowanceData,
            employee_id: employeeId,
            company_id: employee.company_id,
            status: 'active',
          },
        });

        results.created++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Employee ID ${employeeId}: ${error.message}`);
      }
    }

    return results;
  }

  async bulkDelete(ids: number[], user: AuthUser) {
    const result = await prisma.allowance.updateMany({
      where: { id: { in: ids } },
      data: { deleted_at: new Date() },
    });

    return { deleted: result.count };
  }

  async bulkUpdateStatus(ids: number[], status: string, user: AuthUser) {
    const updateData: any = { status };

    if (status === 'approved') {
      updateData.approved_by = user.id;
      updateData.approved_at = new Date();
    }

    const result = await prisma.allowance.updateMany({
      where: { id: { in: ids }, deleted_at: null },
      data: updateData,
    });

    return { updated: result.count };
  }

  // ==========================================
  // APPROVAL WORKFLOW
  // ==========================================

  async approve(id: number, user: AuthUser) {
    const allowance = await prisma.allowance.findFirst({
      where: { id, deleted_at: null },
    });

    if (!allowance) {
      throw new Error('Allowance not found');
    }

    if (allowance.status !== 'pending') {
      throw new Error('Only pending allowances can be approved');
    }

    return prisma.allowance.update({
      where: { id },
      data: {
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date(),
      },
      select: ALLOWANCE_DETAIL_SELECT,
    });
  }

  async reject(id: number, reason: string, user: AuthUser) {
    const allowance = await prisma.allowance.findFirst({
      where: { id, deleted_at: null },
    });

    if (!allowance) {
      throw new Error('Allowance not found');
    }

    if (allowance.status !== 'pending') {
      throw new Error('Only pending allowances can be rejected');
    }

    return prisma.allowance.update({
      where: { id },
      data: {
        status: 'rejected',
        rejection_reason: reason,
        approved_by: user.id,
        approved_at: new Date(),
      },
      select: ALLOWANCE_DETAIL_SELECT,
    });
  }

  // ==========================================
  // CALCULATION METHODS
  // ==========================================

  async calculateEmployeeAllowances(data: CalculateAllowanceDTO) {
    const { employee_id, month, year } = data;

    // Get employee with salary info
    const employee = await prisma.employee.findUnique({
      where: { id: employee_id },
      select: {
        id: true,
        basic_salary: true,
        transport_allowance: true,
        meal_allowance: true,
        position_allowance: true,
        communication_allowance: true,
        housing_allowance: true,
      },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Get active allowances for this employee
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const allowances = await prisma.allowance.findMany({
      where: {
        employee_id,
        status: 'active',
        deleted_at: null,
        OR: [
          { effective_date: null },
          { effective_date: { lte: endDate } },
        ],
        AND: [
          {
            OR: [
              { end_date: null },
              { end_date: { gte: startDate } },
            ],
          },
        ],
      },
      select: ALLOWANCE_SELECT,
    });

    const basicSalary = Number(employee.basic_salary || 0);

    // Calculate each allowance
    const calculatedAllowances = allowances.map((allowance) => {
      let calculatedAmount = 0;

      if (allowance.amount) {
        calculatedAmount = Number(allowance.amount);
      } else if (allowance.percentage && allowance.calculation_base) {
        const percentage = Number(allowance.percentage);

        switch (allowance.calculation_base) {
          case 'basic_salary':
            calculatedAmount = basicSalary * percentage;
            break;
          case 'gross_salary':
            // For gross salary, we'd need to calculate all components first
            // For simplicity, using basic salary * 1.3 as estimate
            calculatedAmount = basicSalary * 1.3 * percentage;
            break;
          default:
            calculatedAmount = Number(allowance.amount || 0);
        }
      }

      return {
        id: allowance.id,
        name: allowance.name,
        type: allowance.type,
        amount: calculatedAmount,
        is_taxable: allowance.is_taxable,
        is_bpjs_object: allowance.is_bpjs_object,
        frequency: allowance.frequency,
      };
    });

    // Add fixed allowances from employee record
    const fixedAllowances = [
      { name: 'Transport Allowance (Fixed)', type: 'transport', amount: Number(employee.transport_allowance || 0), is_taxable: true, is_bpjs_object: false },
      { name: 'Meal Allowance (Fixed)', type: 'meal', amount: Number(employee.meal_allowance || 0), is_taxable: true, is_bpjs_object: false },
      { name: 'Position Allowance (Fixed)', type: 'position', amount: Number(employee.position_allowance || 0), is_taxable: true, is_bpjs_object: true },
      { name: 'Communication Allowance (Fixed)', type: 'communication', amount: Number(employee.communication_allowance || 0), is_taxable: true, is_bpjs_object: false },
      { name: 'Housing Allowance (Fixed)', type: 'housing', amount: Number(employee.housing_allowance || 0), is_taxable: true, is_bpjs_object: true },
    ].filter((a) => a.amount > 0);

    const allAllowances = [...calculatedAllowances, ...fixedAllowances];

    // Calculate totals
    const totalAllowance = allAllowances.reduce((sum, a) => sum + a.amount, 0);
    const taxableAllowance = allAllowances.filter((a) => a.is_taxable).reduce((sum, a) => sum + a.amount, 0);
    const bpjsObjectAllowance = allAllowances.filter((a) => a.is_bpjs_object).reduce((sum, a) => sum + a.amount, 0);

    return {
      employee_id,
      month,
      year,
      basic_salary: basicSalary,
      allowances: allAllowances,
      summary: {
        total_allowance: totalAllowance,
        taxable_allowance: taxableAllowance,
        non_taxable_allowance: totalAllowance - taxableAllowance,
        bpjs_object_allowance: bpjsObjectAllowance,
        gross_salary: basicSalary + totalAllowance,
      },
    };
  }

  // ==========================================
  // COMPANY-LEVEL ALLOWANCES (Templates)
  // ==========================================

  async getCompanyAllowances(companyId: number) {
    return prisma.allowance.findMany({
      where: {
        company_id: companyId,
        employee_id: null,
        deleted_at: null,
      },
      select: ALLOWANCE_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async createCompanyAllowance(companyId: number, data: CreateAllowanceDTO, user: AuthUser) {
    return prisma.allowance.create({
      data: {
        ...data,
        company_id: companyId,
        employee_id: null,
        status: 'active',
      },
      select: ALLOWANCE_SELECT,
    });
  }

  async applyCompanyAllowanceToEmployees(allowanceId: number, employeeIds: number[], user: AuthUser) {
    const template = await prisma.allowance.findFirst({
      where: { id: allowanceId, employee_id: null, deleted_at: null },
    });

    if (!template) {
      throw new Error('Company allowance template not found');
    }

    const results = { created: 0, failed: 0, errors: [] as string[] };

    for (const employeeId of employeeIds) {
      try {
        // Check if employee already has this allowance type
        const existing = await prisma.allowance.findFirst({
          where: {
            employee_id: employeeId,
            name: template.name,
            deleted_at: null,
          },
        });

        if (existing) {
          results.failed++;
          results.errors.push(`Employee ID ${employeeId} already has ${template.name}`);
          continue;
        }

        await prisma.allowance.create({
          data: {
            employee_id: employeeId,
            company_id: template.company_id,
            name: template.name,
            type: template.type,
            amount: template.amount,
            percentage: template.percentage,
            calculation_base: template.calculation_base,
            frequency: template.frequency,
            is_taxable: template.is_taxable,
            is_bpjs_object: template.is_bpjs_object,
            is_recurring: template.is_recurring,
            description: template.description,
            status: 'active',
          },
        });

        results.created++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Employee ID ${employeeId}: ${error.message}`);
      }
    }

    return results;
  }

  // ==========================================
  // SEED DEFAULT TEMPLATES
  // ==========================================

  async seedDefaultTemplates(companyId: number, user: AuthUser) {
    const results = { created: 0, skipped: 0 };

    for (const template of DEFAULT_ALLOWANCE_TEMPLATES) {
      try {
        const existing = await prisma.allowance.findFirst({
          where: {
            company_id: companyId,
            employee_id: null,
            name: template.name,
            deleted_at: null,
          },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        await prisma.allowance.create({
          data: {
            ...template,
            company_id: companyId,
            employee_id: null,
            status: 'active',
          },
        });

        results.created++;
      } catch (error) {
        results.skipped++;
      }
    }

    return results;
  }

  // ==========================================
  // STATISTICS
  // ==========================================

  async getStatistics(query: { company_id?: number; employee_id?: number }, user: AuthUser) {
    const where: Prisma.AllowanceWhereInput = {
      deleted_at: null,
      status: 'active',
    };

    if (query.company_id) {
      where.company_id = query.company_id;
    }

    if (query.employee_id) {
      where.employee_id = query.employee_id;
    }

    const [byType, byFrequency, totals] = await Promise.all([
      prisma.allowance.groupBy({
        by: ['type'],
        where,
        _count: true,
        _sum: { amount: true },
      }),
      prisma.allowance.groupBy({
        by: ['frequency'],
        where,
        _count: true,
      }),
      prisma.allowance.aggregate({
        where,
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    return {
      total_allowances: totals._count,
      total_amount: totals._sum.amount,
      by_type: byType.map((t) => ({
        type: t.type,
        count: t._count,
        total_amount: t._sum.amount,
      })),
      by_frequency: byFrequency.map((f) => ({
        frequency: f.frequency,
        count: f._count,
      })),
    };
  }
}
