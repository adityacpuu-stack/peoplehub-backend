import { Request, Response } from 'express';
import { DocumentService } from './document.service';
import {
  DocumentListQuery,
  EmployeeDocumentListQuery,
  DocumentCategoryListQuery,
  CreateDocumentDTO,
  UpdateDocumentDTO,
  CreateEmployeeDocumentDTO,
  UpdateEmployeeDocumentDTO,
  VerifyDocumentDTO,
  CreateDocumentCategoryDTO,
  UpdateDocumentCategoryDTO,
} from './document.types';

const documentService = new DocumentService();

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

// ==========================================
// DOCUMENT CONTROLLERS (Company Documents)
// ==========================================

export const listDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }

    const query: DocumentListQuery = {
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

    const result = await documentService.listDocuments(query, req.user);
    res.status(200).json({ message: 'Documents retrieved successfully', ...result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getDocumentById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid document ID' }); return; }

    const document = await documentService.getDocumentById(id, req.user);
    res.status(200).json({ message: 'Document retrieved successfully', data: document });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const createDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const data: CreateDocumentDTO = req.body;

    if (!data.title || !data.file_path) {
      res.status(400).json({ message: 'Title and file path are required' }); return;
    }

    const document = await documentService.createDocument(data, req.user);
    res.status(201).json({ message: 'Document created successfully', data: document });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const updateDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid document ID' }); return; }

    const data: UpdateDocumentDTO = req.body;
    const document = await documentService.updateDocument(id, data, req.user);
    res.status(200).json({ message: 'Document updated successfully', data: document });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid document ID' }); return; }

    await documentService.deleteDocument(id, req.user);
    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const archiveDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid document ID' }); return; }

    const document = await documentService.archiveDocument(id, req.user);
    res.status(200).json({ message: 'Document archived successfully', data: document });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const verifyDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid document ID' }); return; }

    const document = await documentService.verifyDocument(id, req.user);
    res.status(200).json({ message: 'Document verified successfully', data: document });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Only HR') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

// ==========================================
// EMPLOYEE DOCUMENT CONTROLLERS
// ==========================================

export const listEmployeeDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }

    const query: EmployeeDocumentListQuery = {
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

    const result = await documentService.listEmployeeDocuments(query, req.user);
    res.status(200).json({ message: 'Employee documents retrieved successfully', ...result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getEmployeeDocumentById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid document ID' }); return; }

    const document = await documentService.getEmployeeDocumentById(id, req.user);
    res.status(200).json({ message: 'Document retrieved successfully', data: document });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const getMyDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const documents = await documentService.getMyDocuments(req.user);
    res.status(200).json({ message: 'Documents retrieved successfully', data: documents });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadMyDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    if (!req.user.employee) {
      res.status(400).json({ message: 'No employee profile found' }); return;
    }

    const data: CreateEmployeeDocumentDTO = {
      ...req.body,
      employee_id: req.user.employee.id, // Force to own employee ID
    };

    if (!data.document_name || !data.document_type || !data.file_path) {
      res.status(400).json({ message: 'Document name, type, and file path are required' }); return;
    }

    const document = await documentService.uploadMyDocument(data, req.user);
    res.status(201).json({ message: 'Document uploaded successfully', data: document });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMyDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    if (!req.user.employee) {
      res.status(400).json({ message: 'No employee profile found' }); return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid document ID' }); return; }

    await documentService.deleteMyDocument(id, req.user);
    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Cannot delete') ? 400 :
                   error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const createEmployeeDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const data: CreateEmployeeDocumentDTO = req.body;

    if (!data.employee_id || !data.document_name || !data.document_type || !data.file_path) {
      res.status(400).json({ message: 'Employee ID, document name, type, and file path are required' }); return;
    }

    const document = await documentService.createEmployeeDocument(data, req.user);
    res.status(201).json({ message: 'Document created successfully', data: document });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const updateEmployeeDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid document ID' }); return; }

    const data: UpdateEmployeeDocumentDTO = req.body;
    const document = await documentService.updateEmployeeDocument(id, data, req.user);
    res.status(200).json({ message: 'Document updated successfully', data: document });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const deleteEmployeeDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid document ID' }); return; }

    await documentService.deleteEmployeeDocument(id, req.user);
    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const verifyEmployeeDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid document ID' }); return; }

    const data: VerifyDocumentDTO = req.body;
    const document = await documentService.verifyEmployeeDocument(id, data, req.user);
    res.status(200).json({ message: 'Document verified successfully', data: document });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Only HR') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const unverifyEmployeeDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid document ID' }); return; }

    const document = await documentService.unverifyEmployeeDocument(id, req.user);
    res.status(200).json({ message: 'Document unverified successfully', data: document });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Only HR') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const getExpiringDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const days = parseInt(getParam(req.query.days as string)) || 30;
    const companyId = req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined;

    const documents = await documentService.getExpiringDocuments(days, companyId, req.user);
    res.status(200).json({ message: 'Expiring documents retrieved successfully', data: documents });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const getExpiredDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const companyId = req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined;

    const documents = await documentService.getExpiredDocuments(companyId, req.user);
    res.status(200).json({ message: 'Expired documents retrieved successfully', data: documents });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const getDocumentStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const companyId = req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined;

    const stats = await documentService.getDocumentStatistics(companyId, req.user);
    res.status(200).json({ message: 'Statistics retrieved successfully', data: stats });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const checkDocumentCompleteness = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const employeeId = parseInt(getParam(req.params.employeeId));
    if (isNaN(employeeId)) { res.status(400).json({ message: 'Invalid employee ID' }); return; }

    const result = await documentService.checkEmployeeDocumentCompleteness(employeeId);
    res.status(200).json({ message: 'Completeness check retrieved successfully', data: result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// DOCUMENT CATEGORY CONTROLLERS
// ==========================================

export const listCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }

    const query: DocumentCategoryListQuery = {
      page: parseInt(getParam(req.query.page as string)) || 1,
      limit: parseInt(getParam(req.query.limit as string)) || 50,
      parent_id: req.query.parent_id ? parseInt(getParam(req.query.parent_id as string)) : undefined,
      is_active: req.query.is_active ? getParam(req.query.is_active as string) === 'true' : undefined,
      search: getParam(req.query.search as string) || undefined,
    };

    const result = await documentService.listCategories(query);
    res.status(200).json({ message: 'Categories retrieved successfully', ...result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid category ID' }); return; }

    const category = await documentService.getCategoryById(id);
    res.status(200).json({ message: 'Category retrieved successfully', data: category });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const data: CreateDocumentCategoryDTO = req.body;

    if (!data.name) {
      res.status(400).json({ message: 'Category name is required' }); return;
    }

    const category = await documentService.createCategory(data, req.user);
    res.status(201).json({ message: 'Category created successfully', data: category });
  } catch (error: any) {
    const status = error.message.includes('Only HR') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid category ID' }); return; }

    const data: UpdateDocumentCategoryDTO = req.body;
    const category = await documentService.updateCategory(id, data, req.user);
    res.status(200).json({ message: 'Category updated successfully', data: category });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : error.message.includes('Only HR') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ message: 'Not authenticated' }); return; }
    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) { res.status(400).json({ message: 'Invalid category ID' }); return; }

    await documentService.deleteCategory(id, req.user);
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Only HR') ? 403 :
                   error.message.includes('Cannot delete') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};
