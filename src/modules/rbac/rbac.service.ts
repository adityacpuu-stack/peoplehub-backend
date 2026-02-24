import { PrismaClient, Prisma } from '@prisma/client';
import {
  RoleListQuery,
  PermissionListQuery,
  CreateRoleDTO,
  UpdateRoleDTO,
  CreatePermissionDTO,
  UpdatePermissionDTO,
  AssignRoleDTO,
  AssignPermissionToRoleDTO,
  AssignPermissionToUserDTO,
  ROLE_SELECT,
  ROLE_DETAIL_SELECT,
  PERMISSION_SELECT,
  USER_ROLE_SELECT,
  DEFAULT_ROLES,
  DEFAULT_PERMISSIONS,
  ROLE_PERMISSIONS_MAP,
  PERMISSION_GROUPS,
} from './rbac.types';
import { AuthUser } from '../../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class RbacService {
  // ==========================================
  // ROLE METHODS
  // ==========================================

  async listRoles(query: RoleListQuery, user: AuthUser) {
    const { page = 1, limit = 50, search, is_system } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RoleWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (is_system !== undefined) {
      where.is_system = is_system;
    }

    const [data, total] = await Promise.all([
      prisma.role.findMany({
        where,
        select: ROLE_SELECT,
        skip,
        take: limit,
        orderBy: { level: 'asc' },
      }),
      prisma.role.count({ where }),
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

  async getRoleById(id: number) {
    const role = await prisma.role.findUnique({
      where: { id },
      select: ROLE_DETAIL_SELECT,
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return role;
  }

  async getRoleByName(name: string) {
    const role = await prisma.role.findFirst({
      where: { name },
      select: ROLE_DETAIL_SELECT,
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return role;
  }

  async createRole(data: CreateRoleDTO, user: AuthUser) {
    // Check if role name exists
    const existing = await prisma.role.findFirst({
      where: { name: data.name },
    });

    if (existing) {
      throw new Error('Role name already exists');
    }

    const role = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        level: data.level,
        is_system: false,
      },
      select: ROLE_DETAIL_SELECT,
    });

    // Assign permissions if provided
    if (data.permission_ids && data.permission_ids.length > 0) {
      await this.assignPermissionsToRole({
        role_id: role.id,
        permission_ids: data.permission_ids,
      }, user);
    }

    return this.getRoleById(role.id);
  }

  async updateRole(id: number, data: UpdateRoleDTO, user: AuthUser) {
    const existing = await prisma.role.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('Role not found');
    }

    // Check name uniqueness if changing
    if (data.name && data.name !== existing.name) {
      const nameExists = await prisma.role.findFirst({
        where: { name: data.name, id: { not: id } },
      });
      if (nameExists) {
        throw new Error('Role name already exists');
      }
    }

    return prisma.role.update({
      where: { id },
      data,
      select: ROLE_DETAIL_SELECT,
    });
  }

  async deleteRole(id: number, user: AuthUser) {
    const existing = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { userRoles: true } } },
    });

    if (!existing) {
      throw new Error('Role not found');
    }

    if (existing.is_system) {
      throw new Error('Cannot delete system roles');
    }

    if (existing._count.userRoles > 0) {
      throw new Error('Cannot delete role with assigned users. Please remove users first.');
    }

    // Delete role permissions first
    await prisma.rolePermission.deleteMany({ where: { role_id: id } });

    // Delete role
    return prisma.role.delete({ where: { id } });
  }

  // ==========================================
  // PERMISSION METHODS
  // ==========================================

  async listPermissions(query: PermissionListQuery, user: AuthUser) {
    const { page = 1, limit = 100, group, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PermissionWhereInput = {};

    if (group) {
      where.group = group;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.permission.findMany({
        where,
        select: PERMISSION_SELECT,
        skip,
        take: limit,
        orderBy: [{ group: 'asc' }, { name: 'asc' }],
      }),
      prisma.permission.count({ where }),
    ]);

    // Group permissions
    const grouped: Record<string, any[]> = {};
    for (const perm of data) {
      const grp = perm.group || 'other';
      if (!grouped[grp]) {
        grouped[grp] = [];
      }
      grouped[grp].push(perm);
    }

    return {
      data,
      grouped,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPermissionById(id: number) {
    const permission = await prisma.permission.findUnique({
      where: { id },
      select: PERMISSION_SELECT,
    });

    if (!permission) {
      throw new Error('Permission not found');
    }

    return permission;
  }

  async createPermission(data: CreatePermissionDTO, user: AuthUser) {
    // Check if permission name exists
    const existing = await prisma.permission.findFirst({
      where: { name: data.name },
    });

    if (existing) {
      throw new Error('Permission name already exists');
    }

    return prisma.permission.create({
      data,
      select: PERMISSION_SELECT,
    });
  }

  async updatePermission(id: number, data: UpdatePermissionDTO, user: AuthUser) {
    const existing = await prisma.permission.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('Permission not found');
    }

    // Check name uniqueness if changing
    if (data.name && data.name !== existing.name) {
      const nameExists = await prisma.permission.findFirst({
        where: { name: data.name, id: { not: id } },
      });
      if (nameExists) {
        throw new Error('Permission name already exists');
      }
    }

    return prisma.permission.update({
      where: { id },
      data,
      select: PERMISSION_SELECT,
    });
  }

  async deletePermission(id: number, user: AuthUser) {
    const existing = await prisma.permission.findUnique({ where: { id } });

    if (!existing) {
      throw new Error('Permission not found');
    }

    // Delete role permissions first
    await prisma.rolePermission.deleteMany({ where: { permission_id: id } });
    // Delete user permissions
    await prisma.userPermission.deleteMany({ where: { permission_id: id } });

    return prisma.permission.delete({ where: { id } });
  }

  async getPermissionGroups() {
    return Object.values(PERMISSION_GROUPS);
  }

  // ==========================================
  // ROLE-PERMISSION ASSIGNMENT
  // ==========================================

  async assignPermissionsToRole(data: AssignPermissionToRoleDTO, user: AuthUser) {
    const { role_id, permission_ids } = data;

    // Verify role exists
    const role = await prisma.role.findUnique({ where: { id: role_id } });
    if (!role) {
      throw new Error('Role not found');
    }

    // Remove existing permissions
    await prisma.rolePermission.deleteMany({ where: { role_id } });

    // Add new permissions
    if (permission_ids.length > 0) {
      await prisma.rolePermission.createMany({
        data: permission_ids.map((permission_id) => ({
          role_id,
          permission_id,
        })),
        skipDuplicates: true,
      });
    }

    return this.getRoleById(role_id);
  }

  async addPermissionToRole(roleId: number, permissionId: number, user: AuthUser) {
    // Check if already exists
    const existing = await prisma.rolePermission.findUnique({
      where: {
        role_id_permission_id: { role_id: roleId, permission_id: permissionId },
      },
    });

    if (existing) {
      throw new Error('Permission already assigned to this role');
    }

    await prisma.rolePermission.create({
      data: { role_id: roleId, permission_id: permissionId },
    });

    return this.getRoleById(roleId);
  }

  async removePermissionFromRole(roleId: number, permissionId: number, user: AuthUser) {
    await prisma.rolePermission.delete({
      where: {
        role_id_permission_id: { role_id: roleId, permission_id: permissionId },
      },
    });

    return this.getRoleById(roleId);
  }

  // ==========================================
  // USER-ROLE ASSIGNMENT
  // ==========================================

  async getUserRoles(userId: number) {
    return prisma.userRole.findMany({
      where: { user_id: userId },
      select: USER_ROLE_SELECT,
    });
  }

  async assignRolesToUser(data: AssignRoleDTO, user: AuthUser) {
    const { user_id, role_ids } = data;

    // Verify user exists
    const targetUser = await prisma.user.findUnique({ where: { id: user_id } });
    if (!targetUser) {
      throw new Error('User not found');
    }

    // Remove existing roles
    await prisma.userRole.deleteMany({ where: { user_id } });

    // Add new roles
    if (role_ids.length > 0) {
      await prisma.userRole.createMany({
        data: role_ids.map((role_id) => ({
          user_id,
          role_id,
        })),
        skipDuplicates: true,
      });
    }

    return this.getUserRoles(user_id);
  }

  async addRoleToUser(userId: number, roleId: number, user: AuthUser) {
    // Check if already exists
    const existing = await prisma.userRole.findUnique({
      where: {
        user_id_role_id: { user_id: userId, role_id: roleId },
      },
    });

    if (existing) {
      throw new Error('Role already assigned to this user');
    }

    await prisma.userRole.create({
      data: { user_id: userId, role_id: roleId },
    });

    return this.getUserRoles(userId);
  }

  async removeRoleFromUser(userId: number, roleId: number, user: AuthUser) {
    await prisma.userRole.delete({
      where: {
        user_id_role_id: { user_id: userId, role_id: roleId },
      },
    });

    return this.getUserRoles(userId);
  }

  // ==========================================
  // USER-PERMISSION (DIRECT) ASSIGNMENT
  // ==========================================

  async getUserPermissions(userId: number) {
    const [directPermissions, rolePermissions] = await Promise.all([
      // Direct permissions
      prisma.userPermission.findMany({
        where: { user_id: userId },
        select: {
          permission: {
            select: PERMISSION_SELECT,
          },
        },
      }),
      // Permissions from roles
      prisma.userRole.findMany({
        where: { user_id: userId },
        select: {
          role: {
            select: {
              name: true,
              rolePermissions: {
                select: {
                  permission: {
                    select: PERMISSION_SELECT,
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const direct = directPermissions.map((up) => up.permission);

    const fromRoles: Record<string, any[]> = {};
    for (const ur of rolePermissions) {
      fromRoles[ur.role.name] = ur.role.rolePermissions.map((rp) => rp.permission);
    }

    return {
      direct,
      from_roles: fromRoles,
    };
  }

  async assignPermissionsToUser(data: AssignPermissionToUserDTO, user: AuthUser) {
    const { user_id, permission_ids } = data;

    // Verify user exists
    const targetUser = await prisma.user.findUnique({ where: { id: user_id } });
    if (!targetUser) {
      throw new Error('User not found');
    }

    // Remove existing direct permissions
    await prisma.userPermission.deleteMany({ where: { user_id } });

    // Add new permissions
    if (permission_ids.length > 0) {
      await prisma.userPermission.createMany({
        data: permission_ids.map((permission_id) => ({
          user_id,
          permission_id,
        })),
        skipDuplicates: true,
      });
    }

    return this.getUserPermissions(user_id);
  }

  // ==========================================
  // SEED METHODS
  // ==========================================

  async seedRolesAndPermissions(user: AuthUser) {
    const results = {
      roles: { created: 0, skipped: 0 },
      permissions: { created: 0, skipped: 0 },
      assignments: { created: 0, skipped: 0 },
    };

    // Seed permissions first
    for (const perm of DEFAULT_PERMISSIONS) {
      try {
        const existing = await prisma.permission.findFirst({
          where: { name: perm.name },
        });

        if (existing) {
          results.permissions.skipped++;
          continue;
        }

        await prisma.permission.create({ data: perm });
        results.permissions.created++;
      } catch (error) {
        results.permissions.skipped++;
      }
    }

    // Seed roles
    for (const role of DEFAULT_ROLES) {
      try {
        const existing = await prisma.role.findFirst({
          where: { name: role.name },
        });

        if (existing) {
          results.roles.skipped++;
          continue;
        }

        await prisma.role.create({ data: role });
        results.roles.created++;
      } catch (error) {
        results.roles.skipped++;
      }
    }

    // Assign permissions to roles
    for (const [roleName, permPatterns] of Object.entries(ROLE_PERMISSIONS_MAP)) {
      try {
        const role = await prisma.role.findFirst({
          where: { name: roleName },
        });

        if (!role) continue;

        // Get all permissions
        const allPermissions = await prisma.permission.findMany();

        // Match permissions by patterns
        const matchedPermissionIds: number[] = [];

        for (const pattern of permPatterns) {
          if (pattern === '*') {
            // All permissions
            matchedPermissionIds.push(...allPermissions.map((p) => p.id));
            break;
          } else if (pattern.endsWith('.*')) {
            // Group wildcard (e.g., 'employee.*')
            const group = pattern.replace('.*', '');
            const groupPerms = allPermissions.filter((p) => p.name.startsWith(group + '.'));
            matchedPermissionIds.push(...groupPerms.map((p) => p.id));
          } else {
            // Exact match
            const perm = allPermissions.find((p) => p.name === pattern);
            if (perm) {
              matchedPermissionIds.push(perm.id);
            }
          }
        }

        // Unique IDs
        const uniqueIds = [...new Set(matchedPermissionIds)];

        // Create role-permission mappings
        for (const permId of uniqueIds) {
          try {
            await prisma.rolePermission.create({
              data: { role_id: role.id, permission_id: permId },
            });
            results.assignments.created++;
          } catch (error) {
            results.assignments.skipped++;
          }
        }
      } catch (error) {
        // Skip
      }
    }

    return results;
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  async checkPermission(userId: number, permissionName: string): Promise<boolean> {
    // Check direct permission
    const directPerm = await prisma.userPermission.findFirst({
      where: {
        user_id: userId,
        permission: { name: permissionName },
      },
    });

    if (directPerm) return true;

    // Check role permissions
    const rolePerm = await prisma.userRole.findFirst({
      where: {
        user_id: userId,
        role: {
          rolePermissions: {
            some: {
              permission: { name: permissionName },
            },
          },
        },
      },
    });

    return !!rolePerm;
  }

  async getUsersByRole(roleId: number) {
    return prisma.userRole.findMany({
      where: { role_id: roleId },
      select: USER_ROLE_SELECT,
    });
  }
}
