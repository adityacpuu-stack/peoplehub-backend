import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import * as orgChartController from './org-chart.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/org-chart:
 *   get:
 *     summary: Get organization chart
 *     tags: [Org Chart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: company_id
 *         schema:
 *           type: integer
 *         description: Filter by company ID
 *       - in: query
 *         name: department_id
 *         schema:
 *           type: integer
 *         description: Filter by department ID
 *       - in: query
 *         name: root_employee_id
 *         schema:
 *           type: integer
 *         description: Start tree from specific employee
 *       - in: query
 *         name: max_depth
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum depth of tree
 *     responses:
 *       200:
 *         description: Org chart retrieved successfully
 */
router.get('/', orgChartController.getOrgChart);

/**
 * @swagger
 * /api/v1/org-chart/employee/{id}:
 *   get:
 *     summary: Get org chart subtree for specific employee
 *     tags: [Org Chart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *       - in: query
 *         name: max_depth
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Maximum depth of subtree
 *     responses:
 *       200:
 *         description: Employee subtree retrieved successfully
 *       404:
 *         description: Employee not found
 */
router.get('/employee/:id', orgChartController.getEmployeeSubtree);

export default router;
