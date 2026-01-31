import { Request, Response } from 'express';
import { AuditLogService } from './audit-log.service';
import { AuthUser } from '../../middlewares/auth.middleware';

const service = new AuditLogService();

export class AuditLogController {
  async list(req: Request, res: Response) {
    try {
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        user_id: req.query.user_id ? parseInt(req.query.user_id as string) : undefined,
        action: req.query.action as string | undefined,
        model: req.query.model as string | undefined,
        model_id: req.query.model_id ? parseInt(req.query.model_id as string) : undefined,
        start_date: req.query.start_date as string | undefined,
        end_date: req.query.end_date as string | undefined,
        ip_address: req.query.ip_address as string | undefined,
      };
      const result = await service.list(query);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await service.getById(id);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async getByModel(req: Request, res: Response) {
    try {
      const model = req.params.model as string;
      const modelId = parseInt(req.params.modelId as string);
      const result = await service.getByModel(model, modelId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getByUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId as string);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const result = await service.getByUser(userId, { limit });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getMyActivity(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const result = await service.getByUser(user.id, { limit });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getRecentActivity(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const result = await service.getRecentActivity(limit);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getStatistics(req: Request, res: Response) {
    try {
      const query = {
        start_date: req.query.start_date as string | undefined,
        end_date: req.query.end_date as string | undefined,
      };
      const result = await service.getStatistics(query);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async cleanup(req: Request, res: Response) {
    try {
      const daysToKeep = req.body.days_to_keep ? parseInt(req.body.days_to_keep) : 90;
      const result = await service.cleanup(daysToKeep);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async export(req: Request, res: Response) {
    try {
      const query = {
        user_id: req.query.user_id ? parseInt(req.query.user_id as string) : undefined,
        action: req.query.action as string | undefined,
        model: req.query.model as string | undefined,
        model_id: req.query.model_id ? parseInt(req.query.model_id as string) : undefined,
        start_date: req.query.start_date as string | undefined,
        end_date: req.query.end_date as string | undefined,
        ip_address: req.query.ip_address as string | undefined,
      };
      const result = await service.export(query);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
