import { z } from 'zod';
import { paginationSchema, searchSchema } from './common.schema';

// ==========================================
// LEAVE TYPE SCHEMAS
// ==========================================

export const leaveTypeListQuerySchema = paginationSchema.merge(searchSchema).extend({
  company_id: z.coerce.number().int().positive().optional(),
  is_active: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  is_paid: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export const createLeaveTypeSchema = z.object({
  company_id: z.number().int().positive().optional(),
  name: z.string().min(1, { message: 'Name is required' }).max(100),
  code: z.string().min(1).max(20).optional(),
  description: z.string().max(500).optional(),
  default_days: z.number().nonnegative().optional(),
  max_days_per_request: z.number().nonnegative().optional(),
  min_days_per_request: z.number().nonnegative().optional(),
  is_paid: z.boolean().optional(),
  requires_document: z.boolean().optional(),
  document_types: z.array(z.string()).optional(),
  requires_approval: z.boolean().optional(),
  min_notice_days: z.number().int().nonnegative().optional(),
  max_advance_days: z.number().int().nonnegative().optional(),
  approval_flow: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().nonnegative().optional(),
  color: z.string().max(20).optional(),
  icon: z.string().max(50).optional(),
  can_carry_forward: z.boolean().optional(),
  max_carry_forward_days: z.number().int().nonnegative().optional(),
  carry_forward_expiry_months: z.number().int().nonnegative().optional(),
  prorate_on_join: z.boolean().optional(),
  eligibility_rules: z.any().optional(),
  gender_specific: z.string().max(20).optional(),
  available_during_probation: z.boolean().optional(),
});

export const updateLeaveTypeSchema = createLeaveTypeSchema.partial();

export const seedLeaveTypesSchema = z.object({
  company_id: z.number().int().positive().nullable().optional(),
});

// ==========================================
// LEAVE ENTITLEMENT SCHEMAS
// ==========================================

export const leaveEntitlementListQuerySchema = paginationSchema.extend({
  company_id: z.coerce.number().int().positive().optional(),
  leave_type_id: z.coerce.number().int().positive().optional(),
  is_active: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export const createLeaveEntitlementSchema = z.object({
  company_id: z.number().int().positive().optional(),
  leave_type_id: z.number().int().positive().optional(),
  name: z.string().min(1, { message: 'Name is required' }).max(100),
  description: z.string().max(500).optional(),
  quota_type: z.string().max(50).optional(),
  quota_days: z.number().nonnegative().optional(),
  accrual_frequency: z.string().max(50).optional(),
  accrual_rate: z.number().nonnegative().optional(),
  accrual_cap: z.number().nonnegative().optional(),
  allow_carry_forward: z.boolean().optional(),
  max_carry_forward: z.number().int().nonnegative().optional(),
  carry_forward_expiry_months: z.number().int().nonnegative().optional(),
  allow_negative_balance: z.boolean().optional(),
  max_negative_balance: z.number().nonnegative().optional(),
  prorate_on_join: z.boolean().optional(),
  prorate_on_resign: z.boolean().optional(),
  min_service_months: z.number().int().nonnegative().optional(),
  applicable_departments: z.array(z.number().int().positive()).optional(),
  applicable_positions: z.array(z.number().int().positive()).optional(),
  applicable_employment_types: z.array(z.string()).optional(),
  effective_from: z.coerce.date().optional(),
  effective_until: z.coerce.date().optional(),
  is_active: z.boolean().optional(),
});

export const updateLeaveEntitlementSchema = createLeaveEntitlementSchema.partial();

// ==========================================
// EMPLOYEE LEAVE BALANCE SCHEMAS
// ==========================================

export const employeeLeaveBalanceQuerySchema = z.object({
  employee_id: z.coerce.number().int().positive().optional(),
  leave_type_id: z.coerce.number().int().positive().optional(),
  year: z.coerce.number().int().positive().optional(),
});

export const createEmployeeLeaveBalanceSchema = z.object({
  employee_id: z.number().int().positive({ message: 'Employee ID is required' }),
  leave_type_id: z.number().int().positive().optional(),
  year: z.number().int().min(2000).max(2100, { message: 'Year must be between 2000 and 2100' }),
  allocated_days: z.number().nonnegative({ message: 'Allocated days must be non-negative' }),
  carried_forward_days: z.number().nonnegative().optional(),
  adjustment_days: z.number().optional(),
  adjustment_reason: z.string().max(500).optional(),
  expires_at: z.coerce.date().optional(),
});

export const updateEmployeeLeaveBalanceSchema = z.object({
  allocated_days: z.number().nonnegative().optional(),
  used_days: z.number().nonnegative().optional(),
  pending_days: z.number().nonnegative().optional(),
  carried_forward_days: z.number().nonnegative().optional(),
  adjustment_days: z.number().optional(),
  adjustment_reason: z.string().max(500).optional(),
  expires_at: z.coerce.date().optional(),
});

export const adjustLeaveBalanceSchema = z.object({
  adjustment_days: z.number({ message: 'Adjustment days is required' }),
  adjustment_reason: z.string().min(1, { message: 'Adjustment reason is required' }).max(500),
});

export const initializeBalancesSchema = z.object({
  year: z.number().int().min(2000).max(2100).optional(),
  company_id: z.number().int().positive().nullable().optional(),
});

export const carryForwardSchema = z.object({
  from_year: z.number().int().min(2000).max(2100, { message: 'from_year is required' }),
  to_year: z.number().int().min(2000).max(2100, { message: 'to_year is required' }),
});
