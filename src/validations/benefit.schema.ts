import { z } from 'zod';
import { paginationSchema, searchSchema } from './common.schema';

// ==========================================
// BENEFIT SCHEMAS
// ==========================================

const benefitTypeSchema = z.enum(['insurance', 'allowance', 'facility', 'membership', 'education', 'other']);
const benefitCategorySchema = z.enum(['health', 'wellness', 'financial', 'lifestyle', 'professional', 'family']);

export const createBenefitSchema = z.object({
  name: z.string().min(1, 'Benefit name is required'),
  type: benefitTypeSchema,
  category: benefitCategorySchema.optional(),
  amount: z.coerce.number().nonnegative().optional(),
  coverage: z.string().optional(),
  description: z.string().optional(),
  provider: z.string().optional(),
  is_active: z.boolean().optional(),
  is_taxable: z.boolean().optional(),
  applicable_to_all: z.boolean().optional(),
  eligibility_rules: z.any().optional(),
  company_id: z.coerce.number().int().positive().optional(),
});

export const updateBenefitSchema = createBenefitSchema.partial();

export const listBenefitQuerySchema = paginationSchema.merge(searchSchema).extend({
  company_id: z.coerce.number().int().positive().optional(),
  type: benefitTypeSchema.optional(),
  category: benefitCategorySchema.optional(),
  is_active: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export const seedBenefitSchema = z.object({
  company_id: z.coerce.number().int().positive().nullable().optional(),
});

export const companyIdQuerySchema = z.object({
  company_id: z.coerce.number().int().positive().optional(),
});
