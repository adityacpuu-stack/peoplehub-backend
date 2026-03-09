import { z } from 'zod';
import {
  emailSchema,
  passwordSchema,
  paginationSchema,
  searchSchema,
  idParamSchema,
} from './common.schema';

// ==========================================
// USER VALIDATION SCHEMAS
// ==========================================

// Create user
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  employee_id: z.number().int().positive().optional(),
  role_ids: z.array(z.number().int().positive()).optional(),
  is_active: z.boolean().optional(),
});

// Update user (all fields optional)
export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  password: passwordSchema.optional(),
  is_active: z.boolean().optional(),
  role_ids: z.array(z.number().int().positive()).optional(),
});

// List users query
export const listUsersQuerySchema = paginationSchema.merge(searchSchema).extend({
  is_active: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  role_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
});

// Update preferences
export const updatePreferencesSchema = z.object({
  email_attendance_reminder: z.boolean().optional(),
  email_leave_request: z.boolean().optional(),
  email_leave_approval: z.boolean().optional(),
  email_payslip: z.boolean().optional(),
  email_birthday: z.boolean().optional(),
  email_contract_expiry: z.boolean().optional(),
  whatsapp_enabled: z.boolean().optional(),
  whatsapp_attendance: z.boolean().optional(),
  whatsapp_approval: z.boolean().optional(),
}).strict();

// Re-export idParamSchema for route params
export { idParamSchema as userIdParamSchema };

// Type exports
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
