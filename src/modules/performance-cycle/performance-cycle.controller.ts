import { Request, Response } from 'express';
import { PerformanceCycleService } from './performance-cycle.service';
import { AuthUser } from '../../middlewares/auth.middleware';

const service = new PerformanceCycleService();

export class PerformanceCycleController {
  async list(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string | undefined,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        cycle_type: req.query.cycle_type as string | undefined,
        status: req.query.status as string | undefined,
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

  async getActive(req: Request, res: Response) {
    try {
      const result = await service.getActive();
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getByYear(req: Request, res: Response) {
    try {
      const year = parseInt(req.params.year as string);
      const result = await service.getByYear(year);
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
      res.json({ message: 'Performance cycle deleted successfully' });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async activate(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await service.activate(id, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async startReview(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await service.startReview(id, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async startCalibration(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await service.startCalibration(id, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async complete(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await service.complete(id, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async getCurrentPhase(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await service.getCurrentPhase(id);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async getStatistics(req: Request, res: Response) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const result = await service.getStatistics(year);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
