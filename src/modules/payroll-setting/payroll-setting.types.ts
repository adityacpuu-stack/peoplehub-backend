import { Prisma } from '@prisma/client';

// ==========================================
// QUERY INTERFACES
// ==========================================

export interface PayrollSettingQuery {
  company_id?: number;
}

export interface TaxConfigurationListQuery {
  page?: number;
  limit?: number;
  tax_category?: string;
  is_active?: boolean;
}

export interface TaxBracketListQuery {
  page?: number;
  limit?: number;
  company_id?: number;
  is_active?: boolean;
}

export interface PtkpListQuery {
  page?: number;
  limit?: number;
  company_id?: number;
  is_active?: boolean;
}

// ==========================================
// DTOs - Payroll Setting
// ==========================================

export interface CreatePayrollSettingDTO {
  company_id: number;
  bpjs_kes_employee_rate?: number;
  bpjs_kes_company_rate?: number;
  bpjs_kes_max_salary?: number;
  bpjs_jht_employee_rate?: number;
  bpjs_jht_company_rate?: number;
  bpjs_jp_employee_rate?: number;
  bpjs_jp_company_rate?: number;
  bpjs_jp_max_salary?: number;
  bpjs_jkk_rate?: number;
  bpjs_jkm_rate?: number;
  use_ter_method?: boolean;
  position_cost_rate?: number;
  position_cost_max?: number;
  overtime_rate_weekday?: number;
  overtime_rate_weekend?: number;
  overtime_rate_holiday?: number;
  overtime_base?: string;
  payroll_cutoff_date?: number;
  payment_date?: number;
  prorate_method?: string;
  currency?: string;
  enable_rounding?: boolean;
  rounding_method?: string;
  rounding_precision?: number;
  is_active?: boolean;
}

export interface UpdatePayrollSettingDTO extends Partial<Omit<CreatePayrollSettingDTO, 'company_id'>> {}

// ==========================================
// DTOs - Tax Configuration (TER Rates)
// ==========================================

export interface CreateTaxConfigurationDTO {
  tax_category: string;
  description?: string;
  min_income?: number;
  max_income?: number;
  tax_rate?: number;
  tax_amount?: number;
  is_active?: boolean;
  effective_from?: Date;
  effective_until?: Date;
  notes?: string;
}

export interface UpdateTaxConfigurationDTO extends Partial<CreateTaxConfigurationDTO> {}

// ==========================================
// DTOs - Tax Bracket (Progressive)
// ==========================================

export interface CreateTaxBracketDTO {
  bracket_name: string;
  rate: number;
  min_income: number;
  max_income?: number;
  is_active?: boolean;
  company_id?: number;
}

export interface UpdateTaxBracketDTO extends Partial<CreateTaxBracketDTO> {}

// ==========================================
// DTOs - PTKP
// ==========================================

export interface CreatePtkpDTO {
  status: string;
  description?: string;
  amount: number;
  is_active?: boolean;
  company_id?: number;
}

export interface UpdatePtkpDTO extends Partial<Omit<CreatePtkpDTO, 'status'>> {}

// ==========================================
// SELECT FIELDS
// ==========================================

export const PAYROLL_SETTING_SELECT = {
  id: true,
  company_id: true,
  bpjs_kes_employee_rate: true,
  bpjs_kes_company_rate: true,
  bpjs_kes_max_salary: true,
  bpjs_jht_employee_rate: true,
  bpjs_jht_company_rate: true,
  bpjs_jp_employee_rate: true,
  bpjs_jp_company_rate: true,
  bpjs_jp_max_salary: true,
  bpjs_jkk_rate: true,
  bpjs_jkm_rate: true,
  use_ter_method: true,
  position_cost_rate: true,
  position_cost_max: true,
  overtime_rate_weekday: true,
  overtime_rate_weekend: true,
  overtime_rate_holiday: true,
  overtime_base: true,
  payroll_cutoff_date: true,
  payment_date: true,
  prorate_method: true,
  currency: true,
  enable_rounding: true,
  rounding_method: true,
  rounding_precision: true,
  is_active: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.PayrollSettingSelect;

export const PAYROLL_SETTING_DETAIL_SELECT = {
  ...PAYROLL_SETTING_SELECT,
  company: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
} satisfies Prisma.PayrollSettingSelect;

export const TAX_CONFIGURATION_SELECT = {
  id: true,
  tax_category: true,
  description: true,
  min_income: true,
  max_income: true,
  tax_rate: true,
  tax_amount: true,
  is_active: true,
  effective_from: true,
  effective_until: true,
  notes: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.TaxConfigurationSelect;

export const TAX_BRACKET_SELECT = {
  id: true,
  bracket_name: true,
  rate: true,
  min_income: true,
  max_income: true,
  is_active: true,
  company_id: true,
  created_by: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.TaxBracketSelect;

export const PTKP_SELECT = {
  id: true,
  status: true,
  description: true,
  amount: true,
  is_active: true,
  company_id: true,
  created_by: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.PTKPSelect;

// ==========================================
// DEFAULT VALUES
// ==========================================

export const DEFAULT_PAYROLL_SETTINGS = {
  bpjs_kes_employee_rate: 0.01,    // 1%
  bpjs_kes_company_rate: 0.04,     // 4%
  bpjs_kes_max_salary: 12000000,
  bpjs_jht_employee_rate: 0.02,    // 2%
  bpjs_jht_company_rate: 0.037,    // 3.7%
  bpjs_jp_employee_rate: 0.01,     // 1%
  bpjs_jp_company_rate: 0.02,      // 2%
  bpjs_jp_max_salary: 10042300,    // 2024 value
  bpjs_jkk_rate: 0.0024,           // 0.24% (varies by risk class)
  bpjs_jkm_rate: 0.003,            // 0.3%
  use_ter_method: true,
  position_cost_rate: 0.05,        // 5%
  position_cost_max: 500000,
  overtime_rate_weekday: 1.5,
  overtime_rate_weekend: 2.0,
  overtime_rate_holiday: 3.0,
  overtime_base: 'basic_salary',
  payroll_cutoff_date: 25,
  payment_date: 28,
  prorate_method: 'working_days',
  currency: 'IDR',
  enable_rounding: true,
  rounding_method: 'nearest',
  rounding_precision: 0,
};

// TER Rates 2024 (Tarif Efektif Rata-rata)
export const DEFAULT_TER_RATES = {
  TER_A: [ // TK/0, TK/1
    { min: 0, max: 5400000, rate: 0 },
    { min: 5400001, max: 5650000, rate: 0.0025 },
    { min: 5650001, max: 5950000, rate: 0.005 },
    { min: 5950001, max: 6300000, rate: 0.0075 },
    { min: 6300001, max: 6750000, rate: 0.01 },
    { min: 6750001, max: 7500000, rate: 0.0125 },
    { min: 7500001, max: 8550000, rate: 0.015 },
    { min: 8550001, max: 9650000, rate: 0.0175 },
    { min: 9650001, max: 10050000, rate: 0.02 },
    { min: 10050001, max: 10350000, rate: 0.0225 },
    { min: 10350001, max: 10700000, rate: 0.025 },
    { min: 10700001, max: 11050000, rate: 0.03 },
    { min: 11050001, max: 11600000, rate: 0.035 },
    { min: 11600001, max: 12500000, rate: 0.04 },
    { min: 12500001, max: 13750000, rate: 0.05 },
    { min: 13750001, max: 15100000, rate: 0.06 },
    { min: 15100001, max: 16950000, rate: 0.07 },
    { min: 16950001, max: 19750000, rate: 0.08 },
    { min: 19750001, max: 24150000, rate: 0.09 },
    { min: 24150001, max: 26450000, rate: 0.10 },
    { min: 26450001, max: 28000000, rate: 0.11 },
    { min: 28000001, max: 30050000, rate: 0.12 },
    { min: 30050001, max: 32400000, rate: 0.13 },
    { min: 32400001, max: 35400000, rate: 0.14 },
    { min: 35400001, max: 39100000, rate: 0.15 },
    { min: 39100001, max: 43850000, rate: 0.16 },
    { min: 43850001, max: 47800000, rate: 0.17 },
    { min: 47800001, max: 51400000, rate: 0.18 },
    { min: 51400001, max: 56300000, rate: 0.19 },
    { min: 56300001, max: 62200000, rate: 0.20 },
    { min: 62200001, max: 68600000, rate: 0.21 },
    { min: 68600001, max: 77500000, rate: 0.22 },
    { min: 77500001, max: 89000000, rate: 0.23 },
    { min: 89000001, max: 103000000, rate: 0.24 },
    { min: 103000001, max: 125000000, rate: 0.25 },
    { min: 125000001, max: 157000000, rate: 0.26 },
    { min: 157000001, max: 206000000, rate: 0.27 },
    { min: 206000001, max: 337000000, rate: 0.28 },
    { min: 337000001, max: 454000000, rate: 0.29 },
    { min: 454000001, max: 550000000, rate: 0.30 },
    { min: 550000001, max: 695000000, rate: 0.31 },
    { min: 695000001, max: 910000000, rate: 0.32 },
    { min: 910000001, max: 1400000000, rate: 0.33 },
    { min: 1400000001, max: null, rate: 0.34 },
  ],
  TER_B: [ // TK/2, TK/3, K/0, K/1
    { min: 0, max: 6200000, rate: 0 },
    { min: 6200001, max: 6500000, rate: 0.0025 },
    { min: 6500001, max: 6850000, rate: 0.005 },
    // ... similar structure
  ],
  TER_C: [ // K/2, K/3
    { min: 0, max: 6600000, rate: 0 },
    { min: 6600001, max: 6950000, rate: 0.0025 },
    { min: 6950001, max: 7350000, rate: 0.005 },
    // ... similar structure
  ],
};

// Progressive Tax Brackets (PPh 21)
export const DEFAULT_TAX_BRACKETS = [
  { bracket_name: 'Layer 1 (5%)', rate: 0.05, min_income: 0, max_income: 60000000 },
  { bracket_name: 'Layer 2 (15%)', rate: 0.15, min_income: 60000001, max_income: 250000000 },
  { bracket_name: 'Layer 3 (25%)', rate: 0.25, min_income: 250000001, max_income: 500000000 },
  { bracket_name: 'Layer 4 (30%)', rate: 0.30, min_income: 500000001, max_income: 5000000000 },
  { bracket_name: 'Layer 5 (35%)', rate: 0.35, min_income: 5000000001, max_income: null },
];

// PTKP Values 2024
export const DEFAULT_PTKP_VALUES = [
  { status: 'TK/0', description: 'Tidak Kawin, 0 Tanggungan', amount: 54000000 },
  { status: 'TK/1', description: 'Tidak Kawin, 1 Tanggungan', amount: 58500000 },
  { status: 'TK/2', description: 'Tidak Kawin, 2 Tanggungan', amount: 63000000 },
  { status: 'TK/3', description: 'Tidak Kawin, 3 Tanggungan', amount: 67500000 },
  { status: 'K/0', description: 'Kawin, 0 Tanggungan', amount: 58500000 },
  { status: 'K/1', description: 'Kawin, 1 Tanggungan', amount: 63000000 },
  { status: 'K/2', description: 'Kawin, 2 Tanggungan', amount: 67500000 },
  { status: 'K/3', description: 'Kawin, 3 Tanggungan', amount: 72000000 },
  { status: 'K/I/0', description: 'Kawin, Penghasilan Istri Digabung, 0 Tanggungan', amount: 112500000 },
  { status: 'K/I/1', description: 'Kawin, Penghasilan Istri Digabung, 1 Tanggungan', amount: 117000000 },
  { status: 'K/I/2', description: 'Kawin, Penghasilan Istri Digabung, 2 Tanggungan', amount: 121500000 },
  { status: 'K/I/3', description: 'Kawin, Penghasilan Istri Digabung, 3 Tanggungan', amount: 126000000 },
];

// TER Category mapping based on PTKP status
export const PTKP_TO_TER_CATEGORY: Record<string, string> = {
  'TK/0': 'TER_A',
  'TK/1': 'TER_A',
  'TK/2': 'TER_B',
  'TK/3': 'TER_B',
  'K/0': 'TER_B',
  'K/1': 'TER_B',
  'K/2': 'TER_C',
  'K/3': 'TER_C',
  'K/I/0': 'TER_C',
  'K/I/1': 'TER_C',
  'K/I/2': 'TER_C',
  'K/I/3': 'TER_C',
};
