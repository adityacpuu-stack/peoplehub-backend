// Query parameters for listing positions
export interface PositionListQuery {
  page?: number;
  limit?: number;
  search?: string;
  company_id?: number;
  department_id?: number;
  level?: number;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Create position DTO
export interface CreatePositionDTO {
  name: string;
  code?: string;
  description?: string;
  company_id: number;
  department_id?: number;
  level?: number;
  min_salary?: number;
  max_salary?: number;
  requirements?: string;
  responsibilities?: string;
  qualifications?: string;
  headcount?: number;
  status?: string;
}

// Update position DTO
export interface UpdatePositionDTO extends Partial<CreatePositionDTO> {}

// Position response
export interface PositionResponse {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  level: number | null;
  status: string | null;
  company?: {
    id: number;
    name: string;
  } | null;
  department?: {
    id: number;
    name: string;
  } | null;
  _count?: {
    employees: number;
  };
}

// Position select fields for list view
export const POSITION_LIST_SELECT = {
  id: true,
  name: true,
  code: true,
  description: true,
  level: true,
  status: true,
  headcount: true,
  company: {
    select: { id: true, name: true },
  },
  department: {
    select: { id: true, name: true },
  },
  _count: {
    select: {
      employees: true,
    },
  },
} as const;

// Position select fields for detail view
export const POSITION_DETAIL_SELECT = {
  ...POSITION_LIST_SELECT,
  min_salary: true,
  max_salary: true,
  requirements: true,
  responsibilities: true,
  qualifications: true,
  created_at: true,
  updated_at: true,
} as const;

// Level mapping
export const POSITION_LEVELS: Record<number, string> = {
  1: 'Entry',
  2: 'Junior',
  3: 'Mid',
  4: 'Senior',
  5: 'Lead',
  6: 'Manager',
  7: 'Director',
};
