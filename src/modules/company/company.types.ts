import { Prisma } from '@prisma/client';

// ==========================================
// STATUS & TYPE CONSTANTS
// ==========================================

export const COMPANY_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
} as const;

export const COMPANY_TYPES = {
  HOLDING: 'holding',
  SUBSIDIARY: 'subsidiary',
  BRANCH: 'branch',
} as const;

// ==========================================
// QUERY INTERFACES
// ==========================================

export interface CompanyListQuery {
  page?: number;
  limit?: number;
  parent_company_id?: number;
  company_type?: string;
  status?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ==========================================
// DTOs
// ==========================================

export interface CreateCompanyDTO {
  name: string;
  code?: string;
  legal_name?: string;
  company_type?: string;
  parent_company_id?: number;
  group_name?: string;
  tax_id?: string;
  business_registration?: string;
  email?: string;
  phone?: string;
  fax?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  website?: string;
  logo?: string;
  industry?: string;
  founded_date?: string;
  settings?: Record<string, any>;
}

export interface UpdateCompanyDTO extends Partial<CreateCompanyDTO> {
  status?: string;
}

// ==========================================
// FEATURE TOGGLES
// ==========================================

export interface CompanyFeatureToggles {
  attendance_enabled: boolean;
  leave_enabled: boolean;
  payroll_enabled: boolean;
  performance_enabled: boolean;
}

export interface UpdateFeatureTogglesDTO {
  attendance_enabled?: boolean;
  leave_enabled?: boolean;
  payroll_enabled?: boolean;
  performance_enabled?: boolean;
}

// ==========================================
// SELECT FIELDS
// ==========================================

export const COMPANY_LIST_SELECT = {
  id: true,
  name: true,
  code: true,
  legal_name: true,
  company_type: true,
  parent_company_id: true,
  group_name: true,
  email: true,
  phone: true,
  city: true,
  province: true,
  logo: true,
  industry: true,
  employee_count: true,
  status: true,
  created_at: true,
  // Feature toggles
  attendance_enabled: true,
  leave_enabled: true,
  payroll_enabled: true,
  performance_enabled: true,
  parent: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  _count: {
    select: {
      employees: true,
      departments: true,
      subsidiaries: true,
    },
  },
} satisfies Prisma.CompanySelect;

export const COMPANY_DETAIL_SELECT = {
  ...COMPANY_LIST_SELECT,
  tax_id: true,
  business_registration: true,
  fax: true,
  address: true,
  postal_code: true,
  country: true,
  website: true,
  founded_date: true,
  settings: true,
  updated_at: true,
  subsidiaries: {
    select: {
      id: true,
      name: true,
      code: true,
      status: true,
    },
  },
  departments: {
    select: {
      id: true,
      name: true,
      code: true,
    },
    take: 10,
  },
  workLocations: {
    select: {
      id: true,
      name: true,
      is_active: true,
    },
  },
} satisfies Prisma.CompanySelect;
