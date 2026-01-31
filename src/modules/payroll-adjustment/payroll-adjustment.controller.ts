import { Request, Response } from 'express';
import { PayrollAdjustmentService } from './payroll-adjustment.service';
import { AuthUser } from '../../middlewares/auth.middleware';

const payrollAdjustmentService = new PayrollAdjustmentService();

export class PayrollAdjustmentController {
  async list(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string | undefined,
        employee_id: req.query.employee_id ? parseInt(req.query.employee_id as string) : undefined,
        company_id: req.query.company_id ? parseInt(req.query.company_id as string) : undefined,
        type: req.query.type as string | undefined,
        status: req.query.status as string | undefined,
        pay_period: req.query.pay_period as string | undefined,
        effective_from: req.query.effective_from as string | undefined,
        effective_to: req.query.effective_to as string | undefined,
        is_recurring: req.query.is_recurring === 'true' ? true : req.query.is_recurring === 'false' ? false : undefined,
      };
      const result = await payrollAdjustmentService.list(query, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await payrollAdjustmentService.getById(id);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async getByEmployeeId(req: Request, res: Response) {
    try {
      const employeeId = parseInt(req.params.employeeId as string);
      const query = {
        status: req.query.status as string | undefined,
        type: req.query.type as string | undefined,
      };
      const result = await payrollAdjustmentService.getByEmployeeId(employeeId, query);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await payrollAdjustmentService.create(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await payrollAdjustmentService.update(id, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      await payrollAdjustmentService.delete(id, user);
      res.json({ message: 'Payroll adjustment deleted successfully' });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await payrollAdjustmentService.approve(id, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async reject(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const { reason } = req.body;
      if (!reason) {
        res.status(400).json({ error: 'Rejection reason is required' });
        return;
      }
      const result = await payrollAdjustmentService.reject(id, reason, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async bulkCreate(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await payrollAdjustmentService.bulkCreate(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async bulkApprove(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ error: 'ids array is required' });
        return;
      }
      const result = await payrollAdjustmentService.bulkApprove(ids, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getPendingApprovals(req: Request, res: Response) {
    try {
      const companyId = req.query.company_id ? parseInt(req.query.company_id as string) : undefined;
      const result = await payrollAdjustmentService.getPendingApprovals(companyId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getStatistics(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const query = {
        company_id: req.query.company_id ? parseInt(req.query.company_id as string) : undefined,
        pay_period: req.query.pay_period as string | undefined,
      };
      const result = await payrollAdjustmentService.getStatistics(query, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
