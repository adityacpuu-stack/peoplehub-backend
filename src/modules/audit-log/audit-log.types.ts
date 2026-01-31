import { Prisma } from '@prisma/client';

// ==========================================
// QUERY TYPES
// ==========================================

export interface AuditLogListQuery {
  page?: number;
  limit?: number;
  user_id?: number;
  action?: string;
  model?: string;
  model_id?: number;
  start_date?: string;
  end_date?: string;
  ip_address?: string;
}

// ==========================================
// DTO TYPES
// ==========================================

export interface CreateAuditLogDTO {
  user_id?: number;
  user_email?: string;
  employee_name?: string;
  action: string;
  model?: string;
  model_id?: number;
  description?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  url?: string;
  method?: string;
}

// ==========================================
// ENUMS
// ==========================================

export const AUDIT_ACTIONS = [
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'view',
  'export',
  'import',
  'approve',
  'reject',
  'submit',
  'cancel',
  'archive',
  'restore',
] as const;

export const AUDIT_MODELS = [
  'User',
  'Employee',
  'Department',
  'Position',
  'Attendance',
  'Leave',
  'Overtime',
  'Payroll',
  'Contract',
  'Document',
  'Performance',
  'Goal',
  'KPI',
  'Setting',
] as const;

// ==========================================
// SELECT TYPES
// ==========================================

export const AUDIT_LOG_SELECT = {
  id: true,
  user_id: true,
  user_email: true,
  employee_name: true,
  action: true,
  model: true,
  model_id: true,
  description: true,
  ip_address: true,
  method: true,
  url: true,
  created_at: true,
} satisfies Prisma.AuditLogSelect;

export const AUDIT_LOG_DETAIL_SELECT = {
  ...AUDIT_LOG_SELECT,
  old_values: true,
  new_values: true,
  user_agent: true,
  user: {
    select: {
      id: true,
      email: true,
      employee: {
        select: {
          id: true,
          name: true,
          employee_id: true,
        },
      },
    },
  },
} satisfies Prisma.AuditLogSelect;

// ==========================================
// HELPER TYPES
// ==========================================

export interface AuditContext {
  user_id?: number;
  user_email?: string;
  employee_name?: string;
  ip_address?: string;
  user_agent?: string;
  url?: string;
  method?: string;
}

export interface AuditLogStatistics {
  total_logs: number;
  by_action: { action: string; count: number }[];
  by_model: { model: string; count: number }[];
  by_user: { user_email: string; count: number }[];
  recent_activity: { date: string; count: number }[];
}
