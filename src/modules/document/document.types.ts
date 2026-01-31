import { Prisma } from '@prisma/client';

// ==========================================
// STATUS & TYPE CONSTANTS
// ==========================================

export const DOCUMENT_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
} as const;

export const DOCUMENT_VISIBILITY = {
  PUBLIC: 'public',
  COMPANY: 'company',
  DEPARTMENT: 'department',
  PRIVATE: 'private',
} as const;

export const DOCUMENT_TYPES = {
  POLICY: 'policy',
  FORM: 'form',
  TEMPLATE: 'template',
  REPORT: 'report',
  OTHER: 'other',
} as const;

export const EMPLOYEE_DOCUMENT_TYPES = {
  KTP: 'ktp',
  FAMILY_CARD: 'family_card',
  NPWP: 'npwp',
  BPJS_TK: 'bpjs_tk',
  BPJS_KES: 'bpjs_kes',
  BANK_ACCOUNT: 'bank_account',
  CV: 'cv',
  IJAZAH: 'ijazah',
  CERTIFICATE: 'certificate',
  CONTRACT: 'contract',
  PHOTO: 'photo',
  OTHER: 'other',
} as const;

export const DOCUMENT_SOURCE = {
  UPLOAD: 'upload',
  SYSTEM: 'system',
  IMPORT: 'import',
} as const;

// ==========================================
// QUERY INTERFACES
// ==========================================

export interface DocumentListQuery {
  page?: number;
  limit?: number;
  company_id?: number;
  category_id?: number;
  document_type?: string;
  status?: string;
  visibility?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface EmployeeDocumentListQuery {
  page?: number;
  limit?: number;
  employee_id?: number;
  company_id?: number;
  department_id?: number;
  document_type?: string;
  is_verified?: boolean;
  is_expired?: boolean;
  expiring_within_days?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface DocumentCategoryListQuery {
  page?: number;
  limit?: number;
  parent_id?: number;
  is_active?: boolean;
  search?: string;
}

// ==========================================
// DTOs - Document
// ==========================================

export interface CreateDocumentDTO {
  title: string;
  description?: string;
  file_path: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  mime_type?: string;
  document_type?: string;
  category_id?: number;
  employee_id?: number;
  expiry_date?: string;
  tags?: string[];
  visibility?: string;
  is_required?: boolean;
}

export interface UpdateDocumentDTO {
  title?: string;
  description?: string;
  document_type?: string;
  category_id?: number;
  expiry_date?: string;
  tags?: string[];
  status?: string;
  visibility?: string;
  is_required?: boolean;
}

// ==========================================
// DTOs - Employee Document
// ==========================================

export interface CreateEmployeeDocumentDTO {
  employee_id: number;
  document_name: string;
  document_type: string;
  file_path: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  document_number?: string;
  description?: string;
  issue_date?: string;
  expiry_date?: string;
  issuing_authority?: string;
  is_required?: boolean;
  is_confidential?: boolean;
  tags?: string[];
}

export interface UpdateEmployeeDocumentDTO {
  document_name?: string;
  document_type?: string;
  document_number?: string;
  description?: string;
  issue_date?: string;
  expiry_date?: string;
  issuing_authority?: string;
  is_required?: boolean;
  is_confidential?: boolean;
  tags?: string[];
}

export interface VerifyDocumentDTO {
  verification_notes?: string;
}

// ==========================================
// DTOs - Document Category
// ==========================================

export interface CreateDocumentCategoryDTO {
  name: string;
  code?: string;
  description?: string;
  parent_id?: number;
  sort_order?: number;
}

export interface UpdateDocumentCategoryDTO {
  name?: string;
  code?: string;
  description?: string;
  parent_id?: number;
  sort_order?: number;
  is_active?: boolean;
}

// ==========================================
// FILE UPLOAD INTERFACES
// ==========================================

export interface FileUploadResult {
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  original_name: string;
}

export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export const DEFAULT_FILE_VALIDATION: FileValidationOptions = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
  ],
  allowedExtensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'txt'],
};

// ==========================================
// SELECT FIELDS
// ==========================================

export const DOCUMENT_LIST_SELECT = {
  id: true,
  title: true,
  description: true,
  file_path: true,
  file_name: true,
  file_size: true,
  file_type: true,
  mime_type: true,
  document_type: true,
  category_id: true,
  employee_id: true,
  version: true,
  expiry_date: true,
  status: true,
  visibility: true,
  is_required: true,
  is_verified: true,
  download_count: true,
  created_at: true,
  category: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  employee: {
    select: {
      id: true,
      name: true,
      employee_id: true,
    },
  },
} satisfies Prisma.DocumentSelect;

export const DOCUMENT_DETAIL_SELECT = {
  ...DOCUMENT_LIST_SELECT,
  tags: true,
  source: true,
  uploaded_by: true,
  assigned_to: true,
  reviewed_by: true,
  reviewed_at: true,
  verified_at: true,
  updated_at: true,
  uploader: {
    select: { id: true, name: true },
  },
  reviewer: {
    select: { id: true, name: true },
  },
} satisfies Prisma.DocumentSelect;

export const EMPLOYEE_DOCUMENT_LIST_SELECT = {
  id: true,
  employee_id: true,
  document_name: true,
  document_type: true,
  document_number: true,
  file_path: true,
  file_name: true,
  file_size: true,
  mime_type: true,
  issue_date: true,
  expiry_date: true,
  is_verified: true,
  is_required: true,
  is_confidential: true,
  created_at: true,
  employee: {
    select: {
      id: true,
      name: true,
      employee_id: true,
      company_id: true,
    },
  },
} satisfies Prisma.EmployeeDocumentSelect;

export const EMPLOYEE_DOCUMENT_DETAIL_SELECT = {
  ...EMPLOYEE_DOCUMENT_LIST_SELECT,
  description: true,
  issuing_authority: true,
  tags: true,
  verified_at: true,
  verified_by: true,
  verification_notes: true,
  uploaded_by: true,
  deleted_at: true,
  updated_at: true,
  uploader: {
    select: { id: true, name: true },
  },
  verifier: {
    select: { id: true, name: true },
  },
} satisfies Prisma.EmployeeDocumentSelect;

export const DOCUMENT_CATEGORY_SELECT = {
  id: true,
  name: true,
  code: true,
  description: true,
  parent_id: true,
  is_active: true,
  sort_order: true,
  created_at: true,
  parent: {
    select: {
      id: true,
      name: true,
    },
  },
  _count: {
    select: {
      documents: true,
      children: true,
    },
  },
} satisfies Prisma.DocumentCategorySelect;
