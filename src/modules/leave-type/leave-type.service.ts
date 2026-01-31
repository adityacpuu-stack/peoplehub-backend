import { PrismaClient, Prisma } from '@prisma/client';
import {
  LeaveTypeListQuery,
  LeaveEntitlementListQuery,
  EmployeeLeaveBalanceQuery,
  CreateLeaveTypeDTO,
  UpdateLeaveTypeDTO,
  CreateLeaveEntitlementDTO,
  UpdateLeaveEntitlementDTO,
  CreateEmployeeLeaveBalanceDTO,
  UpdateEmployeeLeaveBalanceDTO,
  AdjustLeaveBalanceDTO,
  LEAVE_TYPE_SELECT,
  LEAVE_ENTITLEMENT_SELECT,
  LEAVE_ENTITLEMENT_DETAIL_SELECT,
  EMPLOYEE_LEAVE_BALANCE_SELECT,
  EMPLOYEE_LEAVE_BALANCE_DETAIL_SELECT,
  DEFAULT_LEAVE_TYPES,
} from './leave-type.types';
import { AuthUser } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class LeaveTypeService {
  // ==========================================
  // LEAVE TYPE METHODS
  // ==========================================

  async listLeaveTypes(query: LeaveTypeListQuery, user: AuthUser) {
    const { page = 1, limit = 50, search, company_id, is_active, is_paid } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.LeaveTypeWhereInput = {};

    if (company_id) {
      where.OR = [
        { company_id: company_id },
        { company_id: null }, // Global leave types
      ];
    }

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    if (is_paid !== undefined) {
      where.is_paid = is_paid;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search } },
            { code: { contains: search } },
            { description: { contains: search } },
          ],
        },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.leaveType.findMany({
        where,
        select: LEAVE_TYPE_SELECT,
        skip,
        take: limit,
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      }),
      prisma.leaveType.count({ where }),
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

  async getLeaveTypeById(id: number) {
    const leaveType = await prisma.leaveType.findUnique({
      where: { id },
      select: LEAVE_TYPE_SELECT,
    });

    if (!leaveType) {
      throw new Error('Leave type not found');
    }

    return leaveType;
  }

  async createLeaveType(data: CreateLeaveTypeDTO, user: AuthUser) {
    // Check code uniqueness
    if (data.code) {
      const existing = await prisma.leaveType.findFirst({
        where: {
          code: data.code,
          company_id: data.company_id || null,
        },
      });

      if (existing) {
        throw new Error('Leave type code already exists');
      }
    }

    return prisma.leaveType.create({
      data,
      select: LEAVE_TYPE_SELECT,
    });
  }

  async updateLeaveType(id: number, data: UpdateLeaveTypeDTO, user: AuthUser) {
    const existing = await prisma.leaveType.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('Leave type not found');
    }

    // Check code uniqueness if changing
    if (data.code && data.code !== existing.code) {
      const codeExists = await prisma.leaveType.findFirst({
        where: {
          code: data.code,
          company_id: existing.company_id,
          id: { not: id },
        },
      });

      if (codeExists) {
        throw new Error('Leave type code already exists');
      }
    }

    return prisma.leaveType.update({
      where: { id },
      data,
      select: LEAVE_TYPE_SELECT,
    });
  }

  async deleteLeaveType(id: number, user: AuthUser) {
    const existing = await prisma.leaveType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            leaves: true,
            leaveRequests: true,
            employeeBalances: true,
          },
        },
      },
    });

    if (!existing) {
      throw new Error('Leave type not found');
    }

    if (existing._count.leaves > 0 || existing._count.leaveRequests > 0) {
      throw new Error('Cannot delete leave type with existing leave records');
    }

    // Delete related balances first
    await prisma.employeeLeaveBalance.deleteMany({ where: { leave_type_id: id } });
    // Delete related entitlements
    await prisma.leaveEntitlement.deleteMany({ where: { leave_type_id: id } });

    return prisma.leaveType.delete({ where: { id } });
  }

  async seedDefaultLeaveTypes(companyId: number | null, user: AuthUser) {
    const results = { created: 0, skipped: 0 };

    for (const leaveType of DEFAULT_LEAVE_TYPES) {
      try {
        const existing = await prisma.leaveType.findFirst({
          where: {
            code: leaveType.code,
            company_id: companyId,
          },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        await prisma.leaveType.create({
          data: {
            ...leaveType,
            company_id: companyId,
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
  // LEAVE ENTITLEMENT METHODS
  // ==========================================

  async listLeaveEntitlements(query: LeaveEntitlementListQuery, user: AuthUser) {
    const { page = 1, limit = 50, company_id, leave_type_id, is_active } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.LeaveEntitlementWhereInput = {};

    if (company_id) {
      where.company_id = company_id;
    }

    if (leave_type_id) {
      where.leave_type_id = leave_type_id;
    }

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    const [data, total] = await Promise.all([
      prisma.leaveEntitlement.findMany({
        where,
        select: LEAVE_ENTITLEMENT_DETAIL_SELECT,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.leaveEntitlement.count({ where }),
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

  async getLeaveEntitlementById(id: number) {
    const entitlement = await prisma.leaveEntitlement.findUnique({
      where: { id },
      select: LEAVE_ENTITLEMENT_DETAIL_SELECT,
    });

    if (!entitlement) {
      throw new Error('Leave entitlement not found');
    }

    return entitlement;
  }

  async createLeaveEntitlement(data: CreateLeaveEntitlementDTO, user: AuthUser) {
    return prisma.leaveEntitlement.create({
      data,
      select: LEAVE_ENTITLEMENT_DETAIL_SELECT,
    });
  }

  async updateLeaveEntitlement(id: number, data: UpdateLeaveEntitlementDTO, user: AuthUser) {
    const existing = await prisma.leaveEntitlement.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('Leave entitlement not found');
    }

    return prisma.leaveEntitlement.update({
      where: { id },
      data,
      select: LEAVE_ENTITLEMENT_DETAIL_SELECT,
    });
  }

  async deleteLeaveEntitlement(id: number, user: AuthUser) {
    const existing = await prisma.leaveEntitlement.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('Leave entitlement not found');
    }

    return prisma.leaveEntitlement.delete({ where: { id } });
  }

  // ==========================================
  // EMPLOYEE LEAVE BALANCE METHODS
  // ==========================================

  async getEmployeeLeaveBalances(query: EmployeeLeaveBalanceQuery) {
    const { employee_id, leave_type_id, year } = query;

    const where: Prisma.EmployeeLeaveBalanceWhereInput = {};

    if (employee_id) {
      where.employee_id = employee_id;
    }

    if (leave_type_id) {
      where.leave_type_id = leave_type_id;
    }

    if (year) {
      where.year = year;
    }

    return prisma.employeeLeaveBalance.findMany({
      where,
      select: EMPLOYEE_LEAVE_BALANCE_DETAIL_SELECT,
      orderBy: [{ year: 'desc' }, { leave_type_id: 'asc' }],
    });
  }

  async getEmployeeBalanceByType(employeeId: number, leaveTypeId: number, year: number) {
    const balance = await prisma.employeeLeaveBalance.findUnique({
      where: {
        employee_id_leave_type_id_year: {
          employee_id: employeeId,
          leave_type_id: leaveTypeId,
          year: year,
        },
      },
      select: EMPLOYEE_LEAVE_BALANCE_DETAIL_SELECT,
    });

    return balance;
  }

  async createEmployeeLeaveBalance(data: CreateEmployeeLeaveBalanceDTO, user: AuthUser) {
    // Check if already exists
    const existing = await prisma.employeeLeaveBalance.findUnique({
      where: {
        employee_id_leave_type_id_year: {
          employee_id: data.employee_id,
          leave_type_id: data.leave_type_id || 0,
          year: data.year,
        },
      },
    });

    if (existing) {
      throw new Error('Leave balance already exists for this employee, leave type, and year');
    }

    // Calculate remaining days
    const remaining = (data.allocated_days || 0) +
      (data.carried_forward_days || 0) +
      (data.adjustment_days || 0);

    return prisma.employeeLeaveBalance.create({
      data: {
        ...data,
        remaining_days: remaining,
        used_days: 0,
        pending_days: 0,
      },
      select: EMPLOYEE_LEAVE_BALANCE_DETAIL_SELECT,
    });
  }

  async updateEmployeeLeaveBalance(
    employeeId: number,
    leaveTypeId: number,
    year: number,
    data: UpdateEmployeeLeaveBalanceDTO,
    user: AuthUser
  ) {
    const existing = await prisma.employeeLeaveBalance.findUnique({
      where: {
        employee_id_leave_type_id_year: {
          employee_id: employeeId,
          leave_type_id: leaveTypeId,
          year: year,
        },
      },
    });

    if (!existing) {
      throw new Error('Leave balance not found');
    }

    // Recalculate remaining if relevant fields change
    const allocated = data.allocated_days ?? Number(existing.allocated_days);
    const used = data.used_days ?? Number(existing.used_days);
    const pending = data.pending_days ?? Number(existing.pending_days);
    const carried = data.carried_forward_days ?? Number(existing.carried_forward_days);
    const adjustment = data.adjustment_days ?? Number(existing.adjustment_days);

    const remaining = allocated + carried + adjustment - used - pending;

    return prisma.employeeLeaveBalance.update({
      where: {
        employee_id_leave_type_id_year: {
          employee_id: employeeId,
          leave_type_id: leaveTypeId,
          year: year,
        },
      },
      data: {
        ...data,
        remaining_days: remaining,
      },
      select: EMPLOYEE_LEAVE_BALANCE_DETAIL_SELECT,
    });
  }

  async adjustLeaveBalance(
    employeeId: number,
    leaveTypeId: number,
    year: number,
    data: AdjustLeaveBalanceDTO,
    user: AuthUser
  ) {
    const existing = await prisma.employeeLeaveBalance.findUnique({
      where: {
        employee_id_leave_type_id_year: {
          employee_id: employeeId,
          leave_type_id: leaveTypeId,
          year: year,
        },
      },
    });

    if (!existing) {
      throw new Error('Leave balance not found');
    }

    const newAdjustment = Number(existing.adjustment_days) + data.adjustment_days;
    const newRemaining = Number(existing.remaining_days) + data.adjustment_days;

    return prisma.employeeLeaveBalance.update({
      where: {
        employee_id_leave_type_id_year: {
          employee_id: employeeId,
          leave_type_id: leaveTypeId,
          year: year,
        },
      },
      data: {
        adjustment_days: newAdjustment,
        adjustment_reason: data.adjustment_reason,
        remaining_days: newRemaining,
      },
      select: EMPLOYEE_LEAVE_BALANCE_DETAIL_SELECT,
    });
  }

  async initializeEmployeeBalances(employeeId: number, year: number, companyId: number | null, user: AuthUser) {
    // Get all active leave types for the company
    const leaveTypes = await prisma.leaveType.findMany({
      where: {
        is_active: true,
        OR: [
          { company_id: companyId },
          { company_id: null },
        ],
      },
    });

    const results = { created: 0, skipped: 0 };

    for (const leaveType of leaveTypes) {
      try {
        const existing = await prisma.employeeLeaveBalance.findUnique({
          where: {
            employee_id_leave_type_id_year: {
              employee_id: employeeId,
              leave_type_id: leaveType.id,
              year: year,
            },
          },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        await prisma.employeeLeaveBalance.create({
          data: {
            employee_id: employeeId,
            leave_type_id: leaveType.id,
            year: year,
            allocated_days: leaveType.default_days || 0,
            remaining_days: leaveType.default_days || 0,
            used_days: 0,
            pending_days: 0,
            carried_forward_days: 0,
            adjustment_days: 0,
          },
        });
        results.created++;
      } catch (error) {
        results.skipped++;
      }
    }

    return results;
  }

  async carryForwardBalances(employeeId: number, fromYear: number, toYear: number, user: AuthUser) {
    // Get balances from previous year with remaining days
    const previousBalances = await prisma.employeeLeaveBalance.findMany({
      where: {
        employee_id: employeeId,
        year: fromYear,
      },
      include: {
        leaveType: true,
      },
    });

    const results = { processed: 0, carried: 0 };

    for (const balance of previousBalances) {
      if (!balance.leaveType?.can_carry_forward) continue;

      const remaining = Number(balance.remaining_days) || 0;
      if (remaining <= 0) continue;

      const maxCarry = balance.leaveType.max_carry_forward_days || remaining;
      const carryAmount = Math.min(remaining, maxCarry);

      // Find or create next year balance
      const nextBalance = await prisma.employeeLeaveBalance.findUnique({
        where: {
          employee_id_leave_type_id_year: {
            employee_id: employeeId,
            leave_type_id: balance.leave_type_id || 0,
            year: toYear,
          },
        },
      });

      if (nextBalance) {
        // Update existing balance
        await prisma.employeeLeaveBalance.update({
          where: { id: nextBalance.id },
          data: {
            carried_forward_days: carryAmount,
            remaining_days: Number(nextBalance.remaining_days) + carryAmount,
            expires_at: balance.leaveType.carry_forward_expiry_months
              ? new Date(new Date().setMonth(new Date().getMonth() + balance.leaveType.carry_forward_expiry_months))
              : null,
          },
        });
      } else {
        // Create new balance with carry forward
        await prisma.employeeLeaveBalance.create({
          data: {
            employee_id: employeeId,
            leave_type_id: balance.leave_type_id,
            year: toYear,
            allocated_days: balance.leaveType.default_days || 0,
            remaining_days: (balance.leaveType.default_days || 0) + carryAmount,
            carried_forward_days: carryAmount,
            used_days: 0,
            pending_days: 0,
            adjustment_days: 0,
            expires_at: balance.leaveType.carry_forward_expiry_months
              ? new Date(new Date().setMonth(new Date().getMonth() + balance.leaveType.carry_forward_expiry_months))
              : null,
          },
        });
      }

      results.processed++;
      results.carried += carryAmount;
    }

    return results;
  }
}
