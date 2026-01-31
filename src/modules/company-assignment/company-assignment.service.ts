import { PrismaClient, Prisma } from '@prisma/client';
import {
  CompanyAssignmentListQuery,
  CreateCompanyAssignmentDTO,
  UpdateCompanyAssignmentDTO,
  BulkAssignDTO,
  ASSIGNMENT_LIST_SELECT,
  ASSIGNMENT_STATUS,
  DEFAULT_PERMISSIONS,
} from './company-assignment.types';
import { AuthUser } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class CompanyAssignmentService {
  /**
   * List company assignments with pagination and filters
   */
  async list(query: CompanyAssignmentListQuery, user: AuthUser) {
    const page = parseInt(String(query.page)) || 1;
    const limit = parseInt(String(query.limit)) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.HrStaffCompanyAssignmentWhereInput = {};

    // Filter by employee
    if (query.employee_id) {
      where.employee_id = query.employee_id;
    }

    // Filter by company (only accessible companies for non-super admin)
    if (query.company_id) {
      where.company_id = query.company_id;
    } else if (!user.roles.includes('Super Admin')) {
      where.company_id = { in: user.accessibleCompanyIds };
    }

    // Filter by status
    if (query.status) {
      where.status = query.status;
    }

    // Search by employee name
    if (query.search) {
      where.employee = {
        name: { contains: query.search },
      };
    }

    const [data, total] = await Promise.all([
      prisma.hrStaffCompanyAssignment.findMany({
        where,
        select: ASSIGNMENT_LIST_SELECT,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.hrStaffCompanyAssignment.count({ where }),
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

  /**
   * Get assignment by ID
   */
  async getById(id: number, user: AuthUser) {
    const assignment = await prisma.hrStaffCompanyAssignment.findUnique({
      where: { id },
      select: ASSIGNMENT_LIST_SELECT,
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Check access
    if (!user.roles.includes('Super Admin') && !user.accessibleCompanyIds.includes(assignment.company_id)) {
      throw new Error('Access denied');
    }

    return assignment;
  }

  /**
   * Get assignments by employee ID
   */
  async getByEmployeeId(employeeId: number, user: AuthUser) {
    const where: Prisma.HrStaffCompanyAssignmentWhereInput = {
      employee_id: employeeId,
      status: ASSIGNMENT_STATUS.ACTIVE,
    };

    // Filter by accessible companies for non-super admin
    if (!user.roles.includes('Super Admin')) {
      where.company_id = { in: user.accessibleCompanyIds };
    }

    const assignments = await prisma.hrStaffCompanyAssignment.findMany({
      where,
      select: ASSIGNMENT_LIST_SELECT,
      orderBy: { company: { name: 'asc' } },
    });

    return assignments;
  }

  /**
   * Create new company assignment
   */
  async create(data: CreateCompanyAssignmentDTO, user: AuthUser) {
    // Verify company access
    if (!user.roles.includes('Super Admin') && !user.accessibleCompanyIds.includes(data.company_id)) {
      throw new Error('Access denied to assign this company');
    }

    // Check if assignment already exists
    const existing = await prisma.hrStaffCompanyAssignment.findUnique({
      where: {
        employee_id_company_id: {
          employee_id: data.employee_id,
          company_id: data.company_id,
        },
      },
    });

    if (existing) {
      throw new Error('Assignment already exists for this employee and company');
    }

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: data.employee_id },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: data.company_id },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    const assignment = await prisma.hrStaffCompanyAssignment.create({
      data: {
        employee_id: data.employee_id,
        company_id: data.company_id,
        status: ASSIGNMENT_STATUS.ACTIVE,
        permissions: data.permissions || DEFAULT_PERMISSIONS,
        notes: data.notes,
        assigned_by: user.employee?.id,
        assigned_at: new Date(),
        expires_at: data.expires_at ? new Date(data.expires_at) : null,
      },
      select: ASSIGNMENT_LIST_SELECT,
    });

    return assignment;
  }

  /**
   * Bulk assign companies to an employee
   */
  async bulkAssign(data: BulkAssignDTO, user: AuthUser) {
    // Verify all companies access
    if (!user.roles.includes('Super Admin')) {
      const inaccessible = data.company_ids.filter(id => !user.accessibleCompanyIds.includes(id));
      if (inaccessible.length > 0) {
        throw new Error(`Access denied to companies: ${inaccessible.join(', ')}`);
      }
    }

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: data.employee_id },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Get existing assignments
    const existing = await prisma.hrStaffCompanyAssignment.findMany({
      where: {
        employee_id: data.employee_id,
        company_id: { in: data.company_ids },
      },
      select: { company_id: true },
    });

    const existingCompanyIds = existing.map(e => e.company_id);
    const newCompanyIds = data.company_ids.filter(id => !existingCompanyIds.includes(id));

    if (newCompanyIds.length === 0) {
      throw new Error('All selected companies are already assigned to this employee');
    }

    // Create new assignments
    const assignments = await prisma.$transaction(
      newCompanyIds.map(companyId =>
        prisma.hrStaffCompanyAssignment.create({
          data: {
            employee_id: data.employee_id,
            company_id: companyId,
            status: ASSIGNMENT_STATUS.ACTIVE,
            permissions: data.permissions || DEFAULT_PERMISSIONS,
            notes: data.notes,
            assigned_by: user.employee?.id,
            assigned_at: new Date(),
            expires_at: data.expires_at ? new Date(data.expires_at) : null,
          },
          select: ASSIGNMENT_LIST_SELECT,
        })
      )
    );

    return {
      created: assignments.length,
      skipped: existingCompanyIds.length,
      assignments,
    };
  }

  /**
   * Update assignment
   */
  async update(id: number, data: UpdateCompanyAssignmentDTO, user: AuthUser) {
    const assignment = await prisma.hrStaffCompanyAssignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Verify access
    if (!user.roles.includes('Super Admin') && !user.accessibleCompanyIds.includes(assignment.company_id)) {
      throw new Error('Access denied');
    }

    const updated = await prisma.hrStaffCompanyAssignment.update({
      where: { id },
      data: {
        status: data.status,
        permissions: data.permissions,
        notes: data.notes,
        expires_at: data.expires_at === null ? null : data.expires_at ? new Date(data.expires_at) : undefined,
        updated_at: new Date(),
      },
      select: ASSIGNMENT_LIST_SELECT,
    });

    return updated;
  }

  /**
   * Delete assignment
   */
  async delete(id: number, user: AuthUser) {
    const assignment = await prisma.hrStaffCompanyAssignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Verify access
    if (!user.roles.includes('Super Admin') && !user.accessibleCompanyIds.includes(assignment.company_id)) {
      throw new Error('Access denied');
    }

    await prisma.hrStaffCompanyAssignment.delete({ where: { id } });

    return { success: true };
  }

  /**
   * Get employees available for assignment (not yet assigned to a company)
   */
  async getAvailableEmployees(companyId: number, user: AuthUser) {
    // Verify company access
    if (!user.roles.includes('Super Admin') && !user.accessibleCompanyIds.includes(companyId)) {
      throw new Error('Access denied');
    }

    // Get already assigned employee IDs
    const assigned = await prisma.hrStaffCompanyAssignment.findMany({
      where: { company_id: companyId },
      select: { employee_id: true },
    });

    const assignedIds = assigned.map(a => a.employee_id);

    // Get HR Staff and HR Manager employees not yet assigned
    const employees = await prisma.employee.findMany({
      where: {
        id: { notIn: assignedIds.length > 0 ? assignedIds : [-1] },
        user: {
          userRoles: {
            some: {
              role: {
                name: { in: ['HR Staff', 'HR Manager', 'P&C Head'] },
              },
            },
          },
        },
      },
      select: {
        id: true,
        employee_id: true,
        name: true,
        email: true,
        position: {
          select: { id: true, name: true },
        },
        department: {
          select: { id: true, name: true },
        },
        company: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return employees;
  }

  /**
   * Get my assigned companies (for current user)
   */
  async getMyAssignments(user: AuthUser) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    const assignments = await prisma.hrStaffCompanyAssignment.findMany({
      where: {
        employee_id: user.employee.id,
        status: ASSIGNMENT_STATUS.ACTIVE,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } },
        ],
      },
      select: {
        id: true,
        company_id: true,
        permissions: true,
        expires_at: true,
        company: {
          select: {
            id: true,
            name: true,
            code: true,
            company_type: true,
            logo: true,
          },
        },
      },
      orderBy: { company: { name: 'asc' } },
    });

    return assignments;
  }
}

export const companyAssignmentService = new CompanyAssignmentService();
