import { Request, Response } from 'express';
import { TemplateService } from './template.service';
import { AuthUser } from '../../middlewares/auth.middleware';
import { TemplateCategory, TemplateFileType } from './template.types';

const service = new TemplateService();

export class TemplateController {
  /**
   * GET /api/v1/templates
   * List templates with pagination and filtering
   */
  async list(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string | undefined,
        company_id: req.query.company_id ? parseInt(req.query.company_id as string) : undefined,
        category: req.query.category as TemplateCategory | undefined,
        file_type: req.query.file_type as TemplateFileType | undefined,
        is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
        sort_by: req.query.sort_by as string | undefined,
        sort_order: req.query.sort_order as 'asc' | 'desc' | undefined,
      };

      const result = await service.list(query, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * GET /api/v1/templates/statistics
   * Get template statistics
   */
  async getStatistics(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = req.query.company_id ? parseInt(req.query.company_id as string) : undefined;
      const result = await service.getStatistics(companyId, user);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * GET /api/v1/templates/company/:companyId
   * Get templates by company
   */
  async getByCompany(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = parseInt(req.params.companyId as string);
      const result = await service.getByCompany(companyId, user);
      res.json({ success: true, data: result });
    } catch (error: any) {
      const status = error.message.includes('Access denied') ? 403 : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * GET /api/v1/templates/category/:category
   * Get templates by category
   */
  async getByCategory(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const category = req.params.category as string;
      const companyId = req.query.company_id ? parseInt(req.query.company_id as string) : undefined;
      const result = await service.getByCategory(category, companyId, user);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * GET /api/v1/templates/:id
   * Get template by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await service.getById(id, user);
      res.json({ success: true, data: result });
    } catch (error: any) {
      const status = error.message.includes('not found') ? 404 : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * POST /api/v1/templates
   * Create a new template
   */
  async create(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await service.create(req.body, user);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      const status = error.message.includes('Access denied') ? 403 : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * PUT /api/v1/templates/:id
   * Update a template
   */
  async update(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await service.update(id, req.body, user);
      res.json({ success: true, data: result });
    } catch (error: any) {
      const status = error.message.includes('not found')
        ? 404
        : error.message.includes('Access denied')
        ? 403
        : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * DELETE /api/v1/templates/:id
   * Delete a template (soft delete)
   */
  async delete(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      await service.delete(id, user);
      res.json({ success: true, message: 'Template deleted successfully' });
    } catch (error: any) {
      const status = error.message.includes('not found')
        ? 404
        : error.message.includes('Access denied')
        ? 403
        : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * POST /api/v1/templates/:id/duplicate
   * Duplicate a template
   */
  async duplicate(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await service.duplicate(id, user);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      const status = error.message.includes('not found')
        ? 404
        : error.message.includes('Access denied')
        ? 403
        : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * POST /api/v1/templates/:id/download
   * Track template download
   */
  async download(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await service.incrementDownload(id);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
}
