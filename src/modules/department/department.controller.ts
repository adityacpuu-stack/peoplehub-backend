import { Request, Response } from 'express';
import { DepartmentService } from './department.service';
import { DepartmentListQuery, CreateDepartmentDTO, UpdateDepartmentDTO } from './department.types';

const departmentService = new DepartmentService();

// Helper to safely get param as string
const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

/**
 * GET /api/v1/departments
 * Get paginated list of departments with filters
 */
export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const query: DepartmentListQuery = {
      page: parseInt(getParam(req.query.page as string)) || 1,
      limit: parseInt(getParam(req.query.limit as string)) || 10,
      search: getParam(req.query.search as string) || undefined,
      company_id: req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined,
      parent_id: req.query.parent_id ? parseInt(getParam(req.query.parent_id as string)) : undefined,
      status: getParam(req.query.status as string) || undefined,
      sort_by: getParam(req.query.sort_by as string) || undefined,
      sort_order: (getParam(req.query.sort_order as string) as 'asc' | 'desc') || undefined,
    };

    const result = await departmentService.list(query, req.user);

    res.status(200).json({
      message: 'Departments retrieved successfully',
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to retrieve departments' });
  }
};

/**
 * GET /api/v1/departments/:id
 * Get department by ID
 */
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid department ID' });
      return;
    }

    const department = await departmentService.getById(id, req.user);

    res.status(200).json({
      message: 'Department retrieved successfully',
      data: department,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * POST /api/v1/departments
 * Create new department
 */
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const data: CreateDepartmentDTO = req.body;

    // Validate required fields
    if (!data.name) {
      res.status(400).json({ message: 'Name is required' });
      return;
    }
    // Note: company_id is now optional since departments are global

    const department = await departmentService.create(data, req.user);

    res.status(201).json({
      message: 'Department created successfully',
      data: department,
    });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 :
                   error.message.includes('already exists') ? 409 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * PUT /api/v1/departments/:id
 * Update department
 */
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid department ID' });
      return;
    }

    const data: UpdateDepartmentDTO = req.body;
    const department = await departmentService.update(id, data, req.user);

    res.status(200).json({
      message: 'Department updated successfully',
      data: department,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 :
                   error.message.includes('already exists') ? 409 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * DELETE /api/v1/departments/:id
 * Delete department (soft delete)
 */
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid department ID' });
      return;
    }

    await departmentService.delete(id, req.user);

    res.status(200).json({
      message: 'Department deleted successfully',
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 :
                   error.message.includes('Cannot delete') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * GET /api/v1/departments/company/:companyId
 * Get departments by company
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

    const departments = await departmentService.getByCompany(companyId, req.user);

    res.status(200).json({
      message: 'Departments retrieved successfully',
      data: departments,
    });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * GET /api/v1/departments/company/:companyId/hierarchy
 * Get department hierarchy (tree structure)
 */
export const getHierarchy = async (req: Request, res: Response): Promise<void> => {
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

    const hierarchy = await departmentService.getHierarchy(companyId, req.user);

    res.status(200).json({
      message: 'Department hierarchy retrieved successfully',
      data: hierarchy,
    });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};
