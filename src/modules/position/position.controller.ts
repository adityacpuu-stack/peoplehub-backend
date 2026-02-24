import { Request, Response } from 'express';
import { PositionService } from './position.service';
import { asyncHandler, BadRequestError } from '../../middlewares/error.middleware';

const positionService = new PositionService();

// Helper to safely get param as string
const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = {
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    search: (req.query.search as string) || undefined,
    company_id: req.query.company_id ? parseInt(req.query.company_id as string) : undefined,
    department_id: req.query.department_id ? parseInt(req.query.department_id as string) : undefined,
    level: req.query.level ? parseInt(req.query.level as string) : undefined,
    status: (req.query.status as string) || undefined,
    sort_by: (req.query.sort_by as string) || undefined,
    sort_order: (req.query.sort_order as string as 'asc' | 'desc') || undefined,
  };
  const result = await positionService.list(query, req.user!);
  res.status(200).json({ message: 'Positions retrieved successfully', ...result });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid position ID');
  const position = await positionService.getById(id, req.user!);
  res.status(200).json({ message: 'Position retrieved successfully', data: position });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const position = await positionService.create(req.body, req.user!);
  res.status(201).json({ message: 'Position created successfully', data: position });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid position ID');
  const position = await positionService.update(id, req.body, req.user!);
  res.status(200).json({ message: 'Position updated successfully', data: position });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid position ID');
  await positionService.delete(id, req.user!);
  res.status(200).json({ message: 'Position deleted successfully' });
});

export const getByCompany = asyncHandler(async (req: Request, res: Response) => {
  const companyId = parseInt(getParam(req.params.companyId));
  if (isNaN(companyId)) throw new BadRequestError('Invalid company ID');
  const positions = await positionService.getByCompany(companyId, req.user!);
  res.status(200).json({ message: 'Positions retrieved successfully', data: positions });
});

export const getByDepartment = asyncHandler(async (req: Request, res: Response) => {
  const departmentId = parseInt(getParam(req.params.departmentId));
  if (isNaN(departmentId)) throw new BadRequestError('Invalid department ID');
  const positions = await positionService.getByDepartment(departmentId, req.user!);
  res.status(200).json({ message: 'Positions retrieved successfully', data: positions });
});
