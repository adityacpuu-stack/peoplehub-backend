import { Prisma } from '@prisma/client';

// ==========================================
// ENUMS / CONSTANTS
// ==========================================

export const ALLOWANCE_TYPES = [
  'transport',
  'meal',
  'housing',
  'communication',
  'medical',
  'position',
  'performance',
  'attendance',
  'shift',
  'remote',
  'thr',
  'bonus',
  'other',
] as const;

export const CALCULATION_BASES = [
  'fixed',
  'basic_salary',
  'gross_salary',
] as const;

export const FREQUENCIES = [
  'monthly',
  'weekly',
  'daily',
  'one_time',
] as const;

export const ALLOWANCE_STATUSES = [
  'active',
  'inactive',
  'pending',
  'approved',
  'rejected',
  'expired',
] as const;

export type AllowanceType = typeof ALLOWANCE_TYPES[number];
export type CalculationBase = typeof CALCULATION_BASES[number];
export type Frequency = typeof FREQUENCIES[number];
export type AllowanceStatus = typeof ALLOWANCE_STATUSES[number];

// ==========================================
// QUERY INTERFACES
// ==========================================

export interface AllowanceListQuery {
  page?: number;
  limit?: number;
  search?: string;
  employee_id?: number;
  company_id?: number;
  type?: string;
  status?: string;
  is_taxable?: boolean;
  is_recurring?: boolean;
  frequency?: string;
  effective_from?: string;
  effective_to?: string;
}

// ==========================================
// DTOs
// ==========================================

export interface CreateAllowanceDTO {
  employee_id?: number;
  company_id?: number;
  name: string;
  type: string;
  amount?: number;
  percentage?: number;
  calculation_base?: string;
  formula?: string;
  frequency?: string;
  effective_date?: Date;
  end_date?: Date;
  status?: string;
  description?: string;
  notes?: string;
  is_taxable?: boolean;
  is_bpjs_object?: boolean;
  is_recurring?: boolean;
  metadata?: any;
}

export interface UpdateAllowanceDTO extends Partial<CreateAllowanceDTO> {
  approved_by?: number;
  approved_at?: Date;
  rejection_reason?: string;
}

export interface BulkCreateAllowanceDTO {
  employee_ids: number[];
  name: string;
  type: string;
  amount?: number;
  percentage?: number;
  calculation_base?: string;
  frequency?: string;
  effective_date?: Date;
  end_date?: Date;
  is_taxable?: boolean;
  is_bpjs_object?: boolean;
  is_recurring?: boolean;
  description?: string;
}

export interface CalculateAllowanceDTO {
  employee_id: number;
  month: number;
  year: number;
}

// ==========================================
// SELECT FIELDS
// ==========================================

export const ALLOWANCE_SELECT = {
  id: true,
  employee_id: true,
  company_id: true,
  name: true,
  type: true,
  amount: true,
  percentage: true,
  calculation_base: true,
  formula: true,
  frequency: true,
  effective_date: true,
  end_date: true,
  status: true,
  description: true,
  notes: true,
  is_taxable: true,
  is_bpjs_object: true,
  is_recurring: true,
  approved_by: true,
  approved_at: true,
  rejection_reason: true,
  metadata: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.AllowanceSelect;

export const ALLOWANCE_DETAIL_SELECT = {
  ...ALLOWANCE_SELECT,
  employee: {
    select: {
      id: true,
      employee_id: true,
      name: true,
      basic_salary: true,
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      position: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.AllowanceSelect;

// ==========================================
// DEFAULT ALLOWANCE TEMPLATES
// ==========================================

export const DEFAULT_ALLOWANCE_TEMPLATES = [
  {
    name: 'Tunjangan Transportasi',
    type: 'transport',
    calculation_base: 'fixed',
    frequency: 'monthly',
    is_taxable: true,
    is_bpjs_object: false,
    is_recurring: true,
    description: 'Tunjangan transportasi bulanan',
  },
  {
    name: 'Tunjangan Makan',
    type: 'meal',
    calculation_base: 'fixed',
    frequency: 'monthly',
    is_taxable: true,
    is_bpjs_object: false,
    is_recurring: true,
    description: 'Tunjangan makan bulanan',
  },
  {
    name: 'Tunjangan Perumahan',
    type: 'housing',
    calculation_base: 'fixed',
    frequency: 'monthly',
    is_taxable: true,
    is_bpjs_object: true,
    is_recurring: true,
    description: 'Tunjangan perumahan bulanan',
  },
  {
    name: 'Tunjangan Komunikasi',
    type: 'communication',
    calculation_base: 'fixed',
    frequency: 'monthly',
    is_taxable: true,
    is_bpjs_object: false,
    is_recurring: true,
    description: 'Tunjangan pulsa/internet',
  },
  {
    name: 'Tunjangan Jabatan',
    type: 'position',
    calculation_base: 'basic_salary',
    frequency: 'monthly',
    is_taxable: true,
    is_bpjs_object: true,
    is_recurring: true,
    description: 'Tunjangan berdasarkan jabatan',
  },
  {
    name: 'Tunjangan Kesehatan',
    type: 'medical',
    calculation_base: 'fixed',
    frequency: 'monthly',
    is_taxable: false,
    is_bpjs_object: false,
    is_recurring: true,
    description: 'Tunjangan kesehatan tambahan',
  },
  {
    name: 'Tunjangan Kehadiran',
    type: 'attendance',
    calculation_base: 'fixed',
    frequency: 'monthly',
    is_taxable: true,
    is_bpjs_object: false,
    is_recurring: true,
    description: 'Insentif kehadiran penuh',
  },
  {
    name: 'Tunjangan Shift',
    type: 'shift',
    calculation_base: 'fixed',
    frequency: 'daily',
    is_taxable: true,
    is_bpjs_object: false,
    is_recurring: true,
    description: 'Tunjangan shift malam/weekend',
  },
  {
    name: 'Tunjangan Remote',
    type: 'remote',
    calculation_base: 'fixed',
    frequency: 'monthly',
    is_taxable: true,
    is_bpjs_object: false,
    is_recurring: true,
    description: 'Tunjangan kerja dari rumah (listrik, internet)',
  },
  {
    name: 'THR (Tunjangan Hari Raya)',
    type: 'thr',
    calculation_base: 'basic_salary',
    frequency: 'one_time',
    is_taxable: true,
    is_bpjs_object: false,
    is_recurring: false,
    description: 'Tunjangan Hari Raya keagamaan',
  },
  {
    name: 'Bonus',
    type: 'bonus',
    calculation_base: 'basic_salary',
    frequency: 'one_time',
    is_taxable: true,
    is_bpjs_object: false,
    is_recurring: false,
    description: 'Bonus kinerja / pencapaian target',
  },
];
