import { Prisma } from '@prisma/client';

// ==========================================
// ENUMS / CONSTANTS
// ==========================================

export const ANNOUNCEMENT_CATEGORIES = ['general', 'policy', 'event', 'hr', 'urgent'] as const;
export type AnnouncementCategory = (typeof ANNOUNCEMENT_CATEGORIES)[number];

export const ANNOUNCEMENT_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export type AnnouncementPriority = (typeof ANNOUNCEMENT_PRIORITIES)[number];

export const ANNOUNCEMENT_VISIBILITIES = ['all', 'department', 'role'] as const;
export type AnnouncementVisibility = (typeof ANNOUNCEMENT_VISIBILITIES)[number];

// ==========================================
// QUERY TYPES
// ==========================================

export interface AnnouncementListQuery {
  page?: number;
  limit?: number;
  search?: string;
  company_id?: number;
  category?: AnnouncementCategory;
  priority?: AnnouncementPriority;
  visibility?: AnnouncementVisibility;
  is_pinned?: boolean;
  is_published?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ==========================================
// DTO TYPES
// ==========================================

export interface CreateAnnouncementDTO {
  company_id?: number;              // Optional for global announcements
  target_company_ids?: number[];    // For multi-company announcements
  is_global?: boolean;              // True = visible to all companies
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority?: AnnouncementPriority;
  visibility?: AnnouncementVisibility;
  target_audience?: string;
  target_ids?: number[];
  is_pinned?: boolean;
  is_published?: boolean;
  expires_at?: string | Date;
}

export interface UpdateAnnouncementDTO {
  title?: string;
  content?: string;
  category?: AnnouncementCategory;
  priority?: AnnouncementPriority;
  visibility?: AnnouncementVisibility;
  target_audience?: string;
  target_ids?: number[];
  is_pinned?: boolean;
  expires_at?: string | Date | null;
}

// ==========================================
// SELECT TYPES
// ==========================================

export const ANNOUNCEMENT_SELECT = {
  id: true,
  company_id: true,
  target_company_ids: true,
  is_global: true,
  title: true,
  content: true,
  category: true,
  priority: true,
  visibility: true,
  target_audience: true,
  target_ids: true,
  is_pinned: true,
  is_published: true,
  published_at: true,
  expires_at: true,
  views_count: true,
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
} satisfies Prisma.AnnouncementSelect;

export const ANNOUNCEMENT_LIST_SELECT = {
  id: true,
  company_id: true,
  target_company_ids: true,
  is_global: true,
  title: true,
  content: true,
  category: true,
  priority: true,
  visibility: true,
  target_audience: true,
  is_pinned: true,
  is_published: true,
  published_at: true,
  expires_at: true,
  views_count: true,
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
} satisfies Prisma.AnnouncementSelect;

export type AnnouncementListItem = Prisma.AnnouncementGetPayload<{ select: typeof ANNOUNCEMENT_LIST_SELECT }>;
export type AnnouncementDetail = Prisma.AnnouncementGetPayload<{ select: typeof ANNOUNCEMENT_SELECT }>;
