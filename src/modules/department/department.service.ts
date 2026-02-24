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

    // Departments are now global (company_id is NULL)
    // No company filter needed

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

    // Departments are now global - no company access check needed

    return department;
  }

  /**
   * Create new department (global - no company required)
   */
  async create(data: CreateDepartmentDTO, user: AuthUser) {
    // Check for duplicate code globally
    if (data.code) {
      const existing = await prisma.department.findFirst({
        where: { code: data.code },
      });
      if (existing) {
        throw new Error('Department code already exists');
      }
    }

    // Validate parent department if provided
    if (data.parent_id) {
      const parent = await prisma.department.findUnique({
        where: { id: data.parent_id },
      });
      if (!parent) {
        throw new Error('Parent department not found');
      }
    }

    // Validate manager if provided
    if (data.manager_id) {
      const manager = await prisma.employee.findUnique({
        where: { id: data.manager_id },
      });
      if (!manager) {
        throw new Error('Manager not found');
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
        ...(data.parent_id && { parent: { connect: { id: data.parent_id } } }),
        ...(data.manager_id && { manager: { connect: { id: data.manager_id } } }),
      },
      select: DEPARTMENT_DETAIL_SELECT,
    });

    return department;
  }

  /**
   * Update department (global - no company check)
   */
  async update(id: number, data: UpdateDepartmentDTO, user: AuthUser) {
    // Get existing department
    const existing = await prisma.department.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Department not found');
    }

    // Check for duplicate code if changing
    if (data.code) {
      const duplicate = await prisma.department.findFirst({
        where: {
          code: data.code,
          id: { not: id },
        },
      });
      if (duplicate) {
        throw new Error('Department code already exists');
      }
    }

    // Validate parent if changing
    if (data.parent_id) {
      if (data.parent_id === id) {
        throw new Error('Department cannot be its own parent');
      }
      const parent = await prisma.department.findUnique({
        where: { id: data.parent_id },
      });
      if (!parent) {
        throw new Error('Parent department not found');
      }
    }

    // Validate manager if changing
    if (data.manager_id) {
      const manager = await prisma.employee.findUnique({
        where: { id: data.manager_id },
      });
      if (!manager) {
        throw new Error('Manager not found');
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
      select: { _count: { select: { employees: true, children: true } } },
    });

    if (!department) {
      throw new Error('Department not found');
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
   * Get all departments (global)
   */
  async getAll(user: AuthUser) {
    const departments = await prisma.department.findMany({
      where: {
        status: 'active',
      },
      select: DEPARTMENT_LIST_SELECT,
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    });

    return departments;
  }

  /**
   * Get departments by company (legacy - returns all global departments)
   */
  async getByCompany(companyId: number, user: AuthUser) {
    return this.getAll(user);
  }

  /**
   * Get department hierarchy (tree structure)
   */
  async getHierarchy(companyId: number, user: AuthUser) {
    // Get all global departments
    const departments = await prisma.department.findMany({
      where: {
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
