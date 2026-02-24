import { Request, Response } from 'express';
import { DocumentService } from './document.service';
import { asyncHandler, BadRequestError } from '../../middlewares/error.middleware';

const documentService = new DocumentService();

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

// ==========================================
// DOCUMENT CONTROLLERS (Company Documents)
// ==========================================

export const listDocuments = asyncHandler(async (req: Request, res: Response) => {
  const query = {
    page: parseInt(getParam(req.query.page as string)) || 1,
    limit: parseInt(getParam(req.query.limit as string)) || 10,
    company_id: req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined,
    category_id: req.query.category_id ? parseInt(getParam(req.query.category_id as string)) : undefined,
    document_type: getParam(req.query.document_type as string) || undefined,
    status: getParam(req.query.status as string) || undefined,
    visibility: getParam(req.query.visibility as string) || undefined,
    search: getParam(req.query.search as string) || undefined,
    sort_by: getParam(req.query.sort_by as string) || undefined,
    sort_order: (getParam(req.query.sort_order as string) as 'asc' | 'desc') || undefined,
  };
  const result = await documentService.listDocuments(query, req.user!);
  res.status(200).json({ message: 'Documents retrieved successfully', ...result });
});

export const getDocumentById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid document ID');
  const document = await documentService.getDocumentById(id, req.user!);
  res.status(200).json({ message: 'Document retrieved successfully', data: document });
});

export const createDocument = asyncHandler(async (req: Request, res: Response) => {
  const document = await documentService.createDocument(req.body, req.user!);
  res.status(201).json({ message: 'Document created successfully', data: document });
});

export const updateDocument = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid document ID');
  const document = await documentService.updateDocument(id, req.body, req.user!);
  res.status(200).json({ message: 'Document updated successfully', data: document });
});

export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid document ID');
  await documentService.deleteDocument(id, req.user!);
  res.status(200).json({ message: 'Document deleted successfully' });
});

export const archiveDocument = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid document ID');
  const document = await documentService.archiveDocument(id, req.user!);
  res.status(200).json({ message: 'Document archived successfully', data: document });
});

export const verifyDocument = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid document ID');
  const document = await documentService.verifyDocument(id, req.user!);
  res.status(200).json({ message: 'Document verified successfully', data: document });
});

// ==========================================
// EMPLOYEE DOCUMENT CONTROLLERS
// ==========================================

export const listEmployeeDocuments = asyncHandler(async (req: Request, res: Response) => {
  const query = {
    page: parseInt(getParam(req.query.page as string)) || 1,
    limit: parseInt(getParam(req.query.limit as string)) || 10,
    employee_id: req.query.employee_id ? parseInt(getParam(req.query.employee_id as string)) : undefined,
    company_id: req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined,
    department_id: req.query.department_id ? parseInt(getParam(req.query.department_id as string)) : undefined,
    document_type: getParam(req.query.document_type as string) || undefined,
    is_verified: req.query.is_verified ? getParam(req.query.is_verified as string) === 'true' : undefined,
    is_expired: req.query.is_expired ? getParam(req.query.is_expired as string) === 'true' : undefined,
    expiring_within_days: req.query.expiring_within_days ? parseInt(getParam(req.query.expiring_within_days as string)) : undefined,
    search: getParam(req.query.search as string) || undefined,
    sort_by: getParam(req.query.sort_by as string) || undefined,
    sort_order: (getParam(req.query.sort_order as string) as 'asc' | 'desc') || undefined,
  };
  const result = await documentService.listEmployeeDocuments(query, req.user!);
  res.status(200).json({ message: 'Employee documents retrieved successfully', ...result });
});

export const getEmployeeDocumentById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid document ID');
  const document = await documentService.getEmployeeDocumentById(id, req.user!);
  res.status(200).json({ message: 'Document retrieved successfully', data: document });
});

export const getMyDocuments = asyncHandler(async (req: Request, res: Response) => {
  const documents = await documentService.getMyDocuments(req.user!);
  res.status(200).json({ message: 'Documents retrieved successfully', data: documents });
});

export const uploadMyDocument = asyncHandler(async (req: Request, res: Response) => {
  const data = {
    ...req.body,
    employee_id: req.user!.employee!.id,
  };
  const document = await documentService.uploadMyDocument(data, req.user!);
  res.status(201).json({ message: 'Document uploaded successfully', data: document });
});

export const deleteMyDocument = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid document ID');
  await documentService.deleteMyDocument(id, req.user!);
  res.status(200).json({ message: 'Document deleted successfully' });
});

export const createEmployeeDocument = asyncHandler(async (req: Request, res: Response) => {
  const document = await documentService.createEmployeeDocument(req.body, req.user!);
  res.status(201).json({ message: 'Document created successfully', data: document });
});

export const updateEmployeeDocument = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid document ID');
  const document = await documentService.updateEmployeeDocument(id, req.body, req.user!);
  res.status(200).json({ message: 'Document updated successfully', data: document });
});

export const deleteEmployeeDocument = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid document ID');
  await documentService.deleteEmployeeDocument(id, req.user!);
  res.status(200).json({ message: 'Document deleted successfully' });
});

export const verifyEmployeeDocument = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid document ID');
  const document = await documentService.verifyEmployeeDocument(id, req.body, req.user!);
  res.status(200).json({ message: 'Document verified successfully', data: document });
});

export const unverifyEmployeeDocument = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid document ID');
  const document = await documentService.unverifyEmployeeDocument(id, req.user!);
  res.status(200).json({ message: 'Document unverified successfully', data: document });
});

export const getExpiringDocuments = asyncHandler(async (req: Request, res: Response) => {
  const days = parseInt(getParam(req.query.days as string)) || 30;
  const companyId = req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined;
  const documents = await documentService.getExpiringDocuments(days, companyId, req.user!);
  res.status(200).json({ message: 'Expiring documents retrieved successfully', data: documents });
});

export const getExpiredDocuments = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined;
  const documents = await documentService.getExpiredDocuments(companyId, req.user!);
  res.status(200).json({ message: 'Expired documents retrieved successfully', data: documents });
});

export const getDocumentStatistics = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined;
  const stats = await documentService.getDocumentStatistics(companyId, req.user!);
  res.status(200).json({ message: 'Statistics retrieved successfully', data: stats });
});

export const checkDocumentCompleteness = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = parseInt(getParam(req.params.employeeId));
  if (isNaN(employeeId)) throw new BadRequestError('Invalid employee ID');
  const result = await documentService.checkEmployeeDocumentCompleteness(employeeId);
  res.status(200).json({ message: 'Completeness check retrieved successfully', data: result });
});

// ==========================================
// DOCUMENT CATEGORY CONTROLLERS
// ==========================================

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const query = {
    page: parseInt(getParam(req.query.page as string)) || 1,
    limit: parseInt(getParam(req.query.limit as string)) || 50,
    parent_id: req.query.parent_id ? parseInt(getParam(req.query.parent_id as string)) : undefined,
    is_active: req.query.is_active ? getParam(req.query.is_active as string) === 'true' : undefined,
    search: getParam(req.query.search as string) || undefined,
  };
  const result = await documentService.listCategories(query);
  res.status(200).json({ message: 'Categories retrieved successfully', ...result });
});

export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid category ID');
  const category = await documentService.getCategoryById(id);
  res.status(200).json({ message: 'Category retrieved successfully', data: category });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await documentService.createCategory(req.body, req.user!);
  res.status(201).json({ message: 'Category created successfully', data: category });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid category ID');
  const category = await documentService.updateCategory(id, req.body, req.user!);
  res.status(200).json({ message: 'Category updated successfully', data: category });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(getParam(req.params.id));
  if (isNaN(id)) throw new BadRequestError('Invalid category ID');
  await documentService.deleteCategory(id, req.user!);
  res.status(200).json({ message: 'Category deleted successfully' });
});
