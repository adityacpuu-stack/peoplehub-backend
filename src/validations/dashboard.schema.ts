import { z } from 'zod';

// ==========================================
// DASHBOARD VALIDATION SCHEMAS
// ==========================================

// Calendar events query
export const calendarQuerySchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

// Analytics query (workforce analytics, headcount analytics)
export const analyticsQuerySchema = z.object({
  company_id: z.coerce.number().int().positive().optional(),
});

// Turnover/headcount analytics query (with period filter)
export const turnoverAnalyticsQuerySchema = z.object({
  company_id: z.coerce.number().int().positive().optional(),
  period: z.enum(['this_month', 'last_month', 'this_quarter', 'this_year', 'last_year', '6_months', '2_years', 'all_time']).optional(),
});
