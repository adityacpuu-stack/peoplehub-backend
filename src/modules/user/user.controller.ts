import { Request, Response } from 'express';
import { userService } from './user.service';
import { asyncHandler } from '../../middlewares/error.middleware';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = {
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    search: req.query.search as string,
    is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
    role_id: req.query.role_id ? parseInt(req.query.role_id as string) : undefined,
    company_id: req.query.company_id ? parseInt(req.query.company_id as string) : undefined,
  };
  const result = await userService.list(query, req.user!);
  res.json({ message: 'Users retrieved successfully', ...result });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const user = await userService.getById(id, req.user!);
  res.json({ message: 'User retrieved successfully', data: user });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.create(req.body, req.user!);
  res.status(201).json({ message: 'User created successfully', data: user });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const user = await userService.update(id, req.body, req.user!);
  res.json({ message: 'User updated successfully', data: user });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const result = await userService.delete(id, req.user!);
  res.json({ message: 'User deleted successfully', ...result });
});

export const toggleStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const user = await userService.toggleStatus(id, req.user!);
  res.json({ message: 'User status updated successfully', data: user });
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await userService.getStats(req.user!);
  res.json({ message: 'Statistics retrieved successfully', data: stats });
});

export const getMyPreferences = asyncHandler(async (req: Request, res: Response) => {
  const preferences = await userService.getPreferences(req.user!.id);
  res.json({ success: true, data: preferences });
});

export const updateMyPreferences = asyncHandler(async (req: Request, res: Response) => {
  const preferences = await userService.updatePreferences(req.user!.id, req.body);
  res.json({ success: true, data: preferences });
});
