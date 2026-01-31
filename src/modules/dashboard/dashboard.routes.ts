import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new DashboardController();

// All routes require authentication
router.use(authenticate);

// ==========================================
// SELF-SERVICE ROUTES (All authenticated users)
// ==========================================

// GET /api/v1/dashboard/my - Get my personal dashboard
router.get('/my', (req, res) => controller.getMyDashboard(req, res));

// GET /api/v1/dashboard/team - Get team dashboard (for managers)
router.get('/team', (req, res) => controller.getTeamDashboard(req, res));

// GET /api/v1/dashboard/calendar - Get calendar events
router.get('/calendar', (req, res) => controller.getCalendarEvents(req, res));

// ==========================================
// ADMIN DASHBOARD ROUTES
// ==========================================

// GET /api/v1/dashboard - Get full dashboard overview
router.get('/', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Group CEO', 'CEO', 'Tax Manager', 'Tax Staff']), (req, res) => controller.getOverview(req, res));

// GET /api/v1/dashboard/quick-stats - Get quick statistics
router.get('/quick-stats', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager', 'Group CEO', 'CEO', 'Tax Manager', 'Tax Staff']), (req, res) => controller.getQuickStats(req, res));

// GET /api/v1/dashboard/alerts - Get alerts and notifications
router.get('/alerts', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager', 'Group CEO', 'CEO', 'Tax Manager', 'Tax Staff']), (req, res) => controller.getAlerts(req, res));

// GET /api/v1/dashboard/group - Get Group CEO dashboard (multi-company overview)
router.get('/group', authorize(['Super Admin', 'Group CEO', 'CEO']), (req, res) => controller.getGroupOverview(req, res));

// GET /api/v1/dashboard/workforce-analytics - Get workforce analytics (demographics, tenure, etc.)
router.get('/workforce-analytics', authorize(['Super Admin', 'Group CEO', 'CEO']), (req, res) => controller.getWorkforceAnalytics(req, res));

// GET /api/v1/dashboard/turnover-analytics - Get turnover analytics (exits, retention, etc.)
router.get('/turnover-analytics', authorize(['Super Admin', 'Group CEO', 'CEO']), (req, res) => controller.getTurnoverAnalytics(req, res));

// GET /api/v1/dashboard/headcount-analytics - Get headcount analytics (trends, forecasts, etc.)
router.get('/headcount-analytics', authorize(['Super Admin', 'Group CEO', 'CEO']), (req, res) => controller.getHeadcountAnalytics(req, res));

// ==========================================
// INDIVIDUAL SUMMARY ROUTES
// ==========================================

// GET /api/v1/dashboard/employee - Get employee summary
router.get('/employee', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Group CEO', 'CEO']), (req, res) => controller.getEmployeeSummary(req, res));

// GET /api/v1/dashboard/attendance - Get attendance summary
router.get('/attendance', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager', 'Group CEO', 'CEO']), (req, res) => controller.getAttendanceSummary(req, res));

// GET /api/v1/dashboard/leave - Get leave summary
router.get('/leave', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager', 'Group CEO', 'CEO']), (req, res) => controller.getLeaveSummary(req, res));

// GET /api/v1/dashboard/payroll - Get payroll summary
router.get('/payroll', authorize(['Super Admin', 'HR Manager', 'Finance Manager', 'Group CEO', 'CEO', 'Tax Manager', 'Tax Staff']), (req, res) => controller.getPayrollSummary(req, res));

// GET /api/v1/dashboard/performance - Get performance summary
router.get('/performance', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager', 'Group CEO', 'CEO']), (req, res) => controller.getPerformanceSummary(req, res));

export default router;
