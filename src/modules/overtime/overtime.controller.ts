import { Request, Response } from 'express';
import { OvertimeService } from './overtime.service';
import {
  OvertimeListQuery,
  CreateOvertimeDTO,
  CreateOvertimeForEmployeeDTO,
  UpdateOvertimeDTO,
  ApproveOvertimeDTO,
  RejectOvertimeDTO,
} from './overtime.types';

const overtimeService = new OvertimeService();

// Helper to safely get param as string
const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

/**
 * GET /api/v1/overtime
 * Get paginated list of overtime requests
 */
export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const query: OvertimeListQuery = {
      page: parseInt(getParam(req.query.page as string)) || 1,
      limit: parseInt(getParam(req.query.limit as string)) || 10,
      employee_id: req.query.employee_id ? parseInt(getParam(req.query.employee_id as string)) : undefined,
      company_id: req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined,
      department_id: req.query.department_id ? parseInt(getParam(req.query.department_id as string)) : undefined,
      start_date: getParam(req.query.start_date as string) || undefined,
      end_date: getParam(req.query.end_date as string) || undefined,
      status: getParam(req.query.status as string) || undefined,
      overtime_type: getParam(req.query.overtime_type as string) || undefined,
      sort_by: getParam(req.query.sort_by as string) || undefined,
      sort_order: (getParam(req.query.sort_order as string) as 'asc' | 'desc') || undefined,
    };

    const result = await overtimeService.list(query, req.user);

    res.status(200).json({
      message: 'Overtime requests retrieved successfully',
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to retrieve overtime requests' });
  }
};

/**
 * GET /api/v1/overtime/:id
 * Get overtime by ID
 */
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid overtime ID' });
      return;
    }

    const overtime = await overtimeService.getById(id, req.user);

    res.status(200).json({
      message: 'Overtime request retrieved successfully',
      data: overtime,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * GET /api/v1/overtime/me
 * Get current user's overtime requests
 */
export const getMyOvertimes = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const query: OvertimeListQuery = {
      page: parseInt(getParam(req.query.page as string)) || 1,
      limit: parseInt(getParam(req.query.limit as string)) || 10,
      start_date: getParam(req.query.start_date as string) || undefined,
      end_date: getParam(req.query.end_date as string) || undefined,
      status: getParam(req.query.status as string) || undefined,
      sort_by: getParam(req.query.sort_by as string) || 'date',
      sort_order: (getParam(req.query.sort_order as string) as 'asc' | 'desc') || 'desc',
    };

    const result = await overtimeService.getMyOvertimes(query, req.user);

    res.status(200).json({
      message: 'Overtime requests retrieved successfully',
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/v1/overtime/pending-approvals
 * Get pending approvals for manager
 */
export const getPendingApprovals = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const overtimes = await overtimeService.getPendingApprovals(req.user);

    res.status(200).json({
      message: 'Pending approvals retrieved successfully',
      data: overtimes,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/v1/overtime
 * Create overtime request for current user
 */
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const data: CreateOvertimeDTO = req.body;

    if (!data.date) {
      res.status(400).json({ message: 'Date is required' });
      return;
    }
    if (!data.start_time || !data.end_time) {
      res.status(400).json({ message: 'Start time and end time are required' });
      return;
    }
    if (!data.reason) {
      res.status(400).json({ message: 'Reason is required' });
      return;
    }

    const overtime = await overtimeService.create(data, req.user);

    res.status(201).json({
      message: 'Overtime request created successfully',
      data: overtime,
    });
  } catch (error: any) {
    const status = error.message.includes('No employee profile') ? 404 :
                   error.message.includes('Invalid') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * POST /api/v1/overtime/employee
 * Create overtime for an employee (HR only)
 */
export const createForEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const data: CreateOvertimeForEmployeeDTO = req.body;

    if (!data.employee_id) {
      res.status(400).json({ message: 'Employee ID is required' });
      return;
    }
    if (!data.date) {
      res.status(400).json({ message: 'Date is required' });
      return;
    }
    // Either hours or start_time/end_time must be provided
    if (!data.hours && (!data.start_time || !data.end_time)) {
      res.status(400).json({ message: 'Either hours or start_time/end_time are required' });
      return;
    }
    if (!data.reason) {
      res.status(400).json({ message: 'Reason is required' });
      return;
    }

    const overtime = await overtimeService.createForEmployee(data, req.user);

    res.status(201).json({
      message: 'Overtime request created successfully',
      data: overtime,
    });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 :
                   error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * PUT /api/v1/overtime/:id
 * Update overtime request
 */
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid overtime ID' });
      return;
    }

    const data: UpdateOvertimeDTO = req.body;
    const overtime = await overtimeService.update(id, data, req.user);

    res.status(200).json({
      message: 'Overtime request updated successfully',
      data: overtime,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 :
                   error.message.includes('Can only') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * POST /api/v1/overtime/:id/cancel
 * Cancel overtime request (owner only)
 */
export const cancel = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid overtime ID' });
      return;
    }

    const overtime = await overtimeService.cancel(id, req.user);

    res.status(200).json({
      message: 'Overtime request cancelled successfully',
      data: overtime,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Only the owner') ? 403 :
                   error.message.includes('Can only') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * POST /api/v1/overtime/:id/approve
 * Approve overtime request
 */
export const approve = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid overtime ID' });
      return;
    }

    const data: ApproveOvertimeDTO = req.body;
    const overtime = await overtimeService.approve(id, data, req.user);

    res.status(200).json({
      message: 'Overtime request approved successfully',
      data: overtime,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 :
                   error.message.includes('Can only') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * POST /api/v1/overtime/:id/reject
 * Reject overtime request
 */
export const reject = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid overtime ID' });
      return;
    }

    const data: RejectOvertimeDTO = req.body;

    if (!data.rejection_reason) {
      res.status(400).json({ message: 'Rejection reason is required' });
      return;
    }

    const overtime = await overtimeService.reject(id, data, req.user);

    res.status(200).json({
      message: 'Overtime request rejected',
      data: overtime,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 :
                   error.message.includes('Can only') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * DELETE /api/v1/overtime/:id
 * Delete overtime (HR only)
 */
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid overtime ID' });
      return;
    }

    await overtimeService.delete(id, req.user);

    res.status(200).json({
      message: 'Overtime request deleted successfully',
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};
