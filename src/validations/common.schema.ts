import { z } from 'zod';

// ==========================================
// COMMON VALIDATION SCHEMAS
// ==========================================

// Pagination query
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(10000).default(20),
});

// ID parameter
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Search query
export const searchSchema = z.object({
  search: z.string().optional(),
});

// Date range query
export const dateRangeSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
  },
  { message: 'start_date must be before end_date' }
);

// Common list query (pagination + search)
export const listQuerySchema = paginationSchema.merge(searchSchema);

// ==========================================
// FIELD VALIDATORS
// ==========================================

// Email
export const emailSchema = z.string().email('Invalid email format').toLowerCase();

// Password (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Phone number (Indonesian format)
export const phoneSchema = z
  .string()
  .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Invalid phone number format');

// Indonesian NIK (16 digits)
export const nikSchema = z
  .string()
  .length(16, 'NIK must be 16 digits')
  .regex(/^\d+$/, 'NIK must contain only numbers');

// NPWP (15 or 16 digits with optional dots/dashes)
export const npwpSchema = z
  .string()
  .regex(/^[\d.-]{15,20}$/, 'Invalid NPWP format');

// Date string (YYYY-MM-DD)
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

// Time string (HH:MM or HH:MM:SS)
export const timeStringSchema = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be in HH:MM or HH:MM:SS format');

// Positive number
export const positiveNumberSchema = z.coerce.number().positive();

// Non-negative number
export const nonNegativeNumberSchema = z.coerce.number().nonnegative();

// Percentage (0-100)
export const percentageSchema = z.coerce.number().min(0).max(100);

// Currency amount (up to 2 decimal places)
export const currencySchema = z.coerce
  .number()
  .nonnegative()
  .multipleOf(0.01);

// ==========================================
// ENUM SCHEMAS
// ==========================================

export const genderSchema = z.enum(['male', 'female']);

export const employmentStatusSchema = z.enum([
  'active',
  'inactive',
  'terminated',
  'resigned',
  'retired',
  'all',
]);

export const maritalStatusSchema = z.enum([
  'single',
  'married',
  'divorced',
  'widowed',
]);

export const educationLevelSchema = z.enum([
  'sd',
  'smp',
  'sma',
  'd1',
  'd2',
  'd3',
  'd4',
  's1',
  's2',
  's3',
]);

export const approvalStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'cancelled',
]);

export const prioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

// Make all fields optional
export const makeOptional = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => {
  return schema.partial();
};
