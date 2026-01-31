import { PrismaClient, Prisma } from '@prisma/client';
import {
  SettingListQuery,
  SystemSettingListQuery,
  CreateSettingDTO,
  UpdateSettingDTO,
  BulkUpdateSettingDTO,
  CreateSystemSettingDTO,
  UpdateSystemSettingDTO,
  SETTING_SELECT,
  SYSTEM_SETTING_SELECT,
  DEFAULT_SETTINGS,
  DEFAULT_SYSTEM_SETTINGS,
  SETTING_GROUPS,
} from './setting.types';
import { AuthUser } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class SettingService {
  // ==========================================
  // SETTINGS METHODS
  // ==========================================

  async listSettings(query: SettingListQuery, user: AuthUser) {
    const { group, is_public, search } = query;

    const where: Prisma.SettingWhereInput = {};

    // Non-admin users can only see public settings
    if (!user.roles.includes('Super Admin') && !user.roles.includes('HR Manager')) {
      where.is_public = true;
    } else if (is_public !== undefined) {
      where.is_public = is_public;
    }

    if (group) {
      where.group = group;
    }

    if (search) {
      where.OR = [
        { key: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const settings = await prisma.setting.findMany({
      where,
      select: SETTING_SELECT,
      orderBy: [{ group: 'asc' }, { sort_order: 'asc' }, { key: 'asc' }],
    });

    // Group settings by group
    const grouped: Record<string, any[]> = {};
    for (const setting of settings) {
      const grp = setting.group || 'general';
      if (!grouped[grp]) {
        grouped[grp] = [];
      }
      grouped[grp].push(setting);
    }

    return {
      settings,
      grouped,
      total: settings.length,
    };
  }

  async getSetting(key: string, user: AuthUser) {
    const setting = await prisma.setting.findUnique({
      where: { key },
      select: SETTING_SELECT,
    });

    if (!setting) {
      throw new Error('Setting not found');
    }

    // Check access for non-public settings
    if (!setting.is_public && !user.roles.includes('Super Admin') && !user.roles.includes('HR Manager')) {
      throw new Error('Access denied');
    }

    return setting;
  }

  async getSettingValue(key: string): Promise<string | null> {
    const setting = await prisma.setting.findUnique({
      where: { key },
      select: { value: true },
    });
    return setting?.value || null;
  }

  async getSettingsByGroup(group: string, user: AuthUser) {
    const where: Prisma.SettingWhereInput = { group };

    if (!user.roles.includes('Super Admin') && !user.roles.includes('HR Manager')) {
      where.is_public = true;
    }

    return prisma.setting.findMany({
      where,
      select: SETTING_SELECT,
      orderBy: [{ sort_order: 'asc' }, { key: 'asc' }],
    });
  }

  async getPublicSettings() {
    const settings = await prisma.setting.findMany({
      where: { is_public: true },
      select: {
        key: true,
        value: true,
        type: true,
      },
    });

    // Convert to key-value object
    const result: Record<string, any> = {};
    for (const setting of settings) {
      result[setting.key] = this.parseValue(setting.value, setting.type);
    }
    return result;
  }

  async createSetting(data: CreateSettingDTO, user: AuthUser) {
    if (!user.roles.includes('Super Admin')) {
      throw new Error('Only Super Admin can create settings');
    }

    // Check if key exists
    const existing = await prisma.setting.findUnique({
      where: { key: data.key },
    });

    if (existing) {
      throw new Error('Setting key already exists');
    }

    return prisma.setting.create({
      data: {
        ...data,
        is_system: false,
      },
      select: SETTING_SELECT,
    });
  }

  async updateSetting(key: string, data: UpdateSettingDTO, user: AuthUser) {
    if (!user.roles.includes('Super Admin') && !user.roles.includes('HR Manager')) {
      throw new Error('Access denied');
    }

    const existing = await prisma.setting.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new Error('Setting not found');
    }

    // System settings can only be updated by Super Admin
    if (existing.is_system && !user.roles.includes('Super Admin')) {
      throw new Error('Only Super Admin can update system settings');
    }

    return prisma.setting.update({
      where: { key },
      data,
      select: SETTING_SELECT,
    });
  }

  async bulkUpdateSettings(data: BulkUpdateSettingDTO, user: AuthUser) {
    if (!user.roles.includes('Super Admin') && !user.roles.includes('HR Manager')) {
      throw new Error('Access denied');
    }

    const results = [];
    const errors = [];

    for (const item of data.settings) {
      try {
        const result = await prisma.setting.update({
          where: { key: item.key },
          data: { value: item.value },
          select: SETTING_SELECT,
        });
        results.push(result);
      } catch (error: any) {
        errors.push({
          key: item.key,
          error: error.message,
        });
      }
    }

    return {
      updated: results.length,
      errors: errors.length,
      results,
      errorDetails: errors,
    };
  }

  async deleteSetting(key: string, user: AuthUser) {
    if (!user.roles.includes('Super Admin')) {
      throw new Error('Only Super Admin can delete settings');
    }

    const existing = await prisma.setting.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new Error('Setting not found');
    }

    if (existing.is_system) {
      throw new Error('Cannot delete system settings');
    }

    return prisma.setting.delete({
      where: { key },
    });
  }

  // ==========================================
  // SYSTEM SETTINGS METHODS
  // ==========================================

  async listSystemSettings(query: SystemSettingListQuery, user: AuthUser) {
    if (!user.roles.includes('Super Admin')) {
      throw new Error('Only Super Admin can access system settings');
    }

    const { is_editable, search } = query;

    const where: Prisma.SystemSettingWhereInput = {};

    if (is_editable !== undefined) {
      where.is_editable = is_editable;
    }

    if (search) {
      where.OR = [
        { key: { contains: search } },
        { description: { contains: search } },
      ];
    }

    return prisma.systemSetting.findMany({
      where,
      select: SYSTEM_SETTING_SELECT,
      orderBy: { key: 'asc' },
    });
  }

  async getSystemSetting(key: string, user: AuthUser) {
    if (!user.roles.includes('Super Admin')) {
      throw new Error('Only Super Admin can access system settings');
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key },
      select: SYSTEM_SETTING_SELECT,
    });

    if (!setting) {
      throw new Error('System setting not found');
    }

    return setting;
  }

  async getSystemSettingValue(key: string): Promise<string | null> {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
      select: { value: true },
    });
    return setting?.value || null;
  }

  async updateSystemSetting(key: string, data: UpdateSystemSettingDTO, user: AuthUser) {
    if (!user.roles.includes('Super Admin')) {
      throw new Error('Only Super Admin can update system settings');
    }

    const existing = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new Error('System setting not found');
    }

    if (!existing.is_editable) {
      throw new Error('This system setting is not editable');
    }

    return prisma.systemSetting.update({
      where: { key },
      data,
      select: SYSTEM_SETTING_SELECT,
    });
  }

  // ==========================================
  // SEED & UTILITY METHODS
  // ==========================================

  async seedDefaultSettings(user: AuthUser) {
    if (!user.roles.includes('Super Admin')) {
      throw new Error('Only Super Admin can seed settings');
    }

    const results = [];
    const skipped = [];

    // Seed regular settings
    for (const setting of DEFAULT_SETTINGS) {
      try {
        const existing = await prisma.setting.findUnique({
          where: { key: setting.key },
        });

        if (existing) {
          skipped.push({ key: setting.key, reason: 'Already exists' });
          continue;
        }

        const result = await prisma.setting.create({
          data: {
            key: setting.key,
            value: setting.value,
            group: setting.group,
            type: setting.type,
            description: setting.description,
            is_public: setting.is_public || false,
            options: setting.options ? setting.options : undefined,
            is_system: true,
          },
        });
        results.push(result);
      } catch (error: any) {
        skipped.push({ key: setting.key, reason: error.message });
      }
    }

    // Seed system settings
    for (const setting of DEFAULT_SYSTEM_SETTINGS) {
      try {
        const existing = await prisma.systemSetting.findUnique({
          where: { key: setting.key },
        });

        if (existing) {
          skipped.push({ key: `system:${setting.key}`, reason: 'Already exists' });
          continue;
        }

        const result = await prisma.systemSetting.create({
          data: {
            key: setting.key,
            value: setting.value,
            type: setting.type,
            description: setting.description,
            is_editable: setting.is_editable,
          },
        });
        results.push(result);
      } catch (error: any) {
        skipped.push({ key: `system:${setting.key}`, reason: error.message });
      }
    }

    return {
      created: results.length,
      skipped: skipped.length,
      skippedDetails: skipped,
    };
  }

  async getSettingGroups() {
    return Object.values(SETTING_GROUPS);
  }

  private parseValue(value: string | null, type: string | null): any {
    if (value === null) return null;

    switch (type) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value === 'true';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  // ==========================================
  // MAINTENANCE MODE
  // ==========================================

  async isMaintenanceMode(): Promise<boolean> {
    const value = await this.getSystemSettingValue('maintenance_mode');
    return value === 'true';
  }

  async setMaintenanceMode(enabled: boolean, user: AuthUser) {
    return this.updateSystemSetting('maintenance_mode', {
      value: enabled ? 'true' : 'false',
    }, user);
  }
}
