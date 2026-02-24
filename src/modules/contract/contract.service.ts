import { PrismaClient, Prisma } from '@prisma/client';
import {
  ContractListQuery,
  MovementListQuery,
  CreateContractDTO,
  UpdateContractDTO,
  RenewContractDTO,
  TerminateContractDTO,
  CreateMovementDTO,
  ApproveMovementDTO,
  RejectMovementDTO,
  CONTRACT_STATUS,
  CONTRACT_LIST_SELECT,
  CONTRACT_DETAIL_SELECT,
  MOVEMENT_LIST_SELECT,
  MOVEMENT_DETAIL_SELECT,
} from './contract.types';
import { AuthUser, hasCompanyAccess, canAccessEmployee, getHighestRoleLevel, ROLE_HIERARCHY } from '../../middlewares/auth.middleware';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../middlewares/error.middleware';

const prisma = new PrismaClient();

export class ContractService {
  // ==========================================
  // CONTRACT METHODS
  // ==========================================

  async listContracts(query: ContractListQuery, user: AuthUser) {
    const {
      page = 1,
      limit = 10,
      employee_id,
      company_id,
      contract_type,
      status,
      expiring_within_days,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ContractWhereInput = {};

    if (employee_id) where.employee_id = employee_id;
    if (contract_type) where.contract_type = contract_type;
    if (status) where.status = status;

    if (company_id) {
      where.employee = { company_id };
    } else if (user.employee?.company_id && getHighestRoleLevel(user.roles) < ROLE_HIERARCHY['CEO']) {
      where.employee = { company_id: user.employee.company_id };
    }

    if (expiring_within_days) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + expiring_within_days);
      where.end_date = { lte: futureDate, gte: new Date() };
      where.status = CONTRACT_STATUS.ACTIVE;
    }

    const orderBy: Prisma.ContractOrderByWithRelationInput = {};
    (orderBy as any)[sort_by] = sort_order;

    const [data, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        select: CONTRACT_LIST_SELECT,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.contract.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getContractById(id: number, user: AuthUser) {
    const contract = await prisma.contract.findUnique({
      where: { id },
      select: CONTRACT_DETAIL_SELECT,
    });

    if (!contract) {
      throw new NotFoundError('Contract');
    }

    if (!await canAccessEmployee(user, contract.employee_id)) {
      throw new ForbiddenError('Access denied');
    }

    return contract;
  }

  async getMyContracts(user: AuthUser) {
    if (!user.employee) {
      throw new BadRequestError('No employee profile found');
    }

    return prisma.contract.findMany({
      where: { employee_id: user.employee.id },
      select: CONTRACT_LIST_SELECT,
      orderBy: { start_date: 'desc' },
    });
  }

  async getActiveContract(employeeId: number, user: AuthUser) {
    if (!await canAccessEmployee(user, employeeId)) {
      throw new ForbiddenError('Access denied');
    }

    return prisma.contract.findFirst({
      where: {
        employee_id: employeeId,
        status: CONTRACT_STATUS.ACTIVE,
      },
      select: CONTRACT_DETAIL_SELECT,
    });
  }

  async getExpiringContracts(days: number, companyId: number | undefined, user: AuthUser) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const where: Prisma.ContractWhereInput = {
      status: CONTRACT_STATUS.ACTIVE,
      end_date: { lte: futureDate, gte: new Date() },
    };

    if (companyId) {
      if (!hasCompanyAccess(user, companyId)) {
        throw new ForbiddenError('Access denied to this company');
      }
      where.employee = { company_id: companyId };
    } else if (user.employee?.company_id && getHighestRoleLevel(user.roles) < ROLE_HIERARCHY['CEO']) {
      where.employee = { company_id: user.employee.company_id };
    }

    return prisma.contract.findMany({
      where,
      select: CONTRACT_LIST_SELECT,
      orderBy: { end_date: 'asc' },
    });
  }

  async createContract(data: CreateContractDTO, user: AuthUser) {
    if (!await canAccessEmployee(user, data.employee_id)) {
      throw new ForbiddenError('Access denied to this employee');
    }

    // Generate contract number
    const contractNumber = `CTR-${Date.now()}-${data.employee_id}`;

    return prisma.contract.create({
      data: {
        employee_id: data.employee_id,
        contract_number: contractNumber,
        contract_type: data.contract_type,
        start_date: new Date(data.start_date),
        end_date: data.end_date ? new Date(data.end_date) : null,
        duration_months: data.duration_months,
        salary: data.salary,
        position: data.position,
        department: data.department,
        terms: data.terms,
        benefits: data.benefits,
        notes: data.notes,
        status: CONTRACT_STATUS.DRAFT,
      },
      select: CONTRACT_DETAIL_SELECT,
    });
  }

  async updateContract(id: number, data: UpdateContractDTO, user: AuthUser) {
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Contract');
    }

    if (!await canAccessEmployee(user, existing.employee_id)) {
      throw new ForbiddenError('Access denied');
    }

    return prisma.contract.update({
      where: { id },
      data: {
        ...data,
        start_date: data.start_date ? new Date(data.start_date) : undefined,
        end_date: data.end_date ? new Date(data.end_date) : undefined,
      },
      select: CONTRACT_DETAIL_SELECT,
    });
  }

  async activateContract(id: number, user: AuthUser) {
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Contract');
    }

    if (!await canAccessEmployee(user, existing.employee_id)) {
      throw new ForbiddenError('Access denied');
    }

    // Deactivate any other active contracts for this employee
    await prisma.contract.updateMany({
      where: {
        employee_id: existing.employee_id,
        status: CONTRACT_STATUS.ACTIVE,
        id: { not: id },
      },
      data: { status: CONTRACT_STATUS.EXPIRED },
    });

    return prisma.contract.update({
      where: { id },
      data: {
        status: CONTRACT_STATUS.ACTIVE,
        signed_date: new Date(),
      },
      select: CONTRACT_DETAIL_SELECT,
    });
  }

  async renewContract(id: number, data: RenewContractDTO, user: AuthUser) {
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Contract');
    }

    if (!await canAccessEmployee(user, existing.employee_id)) {
      throw new ForbiddenError('Access denied');
    }

    // Mark old contract as renewed
    await prisma.contract.update({
      where: { id },
      data: { status: CONTRACT_STATUS.RENEWED },
    });

    // Create new contract
    const contractNumber = `CTR-${Date.now()}-${existing.employee_id}`;

    return prisma.contract.create({
      data: {
        employee_id: existing.employee_id,
        contract_number: contractNumber,
        contract_type: existing.contract_type,
        start_date: new Date(data.new_start_date),
        end_date: data.new_end_date ? new Date(data.new_end_date) : null,
        duration_months: data.duration_months,
        salary: data.new_salary || existing.salary,
        position: existing.position,
        department: existing.department,
        terms: data.terms || existing.terms,
        benefits: existing.benefits as Prisma.InputJsonValue ?? undefined,
        notes: data.notes,
        renewed_from: id,
        status: CONTRACT_STATUS.ACTIVE,
        signed_date: new Date(),
      },
      select: CONTRACT_DETAIL_SELECT,
    });
  }

  async terminateContract(id: number, data: TerminateContractDTO, user: AuthUser) {
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Contract');
    }

    if (!await canAccessEmployee(user, existing.employee_id)) {
      throw new ForbiddenError('Access denied');
    }

    return prisma.contract.update({
      where: { id },
      data: {
        status: CONTRACT_STATUS.TERMINATED,
        termination_date: new Date(data.termination_date),
        termination_reason: data.termination_reason,
      },
      select: CONTRACT_DETAIL_SELECT,
    });
  }

  // ==========================================
  // EMPLOYEE MOVEMENT METHODS
  // ==========================================

  async listMovements(query: MovementListQuery, user: AuthUser) {
    const {
      page = 1,
      limit = 10,
      employee_id,
      company_id,
      movement_type,
      status,
      start_date,
      end_date,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EmployeeMovementWhereInput = {
      deleted_at: null,
    };

    if (employee_id) where.employee_id = employee_id;
    if (company_id) where.company_id = company_id;
    if (movement_type) where.movement_type = movement_type;
    if (status) where.status = status;

    if (start_date) {
      where.effective_date = { gte: new Date(start_date) };
    }
    if (end_date) {
      where.effective_date = { ...where.effective_date as object, lte: new Date(end_date) };
    }

    const orderBy: Prisma.EmployeeMovementOrderByWithRelationInput = {};
    (orderBy as any)[sort_by] = sort_order;

    const [data, total] = await Promise.all([
      prisma.employeeMovement.findMany({
        where,
        select: MOVEMENT_LIST_SELECT,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.employeeMovement.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getMovementById(id: number, user: AuthUser) {
    const movement = await prisma.employeeMovement.findFirst({
      where: { id, deleted_at: null },
      select: MOVEMENT_DETAIL_SELECT,
    });

    if (!movement) {
      throw new NotFoundError('Movement');
    }

    if (!await canAccessEmployee(user, movement.employee_id)) {
      throw new ForbiddenError('Access denied');
    }

    return movement;
  }

  async getMyMovements(user: AuthUser) {
    if (!user.employee) {
      throw new BadRequestError('No employee profile found');
    }

    return prisma.employeeMovement.findMany({
      where: {
        employee_id: user.employee.id,
        deleted_at: null,
      },
      select: MOVEMENT_LIST_SELECT,
      orderBy: { effective_date: 'desc' },
    });
  }

  async createMovement(data: CreateMovementDTO, user: AuthUser) {
    if (!await canAccessEmployee(user, data.employee_id)) {
      throw new ForbiddenError('Access denied to this employee');
    }

    // Get employee's current state
    const employee = await prisma.employee.findUnique({
      where: { id: data.employee_id },
      include: {
        position: true,
        department: true,
        company: true,
      },
    });

    if (!employee) {
      throw new NotFoundError('Employee');
    }

    // Get new position/department names if IDs provided
    let newPositionName = null;
    let newDepartmentName = null;
    let newCompanyName = null;

    if (data.new_position_id) {
      const newPos = await prisma.position.findUnique({ where: { id: data.new_position_id } });
      newPositionName = newPos?.name;
    }
    if (data.new_department_id) {
      const newDept = await prisma.department.findUnique({ where: { id: data.new_department_id } });
      newDepartmentName = newDept?.name;
    }
    if (data.new_company_id) {
      const newComp = await prisma.company.findUnique({ where: { id: data.new_company_id } });
      newCompanyName = newComp?.name;
    }

    // Calculate salary change
    const previousSalary = employee.basic_salary?.toNumber() || 0;
    const newSalary = data.new_salary || previousSalary;
    const salaryChange = newSalary - previousSalary;
    const salaryChangePercentage = previousSalary > 0 ? (salaryChange / previousSalary) * 100 : 0;

    return prisma.employeeMovement.create({
      data: {
        employee_id: data.employee_id,
        company_id: employee.company_id,
        movement_type: data.movement_type,
        effective_date: new Date(data.effective_date),
        previous_position_id: employee.position_id,
        previous_position_name: employee.position?.name,
        previous_department_id: employee.department_id,
        previous_department_name: employee.department?.name,
        previous_company_id: employee.company_id,
        previous_company_name: employee.company?.name,
        previous_salary: employee.basic_salary,
        previous_grade: employee.grade_level,
        previous_status: employee.employment_status,
        new_position_id: data.new_position_id,
        new_position_name: newPositionName,
        new_department_id: data.new_department_id,
        new_department_name: newDepartmentName,
        new_company_id: data.new_company_id,
        new_company_name: newCompanyName,
        new_salary: data.new_salary,
        new_grade: data.new_grade,
        new_status: data.new_status,
        salary_change: salaryChange,
        salary_change_percentage: salaryChangePercentage,
        reason: data.reason,
        notes: data.notes,
        requested_by: user.employee?.id,
        requested_at: new Date(),
        status: 'pending',
      },
      select: MOVEMENT_DETAIL_SELECT,
    });
  }

  async approveMovement(id: number, data: ApproveMovementDTO, user: AuthUser) {
    const existing = await prisma.employeeMovement.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundError('Movement');
    }

    if (existing.status !== 'pending') {
      throw new BadRequestError('Can only approve pending movements');
    }

    return prisma.employeeMovement.update({
      where: { id },
      data: {
        status: 'approved',
        approved_by: user.employee?.id,
        approved_at: new Date(),
        approval_notes: data.approval_notes,
      },
      select: MOVEMENT_DETAIL_SELECT,
    });
  }

  async rejectMovement(id: number, data: RejectMovementDTO, user: AuthUser) {
    const existing = await prisma.employeeMovement.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundError('Movement');
    }

    if (existing.status !== 'pending') {
      throw new BadRequestError('Can only reject pending movements');
    }

    return prisma.employeeMovement.update({
      where: { id },
      data: {
        status: 'rejected',
        rejected_by: user.employee?.id,
        rejected_at: new Date(),
        rejection_reason: data.rejection_reason,
      },
      select: MOVEMENT_DETAIL_SELECT,
    });
  }

  async applyMovement(id: number, user: AuthUser) {
    const existing = await prisma.employeeMovement.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundError('Movement');
    }

    if (existing.status !== 'approved') {
      throw new BadRequestError('Can only apply approved movements');
    }

    if (existing.is_applied) {
      throw new BadRequestError('Movement already applied');
    }

    // Apply changes to employee
    const updateData: Prisma.EmployeeUpdateInput = {};

    if (existing.new_position_id) updateData.position = { connect: { id: existing.new_position_id } };
    if (existing.new_department_id) updateData.department = { connect: { id: existing.new_department_id } };
    if (existing.new_company_id) updateData.company = { connect: { id: existing.new_company_id } };
    if (existing.new_salary) updateData.basic_salary = existing.new_salary;
    if (existing.new_grade) updateData.grade_level = existing.new_grade;
    if (existing.new_status) updateData.employment_status = existing.new_status;

    await prisma.employee.update({
      where: { id: existing.employee_id },
      data: updateData,
    });

    return prisma.employeeMovement.update({
      where: { id },
      data: {
        is_applied: true,
        applied_at: new Date(),
      },
      select: MOVEMENT_DETAIL_SELECT,
    });
  }

  async deleteMovement(id: number, user: AuthUser) {
    const existing = await prisma.employeeMovement.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundError('Movement');
    }

    if (!await canAccessEmployee(user, existing.employee_id)) {
      throw new ForbiddenError('Access denied');
    }

    if (existing.is_applied) {
      throw new BadRequestError('Cannot delete applied movements');
    }

    return prisma.employeeMovement.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  // ==========================================
  // GROUP CEO STATISTICS
  // ==========================================

  async getGroupContractStatistics() {
    const today = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const in60Days = new Date();
    in60Days.setDate(in60Days.getDate() + 60);
    const in90Days = new Date();
    in90Days.setDate(in90Days.getDate() + 90);

    // Get all active companies
    const companies = await prisma.company.findMany({
      where: { status: 'active' },
      select: { id: true, name: true },
    });

    // Get contract statistics per company
    const companyStats = await Promise.all(
      companies.map(async (company) => {
        const [
          total,
          active,
          expired,
          expiring30,
          expiring60,
          expiring90,
          permanent,
          contract,
          probation,
        ] = await Promise.all([
          prisma.contract.count({
            where: { employee: { company_id: company.id } },
          }),
          prisma.contract.count({
            where: { employee: { company_id: company.id }, status: 'active' },
          }),
          prisma.contract.count({
            where: { employee: { company_id: company.id }, status: 'expired' },
          }),
          prisma.contract.count({
            where: {
              employee: { company_id: company.id },
              status: 'active',
              end_date: { gte: today, lte: in30Days },
            },
          }),
          prisma.contract.count({
            where: {
              employee: { company_id: company.id },
              status: 'active',
              end_date: { gte: today, lte: in60Days },
            },
          }),
          prisma.contract.count({
            where: {
              employee: { company_id: company.id },
              status: 'active',
              end_date: { gte: today, lte: in90Days },
            },
          }),
          prisma.contract.count({
            where: { employee: { company_id: company.id }, contract_type: 'permanent' },
          }),
          prisma.contract.count({
            where: { employee: { company_id: company.id }, contract_type: 'contract' },
          }),
          prisma.contract.count({
            where: { employee: { company_id: company.id }, contract_type: 'probation' },
          }),
        ]);

        return {
          company_id: company.id,
          company_name: company.name,
          total,
          active,
          expired,
          expiring_30_days: expiring30,
          expiring_60_days: expiring60,
          expiring_90_days: expiring90,
          by_type: {
            permanent,
            contract,
            probation,
          },
        };
      })
    );

    // Calculate totals
    const totals = companyStats.reduce(
      (acc, stat) => ({
        total: acc.total + stat.total,
        active: acc.active + stat.active,
        expired: acc.expired + stat.expired,
        expiring_30_days: acc.expiring_30_days + stat.expiring_30_days,
        expiring_60_days: acc.expiring_60_days + stat.expiring_60_days,
        expiring_90_days: acc.expiring_90_days + stat.expiring_90_days,
        permanent: acc.permanent + stat.by_type.permanent,
        contract: acc.contract + stat.by_type.contract,
        probation: acc.probation + stat.by_type.probation,
      }),
      {
        total: 0,
        active: 0,
        expired: 0,
        expiring_30_days: 0,
        expiring_60_days: 0,
        expiring_90_days: 0,
        permanent: 0,
        contract: 0,
        probation: 0,
      }
    );

    // Get contracts expiring soon with details
    const expiringContracts = await prisma.contract.findMany({
      where: {
        status: 'active',
        end_date: { gte: today, lte: in30Days },
      },
      select: {
        id: true,
        contract_number: true,
        contract_type: true,
        start_date: true,
        end_date: true,
        employee: {
          select: {
            id: true,
            name: true,
            employee_id: true,
            company: { select: { id: true, name: true } },
            department: { select: { name: true } },
            position: { select: { name: true } },
          },
        },
      },
      orderBy: { end_date: 'asc' },
      take: 20,
    });

    // Get recent contract activities
    const recentContracts = await prisma.contract.findMany({
      select: {
        id: true,
        contract_number: true,
        contract_type: true,
        status: true,
        start_date: true,
        end_date: true,
        created_at: true,
        employee: {
          select: {
            id: true,
            name: true,
            employee_id: true,
            company: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 10,
    });

    return {
      summary: {
        total_contracts: totals.total,
        active_contracts: totals.active,
        expired_contracts: totals.expired,
        expiring_30_days: totals.expiring_30_days,
        expiring_60_days: totals.expiring_60_days,
        expiring_90_days: totals.expiring_90_days,
        by_type: {
          permanent: totals.permanent,
          contract: totals.contract,
          probation: totals.probation,
        },
      },
      by_company: companyStats,
      expiring_contracts: expiringContracts,
      recent_contracts: recentContracts,
    };
  }
}
