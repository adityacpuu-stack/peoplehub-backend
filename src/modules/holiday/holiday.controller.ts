import { Request, Response } from 'express';
import { HolidayService } from './holiday.service';
import { AuthUser } from '../../middlewares/auth.middleware';

const holidayService = new HolidayService();

export class HolidayController {
  async list(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await holidayService.list(req.query, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await holidayService.getById(id, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message === 'Holiday not found' ? 404 : 400).json({ error: error.message });
    }
  }

  async getCalendar(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const company_id = req.query.company_id ? parseInt(req.query.company_id as string) : undefined;

      const result = await holidayService.getCalendar({ year, month, company_id }, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getUpcoming(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = req.query.company_id
        ? parseInt(req.query.company_id as string)
        : user.employee?.company_id || undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

      const result = await holidayService.getUpcoming(companyId, limit);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await holidayService.create(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async bulkCreate(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await holidayService.bulkCreate(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await holidayService.update(id, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      await holidayService.delete(id, user);
      res.json({ message: 'Holiday deleted successfully' });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async seedNationalHolidays(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const year = parseInt(req.params.year as string);
      const result = await holidayService.seedNationalHolidays(year, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
