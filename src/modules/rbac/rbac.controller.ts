import { Request, Response } from 'express';
import { RbacService } from './rbac.service';
import { asyncHandler } from '../../middlewares/error.middleware';

const rbacService = new RbacService();

// Helper to safely get param as string
const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

// ==========================================
// ROLE ENDPOINTS
// ==========================================

export const listRoles = asyncHandler(async (req: Request, res: Response) => {
  const result = await rbacService.listRoles(req.query, req.user!);
  res.json({ message: 'Roles retrieved successfully', ...result });
});

export const getRoleById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  const result = await rbacService.getRoleById(id);
  res.json({ message: 'Role retrieved successfully', data: result });
});

export const getRoleByName = asyncHandler(async (req: Request, res: Response) => {
  const result = await rbacService.getRoleByName(getParam(req.params.name));
  res.json({ message: 'Role retrieved successfully', data: result });
});

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const result = await rbacService.createRole(req.body, req.user!);
  res.status(201).json({ message: 'Role created successfully', data: result });
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  const result = await rbacService.updateRole(id, req.body, req.user!);
  res.json({ message: 'Role updated successfully', data: result });
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  await rbacService.deleteRole(id, req.user!);
  res.json({ message: 'Role deleted successfully' });
});

// ==========================================
// PERMISSION ENDPOINTS
// ==========================================

export const listPermissions = asyncHandler(async (req: Request, res: Response) => {
  const result = await rbacService.listPermissions(req.query, req.user!);
  res.json({ message: 'Permissions retrieved successfully', ...result });
});

export const getPermissionById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  const result = await rbacService.getPermissionById(id);
  res.json({ message: 'Permission retrieved successfully', data: result });
});

export const createPermission = asyncHandler(async (req: Request, res: Response) => {
  const result = await rbacService.createPermission(req.body, req.user!);
  res.status(201).json({ message: 'Permission created successfully', data: result });
});

export const updatePermission = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  const result = await rbacService.updatePermission(id, req.body, req.user!);
  res.json({ message: 'Permission updated successfully', data: result });
});

export const deletePermission = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  await rbacService.deletePermission(id, req.user!);
  res.json({ message: 'Permission deleted successfully' });
});

export const getPermissionGroups = asyncHandler(async (req: Request, res: Response) => {
  const result = await rbacService.getPermissionGroups();
  res.json({ message: 'Permission groups retrieved successfully', data: result });
});

// ==========================================
// ROLE-PERMISSION ASSIGNMENT
// ==========================================

export const assignPermissionsToRole = asyncHandler(async (req: Request, res: Response) => {
  const result = await rbacService.assignPermissionsToRole(req.body, req.user!);
  res.json({ message: 'Permissions assigned successfully', data: result });
});

export const addPermissionToRole = asyncHandler(async (req: Request, res: Response) => {
  const roleId = parseInt(getParam(req.params.roleId));
  const permissionId = parseInt(getParam(req.params.permissionId));
  const result = await rbacService.addPermissionToRole(roleId, permissionId, req.user!);
  res.json({ message: 'Permission added to role', data: result });
});

export const removePermissionFromRole = asyncHandler(async (req: Request, res: Response) => {
  const roleId = parseInt(getParam(req.params.roleId));
  const permissionId = parseInt(getParam(req.params.permissionId));
  const result = await rbacService.removePermissionFromRole(roleId, permissionId, req.user!);
  res.json({ message: 'Permission removed from role', data: result });
});

// ==========================================
// USER-ROLE ASSIGNMENT
// ==========================================

export const getUserRoles = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(getParam(req.params.userId));
  const result = await rbacService.getUserRoles(userId);
  res.json({ message: 'User roles retrieved successfully', data: result });
});

export const assignRolesToUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await rbacService.assignRolesToUser(req.body, req.user!);
  res.json({ message: 'Roles assigned successfully', data: result });
});

export const addRoleToUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(getParam(req.params.userId));
  const roleId = parseInt(getParam(req.params.roleId));
  const result = await rbacService.addRoleToUser(userId, roleId, req.user!);
  res.json({ message: 'Role added to user', data: result });
});

export const removeRoleFromUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(getParam(req.params.userId));
  const roleId = parseInt(getParam(req.params.roleId));
  const result = await rbacService.removeRoleFromUser(userId, roleId, req.user!);
  res.json({ message: 'Role removed from user', data: result });
});

// ==========================================
// USER-PERMISSION (DIRECT) ASSIGNMENT
// ==========================================

export const getUserPermissions = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(getParam(req.params.userId));
  const result = await rbacService.getUserPermissions(userId);
  res.json({ message: 'User permissions retrieved successfully', data: result });
});

export const assignPermissionsToUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await rbacService.assignPermissionsToUser(req.body, req.user!);
  res.json({ message: 'Permissions assigned successfully', data: result });
});

// ==========================================
// CHECK & UTILITY
// ==========================================

export const checkPermission = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(getParam(req.params.userId));
  const permissionName = getParam(req.params.permissionName);
  const hasPermission = await rbacService.checkPermission(userId, permissionName);
  res.json({ has_permission: hasPermission });
});

export const getUsersByRole = asyncHandler(async (req: Request, res: Response) => {
  const roleId = parseInt(getParam(req.params.roleId));
  const result = await rbacService.getUsersByRole(roleId);
  res.json({ message: 'Users retrieved successfully', data: result });
});

export const seedRolesAndPermissions = asyncHandler(async (req: Request, res: Response) => {
  const result = await rbacService.seedRolesAndPermissions(req.user!);
  res.json({ message: 'Seed completed', data: result });
});
