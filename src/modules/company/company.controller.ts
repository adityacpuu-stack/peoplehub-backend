import { Request, Response } from 'express';
import { CompanyService } from './company.service';
import { asyncHandler } from '../../middlewares/error.middleware';

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

const companyService = new CompanyService();

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await companyService.list(req.query, req.user!);
  res.json({ message: 'Companies retrieved successfully', ...result });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  const result = await companyService.getById(id, req.user!);
  res.json({ message: 'Company retrieved successfully', data: result });
});

export const getHierarchy = asyncHandler(async (req: Request, res: Response) => {
  const result = await companyService.getHierarchy(req.user!);
  res.json({ message: 'Company hierarchy retrieved successfully', data: result });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await companyService.create(req.body, req.user!);
  res.status(201).json({ message: 'Company created successfully', data: result });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  const result = await companyService.update(id, req.body, req.user!);
  res.json({ message: 'Company updated successfully', data: result });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  const result = await companyService.delete(id, req.user!);
  res.json({ message: 'Company deactivated successfully', data: result });
});

export const getStatistics = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  const result = await companyService.getStatistics(id, req.user!);
  res.json({ message: 'Statistics retrieved successfully', data: result });
});

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  const result = await companyService.getSettings(id, req.user!);
  res.json({ message: 'Settings retrieved successfully', data: result });
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  const result = await companyService.updateSettings(id, req.body, req.user!);
  res.json({ message: 'Settings updated successfully', data: result });
});

export const listWithFeatureToggles = asyncHandler(async (req: Request, res: Response) => {
  const result = await companyService.listWithFeatureToggles(req.user!);
  res.json({ message: 'Feature toggles retrieved successfully', data: result });
});

export const getFeatureToggles = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  const result = await companyService.getFeatureToggles(id, req.user!);
  res.json({ message: 'Feature toggles retrieved successfully', data: result });
});

export const updateFeatureToggles = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  const result = await companyService.updateFeatureToggles(id, req.body, req.user!);
  res.json({ message: 'Feature toggles updated successfully', data: result });
});
