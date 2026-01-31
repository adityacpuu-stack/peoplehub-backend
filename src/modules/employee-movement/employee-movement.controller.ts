import { Request, Response } from 'express';
import { EmployeeMovementService } from './employee-movement.service';
import { AuthUser } from '../../middlewares/auth.middleware';

const employeeMovementService = new EmployeeMovementService();

export class EmployeeMovementController {
  async list(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        search: req.query.search as string | undefined,
        employee_id: req.query.employee_id ? parseInt(req.query.employee_id as string) : undefined,
        company_id: req.query.company_id ? parseInt(req.query.company_id as string) : undefined,
        movement_type: req.query.movement_type as string | undefined,
        status: req.query.status as string | undefined,
        effective_from: req.query.effective_from as string | undefined,
        effective_to: req.query.effective_to as string | undefined,
        is_applied: req.query.is_applied === 'true' ? true : req.query.is_applied === 'false' ? false : undefined,
      };
      const result = await employeeMovementService.list(query, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await employeeMovementService.getById(id);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async getByEmployeeId(req: Request, res: Response) {
    try {
      const employeeId = parseInt(req.params.employeeId as string);
      const query = { status: req.query.status as string | undefined };
      const result = await employeeMovementService.getByEmployeeId(employeeId, query);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await employeeMovementService.create(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await employeeMovementService.update(id, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      await employeeMovementService.delete(id, user);
      res.json({ message: 'Employee movement deleted successfully' });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const { approval_notes } = req.body;
      const result = await employeeMovementService.approve(id, approval_notes, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async reject(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const { rejection_reason } = req.body;
      if (!rejection_reason) {
        res.status(400).json({ error: 'Rejection reason is required' });
        return;
      }
      const result = await employeeMovementService.reject(id, rejection_reason, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async apply(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await employeeMovementService.apply(id, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async getPendingApprovals(req: Request, res: Response) {
    try {
      const companyId = req.query.company_id ? parseInt(req.query.company_id as string) : undefined;
      const result = await employeeMovementService.getPendingApprovals(companyId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getApprovedPendingApplication(req: Request, res: Response) {
    try {
      const companyId = req.query.company_id ? parseInt(req.query.company_id as string) : undefined;
      const result = await employeeMovementService.getApprovedPendingApplication(companyId);
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
      };
      const result = await employeeMovementService.getStatistics(query, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
