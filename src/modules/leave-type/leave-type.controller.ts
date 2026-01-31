import { Request, Response } from 'express';
import { LeaveTypeService } from './leave-type.service';
import { AuthUser } from '../../middlewares/auth.middleware';

const leaveTypeService = new LeaveTypeService();

export class LeaveTypeController {
  // ==========================================
  // LEAVE TYPE ENDPOINTS
  // ==========================================

  async listLeaveTypes(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await leaveTypeService.listLeaveTypes(req.query, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getLeaveTypeById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await leaveTypeService.getLeaveTypeById(id);
      res.json(result);
    } catch (error: any) {
      res.status(error.message === 'Leave type not found' ? 404 : 400).json({ error: error.message });
    }
  }

  async createLeaveType(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await leaveTypeService.createLeaveType(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateLeaveType(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await leaveTypeService.updateLeaveType(id, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async deleteLeaveType(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      await leaveTypeService.deleteLeaveType(id, user);
      res.json({ message: 'Leave type deleted successfully' });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async seedDefaultLeaveTypes(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = req.body.company_id ? parseInt(req.body.company_id) : null;
      const result = await leaveTypeService.seedDefaultLeaveTypes(companyId, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // ==========================================
  // LEAVE ENTITLEMENT ENDPOINTS
  // ==========================================

  async listLeaveEntitlements(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await leaveTypeService.listLeaveEntitlements(req.query, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getLeaveEntitlementById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const result = await leaveTypeService.getLeaveEntitlementById(id);
      res.json(result);
    } catch (error: any) {
      res.status(error.message === 'Leave entitlement not found' ? 404 : 400).json({ error: error.message });
    }
  }

  async createLeaveEntitlement(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await leaveTypeService.createLeaveEntitlement(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateLeaveEntitlement(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await leaveTypeService.updateLeaveEntitlement(id, req.body, user);
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async deleteLeaveEntitlement(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      await leaveTypeService.deleteLeaveEntitlement(id, user);
      res.json({ message: 'Leave entitlement deleted successfully' });
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  // ==========================================
  // EMPLOYEE LEAVE BALANCE ENDPOINTS
  // ==========================================

  async getEmployeeLeaveBalances(req: Request, res: Response) {
    try {
      const result = await leaveTypeService.getEmployeeLeaveBalances(req.query);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getEmployeeBalanceByType(req: Request, res: Response) {
    try {
      const employeeId = parseInt(req.params.employeeId as string);
      const leaveTypeId = parseInt(req.params.leaveTypeId as string);
      const year = parseInt(req.params.year as string);
      const result = await leaveTypeService.getEmployeeBalanceByType(employeeId, leaveTypeId, year);

      if (!result) {
        res.status(404).json({ error: 'Leave balance not found' });
        return;
      }

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async createEmployeeLeaveBalance(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await leaveTypeService.createEmployeeLeaveBalance(req.body, user);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateEmployeeLeaveBalance(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const employeeId = parseInt(req.params.employeeId as string);
      const leaveTypeId = parseInt(req.params.leaveTypeId as string);
      const year = parseInt(req.params.year as string);
      const result = await leaveTypeService.updateEmployeeLeaveBalance(
        employeeId,
        leaveTypeId,
        year,
        req.body,
        user
      );
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async adjustLeaveBalance(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const employeeId = parseInt(req.params.employeeId as string);
      const leaveTypeId = parseInt(req.params.leaveTypeId as string);
      const year = parseInt(req.params.year as string);
      const result = await leaveTypeService.adjustLeaveBalance(
        employeeId,
        leaveTypeId,
        year,
        req.body,
        user
      );
      res.json(result);
    } catch (error: any) {
      res.status(error.message.includes('not found') ? 404 : 400).json({ error: error.message });
    }
  }

  async initializeEmployeeBalances(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const employeeId = parseInt(req.params.employeeId as string);
      const year = parseInt(req.body.year) || new Date().getFullYear();
      const companyId = req.body.company_id ? parseInt(req.body.company_id) : null;
      const result = await leaveTypeService.initializeEmployeeBalances(employeeId, year, companyId, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async carryForwardBalances(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const employeeId = parseInt(req.params.employeeId as string);
      const fromYear = parseInt(req.body.from_year);
      const toYear = parseInt(req.body.to_year);
      const result = await leaveTypeService.carryForwardBalances(employeeId, fromYear, toYear, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
