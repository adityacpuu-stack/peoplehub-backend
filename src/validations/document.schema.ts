import { z } from 'zod';
import { paginationSchema, searchSchema, dateStringSchema, idParamSchema } from './common.schema';

// ==========================================
// DOCUMENT ENUM SCHEMAS
// ==========================================

export const documentTypeSchema = z.enum(['policy', 'form', 'template', 'report', 'other']);

export const documentStatusSchema = z.enum(['active', 'archived', 'deleted']);

export const documentVisibilitySchema = z.enum(['public', 'company', 'department', 'private']);

export const employeeDocumentTypeSchema = z.enum([
  'ktp',
  'family_card',
  'npwp',
  'bpjs_tk',
  'bpjs_kes',
  'bank_account',
  'cv',
  'ijazah',
  'certificate',
  'contract',
  'photo',
  'other',
]);

export const sortOrderSchema = z.enum(['asc', 'desc']);

// ==========================================
// PARAMS SCHEMAS
// ==========================================

export const documentIdParamSchema = idParamSchema;

export const employeeIdParamSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
});

// ==========================================
// QUERY SCHEMAS - Company Documents
// ==========================================

export const documentListQuerySchema = paginationSchema.merge(searchSchema).extend({
  company_id: z.coerce.number().int().positive().optional(),
  category_id: z.coerce.number().int().positive().optional(),
  document_type: documentTypeSchema.optional(),
  status: documentStatusSchema.optional(),
  visibility: documentVisibilitySchema.optional(),
  sort_by: z.string().optional(),
  sort_order: sortOrderSchema.optional(),
});

// ==========================================
// QUERY SCHEMAS - Employee Documents
// ==========================================

export const employeeDocumentListQuerySchema = paginationSchema.merge(searchSchema).extend({
  employee_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  department_id: z.coerce.number().int().positive().optional(),
  document_type: z.string().optional(),
  is_verified: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
  is_expired: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
  expiring_within_days: z.coerce.number().int().positive().optional(),
  sort_by: z.string().optional(),
  sort_order: sortOrderSchema.optional(),
});

export const expiringDocumentsQuerySchema = z.object({
  days: z.coerce.number().int().positive().default(30),
  company_id: z.coerce.number().int().positive().optional(),
});

export const companyIdQuerySchema = z.object({
  company_id: z.coerce.number().int().positive().optional(),
});

// ==========================================
// QUERY SCHEMAS - Document Categories
// ==========================================

export const categoryListQuerySchema = paginationSchema.merge(searchSchema).extend({
  parent_id: z.coerce.number().int().positive().optional(),
  is_active: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
});

// ==========================================
// BODY SCHEMAS - Company Documents
// ==========================================

export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  file_path: z.string().min(1, 'File path is required'),
  file_name: z.string().optional(),
  file_size: z.number().nonnegative().optional(),
  file_type: z.string().optional(),
  mime_type: z.string().optional(),
  document_type: documentTypeSchema.optional(),
  category_id: z.number().int().positive().optional(),
  employee_id: z.number().int().positive().optional(),
  expiry_date: dateStringSchema.optional(),
  tags: z.array(z.string()).optional(),
  visibility: documentVisibilitySchema.optional(),
  is_required: z.boolean().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').optional(),
  description: z.string().optional(),
  document_type: documentTypeSchema.optional(),
  category_id: z.number().int().positive().optional(),
  expiry_date: dateStringSchema.optional(),
  tags: z.array(z.string()).optional(),
  status: documentStatusSchema.optional(),
  visibility: documentVisibilitySchema.optional(),
  is_required: z.boolean().optional(),
});

// ==========================================
// BODY SCHEMAS - Employee Documents
// ==========================================

export const createEmployeeDocumentSchema = z.object({
  employee_id: z.number().int().positive({ message: 'Employee ID is required' }),
  document_name: z.string().min(1, 'Document name is required'),
  document_type: z.string().min(1, 'Document type is required'),
  file_path: z.string().min(1, 'File path is required'),
  file_name: z.string().optional(),
  file_size: z.number().nonnegative().optional(),
  mime_type: z.string().optional(),
  document_number: z.string().optional(),
  description: z.string().optional(),
  issue_date: dateStringSchema.optional(),
  expiry_date: dateStringSchema.optional(),
  issuing_authority: z.string().optional(),
  is_required: z.boolean().optional(),
  is_confidential: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export const uploadMyDocumentSchema = z.object({
  document_name: z.string().min(1, 'Document name is required'),
  document_type: z.string().min(1, 'Document type is required'),
  file_path: z.string().min(1, 'File path is required'),
  file_name: z.string().optional(),
  file_size: z.number().nonnegative().optional(),
  mime_type: z.string().optional(),
  document_number: z.string().optional(),
  description: z.string().optional(),
  issue_date: dateStringSchema.optional(),
  expiry_date: dateStringSchema.optional(),
  issuing_authority: z.string().optional(),
  is_required: z.boolean().optional(),
  is_confidential: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateEmployeeDocumentSchema = z.object({
  document_name: z.string().min(1, 'Document name cannot be empty').optional(),
  document_type: z.string().min(1, 'Document type cannot be empty').optional(),
  document_number: z.string().optional(),
  description: z.string().optional(),
  issue_date: dateStringSchema.optional(),
  expiry_date: dateStringSchema.optional(),
  issuing_authority: z.string().optional(),
  is_required: z.boolean().optional(),
  is_confidential: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export const verifyEmployeeDocumentSchema = z.object({
  verification_notes: z.string().optional(),
});

// ==========================================
// BODY SCHEMAS - Document Categories
// ==========================================

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  code: z.string().optional(),
  description: z.string().optional(),
  parent_id: z.number().int().positive().optional(),
  sort_order: z.number().int().nonnegative().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name cannot be empty').optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  parent_id: z.number().int().positive().nullable().optional(),
  sort_order: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type DocumentListQuery = z.infer<typeof documentListQuerySchema>;
export type EmployeeDocumentListQuery = z.infer<typeof employeeDocumentListQuerySchema>;
export type CategoryListQuery = z.infer<typeof categoryListQuerySchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type CreateEmployeeDocumentInput = z.infer<typeof createEmployeeDocumentSchema>;
export type UpdateEmployeeDocumentInput = z.infer<typeof updateEmployeeDocumentSchema>;
export type VerifyEmployeeDocumentInput = z.infer<typeof verifyEmployeeDocumentSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
