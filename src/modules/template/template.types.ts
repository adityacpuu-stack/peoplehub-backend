import { Prisma } from '@prisma/client';

// ==========================================
// ENUMS / CONSTANTS
// ==========================================

export const TEMPLATE_CATEGORIES = [
  'contract',      // Kontrak kerja, perjanjian
  'letter',        // Surat-surat (offering, warning, reference)
  'policy',        // Kebijakan perusahaan
  'form',          // Form/formulir
  'report',        // Laporan
  'sop',           // Standard Operating Procedure
  'guideline',     // Pedoman/panduan
  'manual',        // Manual/buku panduan
  'memo',          // Memorandum internal
  'circular',      // Surat edaran
  'checklist',     // Checklist/daftar periksa
  'announcement',  // Template pengumuman
  'onboarding',    // Dokumen onboarding
  'offboarding',   // Dokumen offboarding/resign
  'evaluation',    // Form evaluasi/penilaian
  'training',      // Materi/dokumen training
  'other',         // Lainnya
] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const TEMPLATE_FILE_TYPES = ['docx', 'pdf', 'xlsx', 'pptx', 'other'] as const;
export type TemplateFileType = (typeof TEMPLATE_FILE_TYPES)[number];

// ==========================================
// QUERY TYPES
// ==========================================

export interface TemplateListQuery {
  page?: number;
  limit?: number;
  search?: string;
  company_id?: number;
  category?: TemplateCategory;
  file_type?: TemplateFileType;
  is_active?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ==========================================
// DTO TYPES
// ==========================================

export interface CreateTemplateDTO {
  company_id: number;
  name: string;
  description?: string;
  category: TemplateCategory;
  file_type: TemplateFileType;
  file_path: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  version?: string;
  is_active?: boolean;
}

export interface UpdateTemplateDTO {
  name?: string;
  description?: string;
  category?: TemplateCategory;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  file_type?: TemplateFileType;
  version?: string;
  is_active?: boolean;
}

// ==========================================
// SELECT TYPES
// ==========================================

export const TEMPLATE_SELECT = {
  id: true,
  company_id: true,
  name: true,
  description: true,
  category: true,
  file_type: true,
  file_path: true,
  file_name: true,
  file_size: true,
  mime_type: true,
  version: true,
  is_active: true,
  download_count: true,
  created_by: true,
  created_at: true,
  updated_at: true,
  company: {
    select: {
      id: true,
      name: true,
    },
  },
  creator: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.TemplateSelect;

export const TEMPLATE_LIST_SELECT = {
  id: true,
  company_id: true,
  name: true,
  description: true,
  category: true,
  file_type: true,
  file_path: true,
  file_name: true,
  file_size: true,
  version: true,
  is_active: true,
  download_count: true,
  created_at: true,
  updated_at: true,
  creator: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.TemplateSelect;

export type TemplateListItem = Prisma.TemplateGetPayload<{ select: typeof TEMPLATE_LIST_SELECT }>;
export type TemplateDetail = Prisma.TemplateGetPayload<{ select: typeof TEMPLATE_SELECT }>;
