import { Router } from 'express';
import * as rbacController from './rbac.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// ==========================================
// ROLE ROUTES
// ==========================================

router.get('/roles', authorize(['Super Admin', 'HR Manager']), rbacController.listRoles);
router.get('/roles/:id', authorize(['Super Admin', 'HR Manager']), rbacController.getRoleById);
router.get('/roles/name/:name', authorize(['Super Admin', 'HR Manager']), rbacController.getRoleByName);
router.post('/roles', authorize(['Super Admin']), rbacController.createRole);
router.put('/roles/:id', authorize(['Super Admin']), rbacController.updateRole);
router.delete('/roles/:id', authorize(['Super Admin']), rbacController.deleteRole);
router.get('/roles/:roleId/users', authorize(['Super Admin', 'HR Manager']), rbacController.getUsersByRole);

// ==========================================
// PERMISSION ROUTES
// ==========================================

router.get('/permissions', authorize(['Super Admin', 'HR Manager']), rbacController.listPermissions);
router.get('/permissions/groups', authorize(['Super Admin', 'HR Manager']), rbacController.getPermissionGroups);
router.get('/permissions/:id', authorize(['Super Admin', 'HR Manager']), rbacController.getPermissionById);
router.post('/permissions', authorize(['Super Admin']), rbacController.createPermission);
router.put('/permissions/:id', authorize(['Super Admin']), rbacController.updatePermission);
router.delete('/permissions/:id', authorize(['Super Admin']), rbacController.deletePermission);

// ==========================================
// ROLE-PERMISSION ASSIGNMENT ROUTES
// ==========================================

router.post('/roles/assign-permissions', authorize(['Super Admin']), rbacController.assignPermissionsToRole);
router.post('/roles/:roleId/permissions/:permissionId', authorize(['Super Admin']), rbacController.addPermissionToRole);
router.delete('/roles/:roleId/permissions/:permissionId', authorize(['Super Admin']), rbacController.removePermissionFromRole);

// ==========================================
// USER-ROLE ASSIGNMENT ROUTES
// ==========================================

router.get('/users/:userId/roles', authorize(['Super Admin', 'HR Manager']), rbacController.getUserRoles);
router.post('/users/assign-roles', authorize(['Super Admin', 'HR Manager']), rbacController.assignRolesToUser);
router.post('/users/:userId/roles/:roleId', authorize(['Super Admin', 'HR Manager']), rbacController.addRoleToUser);
router.delete('/users/:userId/roles/:roleId', authorize(['Super Admin', 'HR Manager']), rbacController.removeRoleFromUser);

// ==========================================
// USER-PERMISSION (DIRECT) ASSIGNMENT ROUTES
// ==========================================

router.get('/users/:userId/permissions', authorize(['Super Admin', 'HR Manager']), rbacController.getUserPermissions);
router.post('/users/assign-permissions', authorize(['Super Admin']), rbacController.assignPermissionsToUser);

// ==========================================
// UTILITY ROUTES
// ==========================================

router.get('/check/:userId/:permissionName', authorize(['Super Admin', 'HR Manager']), rbacController.checkPermission);
router.post('/seed', authorize(['Super Admin']), rbacController.seedRolesAndPermissions);

export default router;
