import { PrismaClient, Prisma } from '@prisma/client';
import {
  DocumentListQuery,
  EmployeeDocumentListQuery,
  DocumentCategoryListQuery,
  CreateDocumentDTO,
  UpdateDocumentDTO,
  CreateEmployeeDocumentDTO,
  UpdateEmployeeDocumentDTO,
  VerifyDocumentDTO,
  CreateDocumentCategoryDTO,
  UpdateDocumentCategoryDTO,
  DOCUMENT_STATUS,
  DOCUMENT_LIST_SELECT,
  DOCUMENT_DETAIL_SELECT,
  EMPLOYEE_DOCUMENT_LIST_SELECT,
  EMPLOYEE_DOCUMENT_DETAIL_SELECT,
  DOCUMENT_CATEGORY_SELECT,
} from './document.types';
import { AuthUser, hasCompanyAccess, canAccessEmployee, getHighestRoleLevel, ROLE_HIERARCHY } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class DocumentService {
  // ==========================================
  // DOCUMENT METHODS (Company Documents)
  // ==========================================

  async listDocuments(query: DocumentListQuery, user: AuthUser) {
    const {
      page = 1,
      limit = 10,
      company_id,
      category_id,
      document_type,
      status,
      visibility,
      search,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const where: Prisma.DocumentWhereInput = {};

    if (category_id) where.category_id = category_id;
    if (document_type) where.document_type = document_type;
    if (status) where.status = status;
    if (visibility) where.visibility = visibility;

    // Filter by company through employee
    if (company_id) {
      where.employee = { company_id };
    } else if (user.employee?.company_id && getHighestRoleLevel(user.roles) < ROLE_HIERARCHY['CEO']) {
      // Non-CEO can only see their company's documents or public docs
      where.OR = [
        { employee: { company_id: user.employee.company_id } },
        { visibility: 'public' },
        { employee_id: null }, // Company-wide documents
      ];
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        select: DOCUMENT_LIST_SELECT,
        skip,
        take: limit,
        orderBy: { [sort_by]: sort_order },
      }),
      prisma.document.count({ where }),
    ]);

    return {
      data: documents,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getDocumentById(id: number, user: AuthUser) {
    const document = await prisma.document.findUnique({
      where: { id },
      select: DOCUMENT_DETAIL_SELECT,
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Check access
    if (document.employee_id) {
      const hasAccess = await canAccessEmployee(user, document.employee_id);
      if (!hasAccess && document.visibility === 'private') {
        throw new Error('Access denied');
      }
    }

    // Increment download count
    await prisma.document.update({
      where: { id },
      data: { download_count: { increment: 1 } },
    });

    return document;
  }

  async createDocument(data: CreateDocumentDTO, user: AuthUser) {
    // Check employee access if provided
    if (data.employee_id) {
      const hasAccess = await canAccessEmployee(user, data.employee_id);
      if (!hasAccess) {
        throw new Error('Access denied to this employee');
      }
    }

    return prisma.document.create({
      data: {
        title: data.title,
        description: data.description,
        file_path: data.file_path,
        file_name: data.file_name,
        file_size: data.file_size ? BigInt(data.file_size) : null,
        file_type: data.file_type,
        mime_type: data.mime_type,
        document_type: data.document_type,
        category_id: data.category_id,
        employee_id: data.employee_id,
        uploaded_by: user.employee?.id,
        expiry_date: data.expiry_date ? new Date(data.expiry_date) : null,
        tags: data.tags,
        visibility: data.visibility || 'company',
        is_required: data.is_required,
        status: DOCUMENT_STATUS.ACTIVE,
      },
      select: DOCUMENT_DETAIL_SELECT,
    });
  }

  async updateDocument(id: number, data: UpdateDocumentDTO, user: AuthUser) {
    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Document not found');
    }

    // Check access
    if (existing.employee_id) {
      const hasAccess = await canAccessEmployee(user, existing.employee_id);
      if (!hasAccess) {
        throw new Error('Access denied');
      }
    }

    return prisma.document.update({
      where: { id },
      data: {
        ...data,
        expiry_date: data.expiry_date ? new Date(data.expiry_date) : undefined,
      },
      select: DOCUMENT_DETAIL_SELECT,
    });
  }

  async deleteDocument(id: number, user: AuthUser) {
    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Document not found');
    }

    // Check access - only HR or uploader can delete
    const isUploader = existing.uploaded_by === user.employee?.id;
    const isHR = getHighestRoleLevel(user.roles) >= ROLE_HIERARCHY['HR Staff'];

    if (!isUploader && !isHR) {
      throw new Error('Access denied');
    }

    // Soft delete
    return prisma.document.update({
      where: { id },
      data: { status: DOCUMENT_STATUS.DELETED },
    });
  }

  async archiveDocument(id: number, user: AuthUser) {
    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Document not found');
    }

    return prisma.document.update({
      where: { id },
      data: { status: DOCUMENT_STATUS.ARCHIVED },
      select: DOCUMENT_DETAIL_SELECT,
    });
  }

  async verifyDocument(id: number, user: AuthUser) {
    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Document not found');
    }

    // Only HR can verify
    if (getHighestRoleLevel(user.roles) < ROLE_HIERARCHY['HR Staff']) {
      throw new Error('Only HR can verify documents');
    }

    return prisma.document.update({
      where: { id },
      data: {
        is_verified: true,
        verified_at: new Date(),
        reviewed_by: user.employee?.id,
        reviewed_at: new Date(),
      },
      select: DOCUMENT_DETAIL_SELECT,
    });
  }

  // ==========================================
  // EMPLOYEE DOCUMENT METHODS
  // ==========================================

  async listEmployeeDocuments(query: EmployeeDocumentListQuery, user: AuthUser) {
    const {
      page = 1,
      limit = 10,
      employee_id,
      company_id,
      department_id,
      document_type,
      is_verified,
      is_expired,
      expiring_within_days,
      search,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const where: Prisma.EmployeeDocumentWhereInput = {
      deleted_at: null,
    };

    if (employee_id) where.employee_id = employee_id;
    if (document_type) where.document_type = document_type;
    if (is_verified !== undefined) where.is_verified = is_verified;

    // Company/department filter
    if (company_id) {
      where.employee = { company_id };
    } else if (user.employee?.company_id && getHighestRoleLevel(user.roles) < ROLE_HIERARCHY['CEO']) {
      where.employee = { company_id: user.employee.company_id };
    }

    if (department_id) {
      where.employee = { ...where.employee as object, department_id };
    }

    // Expiry filters
    const now = new Date();
    if (is_expired) {
      where.expiry_date = { lt: now };
    } else if (expiring_within_days) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + expiring_within_days);
      where.expiry_date = { lte: futureDate, gte: now };
    }

    if (search) {
      where.OR = [
        { document_name: { contains: search } },
        { document_number: { contains: search } },
        { description: { contains: search } },
        { employee: { name: { contains: search } } },
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.employeeDocument.findMany({
        where,
        select: EMPLOYEE_DOCUMENT_LIST_SELECT,
        skip,
        take: limit,
        orderBy: { [sort_by]: sort_order },
      }),
      prisma.employeeDocument.count({ where }),
    ]);

    return {
      data: documents,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getEmployeeDocumentById(id: number, user: AuthUser) {
    const document = await prisma.employeeDocument.findFirst({
      where: { id, deleted_at: null },
      select: EMPLOYEE_DOCUMENT_DETAIL_SELECT,
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Check access
    const isOwner = user.employee?.id === document.employee_id;
    const hasAccess = await canAccessEmployee(user, document.employee_id);

    if (!isOwner && !hasAccess) {
      throw new Error('Access denied');
    }

    return document;
  }

  async getMyDocuments(user: AuthUser) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    return prisma.employeeDocument.findMany({
      where: {
        employee_id: user.employee.id,
        deleted_at: null,
      },
      select: EMPLOYEE_DOCUMENT_LIST_SELECT,
      orderBy: { created_at: 'desc' },
    });
  }

  async uploadMyDocument(data: CreateEmployeeDocumentDTO, user: AuthUser) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    // Force employee_id to be the current user's employee ID
    return prisma.employeeDocument.create({
      data: {
        employee_id: user.employee.id,
        document_name: data.document_name,
        document_type: data.document_type,
        file_path: data.file_path,
        file_name: data.file_name,
        file_size: data.file_size ? BigInt(data.file_size) : null,
        mime_type: data.mime_type,
        document_number: data.document_number,
        description: data.description,
        issue_date: data.issue_date ? new Date(data.issue_date) : null,
        expiry_date: data.expiry_date ? new Date(data.expiry_date) : null,
        issuing_authority: data.issuing_authority,
        is_required: data.is_required,
        is_confidential: data.is_confidential,
        tags: data.tags,
        uploaded_by: user.employee.id,
      },
      select: EMPLOYEE_DOCUMENT_DETAIL_SELECT,
    });
  }

  async deleteMyDocument(id: number, user: AuthUser) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    const existing = await prisma.employeeDocument.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new Error('Document not found');
    }

    // Check ownership
    if (existing.employee_id !== user.employee.id) {
      throw new Error('Access denied - you can only delete your own documents');
    }

    // Check if document is verified - cannot delete verified documents
    if (existing.is_verified) {
      throw new Error('Cannot delete verified documents');
    }

    // Soft delete
    return prisma.employeeDocument.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async createEmployeeDocument(data: CreateEmployeeDocumentDTO, user: AuthUser) {
    // Check employee access
    const hasAccess = await canAccessEmployee(user, data.employee_id);
    if (!hasAccess) {
      throw new Error('Access denied to this employee');
    }

    return prisma.employeeDocument.create({
      data: {
        employee_id: data.employee_id,
        document_name: data.document_name,
        document_type: data.document_type,
        file_path: data.file_path,
        file_name: data.file_name,
        file_size: data.file_size ? BigInt(data.file_size) : null,
        mime_type: data.mime_type,
        document_number: data.document_number,
        description: data.description,
        issue_date: data.issue_date ? new Date(data.issue_date) : null,
        expiry_date: data.expiry_date ? new Date(data.expiry_date) : null,
        issuing_authority: data.issuing_authority,
        is_required: data.is_required,
        is_confidential: data.is_confidential,
        tags: data.tags,
        uploaded_by: user.employee?.id,
      },
      select: EMPLOYEE_DOCUMENT_DETAIL_SELECT,
    });
  }

  async updateEmployeeDocument(id: number, data: UpdateEmployeeDocumentDTO, user: AuthUser) {
    const existing = await prisma.employeeDocument.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new Error('Document not found');
    }

    // Check access
    const hasAccess = await canAccessEmployee(user, existing.employee_id);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    return prisma.employeeDocument.update({
      where: { id },
      data: {
        ...data,
        issue_date: data.issue_date ? new Date(data.issue_date) : undefined,
        expiry_date: data.expiry_date ? new Date(data.expiry_date) : undefined,
      },
      select: EMPLOYEE_DOCUMENT_DETAIL_SELECT,
    });
  }

  async deleteEmployeeDocument(id: number, user: AuthUser) {
    const existing = await prisma.employeeDocument.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new Error('Document not found');
    }

    // Check access - only HR or uploader can delete
    const isUploader = existing.uploaded_by === user.employee?.id;
    const isHR = getHighestRoleLevel(user.roles) >= ROLE_HIERARCHY['HR Staff'];

    if (!isUploader && !isHR) {
      throw new Error('Access denied');
    }

    // Soft delete
    return prisma.employeeDocument.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async verifyEmployeeDocument(id: number, data: VerifyDocumentDTO, user: AuthUser) {
    const existing = await prisma.employeeDocument.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new Error('Document not found');
    }

    // Only HR can verify
    if (getHighestRoleLevel(user.roles) < ROLE_HIERARCHY['HR Staff']) {
      throw new Error('Only HR can verify documents');
    }

    return prisma.employeeDocument.update({
      where: { id },
      data: {
        is_verified: true,
        verified_at: new Date(),
        verified_by: user.employee?.id,
        verification_notes: data.verification_notes,
      },
      select: EMPLOYEE_DOCUMENT_DETAIL_SELECT,
    });
  }

  async unverifyEmployeeDocument(id: number, user: AuthUser) {
    const existing = await prisma.employeeDocument.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new Error('Document not found');
    }

    // Only HR can unverify
    if (getHighestRoleLevel(user.roles) < ROLE_HIERARCHY['HR Staff']) {
      throw new Error('Only HR can unverify documents');
    }

    return prisma.employeeDocument.update({
      where: { id },
      data: {
        is_verified: false,
        verified_at: null,
        verified_by: null,
        verification_notes: null,
      },
      select: EMPLOYEE_DOCUMENT_DETAIL_SELECT,
    });
  }

  async getExpiringDocuments(days: number, companyId: number | undefined, user: AuthUser) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const where: Prisma.EmployeeDocumentWhereInput = {
      deleted_at: null,
      expiry_date: {
        lte: futureDate,
        gte: new Date(),
      },
    };

    if (companyId) {
      if (!hasCompanyAccess(user, companyId)) {
        throw new Error('Access denied to this company');
      }
      where.employee = { company_id: companyId };
    } else if (user.employee?.company_id && getHighestRoleLevel(user.roles) < ROLE_HIERARCHY['CEO']) {
      where.employee = { company_id: user.employee.company_id };
    }

    return prisma.employeeDocument.findMany({
      where,
      select: EMPLOYEE_DOCUMENT_LIST_SELECT,
      orderBy: { expiry_date: 'asc' },
    });
  }

  async getExpiredDocuments(companyId: number | undefined, user: AuthUser) {
    const where: Prisma.EmployeeDocumentWhereInput = {
      deleted_at: null,
      expiry_date: { lt: new Date() },
    };

    if (companyId) {
      if (!hasCompanyAccess(user, companyId)) {
        throw new Error('Access denied to this company');
      }
      where.employee = { company_id: companyId };
    } else if (user.employee?.company_id && getHighestRoleLevel(user.roles) < ROLE_HIERARCHY['CEO']) {
      where.employee = { company_id: user.employee.company_id };
    }

    return prisma.employeeDocument.findMany({
      where,
      select: EMPLOYEE_DOCUMENT_LIST_SELECT,
      orderBy: { expiry_date: 'asc' },
    });
  }

  async getDocumentStatistics(companyId: number | undefined, user: AuthUser) {
    const where: Prisma.EmployeeDocumentWhereInput = {
      deleted_at: null,
    };

    if (companyId) {
      if (!hasCompanyAccess(user, companyId)) {
        throw new Error('Access denied to this company');
      }
      where.employee = { company_id: companyId };
    } else if (user.employee?.company_id && getHighestRoleLevel(user.roles) < ROLE_HIERARCHY['CEO']) {
      where.employee = { company_id: user.employee.company_id };
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [total, verified, unverified, expired, expiringSoon] = await Promise.all([
      prisma.employeeDocument.count({ where }),
      prisma.employeeDocument.count({ where: { ...where, is_verified: true } }),
      prisma.employeeDocument.count({ where: { ...where, is_verified: false } }),
      prisma.employeeDocument.count({
        where: { ...where, expiry_date: { lt: now } },
      }),
      prisma.employeeDocument.count({
        where: {
          ...where,
          expiry_date: { lte: thirtyDaysFromNow, gte: now },
        },
      }),
    ]);

    // Group by document type
    const byType = await prisma.employeeDocument.groupBy({
      by: ['document_type'],
      where,
      _count: { id: true },
    });

    return {
      total,
      verified,
      unverified,
      expired,
      expiring_soon: expiringSoon,
      by_type: byType.map((t) => ({
        type: t.document_type,
        count: t._count.id,
      })),
    };
  }

  // ==========================================
  // DOCUMENT CATEGORY METHODS
  // ==========================================

  async listCategories(query: DocumentCategoryListQuery) {
    const {
      page = 1,
      limit = 50,
      parent_id,
      is_active,
      search,
    } = query;

    const skip = (page - 1) * limit;
    const where: Prisma.DocumentCategoryWhereInput = {};

    if (parent_id !== undefined) where.parent_id = parent_id || null;
    if (is_active !== undefined) where.is_active = is_active;

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [categories, total] = await Promise.all([
      prisma.documentCategory.findMany({
        where,
        select: DOCUMENT_CATEGORY_SELECT,
        skip,
        take: limit,
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      }),
      prisma.documentCategory.count({ where }),
    ]);

    return {
      data: categories,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getCategoryById(id: number) {
    const category = await prisma.documentCategory.findUnique({
      where: { id },
      select: {
        ...DOCUMENT_CATEGORY_SELECT,
        children: {
          select: {
            id: true,
            name: true,
            code: true,
            is_active: true,
          },
        },
      },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return category;
  }

  async createCategory(data: CreateDocumentCategoryDTO, user: AuthUser) {
    // Only HR can create categories
    if (getHighestRoleLevel(user.roles) < ROLE_HIERARCHY['HR Staff']) {
      throw new Error('Only HR can create categories');
    }

    return prisma.documentCategory.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        parent_id: data.parent_id,
        sort_order: data.sort_order || 0,
      },
      select: DOCUMENT_CATEGORY_SELECT,
    });
  }

  async updateCategory(id: number, data: UpdateDocumentCategoryDTO, user: AuthUser) {
    // Only HR can update categories
    if (getHighestRoleLevel(user.roles) < ROLE_HIERARCHY['HR Staff']) {
      throw new Error('Only HR can update categories');
    }

    const existing = await prisma.documentCategory.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Category not found');
    }

    // Prevent circular reference
    if (data.parent_id === id) {
      throw new Error('Category cannot be its own parent');
    }

    return prisma.documentCategory.update({
      where: { id },
      data,
      select: DOCUMENT_CATEGORY_SELECT,
    });
  }

  async deleteCategory(id: number, user: AuthUser) {
    // Only HR can delete categories
    if (getHighestRoleLevel(user.roles) < ROLE_HIERARCHY['HR Staff']) {
      throw new Error('Only HR can delete categories');
    }

    const existing = await prisma.documentCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { documents: true, children: true } },
      },
    });

    if (!existing) {
      throw new Error('Category not found');
    }

    if (existing._count.documents > 0) {
      throw new Error('Cannot delete category with documents');
    }

    if (existing._count.children > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    return prisma.documentCategory.delete({ where: { id } });
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  async getRequiredDocumentTypes() {
    // Get document types that are commonly required
    const requiredDocs = await prisma.employeeDocument.groupBy({
      by: ['document_type'],
      where: { is_required: true },
      _count: { id: true },
    });

    return requiredDocs.map((d) => d.document_type);
  }

  async checkEmployeeDocumentCompleteness(employeeId: number) {
    const requiredTypes = ['ktp', 'npwp', 'bpjs_tk', 'bpjs_kes', 'cv', 'photo'];

    const documents = await prisma.employeeDocument.findMany({
      where: {
        employee_id: employeeId,
        deleted_at: null,
        document_type: { in: requiredTypes },
      },
      select: { document_type: true, is_verified: true },
    });

    const uploadedTypes = documents.map((d) => d.document_type);
    const verifiedTypes = documents
      .filter((d) => d.is_verified)
      .map((d) => d.document_type);

    const missingTypes = requiredTypes.filter((t) => !uploadedTypes.includes(t));
    const unverifiedTypes = requiredTypes.filter(
      (t) => uploadedTypes.includes(t) && !verifiedTypes.includes(t)
    );

    return {
      total_required: requiredTypes.length,
      uploaded: uploadedTypes.length,
      verified: verifiedTypes.length,
      missing: missingTypes,
      unverified: unverifiedTypes,
      is_complete: missingTypes.length === 0,
      is_verified: unverifiedTypes.length === 0 && missingTypes.length === 0,
    };
  }
}
