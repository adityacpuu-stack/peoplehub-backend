// ==========================================
// DASHBOARD RESPONSE TYPES
// ==========================================

export interface DashboardOverview {
  employee: EmployeeSummary;
  attendance: AttendanceSummary;
  leave: LeaveSummary;
  payroll: PayrollSummary;
  performance: PerformanceSummary;
  alerts: DashboardAlert[];
}

export interface EmployeeSummary {
  total: number;
  active: number;
  inactive: number;
  new_this_month: number;
  by_department: { department: string; count: number }[];
  by_employment_type: { type: string; count: number }[];
  gender_distribution: { gender: string; count: number }[];
}

export interface AttendanceSummary {
  today: {
    total_expected: number;
    checked_in: number;
    checked_out: number;
    late: number;
    absent: number;
    on_leave: number;
  };
  this_week: {
    avg_check_in_time: string | null;
    avg_work_hours: number | null;
    late_count: number;
    absent_count: number;
  };
  this_month: {
    total_work_days: number;
    avg_attendance_rate: number;
  };
}

export interface LeaveSummary {
  pending_requests: number;
  approved_this_month: number;
  rejected_this_month: number;
  on_leave_today: number;
  upcoming_leaves: {
    employee_name: string;
    leave_type: string;
    start_date: string;
    end_date: string;
  }[];
  by_type: { type: string; count: number }[];
}

export interface PayrollSummary {
  current_period: {
    period: string;
    status: string;
    total_employees: number;
    total_gross: number;
    total_deductions: number;
    total_net: number;
  } | null;
  pending_adjustments: number;
  pending_overtime: number;
}

export interface PerformanceSummary {
  active_cycles: number;
  pending_reviews: number;
  completed_reviews_this_month: number;
  avg_performance_score: number | null;
  goals: {
    total: number;
    in_progress: number;
    completed: number;
    overdue: number;
  };
}

export interface DashboardAlert {
  id: string;
  type: 'warning' | 'info' | 'error' | 'success';
  category: string;
  title: string;
  message: string;
  count?: number;
  action_url?: string;
  created_at: string;
}

// ==========================================
// CALENDAR & EVENTS
// ==========================================

export interface CalendarEvent {
  id: string;
  type: 'birthday' | 'anniversary' | 'holiday' | 'leave' | 'contract_expiry' | 'review';
  title: string;
  date: string;
  employee_id?: number;
  employee_name?: string;
  metadata?: Record<string, any>;
}

export interface UpcomingEvent {
  date: string;
  events: CalendarEvent[];
}

// ==========================================
// QUICK STATS
// ==========================================

export interface QuickStats {
  total_employees: number;
  active_employees: number;
  new_hires_this_month: number;
  departments_count: number;
  attendance_today: {
    present: number;
    absent: number;
    late: number;
    on_leave: number;
  };
  pending_requests: {
    leave: number;
    overtime: number;
  };
}

// ==========================================
// TEAM DASHBOARD (FOR MANAGERS)
// ==========================================

export interface TeamDashboard {
  team_size: number;
  present_today: number;
  on_leave_today: number;
  pending_leave_requests: number;
  pending_overtime_requests: number;
  team_goals: {
    total: number;
    completed: number;
    in_progress: number;
    overdue: number;
  };
  team_members: {
    id: number;
    employee_id: string;
    name: string;
    email: string;
    phone: string;
    position: string;
    department: string;
    avatar: string | null;
    join_date: string | Date | null;
    status_today: 'present' | 'absent' | 'leave' | 'late' | 'not_checked_in';
    check_in_time: string | null;
    pending_leaves: number;
  }[];
}

// ==========================================
// MY DASHBOARD (FOR EMPLOYEES)
// ==========================================

export interface MyDashboard {
  attendance: {
    today_status: 'checked_in' | 'checked_out' | 'not_checked_in' | 'on_leave';
    check_in_time: string | null;
    check_out_time: string | null;
    this_month: {
      present_days: number;
      late_days: number;
      absent_days: number;
      leave_days: number;
    };
  };
  attendance_history: {
    date: string;
    check_in: string | null;
    check_out: string | null;
    status: 'present' | 'late' | 'absent' | 'on_leave';
    hours: number;
  }[];
  leave_balance: {
    type: string;
    total: number;
    used: number;
    remaining: number;
  }[];
  recent_requests: {
    id: number;
    type: 'leave' | 'overtime';
    detail: string;
    status: 'pending' | 'approved' | 'rejected';
    date: string;
  }[];
  announcements: {
    id: number;
    title: string;
    category: string;
    date: string;
    is_new: boolean;
  }[];
  pending_requests: {
    leave: number;
    overtime: number;
  };
  goals: {
    total: number;
    completed: number;
    in_progress: number;
    overdue: number;
  };
  upcoming_events: CalendarEvent[];
}

// ==========================================
// GROUP CEO DASHBOARD
// ==========================================

export interface GroupDashboard {
  summary: {
    total_companies: number;
    total_employees: number;
    total_departments: number;
    avg_attendance_rate: number;
    total_on_leave_today: number;
    pending_approvals: number;
    new_hires_this_month: number;
    terminations_this_month: number;
  };
  companies: CompanyOverview[];
  headcount_trend: {
    month: string;
    headcount: number;
    hires: number;
    exits: number;
  }[];
  department_distribution: {
    name: string;
    employees: number;
    percentage: number;
  }[];
  payroll_summary: {
    total_monthly_payroll: number;
    avg_salary: number;
    by_company: {
      company_name: string;
      total_payroll: number;
      employee_count: number;
    }[];
  };
  recent_activities: GroupActivity[];
  alerts: DashboardAlert[];
}

export interface CompanyOverview {
  id: number;
  name: string;
  employees: number;
  active_employees: number;
  attendance_rate: number; // -1 means N/A (attendance not enabled)
  attendance_enabled: boolean;
  on_leave_today: number;
  pending_leaves: number;
  new_hires_this_month: number;
}

export interface GroupActivity {
  id: number;
  type: 'hire' | 'exit' | 'promotion' | 'leave' | 'transfer';
  action: string;
  company_name: string;
  employee_name: string;
  created_at: string;
}
