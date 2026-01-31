import { Request, Response } from 'express';
import { AllowanceService } from './allowance.service';
import { AuthUser } from '../../middlewares/auth.middleware';

const allowanceService = new AllowanceService();

export class AllowanceController {
  // ==========================================
  // CRUD ENDPOINTS
  // ==========================================

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
        is_taxable: req.query.is_taxable === 'true' ? true : req.query.is_taxable === 'false' ? false : undefined,
        is_recurring: req.query.is_recurring === 'true' ? true : req.query.is_recurring === 'false' ? false : undefined,
        frequency: req.query.frequency as string | undefined,
        effective_from: req.query.effective_from as string | undefined,
        effective_to: req.query.effective_to as string | undefined,
      };

      const result = await allowanceService.list(query, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await allowanceService.getById(id);
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
      const result = await allowanceService.getByEmployeeId(employeeId, query);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getMyAllowances(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;

      if (!user.employee?.id) {
        res.status(400).json({ error: 'No employee record found for current user' });
        return;
      }

      const query = {
        status: req.query.status as string | undefined,
        type: req.query.type as string | undefined,
      };
      const result = await allowanceService.getByEmployeeId(user.employee.id, query);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await allowanceService.create(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await allowanceService.update(id, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      await allowanceService.delete(id, user);
      res.json({ message: 'Allowance deleted successfully' });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async hardDelete(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      await allowanceService.hardDelete(id, user);
      res.json({ message: 'Allowance permanently deleted' });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  // ==========================================
  // BULK OPERATIONS
  // ==========================================

  async bulkCreate(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await allowanceService.bulkCreate(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async bulkDelete(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ error: 'ids array is required' });
        return;
      }

      const result = await allowanceService.bulkDelete(ids, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async bulkUpdateStatus(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const { ids, status } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ error: 'ids array is required' });
        return;
      }

      if (!status) {
        res.status(400).json({ error: 'status is required' });
        return;
      }

      const result = await allowanceService.bulkUpdateStatus(ids, status, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // ==========================================
  // APPROVAL WORKFLOW
  // ==========================================

  async approve(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await allowanceService.approve(id, user);
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

      const result = await allowanceService.reject(id, reason, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  // ==========================================
  // CALCULATION
  // ==========================================

  async calculateEmployeeAllowances(req: Request, res: Response) {
    try {
      const employeeId = parseInt(req.params.employeeId as string);
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();

      const result = await allowanceService.calculateEmployeeAllowances({
        employee_id: employeeId,
        month,
        year,
      });

      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async calculateMyAllowances(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;

      if (!user.employee?.id) {
        res.status(400).json({ error: 'No employee record found for current user' });
        return;
      }

      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();

      const result = await allowanceService.calculateEmployeeAllowances({
        employee_id: user.employee.id,
        month,
        year,
      });

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // ==========================================
  // COMPANY TEMPLATES
  // ==========================================

  async getCompanyAllowances(req: Request, res: Response) {
    try {
      const companyId = parseInt(req.params.companyId as string);
      const result = await allowanceService.getCompanyAllowances(companyId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async createCompanyAllowance(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = parseInt(req.params.companyId as string);
      const result = await allowanceService.createCompanyAllowance(companyId, req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async applyCompanyAllowanceToEmployees(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const allowanceId = parseInt(req.params.id as string);
      const { employee_ids } = req.body;

      if (!Array.isArray(employee_ids) || employee_ids.length === 0) {
        res.status(400).json({ error: 'employee_ids array is required' });
        return;
      }

      const result = await allowanceService.applyCompanyAllowanceToEmployees(allowanceId, employee_ids, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async seedDefaultTemplates(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = parseInt(req.params.companyId as string);
      const result = await allowanceService.seedDefaultTemplates(companyId, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // ==========================================
  // STATISTICS
  // ==========================================

  async getStatistics(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const query = {
        company_id: req.query.company_id ? parseInt(req.query.company_id as string) : undefined,
        employee_id: req.query.employee_id ? parseInt(req.query.employee_id as string) : undefined,
      };

      const result = await allowanceService.getStatistics(query, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
