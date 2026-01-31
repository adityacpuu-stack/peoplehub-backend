import { Router } from 'express';
import { AttendanceSettingController } from './attendance-setting.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const attendanceSettingController = new AttendanceSettingController();

// All routes require authentication
router.use(authenticate);

// ==========================================
// ATTENDANCE SETTING ROUTES
// ==========================================

// POST /api/v1/attendance-settings - Create attendance setting
router.post('/', authorize(['Super Admin', 'HR Manager']), (req, res) => attendanceSettingController.create(req, res));

// GET /api/v1/attendance-settings/company/:companyId - Get by company
router.get('/company/:companyId', authorize(['Super Admin', 'Group CEO', 'CEO', 'HR Manager', 'HR Staff']), (req, res) => attendanceSettingController.getByCompany(req, res));

// GET /api/v1/attendance-settings/company/:companyId/init - Get or create
router.get('/company/:companyId/init', authorize(['Super Admin', 'Group CEO', 'CEO', 'HR Manager']), (req, res) => attendanceSettingController.getOrCreate(req, res));

// PUT /api/v1/attendance-settings/company/:companyId - Update
router.put('/company/:companyId', authorize(['Super Admin', 'HR Manager']), (req, res) => attendanceSettingController.update(req, res));

// PATCH /api/v1/attendance-settings/company/:companyId - Upsert
router.patch('/company/:companyId', authorize(['Super Admin', 'HR Manager']), (req, res) => attendanceSettingController.upsert(req, res));

// POST /api/v1/attendance-settings/company/:companyId/reset - Reset to default
router.post('/company/:companyId/reset', authorize(['Super Admin', 'HR Manager']), (req, res) => attendanceSettingController.resetToDefault(req, res));

// DELETE /api/v1/attendance-settings/company/:companyId - Delete
router.delete('/company/:companyId', authorize(['Super Admin']), (req, res) => attendanceSettingController.delete(req, res));

// ==========================================
// SECURITY RULE ROUTES
// ==========================================

// GET /api/v1/attendance-settings/security-rules - List security rules
router.get('/security-rules', authorize(['Super Admin', 'HR Manager']), (req, res) => attendanceSettingController.listSecurityRules(req, res));

// GET /api/v1/attendance-settings/security-rules/active - Get active rules
router.get('/security-rules/active', authorize(['Super Admin', 'HR Manager', 'HR Staff']), (req, res) => attendanceSettingController.getActiveSecurityRules(req, res));

// GET /api/v1/attendance-settings/security-rules/:id - Get by ID
router.get('/security-rules/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => attendanceSettingController.getSecurityRuleById(req, res));

// POST /api/v1/attendance-settings/security-rules - Create security rule
router.post('/security-rules', authorize(['Super Admin', 'HR Manager']), (req, res) => attendanceSettingController.createSecurityRule(req, res));

// PUT /api/v1/attendance-settings/security-rules/:id - Update security rule
router.put('/security-rules/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => attendanceSettingController.updateSecurityRule(req, res));

// DELETE /api/v1/attendance-settings/security-rules/:id - Delete security rule
router.delete('/security-rules/:id', authorize(['Super Admin']), (req, res) => attendanceSettingController.deleteSecurityRule(req, res));

export default router;
