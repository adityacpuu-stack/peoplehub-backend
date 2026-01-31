import { Router } from 'express';
import { RbacController } from './rbac.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const rbacController = new RbacController();

// All routes require authentication
router.use(authenticate);

// ==========================================
// ROLE ROUTES
// ==========================================

// GET /api/v1/rbac/roles - List all roles
router.get('/roles', authorize(['Super Admin', 'HR Manager']), (req, res) => rbacController.listRoles(req, res));

// GET /api/v1/rbac/roles/:id - Get role by ID
router.get('/roles/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => rbacController.getRoleById(req, res));

// GET /api/v1/rbac/roles/name/:name - Get role by name
router.get('/roles/name/:name', authorize(['Super Admin', 'HR Manager']), (req, res) => rbacController.getRoleByName(req, res));

// POST /api/v1/rbac/roles - Create role
router.post('/roles', authorize(['Super Admin']), (req, res) => rbacController.createRole(req, res));

// PUT /api/v1/rbac/roles/:id - Update role
router.put('/roles/:id', authorize(['Super Admin']), (req, res) => rbacController.updateRole(req, res));

// DELETE /api/v1/rbac/roles/:id - Delete role
router.delete('/roles/:id', authorize(['Super Admin']), (req, res) => rbacController.deleteRole(req, res));

// GET /api/v1/rbac/roles/:roleId/users - Get users by role
router.get('/roles/:roleId/users', authorize(['Super Admin', 'HR Manager']), (req, res) => rbacController.getUsersByRole(req, res));

// ==========================================
// PERMISSION ROUTES
// ==========================================

// GET /api/v1/rbac/permissions - List all permissions
router.get('/permissions', authorize(['Super Admin', 'HR Manager']), (req, res) => rbacController.listPermissions(req, res));

// GET /api/v1/rbac/permissions/groups - Get permission groups
router.get('/permissions/groups', authorize(['Super Admin', 'HR Manager']), (req, res) => rbacController.getPermissionGroups(req, res));

// GET /api/v1/rbac/permissions/:id - Get permission by ID
router.get('/permissions/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => rbacController.getPermissionById(req, res));

// POST /api/v1/rbac/permissions - Create permission
router.post('/permissions', authorize(['Super Admin']), (req, res) => rbacController.createPermission(req, res));

// PUT /api/v1/rbac/permissions/:id - Update permission
router.put('/permissions/:id', authorize(['Super Admin']), (req, res) => rbacController.updatePermission(req, res));

// DELETE /api/v1/rbac/permissions/:id - Delete permission
router.delete('/permissions/:id', authorize(['Super Admin']), (req, res) => rbacController.deletePermission(req, res));

// ==========================================
// ROLE-PERMISSION ASSIGNMENT ROUTES
// ==========================================

// POST /api/v1/rbac/roles/assign-permissions - Assign multiple permissions to a role
router.post('/roles/assign-permissions', authorize(['Super Admin']), (req, res) => rbacController.assignPermissionsToRole(req, res));

// POST /api/v1/rbac/roles/:roleId/permissions/:permissionId - Add single permission to role
router.post('/roles/:roleId/permissions/:permissionId', authorize(['Super Admin']), (req, res) => rbacController.addPermissionToRole(req, res));

// DELETE /api/v1/rbac/roles/:roleId/permissions/:permissionId - Remove permission from role
router.delete('/roles/:roleId/permissions/:permissionId', authorize(['Super Admin']), (req, res) => rbacController.removePermissionFromRole(req, res));

// ==========================================
// USER-ROLE ASSIGNMENT ROUTES
// ==========================================

// GET /api/v1/rbac/users/:userId/roles - Get user roles
router.get('/users/:userId/roles', authorize(['Super Admin', 'HR Manager']), (req, res) => rbacController.getUserRoles(req, res));

// POST /api/v1/rbac/users/assign-roles - Assign multiple roles to a user
router.post('/users/assign-roles', authorize(['Super Admin', 'HR Manager']), (req, res) => rbacController.assignRolesToUser(req, res));

// POST /api/v1/rbac/users/:userId/roles/:roleId - Add single role to user
router.post('/users/:userId/roles/:roleId', authorize(['Super Admin', 'HR Manager']), (req, res) => rbacController.addRoleToUser(req, res));

// DELETE /api/v1/rbac/users/:userId/roles/:roleId - Remove role from user
router.delete('/users/:userId/roles/:roleId', authorize(['Super Admin', 'HR Manager']), (req, res) => rbacController.removeRoleFromUser(req, res));

// ==========================================
// USER-PERMISSION (DIRECT) ASSIGNMENT ROUTES
// ==========================================

// GET /api/v1/rbac/users/:userId/permissions - Get user permissions (direct + from roles)
router.get('/users/:userId/permissions', authorize(['Super Admin', 'HR Manager']), (req, res) => rbacController.getUserPermissions(req, res));

// POST /api/v1/rbac/users/assign-permissions - Assign direct permissions to user
router.post('/users/assign-permissions', authorize(['Super Admin']), (req, res) => rbacController.assignPermissionsToUser(req, res));

// ==========================================
// UTILITY ROUTES
// ==========================================

// GET /api/v1/rbac/check/:userId/:permissionName - Check if user has permission
router.get('/check/:userId/:permissionName', authorize(['Super Admin', 'HR Manager']), (req, res) => rbacController.checkPermission(req, res));

// POST /api/v1/rbac/seed - Seed default roles and permissions
router.post('/seed', authorize(['Super Admin']), (req, res) => rbacController.seedRolesAndPermissions(req, res));

export default router;
