import { Prisma } from '@prisma/client';

// ==========================================
// ENUMS / CONSTANTS
// ==========================================

export const BENEFIT_TYPES = ['insurance', 'allowance', 'facility', 'membership', 'education', 'other'] as const;
export const BENEFIT_CATEGORIES = ['health', 'wellness', 'financial', 'lifestyle', 'professional', 'family'] as const;

export type BenefitType = typeof BENEFIT_TYPES[number];
export type BenefitCategory = typeof BENEFIT_CATEGORIES[number];

// ==========================================
// QUERY INTERFACES
// ==========================================

export interface BenefitListQuery {
  page?: number;
  limit?: number;
  search?: string;
  company_id?: number;
  type?: string;
  category?: string;
  is_active?: boolean;
}

// ==========================================
// DTOs
// ==========================================

export interface CreateBenefitDTO {
  name: string;
  type: string;
  category?: string;
  amount?: number;
  coverage?: string;
  description?: string;
  provider?: string;
  is_active?: boolean;
  is_taxable?: boolean;
  applicable_to_all?: boolean;
  eligibility_rules?: any;
  company_id?: number;
}

export interface UpdateBenefitDTO extends Partial<CreateBenefitDTO> {}

// ==========================================
// SELECT FIELDS
// ==========================================

export const BENEFIT_SELECT = {
  id: true,
  name: true,
  type: true,
  category: true,
  amount: true,
  coverage: true,
  description: true,
  provider: true,
  is_active: true,
  is_taxable: true,
  applicable_to_all: true,
  eligibility_rules: true,
  company_id: true,
  created_by: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.BenefitSelect;

export const BENEFIT_DETAIL_SELECT = {
  ...BENEFIT_SELECT,
  company: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
} satisfies Prisma.BenefitSelect;

// ==========================================
// DEFAULT BENEFITS
// ==========================================

export const DEFAULT_BENEFITS = [
  // Health
  { name: 'Asuransi Kesehatan', type: 'insurance', category: 'health', description: 'Asuransi kesehatan untuk karyawan dan keluarga', is_taxable: false, applicable_to_all: true },
  { name: 'Medical Check Up Tahunan', type: 'facility', category: 'health', description: 'Pemeriksaan kesehatan rutin tahunan', is_taxable: false, applicable_to_all: true },
  { name: 'Kacamata', type: 'allowance', category: 'health', amount: 1500000, description: 'Tunjangan kacamata per 2 tahun', is_taxable: false },
  // Wellness
  { name: 'Gym Membership', type: 'membership', category: 'wellness', description: 'Keanggotaan gym/fitness center', is_taxable: true },
  { name: 'Mental Health Support', type: 'facility', category: 'wellness', description: 'Konseling dan dukungan kesehatan mental', is_taxable: false },
  // Financial
  { name: 'Asuransi Jiwa', type: 'insurance', category: 'financial', description: 'Asuransi jiwa untuk karyawan', is_taxable: false, applicable_to_all: true },
  { name: 'Dana Pensiun', type: 'insurance', category: 'financial', description: 'Program dana pensiun tambahan', is_taxable: false },
  // Lifestyle
  { name: 'Cuti Tambahan', type: 'facility', category: 'lifestyle', description: 'Tambahan hari cuti diluar ketentuan', is_taxable: false },
  { name: 'Work From Home', type: 'facility', category: 'lifestyle', description: 'Fleksibilitas bekerja dari rumah', is_taxable: false },
  { name: 'Parking', type: 'facility', category: 'lifestyle', description: 'Fasilitas parkir kantor', is_taxable: false },
  // Professional
  { name: 'Training & Certification', type: 'education', category: 'professional', description: 'Program pelatihan dan sertifikasi', is_taxable: false },
  { name: 'Conference Attendance', type: 'education', category: 'professional', description: 'Kehadiran konferensi/seminar', is_taxable: false },
  // Family
  { name: 'Tunjangan Anak', type: 'allowance', category: 'family', description: 'Tunjangan pendidikan anak', is_taxable: true },
  { name: 'Cuti Melahirkan Extended', type: 'facility', category: 'family', description: 'Perpanjangan cuti melahirkan', is_taxable: false },
];
