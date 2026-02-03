import { PrismaClient, Prisma } from '@prisma/client';
import { AuthUser } from '../../types/auth.types';
import {
  PositionListQuery,
  CreatePositionDTO,
  UpdatePositionDTO,
  POSITION_LIST_SELECT,
  POSITION_DETAIL_SELECT,
} from './position.types';

const prisma = new PrismaClient();

export class PositionService {
  /**
   * Get paginated list of positions with filters
   */
  async list(query: PositionListQuery, user: AuthUser) {
    const {
      page = 1,
      limit = 10,
      search,
      company_id,
      department_id,
      level,
      status,
      sort_by = 'name',
      sort_order = 'asc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.PositionWhereInput = {};

    // Company filter - restrict to accessible companies
    if (company_id) {
      if (!user.accessibleCompanyIds.includes(company_id)) {
        throw new Error('Access denied to this company');
      }
      where.company_id = company_id;
    } else {
      where.company_id = { in: user.accessibleCompanyIds };
    }

    // Department filter
    if (department_id) {
      where.department_id = department_id;
    }

    // Level filter
    if (level) {
      where.level = level;
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
    const total = await prisma.position.count({ where });

    // Get positions
    const positions = await prisma.position.findMany({
      where,
      select: POSITION_LIST_SELECT,
      skip,
      take: limit,
      orderBy: { [sort_by]: sort_order },
    });

    return {
      data: positions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get position by ID
   */
  async getById(id: number, user: AuthUser) {
    const position = await prisma.position.findUnique({
      where: { id },
      select: POSITION_DETAIL_SELECT,
    });

    if (!position) {
      throw new Error('Position not found');
    }

    // Check company access
    if (!user.accessibleCompanyIds.includes(position.company.id)) {
      throw new Error('Access denied to this position');
    }

    return position;
  }

  /**
   * Create new position
   */
  async create(data: CreatePositionDTO, user: AuthUser) {
    // Check company access
    if (!user.accessibleCompanyIds.includes(data.company_id)) {
      throw new Error('Access denied to create position in this company');
    }

    // Check for duplicate code within company
    if (data.code) {
      const existing = await prisma.position.findFirst({
        where: {
          code: data.code,
          company_id: data.company_id,
        },
      });
      if (existing) {
        throw new Error('Position code already exists in this company');
      }
    }

    // Validate department if provided
    if (data.department_id) {
      const department = await prisma.department.findUnique({
        where: { id: data.department_id },
        select: { company_id: true },
      });
      if (!department) {
        throw new Error('Department not found');
      }
      if (department.company_id !== data.company_id) {
        throw new Error('Department must be in the same company');
      }
    }

    const position = await prisma.position.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        level: data.level,
        min_salary: data.min_salary,
        max_salary: data.max_salary,
        requirements: data.requirements,
        responsibilities: data.responsibilities,
        qualifications: data.qualifications,
        headcount: data.headcount,
        status: data.status || 'active',
        company: { connect: { id: data.company_id } },
        ...(data.department_id && { department: { connect: { id: data.department_id } } }),
      },
      select: POSITION_DETAIL_SELECT,
    });

    return position;
  }

  /**
   * Update position
   */
  async update(id: number, data: UpdatePositionDTO, user: AuthUser) {
    // Get existing position
    const existing = await prisma.position.findUnique({
      where: { id },
      select: { company_id: true },
    });

    if (!existing) {
      throw new Error('Position not found');
    }

    // Check company access
    if (!user.accessibleCompanyIds.includes(existing.company_id)) {
      throw new Error('Access denied to update this position');
    }

    // Check for duplicate code if changing
    if (data.code) {
      const duplicate = await prisma.position.findFirst({
        where: {
          code: data.code,
          company_id: existing.company_id,
          id: { not: id },
        },
      });
      if (duplicate) {
        throw new Error('Position code already exists in this company');
      }
    }

    // Validate department if changing
    if (data.department_id) {
      const department = await prisma.department.findUnique({
        where: { id: data.department_id },
        select: { company_id: true },
      });
      if (!department) {
        throw new Error('Department not found');
      }
      if (department.company_id !== existing.company_id) {
        throw new Error('Department must be in the same company');
      }
    }

    // Build update data
    const updateData: Prisma.PositionUpdateInput = {};

    // Scalar fields
    const scalarFields = [
      'name', 'code', 'description', 'level', 'min_salary', 'max_salary',
      'requirements', 'responsibilities', 'qualifications', 'headcount', 'status',
    ] as const;

    for (const field of scalarFields) {
      if (data[field] !== undefined) {
        (updateData as any)[field] = data[field];
      }
    }

    // Relations
    if (data.department_id !== undefined) {
      updateData.department = data.department_id
        ? { connect: { id: data.department_id } }
        : { disconnect: true };
    }

    const position = await prisma.position.update({
      where: { id },
      data: updateData,
      select: POSITION_DETAIL_SELECT,
    });

    return position;
  }

  /**
   * Delete position (soft delete by setting status to inactive)
   */
  async delete(id: number, user: AuthUser) {
    const position = await prisma.position.findUnique({
      where: { id },
      select: { company_id: true, _count: { select: { employees: true } } },
    });

    if (!position) {
      throw new Error('Position not found');
    }

    if (!user.accessibleCompanyIds.includes(position.company_id)) {
      throw new Error('Access denied to delete this position');
    }

    // Check for active employees
    if (position._count.employees > 0) {
      throw new Error('Cannot delete position with active employees');
    }

    await prisma.position.update({
      where: { id },
      data: { status: 'inactive' },
    });

    return { success: true };
  }

  /**
   * Get positions by company
   */
  async getByCompany(companyId: number, user: AuthUser) {
    if (!user.accessibleCompanyIds.includes(companyId)) {
      throw new Error('Access denied to this company');
    }

    const positions = await prisma.position.findMany({
      where: {
        company_id: companyId,
        status: 'active',
      },
      select: POSITION_LIST_SELECT,
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });

    return positions;
  }

  /**
   * Get positions by department
   */
  async getByDepartment(departmentId: number, user: AuthUser) {
    // Verify department exists (departments are now global)
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new Error('Department not found');
    }

    const positions = await prisma.position.findMany({
      where: {
        department_id: departmentId,
        status: 'active',
      },
      select: POSITION_LIST_SELECT,
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });

    return positions;
  }
}
