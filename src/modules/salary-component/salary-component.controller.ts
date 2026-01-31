import { Request, Response } from 'express';
import { SalaryComponentService } from './salary-component.service';
import { AuthUser } from '../../middlewares/auth.middleware';

const salaryComponentService = new SalaryComponentService();

export class SalaryComponentController {
  async list(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        search: req.query.search as string | undefined,
        company_id: req.query.company_id ? parseInt(req.query.company_id as string) : undefined,
        type: req.query.type as string | undefined,
        category: req.query.category as string | undefined,
        is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
        is_taxable: req.query.is_taxable === 'true' ? true : req.query.is_taxable === 'false' ? false : undefined,
      };
      const result = await salaryComponentService.list(query, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await salaryComponentService.getById(id);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async getByCode(req: Request, res: Response) {
    try {
      const code = req.params.code as string;
      const companyId = req.query.company_id ? parseInt(req.query.company_id as string) : undefined;
      const result = await salaryComponentService.getByCode(code, companyId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await salaryComponentService.create(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await salaryComponentService.update(id, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      await salaryComponentService.delete(id, user);
      res.json({ message: 'Salary component deleted successfully' });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async seedDefaults(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = req.body.company_id ? parseInt(req.body.company_id) : null;
      const result = await salaryComponentService.seedDefaults(companyId, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getEarnings(req: Request, res: Response) {
    try {
      const companyId = req.query.company_id ? parseInt(req.query.company_id as string) : undefined;
      const result = await salaryComponentService.getEarnings(companyId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getDeductions(req: Request, res: Response) {
    try {
      const companyId = req.query.company_id ? parseInt(req.query.company_id as string) : undefined;
      const result = await salaryComponentService.getDeductions(companyId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
