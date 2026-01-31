import { Request, Response } from 'express';
import { OrgChartService } from './org-chart.service';
import { OrgChartQuery } from './org-chart.types';

const orgChartService = new OrgChartService();

// Helper to safely get param as string
const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

/**
 * GET /api/v1/org-chart
 * Get full org chart tree
 */
export const getOrgChart = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const query: OrgChartQuery = {
      company_id: req.query.company_id
        ? parseInt(getParam(req.query.company_id as string))
        : undefined,
      department_id: req.query.department_id
        ? parseInt(getParam(req.query.department_id as string))
        : undefined,
      root_employee_id: req.query.root_employee_id
        ? parseInt(getParam(req.query.root_employee_id as string))
        : undefined,
      max_depth: req.query.max_depth
        ? parseInt(getParam(req.query.max_depth as string))
        : 10,
    };

    const result = await orgChartService.getOrgChart(query, req.user);

    res.status(200).json({
      success: true,
      message: 'Org chart retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve org chart',
    });
  }
};

/**
 * GET /api/v1/org-chart/employee/:id
 * Get org chart subtree for a specific employee
 */
export const getEmployeeSubtree = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const employeeId = parseInt(getParam(req.params.id));
    if (isNaN(employeeId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid employee ID',
      });
      return;
    }

    const maxDepth = req.query.max_depth
      ? parseInt(getParam(req.query.max_depth as string))
      : 5;

    const result = await orgChartService.getEmployeeSubtree(employeeId, req.user, maxDepth);

    if (!result) {
      res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Employee subtree retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to retrieve employee subtree',
    });
  }
};
