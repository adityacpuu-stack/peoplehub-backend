import { Request, Response } from 'express';
import { EmployeeService } from './employee.service';
import { EmployeeListQuery, CreateEmployeeDTO, UpdateEmployeeDTO } from './employee.types';
import { asyncHandler, NotFoundError, BadRequestError } from '../../middlewares/error.middleware';

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
export const list = asyncHandler(async (req: Request, res: Response) => {
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

  const result = await employeeService.list(query, req.user!);

  res.status(200).json({
    message: 'Employees retrieved successfully',
    ...result,
  });
});

/**
 * GET /api/v1/employees/:id
 * Get employee by ID
 */
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) {
    throw new BadRequestError('Invalid employee ID');
  }

  const employee = await employeeService.getById(id, req.user!);

  res.status(200).json({
    message: 'Employee retrieved successfully',
    data: employee,
  });
});

/**
 * GET /api/v1/employees/by-employee-id/:employeeId
 * Get employee by employee_id (NIK)
 */
export const getByEmployeeId = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = getParam(req.params.employeeId);
  if (!employeeId) {
    throw new BadRequestError('Employee ID is required');
  }

  const employee = await employeeService.getByEmployeeId(employeeId, req.user!);

  res.status(200).json({
    message: 'Employee retrieved successfully',
    data: employee,
  });
});

/**
 * POST /api/v1/employees
 * Create new employee
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const data: CreateEmployeeDTO = req.body;
  const employee = await employeeService.create(data, req.user!);

  res.status(201).json({
    message: 'Employee created successfully',
    data: employee,
  });
});

/**
 * PUT /api/v1/employees/:id
 * Update employee
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) {
    throw new BadRequestError('Invalid employee ID');
  }

  const data: UpdateEmployeeDTO = req.body;
  const employee = await employeeService.update(id, data, req.user!);

  res.status(200).json({
    message: 'Employee updated successfully',
    data: employee,
  });
});

/**
 * DELETE /api/v1/employees/:id
 * Delete employee (soft delete)
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) {
    throw new BadRequestError('Invalid employee ID');
  }

  await employeeService.delete(id, req.user!);

  res.status(200).json({
    message: 'Employee deleted successfully',
  });
});

/**
 * GET /api/v1/employees/company/:companyId
 * Get employees by company
 */
export const getByCompany = asyncHandler(async (req: Request, res: Response) => {
  const companyId = parseInt(getParam(req.params.companyId));
  if (isNaN(companyId)) {
    throw new BadRequestError('Invalid company ID');
  }

  const employees = await employeeService.getByCompany(companyId, req.user!);

  res.status(200).json({
    message: 'Employees retrieved successfully',
    data: employees,
  });
});

/**
 * GET /api/v1/employees/department/:departmentId
 * Get employees by department
 */
export const getByDepartment = asyncHandler(async (req: Request, res: Response) => {
  const departmentId = parseInt(getParam(req.params.departmentId));
  if (isNaN(departmentId)) {
    throw new BadRequestError('Invalid department ID');
  }

  const employees = await employeeService.getByDepartment(departmentId, req.user!);

  res.status(200).json({
    message: 'Employees retrieved successfully',
    data: employees,
  });
});

/**
 * GET /api/v1/employees/:id/subordinates
 * Get subordinates of a manager
 */
export const getSubordinates = asyncHandler(async (req: Request, res: Response) => {
  const managerId = parseInt(getParam(req.params.id));
  if (isNaN(managerId)) {
    throw new BadRequestError('Invalid manager ID');
  }

  const employees = await employeeService.getSubordinates(managerId, req.user!);

  res.status(200).json({
    message: 'Subordinates retrieved successfully',
    data: employees,
  });
});

/**
 * GET /api/v1/employees/export
 * Export employees to Excel
 */
export const exportExcel = asyncHandler(async (req: Request, res: Response) => {
  const query: EmployeeListQuery = {
    search: getParam(req.query.search as string) || undefined,
    company_id: req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined,
    department_id: req.query.department_id ? parseInt(getParam(req.query.department_id as string)) : undefined,
    position_id: req.query.position_id ? parseInt(getParam(req.query.position_id as string)) : undefined,
    employment_status: getParam(req.query.employment_status as string) || undefined,
    employment_type: getParam(req.query.employment_type as string) || undefined,
  };

  const workbook = await employeeService.exportToExcel(query, req.user!);

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const filename = `Employee_Export_${dateStr}.xlsx`;

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=${filename}`
  );

  await workbook.xlsx.write(res);
  res.end();
});

/**
 * GET /api/v1/employees/me
 * Get current user's employee profile
 */
export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user!.employee) {
    throw new NotFoundError('Employee profile');
  }

  const employee = await employeeService.getById(req.user!.employee.id, req.user!);

  res.status(200).json({
    message: 'Profile retrieved successfully',
    data: employee,
  });
});

/**
 * PUT /api/v1/employees/me
 * Update current user's employee profile (limited fields)
 */
export const updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user!.employee) {
    throw new NotFoundError('Employee profile');
  }

  // Only allow updating certain fields for self-service
  const allowedFields = [
    'name', 'place_of_birth', 'date_of_birth', 'blood_type', 'gender', 'personal_email',
    'phone', 'mobile_number',
    // Alamat KTP
    'address', 'city', 'province', 'postal_code',
    // Alamat Domisili
    'current_address', 'current_city', 'current_province', 'current_postal_code',
    // Emergency Contact
    'emergency_contact_name', 'emergency_contact_phone',
    'emergency_contact_relationship', 'emergency_contact_address', 'avatar',
    // Identity Documents (for profile completion)
    'national_id', 'family_card_number', 'npwp_number',
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

  const employee = await employeeService.updateMyProfile(req.user!.employee.id, data, req.user!);

  res.status(200).json({
    message: 'Profile updated successfully',
    data: employee,
  });
});

/**
 * GET /api/v1/employees/next-id/:companyId
 * Get the next employee ID for a company
 */
export const getNextEmployeeId = asyncHandler(async (req: Request, res: Response) => {
  const companyId = parseInt(getParam(req.params.companyId));
  if (isNaN(companyId)) {
    throw new BadRequestError('Invalid company ID');
  }

  const nextId = await employeeService.generateEmployeeId(companyId);

  res.status(200).json({
    message: 'Next employee ID generated successfully',
    data: { employee_id: nextId },
  });
});

/**
 * GET /api/v1/employees/leadership-team
 * Get leadership team - employees who have direct reports
 * Query params:
 *   - company_id: Optional. Filter by specific company
 */
export const getLeadershipTeam = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.query.company_id ? Number(req.query.company_id) : undefined;
  const leaders = await employeeService.getLeadershipTeam(req.user!, companyId);

  res.status(200).json({
    message: 'Leadership team retrieved successfully',
    data: leaders,
  });
});
