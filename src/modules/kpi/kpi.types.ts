import { Prisma } from '@prisma/client';

// ==========================================
// ENUMS / CONSTANTS
// ==========================================

export const KPI_CATEGORIES = ['financial', 'customer', 'process', 'learning', 'quality', 'productivity'] as const;
export const TARGET_FREQUENCIES = ['daily', 'weekly', 'monthly', 'quarterly', 'annually'] as const;
export const TARGET_TYPES = ['higher_better', 'lower_better', 'target_range'] as const;
export const CALCULATION_METHODS = ['sum', 'average', 'percentage', 'ratio', 'count', 'custom'] as const;

export type KpiCategory = typeof KPI_CATEGORIES[number];
export type TargetFrequency = typeof TARGET_FREQUENCIES[number];
export type TargetType = typeof TARGET_TYPES[number];
export type CalculationMethod = typeof CALCULATION_METHODS[number];

// ==========================================
// QUERY INTERFACES
// ==========================================

export interface KpiListQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  department_id?: number;
  position_id?: number;
  target_frequency?: string;
  is_active?: boolean;
}

// ==========================================
// DTOs
// ==========================================

export interface CreateKpiDTO {
  name: string;
  code?: string;
  description?: string;
  category?: string;
  department_id?: number;
  position_id?: number;
  unit_of_measure?: string;
  target_frequency?: string;
  target_type?: string;
  weight?: number;
  calculation_method?: string;
  formula?: string;
  data_source?: string;
  benchmark_value?: number;
  threshold_red?: number;
  threshold_yellow?: number;
  threshold_green?: number;
  is_active?: boolean;
  effective_from?: Date;
  effective_until?: Date;
}

export interface UpdateKpiDTO extends Partial<CreateKpiDTO> {}

// ==========================================
// SELECT FIELDS
// ==========================================

export const KPI_SELECT = {
  id: true,
  name: true,
  code: true,
  description: true,
  category: true,
  department_id: true,
  position_id: true,
  unit_of_measure: true,
  target_frequency: true,
  target_type: true,
  weight: true,
  calculation_method: true,
  formula: true,
  data_source: true,
  benchmark_value: true,
  threshold_red: true,
  threshold_yellow: true,
  threshold_green: true,
  is_active: true,
  effective_from: true,
  effective_until: true,
  created_by: true,
  updated_by: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.KPISelect;

export const KPI_DETAIL_SELECT = {
  ...KPI_SELECT,
  department: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  position: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  _count: {
    select: {
      goals: true,
    },
  },
} satisfies Prisma.KPISelect;

// ==========================================
// DEFAULT KPIs
// ==========================================

export const DEFAULT_KPIS = [
  // Financial
  { name: 'Revenue Growth', code: 'REV_GROWTH', category: 'financial', target_type: 'higher_better', target_frequency: 'quarterly', unit_of_measure: '%' },
  { name: 'Cost Reduction', code: 'COST_RED', category: 'financial', target_type: 'higher_better', target_frequency: 'quarterly', unit_of_measure: '%' },
  { name: 'Profit Margin', code: 'PROFIT_MGN', category: 'financial', target_type: 'higher_better', target_frequency: 'monthly', unit_of_measure: '%' },
  // Customer
  { name: 'Customer Satisfaction', code: 'CSAT', category: 'customer', target_type: 'higher_better', target_frequency: 'monthly', unit_of_measure: 'score' },
  { name: 'Net Promoter Score', code: 'NPS', category: 'customer', target_type: 'higher_better', target_frequency: 'quarterly', unit_of_measure: 'score' },
  { name: 'Customer Retention Rate', code: 'CUST_RET', category: 'customer', target_type: 'higher_better', target_frequency: 'quarterly', unit_of_measure: '%' },
  // Process
  { name: 'Project Completion Rate', code: 'PROJ_COMP', category: 'process', target_type: 'higher_better', target_frequency: 'monthly', unit_of_measure: '%' },
  { name: 'Cycle Time', code: 'CYCLE_TIME', category: 'process', target_type: 'lower_better', target_frequency: 'monthly', unit_of_measure: 'days' },
  { name: 'Error Rate', code: 'ERR_RATE', category: 'process', target_type: 'lower_better', target_frequency: 'monthly', unit_of_measure: '%' },
  // Quality
  { name: 'Defect Rate', code: 'DEFECT', category: 'quality', target_type: 'lower_better', target_frequency: 'monthly', unit_of_measure: '%' },
  { name: 'First Pass Yield', code: 'FPY', category: 'quality', target_type: 'higher_better', target_frequency: 'monthly', unit_of_measure: '%' },
  // Productivity
  { name: 'Task Completion Rate', code: 'TASK_COMP', category: 'productivity', target_type: 'higher_better', target_frequency: 'weekly', unit_of_measure: '%' },
  { name: 'Attendance Rate', code: 'ATTEND', category: 'productivity', target_type: 'higher_better', target_frequency: 'monthly', unit_of_measure: '%' },
  { name: 'Overtime Hours', code: 'OT_HOURS', category: 'productivity', target_type: 'target_range', target_frequency: 'monthly', unit_of_measure: 'hours' },
  // Learning
  { name: 'Training Hours', code: 'TRAIN_HRS', category: 'learning', target_type: 'higher_better', target_frequency: 'quarterly', unit_of_measure: 'hours' },
  { name: 'Certification Completion', code: 'CERT_COMP', category: 'learning', target_type: 'higher_better', target_frequency: 'annually', unit_of_measure: 'count' },
];
