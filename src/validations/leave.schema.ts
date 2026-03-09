import { z } from 'zod';
import {
  paginationSchema,
  searchSchema,
  dateStringSchema,
} from './common.schema';

// ==========================================
// LEAVE VALIDATION SCHEMAS
// ==========================================

// Leave status enum
const leaveStatusSchema = z.enum(['pending', 'approved', 'rejected', 'cancelled', 'returned']);

// Holiday type enum
const holidayTypeSchema = z.enum(['national', 'company', 'religious', 'cuti_bersama']);

// ==========================================
// LEAVE TYPE SCHEMAS
// ==========================================

export const createLeaveTypeSchema = z.object({
  company_id: z.number().int().positive().optional(),
  name: z.string().min(1, 'Name is required'),
  code: z.string().optional(),
  description: z.string().optional(),
  default_days: z.number().nonnegative().optional(),
  max_days_per_request: z.number().positive().optional(),
  min_days_per_request: z.number().positive().optional(),
  is_paid: z.boolean().optional(),
  requires_document: z.boolean().optional(),
  document_types: z.array(z.string()).optional(),
  requires_approval: z.boolean().optional(),
  min_notice_days: z.number().int().nonnegative().optional(),
  max_advance_days: z.number().int().nonnegative().optional(),
  approval_flow: z.array(z.string()).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  can_carry_forward: z.boolean().optional(),
  max_carry_forward_days: z.number().nonnegative().optional(),
  carry_forward_expiry_months: z.number().int().positive().optional(),
  prorate_on_join: z.boolean().optional(),
  eligibility_rules: z.record(z.string(), z.any()).optional(),
  gender_specific: z.string().optional(),
  sort_order: z.number().int().nonnegative().optional(),
});

export const updateLeaveTypeSchema = createLeaveTypeSchema.partial().extend({
  is_active: z.boolean().optional(),
});

export const listLeaveTypesQuerySchema = paginationSchema.merge(searchSchema).extend({
  company_id: z.coerce.number().int().positive().optional(),
  is_active: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

// ==========================================
// LEAVE SCHEMAS
// ==========================================

export const createLeaveSchema = z.object({
  leave_type_id: z.number().int().positive().optional(),
  start_date: dateStringSchema,
  end_date: dateStringSchema,
  start_half_day: z.boolean().optional(),
  end_half_day: z.boolean().optional(),
  reason: z.string().optional(),
  is_emergency: z.boolean().optional(),
  contact_during_leave: z.string().optional(),
  work_handover: z.string().optional(),
});

export const createLeaveForEmployeeSchema = createLeaveSchema.extend({
  employee_id: z.number().int().positive({ message: 'Employee ID is required' }),
});

export const updateLeaveSchema = z.object({
  start_date: dateStringSchema.optional(),
  end_date: dateStringSchema.optional(),
  start_half_day: z.boolean().optional(),
  end_half_day: z.boolean().optional(),
  reason: z.string().optional(),
  is_emergency: z.boolean().optional(),
  contact_during_leave: z.string().optional(),
  work_handover: z.string().optional(),
});

export const approveLeaveSchema = z.object({
  approval_notes: z.string().optional(),
});

export const rejectLeaveSchema = z.object({
  rejection_reason: z.string().min(1, 'Rejection reason is required'),
});

export const listLeavesQuerySchema = paginationSchema.extend({
  employee_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  department_id: z.coerce.number().int().positive().optional(),
  leave_type_id: z.coerce.number().int().positive().optional(),
  status: leaveStatusSchema.optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

export const myLeavesQuerySchema = paginationSchema.extend({
  leave_type_id: z.coerce.number().int().positive().optional(),
  status: leaveStatusSchema.optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  sort_by: z.string().default('start_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// ==========================================
// LEAVE BALANCE SCHEMAS
// ==========================================

export const leaveBalancesQuerySchema = z.object({
  employee_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  department_id: z.coerce.number().int().positive().optional(),
  year: z.coerce.number().int().positive().optional(),
  leave_type_id: z.coerce.number().int().positive().optional(),
});

export const adjustLeaveBalanceSchema = z.object({
  employee_id: z.number().int().positive({ message: 'Employee ID is required' }),
  leave_type_id: z.number().int().positive({ message: 'Leave type ID is required' }),
  year: z.number().int().positive({ message: 'Year is required' }),
  adjustment_days: z.number({ message: 'Adjustment days is required' }),
  adjustment_reason: z.string().min(1, 'Adjustment reason is required'),
});

export const allocateLeaveSchema = z.object({
  employee_id: z.number().int().positive({ message: 'Employee ID is required' }),
  leave_type_id: z.number().int().positive({ message: 'Leave type ID is required' }),
  year: z.number().int().positive({ message: 'Year is required' }),
  allocated_days: z.number().nonnegative({ message: 'Allocated days is required' }),
  carried_forward_days: z.number().nonnegative().optional(),
  expires_at: z.string().optional(),
});

// ==========================================
// HOLIDAY SCHEMAS
// ==========================================

export const createHolidaySchema = z.object({
  company_id: z.number().int().positive().optional(),
  name: z.string().min(1, 'Name is required'),
  date: dateStringSchema,
  type: holidayTypeSchema,
  description: z.string().optional(),
  is_recurring: z.boolean().optional(),
});

export const updateHolidaySchema = createHolidaySchema.partial().extend({
  is_active: z.boolean().optional(),
});

export const listHolidaysQuerySchema = paginationSchema.extend({
  company_id: z.coerce.number().int().positive().optional(),
  year: z.coerce.number().int().positive().optional(),
  type: holidayTypeSchema.optional(),
  is_active: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

// Pending approvals query
export const pendingApprovalsQuerySchema = z.object({
  status: z.string().optional(),
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>;
export type UpdateLeaveTypeInput = z.infer<typeof updateLeaveTypeSchema>;
export type ListLeaveTypesQuery = z.infer<typeof listLeaveTypesQuerySchema>;
export type CreateLeaveInput = z.infer<typeof createLeaveSchema>;
export type CreateLeaveForEmployeeInput = z.infer<typeof createLeaveForEmployeeSchema>;
export type UpdateLeaveInput = z.infer<typeof updateLeaveSchema>;
export type ApproveLeaveInput = z.infer<typeof approveLeaveSchema>;
export type RejectLeaveInput = z.infer<typeof rejectLeaveSchema>;
export type ListLeavesQuery = z.infer<typeof listLeavesQuerySchema>;
export type LeaveBalancesQuery = z.infer<typeof leaveBalancesQuerySchema>;
export type AdjustLeaveBalanceInput = z.infer<typeof adjustLeaveBalanceSchema>;
export type AllocateLeaveInput = z.infer<typeof allocateLeaveSchema>;
export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;
export type UpdateHolidayInput = z.infer<typeof updateHolidaySchema>;
export type ListHolidaysQuery = z.infer<typeof listHolidaysQuerySchema>;
