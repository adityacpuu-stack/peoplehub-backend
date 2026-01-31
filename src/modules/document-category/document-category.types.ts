import { Prisma } from '@prisma/client';

// ==========================================
// QUERY TYPES
// ==========================================

export interface DocumentCategoryListQuery {
  page?: number;
  limit?: number;
  search?: string;
  parent_id?: number | null;
  is_active?: boolean;
  include_children?: boolean;
}

// ==========================================
// DTO TYPES
// ==========================================

export interface CreateDocumentCategoryDTO {
  name: string;
  code?: string;
  description?: string;
  parent_id?: number;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateDocumentCategoryDTO {
  name?: string;
  code?: string;
  description?: string;
  parent_id?: number | null;
  is_active?: boolean;
  sort_order?: number;
}

// ==========================================
// SELECT TYPES
// ==========================================

export const DOCUMENT_CATEGORY_SELECT = {
  id: true,
  name: true,
  code: true,
  description: true,
  parent_id: true,
  is_active: true,
  sort_order: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.DocumentCategorySelect;

export const DOCUMENT_CATEGORY_WITH_PARENT_SELECT = {
  ...DOCUMENT_CATEGORY_SELECT,
  parent: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
} satisfies Prisma.DocumentCategorySelect;

export const DOCUMENT_CATEGORY_WITH_CHILDREN_SELECT = {
  ...DOCUMENT_CATEGORY_SELECT,
  parent: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  children: {
    select: {
      id: true,
      name: true,
      code: true,
      is_active: true,
      sort_order: true,
    },
    orderBy: { sort_order: 'asc' as const },
  },
  _count: {
    select: {
      documents: true,
      children: true,
    },
  },
} satisfies Prisma.DocumentCategorySelect;

// ==========================================
// DEFAULT CATEGORIES
// ==========================================

export const DEFAULT_DOCUMENT_CATEGORIES = [
  { name: 'HR Documents', code: 'HR', description: 'Human Resources related documents', sort_order: 1 },
  { name: 'Policies', code: 'POLICY', description: 'Company policies and procedures', sort_order: 2 },
  { name: 'Contracts', code: 'CONTRACT', description: 'Employment contracts and agreements', sort_order: 3 },
  { name: 'Certificates', code: 'CERT', description: 'Certificates and qualifications', sort_order: 4 },
  { name: 'Legal Documents', code: 'LEGAL', description: 'Legal and compliance documents', sort_order: 5 },
  { name: 'Training Materials', code: 'TRAINING', description: 'Training and development materials', sort_order: 6 },
  { name: 'Forms', code: 'FORM', description: 'Application forms and templates', sort_order: 7 },
  { name: 'Reports', code: 'REPORT', description: 'Reports and analytics', sort_order: 8 },
];
