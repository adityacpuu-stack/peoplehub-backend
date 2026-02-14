import { PrismaClient, Prisma } from '@prisma/client';
import { emailService } from '../email/email.service';
import { config } from '../../config/env';
import {
  LeaveTypeListQuery,
  LeaveListQuery,
  LeaveRequestListQuery,
  LeaveBalanceQuery,
  HolidayListQuery,
  CreateLeaveTypeDTO,
  UpdateLeaveTypeDTO,
  CreateLeaveDTO,
  CreateLeaveForEmployeeDTO,
  UpdateLeaveDTO,
  ApproveLeaveDTO,
  RejectLeaveDTO,
  CreateLeaveRequestDTO,
  AdjustLeaveBalanceDTO,
  AllocateLeaveDTO,
  CreateLeaveEntitlementDTO,
  UpdateLeaveEntitlementDTO,
  CreateHolidayDTO,
  UpdateHolidayDTO,
  LEAVE_STATUS,
  LEAVE_TYPE_SELECT,
  LEAVE_LIST_SELECT,
  LEAVE_DETAIL_SELECT,
  LEAVE_REQUEST_LIST_SELECT,
  LEAVE_BALANCE_SELECT,
  HOLIDAY_SELECT,
} from './leave.types';
import { AuthUser, hasCompanyAccess, canAccessEmployee, getHighestRoleLevel, ROLE_HIERARCHY } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class LeaveService {
  // ==========================================
  // LEAVE TYPE METHODS
  // ==========================================

  async listLeaveTypes(query: LeaveTypeListQuery, user: AuthUser) {
    const { page = 1, limit = 10, company_id, is_active, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.LeaveTypeWhereInput = {};

    if (company_id) {
      where.company_id = company_id;
    } else if (user.employee?.company_id) {
      where.OR = [
        { company_id: user.employee.company_id },
        { company_id: null }, // Global leave types
      ];
    }

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search } },
            { code: { contains: search } },
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

  async getLeaveTypeById(id: number, user: AuthUser) {
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
    if (data.company_id && !hasCompanyAccess(user, data.company_id)) {
      throw new Error('Access denied to this company');
    }

    return prisma.leaveType.create({
      data: {
        company_id: data.company_id,
        name: data.name,
        code: data.code,
        description: data.description,
        default_days: data.default_days,
        max_days_per_request: data.max_days_per_request,
        min_days_per_request: data.min_days_per_request,
        is_paid: data.is_paid ?? true,
        requires_document: data.requires_document ?? false,
        document_types: data.document_types,
        requires_approval: data.requires_approval ?? true,
        min_notice_days: data.min_notice_days,
        max_advance_days: data.max_advance_days,
        approval_flow: data.approval_flow,
        color: data.color,
        icon: data.icon,
        can_carry_forward: data.can_carry_forward ?? false,
        max_carry_forward_days: data.max_carry_forward_days,
        carry_forward_expiry_months: data.carry_forward_expiry_months,
        prorate_on_join: data.prorate_on_join ?? true,
        eligibility_rules: data.eligibility_rules,
        gender_specific: data.gender_specific,
        sort_order: data.sort_order ?? 0,
      },
      select: LEAVE_TYPE_SELECT,
    });
  }

  async updateLeaveType(id: number, data: UpdateLeaveTypeDTO, user: AuthUser) {
    const existing = await prisma.leaveType.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Leave type not found');
    }

    if (existing.company_id && !hasCompanyAccess(user, existing.company_id)) {
      throw new Error('Access denied to this leave type');
    }

    return prisma.leaveType.update({
      where: { id },
      data,
      select: LEAVE_TYPE_SELECT,
    });
  }

  async deleteLeaveType(id: number, user: AuthUser) {
    const existing = await prisma.leaveType.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Leave type not found');
    }

    if (existing.company_id && !hasCompanyAccess(user, existing.company_id)) {
      throw new Error('Access denied to this leave type');
    }

    // Soft delete by setting is_active to false
    return prisma.leaveType.update({
      where: { id },
      data: { is_active: false },
    });
  }

  // ==========================================
  // LEAVE METHODS
  // ==========================================

  async listLeaves(query: LeaveListQuery, user: AuthUser) {
    const {
      page = 1,
      limit = 10,
      employee_id,
      company_id,
      department_id,
      leave_type_id,
      status,
      start_date,
      end_date,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.LeaveWhereInput = {
      deleted_at: null,
    };

    if (employee_id) {
      where.employee_id = employee_id;
    }

    if (company_id) {
      where.employee = { company_id };
    } else if (user.employee?.company_id && getHighestRoleLevel(user.roles) < ROLE_HIERARCHY['CEO']) {
      // Non-CEO/GroupCEO can only see their company
      where.employee = { company_id: user.employee.company_id };
    }

    if (department_id) {
      where.employee = { ...where.employee as object, department_id };
    }

    if (leave_type_id) {
      where.leave_type_id = leave_type_id;
    }

    if (status) {
      where.status = status;
    }

    if (start_date) {
      where.start_date = { gte: new Date(start_date) };
    }

    if (end_date) {
      where.end_date = { lte: new Date(end_date) };
    }

    const orderBy: Prisma.LeaveOrderByWithRelationInput = {};
    if (sort_by === 'employee_name') {
      orderBy.employee = { name: sort_order };
    } else {
      (orderBy as any)[sort_by] = sort_order;
    }

    const [data, total] = await Promise.all([
      prisma.leave.findMany({
        where,
        select: LEAVE_LIST_SELECT,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.leave.count({ where }),
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

  async getLeaveById(id: number, user: AuthUser) {
    const leave = await prisma.leave.findFirst({
      where: { id, deleted_at: null },
      select: LEAVE_DETAIL_SELECT,
    });

    if (!leave) {
      throw new Error('Leave not found');
    }

    // Check access
    if (!await canAccessEmployee(user, leave.employee_id)) {
      throw new Error('Access denied');
    }

    return leave;
  }

  async getMyLeaves(query: LeaveListQuery, user: AuthUser) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    return this.listLeaves(
      { ...query, employee_id: user.employee.id },
      user
    );
  }

  async create(data: CreateLeaveDTO, user: AuthUser) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    return this.createLeaveForEmployee(
      { ...data, employee_id: user.employee.id },
      user
    );
  }

  async createLeaveForEmployee(data: CreateLeaveForEmployeeDTO, user: AuthUser) {
    // Verify employee access
    const employee = await prisma.employee.findUnique({
      where: { id: data.employee_id },
      select: { id: true, company_id: true, name: true },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    if (!await canAccessEmployee(user, data.employee_id)) {
      throw new Error('Access denied to this employee');
    }

    // Calculate total days (excluding weekends and holidays)
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    let totalDays = await this.calculateLeaveDaysWithHolidays(
      startDate,
      endDate,
      employee.company_id ?? undefined,
      data.start_half_day,
      data.end_half_day
    );

    if (totalDays <= 0) {
      throw new Error('Tanggal yang dipilih jatuh pada hari libur atau weekend. Tidak ada hari kerja yang dihitung.');
    }

    // Validate leave type if provided
    let leaveType = null;
    if (data.leave_type_id) {
      leaveType = await prisma.leaveType.findUnique({
        where: { id: data.leave_type_id },
      });

      if (!leaveType) {
        throw new Error('Leave type not found');
      }

      // Validate max days per request
      if (leaveType.max_days_per_request && totalDays > leaveType.max_days_per_request) {
        throw new Error(`Maximum ${leaveType.max_days_per_request} days allowed per request`);
      }

      // Validate min days per request
      const minDays = leaveType.min_days_per_request?.toNumber() ?? 0.5;
      if (totalDays < minDays) {
        throw new Error(`Minimum ${minDays} days required per request`);
      }

      // Check leave balance
      const currentYear = new Date().getFullYear();
      const balance = await prisma.employeeLeaveBalance.findUnique({
        where: {
          employee_id_leave_type_id_year: {
            employee_id: data.employee_id,
            leave_type_id: data.leave_type_id,
            year: currentYear,
          },
        },
      });

      if (balance) {
        const available = (balance.remaining_days?.toNumber() ?? 0) - (balance.pending_days?.toNumber() ?? 0);
        if (totalDays > available) {
          throw new Error(`Insufficient leave balance. Available: ${available} days`);
        }
      }
    }

    // Create leave
    const leave = await prisma.leave.create({
      data: {
        employee_id: data.employee_id,
        leave_type_id: data.leave_type_id,
        start_date: startDate,
        end_date: endDate,
        start_half_day: data.start_half_day ?? false,
        end_half_day: data.end_half_day ?? false,
        total_days: totalDays,
        reason: data.reason,
        is_emergency: data.is_emergency ?? false,
        contact_during_leave: data.contact_during_leave,
        work_handover: data.work_handover,
        status: LEAVE_STATUS.PENDING,
      },
      select: LEAVE_DETAIL_SELECT,
    });

    // Update pending days in balance
    if (data.leave_type_id) {
      const currentYear = new Date().getFullYear();
      await prisma.employeeLeaveBalance.upsert({
        where: {
          employee_id_leave_type_id_year: {
            employee_id: data.employee_id,
            leave_type_id: data.leave_type_id,
            year: currentYear,
          },
        },
        update: {
          pending_days: { increment: totalDays },
        },
        create: {
          employee_id: data.employee_id,
          leave_type_id: data.leave_type_id,
          year: currentYear,
          allocated_days: leaveType?.default_days ?? 0,
          pending_days: totalDays,
          remaining_days: (leaveType?.default_days ?? 0) - totalDays,
        },
      });
    }

    // Send email notification to approver
    this.sendLeaveRequestEmailToApprover(leave, employee.name, leaveType?.name || 'Cuti')
      .catch((err) => console.error('Failed to send leave request email:', err));

    return leave;
  }

  /**
   * Send leave request email to approver
   */
  private async sendLeaveRequestEmailToApprover(
    leave: any,
    employeeName: string,
    leaveTypeName: string
  ): Promise<void> {
    // Find the employee's leave approver or manager
    const employee = await prisma.employee.findUnique({
      where: { id: leave.employee_id },
      select: {
        leave_approver_id: true,
        manager_id: true,
        leaveApprover: {
          select: {
            id: true,
            name: true,
            user: { select: { email: true } },
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!employee) return;

    // Use leave approver if set, otherwise fall back to manager
    const approver = employee.leaveApprover || employee.manager;
    if (!approver || !approver.user?.email) return;

    const startDate = new Date(leave.start_date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const endDate = new Date(leave.end_date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Fire and forget - don't wait for SMTP
    emailService.sendLeaveRequestEmail(approver.user.email, {
      employeeName,
      leaveType: leaveTypeName,
      startDate,
      endDate,
      totalDays: leave.total_days?.toNumber() || 0,
      reason: leave.reason || undefined,
      approverName: approver.name,
      approvalUrl: `${config.app.url}/leave-approval`,
    }).catch(err => console.error('Failed to send leave request email:', err));
  }

  async update(id: number, data: UpdateLeaveDTO, user: AuthUser) {
    const existing = await prisma.leave.findFirst({
      where: { id, deleted_at: null },
      include: { employee: { select: { company_id: true } } },
    });

    if (!existing) {
      throw new Error('Leave not found');
    }

    // Check if user owns this leave or is HR
    const isOwner = user.employee?.id === existing.employee_id;
    const isHR = getHighestRoleLevel(user.roles) >= ROLE_HIERARCHY['HR Staff'];

    if (!isOwner && !isHR) {
      throw new Error('Access denied');
    }

    // Can only update pending leaves
    if (existing.status !== LEAVE_STATUS.PENDING) {
      throw new Error('Can only update pending leave requests');
    }

    // Recalculate total days if dates changed (excluding weekends and holidays)
    let totalDays: number | null = existing.total_days ? Number(existing.total_days) : null;
    if (data.start_date || data.end_date) {
      const startDate = new Date(data.start_date ?? existing.start_date);
      const endDate = new Date(data.end_date ?? existing.end_date);
      totalDays = await this.calculateLeaveDaysWithHolidays(
        startDate,
        endDate,
        existing.employee?.company_id ?? undefined,
        data.start_half_day ?? existing.start_half_day ?? false,
        data.end_half_day ?? existing.end_half_day ?? false
      );
    }

    return prisma.leave.update({
      where: { id },
      data: {
        ...data,
        start_date: data.start_date ? new Date(data.start_date) : undefined,
        end_date: data.end_date ? new Date(data.end_date) : undefined,
        total_days: totalDays,
      },
      select: LEAVE_DETAIL_SELECT,
    });
  }

  async cancel(id: number, user: AuthUser) {
    const existing = await prisma.leave.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new Error('Leave not found');
    }

    // Only owner can cancel
    if (user.employee?.id !== existing.employee_id) {
      throw new Error('Only the owner can cancel this leave request');
    }

    // Can only cancel pending leaves
    if (existing.status !== LEAVE_STATUS.PENDING) {
      throw new Error('Can only cancel pending leave requests');
    }

    // Update balance
    if (existing.leave_type_id && existing.total_days) {
      const currentYear = new Date().getFullYear();
      await prisma.employeeLeaveBalance.update({
        where: {
          employee_id_leave_type_id_year: {
            employee_id: existing.employee_id,
            leave_type_id: existing.leave_type_id,
            year: currentYear,
          },
        },
        data: {
          pending_days: { decrement: existing.total_days.toNumber() },
        },
      });
    }

    return prisma.leave.update({
      where: { id },
      data: {
        status: LEAVE_STATUS.CANCELLED,
        cancelled_at: new Date(),
      },
      select: LEAVE_DETAIL_SELECT,
    });
  }

  async approve(id: number, data: ApproveLeaveDTO, user: AuthUser) {
    const existing = await prisma.leave.findFirst({
      where: { id, deleted_at: null },
      include: { employee: true },
    });

    if (!existing) {
      throw new Error('Leave not found');
    }

    // Check if user can approve (manager or HR)
    const canApprove = await this.canApproveLeave(user, existing.employee_id);
    if (!canApprove) {
      throw new Error('Access denied. Cannot approve this leave request');
    }

    if (existing.status !== LEAVE_STATUS.PENDING) {
      throw new Error('Can only approve pending leave requests');
    }

    // Update balance - move from pending to used
    if (existing.leave_type_id && existing.total_days) {
      const currentYear = new Date().getFullYear();
      await prisma.employeeLeaveBalance.update({
        where: {
          employee_id_leave_type_id_year: {
            employee_id: existing.employee_id,
            leave_type_id: existing.leave_type_id,
            year: currentYear,
          },
        },
        data: {
          pending_days: { decrement: existing.total_days.toNumber() },
          used_days: { increment: existing.total_days.toNumber() },
          remaining_days: { decrement: existing.total_days.toNumber() },
        },
      });
    }

    const approvedLeave = await prisma.leave.update({
      where: { id },
      data: {
        status: LEAVE_STATUS.APPROVED,
        approved_by: user.employee?.id,
        approved_at: new Date(),
        approval_notes: data.approval_notes,
      },
      select: {
        ...LEAVE_DETAIL_SELECT,
        employee: {
          select: {
            name: true,
            user: { select: { email: true } },
          },
        },
        leaveType: { select: { name: true } },
      },
    });

    // Send approval email to employee
    this.sendLeaveStatusEmail(approvedLeave, user.employee?.name || 'Approver', 'approved')
      .catch((err) => console.error('Failed to send leave approval email:', err));

    return approvedLeave;
  }

  async reject(id: number, data: RejectLeaveDTO, user: AuthUser) {
    const existing = await prisma.leave.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new Error('Leave not found');
    }

    const canApprove = await this.canApproveLeave(user, existing.employee_id);
    if (!canApprove) {
      throw new Error('Access denied. Cannot reject this leave request');
    }

    if (existing.status !== LEAVE_STATUS.PENDING) {
      throw new Error('Can only reject pending leave requests');
    }

    // Restore balance
    if (existing.leave_type_id && existing.total_days) {
      const currentYear = new Date().getFullYear();
      await prisma.employeeLeaveBalance.update({
        where: {
          employee_id_leave_type_id_year: {
            employee_id: existing.employee_id,
            leave_type_id: existing.leave_type_id,
            year: currentYear,
          },
        },
        data: {
          pending_days: { decrement: existing.total_days.toNumber() },
        },
      });
    }

    const rejectedLeave = await prisma.leave.update({
      where: { id },
      data: {
        status: LEAVE_STATUS.REJECTED,
        rejected_by: user.employee?.id,
        rejected_at: new Date(),
        rejection_reason: data.rejection_reason,
      },
      select: {
        ...LEAVE_DETAIL_SELECT,
        employee: {
          select: {
            name: true,
            user: { select: { email: true } },
          },
        },
        leaveType: { select: { name: true } },
      },
    });

    // Send rejection email to employee
    this.sendLeaveStatusEmail(rejectedLeave, user.employee?.name || 'Approver', 'rejected', data.rejection_reason)
      .catch((err) => console.error('Failed to send leave rejection email:', err));

    return rejectedLeave;
  }

  /**
   * Send leave approval/rejection email to employee
   */
  private async sendLeaveStatusEmail(
    leave: any,
    approverName: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string
  ): Promise<void> {
    const employeeEmail = leave.employee?.user?.email;
    if (!employeeEmail) return;

    const startDate = new Date(leave.start_date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const endDate = new Date(leave.end_date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Fire and forget - don't wait for SMTP
    emailService.sendLeaveApprovalEmail(employeeEmail, {
      employeeName: leave.employee?.name || 'Karyawan',
      leaveType: leave.leaveType?.name || 'Cuti',
      startDate,
      endDate,
      totalDays: leave.total_days?.toNumber() || 0,
      status,
      approverName,
      rejectionReason,
    }).catch(err => console.error('Failed to send leave approval email:', err));
  }

  async getPendingApprovals(user: AuthUser) {
    return this.getTeamLeaves(user, 'pending');
  }

  async getTeamLeaves(user: AuthUser, status?: string) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    const where: Prisma.LeaveWhereInput = {
      deleted_at: null,
    };

    // Filter by status
    if (status && status !== 'all') {
      where.status = status;
    }

    // Check role level to determine what leaves to show
    const roleLevel = getHighestRoleLevel(user.roles);

    // Super Admin sees all
    if (user.roles.includes('Super Admin')) {
      // No filter, see all
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
    // HR Manager/Staff sees company-wide
    else if (roleLevel >= ROLE_HIERARCHY['HR Staff']) {
      if (user.employee.company_id) {
        where.employee = { company_id: user.employee.company_id };
      }
    }
    // Manager can see their direct reports
    else if (roleLevel === ROLE_HIERARCHY['Manager']) {
      where.employee = {
        OR: [
          { leave_approver_id: user.employee.id },
          { manager_id: user.employee.id },
          { direct_manager_id: user.employee.id },
        ],
      };
    }

    return prisma.leave.findMany({
      where,
      select: LEAVE_DETAIL_SELECT,
      orderBy: { created_at: 'desc' },
    });
  }

  async delete(id: number, user: AuthUser) {
    const existing = await prisma.leave.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new Error('Leave not found');
    }

    if (!await canAccessEmployee(user, existing.employee_id)) {
      throw new Error('Access denied');
    }

    return prisma.leave.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  // ==========================================
  // LEAVE BALANCE METHODS
  // ==========================================

  async getLeaveBalances(query: LeaveBalanceQuery, user: AuthUser) {
    const { employee_id, company_id, department_id, year, leave_type_id } = query;
    const currentYear = year ?? new Date().getFullYear();

    const where: Prisma.EmployeeLeaveBalanceWhereInput = {
      year: currentYear,
      // Only show balances for active employees
      employee: {
        employment_status: 'active',
        deleted_at: null,
      },
    };

    if (employee_id) {
      where.employee_id = employee_id;
    }

    if (company_id) {
      where.employee = { ...where.employee as object, company_id };
    } else if (user.accessibleCompanyIds && user.accessibleCompanyIds.length > 0 && getHighestRoleLevel(user.roles) < ROLE_HIERARCHY['CEO']) {
      // Use accessibleCompanyIds to allow HR to see all accessible companies
      where.employee = { ...where.employee as object, company_id: { in: user.accessibleCompanyIds } };
    }

    if (department_id) {
      where.employee = { ...where.employee as object, department_id };
    }

    if (leave_type_id) {
      where.leave_type_id = leave_type_id;
    }

    return prisma.employeeLeaveBalance.findMany({
      where,
      select: LEAVE_BALANCE_SELECT,
      orderBy: [
        { employee: { name: 'asc' } },
        { leaveType: { name: 'asc' } },
      ],
    });
  }

  async getMyLeaveBalances(user: AuthUser) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    const currentYear = new Date().getFullYear();

    return prisma.employeeLeaveBalance.findMany({
      where: {
        employee_id: user.employee.id,
        year: currentYear,
      },
      select: LEAVE_BALANCE_SELECT,
      orderBy: { leaveType: { name: 'asc' } },
    });
  }

  async adjustLeaveBalance(data: AdjustLeaveBalanceDTO, user: AuthUser) {
    if (!await canAccessEmployee(user, data.employee_id)) {
      throw new Error('Access denied to this employee');
    }

    const balance = await prisma.employeeLeaveBalance.findUnique({
      where: {
        employee_id_leave_type_id_year: {
          employee_id: data.employee_id,
          leave_type_id: data.leave_type_id,
          year: data.year,
        },
      },
    });

    if (!balance) {
      throw new Error('Leave balance record not found');
    }

    const newRemaining = (balance.remaining_days?.toNumber() ?? 0) + data.adjustment_days;

    return prisma.employeeLeaveBalance.update({
      where: {
        employee_id_leave_type_id_year: {
          employee_id: data.employee_id,
          leave_type_id: data.leave_type_id,
          year: data.year,
        },
      },
      data: {
        adjustment_days: { increment: data.adjustment_days },
        adjustment_reason: data.adjustment_reason,
        remaining_days: newRemaining,
      },
      select: LEAVE_BALANCE_SELECT,
    });
  }

  async allocateLeave(data: AllocateLeaveDTO, user: AuthUser) {
    if (!await canAccessEmployee(user, data.employee_id)) {
      throw new Error('Access denied to this employee');
    }

    return prisma.employeeLeaveBalance.upsert({
      where: {
        employee_id_leave_type_id_year: {
          employee_id: data.employee_id,
          leave_type_id: data.leave_type_id,
          year: data.year,
        },
      },
      update: {
        allocated_days: data.allocated_days,
        carried_forward_days: data.carried_forward_days ?? 0,
        remaining_days: data.allocated_days + (data.carried_forward_days ?? 0),
        expires_at: data.expires_at ? new Date(data.expires_at) : null,
      },
      create: {
        employee_id: data.employee_id,
        leave_type_id: data.leave_type_id,
        year: data.year,
        allocated_days: data.allocated_days,
        carried_forward_days: data.carried_forward_days ?? 0,
        remaining_days: data.allocated_days + (data.carried_forward_days ?? 0),
        expires_at: data.expires_at ? new Date(data.expires_at) : null,
      },
      select: LEAVE_BALANCE_SELECT,
    });
  }

  // ==========================================
  // HOLIDAY METHODS
  // ==========================================

  async listHolidays(query: HolidayListQuery, user: AuthUser) {
    const { page = 1, limit = 10, company_id, year, type, is_active } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.HolidayWhereInput = {
      deleted_at: null,
    };

    if (company_id) {
      where.OR = [
        { company_id },
        { company_id: null }, // Global holidays
      ];
    } else if (user.employee?.company_id) {
      where.OR = [
        { company_id: user.employee.company_id },
        { company_id: null },
      ];
    }

    if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31);
      where.date = {
        gte: startOfYear,
        lte: endOfYear,
      };
    }

    if (type) {
      where.type = type;
    }

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    const [data, total] = await Promise.all([
      prisma.holiday.findMany({
        where,
        select: HOLIDAY_SELECT,
        skip,
        take: limit,
        orderBy: { date: 'asc' },
      }),
      prisma.holiday.count({ where }),
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

  async getHolidayById(id: number, user: AuthUser) {
    const holiday = await prisma.holiday.findFirst({
      where: { id, deleted_at: null },
      select: HOLIDAY_SELECT,
    });

    if (!holiday) {
      throw new Error('Holiday not found');
    }

    return holiday;
  }

  async createHoliday(data: CreateHolidayDTO, user: AuthUser) {
    if (data.company_id && !hasCompanyAccess(user, data.company_id)) {
      throw new Error('Access denied to this company');
    }

    return prisma.holiday.create({
      data: {
        company_id: data.company_id,
        name: data.name,
        date: new Date(data.date),
        type: data.type,
        description: data.description,
        is_recurring: data.is_recurring ?? false,
        created_by: user.id,
      },
      select: HOLIDAY_SELECT,
    });
  }

  async updateHoliday(id: number, data: UpdateHolidayDTO, user: AuthUser) {
    const existing = await prisma.holiday.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new Error('Holiday not found');
    }

    if (existing.company_id && !hasCompanyAccess(user, existing.company_id)) {
      throw new Error('Access denied to this holiday');
    }

    return prisma.holiday.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
      select: HOLIDAY_SELECT,
    });
  }

  async deleteHoliday(id: number, user: AuthUser) {
    const existing = await prisma.holiday.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new Error('Holiday not found');
    }

    if (existing.company_id && !hasCompanyAccess(user, existing.company_id)) {
      throw new Error('Access denied to this holiday');
    }

    return prisma.holiday.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async isHoliday(date: Date, companyId?: number): Promise<boolean> {
    const where: Prisma.HolidayWhereInput = {
      date,
      is_active: true,
      deleted_at: null,
    };

    if (companyId) {
      where.OR = [
        { company_id: companyId },
        { company_id: null },
      ];
    }

    const holiday = await prisma.holiday.findFirst({ where });
    return !!holiday;
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  private async calculateLeaveDaysWithHolidays(
    startDate: Date,
    endDate: Date,
    companyId?: number,
    startHalfDay: boolean = false,
    endHalfDay: boolean = false
  ): Promise<number> {
    // Get holidays in the date range
    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        is_active: true,
        deleted_at: null,
        OR: companyId
          ? [{ company_id: companyId }, { company_id: null }]
          : [{ company_id: null }],
      },
      select: { date: true },
    });

    // Create a set of holiday dates for quick lookup
    const holidayDates = new Set(
      holidays.map(h => h.date.toISOString().split('T')[0])
    );

    let days = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      const dateStr = current.toISOString().split('T')[0];

      // Skip weekends (0 = Sunday, 6 = Saturday) and holidays
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateStr)) {
        days += 1;
      }
      current.setDate(current.getDate() + 1);
    }

    // Adjust for half days
    if (startHalfDay && days > 0) {
      days -= 0.5;
    }
    if (endHalfDay && days > 0) {
      days -= 0.5;
    }

    return days;
  }

  // Synchronous version for backwards compatibility (without holiday check)
  private calculateLeaveDays(
    startDate: Date,
    endDate: Date,
    startHalfDay: boolean = false,
    endHalfDay: boolean = false
  ): number {
    let days = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days += 1;
      }
      current.setDate(current.getDate() + 1);
    }

    // Adjust for half days
    if (startHalfDay && days > 0) {
      days -= 0.5;
    }
    if (endHalfDay && days > 0) {
      days -= 0.5;
    }

    return days;
  }

  private async canApproveLeave(user: AuthUser, employeeId: number): Promise<boolean> {
    if (!user.employee) return false;

    const roleLevel = getHighestRoleLevel(user.roles);

    // HR can approve all
    if (roleLevel >= ROLE_HIERARCHY['HR Staff']) {
      return true;
    }

    // Manager can approve their reports
    if (roleLevel === ROLE_HIERARCHY['Manager']) {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { manager_id: true, direct_manager_id: true, leave_approver_id: true },
      });

      // Check leave_approver_id first (if set), then fallback to manager_id
      if (employee?.leave_approver_id) {
        return employee.leave_approver_id === user.employee.id;
      }

      return employee?.manager_id === user.employee.id ||
             employee?.direct_manager_id === user.employee.id;
    }

    return false;
  }
}
