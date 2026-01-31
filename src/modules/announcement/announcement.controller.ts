import { Request, Response } from 'express';
import { AnnouncementService } from './announcement.service';
import { AuthUser } from '../../middlewares/auth.middleware';
import { AnnouncementCategory, AnnouncementPriority, AnnouncementVisibility } from './announcement.types';

const service = new AnnouncementService();

export class AnnouncementController {
  /**
   * GET /api/v1/announcements
   * List announcements with pagination and filtering
   */
  async list(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string | undefined,
        company_id: req.query.company_id ? parseInt(req.query.company_id as string) : undefined,
        category: req.query.category as AnnouncementCategory | undefined,
        priority: req.query.priority as AnnouncementPriority | undefined,
        visibility: req.query.visibility as AnnouncementVisibility | undefined,
        is_pinned: req.query.is_pinned === 'true' ? true : req.query.is_pinned === 'false' ? false : undefined,
        is_published: req.query.is_published === 'true' ? true : req.query.is_published === 'false' ? false : undefined,
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
   * GET /api/v1/announcements/statistics
   * Get announcement statistics
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
   * GET /api/v1/announcements/published/:companyId
   * Get published announcements for employees
   */
  async getPublished(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = parseInt(req.params.companyId as string);
      const result = await service.getPublished(companyId, user);
      res.json({ success: true, data: result });
    } catch (error: any) {
      const status = error.message.includes('Access denied') ? 403 : 400;
      res.status(status).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * GET /api/v1/announcements/:id
   * Get announcement by ID
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
   * POST /api/v1/announcements
   * Create a new announcement
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
   * PUT /api/v1/announcements/:id
   * Update an announcement
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
   * DELETE /api/v1/announcements/:id
   * Delete an announcement (soft delete)
   */
  async delete(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      await service.delete(id, user);
      res.json({ success: true, message: 'Announcement deleted successfully' });
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
   * POST /api/v1/announcements/:id/publish
   * Publish an announcement
   */
  async publish(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await service.publish(id, user);
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
   * POST /api/v1/announcements/:id/unpublish
   * Unpublish an announcement
   */
  async unpublish(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await service.unpublish(id, user);
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
   * POST /api/v1/announcements/:id/toggle-pin
   * Toggle pin status
   */
  async togglePin(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await service.togglePin(id, user);
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
   * POST /api/v1/announcements/:id/view
   * Track announcement view
   */
  async trackView(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await service.incrementViews(id);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { message: error.message } });
    }
  }
}
