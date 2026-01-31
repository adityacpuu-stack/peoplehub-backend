import { Request, Response } from 'express';
import { SettingService } from './setting.service';
import { AuthUser } from '../../middlewares/auth.middleware';

const settingService = new SettingService();

export class SettingController {
  // ==========================================
  // SETTINGS
  // ==========================================

  async listSettings(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await settingService.listSettings(req.query, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getSetting(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await settingService.getSetting(req.params.key as string, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 403).json({ error: error.message });
    }
  }

  async getSettingsByGroup(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await settingService.getSettingsByGroup(req.params.group as string, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getPublicSettings(req: Request, res: Response) {
    try {
      const result = await settingService.getPublicSettings();
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getSettingGroups(req: Request, res: Response) {
    try {
      const result = await settingService.getSettingGroups();
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async createSetting(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await settingService.createSetting(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateSetting(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await settingService.updateSetting(req.params.key as string, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async bulkUpdateSettings(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await settingService.bulkUpdateSettings(req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteSetting(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      await settingService.deleteSetting(req.params.key as string, user);
      res.json({ message: 'Setting deleted successfully' });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  // ==========================================
  // SYSTEM SETTINGS
  // ==========================================

  async listSystemSettings(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await settingService.listSystemSettings(req.query, user);
      res.json(result);
    } catch (error: any) {
      res.status(403).json({ error: error.message });
    }
  }

  async getSystemSetting(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await settingService.getSystemSetting(req.params.key as string, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 403).json({ error: error.message });
    }
  }

  async updateSystemSetting(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await settingService.updateSystemSetting(req.params.key as string, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  // ==========================================
  // SEED & UTILITIES
  // ==========================================

  async seedDefaultSettings(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await settingService.seedDefaultSettings(user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getMaintenanceStatus(req: Request, res: Response) {
    try {
      const isMaintenanceMode = await settingService.isMaintenanceMode();
      res.json({ maintenance_mode: isMaintenanceMode });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async setMaintenanceMode(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const { enabled } = req.body;
      const result = await settingService.setMaintenanceMode(enabled, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
