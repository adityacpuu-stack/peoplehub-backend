import { z } from 'zod';
import {
  emailSchema,
  phoneSchema,
  nikSchema,
  npwpSchema,
  dateStringSchema,
  genderSchema,
  maritalStatusSchema,
  employmentStatusSchema,
  educationLevelSchema,
  paginationSchema,
  searchSchema,
} from './common.schema';

// ==========================================
// EMPLOYEE VALIDATION SCHEMAS
// ==========================================

// Create employee
export const createEmployeeSchema = z.object({
  employee_id: z.string().min(1, 'Employee ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  phone: phoneSchema.optional(),
  nik: nikSchema.optional(),
  npwp: npwpSchema.optional(),
  gender: genderSchema.optional(),
  birth_date: dateStringSchema.optional(),
  birth_place: z.string().optional(),
  marital_status: maritalStatusSchema.optional(),
  religion: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postal_code: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: phoneSchema.optional(),
  emergency_contact_relation: z.string().optional(),
  company_id: z.number().int().positive(),
  department_id: z.number().int().positive().optional(),
  position_id: z.number().int().positive().optional(),
  manager_id: z.number().int().positive().optional(),
  employment_status: employmentStatusSchema.default('active'),
  employment_type: z.enum(['permanent', 'contract', 'internship', 'freelance']).optional(),
  join_date: dateStringSchema,
  education_level: educationLevelSchema.optional(),
  education_institution: z.string().optional(),
  education_major: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_account_name: z.string().optional(),
  basic_salary: z.number().nonnegative().optional(),
  ptkp_status: z.string().optional(),
});

// Update employee (all fields optional)
export const updateEmployeeSchema = createEmployeeSchema.partial();

// List employees query
export const listEmployeesQuerySchema = paginationSchema.merge(searchSchema).extend({
  company_id: z.coerce.number().int().positive().optional(),
  department_id: z.coerce.number().int().positive().optional(),
  position_id: z.coerce.number().int().positive().optional(),
  employment_status: employmentStatusSchema.optional(),
  employment_type: z.enum(['permanent', 'contract', 'internship', 'freelance']).optional(),
});

// Type exports
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
