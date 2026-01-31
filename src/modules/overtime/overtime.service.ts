import { PrismaClient, Prisma } from '@prisma/client';
import { AuthUser, ROLE_HIERARCHY } from '../../types/auth.types';
import { getHighestRoleLevel } from '../../middlewares/auth.middleware';
import {
  OvertimeListQuery,
  CreateOvertimeDTO,
  CreateOvertimeForEmployeeDTO,
  UpdateOvertimeDTO,
  ApproveOvertimeDTO,
  RejectOvertimeDTO,
  OVERTIME_LIST_SELECT,
  OVERTIME_DETAIL_SELECT,
  OVERTIME_STATUS,
  OVERTIME_TYPES,
} from './overtime.types';

const prisma = new PrismaClient();

export class OvertimeService {
  /**
   * Get paginated list of overtime requests
   */
  async list(query: OvertimeListQuery, user: AuthUser) {
    const {
      page = 1,
      limit = 10,
      employee_id,
      company_id,
      department_id,
      start_date,
      end_date,
      status,
      overtime_type,
      sort_by = 'date',
      sort_order = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.OvertimeWhereInput = {};

    // Employee filter with company scoping
    if (employee_id) {
      const employee = await prisma.employee.findUnique({
        where: { id: employee_id },
        select: { company_id: true },
      });
      if (!employee || !user.accessibleCompanyIds.includes(employee.company_id!)) {
        throw new Error('Access denied to this employee');
      }
      where.employee_id = employee_id;
    } else {
      where.employee = {
        company_id: company_id
          ? user.accessibleCompanyIds.includes(company_id)
            ? company_id
            : { in: [] }
          : { in: user.accessibleCompanyIds },
      };
    }

    // Department filter
    if (department_id) {
      where.department_id = department_id;
    }

    // Date filters
    if (start_date || end_date) {
      where.date = {};
      if (start_date) where.date.gte = new Date(start_date);
      if (end_date) where.date.lte = new Date(end_date);
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Overtime type filter
    if (overtime_type) {
      where.overtime_type = overtime_type;
    }

    // Get total count
    const total = await prisma.overtime.count({ where });

    // Get overtime records
    const overtimes = await prisma.overtime.findMany({
      where,
      select: OVERTIME_LIST_SELECT,
      skip,
      take: limit,
      orderBy: { [sort_by]: sort_order },
    });

    return {
      data: overtimes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get overtime by ID
   */
  async getById(id: number, user: AuthUser) {
    const overtime = await prisma.overtime.findUnique({
      where: { id },
      select: OVERTIME_DETAIL_SELECT,
    });

    if (!overtime) {
      throw new Error('Overtime request not found');
    }

    // Check access via employee's company
    const employee = await prisma.employee.findUnique({
      where: { id: overtime.employee.id },
      select: { company_id: true },
    });

    if (!employee || !user.accessibleCompanyIds.includes(employee.company_id!)) {
      throw new Error('Access denied to this overtime request');
    }

    return overtime;
  }

  /**
   * Create overtime request for current user
   */
  async create(data: CreateOvertimeDTO, user: AuthUser) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);

    let startTime = new Date(date);
    let endTime = new Date(date);
    let hours: number;

    // If hours is directly provided, use it
    if (data.hours && data.hours > 0) {
      hours = data.hours;
      // Set default times if not provided
      if (data.start_time) {
        const [startHour, startMin] = data.start_time.split(':').map(Number);
        startTime.setHours(startHour, startMin, 0, 0);
      }
      if (data.end_time) {
        const [endHour, endMin] = data.end_time.split(':').map(Number);
        endTime.setHours(endHour, endMin, 0, 0);
      } else {
        endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);
      }
    } else if (data.start_time && data.end_time) {
      // Parse times
      const [startHour, startMin] = data.start_time.split(':').map(Number);
      const [endHour, endMin] = data.end_time.split(':').map(Number);

      startTime.setHours(startHour, startMin, 0, 0);
      endTime.setHours(endHour, endMin, 0, 0);

      // Handle overnight overtime
      if (endTime <= startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      // Calculate hours
      hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      if (data.break_duration) {
        hours -= data.break_duration / 60;
      }
      hours = Math.round(hours * 100) / 100;
    } else {
      throw new Error('Either hours or start_time/end_time must be provided');
    }

    if (hours <= 0) {
      throw new Error('Invalid overtime duration');
    }

    // Get overtime settings
    const settings = await prisma.attendanceSetting.findUnique({
      where: { company_id: user.employee.company_id! },
    });

    // Determine overtime type if not specified
    const dayOfWeek = date.getDay();
    let overtimeType = data.overtime_type;
    if (!overtimeType) {
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        overtimeType = OVERTIME_TYPES.WEEKEND;
      } else {
        overtimeType = OVERTIME_TYPES.REGULAR;
      }
    }

    // Get rate multiplier
    let rateMultiplier = 1.5;
    if (settings) {
      switch (overtimeType) {
        case OVERTIME_TYPES.WEEKEND:
          rateMultiplier = Number(settings.weekend_overtime_rate) || 2.0;
          break;
        case OVERTIME_TYPES.HOLIDAY:
          rateMultiplier = Number(settings.holiday_overtime_rate) || 3.0;
          break;
        default:
          rateMultiplier = Number(settings.weekday_overtime_rate) || 1.5;
      }
    }

    // Get employee's hourly rate
    const employeeData = await prisma.employee.findUnique({
      where: { id: user.employee.id },
      select: { basic_salary: true },
    });

    let ratePerHour: number | undefined;
    let totalAmount: number | undefined;

    if (employeeData?.basic_salary) {
      // Assuming monthly salary / 173 hours (standard monthly working hours)
      ratePerHour = Number(employeeData.basic_salary) / 173;
      totalAmount = Math.round(hours * ratePerHour * rateMultiplier * 100) / 100;
    }

    const overtime = await prisma.overtime.create({
      data: {
        employee_id: user.employee.id,
        date,
        start_time: startTime,
        end_time: endTime,
        hours,
        break_duration: data.break_duration || 0,
        reason: data.reason,
        task_description: data.task_description,
        status: OVERTIME_STATUS.PENDING,
        overtime_type: overtimeType,
        rate_multiplier: rateMultiplier,
        rate_per_hour: ratePerHour,
        total_amount: totalAmount,
        ...(user.employee.company_id && { company_id: user.employee.company_id }),
        ...(user.employee.department_id && { department_id: user.employee.department_id }),
      },
      select: OVERTIME_DETAIL_SELECT,
    });

    return overtime;
  }

  /**
   * Create overtime for an employee (HR)
   */
  async createForEmployee(data: CreateOvertimeForEmployeeDTO, user: AuthUser) {
    const employee = await prisma.employee.findUnique({
      where: { id: data.employee_id },
      select: { id: true, company_id: true, department_id: true, basic_salary: true },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    if (!user.accessibleCompanyIds.includes(employee.company_id!)) {
      throw new Error('Access denied to create overtime for this employee');
    }

    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);

    let startTime = new Date(date);
    let endTime = new Date(date);
    let hours: number;

    // If hours is directly provided, use it
    if (data.hours && data.hours > 0) {
      hours = data.hours;
      // Set default times if not provided
      if (data.start_time) {
        const [startHour, startMin] = data.start_time.split(':').map(Number);
        startTime.setHours(startHour, startMin, 0, 0);
      }
      if (data.end_time) {
        const [endHour, endMin] = data.end_time.split(':').map(Number);
        endTime.setHours(endHour, endMin, 0, 0);
      } else {
        // Calculate end time from hours
        endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);
      }
    } else if (data.start_time && data.end_time) {
      // Calculate hours from start/end time
      const [startHour, startMin] = data.start_time.split(':').map(Number);
      const [endHour, endMin] = data.end_time.split(':').map(Number);

      startTime.setHours(startHour, startMin, 0, 0);
      endTime.setHours(endHour, endMin, 0, 0);

      if (endTime <= startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      if (data.break_duration) {
        hours -= data.break_duration / 60;
      }
      hours = Math.round(hours * 100) / 100;
    } else {
      throw new Error('Either hours or start_time/end_time must be provided');
    }

    // Get settings and calculate rates
    const settings = await prisma.attendanceSetting.findUnique({
      where: { company_id: employee.company_id! },
    });

    const dayOfWeek = date.getDay();
    let overtimeType = data.overtime_type;
    if (!overtimeType) {
      overtimeType = dayOfWeek === 0 || dayOfWeek === 6 ? OVERTIME_TYPES.WEEKEND : OVERTIME_TYPES.REGULAR;
    }

    // Use rate_multiplier from request if provided, otherwise calculate from settings
    let rateMultiplier = data.rate_multiplier || 1.5;
    if (!data.rate_multiplier && settings) {
      switch (overtimeType) {
        case OVERTIME_TYPES.WEEKEND:
          rateMultiplier = Number(settings.weekend_overtime_rate) || 2.0;
          break;
        case OVERTIME_TYPES.HOLIDAY:
          rateMultiplier = Number(settings.holiday_overtime_rate) || 3.0;
          break;
        default:
          rateMultiplier = Number(settings.weekday_overtime_rate) || 1.5;
      }
    }

    let ratePerHour: number | undefined;
    let totalAmount: number | undefined;

    if (employee.basic_salary) {
      ratePerHour = Number(employee.basic_salary) / 173;
      totalAmount = Math.round(hours * ratePerHour * rateMultiplier * 100) / 100;
    }

    const overtime = await prisma.overtime.create({
      data: {
        employee_id: data.employee_id,
        date,
        start_time: startTime,
        end_time: endTime,
        hours,
        break_duration: data.break_duration || 0,
        reason: data.reason,
        task_description: data.task_description,
        status: OVERTIME_STATUS.PENDING,
        overtime_type: overtimeType,
        rate_multiplier: rateMultiplier,
        rate_per_hour: ratePerHour,
        total_amount: totalAmount,
        ...(employee.company_id && { company_id: employee.company_id }),
        ...(employee.department_id && { department_id: employee.department_id }),
      },
      select: OVERTIME_DETAIL_SELECT,
    });

    return overtime;
  }

  /**
   * Update overtime request (only if pending)
   */
  async update(id: number, data: UpdateOvertimeDTO, user: AuthUser) {
    const existing = await prisma.overtime.findUnique({
      where: { id },
      include: { employee: { select: { id: true, company_id: true } } },
    });

    if (!existing) {
      throw new Error('Overtime request not found');
    }

    // Only owner or HR can update
    const isOwner = user.employee?.id === existing.employee.id;
    const isHR = user.roles.some((r) => ['Super Admin', 'Group CEO', 'CEO', 'HR Manager', 'HR Staff'].includes(r));

    if (!isOwner && !isHR) {
      throw new Error('Access denied to update this overtime request');
    }

    if (existing.status !== OVERTIME_STATUS.PENDING) {
      throw new Error('Can only update pending overtime requests');
    }

    const updateData: any = {};
    const date = data.date ? new Date(data.date) : existing.date;

    if (data.date) updateData.date = date;
    if (data.reason) updateData.reason = data.reason;
    if (data.task_description !== undefined) updateData.task_description = data.task_description;
    if (data.break_duration !== undefined) updateData.break_duration = data.break_duration;
    if (data.overtime_type) updateData.overtime_type = data.overtime_type;

    // Recalculate if times changed
    if (data.start_time || data.end_time) {
      const [startHour, startMin] = (data.start_time || existing.start_time!.toTimeString().slice(0, 5)).split(':').map(Number);
      const [endHour, endMin] = (data.end_time || existing.end_time!.toTimeString().slice(0, 5)).split(':').map(Number);

      const startTime = new Date(date);
      startTime.setHours(startHour, startMin, 0, 0);

      const endTime = new Date(date);
      endTime.setHours(endHour, endMin, 0, 0);

      if (endTime <= startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      updateData.start_time = startTime;
      updateData.end_time = endTime;

      let hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const breakDuration = data.break_duration ?? existing.break_duration ?? 0;
      hours -= breakDuration / 60;
      updateData.hours = Math.round(hours * 100) / 100;

      // Recalculate total amount
      if (existing.rate_per_hour) {
        updateData.total_amount = Math.round(updateData.hours * Number(existing.rate_per_hour) * Number(existing.rate_multiplier) * 100) / 100;
      }
    }

    const overtime = await prisma.overtime.update({
      where: { id },
      data: updateData,
      select: OVERTIME_DETAIL_SELECT,
    });

    return overtime;
  }

  /**
   * Cancel overtime request (only owner, only if pending)
   */
  async cancel(id: number, user: AuthUser) {
    const existing = await prisma.overtime.findUnique({
      where: { id },
      include: { employee: { select: { id: true } } },
    });

    if (!existing) {
      throw new Error('Overtime request not found');
    }

    if (user.employee?.id !== existing.employee.id) {
      throw new Error('Only the owner can cancel this request');
    }

    if (existing.status !== OVERTIME_STATUS.PENDING) {
      throw new Error('Can only cancel pending overtime requests');
    }

    const overtime = await prisma.overtime.update({
      where: { id },
      data: { status: OVERTIME_STATUS.CANCELLED },
      select: OVERTIME_DETAIL_SELECT,
    });

    return overtime;
  }

  /**
   * Approve overtime request (Manager/HR)
   */
  async approve(id: number, data: ApproveOvertimeDTO, user: AuthUser) {
    const existing = await prisma.overtime.findUnique({
      where: { id },
      include: { employee: { select: { company_id: true, overtime_approver_id: true, manager_id: true, direct_manager_id: true } } },
    });

    if (!existing) {
      throw new Error('Overtime request not found');
    }

    // Check access: HR can approve company-wide, managers can approve their reports
    const isHR = user.accessibleCompanyIds.includes(existing.employee.company_id!);
    const isOvertimeApprover = existing.employee.overtime_approver_id === user.employee?.id;
    const isManager = existing.employee.manager_id === user.employee?.id ||
                      existing.employee.direct_manager_id === user.employee?.id;

    if (!isHR && !isOvertimeApprover && !isManager) {
      throw new Error('Access denied to approve this overtime request');
    }

    if (existing.status !== OVERTIME_STATUS.PENDING) {
      throw new Error('Can only approve pending overtime requests');
    }

    const overtime = await prisma.overtime.update({
      where: { id },
      data: {
        status: OVERTIME_STATUS.APPROVED,
        approved_by: user.employee?.id || user.id,
        approved_at: new Date(),
        approval_notes: data.approval_notes,
      },
      select: OVERTIME_DETAIL_SELECT,
    });

    return overtime;
  }

  /**
   * Reject overtime request (Manager/HR)
   */
  async reject(id: number, data: RejectOvertimeDTO, user: AuthUser) {
    const existing = await prisma.overtime.findUnique({
      where: { id },
      include: { employee: { select: { company_id: true, overtime_approver_id: true, manager_id: true, direct_manager_id: true } } },
    });

    if (!existing) {
      throw new Error('Overtime request not found');
    }

    // Check access: HR can reject company-wide, managers can reject their reports
    const isHR = user.accessibleCompanyIds.includes(existing.employee.company_id!);
    const isOvertimeApprover = existing.employee.overtime_approver_id === user.employee?.id;
    const isManager = existing.employee.manager_id === user.employee?.id ||
                      existing.employee.direct_manager_id === user.employee?.id;

    if (!isHR && !isOvertimeApprover && !isManager) {
      throw new Error('Access denied to reject this overtime request');
    }

    if (existing.status !== OVERTIME_STATUS.PENDING) {
      throw new Error('Can only reject pending overtime requests');
    }

    if (!data.rejection_reason) {
      throw new Error('Rejection reason is required');
    }

    const overtime = await prisma.overtime.update({
      where: { id },
      data: {
        status: OVERTIME_STATUS.REJECTED,
        approved_by: user.employee?.id || user.id,
        approved_at: new Date(),
        rejection_reason: data.rejection_reason,
      },
      select: OVERTIME_DETAIL_SELECT,
    });

    return overtime;
  }

  /**
   * Get my overtime requests
   */
  async getMyOvertimes(query: OvertimeListQuery, user: AuthUser) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    return this.list({ ...query, employee_id: user.employee.id }, user);
  }

  /**
   * Get pending approvals for manager/HR/CEO
   */
  async getPendingApprovals(user: AuthUser) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    const roleLevel = getHighestRoleLevel(user.roles);
    const where: any = { status: OVERTIME_STATUS.PENDING };

    // Super Admin can see all
    if (user.roles.includes('Super Admin')) {
      // No filter
    }
    // Group CEO sees requests from all their accessible companies
    else if (user.roles.includes('Group CEO')) {
      if (user.accessibleCompanyIds && user.accessibleCompanyIds.length > 0) {
        where.employee = { company_id: { in: user.accessibleCompanyIds } };
      }
    }
    // CEO sees requests from their accessible companies
    else if (user.roles.includes('CEO')) {
      if (user.accessibleCompanyIds && user.accessibleCompanyIds.length > 0) {
        where.employee = { company_id: { in: user.accessibleCompanyIds } };
      } else if (user.employee.company_id) {
        where.employee = { company_id: user.employee.company_id };
      }
    }
    // HR Staff and HR Manager can see company-wide pending requests
    else if (roleLevel >= ROLE_HIERARCHY['HR Staff']) {
      if (user.employee.company_id) {
        where.employee = { company_id: user.employee.company_id };
      }
    }
    // Manager - only see their direct reports
    else if (roleLevel === ROLE_HIERARCHY['Manager']) {
      const subordinates = await prisma.employee.findMany({
        where: {
          OR: [
            { overtime_approver_id: user.employee.id },
            { manager_id: user.employee.id },
            { direct_manager_id: user.employee.id },
          ],
        },
        select: { id: true },
      });

      where.employee_id = { in: subordinates.map((s) => s.id) };
    }

    return prisma.overtime.findMany({
      where,
      select: OVERTIME_LIST_SELECT,
      orderBy: { created_at: 'asc' },
    });
  }

  /**
   * Delete overtime (HR only, any status)
   */
  async delete(id: number, user: AuthUser) {
    const overtime = await prisma.overtime.findUnique({
      where: { id },
      include: { employee: { select: { company_id: true } } },
    });

    if (!overtime) {
      throw new Error('Overtime request not found');
    }

    if (!user.accessibleCompanyIds.includes(overtime.employee.company_id!)) {
      throw new Error('Access denied to delete this overtime request');
    }

    await prisma.overtime.delete({ where: { id } });

    return { success: true };
  }
}
