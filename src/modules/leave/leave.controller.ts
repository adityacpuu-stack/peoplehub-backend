import { Request, Response } from 'express';
import { LeaveService } from './leave.service';
import {
  LeaveTypeListQuery,
  LeaveListQuery,
  LeaveBalanceQuery,
  HolidayListQuery,
  CreateLeaveTypeDTO,
  UpdateLeaveTypeDTO,
  CreateLeaveDTO,
  CreateLeaveForEmployeeDTO,
  UpdateLeaveDTO,
  ApproveLeaveDTO,
  RejectLeaveDTO,
  AdjustLeaveBalanceDTO,
  AllocateLeaveDTO,
  CreateHolidayDTO,
  UpdateHolidayDTO,
} from './leave.types';

const leaveService = new LeaveService();

// Helper to safely get param as string
const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

// ==========================================
// LEAVE TYPE CONTROLLERS
// ==========================================

export const listLeaveTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const query: LeaveTypeListQuery = {
      page: parseInt(getParam(req.query.page as string)) || 1,
      limit: parseInt(getParam(req.query.limit as string)) || 10,
      company_id: req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined,
      is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
      search: getParam(req.query.search as string) || undefined,
    };

    const result = await leaveService.listLeaveTypes(query, req.user);

    res.status(200).json({
      message: 'Leave types retrieved successfully',
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to retrieve leave types' });
  }
};

export const getLeaveTypeById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid leave type ID' });
      return;
    }

    const leaveType = await leaveService.getLeaveTypeById(id, req.user);

    res.status(200).json({
      message: 'Leave type retrieved successfully',
      data: leaveType,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const createLeaveType = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const data: CreateLeaveTypeDTO = req.body;

    if (!data.name) {
      res.status(400).json({ message: 'Name is required' });
      return;
    }

    const leaveType = await leaveService.createLeaveType(data, req.user);

    res.status(201).json({
      message: 'Leave type created successfully',
      data: leaveType,
    });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const updateLeaveType = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid leave type ID' });
      return;
    }

    const data: UpdateLeaveTypeDTO = req.body;
    const leaveType = await leaveService.updateLeaveType(id, data, req.user);

    res.status(200).json({
      message: 'Leave type updated successfully',
      data: leaveType,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const deleteLeaveType = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid leave type ID' });
      return;
    }

    await leaveService.deleteLeaveType(id, req.user);

    res.status(200).json({
      message: 'Leave type deleted successfully',
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

// ==========================================
// LEAVE CONTROLLERS
// ==========================================

export const listLeaves = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const query: LeaveListQuery = {
      page: parseInt(getParam(req.query.page as string)) || 1,
      limit: parseInt(getParam(req.query.limit as string)) || 10,
      employee_id: req.query.employee_id ? parseInt(getParam(req.query.employee_id as string)) : undefined,
      company_id: req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined,
      department_id: req.query.department_id ? parseInt(getParam(req.query.department_id as string)) : undefined,
      leave_type_id: req.query.leave_type_id ? parseInt(getParam(req.query.leave_type_id as string)) : undefined,
      status: getParam(req.query.status as string) || undefined,
      start_date: getParam(req.query.start_date as string) || undefined,
      end_date: getParam(req.query.end_date as string) || undefined,
      sort_by: getParam(req.query.sort_by as string) || undefined,
      sort_order: (getParam(req.query.sort_order as string) as 'asc' | 'desc') || undefined,
    };

    const result = await leaveService.listLeaves(query, req.user);

    res.status(200).json({
      message: 'Leaves retrieved successfully',
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to retrieve leaves' });
  }
};

export const getLeaveById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid leave ID' });
      return;
    }

    const leave = await leaveService.getLeaveById(id, req.user);

    res.status(200).json({
      message: 'Leave retrieved successfully',
      data: leave,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const getMyLeaves = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const query: LeaveListQuery = {
      page: parseInt(getParam(req.query.page as string)) || 1,
      limit: parseInt(getParam(req.query.limit as string)) || 10,
      leave_type_id: req.query.leave_type_id ? parseInt(getParam(req.query.leave_type_id as string)) : undefined,
      status: getParam(req.query.status as string) || undefined,
      start_date: getParam(req.query.start_date as string) || undefined,
      end_date: getParam(req.query.end_date as string) || undefined,
      sort_by: getParam(req.query.sort_by as string) || 'start_date',
      sort_order: (getParam(req.query.sort_order as string) as 'asc' | 'desc') || 'desc',
    };

    const result = await leaveService.getMyLeaves(query, req.user);

    res.status(200).json({
      message: 'Leaves retrieved successfully',
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const data: CreateLeaveDTO = req.body;

    if (!data.start_date || !data.end_date) {
      res.status(400).json({ message: 'Start date and end date are required' });
      return;
    }

    const leave = await leaveService.create(data, req.user);

    res.status(201).json({
      message: 'Leave request created successfully',
      data: leave,
    });
  } catch (error: any) {
    const status = error.message.includes('No employee profile') ? 404 :
                   error.message.includes('Insufficient') ? 400 :
                   error.message.includes('hari libur') ? 400 :
                   error.message.includes('Maximum') || error.message.includes('Minimum') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const createForEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const data: CreateLeaveForEmployeeDTO = req.body;

    if (!data.employee_id) {
      res.status(400).json({ message: 'Employee ID is required' });
      return;
    }
    if (!data.start_date || !data.end_date) {
      res.status(400).json({ message: 'Start date and end date are required' });
      return;
    }

    const leave = await leaveService.createLeaveForEmployee(data, req.user);

    res.status(201).json({
      message: 'Leave request created successfully',
      data: leave,
    });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 :
                   error.message.includes('not found') ? 404 :
                   error.message.includes('Insufficient') ||
                   error.message.includes('Maximum') ||
                   error.message.includes('Minimum') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid leave ID' });
      return;
    }

    const data: UpdateLeaveDTO = req.body;
    const leave = await leaveService.update(id, data, req.user);

    res.status(200).json({
      message: 'Leave request updated successfully',
      data: leave,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 :
                   error.message.includes('Can only') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const cancel = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid leave ID' });
      return;
    }

    const leave = await leaveService.cancel(id, req.user);

    res.status(200).json({
      message: 'Leave request cancelled successfully',
      data: leave,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Only the owner') ? 403 :
                   error.message.includes('Can only') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const approve = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid leave ID' });
      return;
    }

    const data: ApproveLeaveDTO = req.body;
    const leave = await leaveService.approve(id, data, req.user);

    res.status(200).json({
      message: 'Leave request approved successfully',
      data: leave,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 :
                   error.message.includes('Can only') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const reject = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid leave ID' });
      return;
    }

    const data: RejectLeaveDTO = req.body;

    if (!data.rejection_reason) {
      res.status(400).json({ message: 'Rejection reason is required' });
      return;
    }

    const leave = await leaveService.reject(id, data, req.user);

    res.status(200).json({
      message: 'Leave request rejected',
      data: leave,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 :
                   error.message.includes('Can only') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const getPendingApprovals = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const status = req.query.status as string | undefined;
    const leaves = await leaveService.getTeamLeaves(req.user, status);

    res.status(200).json({
      message: 'Team leaves retrieved successfully',
      data: leaves,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid leave ID' });
      return;
    }

    await leaveService.delete(id, req.user);

    res.status(200).json({
      message: 'Leave deleted successfully',
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

// ==========================================
// LEAVE BALANCE CONTROLLERS
// ==========================================

export const getLeaveBalances = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const query: LeaveBalanceQuery = {
      employee_id: req.query.employee_id ? parseInt(getParam(req.query.employee_id as string)) : undefined,
      company_id: req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined,
      department_id: req.query.department_id ? parseInt(getParam(req.query.department_id as string)) : undefined,
      year: req.query.year ? parseInt(getParam(req.query.year as string)) : undefined,
      leave_type_id: req.query.leave_type_id ? parseInt(getParam(req.query.leave_type_id as string)) : undefined,
    };

    const balances = await leaveService.getLeaveBalances(query, req.user);

    res.status(200).json({
      message: 'Leave balances retrieved successfully',
      data: balances,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyLeaveBalances = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const balances = await leaveService.getMyLeaveBalances(req.user);

    res.status(200).json({
      message: 'Leave balances retrieved successfully',
      data: balances,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const adjustLeaveBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const data: AdjustLeaveBalanceDTO = req.body;

    if (!data.employee_id || !data.leave_type_id || !data.year) {
      res.status(400).json({ message: 'Employee ID, leave type ID, and year are required' });
      return;
    }
    if (data.adjustment_days === undefined || !data.adjustment_reason) {
      res.status(400).json({ message: 'Adjustment days and reason are required' });
      return;
    }

    const balance = await leaveService.adjustLeaveBalance(data, req.user);

    res.status(200).json({
      message: 'Leave balance adjusted successfully',
      data: balance,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const allocateLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const data: AllocateLeaveDTO = req.body;

    if (!data.employee_id || !data.leave_type_id || !data.year) {
      res.status(400).json({ message: 'Employee ID, leave type ID, and year are required' });
      return;
    }
    if (data.allocated_days === undefined) {
      res.status(400).json({ message: 'Allocated days is required' });
      return;
    }

    const balance = await leaveService.allocateLeave(data, req.user);

    res.status(200).json({
      message: 'Leave allocated successfully',
      data: balance,
    });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

// ==========================================
// HOLIDAY CONTROLLERS
// ==========================================

export const listHolidays = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const query: HolidayListQuery = {
      page: parseInt(getParam(req.query.page as string)) || 1,
      limit: parseInt(getParam(req.query.limit as string)) || 50,
      company_id: req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined,
      year: req.query.year ? parseInt(getParam(req.query.year as string)) : undefined,
      type: getParam(req.query.type as string) || undefined,
      is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
    };

    const result = await leaveService.listHolidays(query, req.user);

    res.status(200).json({
      message: 'Holidays retrieved successfully',
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to retrieve holidays' });
  }
};

export const getHolidayById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid holiday ID' });
      return;
    }

    const holiday = await leaveService.getHolidayById(id, req.user);

    res.status(200).json({
      message: 'Holiday retrieved successfully',
      data: holiday,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const createHoliday = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const data: CreateHolidayDTO = req.body;

    if (!data.name || !data.date || !data.type) {
      res.status(400).json({ message: 'Name, date, and type are required' });
      return;
    }

    const holiday = await leaveService.createHoliday(data, req.user);

    res.status(201).json({
      message: 'Holiday created successfully',
      data: holiday,
    });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const updateHoliday = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid holiday ID' });
      return;
    }

    const data: UpdateHolidayDTO = req.body;
    const holiday = await leaveService.updateHoliday(id, data, req.user);

    res.status(200).json({
      message: 'Holiday updated successfully',
      data: holiday,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const deleteHoliday = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid holiday ID' });
      return;
    }

    await leaveService.deleteHoliday(id, req.user);

    res.status(200).json({
      message: 'Holiday deleted successfully',
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};
