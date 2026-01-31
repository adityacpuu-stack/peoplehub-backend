import { Prisma } from '@prisma/client';

// ==========================================
// QUERY INTERFACES
// ==========================================

export interface SalaryGradeListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  level?: number;
}

// ==========================================
// DTOs
// ==========================================

export interface CreateSalaryGradeDTO {
  grade_code: string;
  grade_name: string;
  level?: number;
  min_salary?: number;
  max_salary?: number;
  mid_salary?: number;
  allowances?: any;
  description?: string;
  status?: string;
}

export interface UpdateSalaryGradeDTO extends Partial<Omit<CreateSalaryGradeDTO, 'grade_code'>> {}

// ==========================================
// SELECT FIELDS
// ==========================================

export const SALARY_GRADE_SELECT = {
  id: true,
  grade_code: true,
  grade_name: true,
  level: true,
  min_salary: true,
  max_salary: true,
  mid_salary: true,
  allowances: true,
  description: true,
  status: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.SalaryGradeSelect;

export const SALARY_GRADE_DETAIL_SELECT = {
  ...SALARY_GRADE_SELECT,
  employees: {
    select: {
      id: true,
      employee_id: true,
      name: true,
      basic_salary: true,
    },
  },
  _count: {
    select: {
      employees: true,
    },
  },
} satisfies Prisma.SalaryGradeSelect;

// ==========================================
// DEFAULT SALARY GRADES
// ==========================================

export const DEFAULT_SALARY_GRADES = [
  { grade_code: 'G1', grade_name: 'Grade 1 - Entry Level', level: 1, min_salary: 5000000, max_salary: 7000000, mid_salary: 6000000, description: 'Fresh graduate, 0-1 tahun pengalaman' },
  { grade_code: 'G2', grade_name: 'Grade 2 - Junior', level: 2, min_salary: 7000000, max_salary: 10000000, mid_salary: 8500000, description: 'Junior staff, 1-3 tahun pengalaman' },
  { grade_code: 'G3', grade_name: 'Grade 3 - Intermediate', level: 3, min_salary: 10000000, max_salary: 15000000, mid_salary: 12500000, description: 'Staff, 3-5 tahun pengalaman' },
  { grade_code: 'G4', grade_name: 'Grade 4 - Senior', level: 4, min_salary: 15000000, max_salary: 22000000, mid_salary: 18500000, description: 'Senior staff, 5-8 tahun pengalaman' },
  { grade_code: 'G5', grade_name: 'Grade 5 - Lead/Specialist', level: 5, min_salary: 22000000, max_salary: 30000000, mid_salary: 26000000, description: 'Lead/Specialist, 8+ tahun pengalaman' },
  { grade_code: 'G6', grade_name: 'Grade 6 - Supervisor', level: 6, min_salary: 25000000, max_salary: 35000000, mid_salary: 30000000, description: 'Supervisor level' },
  { grade_code: 'G7', grade_name: 'Grade 7 - Manager', level: 7, min_salary: 35000000, max_salary: 50000000, mid_salary: 42500000, description: 'Manager level' },
  { grade_code: 'G8', grade_name: 'Grade 8 - Senior Manager', level: 8, min_salary: 50000000, max_salary: 75000000, mid_salary: 62500000, description: 'Senior Manager level' },
  { grade_code: 'G9', grade_name: 'Grade 9 - Director', level: 9, min_salary: 75000000, max_salary: 120000000, mid_salary: 97500000, description: 'Director level' },
  { grade_code: 'G10', grade_name: 'Grade 10 - Executive', level: 10, min_salary: 120000000, max_salary: 200000000, mid_salary: 160000000, description: 'C-Level Executive' },
];
