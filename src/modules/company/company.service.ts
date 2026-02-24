import { PrismaClient, Prisma } from '@prisma/client';
import {
  CompanyListQuery,
  CreateCompanyDTO,
  UpdateCompanyDTO,
  UpdateFeatureTogglesDTO,
  COMPANY_LIST_SELECT,
  COMPANY_DETAIL_SELECT,
  COMPANY_STATUS,
} from './company.types';
import { AuthUser, getHighestRoleLevel, ROLE_HIERARCHY } from '../../middlewares/auth.middleware';
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../../middlewares/error.middleware';

const prisma = new PrismaClient();

export class CompanyService {
  // ==========================================
  // LIST & GET METHODS
  // ==========================================

  async list(query: CompanyListQuery, user: AuthUser) {
    const {
      parent_company_id,
      company_type,
      status,
      search,
      sort_by = 'name',
      sort_order = 'asc',
    } = query;
    const page = parseInt(String(query.page)) || 1;
    const limit = parseInt(String(query.limit)) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.CompanyWhereInput = {};

    // Filter by accessible companies for non-super admin
    // Tax roles can see all companies for tax reporting purposes
    const isTaxRole = user.roles.includes('Tax Manager') || user.roles.includes('Tax Staff');
    if (!user.roles.includes('Super Admin') && !isTaxRole) {
      where.id = { in: user.accessibleCompanyIds };
    }

    if (parent_company_id) {
      where.parent_company_id = parent_company_id;
    }

    if (company_type) {
      where.company_type = company_type;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { legal_name: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const orderBy: Prisma.CompanyOrderByWithRelationInput = {};
    (orderBy as any)[sort_by] = sort_order;

    const [data, total] = await Promise.all([
      prisma.company.findMany({
        where,
        select: COMPANY_LIST_SELECT,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.company.count({ where }),
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

  async getById(id: number, user: AuthUser) {
    // Check access
    if (!user.roles.includes('Super Admin') && !user.accessibleCompanyIds.includes(id)) {
      throw new ForbiddenError('Access denied to this company');
    }

    const company = await prisma.company.findUnique({
      where: { id },
      select: COMPANY_DETAIL_SELECT,
    });

    if (!company) {
      throw new NotFoundError('Company');
    }

    return company;
  }

  async getHierarchy(user: AuthUser) {
    // Get all companies accessible to user as a tree structure
    const where: Prisma.CompanyWhereInput = {
      status: COMPANY_STATUS.ACTIVE,
    };

    // Tax roles can see all companies for tax reporting purposes
    const isTaxRole = user.roles.includes('Tax Manager') || user.roles.includes('Tax Staff');
    if (!user.roles.includes('Super Admin') && !isTaxRole) {
      where.id = { in: user.accessibleCompanyIds };
    }

    const companies = await prisma.company.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        company_type: true,
        parent_company_id: true,
        logo: true,
        _count: {
          select: {
            employees: true,
            departments: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Build tree structure
    return this.buildCompanyTree(companies);
  }

  private buildCompanyTree(companies: any[], parentId: number | null = null): any[] {
    return companies
      .filter(c => c.parent_company_id === parentId)
      .map(company => ({
        ...company,
        children: this.buildCompanyTree(companies, company.id),
      }));
  }

  // ==========================================
  // CREATE & UPDATE METHODS
  // ==========================================

  async create(data: CreateCompanyDTO, user: AuthUser) {
    // Only Super Admin or CEO can create companies
    if (getHighestRoleLevel(user.roles) < ROLE_HIERARCHY['CEO']) {
      throw new ForbiddenError('Only Super Admin or CEO can create companies');
    }

    // Check if code is unique
    if (data.code) {
      const existing = await prisma.company.findUnique({
        where: { code: data.code },
      });
      if (existing) {
        throw new ConflictError('Company code already exists');
      }
    }

    // Validate parent company if provided
    if (data.parent_company_id) {
      const parent = await prisma.company.findUnique({
        where: { id: data.parent_company_id },
      });
      if (!parent) {
        throw new NotFoundError('Parent company');
      }
    }

    return prisma.company.create({
      data: {
        ...data,
        founded_date: data.founded_date ? new Date(data.founded_date) : undefined,
        status: COMPANY_STATUS.ACTIVE,
      },
      select: COMPANY_DETAIL_SELECT,
    });
  }

  async update(id: number, data: UpdateCompanyDTO, user: AuthUser) {
    // Check access
    if (!user.roles.includes('Super Admin') && !user.accessibleCompanyIds.includes(id)) {
      throw new ForbiddenError('Access denied to this company');
    }

    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Company');
    }

    // Check if code is unique (if changing)
    if (data.code && data.code !== existing.code) {
      const codeExists = await prisma.company.findUnique({
        where: { code: data.code },
      });
      if (codeExists) {
        throw new ConflictError('Company code already exists');
      }
    }

    // Prevent circular parent reference
    if (data.parent_company_id === id) {
      throw new BadRequestError('Company cannot be its own parent');
    }

    return prisma.company.update({
      where: { id },
      data: {
        ...data,
        founded_date: data.founded_date ? new Date(data.founded_date) : undefined,
      },
      select: COMPANY_DETAIL_SELECT,
    });
  }

  async delete(id: number, user: AuthUser) {
    // Only Super Admin can delete companies
    if (!user.roles.includes('Super Admin')) {
      throw new ForbiddenError('Only Super Admin can delete companies');
    }

    const existing = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            employees: true,
            subsidiaries: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError('Company');
    }

    // Check if company has employees or subsidiaries
    if (existing._count.employees > 0) {
      throw new BadRequestError('Cannot delete company with employees. Please transfer or remove employees first.');
    }

    if (existing._count.subsidiaries > 0) {
      throw new BadRequestError('Cannot delete company with subsidiaries. Please remove subsidiaries first.');
    }

    // Soft delete by setting status to inactive
    return prisma.company.update({
      where: { id },
      data: { status: COMPANY_STATUS.INACTIVE },
      select: COMPANY_DETAIL_SELECT,
    });
  }

  // ==========================================
  // STATISTICS
  // ==========================================

  async getStatistics(id: number, user: AuthUser) {
    // Check access
    if (!user.roles.includes('Super Admin') && !user.accessibleCompanyIds.includes(id)) {
      throw new ForbiddenError('Access denied to this company');
    }

    const [
      employeeCount,
      departmentCount,
      positionCount,
      activeEmployees,
      subsidiaryCount,
    ] = await Promise.all([
      prisma.employee.count({ where: { company_id: id } }),
      prisma.department.count({ where: { company_id: id } }),
      prisma.position.count({ where: { company_id: id } }),
      prisma.employee.count({
        where: {
          company_id: id,
          employment_status: 'active'
        }
      }),
      prisma.company.count({ where: { parent_company_id: id } }),
    ]);

    // Employee by department
    const employeesByDepartment = await prisma.department.findMany({
      where: { company_id: id },
      select: {
        id: true,
        name: true,
        _count: {
          select: { employees: true },
        },
      },
    });

    // Employee by employment type
    const employeesByType = await prisma.employee.groupBy({
      by: ['employment_type'],
      where: { company_id: id },
      _count: { id: true },
    });

    return {
      total_employees: employeeCount,
      active_employees: activeEmployees,
      departments: departmentCount,
      positions: positionCount,
      subsidiaries: subsidiaryCount,
      employees_by_department: employeesByDepartment.map(d => ({
        department: d.name,
        count: d._count.employees,
      })),
      employees_by_type: employeesByType.map(e => ({
        type: e.employment_type || 'unknown',
        count: e._count.id,
      })),
    };
  }

  // ==========================================
  // SETTINGS
  // ==========================================

  async getSettings(id: number, user: AuthUser) {
    // Check access
    if (!user.roles.includes('Super Admin') && !user.accessibleCompanyIds.includes(id)) {
      throw new ForbiddenError('Access denied to this company');
    }

    const company = await prisma.company.findUnique({
      where: { id },
      select: { settings: true },
    });

    return company?.settings || {};
  }

  async updateSettings(id: number, settings: Record<string, any>, user: AuthUser) {
    // Check access
    if (!user.roles.includes('Super Admin') && !user.accessibleCompanyIds.includes(id)) {
      throw new ForbiddenError('Access denied to this company');
    }

    const existing = await prisma.company.findUnique({
      where: { id },
      select: { settings: true },
    });

    if (!existing) {
      throw new NotFoundError('Company');
    }

    // Merge existing settings with new settings
    const mergedSettings = {
      ...(existing.settings as object || {}),
      ...settings,
    };

    return prisma.company.update({
      where: { id },
      data: { settings: mergedSettings },
      select: { id: true, settings: true },
    });
  }

  // ==========================================
  // FEATURE TOGGLES (Super Admin Only)
  // ==========================================

  async getFeatureToggles(id: number, user: AuthUser) {
    // Only Super Admin can view feature toggles
    if (!user.roles.includes('Super Admin')) {
      throw new ForbiddenError('Only Super Admin can view feature toggles');
    }

    const company = await prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
        attendance_enabled: true,
        leave_enabled: true,
        payroll_enabled: true,
        performance_enabled: true,
      },
    });

    if (!company) {
      throw new NotFoundError('Company');
    }

    return company;
  }

  async updateFeatureToggles(id: number, data: UpdateFeatureTogglesDTO, user: AuthUser) {
    // Only Super Admin can update feature toggles
    if (!user.roles.includes('Super Admin')) {
      throw new ForbiddenError('Only Super Admin can update feature toggles');
    }

    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Company');
    }

    return prisma.company.update({
      where: { id },
      data: {
        attendance_enabled: data.attendance_enabled,
        leave_enabled: data.leave_enabled,
        payroll_enabled: data.payroll_enabled,
        performance_enabled: data.performance_enabled,
      },
      select: {
        id: true,
        name: true,
        code: true,
        attendance_enabled: true,
        leave_enabled: true,
        payroll_enabled: true,
        performance_enabled: true,
      },
    });
  }

  async listWithFeatureToggles(user: AuthUser) {
    const companies = await prisma.company.findMany({
      where: { status: COMPANY_STATUS.ACTIVE },
      select: {
        id: true,
        name: true,
        code: true,
        company_type: true,
        logo: true,
        attendance_enabled: true,
        leave_enabled: true,
        payroll_enabled: true,
        performance_enabled: true,
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return companies;
  }
}
