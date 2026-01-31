import { Request, Response } from 'express';
import { CompanyService } from './company.service';
import { AuthUser } from '../../middlewares/auth.middleware';

const companyService = new CompanyService();

export class CompanyController {
  async list(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await companyService.list(req.query, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await companyService.getById(id, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message === 'Company not found' ? 404 : 403).json({ error: error.message });
    }
  }

  async getHierarchy(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await companyService.getHierarchy(user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await companyService.create(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await companyService.update(id, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await companyService.delete(id, user);
      res.json({ message: 'Company deactivated successfully', data: result });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async getStatistics(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await companyService.getStatistics(id, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getSettings(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await companyService.getSettings(id, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateSettings(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await companyService.updateSettings(id, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // Feature Toggles (Super Admin Only)
  async listWithFeatureToggles(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await companyService.listWithFeatureToggles(user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('Super Admin') ? 403 : 400).json({ error: error.message });
    }
  }

  async getFeatureToggles(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await companyService.getFeatureToggles(id, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 403).json({ error: error.message });
    }
  }

  async updateFeatureToggles(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await companyService.updateFeatureToggles(id, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 403).json({ error: error.message });
    }
  }
}
