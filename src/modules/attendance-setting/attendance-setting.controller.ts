import { Request, Response } from 'express';
import { AttendanceSettingService } from './attendance-setting.service';
import { AuthUser } from '../../middlewares/auth.middleware';

const attendanceSettingService = new AttendanceSettingService();

export class AttendanceSettingController {
  // ==========================================
  // ATTENDANCE SETTING ENDPOINTS
  // ==========================================

  async getByCompany(req: Request, res: Response) {
    try {
      const companyId = parseInt(req.params.companyId as string);
      const result = await attendanceSettingService.getByCompany(companyId);

      if (!result) {
        res.status(404).json({ error: 'Attendance setting not found for this company' });
        return;
      }

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getOrCreate(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = parseInt(req.params.companyId as string);
      const result = await attendanceSettingService.getOrCreate(companyId, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await attendanceSettingService.create(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = parseInt(req.params.companyId as string);
      const result = await attendanceSettingService.update(companyId, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async upsert(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = parseInt(req.params.companyId as string);
      const result = await attendanceSettingService.upsert(companyId, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = parseInt(req.params.companyId as string);
      await attendanceSettingService.delete(companyId, user);
      res.json({ message: 'Attendance setting deleted successfully' });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async resetToDefault(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = parseInt(req.params.companyId as string);
      const result = await attendanceSettingService.resetToDefault(companyId, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // ==========================================
  // SECURITY RULE ENDPOINTS
  // ==========================================

  async listSecurityRules(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await attendanceSettingService.listSecurityRules(req.query, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getSecurityRuleById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await attendanceSettingService.getSecurityRuleById(id);
      res.json(result);
    } catch (error: any) {
      res.status(error.message === 'Security rule not found' ? 404 : 400).json({ error: error.message });
    }
  }

  async createSecurityRule(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await attendanceSettingService.createSecurityRule(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateSecurityRule(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await attendanceSettingService.updateSecurityRule(id, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async deleteSecurityRule(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      await attendanceSettingService.deleteSecurityRule(id, user);
      res.json({ message: 'Security rule deleted successfully' });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async getActiveSecurityRules(req: Request, res: Response) {
    try {
      const companyId = req.query.company_id ? parseInt(req.query.company_id as string) : undefined;
      const result = await attendanceSettingService.getActiveSecurityRules(companyId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
