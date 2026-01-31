import { Request, Response } from 'express';
import { BenefitService } from './benefit.service';
import { AuthUser } from '../../middlewares/auth.middleware';

const benefitService = new BenefitService();

export class BenefitController {
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
      };
      const result = await benefitService.list(query, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await benefitService.getById(id);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await benefitService.create(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await benefitService.update(id, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      await benefitService.delete(id, user);
      res.json({ message: 'Benefit deleted successfully' });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async seedDefaults(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = req.body.company_id ? parseInt(req.body.company_id) : null;
      const result = await benefitService.seedDefaults(companyId, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getByType(req: Request, res: Response) {
    try {
      const type = req.params.type as string;
      const companyId = req.query.company_id ? parseInt(req.query.company_id as string) : undefined;
      const result = await benefitService.getByType(type, companyId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getByCategory(req: Request, res: Response) {
    try {
      const category = req.params.category as string;
      const companyId = req.query.company_id ? parseInt(req.query.company_id as string) : undefined;
      const result = await benefitService.getByCategory(category, companyId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getStatistics(req: Request, res: Response) {
    try {
      const companyId = req.query.company_id ? parseInt(req.query.company_id as string) : undefined;
      const result = await benefitService.getStatistics(companyId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
