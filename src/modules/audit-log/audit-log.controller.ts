import { Request, Response } from 'express';
import { AuditLogService } from './audit-log.service';
import { asyncHandler } from '../../middlewares/error.middleware';

const service = new AuditLogService();

export class AuditLogController {
  list = asyncHandler(async (req: Request, res: Response) => {
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
    res.json({ success: true, ...result });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const result = await service.getById(id);
    res.json({ success: true, data: result });
  });

  getByModel = asyncHandler(async (req: Request, res: Response) => {
    const model = req.params.model as string;
    const modelId = parseInt(req.params.modelId as string);
    const result = await service.getByModel(model, modelId);
    res.json({ success: true, data: result });
  });

  getByUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId as string);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const result = await service.getByUser(userId, { limit });
    res.json({ success: true, data: result });
  });

  getMyActivity = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const result = await service.getByUser(user.id, { limit });
    res.json({ success: true, data: result });
  });

  getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const result = await service.getRecentActivity(limit);
    res.json({ success: true, data: result });
  });

  getStatistics = asyncHandler(async (req: Request, res: Response) => {
    const query = {
      start_date: req.query.start_date as string | undefined,
      end_date: req.query.end_date as string | undefined,
    };
    const result = await service.getStatistics(query);
    res.json({ success: true, data: result });
  });

  cleanup = asyncHandler(async (req: Request, res: Response) => {
    const daysToKeep = req.body.days_to_keep ? parseInt(req.body.days_to_keep) : 90;
    const result = await service.cleanup(daysToKeep);
    res.json({ success: true, data: result });
  });

  export = asyncHandler(async (req: Request, res: Response) => {
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
    res.json({ success: true, data: result });
  });
}
