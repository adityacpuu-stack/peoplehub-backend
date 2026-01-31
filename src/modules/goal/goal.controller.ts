import { Request, Response } from 'express';
import { GoalService } from './goal.service';
import { AuthUser } from '../../middlewares/auth.middleware';

const service = new GoalService();

export class GoalController {
  async list(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string | undefined,
        employee_id: req.query.employee_id ? parseInt(req.query.employee_id as string) : undefined,
        performance_review_id: req.query.performance_review_id ? parseInt(req.query.performance_review_id as string) : undefined,
        kpi_id: req.query.kpi_id ? parseInt(req.query.kpi_id as string) : undefined,
        category: req.query.category as string | undefined,
        priority: req.query.priority as string | undefined,
        status: req.query.status as string | undefined,
        start_from: req.query.start_from as string | undefined,
        target_to: req.query.target_to as string | undefined,
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

  async getMyGoals(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const query = {
        status: req.query.status as string | undefined,
        category: req.query.category as string | undefined,
      };
      const result = await service.getMyGoals(user, query);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getByEmployeeId(req: Request, res: Response) {
    try {
      const employeeId = parseInt(req.params.employeeId as string);
      const query = {
        status: req.query.status as string | undefined,
        category: req.query.category as string | undefined,
      };
      const result = await service.getByEmployeeId(employeeId, query);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getTeamGoals(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      if (!user.employee?.id) {
        res.status(400).json({ error: 'No employee record found' });
        return;
      }
      const query = { status: req.query.status as string | undefined };
      const result = await service.getTeamGoals(user.employee.id, query);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getOverdue(req: Request, res: Response) {
    try {
      const companyId = req.query.company_id ? parseInt(req.query.company_id as string) : undefined;
      const result = await service.getOverdueGoals(companyId);
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

  async updateProgress(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await service.updateProgress(id, req.body, user);
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
      res.json({ message: 'Goal deleted successfully' });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async addManagerFeedback(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const { feedback, score } = req.body;
      if (!feedback) {
        res.status(400).json({ error: 'Feedback is required' });
        return;
      }
      const result = await service.addManagerFeedback(id, feedback, score, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async addEmployeeComment(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const { comment } = req.body;
      if (!comment) {
        res.status(400).json({ error: 'Comment is required' });
        return;
      }
      const result = await service.addEmployeeComment(id, comment, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async getStatistics(req: Request, res: Response) {
    try {
      const query = {
        employee_id: req.query.employee_id ? parseInt(req.query.employee_id as string) : undefined,
        company_id: req.query.company_id ? parseInt(req.query.company_id as string) : undefined,
      };
      const result = await service.getStatistics(query);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
