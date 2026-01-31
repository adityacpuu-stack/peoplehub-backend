import { Request, Response } from 'express';
import { AttendanceService } from './attendance.service';
import {
  AttendanceListQuery,
  CheckInDTO,
  CheckOutDTO,
  CreateAttendanceDTO,
  UpdateAttendanceDTO,
} from './attendance.types';

const attendanceService = new AttendanceService();

// Helper to safely get param as string
const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

/**
 * GET /api/v1/attendance
 * Get paginated list of attendance records
 */
export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const query: AttendanceListQuery = {
      page: parseInt(getParam(req.query.page as string)) || 1,
      limit: parseInt(getParam(req.query.limit as string)) || 10,
      employee_id: req.query.employee_id ? parseInt(getParam(req.query.employee_id as string)) : undefined,
      company_id: req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined,
      department_id: req.query.department_id ? parseInt(getParam(req.query.department_id as string)) : undefined,
      date: getParam(req.query.date as string) || undefined,
      start_date: getParam(req.query.start_date as string) || undefined,
      end_date: getParam(req.query.end_date as string) || undefined,
      status: getParam(req.query.status as string) || undefined,
      sort_by: getParam(req.query.sort_by as string) || undefined,
      sort_order: (getParam(req.query.sort_order as string) as 'asc' | 'desc') || undefined,
    };

    const result = await attendanceService.list(query, req.user);

    res.status(200).json({
      message: 'Attendance records retrieved successfully',
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to retrieve attendance records' });
  }
};

/**
 * GET /api/v1/attendance/:id
 * Get attendance by ID
 */
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid attendance ID' });
      return;
    }

    const attendance = await attendanceService.getById(id, req.user);

    res.status(200).json({
      message: 'Attendance record retrieved successfully',
      data: attendance,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * GET /api/v1/attendance/me/today
 * Get current user's today attendance
 */
export const getMyToday = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const attendance = await attendanceService.getMyToday(req.user);

    res.status(200).json({
      message: attendance ? 'Today\'s attendance retrieved' : 'No attendance record for today',
      data: attendance,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/v1/attendance/me/history
 * Get current user's attendance history
 */
export const getMyHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const query: AttendanceListQuery = {
      page: parseInt(getParam(req.query.page as string)) || 1,
      limit: parseInt(getParam(req.query.limit as string)) || 10,
      start_date: getParam(req.query.start_date as string) || undefined,
      end_date: getParam(req.query.end_date as string) || undefined,
      status: getParam(req.query.status as string) || undefined,
      sort_by: getParam(req.query.sort_by as string) || 'date',
      sort_order: (getParam(req.query.sort_order as string) as 'asc' | 'desc') || 'desc',
    };

    const result = await attendanceService.getMyHistory(query, req.user);

    res.status(200).json({
      message: 'Attendance history retrieved successfully',
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/v1/attendance/check-in
 * Check-in for current user
 */
export const checkIn = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const data: CheckInDTO = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const attendance = await attendanceService.checkIn(data, req.user, ipAddress);

    res.status(200).json({
      message: 'Check-in successful',
      data: attendance,
    });
  } catch (error: any) {
    const status = error.message.includes('Already checked in') ? 400 :
                   error.message.includes('No employee profile') ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * POST /api/v1/attendance/check-out
 * Check-out for current user
 */
export const checkOut = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const data: CheckOutDTO = req.body;

    const attendance = await attendanceService.checkOut(data, req.user);

    res.status(200).json({
      message: 'Check-out successful',
      data: attendance,
    });
  } catch (error: any) {
    const status = error.message.includes('Already checked out') ? 400 :
                   error.message.includes('No check-in') ? 400 :
                   error.message.includes('Must check-in') ? 400 :
                   error.message.includes('No employee profile') ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * POST /api/v1/attendance/break/start
 * Start break for current user
 */
export const startBreak = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const attendance = await attendanceService.startBreak(req.user);

    res.status(200).json({
      message: 'Break started',
      data: attendance,
    });
  } catch (error: any) {
    const status = error.message.includes('already started') ? 400 :
                   error.message.includes('Must check-in') ? 400 :
                   error.message.includes('after check-out') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * POST /api/v1/attendance/break/end
 * End break for current user
 */
export const endBreak = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const attendance = await attendanceService.endBreak(req.user);

    res.status(200).json({
      message: 'Break ended',
      data: attendance,
    });
  } catch (error: any) {
    const status = error.message.includes('No break started') ? 400 :
                   error.message.includes('already ended') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * POST /api/v1/attendance
 * Create manual attendance (HR only)
 */
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const data: CreateAttendanceDTO = req.body;

    if (!data.employee_id) {
      res.status(400).json({ message: 'Employee ID is required' });
      return;
    }
    if (!data.date) {
      res.status(400).json({ message: 'Date is required' });
      return;
    }

    const attendance = await attendanceService.create(data, req.user);

    res.status(201).json({
      message: 'Attendance record created successfully',
      data: attendance,
    });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 :
                   error.message.includes('already exists') ? 409 :
                   error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * PUT /api/v1/attendance/:id
 * Update attendance (HR only)
 */
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid attendance ID' });
      return;
    }

    const data: UpdateAttendanceDTO = req.body;
    const attendance = await attendanceService.update(id, data, req.user);

    res.status(200).json({
      message: 'Attendance record updated successfully',
      data: attendance,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * DELETE /api/v1/attendance/:id
 * Delete attendance (HR only)
 */
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid attendance ID' });
      return;
    }

    await attendanceService.delete(id, req.user);

    res.status(200).json({
      message: 'Attendance record deleted successfully',
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * GET /api/v1/attendance/summary/:employeeId
 * Get attendance summary for an employee
 */
export const getSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const employeeId = parseInt(getParam(req.params.employeeId));
    if (isNaN(employeeId)) {
      res.status(400).json({ message: 'Invalid employee ID' });
      return;
    }

    const startDate = getParam(req.query.start_date as string);
    const endDate = getParam(req.query.end_date as string);

    if (!startDate || !endDate) {
      res.status(400).json({ message: 'start_date and end_date are required' });
      return;
    }

    const summary = await attendanceService.getSummary(employeeId, startDate, endDate, req.user);

    res.status(200).json({
      message: 'Attendance summary retrieved successfully',
      data: summary,
    });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * GET /api/v1/attendance/me/summary
 * Get current user's attendance summary
 */
export const getMySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    if (!req.user.employee) {
      res.status(404).json({ message: 'No employee profile found' });
      return;
    }

    const startDate = getParam(req.query.start_date as string);
    const endDate = getParam(req.query.end_date as string);

    if (!startDate || !endDate) {
      res.status(400).json({ message: 'start_date and end_date are required' });
      return;
    }

    const summary = await attendanceService.getSummary(req.user.employee.id, startDate, endDate, req.user);

    res.status(200).json({
      message: 'Attendance summary retrieved successfully',
      data: summary,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/v1/attendance/team
 * Get team attendance for a manager
 */
export const getTeamAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const date = getParam(req.query.date as string) || new Date().toISOString().split('T')[0];

    const result = await attendanceService.getTeamAttendance(date, req.user);

    res.status(200).json({
      message: 'Team attendance retrieved successfully',
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
