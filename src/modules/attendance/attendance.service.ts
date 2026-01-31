import { PrismaClient, Prisma } from '@prisma/client';
import { AuthUser } from '../../types/auth.types';
import {
  AttendanceListQuery,
  CheckInDTO,
  CheckOutDTO,
  CreateAttendanceDTO,
  UpdateAttendanceDTO,
  AttendanceSummary,
  ATTENDANCE_LIST_SELECT,
  ATTENDANCE_DETAIL_SELECT,
  ATTENDANCE_STATUS,
} from './attendance.types';

const prisma = new PrismaClient();

export class AttendanceService {
  /**
   * Get paginated list of attendance records
   */
  async list(query: AttendanceListQuery, user: AuthUser) {
    const {
      page = 1,
      limit = 10,
      employee_id,
      company_id,
      department_id,
      date,
      start_date,
      end_date,
      status,
      sort_by = 'date',
      sort_order = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.AttendanceWhereInput = {};

    // Employee filter with company scoping
    if (employee_id) {
      // Verify access to this employee
      const employee = await prisma.employee.findUnique({
        where: { id: employee_id },
        select: { company_id: true },
      });
      if (!employee || !user.accessibleCompanyIds.includes(employee.company_id!)) {
        throw new Error('Access denied to this employee');
      }
      where.employee_id = employee_id;
    } else {
      // Filter by accessible companies
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
      where.employee = {
        ...where.employee as any,
        department_id,
      };
    }

    // Date filters
    if (date) {
      where.date = new Date(date);
    } else if (start_date || end_date) {
      where.date = {};
      if (start_date) where.date.gte = new Date(start_date);
      if (end_date) where.date.lte = new Date(end_date);
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await prisma.attendance.count({ where });

    // Get attendance records
    const attendances = await prisma.attendance.findMany({
      where,
      select: ATTENDANCE_LIST_SELECT,
      skip,
      take: limit,
      orderBy: { [sort_by]: sort_order },
    });

    return {
      data: attendances,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get attendance by ID
   */
  async getById(id: number, user: AuthUser) {
    const attendance = await prisma.attendance.findUnique({
      where: { id },
      select: ATTENDANCE_DETAIL_SELECT,
    });

    if (!attendance) {
      throw new Error('Attendance record not found');
    }

    // Check access via employee's company
    const employee = await prisma.employee.findUnique({
      where: { id: attendance.employee.id },
      select: { company_id: true },
    });

    if (!employee || !user.accessibleCompanyIds.includes(employee.company_id!)) {
      throw new Error('Access denied to this attendance record');
    }

    return attendance;
  }

  /**
   * Get today's attendance for current user
   */
  async getMyToday(user: AuthUser) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
      where: {
        employee_id: user.employee.id,
        date: today,
      },
      select: ATTENDANCE_DETAIL_SELECT,
    });

    return attendance;
  }

  /**
   * Check-in for current user
   */
  async checkIn(data: CheckInDTO, user: AuthUser, ipAddress?: string) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existing = await prisma.attendance.findFirst({
      where: {
        employee_id: user.employee.id,
        date: today,
      },
    });

    if (existing?.check_in) {
      throw new Error('Already checked in today');
    }

    const now = new Date();

    // Get attendance settings for the company
    const settings = await prisma.attendanceSetting.findUnique({
      where: { company_id: user.employee.company_id! },
    });

    // Determine status (late check)
    let status: string = ATTENDANCE_STATUS.PRESENT;
    if (settings?.work_start_time) {
      const workStart = new Date(today);
      const workStartTime = new Date(settings.work_start_time);
      workStart.setHours(workStartTime.getHours(), workStartTime.getMinutes(), 0, 0);

      const toleranceMs = (settings.check_in_tolerance_minutes || 0) * 60 * 1000;
      if (now.getTime() > workStart.getTime() + toleranceMs) {
        status = ATTENDANCE_STATUS.LATE;
      }
    }

    if (existing) {
      // Update existing record
      const attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          check_in: now,
          status,
          check_in_latitude: data.latitude,
          check_in_longitude: data.longitude,
          check_in_address: data.address,
          location_accuracy_meters: data.location_accuracy_meters,
          check_in_photo: data.photo,
          device_id: data.device_id,
          device_type: data.device_type,
          browser: data.browser,
          os: data.os,
          ip_address: ipAddress,
          notes: data.notes,
          ...(data.work_location_id && { workLocation: { connect: { id: data.work_location_id } } }),
        },
        select: ATTENDANCE_DETAIL_SELECT,
      });
      return attendance;
    }

    // Create new attendance record
    const attendance = await prisma.attendance.create({
      data: {
        employee: { connect: { id: user.employee.id } },
        date: today,
        check_in: now,
        status,
        check_in_latitude: data.latitude,
        check_in_longitude: data.longitude,
        check_in_address: data.address,
        location_accuracy_meters: data.location_accuracy_meters,
        check_in_photo: data.photo,
        device_id: data.device_id,
        device_type: data.device_type,
        browser: data.browser,
        os: data.os,
        ip_address: ipAddress,
        notes: data.notes,
        ...(data.work_location_id && { workLocation: { connect: { id: data.work_location_id } } }),
      },
      select: ATTENDANCE_DETAIL_SELECT,
    });

    return attendance;
  }

  /**
   * Check-out for current user
   */
  async checkOut(data: CheckOutDTO, user: AuthUser) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's attendance
    const attendance = await prisma.attendance.findFirst({
      where: {
        employee_id: user.employee.id,
        date: today,
      },
    });

    if (!attendance) {
      throw new Error('No check-in record found for today');
    }

    if (!attendance.check_in) {
      throw new Error('Must check-in before checking out');
    }

    if (attendance.check_out) {
      throw new Error('Already checked out today');
    }

    const now = new Date();

    // Calculate total hours
    const checkInTime = new Date(attendance.check_in);
    let totalHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

    // Subtract break time if recorded
    if (attendance.break_start && attendance.break_end) {
      const breakStart = new Date(attendance.break_start);
      const breakEnd = new Date(attendance.break_end);
      const breakHours = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
      totalHours -= breakHours;
    }

    totalHours = Math.round(totalHours * 100) / 100;

    // Calculate overtime
    let overtimeHours = 0;
    const settings = await prisma.attendanceSetting.findUnique({
      where: { company_id: user.employee.company_id! },
    });

    if (settings?.allow_overtime && settings.working_hours_per_day) {
      const standardHours = Number(settings.working_hours_per_day);
      if (totalHours > standardHours) {
        overtimeHours = Math.round((totalHours - standardHours) * 100) / 100;
      }
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        check_out: now,
        check_out_latitude: data.latitude,
        check_out_longitude: data.longitude,
        check_out_address: data.address,
        check_out_photo: data.photo,
        total_hours: totalHours,
        overtime_hours: overtimeHours > 0 ? overtimeHours : null,
        notes: data.notes ? `${attendance.notes || ''}\n${data.notes}`.trim() : attendance.notes,
      },
      select: ATTENDANCE_DETAIL_SELECT,
    });

    return updated;
  }

  /**
   * Start break for current user
   */
  async startBreak(user: AuthUser) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
      where: {
        employee_id: user.employee.id,
        date: today,
      },
    });

    if (!attendance || !attendance.check_in) {
      throw new Error('Must check-in before starting break');
    }

    if (attendance.break_start) {
      throw new Error('Break already started');
    }

    if (attendance.check_out) {
      throw new Error('Cannot start break after check-out');
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { break_start: new Date() },
      select: ATTENDANCE_DETAIL_SELECT,
    });

    return updated;
  }

  /**
   * End break for current user
   */
  async endBreak(user: AuthUser) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
      where: {
        employee_id: user.employee.id,
        date: today,
      },
    });

    if (!attendance || !attendance.break_start) {
      throw new Error('No break started');
    }

    if (attendance.break_end) {
      throw new Error('Break already ended');
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { break_end: new Date() },
      select: ATTENDANCE_DETAIL_SELECT,
    });

    return updated;
  }

  /**
   * Create manual attendance (HR only)
   */
  async create(data: CreateAttendanceDTO, user: AuthUser) {
    // Verify access to employee's company
    const employee = await prisma.employee.findUnique({
      where: { id: data.employee_id },
      select: { company_id: true },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    if (!user.accessibleCompanyIds.includes(employee.company_id!)) {
      throw new Error('Access denied to create attendance for this employee');
    }

    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);

    // Check for existing record
    const existing = await prisma.attendance.findFirst({
      where: {
        employee_id: data.employee_id,
        date,
      },
    });

    if (existing) {
      throw new Error('Attendance record already exists for this date');
    }

    // Parse times
    const parseTime = (timeStr?: string) => {
      if (!timeStr) return undefined;
      const [hours, minutes] = timeStr.split(':').map(Number);
      const dt = new Date(date);
      dt.setHours(hours, minutes, 0, 0);
      return dt;
    };

    const checkIn = parseTime(data.check_in);
    const checkOut = parseTime(data.check_out);
    const breakStart = parseTime(data.break_start);
    const breakEnd = parseTime(data.break_end);

    // Calculate total hours
    let totalHours: number | undefined;
    if (checkIn && checkOut) {
      totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      if (breakStart && breakEnd) {
        totalHours -= (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
      }
      totalHours = Math.round(totalHours * 100) / 100;
    }

    const attendance = await prisma.attendance.create({
      data: {
        employee: { connect: { id: data.employee_id } },
        date,
        check_in: checkIn,
        check_out: checkOut,
        break_start: breakStart,
        break_end: breakEnd,
        total_hours: totalHours,
        status: data.status || ATTENDANCE_STATUS.PRESENT,
        shift_type: data.shift_type,
        notes: data.notes,
        approved_by: user.id,
        approved_at: new Date(),
        ...(data.work_location_id && { workLocation: { connect: { id: data.work_location_id } } }),
      },
      select: ATTENDANCE_DETAIL_SELECT,
    });

    return attendance;
  }

  /**
   * Update attendance (HR only)
   */
  async update(id: number, data: UpdateAttendanceDTO, user: AuthUser) {
    const existing = await prisma.attendance.findUnique({
      where: { id },
      include: { employee: { select: { company_id: true } } },
    });

    if (!existing) {
      throw new Error('Attendance record not found');
    }

    if (!user.accessibleCompanyIds.includes(existing.employee.company_id!)) {
      throw new Error('Access denied to update this attendance record');
    }

    const date = existing.date;

    // Parse times
    const parseTime = (timeStr?: string) => {
      if (!timeStr) return undefined;
      const [hours, minutes] = timeStr.split(':').map(Number);
      const dt = new Date(date);
      dt.setHours(hours, minutes, 0, 0);
      return dt;
    };

    const updateData: any = {};

    if (data.check_in !== undefined) updateData.check_in = parseTime(data.check_in);
    if (data.check_out !== undefined) updateData.check_out = parseTime(data.check_out);
    if (data.break_start !== undefined) updateData.break_start = parseTime(data.break_start);
    if (data.break_end !== undefined) updateData.break_end = parseTime(data.break_end);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.shift_type !== undefined) updateData.shift_type = data.shift_type;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.approval_notes !== undefined) updateData.approval_notes = data.approval_notes;

    // Recalculate total hours if times changed
    const checkIn = updateData.check_in ?? existing.check_in;
    const checkOut = updateData.check_out ?? existing.check_out;
    const breakStart = updateData.break_start ?? existing.break_start;
    const breakEnd = updateData.break_end ?? existing.break_end;

    if (checkIn && checkOut) {
      let totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      if (breakStart && breakEnd) {
        totalHours -= (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
      }
      updateData.total_hours = Math.round(totalHours * 100) / 100;
    }

    updateData.approved_by = user.id;
    updateData.approved_at = new Date();

    const attendance = await prisma.attendance.update({
      where: { id },
      data: updateData,
      select: ATTENDANCE_DETAIL_SELECT,
    });

    return attendance;
  }

  /**
   * Delete attendance (HR only)
   */
  async delete(id: number, user: AuthUser) {
    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: { employee: { select: { company_id: true } } },
    });

    if (!attendance) {
      throw new Error('Attendance record not found');
    }

    if (!user.accessibleCompanyIds.includes(attendance.employee.company_id!)) {
      throw new Error('Access denied to delete this attendance record');
    }

    await prisma.attendance.delete({ where: { id } });

    return { success: true };
  }

  /**
   * Get my attendance history
   */
  async getMyHistory(query: AttendanceListQuery, user: AuthUser) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    return this.list({ ...query, employee_id: user.employee.id }, user);
  }

  /**
   * Get attendance summary for an employee
   */
  async getSummary(employeeId: number, startDate: string, endDate: string, user: AuthUser): Promise<AttendanceSummary> {
    // Verify access
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { company_id: true },
    });

    if (!employee || !user.accessibleCompanyIds.includes(employee.company_id!)) {
      throw new Error('Access denied to this employee');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const attendances = await prisma.attendance.findMany({
      where: {
        employee_id: employeeId,
        date: { gte: start, lte: end },
      },
      select: {
        status: true,
        total_hours: true,
        overtime_hours: true,
        check_in: true,
        check_out: true,
      },
    });

    const summary: AttendanceSummary = {
      total_days: attendances.length,
      present_days: 0,
      absent_days: 0,
      late_days: 0,
      half_days: 0,
      leave_days: 0,
      holiday_days: 0,
      wfh_days: 0,
      total_hours: 0,
      total_overtime_hours: 0,
      average_check_in: null,
      average_check_out: null,
    };

    let totalCheckInMinutes = 0;
    let checkInCount = 0;
    let totalCheckOutMinutes = 0;
    let checkOutCount = 0;

    for (const att of attendances) {
      switch (att.status) {
        case ATTENDANCE_STATUS.PRESENT:
          summary.present_days++;
          break;
        case ATTENDANCE_STATUS.ABSENT:
          summary.absent_days++;
          break;
        case ATTENDANCE_STATUS.LATE:
          summary.late_days++;
          summary.present_days++;
          break;
        case ATTENDANCE_STATUS.HALF_DAY:
          summary.half_days++;
          break;
        case ATTENDANCE_STATUS.ON_LEAVE:
          summary.leave_days++;
          break;
        case ATTENDANCE_STATUS.HOLIDAY:
          summary.holiday_days++;
          break;
        case ATTENDANCE_STATUS.WORK_FROM_HOME:
          summary.wfh_days++;
          summary.present_days++;
          break;
      }

      if (att.total_hours) {
        summary.total_hours += Number(att.total_hours);
      }
      if (att.overtime_hours) {
        summary.total_overtime_hours += Number(att.overtime_hours);
      }

      if (att.check_in) {
        const checkIn = new Date(att.check_in);
        totalCheckInMinutes += checkIn.getHours() * 60 + checkIn.getMinutes();
        checkInCount++;
      }
      if (att.check_out) {
        const checkOut = new Date(att.check_out);
        totalCheckOutMinutes += checkOut.getHours() * 60 + checkOut.getMinutes();
        checkOutCount++;
      }
    }

    summary.total_hours = Math.round(summary.total_hours * 100) / 100;
    summary.total_overtime_hours = Math.round(summary.total_overtime_hours * 100) / 100;

    if (checkInCount > 0) {
      const avgMinutes = Math.round(totalCheckInMinutes / checkInCount);
      const hours = Math.floor(avgMinutes / 60);
      const minutes = avgMinutes % 60;
      summary.average_check_in = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    if (checkOutCount > 0) {
      const avgMinutes = Math.round(totalCheckOutMinutes / checkOutCount);
      const hours = Math.floor(avgMinutes / 60);
      const minutes = avgMinutes % 60;
      summary.average_check_out = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    return summary;
  }

  /**
   * Get team attendance for a manager
   */
  async getTeamAttendance(date: string, user: AuthUser) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Get subordinates
    const subordinates = await prisma.employee.findMany({
      where: {
        OR: [
          { manager_id: user.employee.id },
          { direct_manager_id: user.employee.id },
        ],
        employment_status: 'active',
      },
      select: { id: true },
    });

    const subordinateIds = subordinates.map((s) => s.id);

    if (subordinateIds.length === 0) {
      return { data: [], summary: { total: 0, present: 0, absent: 0, late: 0, on_leave: 0 } };
    }

    const attendances = await prisma.attendance.findMany({
      where: {
        employee_id: { in: subordinateIds },
        date: targetDate,
      },
      select: ATTENDANCE_LIST_SELECT,
    });

    // Get employees without attendance record (absent)
    const presentIds = attendances.map((a) => a.employee.id);
    const absentEmployees = await prisma.employee.findMany({
      where: {
        id: { in: subordinateIds.filter((id) => !presentIds.includes(id)) },
      },
      select: {
        id: true,
        name: true,
        employee_id: true,
        department: { select: { id: true, name: true } },
      },
    });

    const summary = {
      total: subordinateIds.length,
      present: attendances.filter((a) => a.status === ATTENDANCE_STATUS.PRESENT || a.status === ATTENDANCE_STATUS.LATE).length,
      absent: absentEmployees.length,
      late: attendances.filter((a) => a.status === ATTENDANCE_STATUS.LATE).length,
      on_leave: attendances.filter((a) => a.status === ATTENDANCE_STATUS.ON_LEAVE).length,
    };

    return {
      data: attendances,
      absent_employees: absentEmployees,
      summary,
    };
  }
}
