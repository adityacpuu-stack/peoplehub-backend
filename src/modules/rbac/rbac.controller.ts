import { Request, Response } from 'express';
import { RbacService } from './rbac.service';
import { AuthUser } from '../../middlewares/auth.middleware';

const rbacService = new RbacService();

export class RbacController {
  // ==========================================
  // ROLE ENDPOINTS
  // ==========================================

  async listRoles(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await rbacService.listRoles(req.query, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getRoleById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await rbacService.getRoleById(id);
      res.json(result);
    } catch (error: any) {
      res.status(error.message === 'Role not found' ? 404 : 400).json({ error: error.message });
    }
  }

  async getRoleByName(req: Request, res: Response) {
    try {
      const result = await rbacService.getRoleByName(req.params.name as string);
      res.json(result);
    } catch (error: any) {
      res.status(error.message === 'Role not found' ? 404 : 400).json({ error: error.message });
    }
  }

  async createRole(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await rbacService.createRole(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateRole(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await rbacService.updateRole(id, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async deleteRole(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      await rbacService.deleteRole(id, user);
      res.json({ message: 'Role deleted successfully' });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  // ==========================================
  // PERMISSION ENDPOINTS
  // ==========================================

  async listPermissions(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await rbacService.listPermissions(req.query, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getPermissionById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await rbacService.getPermissionById(id);
      res.json(result);
    } catch (error: any) {
      res.status(error.message === 'Permission not found' ? 404 : 400).json({ error: error.message });
    }
  }

  async createPermission(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await rbacService.createPermission(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updatePermission(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await rbacService.updatePermission(id, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async deletePermission(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      await rbacService.deletePermission(id, user);
      res.json({ message: 'Permission deleted successfully' });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async getPermissionGroups(req: Request, res: Response) {
    try {
      const result = await rbacService.getPermissionGroups();
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // ==========================================
  // ROLE-PERMISSION ASSIGNMENT
  // ==========================================

  async assignPermissionsToRole(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await rbacService.assignPermissionsToRole(req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async addPermissionToRole(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const roleId = parseInt(req.params.roleId as string);
      const permissionId = parseInt(req.params.permissionId as string);
      const result = await rbacService.addPermissionToRole(roleId, permissionId, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async removePermissionFromRole(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const roleId = parseInt(req.params.roleId as string);
      const permissionId = parseInt(req.params.permissionId as string);
      const result = await rbacService.removePermissionFromRole(roleId, permissionId, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // ==========================================
  // USER-ROLE ASSIGNMENT
  // ==========================================

  async getUserRoles(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId as string);
      const result = await rbacService.getUserRoles(userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async assignRolesToUser(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await rbacService.assignRolesToUser(req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async addRoleToUser(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const userId = parseInt(req.params.userId as string);
      const roleId = parseInt(req.params.roleId as string);
      const result = await rbacService.addRoleToUser(userId, roleId, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async removeRoleFromUser(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const userId = parseInt(req.params.userId as string);
      const roleId = parseInt(req.params.roleId as string);
      const result = await rbacService.removeRoleFromUser(userId, roleId, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // ==========================================
  // USER-PERMISSION (DIRECT) ASSIGNMENT
  // ==========================================

  async getUserPermissions(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId as string);
      const result = await rbacService.getUserPermissions(userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async assignPermissionsToUser(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await rbacService.assignPermissionsToUser(req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  // ==========================================
  // CHECK & UTILITY
  // ==========================================

  async checkPermission(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId as string);
      const permissionName = req.params.permissionName as string;
      const hasPermission = await rbacService.checkPermission(userId, permissionName);
      res.json({ has_permission: hasPermission });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getUsersByRole(req: Request, res: Response) {
    try {
      const roleId = parseInt(req.params.roleId as string);
      const result = await rbacService.getUsersByRole(roleId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // ==========================================
  // SEED
  // ==========================================

  async seedRolesAndPermissions(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await rbacService.seedRolesAndPermissions(user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
