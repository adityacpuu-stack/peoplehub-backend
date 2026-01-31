import { Router } from 'express';
import { GoalController } from './goal.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new GoalController();

// All routes require authentication
router.use(authenticate);

// ==========================================
// SELF-SERVICE ROUTES
// ==========================================

// GET /api/v1/goals/my - Get my goals
router.get('/my', (req, res) => controller.getMyGoals(req, res));

// GET /api/v1/goals/team - Get team goals (for managers)
router.get('/team', (req, res) => controller.getTeamGoals(req, res));

// POST /api/v1/goals/:id/employee-comment - Add employee comment
router.post('/:id/employee-comment', (req, res) => controller.addEmployeeComment(req, res));

// ==========================================
// READ ROUTES
// ==========================================

// GET /api/v1/goals - List all goals
router.get('/', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.list(req, res));

// GET /api/v1/goals/overdue - Get overdue goals
router.get('/overdue', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.getOverdue(req, res));

// GET /api/v1/goals/statistics - Get statistics
router.get('/statistics', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.getStatistics(req, res));

// GET /api/v1/goals/employee/:employeeId - Get goals by employee
router.get('/employee/:employeeId', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.getByEmployeeId(req, res));

// GET /api/v1/goals/:id - Get goal by ID
router.get('/:id', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.getById(req, res));

// ==========================================
// CRUD ROUTES
// ==========================================

// POST /api/v1/goals - Create goal
router.post('/', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.create(req, res));

// PUT /api/v1/goals/:id - Update goal
router.put('/:id', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.update(req, res));

// PATCH /api/v1/goals/:id/progress - Update goal progress
router.patch('/:id/progress', authorize(['Super Admin', 'HR Manager', 'HR Staff', 'Manager']), (req, res) => controller.updateProgress(req, res));

// DELETE /api/v1/goals/:id - Delete goal
router.delete('/:id', authorize(['Super Admin', 'HR Manager']), (req, res) => controller.delete(req, res));

// ==========================================
// FEEDBACK ROUTES
// ==========================================

// POST /api/v1/goals/:id/manager-feedback - Add manager feedback
router.post('/:id/manager-feedback', authorize(['Super Admin', 'HR Manager', 'Manager']), (req, res) => controller.addManagerFeedback(req, res));

export default router;
