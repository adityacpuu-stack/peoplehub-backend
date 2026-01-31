import { PrismaClient, Prisma } from '@prisma/client';
import {
  DocumentCategoryListQuery,
  CreateDocumentCategoryDTO,
  UpdateDocumentCategoryDTO,
  DOCUMENT_CATEGORY_WITH_CHILDREN_SELECT,
  DOCUMENT_CATEGORY_WITH_PARENT_SELECT,
  DEFAULT_DOCUMENT_CATEGORIES,
} from './document-category.types';
import { AuthUser } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class DocumentCategoryService {
  async list(query: DocumentCategoryListQuery) {
    const { page = 1, limit = 50, search, parent_id, is_active, include_children } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DocumentCategoryWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (parent_id !== undefined) {
      where.parent_id = parent_id;
    }

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    const select = include_children ? DOCUMENT_CATEGORY_WITH_CHILDREN_SELECT : DOCUMENT_CATEGORY_WITH_PARENT_SELECT;

    const [data, total] = await Promise.all([
      prisma.documentCategory.findMany({
        where,
        select,
        skip,
        take: limit,
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      }),
      prisma.documentCategory.count({ where }),
    ]);

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: number) {
    const category = await prisma.documentCategory.findUnique({
      where: { id },
      select: DOCUMENT_CATEGORY_WITH_CHILDREN_SELECT,
    });
    if (!category) throw new Error('Document category not found');
    return category;
  }

  async getByCode(code: string) {
    const category = await prisma.documentCategory.findFirst({
      where: { code },
      select: DOCUMENT_CATEGORY_WITH_CHILDREN_SELECT,
    });
    if (!category) throw new Error('Document category not found');
    return category;
  }

  async getRootCategories() {
    return prisma.documentCategory.findMany({
      where: { parent_id: null, is_active: true },
      select: DOCUMENT_CATEGORY_WITH_CHILDREN_SELECT,
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    });
  }

  async getTree() {
    const categories = await prisma.documentCategory.findMany({
      where: { is_active: true },
      select: DOCUMENT_CATEGORY_WITH_CHILDREN_SELECT,
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    });

    // Build tree structure
    const buildTree = (parentId: number | null): any[] => {
      return categories
        .filter((c) => c.parent_id === parentId)
        .map((c) => ({
          ...c,
          children: buildTree(c.id),
        }));
    };

    return buildTree(null);
  }

  async create(data: CreateDocumentCategoryDTO, user: AuthUser) {
    if (data.code) {
      const existing = await prisma.documentCategory.findFirst({ where: { code: data.code } });
      if (existing) throw new Error('Category code already exists');
    }

    if (data.parent_id) {
      const parent = await prisma.documentCategory.findUnique({ where: { id: data.parent_id } });
      if (!parent) throw new Error('Parent category not found');
    }

    return prisma.documentCategory.create({
      data: {
        ...data,
        is_active: data.is_active ?? true,
      },
      select: DOCUMENT_CATEGORY_WITH_PARENT_SELECT,
    });
  }

  async update(id: number, data: UpdateDocumentCategoryDTO, user: AuthUser) {
    const existing = await prisma.documentCategory.findUnique({ where: { id } });
    if (!existing) throw new Error('Document category not found');

    if (data.code && data.code !== existing.code) {
      const duplicate = await prisma.documentCategory.findFirst({ where: { code: data.code, id: { not: id } } });
      if (duplicate) throw new Error('Category code already exists');
    }

    if (data.parent_id !== undefined) {
      if (data.parent_id === id) throw new Error('Category cannot be its own parent');
      if (data.parent_id) {
        const parent = await prisma.documentCategory.findUnique({ where: { id: data.parent_id } });
        if (!parent) throw new Error('Parent category not found');
        // Check for circular reference
        if (await this.isDescendant(data.parent_id, id)) {
          throw new Error('Cannot set parent to a descendant category');
        }
      }
    }

    return prisma.documentCategory.update({
      where: { id },
      data,
      select: DOCUMENT_CATEGORY_WITH_PARENT_SELECT,
    });
  }

  async delete(id: number, user: AuthUser) {
    const existing = await prisma.documentCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { documents: true, children: true },
        },
      },
    });

    if (!existing) throw new Error('Document category not found');
    if (existing._count.documents > 0) {
      throw new Error(`Cannot delete category with ${existing._count.documents} documents`);
    }
    if (existing._count.children > 0) {
      throw new Error(`Cannot delete category with ${existing._count.children} subcategories`);
    }

    return prisma.documentCategory.delete({ where: { id } });
  }

  async seedDefaults(user: AuthUser) {
    const results = { created: 0, skipped: 0 };

    for (const category of DEFAULT_DOCUMENT_CATEGORIES) {
      try {
        const existing = await prisma.documentCategory.findFirst({ where: { code: category.code } });
        if (existing) {
          results.skipped++;
          continue;
        }

        await prisma.documentCategory.create({
          data: {
            ...category,
            is_active: true,
          },
        });
        results.created++;
      } catch {
        results.skipped++;
      }
    }

    return results;
  }

  async reorder(categoryIds: number[]) {
    const updates = categoryIds.map((id, index) =>
      prisma.documentCategory.update({
        where: { id },
        data: { sort_order: index + 1 },
      })
    );

    await prisma.$transaction(updates);
    return { message: 'Categories reordered successfully' };
  }

  async getStatistics() {
    const [total, active, withDocuments] = await Promise.all([
      prisma.documentCategory.count(),
      prisma.documentCategory.count({ where: { is_active: true } }),
      prisma.documentCategory.findMany({
        select: {
          id: true,
          name: true,
          _count: { select: { documents: true } },
        },
        orderBy: { documents: { _count: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      total_categories: total,
      active_categories: active,
      top_categories: withDocuments.map((c) => ({
        id: c.id,
        name: c.name,
        document_count: c._count.documents,
      })),
    };
  }

  private async isDescendant(categoryId: number, potentialAncestorId: number): Promise<boolean> {
    const category = await prisma.documentCategory.findUnique({
      where: { id: categoryId },
      select: { parent_id: true },
    });

    if (!category || !category.parent_id) return false;
    if (category.parent_id === potentialAncestorId) return true;
    return this.isDescendant(category.parent_id, potentialAncestorId);
  }
}
