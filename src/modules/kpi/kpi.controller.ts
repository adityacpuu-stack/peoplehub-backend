import { Request, Response } from 'express';
import { KpiService } from './kpi.service';
import { AuthUser } from '../../middlewares/auth.middleware';

const service = new KpiService();

export class KpiController {
  async list(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        search: req.query.search as string | undefined,
        category: req.query.category as string | undefined,
        department_id: req.query.department_id ? parseInt(req.query.department_id as string) : undefined,
        position_id: req.query.position_id ? parseInt(req.query.position_id as string) : undefined,
        target_frequency: req.query.target_frequency as string | undefined,
        is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
      };
      const result = await service.list(query, user);
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

  async getByCode(req: Request, res: Response) {
    try {
      const code = req.params.code as string;
      const result = await service.getByCode(code);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async getByDepartment(req: Request, res: Response) {
    try {
      const departmentId = parseInt(req.params.departmentId as string);
      const result = await service.getByDepartment(departmentId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getByPosition(req: Request, res: Response) {
    try {
      const positionId = parseInt(req.params.positionId as string);
      const result = await service.getByPosition(positionId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getByCategory(req: Request, res: Response) {
    try {
      const category = req.params.category as string;
      const result = await service.getByCategory(category);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await service.create(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await service.update(id, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      await service.delete(id, user);
      res.json({ message: 'KPI deleted successfully' });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async seedDefaults(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await service.seedDefaults(user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async assignToDepartment(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const { department_id } = req.body;
      if (!department_id) {
        res.status(400).json({ error: 'department_id is required' });
        return;
      }
      const result = await service.assignToDepartment(id, department_id, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async assignToPosition(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const { position_id } = req.body;
      if (!position_id) {
        res.status(400).json({ error: 'position_id is required' });
        return;
      }
      const result = await service.assignToPosition(id, position_id, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async getStatistics(req: Request, res: Response) {
    try {
      const result = await service.getStatistics();
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
