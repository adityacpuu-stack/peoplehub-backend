import { Request, Response } from 'express';
import { DepartmentService } from './department.service';
import { asyncHandler, BadRequestError } from '../../middlewares/error.middleware';

const departmentService = new DepartmentService();

// Helper to safely get param as string (Express 5 returns string | string[])
const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

/**
 * GET /api/v1/departments
 * Get paginated list of departments with filters
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = {
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    search: (req.query.search as string) || undefined,
    company_id: req.query.company_id ? parseInt(req.query.company_id as string) : undefined,
    parent_id: req.query.parent_id ? parseInt(req.query.parent_id as string) : undefined,
    status: (req.query.status as string) || undefined,
    sort_by: (req.query.sort_by as string) || undefined,
    sort_order: (req.query.sort_order as string as 'asc' | 'desc') || undefined,
  };
  const result = await departmentService.list(query, req.user!);
  res.status(200).json({ message: 'Departments retrieved successfully', ...result });
});

/**
 * GET /api/v1/departments/:id
 * Get department by ID
 */
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid department ID');
  const department = await departmentService.getById(id, req.user!);
  res.status(200).json({ message: 'Department retrieved successfully', data: department });
});

/**
 * POST /api/v1/departments
 * Create new department
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const department = await departmentService.create(req.body, req.user!);
  res.status(201).json({ message: 'Department created successfully', data: department });
});

/**
 * PUT /api/v1/departments/:id
 * Update department
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid department ID');
  const department = await departmentService.update(id, req.body, req.user!);
  res.status(200).json({ message: 'Department updated successfully', data: department });
});

/**
 * DELETE /api/v1/departments/:id
 * Delete department (soft delete)
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid department ID');
  await departmentService.delete(id, req.user!);
  res.status(200).json({ message: 'Department deleted successfully' });
});

/**
 * GET /api/v1/departments/company/:companyId
 * Get departments by company
 */
export const getByCompany = asyncHandler(async (req: Request, res: Response) => {
  const companyId = parseInt(getParam(req.params.companyId));
  if (isNaN(companyId)) throw new BadRequestError('Invalid company ID');
  const departments = await departmentService.getByCompany(companyId, req.user!);
  res.status(200).json({ message: 'Departments retrieved successfully', data: departments });
});

/**
 * GET /api/v1/departments/company/:companyId/hierarchy
 * Get department hierarchy (tree structure)
 */
export const getHierarchy = asyncHandler(async (req: Request, res: Response) => {
  const companyId = parseInt(getParam(req.params.companyId));
  if (isNaN(companyId)) throw new BadRequestError('Invalid company ID');
  const hierarchy = await departmentService.getHierarchy(companyId, req.user!);
  res.status(200).json({ message: 'Department hierarchy retrieved successfully', data: hierarchy });
});
