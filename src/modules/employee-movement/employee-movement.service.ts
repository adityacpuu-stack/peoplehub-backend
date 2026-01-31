import { PrismaClient, Prisma } from '@prisma/client';
import {
  EmployeeMovementListQuery,
  CreateEmployeeMovementDTO,
  UpdateEmployeeMovementDTO,
  EMPLOYEE_MOVEMENT_SELECT,
  EMPLOYEE_MOVEMENT_DETAIL_SELECT,
} from './employee-movement.types';
import { AuthUser } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class EmployeeMovementService {
  async list(query: EmployeeMovementListQuery, user: AuthUser) {
    const { page = 1, limit = 20, search, employee_id, company_id, movement_type, status, effective_from, effective_to, is_applied } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EmployeeMovementWhereInput = { deleted_at: null };

    if (company_id) {
      where.company_id = company_id;
    } else if (user.accessibleCompanyIds?.length) {
      where.company_id = { in: user.accessibleCompanyIds };
    }

    if (search) {
      where.OR = [
        { employee: { name: { contains: search } } },
        { employee: { employee_id: { contains: search } } },
        { reason: { contains: search } },
      ];
    }

    if (employee_id) where.employee_id = employee_id;
    if (movement_type) where.movement_type = movement_type;
    if (status) where.status = status;
    if (is_applied !== undefined) where.is_applied = is_applied;
    if (effective_from || effective_to) {
      where.effective_date = {};
      if (effective_from) where.effective_date.gte = new Date(effective_from);
      if (effective_to) where.effective_date.lte = new Date(effective_to);
    }

    const [data, total] = await Promise.all([
      prisma.employeeMovement.findMany({
        where,
        select: EMPLOYEE_MOVEMENT_DETAIL_SELECT,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.employeeMovement.count({ where }),
    ]);

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: number) {
    const movement = await prisma.employeeMovement.findFirst({
      where: { id, deleted_at: null },
      select: EMPLOYEE_MOVEMENT_DETAIL_SELECT,
    });
    if (!movement) throw new Error('Employee movement not found');
    return movement;
  }

  async getByEmployeeId(employeeId: number, query: { status?: string } = {}) {
    const where: Prisma.EmployeeMovementWhereInput = { employee_id: employeeId, deleted_at: null };
    if (query.status) where.status = query.status;

    return prisma.employeeMovement.findMany({
      where,
      select: EMPLOYEE_MOVEMENT_DETAIL_SELECT,
      orderBy: { effective_date: 'desc' },
    });
  }

  async create(data: CreateEmployeeMovementDTO, user: AuthUser) {
    // Get current employee state
    const employee = await prisma.employee.findUnique({
      where: { id: data.employee_id },
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        salaryGrade: { select: { grade_code: true } },
      },
    });

    if (!employee) throw new Error('Employee not found');

    // Calculate salary change if applicable
    let salaryChange = null;
    let salaryChangePercentage = null;
    const previousSalary = Number(employee.basic_salary || 0);

    if (data.new_salary && previousSalary > 0) {
      salaryChange = data.new_salary - previousSalary;
      salaryChangePercentage = ((data.new_salary - previousSalary) / previousSalary) * 100;
    }

    // Get new position/department/company names
    const [newPosition, newDepartment, newCompany] = await Promise.all([
      data.new_position_id ? prisma.position.findUnique({ where: { id: data.new_position_id }, select: { name: true } }) : null,
      data.new_department_id ? prisma.department.findUnique({ where: { id: data.new_department_id }, select: { name: true } }) : null,
      data.new_company_id ? prisma.company.findUnique({ where: { id: data.new_company_id }, select: { name: true } }) : null,
    ]);

    return prisma.employeeMovement.create({
      data: {
        employee_id: data.employee_id,
        company_id: data.company_id || employee.company_id,
        movement_type: data.movement_type,
        effective_date: data.effective_date,
        // Previous state
        previous_position_id: employee.position_id,
        previous_position_name: employee.position?.name,
        previous_department_id: employee.department_id,
        previous_department_name: employee.department?.name,
        previous_company_id: employee.company_id,
        previous_company_name: employee.company?.name,
        previous_salary: employee.basic_salary,
        previous_grade: employee.salaryGrade?.grade_code,
        previous_status: employee.employment_status,
        // New state
        new_position_id: data.new_position_id,
        new_position_name: newPosition?.name,
        new_department_id: data.new_department_id,
        new_department_name: newDepartment?.name,
        new_company_id: data.new_company_id,
        new_company_name: newCompany?.name,
        new_salary: data.new_salary,
        new_grade: data.new_grade,
        new_status: data.new_status,
        // Details
        salary_change: salaryChange,
        salary_change_percentage: salaryChangePercentage,
        reason: data.reason,
        attachment: data.attachment,
        notes: data.notes,
        // Approval
        status: 'pending',
        requested_by: user.employee?.id,
        requested_at: new Date(),
      },
      select: EMPLOYEE_MOVEMENT_DETAIL_SELECT,
    });
  }

  async update(id: number, data: UpdateEmployeeMovementDTO, user: AuthUser) {
    const existing = await prisma.employeeMovement.findFirst({ where: { id, deleted_at: null } });
    if (!existing) throw new Error('Employee movement not found');
    if (existing.status !== 'pending') throw new Error('Only pending movements can be updated');

    return prisma.employeeMovement.update({
      where: { id },
      data,
      select: EMPLOYEE_MOVEMENT_DETAIL_SELECT,
    });
  }

  async delete(id: number, user: AuthUser) {
    const existing = await prisma.employeeMovement.findFirst({ where: { id, deleted_at: null } });
    if (!existing) throw new Error('Employee movement not found');
    if (existing.is_applied) throw new Error('Cannot delete applied movement');

    return prisma.employeeMovement.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async approve(id: number, notes: string | undefined, user: AuthUser) {
    const movement = await prisma.employeeMovement.findFirst({ where: { id, deleted_at: null } });
    if (!movement) throw new Error('Employee movement not found');
    if (movement.status !== 'pending') throw new Error('Only pending movements can be approved');

    return prisma.employeeMovement.update({
      where: { id },
      data: {
        status: 'approved',
        approved_by: user.employee?.id,
        approved_at: new Date(),
        approval_notes: notes,
      },
      select: EMPLOYEE_MOVEMENT_DETAIL_SELECT,
    });
  }

  async reject(id: number, reason: string, user: AuthUser) {
    const movement = await prisma.employeeMovement.findFirst({ where: { id, deleted_at: null } });
    if (!movement) throw new Error('Employee movement not found');
    if (movement.status !== 'pending') throw new Error('Only pending movements can be rejected');

    return prisma.employeeMovement.update({
      where: { id },
      data: {
        status: 'rejected',
        rejected_by: user.employee?.id,
        rejected_at: new Date(),
        rejection_reason: reason,
      },
      select: EMPLOYEE_MOVEMENT_DETAIL_SELECT,
    });
  }

  async apply(id: number, user: AuthUser) {
    const movement = await prisma.employeeMovement.findFirst({ where: { id, deleted_at: null } });
    if (!movement) throw new Error('Employee movement not found');
    if (movement.status !== 'approved') throw new Error('Only approved movements can be applied');
    if (movement.is_applied) throw new Error('Movement already applied');

    // Check if effective date has passed
    if (new Date(movement.effective_date) > new Date()) {
      throw new Error('Cannot apply movement before effective date');
    }

    // Update employee data based on movement
    const updateData: any = {};

    if (movement.new_position_id) updateData.position_id = movement.new_position_id;
    if (movement.new_department_id) updateData.department_id = movement.new_department_id;
    if (movement.new_company_id) updateData.company_id = movement.new_company_id;
    if (movement.new_salary) updateData.basic_salary = movement.new_salary;
    if (movement.new_status) updateData.employment_status = movement.new_status;

    // Update employee
    await prisma.employee.update({
      where: { id: movement.employee_id },
      data: updateData,
    });

    // Mark movement as applied
    return prisma.employeeMovement.update({
      where: { id },
      data: { is_applied: true, applied_at: new Date(), status: 'applied' },
      select: EMPLOYEE_MOVEMENT_DETAIL_SELECT,
    });
  }

  async getPendingApprovals(companyId?: number) {
    const where: Prisma.EmployeeMovementWhereInput = { status: 'pending', deleted_at: null };
    if (companyId) where.company_id = companyId;

    return prisma.employeeMovement.findMany({
      where,
      select: EMPLOYEE_MOVEMENT_DETAIL_SELECT,
      orderBy: { requested_at: 'asc' },
    });
  }

  async getApprovedPendingApplication(companyId?: number) {
    const where: Prisma.EmployeeMovementWhereInput = {
      status: 'approved',
      is_applied: false,
      deleted_at: null,
      effective_date: { lte: new Date() },
    };
    if (companyId) where.company_id = companyId;

    return prisma.employeeMovement.findMany({
      where,
      select: EMPLOYEE_MOVEMENT_DETAIL_SELECT,
      orderBy: { effective_date: 'asc' },
    });
  }

  async getStatistics(query: { company_id?: number }, user: AuthUser) {
    const where: Prisma.EmployeeMovementWhereInput = { deleted_at: null };
    if (query.company_id) where.company_id = query.company_id;

    const [byType, byStatus, totals] = await Promise.all([
      prisma.employeeMovement.groupBy({
        by: ['movement_type'],
        where,
        _count: true,
      }),
      prisma.employeeMovement.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.employeeMovement.aggregate({
        where,
        _count: true,
        _avg: { salary_change_percentage: true },
      }),
    ]);

    return {
      total_movements: totals._count,
      avg_salary_change_percentage: totals._avg.salary_change_percentage,
      by_type: byType.map((t) => ({ type: t.movement_type, count: t._count })),
      by_status: byStatus.map((s) => ({ status: s.status, count: s._count })),
    };
  }
}
