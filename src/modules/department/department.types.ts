// Query parameters for listing departments
export interface DepartmentListQuery {
  page?: number;
  limit?: number;
  search?: string;
  company_id?: number;
  parent_id?: number;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Create department DTO
export interface CreateDepartmentDTO {
  name: string;
  code?: string;
  description?: string;
  company_id: number;
  parent_id?: number;
  manager_id?: number;
  status?: string;
  budget?: number;
  location?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  established_date?: Date | string;
  department_type?: string;
  headcount_limit?: number;
  cost_center?: string;
  sort_order?: number;
}

// Update department DTO
export interface UpdateDepartmentDTO extends Partial<CreateDepartmentDTO> {}

// Department response
export interface DepartmentResponse {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  status: string | null;
  company?: {
    id: number;
    name: string;
  } | null;
  parent?: {
    id: number;
    name: string;
  } | null;
  manager?: {
    id: number;
    name: string;
  } | null;
  _count?: {
    employees: number;
    children: number;
    positions: number;
  };
}

// Department select fields for list view
export const DEPARTMENT_LIST_SELECT = {
  id: true,
  name: true,
  code: true,
  description: true,
  status: true,
  location: true,
  department_type: true,
  sort_order: true,
  company: {
    select: { id: true, name: true },
  },
  parent: {
    select: { id: true, name: true },
  },
  manager: {
    select: { id: true, name: true },
  },
  _count: {
    select: {
      employees: true,
      children: true,
      positions: true,
    },
  },
} as const;

// Department select fields for detail view
export const DEPARTMENT_DETAIL_SELECT = {
  ...DEPARTMENT_LIST_SELECT,
  budget: true,
  contact_person: true,
  contact_email: true,
  contact_phone: true,
  established_date: true,
  headcount_limit: true,
  cost_center: true,
  created_at: true,
  updated_at: true,
  children: {
    select: {
      id: true,
      name: true,
      code: true,
      status: true,
    },
  },
  positions: {
    select: {
      id: true,
      name: true,
      code: true,
      status: true,
    },
  },
} as const;
