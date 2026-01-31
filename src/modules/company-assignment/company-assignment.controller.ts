import { Request, Response } from 'express';
import { companyAssignmentService } from './company-assignment.service';
import { AuthUser } from '../../middlewares/auth.middleware';

export class CompanyAssignmentController {
  /**
   * GET /api/v1/company-assignments
   * List all assignments
   */
  async list(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await companyAssignmentService.list(req.query, user);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/company-assignments/:id
   * Get assignment by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await companyAssignmentService.getById(id, user);
      res.json({ data: result });
    } catch (error: any) {
      const status = error.message === 'Assignment not found' ? 404 : 400;
      res.status(status).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/company-assignments/employee/:employeeId
   * Get assignments by employee ID
   */
  async getByEmployeeId(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const employeeId = parseInt(req.params.employeeId as string);
      const result = await companyAssignmentService.getByEmployeeId(employeeId, user);
      res.json({ data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/company-assignments/me
   * Get my assignments
   */
  async getMyAssignments(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await companyAssignmentService.getMyAssignments(user);
      res.json({ data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/company-assignments/available-employees/:companyId
   * Get employees available for assignment
   */
  async getAvailableEmployees(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const companyId = parseInt(req.params.companyId as string);
      const result = await companyAssignmentService.getAvailableEmployees(companyId, user);
      res.json({ data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/v1/company-assignments
   * Create new assignment
   */
  async create(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await companyAssignmentService.create(req.body, user);
      res.status(201).json({ message: 'Assignment created successfully', data: result });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/v1/company-assignments/bulk
   * Bulk assign companies to an employee
   */
  async bulkAssign(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const result = await companyAssignmentService.bulkAssign(req.body, user);
      res.status(201).json({
        message: `Successfully assigned ${result.created} companies (${result.skipped} skipped)`,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * PUT /api/v1/company-assignments/:id
   * Update assignment
   */
  async update(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      const result = await companyAssignmentService.update(id, req.body, user);
      res.json({ message: 'Assignment updated successfully', data: result });
    } catch (error: any) {
      const status = error.message === 'Assignment not found' ? 404 : 400;
      res.status(status).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/v1/company-assignments/:id
   * Delete assignment
   */
  async delete(req: Request, res: Response) {
    try {
      const user = req.user as AuthUser;
      const id = parseInt(req.params.id as string);
      await companyAssignmentService.delete(id, user);
      res.json({ message: 'Assignment deleted successfully' });
    } catch (error: any) {
      const status = error.message === 'Assignment not found' ? 404 : 400;
      res.status(status).json({ error: error.message });
    }
  }
}

export const companyAssignmentController = new CompanyAssignmentController();
