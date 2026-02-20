import { Prisma } from '@prisma/client';

// Query parameters for listing employees
export interface EmployeeListQuery {
  page?: number;
  limit?: number;
  search?: string;
  company_id?: number;
  department_id?: number;
  position_id?: number;
  work_location_id?: number;
  employment_status?: string;
  employment_type?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Create employee DTO
export interface CreateEmployeeDTO {
  // Required
  name: string;
  user_id?: number; // Optional - can create user separately

  // Basic Info
  employee_id?: string;
  nick_name?: string;
  date_of_birth?: Date | string;
  place_of_birth?: string;
  gender?: string;
  marital_status?: string;
  religion?: string;
  blood_type?: string;
  nationality?: string;
  phone?: string;
  mobile_number?: string;
  email?: string;
  // Alamat KTP
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  // Alamat Domisili
  current_address?: string;
  current_city?: string;
  current_province?: string;
  current_postal_code?: string;

  // Personal email
  personal_email?: string;

  // Identity Documents
  national_id?: string;
  family_card_number?: string;
  tax_id?: string;
  npwp_number?: string;
  passport_number?: string;
  passport_expiry?: Date | string;

  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  emergency_contact_address?: string;

  // Job Info
  job_title?: string;
  department_id?: number;
  position_id?: number;
  company_id?: number;
  work_location_id?: number;
  division?: string;
  organizational_level?: string;
  grade_level?: string;
  salary_grade_id?: number;
  cost_center?: string;
  manager_id?: number;
  direct_manager_id?: number;
  skip_level_manager_id?: number;
  leave_approver_id?: number;
  overtime_approver_id?: number;

  // Employment Dates
  hire_date?: Date | string;
  join_date?: Date | string;
  probation_start_date?: Date | string;
  probation_end_date?: Date | string;
  contract_start_date?: Date | string;
  contract_end_date?: Date | string;

  // Resign Info
  resign_date?: Date | string;
  resign_type?: string;
  resign_reason?: string;
  resign_notes?: string;

  // Employment Details
  employment_type?: string;
  employment_status?: string;
  work_schedule?: string;
  assigned_shift?: string;

  // Salary & Compensation
  basic_salary?: number;
  salary_currency?: string;
  pay_frequency?: string;
  pay_type?: string;
  transport_allowance?: number;
  meal_allowance?: number;
  position_allowance?: number;
  communication_allowance?: number;
  housing_allowance?: number;
  performance_bonus?: number;

  // Tax & Insurance
  tax_status?: string;
  ptkp_status?: string;
  bpjs_ketenagakerjaan_number?: string;
  bpjs_kesehatan_number?: string;
  jht_registered?: boolean;
  jp_registered?: boolean;
  medical_insurance?: boolean;
  life_insurance?: boolean;
}

// Update employee DTO (all optional)
export interface UpdateEmployeeDTO extends Partial<CreateEmployeeDTO> {}

// Employee response with relations
export interface EmployeeResponse {
  id: number;
  employee_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  employment_status: string | null;
  employment_type: string | null;
  job_title: string | null;
  company?: {
    id: number;
    name: string;
  } | null;
  department?: {
    id: number;
    name: string;
  } | null;
  position?: {
    id: number;
    name: string;
  } | null;
  manager?: {
    id: number;
    name: string;
  } | null;
  user?: {
    id: number;
    email: string;
    is_active: boolean;
  } | null;
}

// Employee detail response (full data)
export interface EmployeeDetailResponse extends EmployeeResponse {
  // All fields from Employee model
  [key: string]: any;
}

// Pagination response
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Employee select fields for list view
export const EMPLOYEE_LIST_SELECT = {
  id: true,
  employee_id: true,
  name: true,
  email: true,
  phone: true,
  mobile_number: true,
  job_title: true,
  employment_status: true,
  employment_type: true,
  hire_date: true,
  resign_date: true,
  resign_type: true,
  avatar: true,
  // Include salary fields for overtime/allowance calculations
  basic_salary: true,
  company_id: true,
  department_id: true,
  position_id: true,
  manager_id: true,
  leave_approver_id: true,
  overtime_approver_id: true,
  company: {
    select: { id: true, name: true },
  },
  department: {
    select: { id: true, name: true },
  },
  position: {
    select: { id: true, name: true },
  },
  manager: {
    select: { id: true, name: true },
  },
  leaveApprover: {
    select: { id: true, name: true },
  },
  overtimeApprover: {
    select: { id: true, name: true },
  },
  user: {
    select: { id: true, email: true, is_active: true },
  },
} as const;

// Employee select fields for detail view
export const EMPLOYEE_DETAIL_SELECT = {
  ...EMPLOYEE_LIST_SELECT,
  manager_id: true,
  nick_name: true,
  date_of_birth: true,
  place_of_birth: true,
  gender: true,
  marital_status: true,
  religion: true,
  blood_type: true,
  nationality: true,
  // Alamat KTP
  address: true,
  city: true,
  province: true,
  postal_code: true,
  // Alamat Domisili
  current_address: true,
  current_city: true,
  current_province: true,
  current_postal_code: true,
  national_id: true,
  family_card_number: true,
  personal_email: true,
  npwp_number: true,
  passport_number: true,
  passport_expiry: true,
  emergency_contact_name: true,
  emergency_contact_phone: true,
  emergency_contact_relationship: true,
  emergency_contact_address: true,
  division: true,
  organizational_level: true,
  grade_level: true,
  cost_center: true,
  join_date: true,
  probation_start_date: true,
  probation_end_date: true,
  confirmation_date: true,
  contract_start_date: true,
  contract_end_date: true,
  work_schedule: true,
  assigned_shift: true,
  basic_salary: true,
  salary_currency: true,
  pay_frequency: true,
  pay_type: true,
  transport_allowance: true,
  meal_allowance: true,
  position_allowance: true,
  communication_allowance: true,
  housing_allowance: true,
  performance_bonus: true,
  tax_status: true,
  ptkp_status: true,
  bpjs_ketenagakerjaan_number: true,
  bpjs_kesehatan_number: true,
  bpjs_ketenagakerjaan_date: true,
  bpjs_kesehatan_date: true,
  jht_registered: true,
  jp_registered: true,
  medical_insurance: true,
  life_insurance: true,
  // Bank Info
  bank_name: true,
  bank_account_number: true,
  bank_account_holder: true,
  bank_branch: true,
  // Education
  last_education: true,
  education_major: true,
  education_institution: true,
  graduation_year: true,
  // Family Info
  spouse_name: true,
  children_count: true,
  number_of_dependents: true,
  workLocationRef: {
    select: { id: true, name: true },
  },
  directManager: {
    select: { id: true, name: true },
  },
  skipLevelManager: {
    select: { id: true, name: true },
  },
  leaveApprover: {
    select: { id: true, name: true },
  },
  overtimeApprover: {
    select: { id: true, name: true },
  },
  created_at: true,
  updated_at: true,
} as const;
