import { PrismaClient, Prisma } from '@prisma/client';
import {
  WorkLocationListQuery,
  CreateWorkLocationDTO,
  UpdateWorkLocationDTO,
  WORK_LOCATION_SELECT,
  WORK_LOCATION_DETAIL_SELECT,
} from './work-location.types';
import { AuthUser } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class WorkLocationService {
  async list(query: WorkLocationListQuery, user: AuthUser) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const { search, company_id, is_active } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.WorkLocationWhereInput = {};

    if (company_id) {
      where.company_id = Number(company_id);
    }

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { address: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.workLocation.findMany({
        where,
        select: WORK_LOCATION_SELECT,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.workLocation.count({ where }),
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
    const location = await prisma.workLocation.findUnique({
      where: { id },
      select: WORK_LOCATION_DETAIL_SELECT,
    });

    if (!location) {
      throw new Error('Work location not found');
    }

    return location;
  }

  async create(data: CreateWorkLocationDTO, user: AuthUser) {
    // Check if code is unique within company
    if (data.code) {
      const existing = await prisma.workLocation.findFirst({
        where: {
          code: data.code,
          company_id: data.company_id,
        },
      });

      if (existing) {
        throw new Error('Work location code already exists in this company');
      }
    }

    // Parse time strings to Date objects if provided
    const createData: any = {
      ...data,
      created_by: user.id,
    };

    if (data.work_start_time) {
      createData.work_start_time = this.parseTimeToDate(data.work_start_time);
    }
    if (data.work_end_time) {
      createData.work_end_time = this.parseTimeToDate(data.work_end_time);
    }
    if (data.break_start_time) {
      createData.break_start_time = this.parseTimeToDate(data.break_start_time);
    }
    if (data.break_end_time) {
      createData.break_end_time = this.parseTimeToDate(data.break_end_time);
    }

    return prisma.workLocation.create({
      data: createData,
      select: WORK_LOCATION_DETAIL_SELECT,
    });
  }

  async update(id: number, data: UpdateWorkLocationDTO, user: AuthUser) {
    const existing = await prisma.workLocation.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('Work location not found');
    }

    // Check code uniqueness if changing
    if (data.code && data.code !== existing.code) {
      const codeExists = await prisma.workLocation.findFirst({
        where: {
          code: data.code,
          company_id: existing.company_id,
          id: { not: id },
        },
      });

      if (codeExists) {
        throw new Error('Work location code already exists in this company');
      }
    }

    const updateData: any = { ...data };

    if (data.work_start_time) {
      updateData.work_start_time = this.parseTimeToDate(data.work_start_time);
    }
    if (data.work_end_time) {
      updateData.work_end_time = this.parseTimeToDate(data.work_end_time);
    }
    if (data.break_start_time) {
      updateData.break_start_time = this.parseTimeToDate(data.break_start_time);
    }
    if (data.break_end_time) {
      updateData.break_end_time = this.parseTimeToDate(data.break_end_time);
    }

    return prisma.workLocation.update({
      where: { id },
      data: updateData,
      select: WORK_LOCATION_DETAIL_SELECT,
    });
  }

  async delete(id: number, user: AuthUser) {
    const existing = await prisma.workLocation.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            employees: true,
            attendances: true,
          },
        },
      },
    });

    if (!existing) {
      throw new Error('Work location not found');
    }

    if (existing._count.employees > 0) {
      throw new Error('Cannot delete work location with assigned employees');
    }

    return prisma.workLocation.delete({ where: { id } });
  }

  async getByCompany(companyId: number) {
    return prisma.workLocation.findMany({
      where: {
        company_id: companyId,
        is_active: true,
      },
      select: WORK_LOCATION_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async getNearbyLocations(latitude: number, longitude: number, radiusKm: number = 10) {
    // Get all active locations
    const locations = await prisma.workLocation.findMany({
      where: { is_active: true },
      select: WORK_LOCATION_SELECT,
    });

    // Filter by distance
    return locations.filter((loc) => {
      if (!loc.latitude || !loc.longitude) return false;
      const distance = this.calculateDistance(
        latitude,
        longitude,
        Number(loc.latitude),
        Number(loc.longitude)
      );
      return distance <= radiusKm;
    });
  }

  async checkLocationValidity(
    locationId: number,
    latitude: number,
    longitude: number
  ): Promise<{ valid: boolean; distance: number; maxRadius: number }> {
    const location = await prisma.workLocation.findUnique({
      where: { id: locationId },
      select: {
        latitude: true,
        longitude: true,
        radius_meters: true,
        require_location_verification: true,
      },
    });

    if (!location) {
      throw new Error('Work location not found');
    }

    if (!location.require_location_verification) {
      return { valid: true, distance: 0, maxRadius: location.radius_meters || 100 };
    }

    if (!location.latitude || !location.longitude) {
      return { valid: true, distance: 0, maxRadius: location.radius_meters || 100 };
    }

    const distance = this.calculateDistance(
      latitude,
      longitude,
      Number(location.latitude),
      Number(location.longitude)
    ) * 1000; // Convert to meters

    const maxRadius = location.radius_meters || 100;
    const valid = distance <= maxRadius;

    return { valid, distance: Math.round(distance), maxRadius };
  }

  // Haversine formula to calculate distance between two coordinates
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private parseTimeToDate(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
}
