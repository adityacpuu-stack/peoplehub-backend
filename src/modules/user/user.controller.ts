import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';
import { UserListQuery, CreateUserDTO, UpdateUserDTO } from './user.types';
import { AuthUser } from '../../middlewares/auth.middleware';
import { microsoft365Service } from '../microsoft365/microsoft365.service';

export class UserController {
  /**
   * List users
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query: UserListQuery = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        search: req.query.search as string,
        is_active: req.query.is_active !== undefined
          ? req.query.is_active === 'true'
          : undefined,
        role_id: req.query.role_id ? parseInt(req.query.role_id as string) : undefined,
        company_id: req.query.company_id ? parseInt(req.query.company_id as string) : undefined,
      };

      const result = await userService.list(query, req.user as AuthUser);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string);
      const user = await userService.getById(id, req.user as AuthUser);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create user
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateUserDTO = req.body;
      const user = await userService.create(data, req.user as AuthUser);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string);
      const data: UpdateUserDTO = req.body;
      const user = await userService.update(id, data, req.user as AuthUser);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await userService.delete(id, req.user as AuthUser);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle user status
   */
  async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string);
      const user = await userService.toggleStatus(id, req.user as AuthUser);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user statistics
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await userService.getStats(req.user as AuthUser);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send credentials to user
   */
  async sendCredentials(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string);
      const { username, licenseSkuId } = req.body;
      const result = await userService.sendCredentials(id, req.user as AuthUser, username, licenseSkuId);
      res.json({
        message: `Credentials sent to ${result.sentTo}`,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available M365 licenses
   */
  async getM365Licenses(req: Request, res: Response, next: NextFunction) {
    try {
      if (!microsoft365Service.isReady()) {
        res.json({ available: false, licenses: [] });
        return;
      }
      const licenses = await microsoft365Service.getAvailableLicenses();
      res.json({ available: true, licenses });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's notification preferences
   */
  async getMyPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as AuthUser;
      const preferences = await userService.getPreferences(user.id);
      res.json({ success: true, data: preferences });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user's notification preferences
   */
  async updateMyPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as AuthUser;
      const preferences = await userService.updatePreferences(user.id, req.body);
      res.json({ success: true, data: preferences });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
