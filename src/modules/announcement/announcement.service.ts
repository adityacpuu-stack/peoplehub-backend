import { PrismaClient, Prisma } from '@prisma/client';
import {
  AnnouncementListQuery,
  CreateAnnouncementDTO,
  UpdateAnnouncementDTO,
  ANNOUNCEMENT_SELECT,
  ANNOUNCEMENT_LIST_SELECT,
} from './announcement.types';
import { AuthUser } from '../../middlewares/auth.middleware';
import { NotificationService } from '../notification/notification.service';
import { NOTIFICATION_TYPES } from '../notification/notification.types';

const prisma = new PrismaClient();
const notificationService = new NotificationService();

export class AnnouncementService {
  /**
   * List announcements with pagination and filtering
   */
  async list(query: AnnouncementListQuery, user: AuthUser) {
    const {
      page = 1,
      limit = 20,
      search,
      company_id,
      category,
      priority,
      visibility,
      is_pinned,
      is_published,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AnnouncementWhereInput = {
      deleted_at: null,
    };

    // Filter by company - include global announcements and multi-company announcements
    if (company_id) {
      where.OR = [
        { company_id: company_id },
        { is_global: true },
        { target_company_ids: { array_contains: company_id } },
      ];
    } else if (user.accessibleCompanyIds && user.accessibleCompanyIds.length > 0) {
      where.OR = [
        { company_id: { in: user.accessibleCompanyIds } },
        { is_global: true },
        // For multi-company, check if any accessible company is in target_company_ids
        ...user.accessibleCompanyIds.map(cid => ({ target_company_ids: { array_contains: cid } })),
      ];
    }

    // Search
    if (search) {
      const searchCondition: Prisma.AnnouncementWhereInput = {
        OR: [
          { title: { contains: search } },
          { content: { contains: search } },
        ],
      };
      // Combine with existing OR conditions
      if (where.OR) {
        where.AND = [{ OR: where.OR }, searchCondition];
        delete where.OR;
      } else {
        where.OR = searchCondition.OR;
      }
    }

    // Filters
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (visibility) where.visibility = visibility;
    if (is_pinned !== undefined) where.is_pinned = is_pinned;
    if (is_published !== undefined) where.is_published = is_published;

    // Build orderBy - pinned first, then by specified field
    const orderBy: Prisma.AnnouncementOrderByWithRelationInput[] = [
      { is_pinned: 'desc' },
    ];

    if (sort_by === 'title') orderBy.push({ title: sort_order });
    else if (sort_by === 'category') orderBy.push({ category: sort_order });
    else if (sort_by === 'priority') orderBy.push({ priority: sort_order });
    else if (sort_by === 'published_at') orderBy.push({ published_at: sort_order });
    else if (sort_by === 'updated_at') orderBy.push({ updated_at: sort_order });
    else orderBy.push({ created_at: sort_order });

    const [data, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        select: ANNOUNCEMENT_LIST_SELECT,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.announcement.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get announcement by ID
   */
  async getById(id: number, user: AuthUser) {
    const announcement = await prisma.announcement.findFirst({
      where: {
        id,
        deleted_at: null,
        company_id: user.accessibleCompanyIds?.length
          ? { in: user.accessibleCompanyIds }
          : undefined,
      },
      select: ANNOUNCEMENT_SELECT,
    });

    if (!announcement) {
      throw new Error('Announcement not found');
    }

    return announcement;
  }

  /**
   * Get published announcements for employees
   */
  async getPublished(companyId: number, user: AuthUser) {
    // Check access
    if (user.accessibleCompanyIds?.length && !user.accessibleCompanyIds.includes(companyId)) {
      throw new Error('Access denied to this company');
    }

    const now = new Date();

    return prisma.announcement.findMany({
      where: {
        is_published: true,
        deleted_at: null,
        AND: [
          // Company filter - include global and multi-company announcements
          {
            OR: [
              { company_id: companyId },
              { is_global: true },
              { target_company_ids: { array_contains: companyId } },
            ],
          },
          // Expiry filter
          {
            OR: [
              { expires_at: null },
              { expires_at: { gte: now } },
            ],
          },
        ],
      },
      select: ANNOUNCEMENT_LIST_SELECT,
      orderBy: [
        { is_pinned: 'desc' },
        { published_at: 'desc' },
      ],
    });
  }

  /**
   * Create a new announcement
   */
  async create(data: CreateAnnouncementDTO, user: AuthUser) {
    // Check access to company (if not global)
    if (!data.is_global && data.company_id) {
      if (user.accessibleCompanyIds?.length && !user.accessibleCompanyIds.includes(data.company_id)) {
        throw new Error('Access denied to this company');
      }
    }

    // For multi-company, check access to all target companies
    if (data.target_company_ids?.length) {
      for (const cid of data.target_company_ids) {
        if (user.accessibleCompanyIds?.length && !user.accessibleCompanyIds.includes(cid)) {
          throw new Error(`Access denied to company ${cid}`);
        }
      }
    }

    const employeeId = user.employee?.id;

    const announcement = await prisma.announcement.create({
      data: {
        company_id: data.is_global ? null : data.company_id,
        target_company_ids: data.target_company_ids || undefined,
        is_global: data.is_global ?? false,
        title: data.title,
        content: data.content,
        category: data.category,
        priority: data.priority || 'normal',
        visibility: data.visibility || 'all',
        target_audience: data.target_audience,
        target_ids: data.target_ids,
        is_pinned: data.is_pinned ?? false,
        is_published: data.is_published ?? false,
        published_at: data.is_published ? new Date() : null,
        expires_at: data.expires_at ? new Date(data.expires_at) : null,
        created_by: employeeId,
      },
      select: ANNOUNCEMENT_SELECT,
    });

    // Send notifications if published immediately
    if (data.is_published) {
      this.sendAnnouncementNotificationsV2(
        announcement.id,
        data.title,
        data.priority || 'normal',
        data.is_global,
        data.company_id,
        data.target_company_ids
      );
    }

    return announcement;
  }

  /**
   * Send notifications to company employees for a new announcement
   */
  private async sendAnnouncementNotifications(announcementId: number, companyId: number, title: string, priority: string) {
    try {
      const notificationType = priority === 'urgent' ? NOTIFICATION_TYPES.ANNOUNCEMENT_URGENT : NOTIFICATION_TYPES.ANNOUNCEMENT_NEW;

      await notificationService.notifyCompanyEmployees(companyId, {
        type: notificationType,
        title: priority === 'urgent' ? `[URGENT] ${title}` : 'New Announcement',
        message: title,
        data: { announcement_id: announcementId },
        link: '/employee/announcements',
      });
    } catch (error) {
      console.error('Failed to send announcement notifications:', error);
      // Don't throw - notifications are not critical
    }
  }

  /**
   * Send notifications for global or multi-company announcements
   */
  private async sendAnnouncementNotificationsV2(
    announcementId: number,
    title: string,
    priority: string,
    isGlobal?: boolean,
    companyId?: number,
    targetCompanyIds?: number[]
  ) {
    try {
      const notificationType = priority === 'urgent' ? NOTIFICATION_TYPES.ANNOUNCEMENT_URGENT : NOTIFICATION_TYPES.ANNOUNCEMENT_NEW;
      const notificationData = {
        type: notificationType,
        title: priority === 'urgent' ? `[URGENT] ${title}` : 'New Announcement',
        message: title,
        data: { announcement_id: announcementId },
        link: '/employee/announcements',
      };

      if (isGlobal) {
        // Send to all employees across all companies
        await notificationService.notifyAllEmployees(notificationData);
      } else if (targetCompanyIds && targetCompanyIds.length > 0) {
        // Send to employees in selected companies
        for (const cid of targetCompanyIds) {
          await notificationService.notifyCompanyEmployees(cid, notificationData);
        }
      } else if (companyId) {
        // Send to single company
        await notificationService.notifyCompanyEmployees(companyId, notificationData);
      }
    } catch (error) {
      console.error('Failed to send announcement notifications:', error);
      // Don't throw - notifications are not critical
    }
  }

  /**
   * Update an announcement
   */
  async update(id: number, data: UpdateAnnouncementDTO, user: AuthUser) {
    const existing = await prisma.announcement.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new Error('Announcement not found');
    }

    // Check access to company (skip for global announcements)
    if (!existing.is_global && existing.company_id !== null) {
      if (user.accessibleCompanyIds?.length && !user.accessibleCompanyIds.includes(existing.company_id)) {
        throw new Error('Access denied to this announcement');
      }
    }

    return prisma.announcement.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        priority: data.priority,
        visibility: data.visibility,
        target_audience: data.target_audience,
        target_ids: data.target_ids,
        is_pinned: data.is_pinned,
        expires_at: data.expires_at === null ? null : data.expires_at ? new Date(data.expires_at) : undefined,
      },
      select: ANNOUNCEMENT_SELECT,
    });
  }

  /**
   * Soft delete an announcement
   */
  async delete(id: number, user: AuthUser) {
    const existing = await prisma.announcement.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new Error('Announcement not found');
    }

    // Check access to company (skip for global announcements)
    if (!existing.is_global && existing.company_id !== null) {
      if (user.accessibleCompanyIds?.length && !user.accessibleCompanyIds.includes(existing.company_id)) {
        throw new Error('Access denied to this announcement');
      }
    }

    // Delete related notifications (announcements store id in data.announcement_id)
    await prisma.$executeRaw`
      DELETE FROM notifications
      WHERE type IN ('announcement_new', 'announcement_urgent')
      AND JSON_EXTRACT(data, '$.announcement_id') = ${id}
    `;

    return prisma.announcement.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  /**
   * Publish an announcement
   */
  async publish(id: number, user: AuthUser) {
    const existing = await prisma.announcement.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new Error('Announcement not found');
    }

    // Check access to company (if not global)
    if (!existing.is_global && existing.company_id) {
      if (user.accessibleCompanyIds?.length && !user.accessibleCompanyIds.includes(existing.company_id)) {
        throw new Error('Access denied to this announcement');
      }
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        is_published: true,
        published_at: new Date(),
      },
      select: ANNOUNCEMENT_SELECT,
    });

    // Send notifications using V2 method for global/multi-company support
    const targetCompanyIds = existing.target_company_ids as number[] | null;
    this.sendAnnouncementNotificationsV2(
      id,
      existing.title,
      existing.priority,
      existing.is_global,
      existing.company_id || undefined,
      targetCompanyIds || undefined
    );

    return announcement;
  }

  /**
   * Unpublish an announcement
   */
  async unpublish(id: number, user: AuthUser) {
    const existing = await prisma.announcement.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new Error('Announcement not found');
    }

    // Check access to company (skip for global announcements)
    if (!existing.is_global && existing.company_id !== null) {
      if (user.accessibleCompanyIds?.length && !user.accessibleCompanyIds.includes(existing.company_id)) {
        throw new Error('Access denied to this announcement');
      }
    }

    return prisma.announcement.update({
      where: { id },
      data: {
        is_published: false,
      },
      select: ANNOUNCEMENT_SELECT,
    });
  }

  /**
   * Toggle pin status
   */
  async togglePin(id: number, user: AuthUser) {
    const existing = await prisma.announcement.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new Error('Announcement not found');
    }

    // Check access to company (skip for global announcements)
    if (!existing.is_global && existing.company_id !== null) {
      if (user.accessibleCompanyIds?.length && !user.accessibleCompanyIds.includes(existing.company_id)) {
        throw new Error('Access denied to this announcement');
      }
    }

    return prisma.announcement.update({
      where: { id },
      data: {
        is_pinned: !existing.is_pinned,
      },
      select: ANNOUNCEMENT_SELECT,
    });
  }

  /**
   * Increment view count
   */
  async incrementViews(id: number) {
    return prisma.announcement.update({
      where: { id },
      data: {
        views_count: { increment: 1 },
      },
      select: { id: true, views_count: true },
    });
  }

  /**
   * Get statistics
   */
  async getStatistics(companyId?: number, user?: AuthUser) {
    const where: Prisma.AnnouncementWhereInput = {
      deleted_at: null,
    };

    // Include global and multi-company announcements when filtering by company
    if (companyId) {
      where.OR = [
        { company_id: companyId },
        { is_global: true },
        { target_company_ids: { array_contains: companyId } },
      ];
    } else if (user?.accessibleCompanyIds?.length) {
      where.OR = [
        { company_id: { in: user.accessibleCompanyIds } },
        { is_global: true },
        ...user.accessibleCompanyIds.map(cid => ({ target_company_ids: { array_contains: cid } })),
      ];
    }

    const [byCategory, byPriority, totals, published, pinned, urgent] = await Promise.all([
      prisma.announcement.groupBy({
        by: ['category'],
        where,
        _count: true,
      }),
      prisma.announcement.groupBy({
        by: ['priority'],
        where,
        _count: true,
      }),
      prisma.announcement.aggregate({
        where,
        _count: true,
      }),
      prisma.announcement.count({
        where: { ...where, is_published: true },
      }),
      prisma.announcement.count({
        where: { ...where, is_pinned: true },
      }),
      prisma.announcement.count({
        where: { ...where, priority: 'urgent' },
      }),
    ]);

    return {
      total: totals._count,
      published,
      draft: totals._count - published,
      pinned,
      urgent,
      by_category: byCategory.map((c) => ({ category: c.category, count: c._count })),
      by_priority: byPriority.map((p) => ({ priority: p.priority, count: p._count })),
    };
  }
}
