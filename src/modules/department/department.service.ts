import { PrismaClient, Prisma } from '@prisma/client';
import { AuthUser } from '../../types/auth.types';
import {
  DepartmentListQuery,
  CreateDepartmentDTO,
  UpdateDepartmentDTO,
  DEPARTMENT_LIST_SELECT,
  DEPARTMENT_DETAIL_SELECT,
} from './department.types';

const prisma = new PrismaClient();

export class DepartmentService {
  /**
   * Get paginated list of departments with filters
   */
  async list(query: DepartmentListQuery, user: AuthUser) {
    const {
      page = 1,
      limit = 10,
      search,
      company_id,
      parent_id,
      status,
      sort_by = 'name',
      sort_order = 'asc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.DepartmentWhereInput = {};

    // Company filter - restrict to accessible companies
    if (company_id) {
      if (!user.accessibleCompanyIds.includes(company_id)) {
        throw new Error('Access denied to this company');
      }
      where.company_id = company_id;
    } else {
      where.company_id = { in: user.accessibleCompanyIds };
    }

    // Parent filter
    if (parent_id !== undefined) {
      where.parent_id = parent_id || null;
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Get total count
    const total = await prisma.department.count({ where });

    // Get departments
    const departments = await prisma.department.findMany({
      where,
      select: DEPARTMENT_LIST_SELECT,
      skip,
      take: limit,
      orderBy: { [sort_by]: sort_order },
    });

    return {
      data: departments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get department by ID
   */
  async getById(id: number, user: AuthUser) {
    const department = await prisma.department.findUnique({
      where: { id },
      select: DEPARTMENT_DETAIL_SELECT,
    });

    if (!department) {
      throw new Error('Department not found');
    }

    // Check company access
    if (!user.accessibleCompanyIds.includes(department.company.id)) {
      throw new Error('Access denied to this department');
    }

    return department;
  }

  /**
   * Create new department
   */
  async create(data: CreateDepartmentDTO, user: AuthUser) {
    // Check company access
    if (!user.accessibleCompanyIds.includes(data.company_id)) {
      throw new Error('Access denied to create department in this company');
    }

    // Check for duplicate code within company
    if (data.code) {
      const existing = await prisma.department.findFirst({
        where: {
          code: data.code,
          company_id: data.company_id,
        },
      });
      if (existing) {
        throw new Error('Department code already exists in this company');
      }
    }

    // Validate parent department if provided
    if (data.parent_id) {
      const parent = await prisma.department.findUnique({
        where: { id: data.parent_id },
        select: { company_id: true },
      });
      if (!parent) {
        throw new Error('Parent department not found');
      }
      if (parent.company_id !== data.company_id) {
        throw new Error('Parent department must be in the same company');
      }
    }

    // Validate manager if provided
    if (data.manager_id) {
      const manager = await prisma.employee.findUnique({
        where: { id: data.manager_id },
        select: { company_id: true },
      });
      if (!manager) {
        throw new Error('Manager not found');
      }
      if (manager.company_id !== data.company_id) {
        throw new Error('Manager must be in the same company');
      }
    }

    const department = await prisma.department.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        status: data.status || 'active',
        budget: data.budget,
        location: data.location,
        contact_person: data.contact_person,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        established_date: data.established_date ? new Date(data.established_date) : undefined,
        department_type: data.department_type,
        headcount_limit: data.headcount_limit,
        cost_center: data.cost_center,
        sort_order: data.sort_order ?? 0,
        company: { connect: { id: data.company_id } },
        ...(data.parent_id && { parent: { connect: { id: data.parent_id } } }),
        ...(data.manager_id && { manager: { connect: { id: data.manager_id } } }),
      },
      select: DEPARTMENT_DETAIL_SELECT,
    });

    return department;
  }

  /**
   * Update department
   */
  async update(id: number, data: UpdateDepartmentDTO, user: AuthUser) {
    // Get existing department
    const existing = await prisma.department.findUnique({
      where: { id },
      select: { company_id: true },
    });

    if (!existing) {
      throw new Error('Department not found');
    }

    // Check company access
    if (!user.accessibleCompanyIds.includes(existing.company_id)) {
      throw new Error('Access denied to update this department');
    }

    // Check for duplicate code if changing
    if (data.code) {
      const duplicate = await prisma.department.findFirst({
        where: {
          code: data.code,
          company_id: existing.company_id,
          id: { not: id },
        },
      });
      if (duplicate) {
        throw new Error('Department code already exists in this company');
      }
    }

    // Validate parent if changing
    if (data.parent_id) {
      if (data.parent_id === id) {
        throw new Error('Department cannot be its own parent');
      }
      const parent = await prisma.department.findUnique({
        where: { id: data.parent_id },
        select: { company_id: true },
      });
      if (!parent) {
        throw new Error('Parent department not found');
      }
      if (parent.company_id !== existing.company_id) {
        throw new Error('Parent department must be in the same company');
      }
    }

    // Validate manager if changing
    if (data.manager_id) {
      const manager = await prisma.employee.findUnique({
        where: { id: data.manager_id },
        select: { company_id: true },
      });
      if (!manager) {
        throw new Error('Manager not found');
      }
      if (manager.company_id !== existing.company_id) {
        throw new Error('Manager must be in the same company');
      }
    }

    // Build update data
    const updateData: Prisma.DepartmentUpdateInput = {};

    // Scalar fields
    const scalarFields = [
      'name', 'code', 'description', 'status', 'budget', 'location',
      'contact_person', 'contact_email', 'contact_phone', 'department_type',
      'headcount_limit', 'cost_center', 'sort_order',
    ] as const;

    for (const field of scalarFields) {
      if (data[field] !== undefined) {
        (updateData as any)[field] = data[field];
      }
    }

    // Date field
    if (data.established_date !== undefined) {
      updateData.established_date = data.established_date ? new Date(data.established_date) : null;
    }

    // Relations
    if (data.parent_id !== undefined) {
      updateData.parent = data.parent_id ? { connect: { id: data.parent_id } } : { disconnect: true };
    }
    if (data.manager_id !== undefined) {
      updateData.manager = data.manager_id ? { connect: { id: data.manager_id } } : { disconnect: true };
    }

    const department = await prisma.department.update({
      where: { id },
      data: updateData,
      select: DEPARTMENT_DETAIL_SELECT,
    });

    return department;
  }

  /**
   * Delete department (soft delete by setting status to inactive)
   */
  async delete(id: number, user: AuthUser) {
    const department = await prisma.department.findUnique({
      where: { id },
      select: { company_id: true, _count: { select: { employees: true, children: true } } },
    });

    if (!department) {
      throw new Error('Department not found');
    }

    if (!user.accessibleCompanyIds.includes(department.company_id)) {
      throw new Error('Access denied to delete this department');
    }

    // Check for active employees
    if (department._count.employees > 0) {
      throw new Error('Cannot delete department with active employees');
    }

    // Check for child departments
    if (department._count.children > 0) {
      throw new Error('Cannot delete department with child departments');
    }

    await prisma.department.update({
      where: { id },
      data: { status: 'inactive' },
    });

    return { success: true };
  }

  /**
   * Get departments by company
   */
  async getByCompany(companyId: number, user: AuthUser) {
    if (!user.accessibleCompanyIds.includes(companyId)) {
      throw new Error('Access denied to this company');
    }

    const departments = await prisma.department.findMany({
      where: {
        company_id: companyId,
        status: 'active',
      },
      select: DEPARTMENT_LIST_SELECT,
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    });

    return departments;
  }

  /**
   * Get department hierarchy (tree structure)
   */
  async getHierarchy(companyId: number, user: AuthUser) {
    if (!user.accessibleCompanyIds.includes(companyId)) {
      throw new Error('Access denied to this company');
    }

    // Get all departments for the company
    const departments = await prisma.department.findMany({
      where: {
        company_id: companyId,
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        code: true,
        parent_id: true,
        manager: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    });

    // Build tree structure
    const buildTree = (parentId: number | null): any[] => {
      return departments
        .filter((d) => d.parent_id === parentId)
        .map((d) => ({
          ...d,
          children: buildTree(d.id),
        }));
    };

    return buildTree(null);
  }
}
