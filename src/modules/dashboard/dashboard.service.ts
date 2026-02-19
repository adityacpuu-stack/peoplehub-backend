import { PrismaClient } from '@prisma/client';
import { AuthUser } from '../../middlewares/auth.middleware';
import {
  DashboardOverview,
  EmployeeSummary,
  AttendanceSummary,
  LeaveSummary,
  PayrollSummary,
  PerformanceSummary,
  DashboardAlert,
  CalendarEvent,
  QuickStats,
  TeamDashboard,
  MyDashboard,
  GroupDashboard,
  CompanyOverview,
  GroupActivity,
} from './dashboard.types';

const prisma = new PrismaClient();

// Hidden system accounts (Super Admin, etc.) - excluded from all listings
const HIDDEN_EMPLOYEE_IDS = ['EMP-001', 'PFI-PDR-HRSTAFF'];

export class DashboardService {
  // ==========================================
  // MAIN DASHBOARD
  // ==========================================

  async getOverview(user: AuthUser): Promise<DashboardOverview> {
    const companyFilter = this.getCompanyFilter(user);

    const [employee, attendance, leave, payroll, performance, alerts] = await Promise.all([
      this.getEmployeeSummary(companyFilter),
      this.getAttendanceSummary(companyFilter),
      this.getLeaveSummary(companyFilter),
      this.getPayrollSummary(companyFilter),
      this.getPerformanceSummary(companyFilter),
      this.getAlerts(user),
    ]);

    return { employee, attendance, leave, payroll, performance, alerts };
  }

  // ==========================================
  // EMPLOYEE SUMMARY
  // ==========================================

  async getEmployeeSummary(companyFilter: any): Promise<EmployeeSummary> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [total, active, inactive, newThisMonth, byDepartment, byType, byGender] = await Promise.all([
      prisma.employee.count({ where: companyFilter }),
      prisma.employee.count({ where: { ...companyFilter, employment_status: 'active' } }),
      prisma.employee.count({ where: { ...companyFilter, employment_status: { not: 'active' } } }),
      prisma.employee.count({
        where: { ...companyFilter, join_date: { gte: startOfMonth } },
      }),
      prisma.employee.groupBy({
        by: ['department_id'],
        where: { ...companyFilter, employment_status: 'active' },
        _count: true,
      }),
      prisma.employee.groupBy({
        by: ['employment_type'],
        where: { ...companyFilter, employment_status: 'active' },
        _count: true,
      }),
      prisma.employee.groupBy({
        by: ['gender'],
        where: { ...companyFilter, employment_status: 'active', gender: { not: null } },
        _count: true,
      }),
    ]);

    // Get department names
    const departmentIds = byDepartment.map((d) => d.department_id).filter(Boolean) as number[];
    const departments = await prisma.department.findMany({
      where: { id: { in: departmentIds } },
      select: { id: true, name: true },
    });
    const deptMap = new Map(departments.map((d) => [d.id, d.name]));

    return {
      total,
      active,
      inactive,
      new_this_month: newThisMonth,
      by_department: byDepartment.map((d) => ({
        department: deptMap.get(d.department_id!) || 'Unassigned',
        count: d._count,
      })),
      by_employment_type: byType.map((t) => ({
        type: t.employment_type || 'Unknown',
        count: t._count,
      })),
      gender_distribution: byGender.map((g) => ({
        gender: g.gender || 'Unknown',
        count: g._count,
      })),
    };
  }

  // ==========================================
  // ATTENDANCE SUMMARY
  // ==========================================

  async getAttendanceSummary(companyFilter: any): Promise<AttendanceSummary> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const activeEmployees = await prisma.employee.count({
      where: { ...companyFilter, employment_status: 'active' },
    });

    const [todayAttendance, onLeaveToday, lateThisWeek] = await Promise.all([
      prisma.attendance.findMany({
        where: {
          employee: companyFilter,
          date: { gte: today, lt: tomorrow },
        },
      }),
      prisma.leaveRequest.count({
        where: {
          employee: companyFilter,
          status: 'approved',
          start_date: { lte: today },
          end_date: { gte: today },
        },
      }),
      prisma.attendance.count({
        where: {
          employee: companyFilter,
          date: { gte: startOfWeek },
          status: 'late',
        },
      }),
    ]);

    const checkedIn = todayAttendance.filter((a) => a.check_in).length;
    const checkedOut = todayAttendance.filter((a) => a.check_out).length;
    const late = todayAttendance.filter((a) => a.status === 'late').length;

    return {
      today: {
        total_expected: activeEmployees,
        checked_in: checkedIn,
        checked_out: checkedOut,
        late,
        absent: activeEmployees - checkedIn - onLeaveToday,
        on_leave: onLeaveToday,
      },
      this_week: {
        avg_check_in_time: null,
        avg_work_hours: null,
        late_count: lateThisWeek,
        absent_count: 0,
      },
      this_month: {
        total_work_days: this.getWorkDaysInMonth(today),
        avg_attendance_rate: activeEmployees > 0 ? (checkedIn / activeEmployees) * 100 : 0,
      },
    };
  }

  // ==========================================
  // LEAVE SUMMARY
  // ==========================================

  async getLeaveSummary(companyFilter: any): Promise<LeaveSummary> {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const [pending, approvedThisMonth, rejectedThisMonth, onLeaveToday, upcoming, byType] = await Promise.all([
      prisma.leaveRequest.count({
        where: { employee: companyFilter, status: 'pending' },
      }),
      prisma.leaveRequest.count({
        where: {
          employee: companyFilter,
          status: 'approved',
          updated_at: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      prisma.leaveRequest.count({
        where: {
          employee: companyFilter,
          status: 'rejected',
          updated_at: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      prisma.leaveRequest.count({
        where: {
          employee: companyFilter,
          status: 'approved',
          start_date: { lte: today },
          end_date: { gte: today },
        },
      }),
      prisma.leaveRequest.findMany({
        where: {
          employee: companyFilter,
          status: 'approved',
          start_date: { gte: today, lte: nextWeek },
        },
        include: {
          employee: { select: { name: true } },
          leaveType: { select: { name: true } },
        },
        take: 5,
        orderBy: { start_date: 'asc' },
      }),
      prisma.leaveRequest.groupBy({
        by: ['leave_type_id'],
        where: {
          employee: companyFilter,
          status: 'approved',
          created_at: { gte: startOfMonth },
        },
        _count: true,
      }),
    ]);

    // Get leave type names
    const leaveTypeIds = byType.map((t) => t.leave_type_id).filter(Boolean) as number[];
    const leaveTypes = await prisma.leaveType.findMany({
      where: { id: { in: leaveTypeIds } },
      select: { id: true, name: true },
    });
    const typeMap = new Map(leaveTypes.map((t) => [t.id, t.name]));

    return {
      pending_requests: pending,
      approved_this_month: approvedThisMonth,
      rejected_this_month: rejectedThisMonth,
      on_leave_today: onLeaveToday,
      upcoming_leaves: upcoming.map((l) => ({
        employee_name: l.employee.name,
        leave_type: l.leaveType?.name || 'Unknown',
        start_date: l.start_date.toISOString().split('T')[0],
        end_date: l.end_date.toISOString().split('T')[0],
      })),
      by_type: byType.map((t) => ({
        type: typeMap.get(t.leave_type_id!) || 'Unknown',
        count: t._count,
      })),
    };
  }

  // ==========================================
  // PAYROLL SUMMARY
  // ==========================================

  async getPayrollSummary(companyFilter: any): Promise<PayrollSummary> {
    const currentMonth = new Date();
    const period = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

    const [pendingAdjustments, pendingOvertime, payrollStats] = await Promise.all([
      prisma.payrollAdjustment.count({
        where: { employee: companyFilter, status: 'pending' },
      }),
      prisma.overtime.count({
        where: { employee: companyFilter, status: 'pending' },
      }),
      prisma.payroll.aggregate({
        where: { employee: companyFilter, period },
        _count: true,
        _sum: {
          gross_salary: true,
          total_deductions: true,
          net_salary: true,
        },
      }),
    ]);

    return {
      current_period: payrollStats._count > 0
        ? {
            period,
            status: 'processing',
            total_employees: payrollStats._count,
            total_gross: payrollStats._sum.gross_salary?.toNumber() || 0,
            total_deductions: payrollStats._sum.total_deductions?.toNumber() || 0,
            total_net: payrollStats._sum.net_salary?.toNumber() || 0,
          }
        : null,
      pending_adjustments: pendingAdjustments,
      pending_overtime: pendingOvertime,
    };
  }

  // ==========================================
  // PERFORMANCE SUMMARY
  // ==========================================

  async getPerformanceSummary(companyFilter: any): Promise<PerformanceSummary> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [activeCycles, pendingReviews, completedReviews, goalStats, overdueGoals, avgScore] = await Promise.all([
      prisma.performanceCycle.count({ where: { status: 'active' } }),
      prisma.performanceReview.count({
        where: { employee: companyFilter, status: 'pending' },
      }),
      prisma.performanceReview.count({
        where: {
          employee: companyFilter,
          status: 'completed',
          updated_at: { gte: startOfMonth },
        },
      }),
      prisma.goal.groupBy({
        by: ['status'],
        where: { employee: companyFilter },
        _count: true,
      }),
      prisma.goal.count({
        where: {
          employee: companyFilter,
          status: { in: ['active', 'in_progress'] },
          target_date: { lt: new Date() },
        },
      }),
      prisma.performanceReview.aggregate({
        where: { employee: companyFilter, status: 'completed' },
        _avg: { final_score: true },
      }),
    ]);

    const goalMap = new Map(goalStats.map((g) => [g.status, g._count]));

    return {
      active_cycles: activeCycles,
      pending_reviews: pendingReviews,
      completed_reviews_this_month: completedReviews,
      avg_performance_score: avgScore._avg.final_score?.toNumber() || null,
      goals: {
        total: goalStats.reduce((sum, g) => sum + g._count, 0),
        in_progress: goalMap.get('in_progress') || 0,
        completed: goalMap.get('completed') || 0,
        overdue: overdueGoals,
      },
    };
  }

  // ==========================================
  // ALERTS
  // ==========================================

  async getAlerts(user: AuthUser): Promise<DashboardAlert[]> {
    const alerts: DashboardAlert[] = [];
    const companyFilter = this.getCompanyFilter(user);
    const today = new Date();

    const [pendingLeaves, expiringContracts, overdueGoals, pendingOvertime] = await Promise.all([
      prisma.leaveRequest.count({
        where: { employee: companyFilter, status: 'pending' },
      }),
      prisma.contract.count({
        where: {
          employee: companyFilter,
          status: 'active',
          end_date: {
            gte: today,
            lte: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.goal.count({
        where: {
          employee: companyFilter,
          status: { in: ['active', 'in_progress'] },
          target_date: { lt: today },
        },
      }),
      prisma.overtime.count({
        where: { employee: companyFilter, status: 'pending' },
      }),
    ]);

    if (pendingLeaves > 0) {
      alerts.push({
        id: 'pending-leaves',
        type: 'warning',
        category: 'leave',
        title: 'Pending Leave Requests',
        message: `${pendingLeaves} leave request(s) awaiting approval`,
        count: pendingLeaves,
        action_url: '/leaves?status=pending',
        created_at: new Date().toISOString(),
      });
    }

    if (expiringContracts > 0) {
      alerts.push({
        id: 'expiring-contracts',
        type: 'warning',
        category: 'contract',
        title: 'Expiring Contracts',
        message: `${expiringContracts} contract(s) expiring within 30 days`,
        count: expiringContracts,
        action_url: '/contracts?expiring=true',
        created_at: new Date().toISOString(),
      });
    }

    if (overdueGoals > 0) {
      alerts.push({
        id: 'overdue-goals',
        type: 'error',
        category: 'performance',
        title: 'Overdue Goals',
        message: `${overdueGoals} goal(s) past their target date`,
        count: overdueGoals,
        action_url: '/goals?status=overdue',
        created_at: new Date().toISOString(),
      });
    }

    if (pendingOvertime > 0) {
      alerts.push({
        id: 'pending-overtime',
        type: 'info',
        category: 'overtime',
        title: 'Pending Overtime',
        message: `${pendingOvertime} overtime request(s) awaiting approval`,
        count: pendingOvertime,
        action_url: '/overtime?status=pending',
        created_at: new Date().toISOString(),
      });
    }

    return alerts;
  }

  // ==========================================
  // QUICK STATS
  // ==========================================

  async getQuickStats(user: AuthUser): Promise<QuickStats> {
    const companyFilter = this.getCompanyFilter(user);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalEmployees,
      activeEmployees,
      newHiresThisMonth,
      departments,
      pendingLeaves,
      pendingOvertime,
      todayAttendance,
      lateToday,
      onLeaveToday,
    ] = await Promise.all([
      prisma.employee.count({ where: companyFilter }),
      prisma.employee.count({ where: { ...companyFilter, employment_status: 'active' } }),
      prisma.employee.count({ where: { ...companyFilter, join_date: { gte: startOfMonth } } }),
      prisma.department.count({ where: { company_id: companyFilter.company_id } }),
      prisma.leaveRequest.count({ where: { employee: companyFilter, status: 'pending' } }),
      prisma.overtime.count({ where: { employee: companyFilter, status: 'pending' } }),
      prisma.attendance.findMany({
        where: {
          employee: companyFilter,
          date: { gte: today, lt: tomorrow },
        },
      }),
      prisma.attendance.count({
        where: {
          employee: companyFilter,
          date: { gte: today, lt: tomorrow },
          status: 'late',
        },
      }),
      prisma.leaveRequest.count({
        where: {
          employee: companyFilter,
          status: 'approved',
          start_date: { lte: today },
          end_date: { gte: today },
        },
      }),
    ]);

    const checkedIn = todayAttendance.filter((a) => a.check_in).length;
    const absent = activeEmployees - checkedIn - onLeaveToday;

    return {
      total_employees: totalEmployees,
      active_employees: activeEmployees,
      new_hires_this_month: newHiresThisMonth,
      departments_count: departments,
      attendance_today: {
        present: checkedIn,
        absent: absent > 0 ? absent : 0,
        late: lateToday,
        on_leave: onLeaveToday,
      },
      pending_requests: {
        leave: pendingLeaves,
        overtime: pendingOvertime,
      },
    };
  }

  // ==========================================
  // CALENDAR EVENTS
  // ==========================================

  async getCalendarEvents(user: AuthUser, startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const companyFilter = this.getCompanyFilter(user);
    const events: CalendarEvent[] = [];

    // Get holidays
    const holidays = await prisma.holiday.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
    });
    holidays.forEach((h) => {
      events.push({
        id: `holiday-${h.id}`,
        type: 'holiday',
        title: h.name,
        date: h.date.toISOString().split('T')[0],
      });
    });

    // Get approved leaves
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        employee: companyFilter,
        status: 'approved',
        OR: [
          { start_date: { gte: startDate, lte: endDate } },
          { end_date: { gte: startDate, lte: endDate } },
        ],
      },
      include: {
        employee: { select: { id: true, name: true } },
        leaveType: { select: { name: true } },
      },
    });
    leaves.forEach((l) => {
      events.push({
        id: `leave-${l.id}`,
        type: 'leave',
        title: `${l.employee.name} - ${l.leaveType?.name || 'Leave'}`,
        date: l.start_date.toISOString().split('T')[0],
        employee_id: l.employee.id,
        employee_name: l.employee.name,
      });
    });

    return events.sort((a, b) => a.date.localeCompare(b.date));
  }

  // ==========================================
  // MY DASHBOARD (EMPLOYEE SELF-SERVICE)
  // ==========================================

  async getMyDashboard(user: AuthUser): Promise<MyDashboard> {
    if (!user.employee?.id) {
      throw new Error('No employee record found');
    }

    const employeeId = user.employee.id;
    const companyId = user.employee.company_id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Date for recent attendance (last 5 days)
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    // Date for "new" announcements (last 7 days)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      todayAttendance,
      monthAttendance,
      recentAttendance,
      leaveBalances,
      pendingLeaves,
      pendingOvertime,
      recentLeaveRequests,
      recentOvertimeRequests,
      announcements,
      goals,
      onLeaveToday,
      leaveDaysThisMonth,
    ] = await Promise.all([
      prisma.attendance.findFirst({
        where: { employee_id: employeeId, date: { gte: today, lt: tomorrow } },
      }),
      prisma.attendance.findMany({
        where: { employee_id: employeeId, date: { gte: startOfMonth, lt: tomorrow } },
      }),
      // Recent attendance history (last 5 records)
      prisma.attendance.findMany({
        where: { employee_id: employeeId },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      prisma.employeeLeaveBalance.findMany({
        where: { employee_id: employeeId },
        include: { leaveType: { select: { name: true } } },
      }),
      prisma.leaveRequest.count({
        where: { employee_id: employeeId, status: 'pending' },
      }),
      prisma.overtime.count({
        where: { employee_id: employeeId, status: 'pending' },
      }),
      // Recent leave requests (last 5)
      prisma.leaveRequest.findMany({
        where: { employee_id: employeeId },
        include: { leaveType: { select: { name: true } } },
        orderBy: { created_at: 'desc' },
        take: 5,
      }),
      // Recent overtime requests (last 5)
      prisma.overtime.findMany({
        where: { employee_id: employeeId },
        orderBy: { created_at: 'desc' },
        take: 5,
      }),
      // Announcements for employee's company (including global and multi-company)
      prisma.announcement.findMany({
        where: {
          OR: [
            { company_id: companyId },
            { is_global: true },
            { target_company_ids: { array_contains: companyId } },
          ],
          is_published: true,
          published_at: { lte: today },
          deleted_at: null,
        },
        orderBy: { published_at: 'desc' },
        take: 5,
      }),
      prisma.goal.groupBy({
        by: ['status'],
        where: { employee_id: employeeId },
        _count: true,
      }),
      prisma.leaveRequest.findFirst({
        where: {
          employee_id: employeeId,
          status: 'approved',
          start_date: { lte: today },
          end_date: { gte: today },
        },
      }),
      // Count leave days this month
      prisma.leaveRequest.findMany({
        where: {
          employee_id: employeeId,
          status: 'approved',
          start_date: { lte: new Date() },
          end_date: { gte: startOfMonth },
        },
      }),
    ]);

    // Calculate attendance status
    let todayStatus: 'checked_in' | 'checked_out' | 'not_checked_in' | 'on_leave' = 'not_checked_in';
    if (onLeaveToday) {
      todayStatus = 'on_leave';
    } else if (todayAttendance?.check_out) {
      todayStatus = 'checked_out';
    } else if (todayAttendance?.check_in) {
      todayStatus = 'checked_in';
    }

    const presentDays = monthAttendance.filter((a) => a.check_in).length;
    const lateDays = monthAttendance.filter((a) => a.status === 'late').length;

    // Calculate leave days this month
    let leaveDaysCount = 0;
    leaveDaysThisMonth.forEach((leave) => {
      const start = new Date(Math.max(leave.start_date.getTime(), startOfMonth.getTime()));
      const end = new Date(Math.min(leave.end_date.getTime(), today.getTime()));
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      leaveDaysCount += days > 0 ? days : 0;
    });

    const goalMap = new Map(goals.map((g) => [g.status, g._count]));
    const overdueGoals = await prisma.goal.count({
      where: {
        employee_id: employeeId,
        status: { in: ['active', 'in_progress'] },
        target_date: { lt: today },
      },
    });

    // Get upcoming events (next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingEvents = await this.getCalendarEvents(user, today, nextWeek);

    // Format attendance history
    const attendanceHistory = recentAttendance.map((a) => {
      // Calculate work hours
      let hours = 0;
      if (a.check_in && a.check_out) {
        hours = (a.check_out.getTime() - a.check_in.getTime()) / (1000 * 60 * 60);
        hours = Math.round(hours * 100) / 100;
      }

      // Determine status
      let status: 'present' | 'late' | 'absent' | 'on_leave' = 'present';
      if (a.status === 'late') {
        status = 'late';
      } else if (a.status === 'leave' || a.status === 'on_leave') {
        status = 'on_leave';
      } else if (!a.check_in) {
        status = 'absent';
      }

      return {
        date: a.date.toISOString().split('T')[0],
        check_in: a.check_in ? a.check_in.toTimeString().slice(0, 5) : null,
        check_out: a.check_out ? a.check_out.toTimeString().slice(0, 5) : null,
        status,
        hours,
      };
    });

    // Combine and format recent requests
    const recentRequests: {
      id: number;
      type: 'leave' | 'overtime';
      detail: string;
      status: 'pending' | 'approved' | 'rejected';
      date: string;
    }[] = [];

    recentLeaveRequests.forEach((lr) => {
      const days = Math.ceil((lr.end_date.getTime() - lr.start_date.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      recentRequests.push({
        id: lr.id,
        type: 'leave',
        detail: `${lr.leaveType?.name || 'Leave'} - ${days} day${days > 1 ? 's' : ''}`,
        status: lr.status as 'pending' | 'approved' | 'rejected',
        date: days > 1
          ? `${lr.start_date.toISOString().split('T')[0]} - ${lr.end_date.toISOString().split('T')[0]}`
          : lr.start_date.toISOString().split('T')[0],
      });
    });

    recentOvertimeRequests.forEach((ot) => {
      recentRequests.push({
        id: ot.id,
        type: 'overtime',
        detail: `Overtime - ${ot.hours?.toNumber() || 0} hours`,
        status: ot.status as 'pending' | 'approved' | 'rejected',
        date: ot.date.toISOString().split('T')[0],
      });
    });

    // Sort by most recent and take top 5
    recentRequests.sort((a, b) => new Date(b.date.split(' - ')[0]).getTime() - new Date(a.date.split(' - ')[0]).getTime());

    // Format announcements
    const formattedAnnouncements = announcements.map((ann) => ({
      id: ann.id,
      title: ann.title,
      category: ann.category || 'general',
      date: ann.published_at?.toISOString().split('T')[0] || ann.created_at.toISOString().split('T')[0],
      is_new: ann.published_at ? ann.published_at >= sevenDaysAgo : ann.created_at >= sevenDaysAgo,
    }));

    return {
      attendance: {
        today_status: todayStatus,
        check_in_time: todayAttendance?.check_in?.toISOString() || null,
        check_out_time: todayAttendance?.check_out?.toISOString() || null,
        this_month: {
          present_days: presentDays,
          late_days: lateDays,
          absent_days: 0,
          leave_days: leaveDaysCount,
        },
      },
      attendance_history: attendanceHistory,
      leave_balance: leaveBalances.map((b) => {
        const total = b.allocated_days?.toNumber() || 0;
        const used = b.used_days?.toNumber() || 0;
        return {
          type: b.leaveType?.name || 'Unknown',
          total,
          used,
          remaining: total - used,
        };
      }),
      recent_requests: recentRequests.slice(0, 5),
      announcements: formattedAnnouncements,
      pending_requests: {
        leave: pendingLeaves,
        overtime: pendingOvertime,
      },
      goals: {
        total: goals.reduce((sum, g) => sum + g._count, 0),
        completed: goalMap.get('completed') || 0,
        in_progress: goalMap.get('in_progress') || 0,
        overdue: overdueGoals,
      },
      upcoming_events: upcomingEvents.slice(0, 5),
    };
  }

  // ==========================================
  // TEAM DASHBOARD (FOR MANAGERS)
  // ==========================================

  async getTeamDashboard(user: AuthUser): Promise<TeamDashboard> {
    if (!user.employee?.id) {
      throw new Error('No employee record found');
    }

    const managerId = user.employee.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const teamMembers = await prisma.employee.findMany({
      where: {
        OR: [
          { manager_id: managerId },
          { direct_manager_id: managerId },
        ],
        employment_status: 'active',
        employee_id: { notIn: HIDDEN_EMPLOYEE_IDS },
      },
      select: {
        id: true,
        employee_id: true,
        name: true,
        email: true,
        phone: true,
        mobile_number: true,
        avatar: true,
        hire_date: true,
        join_date: true,
        employment_status: true,
        position: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });

    const teamIds = teamMembers.map((m) => m.id);

    const [todayAttendance, onLeaveToday, pendingLeavesAll, pendingOvertime, goals, overdueGoals] = await Promise.all([
      prisma.attendance.findMany({
        where: {
          employee_id: { in: teamIds },
          date: { gte: today, lt: tomorrow },
        },
      }),
      prisma.leaveRequest.findMany({
        where: {
          employee_id: { in: teamIds },
          status: 'approved',
          start_date: { lte: today },
          end_date: { gte: today },
        },
      }),
      // Get pending leaves per employee
      prisma.leaveRequest.groupBy({
        by: ['employee_id'],
        where: { employee_id: { in: teamIds }, status: 'pending' },
        _count: true,
      }),
      prisma.overtime.count({
        where: { employee_id: { in: teamIds }, status: 'pending' },
      }),
      prisma.goal.groupBy({
        by: ['status'],
        where: { employee_id: { in: teamIds } },
        _count: true,
      }),
      prisma.goal.count({
        where: {
          employee_id: { in: teamIds },
          status: { in: ['active', 'in_progress'] },
          target_date: { lt: today },
        },
      }),
    ]);

    const attendanceMap = new Map(todayAttendance.map((a) => [a.employee_id, a]));
    const onLeaveSet = new Set(onLeaveToday.map((l) => l.employee_id));
    const pendingLeavesMap = new Map(pendingLeavesAll.map((p) => [p.employee_id, p._count]));

    const goalMap = new Map(goals.map((g) => [g.status, g._count]));

    // Calculate late status based on attendance
    const isLate = (checkIn: Date | null): boolean => {
      if (!checkIn) return false;
      const checkInTime = new Date(checkIn);
      // Consider late if check-in after 09:00
      return checkInTime.getHours() >= 9 && checkInTime.getMinutes() > 0;
    };

    return {
      team_size: teamMembers.length,
      present_today: todayAttendance.filter((a) => a.check_in).length,
      on_leave_today: onLeaveToday.length,
      pending_leave_requests: pendingLeavesAll.reduce((sum, p) => sum + p._count, 0),
      pending_overtime_requests: pendingOvertime,
      team_goals: {
        total: goals.reduce((sum, g) => sum + g._count, 0),
        completed: goalMap.get('completed') || 0,
        in_progress: goalMap.get('in_progress') || 0,
        overdue: overdueGoals,
      },
      team_members: teamMembers.map((m) => {
        const attendance = attendanceMap.get(m.id);
        let status: 'present' | 'absent' | 'leave' | 'late' | 'not_checked_in' = 'not_checked_in';

        if (onLeaveSet.has(m.id)) {
          status = 'leave';
        } else if (attendance?.check_in) {
          status = isLate(attendance.check_in) ? 'late' : 'present';
        }

        // Format check-in time
        let checkInTime: string | null = null;
        if (attendance?.check_in) {
          const checkIn = new Date(attendance.check_in);
          checkInTime = checkIn.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
        }

        return {
          id: m.id,
          employee_id: m.employee_id || '',
          name: m.name,
          email: m.email || '',
          phone: m.phone || m.mobile_number || '',
          position: m.position?.name || 'N/A',
          department: m.department?.name || 'N/A',
          avatar: m.avatar,
          join_date: m.join_date || m.hire_date || null,
          status_today: status,
          check_in_time: checkInTime,
          pending_leaves: pendingLeavesMap.get(m.id) || 0,
        };
      }),
    };
  }

  // ==========================================
  // GROUP CEO DASHBOARD
  // ==========================================

  async getGroupOverview(user: AuthUser): Promise<GroupDashboard> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Build company filter based on user's access
    const companyWhereFilter: any = { status: 'active' };

    // Super Admin and Group CEO can see all companies
    if (!user.roles.includes('Super Admin') && !user.roles.includes('Group CEO')) {
      // For CEO role, filter by accessible companies
      if (user.accessibleCompanyIds && user.accessibleCompanyIds.length > 0) {
        companyWhereFilter.id = { in: user.accessibleCompanyIds };
      } else if (user.employee?.company_id) {
        // If no accessible companies list, use employee's company
        companyWhereFilter.id = user.employee.company_id;
      }
    }

    // Get companies based on user access
    const companies = await prisma.company.findMany({
      where: companyWhereFilter,
      select: { id: true, name: true, attendance_enabled: true },
    });

    // Get company-level statistics in parallel
    const companyOverviews: CompanyOverview[] = await Promise.all(
      companies.map(async (company) => {
        const [
          totalEmployees,
          activeEmployees,
          attendanceToday,
          onLeaveToday,
          pendingLeaves,
          newHires,
        ] = await Promise.all([
          prisma.employee.count({ where: { company_id: company.id } }),
          prisma.employee.count({ where: { company_id: company.id, employment_status: 'active' } }),
          // Only count attendance if feature is enabled
          company.attendance_enabled
            ? prisma.attendance.count({
                where: {
                  employee: { company_id: company.id },
                  date: today,
                  check_in: { not: null },
                },
              })
            : Promise.resolve(-1), // -1 indicates attendance not enabled
          prisma.leaveRequest.count({
            where: {
              employee: { company_id: company.id },
              status: 'approved',
              start_date: { lte: today },
              end_date: { gte: today },
            },
          }),
          prisma.leaveRequest.count({
            where: {
              employee: { company_id: company.id },
              status: 'pending',
            },
          }),
          prisma.employee.count({
            where: {
              company_id: company.id,
              join_date: { gte: startOfMonth },
            },
          }),
        ]);

        // Calculate attendance rate only if attendance feature is enabled
        let attendanceRate: number;
        if (!company.attendance_enabled) {
          attendanceRate = -1; // -1 indicates N/A (feature not enabled)
        } else if (activeEmployees > 0) {
          attendanceRate = Math.round((attendanceToday / activeEmployees) * 100);
        } else {
          attendanceRate = 0;
        }

        return {
          id: company.id,
          name: company.name,
          employees: totalEmployees,
          active_employees: activeEmployees,
          attendance_rate: attendanceRate,
          attendance_enabled: company.attendance_enabled,
          on_leave_today: onLeaveToday,
          pending_leaves: pendingLeaves,
          new_hires_this_month: newHires,
        };
      })
    );

    // Build employee filter based on accessible companies
    const companyIds = companies.map((c) => c.id);
    const employeeCompanyFilter = companyIds.length > 0 ? { company_id: { in: companyIds } } : {};

    // Get overall summary (filtered by accessible companies)
    const [
      totalEmployees,
      activeEmployees,
      totalDepartments,
      newHiresThisMonth,
      terminationsThisMonth,
      totalOnLeaveToday,
      pendingLeaveApprovals,
      pendingOvertimeApprovals,
    ] = await Promise.all([
      prisma.employee.count({ where: employeeCompanyFilter }),
      prisma.employee.count({ where: { ...employeeCompanyFilter, employment_status: 'active' } }),
      prisma.department.count({ where: { ...employeeCompanyFilter, status: 'active' } }),
      prisma.employee.count({ where: { ...employeeCompanyFilter, join_date: { gte: startOfMonth } } }),
      prisma.employee.count({
        where: {
          ...employeeCompanyFilter,
          employment_status: { in: ['resigned', 'terminated'] },
          updated_at: { gte: startOfMonth },
        },
      }),
      prisma.leaveRequest.count({
        where: {
          employee: employeeCompanyFilter,
          status: 'approved',
          start_date: { lte: today },
          end_date: { gte: today },
        },
      }),
      prisma.leaveRequest.count({ where: { employee: employeeCompanyFilter, status: 'pending' } }),
      prisma.overtime.count({ where: { employee: employeeCompanyFilter, status: 'pending' } }),
    ]);

    // Calculate average attendance rate (only for companies with attendance enabled)
    const companiesWithAttendance = companyOverviews.filter((c) => c.attendance_rate >= 0);
    const totalAttendanceRate = companiesWithAttendance.reduce((sum, c) => sum + c.attendance_rate, 0);
    const avgAttendanceRate = companiesWithAttendance.length > 0
      ? Math.round(totalAttendanceRate / companiesWithAttendance.length)
      : 0;

    // Get headcount trend (last 6 months) - filtered by accessible companies
    const headcountTrend = await this.getHeadcountTrend(companyIds);

    // Get department distribution - filtered by accessible companies
    const departmentDistribution = await this.getDepartmentDistribution(companyIds);

    // Get payroll summary
    const payrollSummary = await this.getGroupPayrollSummary(companies);

    // Get recent activities - filtered by accessible companies
    const recentActivities = await this.getRecentGroupActivities(companyIds);

    // Get alerts
    const alerts = await this.getGroupAlerts(companyOverviews);

    return {
      summary: {
        total_companies: companies.length,
        total_employees: totalEmployees,
        total_departments: totalDepartments,
        avg_attendance_rate: avgAttendanceRate,
        total_on_leave_today: totalOnLeaveToday,
        pending_approvals: pendingLeaveApprovals + pendingOvertimeApprovals,
        new_hires_this_month: newHiresThisMonth,
        terminations_this_month: terminationsThisMonth,
      },
      companies: companyOverviews,
      headcount_trend: headcountTrend,
      department_distribution: departmentDistribution,
      payroll_summary: payrollSummary,
      recent_activities: recentActivities,
      alerts,
    };
  }

  private async getHeadcountTrend(companyIds: number[]): Promise<{ month: string; headcount: number; hires: number; exits: number }[]> {
    const result: { month: string; headcount: number; hires: number; exits: number }[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const companyFilter = companyIds.length > 0 ? { company_id: { in: companyIds } } : {};

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const [headcount, hires, exits] = await Promise.all([
        // Count employees who were active at end of month
        prisma.employee.count({
          where: {
            ...companyFilter,
            AND: [
              {
                OR: [
                  { join_date: { lte: endOfMonth } },
                  { hire_date: { lte: endOfMonth } },
                ],
              },
              {
                OR: [
                  { employment_status: 'active' },
                  {
                    employment_status: { in: ['resigned', 'terminated'] },
                    updated_at: { gt: endOfMonth },
                  },
                ],
              },
            ],
          },
        }),
        // Count new hires in this month
        prisma.employee.count({
          where: {
            ...companyFilter,
            OR: [
              { join_date: { gte: startOfMonth, lte: endOfMonth } },
              { hire_date: { gte: startOfMonth, lte: endOfMonth } },
            ],
          },
        }),
        // Count exits in this month
        prisma.employee.count({
          where: {
            ...companyFilter,
            employment_status: { in: ['resigned', 'terminated'] },
            updated_at: { gte: startOfMonth, lte: endOfMonth },
          },
        }),
      ]);

      result.push({
        month: months[date.getMonth()],
        headcount: headcount || 0,
        hires: hires || 0,
        exits: exits || 0,
      });
    }

    return result;
  }

  private async getDepartmentDistribution(companyIds: number[]): Promise<{ name: string; employees: number; percentage: number }[]> {
    const companyFilter = companyIds.length > 0 ? { company_id: { in: companyIds } } : {};

    // Get departments with employee counts
    const departmentCounts = await prisma.employee.groupBy({
      by: ['department_id'],
      where: { ...companyFilter, employment_status: 'active', department_id: { not: null } },
      _count: { id: true },
    });

    // Get department names
    const departmentIds = departmentCounts.map((d) => d.department_id).filter(Boolean) as number[];
    const departments = await prisma.department.findMany({
      where: { id: { in: departmentIds }, status: 'active' },
      select: { id: true, name: true },
    });
    const deptMap = new Map(departments.map((d) => [d.id, d.name]));

    const totalEmployees = departmentCounts.reduce((sum, d) => sum + d._count.id, 0);

    return departmentCounts
      .map((d) => ({
        name: deptMap.get(d.department_id!) || 'Unknown',
        employees: d._count.id,
        percentage: totalEmployees > 0 ? Math.round((d._count.id / totalEmployees) * 100) : 0,
      }))
      .sort((a, b) => b.employees - a.employees)
      .slice(0, 10); // Top 10 departments
  }

  private async getGroupPayrollSummary(companies: { id: number; name: string }[]): Promise<{
    total_monthly_payroll: number;
    avg_salary: number;
    by_company: { company_name: string; total_payroll: number; employee_count: number }[];
  }> {
    // Get the latest period string (e.g., "2025-01")
    const latestPayroll = await prisma.payroll.findFirst({
      where: { status: { in: ['processed', 'paid'] } },
      orderBy: { period_end: 'desc' },
      select: { period: true },
    });

    if (!latestPayroll?.period) {
      return {
        total_monthly_payroll: 0,
        avg_salary: 0,
        by_company: companies.map((c) => ({
          company_name: c.name,
          total_payroll: 0,
          employee_count: 0,
        })),
      };
    }

    const payrollByCompany = await Promise.all(
      companies.map(async (company) => {
        const payrollData = await prisma.payroll.aggregate({
          where: {
            period: latestPayroll.period,
            company_id: company.id,
          },
          _sum: { net_salary: true },
          _count: { id: true },
        });

        return {
          company_name: company.name,
          total_payroll: Number(payrollData._sum.net_salary) || 0,
          employee_count: payrollData._count.id || 0,
        };
      })
    );

    const totalPayroll = payrollByCompany.reduce((sum, p) => sum + p.total_payroll, 0);
    const totalEmployees = payrollByCompany.reduce((sum, p) => sum + p.employee_count, 0);

    return {
      total_monthly_payroll: totalPayroll,
      avg_salary: totalEmployees > 0 ? Math.round(totalPayroll / totalEmployees) : 0,
      by_company: payrollByCompany,
    };
  }

  private async getRecentGroupActivities(companyIds: number[]): Promise<GroupActivity[]> {
    const companyFilter = companyIds.length > 0 ? { company_id: { in: companyIds } } : {};

    // Get recent employee movements (hires, exits, promotions)
    const recentEmployees = await prisma.employee.findMany({
      where: {
        ...companyFilter,
        employee_id: { notIn: HIDDEN_EMPLOYEE_IDS },
        OR: [
          { join_date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
          {
            employment_status: { in: ['resigned', 'terminated'] },
            updated_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        employment_status: true,
        join_date: true,
        updated_at: true,
        company: { select: { name: true } },
      },
      orderBy: { updated_at: 'desc' },
      take: 10,
    });

    const activities: GroupActivity[] = recentEmployees.map((emp) => {
      const isNewHire = emp.join_date && new Date(emp.join_date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const isExit = ['resigned', 'terminated'].includes(emp.employment_status || '');

      return {
        id: emp.id,
        type: isExit ? 'exit' : 'hire',
        action: isExit ? 'Employee resigned/terminated' : 'New employee onboarded',
        company_name: emp.company?.name || 'Unknown',
        employee_name: emp.name,
        created_at: emp.updated_at.toISOString(),
      };
    });

    // Get recent approved leaves
    const recentLeaves = await prisma.leaveRequest.findMany({
      where: {
        employee: companyFilter,
        status: 'approved',
        updated_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: {
        id: true,
        updated_at: true,
        employee: {
          select: {
            name: true,
            company: { select: { name: true } },
          },
        },
      },
      orderBy: { updated_at: 'desc' },
      take: 5,
    });

    const leaveActivities: GroupActivity[] = recentLeaves.map((leave) => ({
      id: leave.id,
      type: 'leave',
      action: 'Leave approved',
      company_name: leave.employee.company?.name || 'Unknown',
      employee_name: leave.employee.name,
      created_at: leave.updated_at.toISOString(),
    }));

    return [...activities, ...leaveActivities]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }

  private async getGroupAlerts(companyOverviews: CompanyOverview[]): Promise<DashboardAlert[]> {
    const alerts: DashboardAlert[] = [];

    // Check for low attendance rates (only for companies with attendance enabled)
    for (const company of companyOverviews) {
      // Skip companies without attendance feature enabled (attendance_rate = -1)
      if (company.attendance_rate >= 0 && company.attendance_rate < 80 && company.active_employees > 0) {
        alerts.push({
          id: `attendance-${company.id}`,
          type: 'warning',
          category: 'attendance',
          title: 'Low Attendance Alert',
          message: `${company.name} has ${company.attendance_rate}% attendance rate today`,
          count: company.active_employees - Math.round(company.active_employees * company.attendance_rate / 100),
          action_url: `/hr/attendance?company=${company.id}`,
          created_at: new Date().toISOString(),
        });
      }

      // Check for pending leave requests
      if (company.pending_leaves > 10) {
        alerts.push({
          id: `pending-leaves-${company.id}`,
          type: 'info',
          category: 'leave',
          title: 'Pending Leave Requests',
          message: `${company.name} has ${company.pending_leaves} pending leave requests`,
          count: company.pending_leaves,
          action_url: `/hr/leaves?company=${company.id}&status=pending`,
          created_at: new Date().toISOString(),
        });
      }
    }

    // Check for contracts expiring soon
    const expiringContracts = await prisma.contract.count({
      where: {
        status: 'active',
        end_date: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      },
    });

    if (expiringContracts > 0) {
      alerts.push({
        id: 'expiring-contracts',
        type: 'warning',
        category: 'contract',
        title: 'Contracts Expiring Soon',
        message: `${expiringContracts} employee contracts expiring within 30 days`,
        count: expiringContracts,
        action_url: '/hr/contracts?status=expiring',
        created_at: new Date().toISOString(),
      });
    }

    return alerts.slice(0, 5);
  }

  // ==========================================
  // WORKFORCE ANALYTICS (FOR GROUP CEO)
  // ==========================================

  async getWorkforceAnalytics(user: AuthUser, companyId?: number): Promise<{
    gender_distribution: { label: string; value: number; count: number; color: string }[];
    employment_type_distribution: { label: string; value: number; count: number; color: string }[];
    age_distribution: { range: string; count: number; percentage: number }[];
    tenure_distribution: { range: string; count: number; percentage: number }[];
    marital_status_distribution: { label: string; value: number; count: number }[];
  }> {
    // Build company filter based on user access
    let companyFilter: any = {};
    if (companyId) {
      companyFilter = { company_id: companyId };
    } else if (!user.roles.includes('Super Admin') && !user.roles.includes('Group CEO')) {
      if (user.accessibleCompanyIds && user.accessibleCompanyIds.length > 0) {
        companyFilter = { company_id: { in: user.accessibleCompanyIds } };
      } else if (user.employee?.company_id) {
        companyFilter = { company_id: user.employee.company_id };
      }
    }
    const activeFilter = { ...companyFilter, employment_status: 'active' };

    // Get all active employees with needed fields
    const employees = await prisma.employee.findMany({
      where: activeFilter,
      select: {
        id: true,
        gender: true,
        date_of_birth: true,
        hire_date: true,
        join_date: true,
        employment_type: true,
        marital_status: true,
      },
    });

    const totalEmployees = employees.length;

    // Gender distribution
    const genderCounts = new Map<string, number>();
    for (const emp of employees) {
      const gender = emp.gender || 'Unknown';
      genderCounts.set(gender, (genderCounts.get(gender) || 0) + 1);
    }

    const genderColors: Record<string, string> = {
      male: '#3B82F6',
      female: '#EC4899',
      Unknown: '#9CA3AF',
    };

    const genderLabels: Record<string, string> = {
      male: 'Male',
      female: 'Female',
      Unknown: 'Unknown',
    };

    const gender_distribution = Array.from(genderCounts.entries())
      .map(([gender, count]) => ({
        label: genderLabels[gender] || gender,
        value: totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0,
        count,
        color: genderColors[gender] || '#9CA3AF',
      }))
      .sort((a, b) => b.count - a.count);

    // Employment type distribution
    const employmentTypeCounts = new Map<string, number>();
    for (const emp of employees) {
      const type = emp.employment_type || 'Unknown';
      employmentTypeCounts.set(type, (employmentTypeCounts.get(type) || 0) + 1);
    }

    const employmentTypeColors: Record<string, string> = {
      permanent: '#10B981',
      contract: '#F59E0B',
      internship: '#8B5CF6',
      part_time: '#06B6D4',
      freelance: '#F97316',
      Unknown: '#9CA3AF',
    };

    const employmentTypeLabels: Record<string, string> = {
      permanent: 'Permanent',
      contract: 'Contract',
      internship: 'Intern',
      part_time: 'Part Time',
      freelance: 'Freelance',
      Unknown: 'Unknown',
    };

    const employment_type_distribution = Array.from(employmentTypeCounts.entries())
      .map(([type, count]) => ({
        label: employmentTypeLabels[type] || type,
        value: totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0,
        count,
        color: employmentTypeColors[type] || '#9CA3AF',
      }))
      .sort((a, b) => b.count - a.count);

    // Age distribution
    const today = new Date();
    const ageBuckets = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '55+': 0,
    };

    for (const emp of employees) {
      if (emp.date_of_birth) {
        const birthDate = new Date(emp.date_of_birth);
        const age = today.getFullYear() - birthDate.getFullYear();

        if (age >= 18 && age <= 25) ageBuckets['18-25']++;
        else if (age >= 26 && age <= 35) ageBuckets['26-35']++;
        else if (age >= 36 && age <= 45) ageBuckets['36-45']++;
        else if (age >= 46 && age <= 55) ageBuckets['46-55']++;
        else if (age > 55) ageBuckets['55+']++;
      }
    }

    const employeesWithAge = Object.values(ageBuckets).reduce((a, b) => a + b, 0);
    const age_distribution = Object.entries(ageBuckets).map(([range, count]) => ({
      range,
      count,
      percentage: employeesWithAge > 0 ? Math.round((count / employeesWithAge) * 100) : 0,
    }));

    // Tenure distribution
    const tenureBuckets = {
      '< 1 year': 0,
      '1-2 years': 0,
      '3-5 years': 0,
      '5-10 years': 0,
      '10+ years': 0,
    };

    for (const emp of employees) {
      const startDate = emp.join_date || emp.hire_date;
      if (startDate) {
        const years = (today.getTime() - new Date(startDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);

        if (years < 1) tenureBuckets['< 1 year']++;
        else if (years >= 1 && years < 3) tenureBuckets['1-2 years']++;
        else if (years >= 3 && years < 5) tenureBuckets['3-5 years']++;
        else if (years >= 5 && years < 10) tenureBuckets['5-10 years']++;
        else tenureBuckets['10+ years']++;
      }
    }

    const employeesWithTenure = Object.values(tenureBuckets).reduce((a, b) => a + b, 0);
    const tenure_distribution = Object.entries(tenureBuckets).map(([range, count]) => ({
      range,
      count,
      percentage: employeesWithTenure > 0 ? Math.round((count / employeesWithTenure) * 100) : 0,
    }));

    // Marital status distribution
    const maritalCounts = new Map<string, number>();
    for (const emp of employees) {
      const status = emp.marital_status || 'Unknown';
      maritalCounts.set(status, (maritalCounts.get(status) || 0) + 1);
    }

    const maritalLabels: Record<string, string> = {
      single: 'Single',
      married: 'Married',
      divorced: 'Divorced',
      widowed: 'Widowed',
      Unknown: 'Unknown',
    };

    const marital_status_distribution = Array.from(maritalCounts.entries())
      .map(([status, count]) => ({
        label: maritalLabels[status] || status,
        value: totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      gender_distribution,
      employment_type_distribution,
      age_distribution,
      tenure_distribution,
      marital_status_distribution,
    };
  }

  // ==========================================
  // HEADCOUNT ANALYTICS (FOR GROUP CEO)
  // ==========================================

  async getHeadcountAnalytics(user: AuthUser, companyId?: number, period?: string): Promise<{
    headcount_trend: { month: string; headcount: number; hires: number; exits: number }[];
    quarterly_comparison: { quarter: string; headcount: number; growth: number }[];
    headcount_by_company: { name: string; headcount: number; growth: string; hires: number }[];
    department_headcount: { name: string; employees: number; percentage: number }[];
    headcount_forecast: { month: string; projected: number; lower: number; upper: number }[];
    current_headcount: number;
    year_end_target: number;
  }> {
    // Build company filter based on user access
    let companyFilter: any = {};
    if (companyId) {
      companyFilter = { company_id: companyId };
    } else if (!user.roles.includes('Super Admin') && !user.roles.includes('Group CEO')) {
      if (user.accessibleCompanyIds && user.accessibleCompanyIds.length > 0) {
        companyFilter = { company_id: { in: user.accessibleCompanyIds } };
      } else if (user.employee?.company_id) {
        companyFilter = { company_id: user.employee.company_id };
      }
    }
    const today = new Date();

    // Determine number of months based on period
    let numMonths = 12;
    if (period === '6_months') numMonths = 6;
    else if (period === '2_years') numMonths = 24;
    else if (period === 'all_time') numMonths = 36;

    // 1. Headcount Trend (monthly)
    const headcountTrend: { month: string; headcount: number; hires: number; exits: number }[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = numMonths - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const [hires, exits] = await Promise.all([
        // Hires in this month
        prisma.employee.count({
          where: {
            ...companyFilter,
            OR: [
              { join_date: { gte: monthStart, lte: monthEnd } },
              { hire_date: { gte: monthStart, lte: monthEnd } },
            ],
          },
        }),
        // Exits in this month
        prisma.employee.count({
          where: {
            ...companyFilter,
            employment_status: { in: ['resigned', 'terminated'] },
            resign_date: { gte: monthStart, lte: monthEnd },
          },
        }),
      ]);

      // Calculate headcount at end of month
      const activeAtMonth = await prisma.employee.count({
        where: {
          ...companyFilter,
          AND: [
            {
              OR: [
                { join_date: { lte: monthEnd } },
                { hire_date: { lte: monthEnd } },
              ],
            },
            {
              OR: [
                { employment_status: 'active' },
                {
                  employment_status: { in: ['resigned', 'terminated'] },
                  resign_date: { gt: monthEnd },
                },
              ],
            },
          ],
        },
      });

      headcountTrend.push({
        month: months[date.getMonth()],
        headcount: activeAtMonth,
        hires,
        exits,
      });
    }

    // 2. Quarterly Comparison (last 6 quarters)
    const quarterlyComparison: { quarter: string; headcount: number; growth: number }[] = [];
    let prevHeadcount = 0;

    for (let i = 5; i >= 0; i--) {
      const quarterDate = new Date();
      quarterDate.setMonth(quarterDate.getMonth() - i * 3);
      const quarter = Math.floor(quarterDate.getMonth() / 3) + 1;
      const year = quarterDate.getFullYear();
      const quarterEnd = new Date(year, quarter * 3, 0, 23, 59, 59);

      const headcount = await prisma.employee.count({
        where: {
          ...companyFilter,
          AND: [
            {
              OR: [
                { join_date: { lte: quarterEnd } },
                { hire_date: { lte: quarterEnd } },
              ],
            },
            {
              OR: [
                { employment_status: 'active' },
                {
                  employment_status: { in: ['resigned', 'terminated'] },
                  resign_date: { gt: quarterEnd },
                },
              ],
            },
          ],
        },
      });

      const growth = prevHeadcount > 0
        ? parseFloat((((headcount - prevHeadcount) / prevHeadcount) * 100).toFixed(1))
        : 0;

      quarterlyComparison.push({
        quarter: `Q${quarter} ${year}`,
        headcount,
        growth,
      });

      prevHeadcount = headcount;
    }

    // 3. Headcount by Company (filtered by user access)
    const companyFilterForList: any = { status: 'active' };
    if (!user.roles.includes('Super Admin') && !user.roles.includes('Group CEO')) {
      if (user.accessibleCompanyIds && user.accessibleCompanyIds.length > 0) {
        companyFilterForList.id = { in: user.accessibleCompanyIds };
      } else if (user.employee?.company_id) {
        companyFilterForList.id = user.employee.company_id;
      }
    }

    const companies = await prisma.company.findMany({
      where: companyFilterForList,
      select: { id: true, name: true },
    });

    const headcountByCompany = await Promise.all(
      companies.map(async (company) => {
        const [headcount, newHires] = await Promise.all([
          prisma.employee.count({
            where: {
              company_id: company.id,
              employment_status: 'active',
            },
          }),
          prisma.employee.count({
            where: {
              company_id: company.id,
              OR: [
                { join_date: { gte: new Date(today.getFullYear(), today.getMonth(), 1) } },
                { hire_date: { gte: new Date(today.getFullYear(), today.getMonth(), 1) } },
              ],
            },
          }),
        ]);

        const growthValue = headcount > 0 ? ((newHires / headcount) * 100) : 0;
        const growth = growthValue > 0 ? `+${growthValue.toFixed(1)}%` : `${growthValue.toFixed(1)}%`;

        return {
          name: company.name,
          headcount,
          growth,
          hires: newHires,
        };
      })
    );

    // Sort by headcount descending
    headcountByCompany.sort((a, b) => b.headcount - a.headcount);

    // 4. Department Headcount
    const departments = await prisma.department.findMany({
      where: { status: 'active' },
      select: { id: true, name: true },
    });

    const departmentCounts = await Promise.all(
      departments.map(async (dept) => {
        const count = await prisma.employee.count({
          where: {
            ...companyFilter,
            department_id: dept.id,
            employment_status: 'active',
          },
        });
        return { name: dept.name, employees: count };
      })
    );

    const totalActive = departmentCounts.reduce((sum, d) => sum + d.employees, 0);
    const departmentHeadcount = departmentCounts
      .map((d) => ({
        ...d,
        percentage: totalActive > 0 ? Math.round((d.employees / totalActive) * 100) : 0,
      }))
      .filter((d) => d.employees > 0)
      .sort((a, b) => b.employees - a.employees)
      .slice(0, 8);

    // 5. Headcount Forecast (simple linear projection for next 6 months)
    const currentHeadcount = await prisma.employee.count({
      where: { ...companyFilter, employment_status: 'active' },
    });

    // Calculate average monthly growth from trend
    const trendWithGrowth = headcountTrend.slice(-6);
    let avgMonthlyGrowth = 0;
    if (trendWithGrowth.length > 1) {
      const startHC = trendWithGrowth[0].headcount || currentHeadcount;
      const endHC = trendWithGrowth[trendWithGrowth.length - 1].headcount || currentHeadcount;
      avgMonthlyGrowth = (endHC - startHC) / trendWithGrowth.length;
    }

    const headcountForecast: { month: string; projected: number; lower: number; upper: number }[] = [];
    for (let i = 1; i <= 6; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);
      const projected = Math.round(currentHeadcount + avgMonthlyGrowth * i);
      const variance = Math.max(1, Math.round(projected * 0.02 * i)); // 2% variance per month

      headcountForecast.push({
        month: months[futureDate.getMonth()],
        projected,
        lower: projected - variance,
        upper: projected + variance,
      });
    }

    // Year-end target (simple estimation based on current trajectory)
    const monthsRemaining = 12 - today.getMonth();
    const yearEndTarget = Math.round(currentHeadcount + avgMonthlyGrowth * monthsRemaining * 1.1);

    return {
      headcount_trend: headcountTrend,
      quarterly_comparison: quarterlyComparison,
      headcount_by_company: headcountByCompany,
      department_headcount: departmentHeadcount,
      headcount_forecast: headcountForecast,
      current_headcount: currentHeadcount,
      year_end_target: yearEndTarget > currentHeadcount ? yearEndTarget : Math.round(currentHeadcount * 1.1),
    };
  }

  // ==========================================
  // TURNOVER ANALYTICS (FOR GROUP CEO)
  // ==========================================

  async getTurnoverAnalytics(user: AuthUser, companyId?: number, period?: string): Promise<{
    monthly_turnover: { month: string; hires: number; exits: number; rate: number }[];
    exit_reasons: { reason: string; count: number; percentage: number }[];
    department_turnover: { name: string; turnoverRate: number; exits: number; hires: number; netChange: number }[];
    tenure_at_exit: { range: string; count: number; percentage: number }[];
    recent_exits: {
      name: string;
      department: string;
      position: string;
      exitDate: string;
      reason: string;
      tenure: string;
      company: string;
    }[];
    avg_tenure_at_exit: number;
    total_exits_period: number;
    total_hires_period: number;
  }> {
    // Build company filter based on user access
    let companyFilter: any = {};
    if (companyId) {
      companyFilter = { company_id: companyId };
    } else if (!user.roles.includes('Super Admin') && !user.roles.includes('Group CEO')) {
      if (user.accessibleCompanyIds && user.accessibleCompanyIds.length > 0) {
        companyFilter = { company_id: { in: user.accessibleCompanyIds } };
      } else if (user.employee?.company_id) {
        companyFilter = { company_id: user.employee.company_id };
      }
    }
    const today = new Date();

    // Determine period range
    let periodStart: Date;
    let periodEnd = new Date(today);

    switch (period) {
      case 'this_month':
        periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'last_month':
        periodStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        periodEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'this_quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        periodStart = new Date(today.getFullYear(), quarter * 3, 1);
        break;
      case 'last_year':
        periodStart = new Date(today.getFullYear() - 1, 0, 1);
        periodEnd = new Date(today.getFullYear() - 1, 11, 31);
        break;
      case 'this_year':
      default:
        periodStart = new Date(today.getFullYear(), 0, 1);
        break;
    }

    // 1. Monthly turnover trend (last 6 months)
    const monthlyTurnover: { month: string; hires: number; exits: number; rate: number }[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const [hires, exits, avgHeadcount] = await Promise.all([
        // Count new hires in this month
        prisma.employee.count({
          where: {
            ...companyFilter,
            OR: [
              { join_date: { gte: monthStart, lte: monthEnd } },
              { hire_date: { gte: monthStart, lte: monthEnd } },
            ],
          },
        }),
        // Count exits in this month
        prisma.employee.count({
          where: {
            ...companyFilter,
            employment_status: { in: ['resigned', 'terminated'] },
            resign_date: { gte: monthStart, lte: monthEnd },
          },
        }),
        // Average headcount for turnover rate calculation
        prisma.employee.count({
          where: {
            ...companyFilter,
            OR: [
              { employment_status: 'active' },
              {
                employment_status: { in: ['resigned', 'terminated'] },
                resign_date: { gt: monthEnd },
              },
            ],
          },
        }),
      ]);

      const rate = avgHeadcount > 0 ? parseFloat(((exits / avgHeadcount) * 100).toFixed(1)) : 0;

      monthlyTurnover.push({
        month: months[date.getMonth()],
        hires,
        exits,
        rate,
      });
    }

    // 2. Exit reasons distribution
    const exitedEmployees = await prisma.employee.findMany({
      where: {
        ...companyFilter,
        employment_status: { in: ['resigned', 'terminated'] },
        resign_date: { gte: periodStart, lte: periodEnd },
      },
      select: {
        resign_type: true,
        resign_reason: true,
      },
    });

    const reasonCounts = new Map<string, number>();
    for (const emp of exitedEmployees) {
      let reason = 'Other';
      if (emp.resign_type === 'voluntary') reason = 'Resignation';
      else if (emp.resign_type === 'involuntary') reason = 'Termination';
      else if (emp.resign_type === 'retirement') reason = 'Retirement';
      else if (emp.resign_reason?.toLowerCase().includes('contract')) reason = 'Contract End';

      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    }

    const totalExits = exitedEmployees.length;
    const exitReasons = Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: totalExits > 0 ? Math.round((count / totalExits) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // 3. Department turnover
    const departments = await prisma.department.findMany({
      where: { status: 'active' },
      select: { id: true, name: true },
    });

    const departmentTurnover = await Promise.all(
      departments.slice(0, 10).map(async (dept) => {
        const deptFilter = companyId
          ? { department_id: dept.id, company_id: companyId }
          : { department_id: dept.id };

        const [exits, hires, headcount] = await Promise.all([
          prisma.employee.count({
            where: {
              ...deptFilter,
              employment_status: { in: ['resigned', 'terminated'] },
              resign_date: { gte: periodStart, lte: periodEnd },
            },
          }),
          prisma.employee.count({
            where: {
              ...deptFilter,
              OR: [
                { join_date: { gte: periodStart, lte: periodEnd } },
                { hire_date: { gte: periodStart, lte: periodEnd } },
              ],
            },
          }),
          prisma.employee.count({
            where: {
              ...deptFilter,
              employment_status: 'active',
            },
          }),
        ]);

        const turnoverRate = headcount > 0 ? parseFloat(((exits / headcount) * 100).toFixed(1)) : 0;

        return {
          name: dept.name,
          turnoverRate,
          exits,
          hires,
          netChange: hires - exits,
        };
      })
    );

    // Sort by turnover rate descending and filter out zero activity
    const filteredDeptTurnover = departmentTurnover
      .filter((d) => d.exits > 0 || d.hires > 0)
      .sort((a, b) => b.turnoverRate - a.turnoverRate);

    // 4. Tenure at exit
    const exitedWithDates = await prisma.employee.findMany({
      where: {
        ...companyFilter,
        employment_status: { in: ['resigned', 'terminated'] },
        resign_date: { gte: periodStart, lte: periodEnd },
        OR: [
          { join_date: { not: null } },
          { hire_date: { not: null } },
        ],
      },
      select: {
        join_date: true,
        hire_date: true,
        resign_date: true,
      },
    });

    const tenureBuckets = {
      '< 1 year': 0,
      '1-2 years': 0,
      '2-3 years': 0,
      '3-5 years': 0,
      '5+ years': 0,
    };

    let totalTenureMonths = 0;
    let countWithTenure = 0;

    for (const emp of exitedWithDates) {
      const startDate = emp.join_date || emp.hire_date;
      if (startDate && emp.resign_date) {
        const tenureYears = (emp.resign_date.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        totalTenureMonths += tenureYears * 12;
        countWithTenure++;

        if (tenureYears < 1) tenureBuckets['< 1 year']++;
        else if (tenureYears < 2) tenureBuckets['1-2 years']++;
        else if (tenureYears < 3) tenureBuckets['2-3 years']++;
        else if (tenureYears < 5) tenureBuckets['3-5 years']++;
        else tenureBuckets['5+ years']++;
      }
    }

    const totalWithTenure = Object.values(tenureBuckets).reduce((a, b) => a + b, 0);
    const tenureAtExit = Object.entries(tenureBuckets).map(([range, count]) => ({
      range,
      count,
      percentage: totalWithTenure > 0 ? Math.round((count / totalWithTenure) * 100) : 0,
    }));

    const avgTenureAtExit = countWithTenure > 0 ? parseFloat((totalTenureMonths / countWithTenure / 12).toFixed(1)) : 0;

    // 5. Recent exits
    const recentExitsData = await prisma.employee.findMany({
      where: {
        ...companyFilter,
        employee_id: { notIn: HIDDEN_EMPLOYEE_IDS },
        employment_status: { in: ['resigned', 'terminated'] },
        resign_date: { not: null },
      },
      select: {
        name: true,
        department: { select: { name: true } },
        position: { select: { name: true } },
        job_title: true,
        resign_date: true,
        resign_type: true,
        join_date: true,
        hire_date: true,
        company: { select: { name: true } },
      },
      orderBy: { resign_date: 'desc' },
      take: 10,
    });

    const recentExits = recentExitsData.map((emp) => {
      const startDate = emp.join_date || emp.hire_date;
      let tenure = 'N/A';
      if (startDate && emp.resign_date) {
        const months = Math.round((emp.resign_date.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
        if (months < 12) tenure = `${months} months`;
        else if (months < 24) tenure = `${Math.round(months / 12)} year`;
        else tenure = `${(months / 12).toFixed(1)} years`;
      }

      let reason = 'Other';
      if (emp.resign_type === 'voluntary') reason = 'Resignation';
      else if (emp.resign_type === 'involuntary') reason = 'Termination';
      else if (emp.resign_type === 'retirement') reason = 'Retirement';

      return {
        name: emp.name,
        department: emp.department?.name || 'N/A',
        position: emp.position?.name || emp.job_title || 'N/A',
        exitDate: emp.resign_date?.toISOString().split('T')[0] || '',
        reason,
        tenure,
        company: emp.company?.name || 'N/A',
      };
    });

    // Calculate totals for the period
    const totalHiresPeriod = monthlyTurnover.reduce((sum, m) => sum + m.hires, 0);
    const totalExitsPeriod = monthlyTurnover.reduce((sum, m) => sum + m.exits, 0);

    return {
      monthly_turnover: monthlyTurnover,
      exit_reasons: exitReasons,
      department_turnover: filteredDeptTurnover,
      tenure_at_exit: tenureAtExit,
      recent_exits: recentExits,
      avg_tenure_at_exit: avgTenureAtExit,
      total_exits_period: totalExitsPeriod,
      total_hires_period: totalHiresPeriod,
    };
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  private getCompanyFilter(user: AuthUser): any {
    const hiddenFilter = { employee_id: { notIn: HIDDEN_EMPLOYEE_IDS } };
    // Super Admin can see all
    if (user.roles.includes('Super Admin')) {
      return hiddenFilter;
    }
    // If user has accessible companies, filter by those
    if (user.accessibleCompanyIds && user.accessibleCompanyIds.length > 0) {
      return { ...hiddenFilter, company_id: { in: user.accessibleCompanyIds } };
    }
    // If user has an employee with company_id, filter by that
    if (user.employee?.company_id) {
      return { ...hiddenFilter, company_id: user.employee.company_id };
    }
    // HR Manager/CEO/Group CEO without specific company - show all (for multi-company access)
    if (user.roles.some(r => ['HR Manager', 'CEO', 'Group CEO'].includes(r))) {
      return hiddenFilter;
    }
    // Default: no access (return impossible filter)
    return { ...hiddenFilter, company_id: -1 };
  }

  private getWorkDaysInMonth(date: Date): number {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let workDays = 0;
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workDays++;
      }
    }
    return workDays;
  }
}
