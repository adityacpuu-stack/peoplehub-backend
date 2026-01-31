import { PrismaClient, Prisma } from '@prisma/client';
import {
  AuditLogListQuery,
  CreateAuditLogDTO,
  AuditContext,
  AUDIT_LOG_SELECT,
  AUDIT_LOG_DETAIL_SELECT,
} from './audit-log.types';
import { AuthUser } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class AuditLogService {
  async list(query: AuditLogListQuery) {
    const { page = 1, limit = 50, user_id, action, model, model_id, start_date, end_date, ip_address } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (user_id) where.user_id = user_id;
    if (action) where.action = action;
    if (model) where.model = model;
    if (model_id) where.model_id = model_id;
    if (ip_address) where.ip_address = { contains: ip_address };

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at.gte = new Date(start_date);
      if (end_date) where.created_at.lte = new Date(end_date);
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        select: AUDIT_LOG_SELECT,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: number) {
    const log = await prisma.auditLog.findUnique({
      where: { id },
      select: AUDIT_LOG_DETAIL_SELECT,
    });
    if (!log) throw new Error('Audit log not found');
    return log;
  }

  async getByModel(model: string, modelId: number) {
    return prisma.auditLog.findMany({
      where: { model, model_id: modelId },
      select: AUDIT_LOG_DETAIL_SELECT,
      orderBy: { created_at: 'desc' },
    });
  }

  async getByUser(userId: number, query: { limit?: number } = {}) {
    return prisma.auditLog.findMany({
      where: { user_id: userId },
      select: AUDIT_LOG_SELECT,
      orderBy: { created_at: 'desc' },
      take: query.limit || 100,
    });
  }

  async getRecentActivity(limit: number = 50) {
    return prisma.auditLog.findMany({
      select: AUDIT_LOG_SELECT,
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  async create(data: CreateAuditLogDTO) {
    return prisma.auditLog.create({
      data,
      select: AUDIT_LOG_SELECT,
    });
  }

  async log(
    action: string,
    context: AuditContext,
    options: {
      model?: string;
      model_id?: number;
      description?: string;
      old_values?: Record<string, any>;
      new_values?: Record<string, any>;
    } = {}
  ) {
    return this.create({
      user_id: context.user_id,
      user_email: context.user_email,
      employee_name: context.employee_name,
      action,
      model: options.model,
      model_id: options.model_id,
      description: options.description,
      old_values: options.old_values,
      new_values: options.new_values,
      ip_address: context.ip_address,
      user_agent: context.user_agent,
      url: context.url,
      method: context.method,
    });
  }

  async logFromUser(
    user: AuthUser,
    action: string,
    options: {
      model?: string;
      model_id?: number;
      description?: string;
      old_values?: Record<string, any>;
      new_values?: Record<string, any>;
      ip_address?: string;
      user_agent?: string;
      url?: string;
      method?: string;
    } = {}
  ) {
    return this.log(action, {
      user_id: user.id,
      user_email: user.email,
      employee_name: user.employee?.name,
      ip_address: options.ip_address,
      user_agent: options.user_agent,
      url: options.url,
      method: options.method,
    }, options);
  }

  async getStatistics(query: { start_date?: string; end_date?: string } = {}) {
    const where: Prisma.AuditLogWhereInput = {};

    if (query.start_date || query.end_date) {
      where.created_at = {};
      if (query.start_date) where.created_at.gte = new Date(query.start_date);
      if (query.end_date) where.created_at.lte = new Date(query.end_date);
    }

    const [byAction, byModel, byUser, total] = await Promise.all([
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      prisma.auditLog.groupBy({
        by: ['model'],
        where: { ...where, model: { not: null } },
        _count: true,
        orderBy: { _count: { model: 'desc' } },
        take: 10,
      }),
      prisma.auditLog.groupBy({
        by: ['user_email'],
        where: { ...where, user_email: { not: null } },
        _count: true,
        orderBy: { _count: { user_email: 'desc' } },
        take: 10,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Get daily activity for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyActivity = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM audit_logs
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    return {
      total_logs: total,
      by_action: byAction.map((a) => ({ action: a.action, count: a._count })),
      by_model: byModel.map((m) => ({ model: m.model, count: m._count })),
      by_user: byUser.map((u) => ({ user_email: u.user_email, count: u._count })),
      daily_activity: dailyActivity.map((d) => ({
        date: d.date,
        count: Number(d.count),
      })),
    };
  }

  async cleanup(daysToKeep: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.auditLog.deleteMany({
      where: { created_at: { lt: cutoffDate } },
    });

    return { deleted: result.count, message: `Deleted ${result.count} audit logs older than ${daysToKeep} days` };
  }

  async export(query: AuditLogListQuery) {
    const { user_id, action, model, model_id, start_date, end_date, ip_address } = query;

    const where: Prisma.AuditLogWhereInput = {};

    if (user_id) where.user_id = user_id;
    if (action) where.action = action;
    if (model) where.model = model;
    if (model_id) where.model_id = model_id;
    if (ip_address) where.ip_address = { contains: ip_address };

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at.gte = new Date(start_date);
      if (end_date) where.created_at.lte = new Date(end_date);
    }

    return prisma.auditLog.findMany({
      where,
      select: AUDIT_LOG_DETAIL_SELECT,
      orderBy: { created_at: 'desc' },
      take: 10000, // Limit export to 10k records
    });
  }
}
