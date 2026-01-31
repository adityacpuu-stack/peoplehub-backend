import { PrismaClient, Prisma } from '@prisma/client';
import {
  HolidayListQuery,
  HolidayCalendarQuery,
  CreateHolidayDTO,
  UpdateHolidayDTO,
  BulkCreateHolidayDTO,
  HOLIDAY_LIST_SELECT,
  HOLIDAY_DETAIL_SELECT,
  HOLIDAY_SOURCE,
  INDONESIA_NATIONAL_HOLIDAYS_2025,
  INDONESIA_NATIONAL_HOLIDAYS_2026,
} from './holiday.types';
import { AuthUser, hasCompanyAccess } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class HolidayService {
  // ==========================================
  // LIST & GET METHODS
  // ==========================================

  async list(query: HolidayListQuery, user: AuthUser) {
    const {
      page = 1,
      limit = 50,
      company_id,
      year,
      month,
      type,
      is_active,
      search,
      sort_by = 'date',
      sort_order = 'asc',
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.HolidayWhereInput = {
      deleted_at: null,
    };

    // Filter by company (including national holidays with company_id = null)
    if (company_id) {
      where.OR = [
        { company_id: company_id },
        { company_id: null }, // National holidays
      ];
    } else if (!user.roles.includes('Super Admin') && user.employee?.company_id) {
      where.OR = [
        { company_id: user.employee.company_id },
        { company_id: null },
      ];
    }

    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (type) {
      where.type = type;
    }

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    if (search) {
      where.name = { contains: search };
    }

    const orderBy: Prisma.HolidayOrderByWithRelationInput = {};
    (orderBy as any)[sort_by] = sort_order;

    const [data, total] = await Promise.all([
      prisma.holiday.findMany({
        where,
        select: HOLIDAY_LIST_SELECT,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.holiday.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: number, user: AuthUser) {
    const holiday = await prisma.holiday.findFirst({
      where: { id, deleted_at: null },
      select: HOLIDAY_DETAIL_SELECT,
    });

    if (!holiday) {
      throw new Error('Holiday not found');
    }

    return holiday;
  }

  async getCalendar(query: HolidayCalendarQuery, user: AuthUser) {
    const { company_id, year, month } = query;

    let startDate: Date;
    let endDate: Date;

    if (month) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
    } else {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    }

    const where: Prisma.HolidayWhereInput = {
      deleted_at: null,
      is_active: true,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Include company holidays and national holidays
    if (company_id) {
      where.OR = [
        { company_id: company_id },
        { company_id: null },
      ];
    } else if (!user.roles.includes('Super Admin') && user.employee?.company_id) {
      where.OR = [
        { company_id: user.employee.company_id },
        { company_id: null },
      ];
    }

    const holidays = await prisma.holiday.findMany({
      where,
      select: {
        id: true,
        name: true,
        date: true,
        type: true,
        company_id: true,
        is_recurring: true,
      },
      orderBy: { date: 'asc' },
    });

    // Group by date for calendar view
    const calendar: Record<string, any[]> = {};
    for (const holiday of holidays) {
      const dateKey = holiday.date.toISOString().split('T')[0];
      if (!calendar[dateKey]) {
        calendar[dateKey] = [];
      }
      calendar[dateKey].push(holiday);
    }

    return {
      year,
      month,
      holidays,
      calendar,
      total: holidays.length,
    };
  }

  // ==========================================
  // CREATE & UPDATE METHODS
  // ==========================================

  async create(data: CreateHolidayDTO, user: AuthUser) {
    // Check company access if company_id provided
    if (data.company_id && !hasCompanyAccess(user, data.company_id)) {
      throw new Error('Access denied to this company');
    }

    // Check for duplicate
    const existing = await prisma.holiday.findFirst({
      where: {
        date: new Date(data.date),
        company_id: data.company_id || null,
        deleted_at: null,
      },
    });

    if (existing) {
      throw new Error('Holiday already exists for this date');
    }

    return prisma.holiday.create({
      data: {
        ...data,
        date: new Date(data.date),
        source: HOLIDAY_SOURCE.MANUAL,
        created_by: user.id,
      },
      select: HOLIDAY_DETAIL_SELECT,
    });
  }

  async bulkCreate(data: BulkCreateHolidayDTO, user: AuthUser) {
    // Check company access if company_id provided
    if (data.company_id && !hasCompanyAccess(user, data.company_id)) {
      throw new Error('Access denied to this company');
    }

    const created = [];
    const skipped = [];
    const errors = [];

    for (const holiday of data.holidays) {
      try {
        const holidayDate = new Date(holiday.date);
        const companyId = data.company_id || holiday.company_id || null;

        // Check if holiday already exists by DATE + company_id only
        // (a company shouldn't have multiple holidays on the same date)
        const existing = await prisma.holiday.findFirst({
          where: {
            date: holidayDate,
            company_id: companyId,
            deleted_at: null,
          },
        });

        if (existing) {
          // Skip - holiday already exists for this date
          skipped.push({
            date: holiday.date,
            name: holiday.name,
            existing_name: existing.name,
          });
        } else {
          // Create new holiday
          const result = await prisma.holiday.create({
            data: {
              name: holiday.name,
              date: holidayDate,
              type: holiday.type,
              company_id: companyId,
              description: holiday.description,
              is_recurring: holiday.is_recurring || false,
              source: HOLIDAY_SOURCE.IMPORT,
              created_by: user.id,
            },
            select: HOLIDAY_LIST_SELECT,
          });
          created.push(result);
        }
      } catch (error: any) {
        errors.push({
          date: holiday.date,
          name: holiday.name,
          error: error.message,
        });
      }
    }

    return {
      created: created.length,
      skipped: skipped.length,
      errors: errors.length,
      results: created,
      skippedDetails: skipped,
      errorDetails: errors,
    };
  }

  async update(id: number, data: UpdateHolidayDTO, user: AuthUser) {
    const existing = await prisma.holiday.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new Error('Holiday not found');
    }

    // Check company access
    if (existing.company_id && !hasCompanyAccess(user, existing.company_id)) {
      throw new Error('Access denied');
    }

    return prisma.holiday.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
      select: HOLIDAY_DETAIL_SELECT,
    });
  }

  async delete(id: number, user: AuthUser) {
    const existing = await prisma.holiday.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new Error('Holiday not found');
    }

    // Check company access
    if (existing.company_id && !hasCompanyAccess(user, existing.company_id)) {
      throw new Error('Access denied');
    }

    // Soft delete
    return prisma.holiday.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  // ==========================================
  // SEED NATIONAL HOLIDAYS
  // ==========================================

  async seedNationalHolidays(year: number, user: AuthUser) {
    if (!user.roles.includes('Super Admin')) {
      throw new Error('Only Super Admin can seed national holidays');
    }

    let holidays: typeof INDONESIA_NATIONAL_HOLIDAYS_2025;

    if (year === 2025) {
      holidays = INDONESIA_NATIONAL_HOLIDAYS_2025;
    } else if (year === 2026) {
      holidays = INDONESIA_NATIONAL_HOLIDAYS_2026;
    } else {
      throw new Error('Holiday data not available for this year');
    }

    const results = [];
    const errors = [];

    for (const holiday of holidays) {
      try {
        // Check if already exists
        const existing = await prisma.holiday.findFirst({
          where: {
            date: new Date(holiday.date),
            company_id: null,
            deleted_at: null,
          },
        });

        if (existing) {
          errors.push({
            date: holiday.date,
            name: holiday.name,
            error: 'Already exists',
          });
          continue;
        }

        const result = await prisma.holiday.create({
          data: {
            name: holiday.name,
            date: new Date(holiday.date),
            type: holiday.type,
            company_id: null, // National holiday
            source: HOLIDAY_SOURCE.MANUAL,
            created_by: user.id,
          },
        });
        results.push(result);
      } catch (error: any) {
        errors.push({
          date: holiday.date,
          name: holiday.name,
          error: error.message,
        });
      }
    }

    return {
      year,
      created: results.length,
      skipped: errors.length,
      results,
      skippedDetails: errors,
    };
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  async isHoliday(date: Date, companyId?: number): Promise<boolean> {
    const holiday = await prisma.holiday.findFirst({
      where: {
        date: date,
        is_active: true,
        deleted_at: null,
        OR: [
          { company_id: companyId },
          { company_id: null },
        ],
      },
    });

    return !!holiday;
  }

  async getHolidaysInRange(
    startDate: Date,
    endDate: Date,
    companyId?: number
  ): Promise<Date[]> {
    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        is_active: true,
        deleted_at: null,
        OR: [
          { company_id: companyId },
          { company_id: null },
        ],
      },
      select: { date: true },
    });

    return holidays.map(h => h.date);
  }

  async getUpcoming(companyId?: number, limit: number = 5) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: Prisma.HolidayWhereInput = {
      date: { gte: today },
      is_active: true,
      deleted_at: null,
    };

    if (companyId) {
      where.OR = [
        { company_id: companyId },
        { company_id: null },
      ];
    }

    return prisma.holiday.findMany({
      where,
      select: HOLIDAY_LIST_SELECT,
      orderBy: { date: 'asc' },
      take: limit,
    });
  }
}
