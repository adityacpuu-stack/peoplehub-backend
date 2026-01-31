import { Request, Response } from 'express';
import { EmployeeService } from './employee.service';
import { EmployeeListQuery, CreateEmployeeDTO, UpdateEmployeeDTO } from './employee.types';

const employeeService = new EmployeeService();

// Helper to safely get param as string
const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

/**
 * GET /api/v1/employees
 * Get paginated list of employees with filters
 */
export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const query: EmployeeListQuery = {
      page: parseInt(getParam(req.query.page as string)) || 1,
      limit: parseInt(getParam(req.query.limit as string)) || 10,
      search: getParam(req.query.search as string) || undefined,
      company_id: req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined,
      department_id: req.query.department_id ? parseInt(getParam(req.query.department_id as string)) : undefined,
      position_id: req.query.position_id ? parseInt(getParam(req.query.position_id as string)) : undefined,
      employment_status: getParam(req.query.employment_status as string) || undefined,
      employment_type: getParam(req.query.employment_type as string) || undefined,
      sort_by: getParam(req.query.sort_by as string) || undefined,
      sort_order: (getParam(req.query.sort_order as string) as 'asc' | 'desc') || undefined,
    };

    const result = await employeeService.list(query, req.user);

    res.status(200).json({
      message: 'Employees retrieved successfully',
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to retrieve employees' });
  }
};

/**
 * GET /api/v1/employees/:id
 * Get employee by ID
 */
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid employee ID' });
      return;
    }

    const employee = await employeeService.getById(id, req.user);

    res.status(200).json({
      message: 'Employee retrieved successfully',
      data: employee,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * GET /api/v1/employees/by-employee-id/:employeeId
 * Get employee by employee_id (NIK)
 */
export const getByEmployeeId = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const employeeId = getParam(req.params.employeeId);
    if (!employeeId) {
      res.status(400).json({ message: 'Employee ID is required' });
      return;
    }

    const employee = await employeeService.getByEmployeeId(employeeId, req.user);

    res.status(200).json({
      message: 'Employee retrieved successfully',
      data: employee,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * POST /api/v1/employees
 * Create new employee
 */
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const data: CreateEmployeeDTO = req.body;

    // Validate required fields
    if (!data.name) {
      res.status(400).json({ message: 'Name is required' });
      return;
    }

    const employee = await employeeService.create(data, req.user);

    res.status(201).json({
      message: 'Employee created successfully',
      data: employee,
    });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 :
                   error.message.includes('already exists') ? 409 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * PUT /api/v1/employees/:id
 * Update employee
 */
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid employee ID' });
      return;
    }

    const data: UpdateEmployeeDTO = req.body;
    const employee = await employeeService.update(id, data, req.user);

    res.status(200).json({
      message: 'Employee updated successfully',
      data: employee,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * DELETE /api/v1/employees/:id
 * Delete employee (soft delete)
 */
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid employee ID' });
      return;
    }

    await employeeService.delete(id, req.user);

    res.status(200).json({
      message: 'Employee deleted successfully',
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * GET /api/v1/employees/company/:companyId
 * Get employees by company
 */
export const getByCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const companyId = parseInt(getParam(req.params.companyId));
    if (isNaN(companyId)) {
      res.status(400).json({ message: 'Invalid company ID' });
      return;
    }

    const employees = await employeeService.getByCompany(companyId, req.user);

    res.status(200).json({
      message: 'Employees retrieved successfully',
      data: employees,
    });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * GET /api/v1/employees/department/:departmentId
 * Get employees by department
 */
export const getByDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const departmentId = parseInt(getParam(req.params.departmentId));
    if (isNaN(departmentId)) {
      res.status(400).json({ message: 'Invalid department ID' });
      return;
    }

    const employees = await employeeService.getByDepartment(departmentId, req.user);

    res.status(200).json({
      message: 'Employees retrieved successfully',
      data: employees,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/v1/employees/:id/subordinates
 * Get subordinates of a manager
 */
export const getSubordinates = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const managerId = parseInt(getParam(req.params.id));
    if (isNaN(managerId)) {
      res.status(400).json({ message: 'Invalid manager ID' });
      return;
    }

    const employees = await employeeService.getSubordinates(managerId, req.user);

    res.status(200).json({
      message: 'Subordinates retrieved successfully',
      data: employees,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/v1/employees/me
 * Get current user's employee profile
 */
export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    if (!req.user.employee) {
      res.status(404).json({ message: 'Employee profile not found' });
      return;
    }

    const employee = await employeeService.getById(req.user.employee.id, req.user);

    res.status(200).json({
      message: 'Profile retrieved successfully',
      data: employee,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PUT /api/v1/employees/me
 * Update current user's employee profile (limited fields)
 */
export const updateMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    if (!req.user.employee) {
      res.status(404).json({ message: 'Employee profile not found' });
      return;
    }

    // Only allow updating certain fields for self-service
    const allowedFields = [
      'phone', 'mobile_number',
      // Alamat KTP
      'address', 'city', 'province', 'postal_code',
      // Alamat Domisili
      'current_address', 'current_city', 'current_province', 'current_postal_code',
      // Emergency Contact
      'emergency_contact_name', 'emergency_contact_phone',
      'emergency_contact_relationship', 'emergency_contact_address', 'avatar',
      // Identity Documents (for profile completion)
      'national_id', 'npwp_number',
      // Bank Information (for profile completion)
      'bank_name', 'bank_account_number', 'bank_account_holder',
      // Education fields
      'last_education', 'education_major', 'education_institution', 'graduation_year',
      // Family fields
      'spouse_name', 'children_count', 'number_of_dependents',
    ];

    const data: UpdateEmployeeDTO = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        (data as any)[field] = req.body[field];
      }
    }

    const employee = await employeeService.updateMyProfile(req.user.employee.id, data, req.user);

    res.status(200).json({
      message: 'Profile updated successfully',
      data: employee,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/v1/employees/next-id/:companyId
 * Get the next employee ID for a company
 */
export const getNextEmployeeId = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const companyId = parseInt(getParam(req.params.companyId));
    if (isNaN(companyId)) {
      res.status(400).json({ message: 'Invalid company ID' });
      return;
    }

    const nextId = await employeeService.generateEmployeeId(companyId);

    res.status(200).json({
      message: 'Next employee ID generated successfully',
      data: { employee_id: nextId },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/v1/employees/leadership-team
 * Get leadership team - employees who have direct reports
 * Query params:
 *   - company_id: Optional. Filter by specific company
 */
export const getLeadershipTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const companyId = req.query.company_id ? Number(req.query.company_id) : undefined;
    const leaders = await employeeService.getLeadershipTeam(req.user, companyId);

    res.status(200).json({
      message: 'Leadership team retrieved successfully',
      data: leaders,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
