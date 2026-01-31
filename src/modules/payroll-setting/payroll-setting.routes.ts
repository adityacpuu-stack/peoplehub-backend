import { Router } from 'express';
import { PayrollSettingController } from './payroll-setting.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const payrollSettingController = new PayrollSettingController();

// All routes require authentication
router.use(authenticate);

// ==========================================
// PAYROLL SETTING ROUTES
// ==========================================

// POST /api/v1/payroll-settings - Create payroll setting
router.post('/', authorize(['Super Admin', 'HR Manager', 'Finance Manager']), (req, res) => payrollSettingController.create(req, res));

// GET /api/v1/payroll-settings/company/:companyId - Get by company
router.get('/company/:companyId', authorize(['Super Admin', 'Group CEO', 'CEO', 'HR Manager', 'Finance Manager']), (req, res) => payrollSettingController.getByCompany(req, res));

// GET /api/v1/payroll-settings/company/:companyId/init - Get or create
router.get('/company/:companyId/init', authorize(['Super Admin', 'Group CEO', 'CEO', 'HR Manager', 'Finance Manager']), (req, res) => payrollSettingController.getOrCreate(req, res));

// PUT /api/v1/payroll-settings/company/:companyId - Update
router.put('/company/:companyId', authorize(['Super Admin', 'HR Manager', 'Finance Manager']), (req, res) => payrollSettingController.update(req, res));

// PATCH /api/v1/payroll-settings/company/:companyId - Upsert
router.patch('/company/:companyId', authorize(['Super Admin', 'HR Manager', 'Finance Manager']), (req, res) => payrollSettingController.upsert(req, res));

// POST /api/v1/payroll-settings/company/:companyId/reset - Reset to default
router.post('/company/:companyId/reset', authorize(['Super Admin']), (req, res) => payrollSettingController.resetToDefault(req, res));

// ==========================================
// TAX CONFIGURATION ROUTES (TER)
// ==========================================

// GET /api/v1/payroll-settings/tax-configurations - List TER configurations
router.get('/tax-configurations', authorize(['Super Admin', 'HR Manager', 'Finance Manager']), (req, res) => payrollSettingController.listTaxConfigurations(req, res));

// POST /api/v1/payroll-settings/tax-configurations/seed - Seed TER rates
router.post('/tax-configurations/seed', authorize(['Super Admin']), (req, res) => payrollSettingController.seedTerRates(req, res));

// GET /api/v1/payroll-settings/tax-configurations/:id - Get by ID
router.get('/tax-configurations/:id', authorize(['Super Admin', 'HR Manager', 'Finance Manager']), (req, res) => payrollSettingController.getTaxConfigurationById(req, res));

// POST /api/v1/payroll-settings/tax-configurations - Create
router.post('/tax-configurations', authorize(['Super Admin']), (req, res) => payrollSettingController.createTaxConfiguration(req, res));

// PUT /api/v1/payroll-settings/tax-configurations/:id - Update
router.put('/tax-configurations/:id', authorize(['Super Admin']), (req, res) => payrollSettingController.updateTaxConfiguration(req, res));

// DELETE /api/v1/payroll-settings/tax-configurations/:id - Delete
router.delete('/tax-configurations/:id', authorize(['Super Admin']), (req, res) => payrollSettingController.deleteTaxConfiguration(req, res));

// ==========================================
// TAX BRACKET ROUTES (Progressive)
// ==========================================

// GET /api/v1/payroll-settings/tax-brackets - List tax brackets
router.get('/tax-brackets', authorize(['Super Admin', 'HR Manager', 'Finance Manager']), (req, res) => payrollSettingController.listTaxBrackets(req, res));

// POST /api/v1/payroll-settings/tax-brackets/seed - Seed tax brackets
router.post('/tax-brackets/seed', authorize(['Super Admin']), (req, res) => payrollSettingController.seedTaxBrackets(req, res));

// GET /api/v1/payroll-settings/tax-brackets/:id - Get by ID
router.get('/tax-brackets/:id', authorize(['Super Admin', 'HR Manager', 'Finance Manager']), (req, res) => payrollSettingController.getTaxBracketById(req, res));

// POST /api/v1/payroll-settings/tax-brackets - Create
router.post('/tax-brackets', authorize(['Super Admin']), (req, res) => payrollSettingController.createTaxBracket(req, res));

// PUT /api/v1/payroll-settings/tax-brackets/:id - Update
router.put('/tax-brackets/:id', authorize(['Super Admin']), (req, res) => payrollSettingController.updateTaxBracket(req, res));

// DELETE /api/v1/payroll-settings/tax-brackets/:id - Delete
router.delete('/tax-brackets/:id', authorize(['Super Admin']), (req, res) => payrollSettingController.deleteTaxBracket(req, res));

// ==========================================
// PTKP ROUTES
// ==========================================

// GET /api/v1/payroll-settings/ptkp - List PTKP
router.get('/ptkp', authorize(['Super Admin', 'HR Manager', 'Finance Manager']), (req, res) => payrollSettingController.listPtkp(req, res));

// POST /api/v1/payroll-settings/ptkp/seed - Seed PTKP
router.post('/ptkp/seed', authorize(['Super Admin']), (req, res) => payrollSettingController.seedPtkp(req, res));

// GET /api/v1/payroll-settings/ptkp/status/:status - Get by status
router.get('/ptkp/status/:status', authorize(['Super Admin', 'HR Manager', 'Finance Manager']), (req, res) => payrollSettingController.getPtkpByStatus(req, res));

// GET /api/v1/payroll-settings/ptkp/:id - Get by ID
router.get('/ptkp/:id', authorize(['Super Admin', 'HR Manager', 'Finance Manager']), (req, res) => payrollSettingController.getPtkpById(req, res));

// POST /api/v1/payroll-settings/ptkp - Create
router.post('/ptkp', authorize(['Super Admin']), (req, res) => payrollSettingController.createPtkp(req, res));

// PUT /api/v1/payroll-settings/ptkp/:id - Update
router.put('/ptkp/:id', authorize(['Super Admin']), (req, res) => payrollSettingController.updatePtkp(req, res));

// DELETE /api/v1/payroll-settings/ptkp/:id - Delete
router.delete('/ptkp/:id', authorize(['Super Admin']), (req, res) => payrollSettingController.deletePtkp(req, res));

// ==========================================
// UTILITY ROUTES
// ==========================================

// GET /api/v1/payroll-settings/calculate/ter - Calculate TER rate
router.get('/calculate/ter', authorize(['Super Admin', 'HR Manager', 'Finance Manager', 'HR Staff']), (req, res) => payrollSettingController.getTerRate(req, res));

// GET /api/v1/payroll-settings/calculate/progressive - Calculate progressive tax
router.get('/calculate/progressive', authorize(['Super Admin', 'HR Manager', 'Finance Manager', 'HR Staff']), (req, res) => payrollSettingController.calculateProgressiveTax(req, res));

// POST /api/v1/payroll-settings/seed-all - Seed all tax data
router.post('/seed-all', authorize(['Super Admin']), (req, res) => payrollSettingController.seedAllTaxData(req, res));

export default router;
