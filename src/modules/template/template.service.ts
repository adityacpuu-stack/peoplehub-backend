import { PrismaClient, Prisma } from '@prisma/client';
import {
  TemplateListQuery,
  CreateTemplateDTO,
  UpdateTemplateDTO,
  TEMPLATE_SELECT,
  TEMPLATE_LIST_SELECT,
} from './template.types';
import { AuthUser } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class TemplateService {
  /**
   * List templates with pagination and filtering
   */
  async list(query: TemplateListQuery, user: AuthUser) {
    const {
      page = 1,
      limit = 20,
      search,
      company_id,
      category,
      file_type,
      is_active,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TemplateWhereInput = {
      deleted_at: null,
    };

    // Filter by company
    if (company_id) {
      where.company_id = company_id;
    } else if (user.accessibleCompanyIds && user.accessibleCompanyIds.length > 0) {
      where.company_id = { in: user.accessibleCompanyIds };
    }

    // Search
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Filters
    if (category) where.category = category;
    if (file_type) where.file_type = file_type;
    if (is_active !== undefined) where.is_active = is_active;

    // Build orderBy
    const orderBy: Prisma.TemplateOrderByWithRelationInput = {};
    if (sort_by === 'name') orderBy.name = sort_order;
    else if (sort_by === 'category') orderBy.category = sort_order;
    else if (sort_by === 'file_type') orderBy.file_type = sort_order;
    else if (sort_by === 'updated_at') orderBy.updated_at = sort_order;
    else orderBy.created_at = sort_order;

    const [data, total] = await Promise.all([
      prisma.template.findMany({
        where,
        select: TEMPLATE_LIST_SELECT,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.template.count({ where }),
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
   * Get template by ID
   */
  async getById(id: number, user: AuthUser) {
    const template = await prisma.template.findFirst({
      where: {
        id,
        deleted_at: null,
        company_id: user.accessibleCompanyIds?.length
          ? { in: user.accessibleCompanyIds }
          : undefined,
      },
      select: TEMPLATE_SELECT,
    });

    if (!template) {
      throw new Error('Template not found');
    }

    return template;
  }

  /**
   * Get templates by company
   */
  async getByCompany(companyId: number, user: AuthUser) {
    // Check access
    if (user.accessibleCompanyIds?.length && !user.accessibleCompanyIds.includes(companyId)) {
      throw new Error('Access denied to this company');
    }

    return prisma.template.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        deleted_at: null,
      },
      select: TEMPLATE_LIST_SELECT,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Get templates by category
   */
  async getByCategory(category: string, companyId?: number, user?: AuthUser) {
    const where: Prisma.TemplateWhereInput = {
      category,
      is_active: true,
      deleted_at: null,
    };

    if (companyId) {
      where.company_id = companyId;
    } else if (user?.accessibleCompanyIds?.length) {
      where.company_id = { in: user.accessibleCompanyIds };
    }

    return prisma.template.findMany({
      where,
      select: TEMPLATE_LIST_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Create a new template
   */
  async create(data: CreateTemplateDTO, user: AuthUser) {
    // Check access to company
    if (user.accessibleCompanyIds?.length && !user.accessibleCompanyIds.includes(data.company_id)) {
      throw new Error('Access denied to this company');
    }

    // Check for duplicate name in same company
    const existing = await prisma.template.findFirst({
      where: {
        company_id: data.company_id,
        name: data.name,
        deleted_at: null,
      },
    });

    if (existing) {
      throw new Error('A template with this name already exists in this company');
    }

    const employeeId = user.employee?.id;

    return prisma.template.create({
      data: {
        company_id: data.company_id,
        name: data.name,
        description: data.description,
        category: data.category,
        file_type: data.file_type,
        file_path: data.file_path,
        file_name: data.file_name,
        file_size: data.file_size ? BigInt(data.file_size) : null,
        mime_type: data.mime_type,
        version: data.version || '1.0',
        is_active: data.is_active ?? true,
        created_by: employeeId,
      },
      select: TEMPLATE_SELECT,
    });
  }

  /**
   * Update a template
   */
  async update(id: number, data: UpdateTemplateDTO, user: AuthUser) {
    const existing = await prisma.template.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new Error('Template not found');
    }

    // Check access to company
    if (user.accessibleCompanyIds?.length && !user.accessibleCompanyIds.includes(existing.company_id)) {
      throw new Error('Access denied to this template');
    }

    // Check for duplicate name if name is being changed
    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.template.findFirst({
        where: {
          company_id: existing.company_id,
          name: data.name,
          id: { not: id },
          deleted_at: null,
        },
      });

      if (duplicate) {
        throw new Error('A template with this name already exists in this company');
      }
    }

    return prisma.template.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        file_type: data.file_type,
        file_path: data.file_path,
        file_name: data.file_name,
        file_size: data.file_size ? BigInt(data.file_size) : undefined,
        mime_type: data.mime_type,
        version: data.version,
        is_active: data.is_active,
      },
      select: TEMPLATE_SELECT,
    });
  }

  /**
   * Soft delete a template
   */
  async delete(id: number, user: AuthUser) {
    const existing = await prisma.template.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new Error('Template not found');
    }

    // Check access to company
    if (user.accessibleCompanyIds?.length && !user.accessibleCompanyIds.includes(existing.company_id)) {
      throw new Error('Access denied to this template');
    }

    return prisma.template.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  /**
   * Duplicate a template
   */
  async duplicate(id: number, user: AuthUser) {
    const existing = await prisma.template.findFirst({
      where: { id, deleted_at: null },
      select: TEMPLATE_SELECT,
    });

    if (!existing) {
      throw new Error('Template not found');
    }

    // Check access to company
    if (user.accessibleCompanyIds?.length && !user.accessibleCompanyIds.includes(existing.company_id)) {
      throw new Error('Access denied to this template');
    }

    const employeeId = user.employee?.id;

    return prisma.template.create({
      data: {
        company_id: existing.company_id,
        name: `${existing.name} (Copy)`,
        description: existing.description,
        category: existing.category,
        file_type: existing.file_type,
        file_path: existing.file_path,
        file_name: existing.file_name,
        file_size: existing.file_size,
        mime_type: existing.mime_type,
        version: '1.0',
        is_active: false, // Set inactive by default for copies
        created_by: employeeId,
      },
      select: TEMPLATE_SELECT,
    });
  }

  /**
   * Increment download count
   */
  async incrementDownload(id: number) {
    return prisma.template.update({
      where: { id },
      data: {
        download_count: { increment: 1 },
      },
      select: { id: true, download_count: true },
    });
  }

  /**
   * Get statistics
   */
  async getStatistics(companyId?: number, user?: AuthUser) {
    const where: Prisma.TemplateWhereInput = {
      deleted_at: null,
    };

    if (companyId) {
      where.company_id = companyId;
    } else if (user?.accessibleCompanyIds?.length) {
      where.company_id = { in: user.accessibleCompanyIds };
    }

    const [byCategory, byFileType, totals, active] = await Promise.all([
      prisma.template.groupBy({
        by: ['category'],
        where,
        _count: true,
      }),
      prisma.template.groupBy({
        by: ['file_type'],
        where,
        _count: true,
      }),
      prisma.template.aggregate({
        where,
        _count: true,
      }),
      prisma.template.count({
        where: { ...where, is_active: true },
      }),
    ]);

    return {
      total: totals._count,
      active,
      inactive: totals._count - active,
      by_category: byCategory.map((c) => ({ category: c.category, count: c._count })),
      by_file_type: byFileType.map((f) => ({ file_type: f.file_type, count: f._count })),
    };
  }
}
