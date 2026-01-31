// Overtime status
export const OVERTIME_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

// Overtime types
export const OVERTIME_TYPES = {
  REGULAR: 'regular',
  WEEKEND: 'weekend',
  HOLIDAY: 'holiday',
} as const;

// Query parameters for listing overtime
export interface OvertimeListQuery {
  page?: number;
  limit?: number;
  employee_id?: number;
  company_id?: number;
  department_id?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  overtime_type?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Create overtime request DTO
export interface CreateOvertimeDTO {
  date: string;
  start_time?: string;
  end_time?: string;
  hours?: number; // Direct hours input (takes precedence over start/end time calculation)
  break_duration?: number; // minutes
  reason: string;
  task_description?: string;
  overtime_type?: string;
  rate_multiplier?: number;
}

// Create overtime for employee (HR)
export interface CreateOvertimeForEmployeeDTO extends CreateOvertimeDTO {
  employee_id: number;
}

// Update overtime DTO
export interface UpdateOvertimeDTO {
  date?: string;
  start_time?: string;
  end_time?: string;
  break_duration?: number;
  reason?: string;
  task_description?: string;
  overtime_type?: string;
}

// Approve/Reject overtime DTO
export interface ApproveOvertimeDTO {
  approval_notes?: string;
}

export interface RejectOvertimeDTO {
  rejection_reason: string;
}

// Overtime response
export interface OvertimeResponse {
  id: number;
  date: Date;
  start_time: Date | null;
  end_time: Date | null;
  hours: number;
  break_duration: number | null;
  reason: string | null;
  status: string;
  overtime_type: string | null;
  total_amount: number | null;
  employee: {
    id: number;
    name: string;
    employee_id: string | null;
  };
}

// Overtime select fields for list view
export const OVERTIME_LIST_SELECT = {
  id: true,
  date: true,
  start_time: true,
  end_time: true,
  hours: true,
  break_duration: true,
  reason: true,
  status: true,
  overtime_type: true,
  rate_multiplier: true,
  rate_per_hour: true,
  total_amount: true,
  employee: {
    select: {
      id: true,
      name: true,
      employee_id: true,
      department: { select: { id: true, name: true } },
    },
  },
  approver: {
    select: { id: true, name: true },
  },
  created_at: true,
} as const;

// Overtime select fields for detail view
export const OVERTIME_DETAIL_SELECT = {
  ...OVERTIME_LIST_SELECT,
  task_description: true,
  rejection_reason: true,
  approval_notes: true,
  approved_at: true,
  company_id: true,
  department: {
    select: { id: true, name: true },
  },
  updated_at: true,
} as const;
