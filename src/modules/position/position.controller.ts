import { Request, Response } from 'express';
import { PositionService } from './position.service';
import { PositionListQuery, CreatePositionDTO, UpdatePositionDTO } from './position.types';

const positionService = new PositionService();

// Helper to safely get param as string
const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

/**
 * GET /api/v1/positions
 * Get paginated list of positions with filters
 */
export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const query: PositionListQuery = {
      page: parseInt(getParam(req.query.page as string)) || 1,
      limit: parseInt(getParam(req.query.limit as string)) || 10,
      search: getParam(req.query.search as string) || undefined,
      company_id: req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined,
      department_id: req.query.department_id ? parseInt(getParam(req.query.department_id as string)) : undefined,
      level: req.query.level ? parseInt(getParam(req.query.level as string)) : undefined,
      status: getParam(req.query.status as string) || undefined,
      sort_by: getParam(req.query.sort_by as string) || undefined,
      sort_order: (getParam(req.query.sort_order as string) as 'asc' | 'desc') || undefined,
    };

    const result = await positionService.list(query, req.user);

    res.status(200).json({
      message: 'Positions retrieved successfully',
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to retrieve positions' });
  }
};

/**
 * GET /api/v1/positions/:id
 * Get position by ID
 */
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid position ID' });
      return;
    }

    const position = await positionService.getById(id, req.user);

    res.status(200).json({
      message: 'Position retrieved successfully',
      data: position,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * POST /api/v1/positions
 * Create new position
 */
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const data: CreatePositionDTO = req.body;

    // Validate required fields
    if (!data.name) {
      res.status(400).json({ message: 'Name is required' });
      return;
    }
    if (!data.company_id) {
      res.status(400).json({ message: 'Company ID is required' });
      return;
    }

    const position = await positionService.create(data, req.user);

    res.status(201).json({
      message: 'Position created successfully',
      data: position,
    });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 :
                   error.message.includes('already exists') ? 409 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * PUT /api/v1/positions/:id
 * Update position
 */
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid position ID' });
      return;
    }

    const data: UpdatePositionDTO = req.body;
    const position = await positionService.update(id, data, req.user);

    res.status(200).json({
      message: 'Position updated successfully',
      data: position,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 :
                   error.message.includes('already exists') ? 409 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * DELETE /api/v1/positions/:id
 * Delete position (soft delete)
 */
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid position ID' });
      return;
    }

    await positionService.delete(id, req.user);

    res.status(200).json({
      message: 'Position deleted successfully',
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 :
                   error.message.includes('Cannot delete') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * GET /api/v1/positions/company/:companyId
 * Get positions by company
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

    const positions = await positionService.getByCompany(companyId, req.user);

    res.status(200).json({
      message: 'Positions retrieved successfully',
      data: positions,
    });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

/**
 * GET /api/v1/positions/department/:departmentId
 * Get positions by department
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

    const positions = await positionService.getByDepartment(departmentId, req.user);

    res.status(200).json({
      message: 'Positions retrieved successfully',
      data: positions,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};
