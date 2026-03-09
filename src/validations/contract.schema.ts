import { z } from 'zod';
import {
  paginationSchema,
  dateStringSchema,
  idParamSchema,
} from './common.schema';

// ==========================================
// ENUM SCHEMAS
// ==========================================

export const contractTypeSchema = z.enum([
  'permanent',
  'contract',
  'probation',
  'internship',
  'part_time',
]);

export const contractStatusSchema = z.enum([
  'draft',
  'pending',
  'active',
  'expired',
  'terminated',
  'renewed',
]);

export const movementTypeSchema = z.enum([
  'promotion',
  'demotion',
  'transfer',
  'mutation',
  'salary_adjustment',
  'grade_change',
  'status_change',
]);

export const movementStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
]);

// ==========================================
// PARAM SCHEMAS
// ==========================================

export const contractIdParamSchema = idParamSchema;

export const employeeIdParamSchema = z.object({
  employeeId: z.coerce.number().int().positive({ message: 'Invalid employee ID' }),
});

// ==========================================
// CONTRACT BODY SCHEMAS
// ==========================================

// Create contract
export const createContractSchema = z.object({
  employee_id: z.number().int().positive({ message: 'Employee ID is required' }),
  contract_type: contractTypeSchema,
  start_date: dateStringSchema,
  end_date: dateStringSchema.optional(),
  duration_months: z.number().int().positive().optional(),
  salary: z.number().nonnegative().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  terms: z.string().optional(),
  benefits: z.record(z.string(), z.any()).optional(),
  notes: z.string().optional(),
});

// Update contract
export const updateContractSchema = z.object({
  contract_type: contractTypeSchema.optional(),
  start_date: dateStringSchema.optional(),
  end_date: dateStringSchema.optional(),
  duration_months: z.number().int().positive().optional(),
  salary: z.number().nonnegative().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  terms: z.string().optional(),
  benefits: z.record(z.string(), z.any()).optional(),
  notes: z.string().optional(),
  status: contractStatusSchema.optional(),
});

// Renew contract
export const renewContractSchema = z.object({
  new_start_date: dateStringSchema,
  new_end_date: dateStringSchema.optional(),
  duration_months: z.number().int().positive().optional(),
  new_salary: z.number().nonnegative().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
});

// Terminate contract
export const terminateContractSchema = z.object({
  termination_date: dateStringSchema,
  termination_reason: z.string().min(1, 'Termination reason is required'),
});

// ==========================================
// CONTRACT QUERY SCHEMAS
// ==========================================

export const listContractsQuerySchema = paginationSchema.extend({
  employee_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  contract_type: contractTypeSchema.optional(),
  status: contractStatusSchema.optional(),
  expiring_within_days: z.coerce.number().int().positive().optional(),
  sort_by: z.enum(['created_at', 'start_date', 'end_date', 'contract_type', 'status']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export const expiringContractsQuerySchema = z.object({
  days: z.coerce.number().int().positive().default(30),
  company_id: z.coerce.number().int().positive().optional(),
});

// ==========================================
// MOVEMENT BODY SCHEMAS
// ==========================================

// Create movement
export const createMovementSchema = z.object({
  employee_id: z.number().int().positive({ message: 'Employee ID is required' }),
  movement_type: movementTypeSchema,
  effective_date: dateStringSchema,
  new_position_id: z.number().int().positive().optional(),
  new_department_id: z.number().int().positive().optional(),
  new_company_id: z.number().int().positive().optional(),
  new_salary: z.number().nonnegative().optional(),
  new_grade: z.string().optional(),
  new_status: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

// Approve movement
export const approveMovementSchema = z.object({
  approval_notes: z.string().optional(),
});

// Reject movement
export const rejectMovementSchema = z.object({
  rejection_reason: z.string().min(1, 'Rejection reason is required'),
});

// ==========================================
// MOVEMENT QUERY SCHEMAS
// ==========================================

export const listMovementsQuerySchema = paginationSchema.extend({
  employee_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  movement_type: movementTypeSchema.optional(),
  status: movementStatusSchema.optional(),
  start_date: dateStringSchema.optional(),
  end_date: dateStringSchema.optional(),
  sort_by: z.enum(['created_at', 'effective_date', 'movement_type', 'status']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
export type RenewContractInput = z.infer<typeof renewContractSchema>;
export type TerminateContractInput = z.infer<typeof terminateContractSchema>;
export type ListContractsQuery = z.infer<typeof listContractsQuerySchema>;
export type ExpiringContractsQuery = z.infer<typeof expiringContractsQuerySchema>;
export type CreateMovementInput = z.infer<typeof createMovementSchema>;
export type ApproveMovementInput = z.infer<typeof approveMovementSchema>;
export type RejectMovementInput = z.infer<typeof rejectMovementSchema>;
export type ListMovementsQuery = z.infer<typeof listMovementsQuerySchema>;
