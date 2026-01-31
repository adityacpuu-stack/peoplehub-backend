import { Request, Response } from 'express';
import { SalaryGradeService } from './salary-grade.service';
import { AuthUser } from '../../middlewares/auth.middleware';

const salaryGradeService = new SalaryGradeService();

export class SalaryGradeController {
  async list(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
        level: req.query.level ? parseInt(req.query.level as string) : undefined,
      };
      const result = await salaryGradeService.list(query, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await salaryGradeService.getById(id);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async getByCode(req: Request, res: Response) {
    try {
      const code = req.params.code as string;
      const result = await salaryGradeService.getByCode(code);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await salaryGradeService.create(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await salaryGradeService.update(id, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      await salaryGradeService.delete(id, user);
      res.json({ message: 'Salary grade deleted successfully' });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async seedDefaults(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await salaryGradeService.seedDefaults(user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getEmployeesByGrade(req: Request, res: Response) {
    try {
      const gradeId = parseInt(req.params.id as string);
      const result = await salaryGradeService.getEmployeesByGrade(gradeId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async assignEmployeeToGrade(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const gradeId = parseInt(req.params.id as string);
      const { employee_id } = req.body;
      const result = await salaryGradeService.assignEmployeeToGrade(employee_id, gradeId, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getSalaryRangeAnalysis(req: Request, res: Response) {
    try {
      const result = await salaryGradeService.getSalaryRangeAnalysis();
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
