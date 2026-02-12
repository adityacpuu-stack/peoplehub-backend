import { Router } from 'express';
import * as documentController from './document.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireHRStaffOrHigher, requireHRManagerOrHigher, requireManagerOrHigher } from '../../middlewares/role.middleware';
import { validateCompanyAccessFromQuery } from '../../middlewares/company.middleware';

const router = Router();

router.use(authenticate);

// ==========================================
// SELF-SERVICE ROUTES
// ==========================================

// Get my documents (employee's own documents)
router.get('/employee/me', documentController.getMyDocuments);

// Upload my own document (employee self-service)
router.post('/employee/me', documentController.uploadMyDocument);

// Delete my own document (employee self-service, only unverified)
router.delete('/employee/me/:id', documentController.deleteMyDocument);

// ==========================================
// DOCUMENT CATEGORY ROUTES
// ==========================================

// List categories
router.get('/categories', documentController.listCategories);

// Get category by ID
router.get('/categories/:id', documentController.getCategoryById);

// Create category (HR only)
router.post('/categories', requireHRStaffOrHigher, documentController.createCategory);

// Update category (HR only)
router.put('/categories/:id', requireHRStaffOrHigher, documentController.updateCategory);

// Delete category (HR only)
router.delete('/categories/:id', requireHRStaffOrHigher, documentController.deleteCategory);

// ==========================================
// EMPLOYEE DOCUMENT ROUTES
// ==========================================

// Get expiring documents
router.get('/employee/expiring', requireHRStaffOrHigher, documentController.getExpiringDocuments);

// Get expired documents
router.get('/employee/expired', requireHRStaffOrHigher, documentController.getExpiredDocuments);

// Get document statistics
router.get('/employee/statistics', requireHRStaffOrHigher, documentController.getDocumentStatistics);

// Check document completeness for employee
router.get('/employee/:employeeId/completeness', requireHRStaffOrHigher, documentController.checkDocumentCompleteness);

// List employee documents
router.get('/employee', requireHRStaffOrHigher, validateCompanyAccessFromQuery, documentController.listEmployeeDocuments);

// Get employee document by ID
router.get('/employee/:id', documentController.getEmployeeDocumentById);

// Create employee document (Manager+ can upload for their subordinates)
router.post('/employee', requireManagerOrHigher, documentController.createEmployeeDocument);

// Update employee document
router.put('/employee/:id', requireHRStaffOrHigher, documentController.updateEmployeeDocument);

// Verify employee document
router.post('/employee/:id/verify', requireHRStaffOrHigher, documentController.verifyEmployeeDocument);

// Unverify employee document
router.post('/employee/:id/unverify', requireHRStaffOrHigher, documentController.unverifyEmployeeDocument);

// Delete employee document
router.delete('/employee/:id', requireHRStaffOrHigher, documentController.deleteEmployeeDocument);

// ==========================================
// COMPANY DOCUMENT ROUTES
// ==========================================

// List documents
router.get('/', documentController.listDocuments);

// Get document by ID
router.get('/:id', documentController.getDocumentById);

// Create document (HR only)
router.post('/', requireHRStaffOrHigher, documentController.createDocument);

// Update document (HR only)
router.put('/:id', requireHRStaffOrHigher, documentController.updateDocument);

// Archive document (HR only)
router.post('/:id/archive', requireHRStaffOrHigher, documentController.archiveDocument);

// Verify document (HR only)
router.post('/:id/verify', requireHRStaffOrHigher, documentController.verifyDocument);

// Delete document (HR only)
router.delete('/:id', requireHRStaffOrHigher, documentController.deleteDocument);

export default router;
