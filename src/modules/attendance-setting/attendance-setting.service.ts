import { PrismaClient, Prisma } from '@prisma/client';
import {
  AttendanceSettingQuery,
  SecurityRuleListQuery,
  CreateAttendanceSettingDTO,
  UpdateAttendanceSettingDTO,
  CreateSecurityRuleDTO,
  UpdateSecurityRuleDTO,
  ATTENDANCE_SETTING_SELECT,
  ATTENDANCE_SETTING_DETAIL_SELECT,
  SECURITY_RULE_SELECT,
  SECURITY_RULE_DETAIL_SELECT,
  DEFAULT_ATTENDANCE_SETTINGS,
} from './attendance-setting.types';
import { AuthUser } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class AttendanceSettingService {
  // ==========================================
  // ATTENDANCE SETTING METHODS
  // ==========================================

  async getByCompany(companyId: number) {
    const setting = await prisma.attendanceSetting.findUnique({
      where: { company_id: companyId },
      select: ATTENDANCE_SETTING_DETAIL_SELECT,
    });

    return setting;
  }

  async getOrCreate(companyId: number, user: AuthUser) {
    let setting = await prisma.attendanceSetting.findUnique({
      where: { company_id: companyId },
      select: ATTENDANCE_SETTING_DETAIL_SELECT,
    });

    if (!setting) {
      // Create with defaults
      setting = await this.create({
        company_id: companyId,
        ...this.getDefaultSettings(),
      }, user);
    }

    return setting;
  }

  async create(data: CreateAttendanceSettingDTO, user: AuthUser) {
    // Check if already exists
    const existing = await prisma.attendanceSetting.findUnique({
      where: { company_id: data.company_id },
    });

    if (existing) {
      throw new Error('Attendance setting already exists for this company');
    }

    const createData: any = { ...data };

    // Parse time strings
    if (data.work_start_time) {
      createData.work_start_time = this.parseTimeToDate(data.work_start_time);
    }
    if (data.work_end_time) {
      createData.work_end_time = this.parseTimeToDate(data.work_end_time);
    }
    if (data.break_start_time) {
      createData.break_start_time = this.parseTimeToDate(data.break_start_time);
    }
    if (data.break_end_time) {
      createData.break_end_time = this.parseTimeToDate(data.break_end_time);
    }

    return prisma.attendanceSetting.create({
      data: createData,
      select: ATTENDANCE_SETTING_DETAIL_SELECT,
    });
  }

  async update(companyId: number, data: UpdateAttendanceSettingDTO, user: AuthUser) {
    const existing = await prisma.attendanceSetting.findUnique({
      where: { company_id: companyId },
    });

    if (!existing) {
      throw new Error('Attendance setting not found for this company');
    }

    const updateData: any = { ...data };

    // Parse time strings
    if (data.work_start_time) {
      updateData.work_start_time = this.parseTimeToDate(data.work_start_time);
    }
    if (data.work_end_time) {
      updateData.work_end_time = this.parseTimeToDate(data.work_end_time);
    }
    if (data.break_start_time) {
      updateData.break_start_time = this.parseTimeToDate(data.break_start_time);
    }
    if (data.break_end_time) {
      updateData.break_end_time = this.parseTimeToDate(data.break_end_time);
    }

    return prisma.attendanceSetting.update({
      where: { company_id: companyId },
      data: updateData,
      select: ATTENDANCE_SETTING_DETAIL_SELECT,
    });
  }

  async upsert(companyId: number, data: UpdateAttendanceSettingDTO, user: AuthUser) {
    const existing = await prisma.attendanceSetting.findUnique({
      where: { company_id: companyId },
    });

    if (existing) {
      return this.update(companyId, data, user);
    } else {
      return this.create({ company_id: companyId, ...data } as CreateAttendanceSettingDTO, user);
    }
  }

  async delete(companyId: number, user: AuthUser) {
    const existing = await prisma.attendanceSetting.findUnique({
      where: { company_id: companyId },
    });

    if (!existing) {
      throw new Error('Attendance setting not found');
    }

    return prisma.attendanceSetting.delete({
      where: { company_id: companyId },
    });
  }

  async resetToDefault(companyId: number, user: AuthUser) {
    return this.upsert(companyId, this.getDefaultSettings(), user);
  }

  private getDefaultSettings(): Partial<CreateAttendanceSettingDTO> {
    return {
      work_start_time: DEFAULT_ATTENDANCE_SETTINGS.work_start_time,
      work_end_time: DEFAULT_ATTENDANCE_SETTINGS.work_end_time,
      break_start_time: DEFAULT_ATTENDANCE_SETTINGS.break_start_time,
      break_end_time: DEFAULT_ATTENDANCE_SETTINGS.break_end_time,
      working_hours_per_day: DEFAULT_ATTENDANCE_SETTINGS.working_hours_per_day,
      working_days_per_week: DEFAULT_ATTENDANCE_SETTINGS.working_days_per_week,
      working_days: DEFAULT_ATTENDANCE_SETTINGS.working_days,
      check_in_tolerance_minutes: DEFAULT_ATTENDANCE_SETTINGS.check_in_tolerance_minutes,
      check_out_tolerance_minutes: DEFAULT_ATTENDANCE_SETTINGS.check_out_tolerance_minutes,
      require_check_out: DEFAULT_ATTENDANCE_SETTINGS.require_check_out,
      allow_remote_check_in: DEFAULT_ATTENDANCE_SETTINGS.allow_remote_check_in,
      late_threshold_minutes: DEFAULT_ATTENDANCE_SETTINGS.late_threshold_minutes,
      late_affects_salary: DEFAULT_ATTENDANCE_SETTINGS.late_affects_salary,
      absent_affects_salary: DEFAULT_ATTENDANCE_SETTINGS.absent_affects_salary,
      allow_half_day_absent: DEFAULT_ATTENDANCE_SETTINGS.allow_half_day_absent,
      half_day_threshold_hours: DEFAULT_ATTENDANCE_SETTINGS.half_day_threshold_hours,
      allow_overtime: DEFAULT_ATTENDANCE_SETTINGS.allow_overtime,
      overtime_threshold_minutes: DEFAULT_ATTENDANCE_SETTINGS.overtime_threshold_minutes,
      weekday_overtime_rate: DEFAULT_ATTENDANCE_SETTINGS.weekday_overtime_rate,
      weekend_overtime_rate: DEFAULT_ATTENDANCE_SETTINGS.weekend_overtime_rate,
      holiday_overtime_rate: DEFAULT_ATTENDANCE_SETTINGS.holiday_overtime_rate,
      require_overtime_approval: DEFAULT_ATTENDANCE_SETTINGS.require_overtime_approval,
      enable_time_rounding: DEFAULT_ATTENDANCE_SETTINGS.enable_time_rounding,
      rounding_interval_minutes: DEFAULT_ATTENDANCE_SETTINGS.rounding_interval_minutes,
      rounding_method: DEFAULT_ATTENDANCE_SETTINGS.rounding_method,
      enable_location_tracking: DEFAULT_ATTENDANCE_SETTINGS.enable_location_tracking,
      location_radius_meters: DEFAULT_ATTENDANCE_SETTINGS.location_radius_meters,
      enable_geofencing: DEFAULT_ATTENDANCE_SETTINGS.enable_geofencing,
      require_photo_check_in: DEFAULT_ATTENDANCE_SETTINGS.require_photo_check_in,
      require_photo_check_out: DEFAULT_ATTENDANCE_SETTINGS.require_photo_check_out,
      track_break_time: DEFAULT_ATTENDANCE_SETTINGS.track_break_time,
      break_duration_minutes: DEFAULT_ATTENDANCE_SETTINGS.break_duration_minutes,
      attendance_affects_payroll: DEFAULT_ATTENDANCE_SETTINGS.attendance_affects_payroll,
      prorate_salary_for_partial_attendance: DEFAULT_ATTENDANCE_SETTINGS.prorate_salary_for_partial_attendance,
      notify_late_employees: DEFAULT_ATTENDANCE_SETTINGS.notify_late_employees,
      notify_absent_employees: DEFAULT_ATTENDANCE_SETTINGS.notify_absent_employees,
      notify_manager_on_late: DEFAULT_ATTENDANCE_SETTINGS.notify_manager_on_late,
      notify_hr_on_absent: DEFAULT_ATTENDANCE_SETTINGS.notify_hr_on_absent,
    };
  }

  // ==========================================
  // SECURITY RULE METHODS
  // ==========================================

  async listSecurityRules(query: SecurityRuleListQuery, user: AuthUser) {
    const { page = 1, limit = 50, company_id, type, is_active } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AttendanceSecurityRuleWhereInput = {};

    if (company_id) {
      where.company_id = company_id;
    }

    if (type) {
      where.type = type;
    }

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    const [data, total] = await Promise.all([
      prisma.attendanceSecurityRule.findMany({
        where,
        select: SECURITY_RULE_SELECT,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { name: 'asc' }],
      }),
      prisma.attendanceSecurityRule.count({ where }),
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

  async getSecurityRuleById(id: number) {
    const rule = await prisma.attendanceSecurityRule.findUnique({
      where: { id },
      select: SECURITY_RULE_DETAIL_SELECT,
    });

    if (!rule) {
      throw new Error('Security rule not found');
    }

    return rule;
  }

  async createSecurityRule(data: CreateSecurityRuleDTO, user: AuthUser) {
    return prisma.attendanceSecurityRule.create({
      data: {
        ...data,
        created_by: user.id,
      },
      select: SECURITY_RULE_DETAIL_SELECT,
    });
  }

  async updateSecurityRule(id: number, data: UpdateSecurityRuleDTO, user: AuthUser) {
    const existing = await prisma.attendanceSecurityRule.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('Security rule not found');
    }

    return prisma.attendanceSecurityRule.update({
      where: { id },
      data,
      select: SECURITY_RULE_DETAIL_SELECT,
    });
  }

  async deleteSecurityRule(id: number, user: AuthUser) {
    const existing = await prisma.attendanceSecurityRule.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('Security rule not found');
    }

    return prisma.attendanceSecurityRule.delete({ where: { id } });
  }

  async getActiveSecurityRules(companyId?: number) {
    const where: Prisma.AttendanceSecurityRuleWhereInput = {
      is_active: true,
    };

    if (companyId) {
      where.OR = [
        { company_id: companyId },
        { company_id: null }, // Global rules
      ];
    }

    return prisma.attendanceSecurityRule.findMany({
      where,
      select: SECURITY_RULE_SELECT,
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });
  }

  private parseTimeToDate(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
}
