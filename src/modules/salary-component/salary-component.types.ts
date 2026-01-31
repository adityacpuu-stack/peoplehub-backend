import { Prisma } from '@prisma/client';

// ==========================================
// ENUMS / CONSTANTS
// ==========================================

export const COMPONENT_TYPES = ['earning', 'deduction'] as const;
export const COMPONENT_CATEGORIES = ['basic', 'allowance', 'bonus', 'tax', 'bpjs', 'insurance', 'loan', 'other'] as const;
export const CALCULATION_BASES = ['fixed', 'basic_salary', 'gross_salary', 'custom'] as const;

export type ComponentType = typeof COMPONENT_TYPES[number];
export type ComponentCategory = typeof COMPONENT_CATEGORIES[number];
export type CalculationBase = typeof CALCULATION_BASES[number];

// ==========================================
// QUERY INTERFACES
// ==========================================

export interface SalaryComponentListQuery {
  page?: number;
  limit?: number;
  search?: string;
  company_id?: number;
  type?: string;
  category?: string;
  is_active?: boolean;
  is_taxable?: boolean;
}

// ==========================================
// DTOs
// ==========================================

export interface CreateSalaryComponentDTO {
  company_id?: number;
  name: string;
  code?: string;
  type: string;
  category?: string;
  amount?: number;
  percentage?: number;
  formula?: string;
  calculation_base?: string;
  is_taxable?: boolean;
  is_bpjs_object?: boolean;
  is_active?: boolean;
  is_recurring?: boolean;
  effective_from?: Date;
  effective_until?: Date;
  applicable_to?: any;
  description?: string;
  sort_order?: number;
}

export interface UpdateSalaryComponentDTO extends Partial<CreateSalaryComponentDTO> {}

// ==========================================
// SELECT FIELDS
// ==========================================

export const SALARY_COMPONENT_SELECT = {
  id: true,
  company_id: true,
  name: true,
  code: true,
  type: true,
  category: true,
  amount: true,
  percentage: true,
  formula: true,
  calculation_base: true,
  is_taxable: true,
  is_bpjs_object: true,
  is_active: true,
  is_recurring: true,
  effective_from: true,
  effective_until: true,
  applicable_to: true,
  description: true,
  sort_order: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.SalaryComponentSelect;

export const SALARY_COMPONENT_DETAIL_SELECT = {
  ...SALARY_COMPONENT_SELECT,
  company: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
} satisfies Prisma.SalaryComponentSelect;

// ==========================================
// DEFAULT COMPONENTS
// ==========================================

export const DEFAULT_SALARY_COMPONENTS = [
  // Earnings
  { name: 'Gaji Pokok', code: 'BASIC', type: 'earning', category: 'basic', calculation_base: 'fixed', is_taxable: true, is_bpjs_object: true, sort_order: 1 },
  { name: 'Tunjangan Jabatan', code: 'POS_ALW', type: 'earning', category: 'allowance', calculation_base: 'fixed', is_taxable: true, is_bpjs_object: true, sort_order: 2 },
  { name: 'Tunjangan Transport', code: 'TRANS', type: 'earning', category: 'allowance', calculation_base: 'fixed', is_taxable: true, is_bpjs_object: false, sort_order: 3 },
  { name: 'Tunjangan Makan', code: 'MEAL', type: 'earning', category: 'allowance', calculation_base: 'fixed', is_taxable: true, is_bpjs_object: false, sort_order: 4 },
  { name: 'Tunjangan Komunikasi', code: 'COMM', type: 'earning', category: 'allowance', calculation_base: 'fixed', is_taxable: true, is_bpjs_object: false, sort_order: 5 },
  { name: 'Lembur', code: 'OT', type: 'earning', category: 'bonus', calculation_base: 'custom', is_taxable: true, is_bpjs_object: false, sort_order: 6 },
  { name: 'Bonus', code: 'BONUS', type: 'earning', category: 'bonus', calculation_base: 'fixed', is_taxable: true, is_bpjs_object: false, sort_order: 7 },
  { name: 'THR', code: 'THR', type: 'earning', category: 'bonus', calculation_base: 'basic_salary', is_taxable: true, is_bpjs_object: false, sort_order: 8 },
  // Deductions
  { name: 'PPh 21', code: 'TAX', type: 'deduction', category: 'tax', calculation_base: 'custom', is_taxable: false, is_bpjs_object: false, sort_order: 10 },
  { name: 'BPJS Kesehatan (Karyawan)', code: 'BPJS_KES_EE', type: 'deduction', category: 'bpjs', calculation_base: 'custom', is_taxable: false, is_bpjs_object: false, sort_order: 11 },
  { name: 'BPJS JHT (Karyawan)', code: 'BPJS_JHT_EE', type: 'deduction', category: 'bpjs', calculation_base: 'custom', is_taxable: false, is_bpjs_object: false, sort_order: 12 },
  { name: 'BPJS JP (Karyawan)', code: 'BPJS_JP_EE', type: 'deduction', category: 'bpjs', calculation_base: 'custom', is_taxable: false, is_bpjs_object: false, sort_order: 13 },
  { name: 'Pinjaman', code: 'LOAN', type: 'deduction', category: 'loan', calculation_base: 'fixed', is_taxable: false, is_bpjs_object: false, sort_order: 14 },
  { name: 'Potongan Keterlambatan', code: 'LATE_DED', type: 'deduction', category: 'other', calculation_base: 'custom', is_taxable: false, is_bpjs_object: false, sort_order: 15 },
  { name: 'Potongan Absen', code: 'ABS_DED', type: 'deduction', category: 'other', calculation_base: 'custom', is_taxable: false, is_bpjs_object: false, sort_order: 16 },
];
