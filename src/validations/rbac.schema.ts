import { z } from 'zod';
import { paginationSchema, searchSchema, idParamSchema } from './common.schema';

// ==========================================
// PARAM SCHEMAS
// ==========================================

// Reusable param schemas for routes with :roleId and/or :permissionId
export const roleIdParamSchema = z.object({
  roleId: z.coerce.number().int().positive(),
});

export const userIdParamSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

export const rolePermissionParamsSchema = z.object({
  roleId: z.coerce.number().int().positive(),
  permissionId: z.coerce.number().int().positive(),
});

export const userRoleParamsSchema = z.object({
  userId: z.coerce.number().int().positive(),
  roleId: z.coerce.number().int().positive(),
});

export const checkPermissionParamsSchema = z.object({
  userId: z.coerce.number().int().positive(),
  permissionName: z.string().min(1, 'Permission name is required'),
});

export const roleNameParamSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
});

// ==========================================
// ROLE SCHEMAS
// ==========================================

// List roles query
export const listRolesQuerySchema = paginationSchema.merge(searchSchema).extend({
  is_system: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

// Create role
export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100, 'Role name must be at most 100 characters'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  level: z.number().int().min(0, 'Level must be non-negative').optional(),
  permission_ids: z.array(z.number().int().positive()).optional(),
});

// Update role
export const updateRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100, 'Role name must be at most 100 characters').optional(),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  level: z.number().int().min(0, 'Level must be non-negative').optional(),
});

// ==========================================
// PERMISSION SCHEMAS
// ==========================================

// List permissions query
export const listPermissionsQuerySchema = paginationSchema.merge(searchSchema).extend({
  group: z.string().optional(),
});

// Create permission
export const createPermissionSchema = z.object({
  name: z.string().min(1, 'Permission name is required').max(100, 'Permission name must be at most 100 characters'),
  group: z.string().max(50, 'Group must be at most 50 characters').optional(),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
});

// Update permission
export const updatePermissionSchema = z.object({
  name: z.string().min(1, 'Permission name is required').max(100, 'Permission name must be at most 100 characters').optional(),
  group: z.string().max(50, 'Group must be at most 50 characters').optional(),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
});

// ==========================================
// ASSIGNMENT SCHEMAS
// ==========================================

// Assign permissions to role (body)
export const assignPermissionsToRoleSchema = z.object({
  role_id: z.number().int().positive({ message: 'Role ID must be a positive integer' }),
  permission_ids: z.array(z.number().int().positive()).min(0, 'permission_ids must be an array'),
});

// Assign roles to user (body)
export const assignRolesToUserSchema = z.object({
  user_id: z.number().int().positive({ message: 'User ID must be a positive integer' }),
  role_ids: z.array(z.number().int().positive()).min(0, 'role_ids must be an array'),
});

// Assign permissions to user (body)
export const assignPermissionsToUserSchema = z.object({
  user_id: z.number().int().positive({ message: 'User ID must be a positive integer' }),
  permission_ids: z.array(z.number().int().positive()).min(0, 'permission_ids must be an array'),
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type ListRolesQuery = z.infer<typeof listRolesQuerySchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type ListPermissionsQuery = z.infer<typeof listPermissionsQuerySchema>;
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
export type AssignPermissionsToRoleInput = z.infer<typeof assignPermissionsToRoleSchema>;
export type AssignRolesToUserInput = z.infer<typeof assignRolesToUserSchema>;
export type AssignPermissionsToUserInput = z.infer<typeof assignPermissionsToUserSchema>;
