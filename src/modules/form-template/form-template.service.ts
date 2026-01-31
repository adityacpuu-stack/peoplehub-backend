import { PrismaClient, Prisma } from '@prisma/client';
import {
  FormTemplateListQuery,
  CreateFormTemplateDTO,
  UpdateFormTemplateDTO,
  FORM_TEMPLATE_SELECT,
  FORM_TEMPLATE_DETAIL_SELECT,
  DEFAULT_FORM_TEMPLATES,
} from './form-template.types';
import { AuthUser } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class FormTemplateService {
  async list(query: FormTemplateListQuery) {
    const { page = 1, limit = 20, search, type, category, is_active } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.FormTemplateWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (type) where.type = type;
    if (category) where.category = category;
    if (is_active !== undefined) where.is_active = is_active;

    const [data, total] = await Promise.all([
      prisma.formTemplate.findMany({
        where,
        select: FORM_TEMPLATE_SELECT,
        skip,
        take: limit,
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
      }),
      prisma.formTemplate.count({ where }),
    ]);

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: number) {
    const template = await prisma.formTemplate.findUnique({
      where: { id },
      select: FORM_TEMPLATE_DETAIL_SELECT,
    });
    if (!template) throw new Error('Form template not found');
    return template;
  }

  async getByCode(code: string) {
    const template = await prisma.formTemplate.findFirst({
      where: { code },
      select: FORM_TEMPLATE_DETAIL_SELECT,
    });
    if (!template) throw new Error('Form template not found');
    return template;
  }

  async getByType(type: string) {
    return prisma.formTemplate.findMany({
      where: { type, is_active: true },
      select: FORM_TEMPLATE_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async getByCategory(category: string) {
    return prisma.formTemplate.findMany({
      where: { category, is_active: true },
      select: FORM_TEMPLATE_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async create(data: CreateFormTemplateDTO, user: AuthUser) {
    if (data.code) {
      const existing = await prisma.formTemplate.findFirst({ where: { code: data.code } });
      if (existing) throw new Error('Template code already exists');
    }

    return prisma.formTemplate.create({
      data: {
        ...data,
        is_active: data.is_active ?? true,
        version: 1,
        created_by: user.id,
      },
      select: FORM_TEMPLATE_DETAIL_SELECT,
    });
  }

  async update(id: number, data: UpdateFormTemplateDTO, user: AuthUser) {
    const existing = await prisma.formTemplate.findUnique({ where: { id } });
    if (!existing) throw new Error('Form template not found');

    if (data.code && data.code !== existing.code) {
      const duplicate = await prisma.formTemplate.findFirst({ where: { code: data.code, id: { not: id } } });
      if (duplicate) throw new Error('Template code already exists');
    }

    // Increment version if content changes
    const newVersion = data.content && data.content !== existing.content ? (existing.version || 1) + 1 : existing.version;

    return prisma.formTemplate.update({
      where: { id },
      data: {
        ...data,
        version: newVersion,
      },
      select: FORM_TEMPLATE_DETAIL_SELECT,
    });
  }

  async delete(id: number, user: AuthUser) {
    const existing = await prisma.formTemplate.findUnique({ where: { id } });
    if (!existing) throw new Error('Form template not found');

    return prisma.formTemplate.delete({ where: { id } });
  }

  async duplicate(id: number, user: AuthUser) {
    const existing = await prisma.formTemplate.findUnique({
      where: { id },
      select: FORM_TEMPLATE_DETAIL_SELECT,
    });
    if (!existing) throw new Error('Form template not found');

    const newCode = existing.code ? `${existing.code}_COPY` : undefined;

    return prisma.formTemplate.create({
      data: {
        name: `${existing.name} (Copy)`,
        code: newCode,
        description: existing.description,
        content: existing.content,
        type: existing.type,
        category: existing.category,
        variables: existing.variables as any,
        is_active: false,
        version: 1,
        created_by: user.id,
      },
      select: FORM_TEMPLATE_DETAIL_SELECT,
    });
  }

  async render(id: number, data: Record<string, any>) {
    const template = await prisma.formTemplate.findUnique({
      where: { id },
      select: { content: true, variables: true },
    });
    if (!template) throw new Error('Form template not found');
    if (!template.content) throw new Error('Template has no content');

    let rendered = template.content;

    // Add current date
    data.current_date = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Replace all variables
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(regex, String(value ?? ''));
    }

    return { content: rendered };
  }

  async seedDefaults(user: AuthUser) {
    const results = { created: 0, skipped: 0 };

    for (const template of DEFAULT_FORM_TEMPLATES) {
      try {
        const existing = await prisma.formTemplate.findFirst({ where: { code: template.code } });
        if (existing) {
          results.skipped++;
          continue;
        }

        await prisma.formTemplate.create({
          data: {
            ...template,
            is_active: true,
            version: 1,
            created_by: user.id,
          },
        });
        results.created++;
      } catch {
        results.skipped++;
      }
    }

    return results;
  }

  async getStatistics() {
    const [byType, byCategory, totals] = await Promise.all([
      prisma.formTemplate.groupBy({
        by: ['type'],
        where: { is_active: true },
        _count: true,
      }),
      prisma.formTemplate.groupBy({
        by: ['category'],
        where: { is_active: true },
        _count: true,
      }),
      prisma.formTemplate.aggregate({
        where: { is_active: true },
        _count: true,
      }),
    ]);

    return {
      total_templates: totals._count,
      by_type: byType.map((t) => ({ type: t.type, count: t._count })),
      by_category: byCategory.map((c) => ({ category: c.category, count: c._count })),
    };
  }
}
