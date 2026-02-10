import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PayrollService } from './payroll.service';
import { freelanceExportService } from './services/freelance-export.service';
import {
  PayrollListQuery,
  SalaryComponentQuery,
  PayrollAdjustmentQuery,
  GeneratePayrollDTO,
  CalculatePayrollDTO,
  UpdatePayrollDTO,
  ApprovePayrollDTO,
  RejectPayrollDTO,
  MarkAsPaidDTO,
  UpdatePayrollSettingDTO,
  CreateSalaryComponentDTO,
  UpdateSalaryComponentDTO,
  CreateSalaryGradeDTO,
  UpdateSalaryGradeDTO,
  CreatePayrollAdjustmentDTO,
  ApproveAdjustmentDTO,
  RejectAdjustmentDTO,
} from './payroll.types';

const payrollService = new PayrollService();

// Helper to safely get param as string
const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
};

// ==========================================
// PAYROLL CONTROLLERS
// ==========================================

export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const query: PayrollListQuery = {
      page: parseInt(getParam(req.query.page as string)) || 1,
      limit: parseInt(getParam(req.query.limit as string)) || 10,
      employee_id: req.query.employee_id ? parseInt(getParam(req.query.employee_id as string)) : undefined,
      company_id: req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined,
      department_id: req.query.department_id ? parseInt(getParam(req.query.department_id as string)) : undefined,
      period: getParam(req.query.period as string) || undefined,
      status: getParam(req.query.status as string) || undefined,
      sort_by: getParam(req.query.sort_by as string) || undefined,
      sort_order: (getParam(req.query.sort_order as string) as 'asc' | 'desc') || undefined,
    };

    const result = await payrollService.list(query, req.user);

    res.status(200).json({
      message: 'Payrolls retrieved successfully',
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to retrieve payrolls' });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid payroll ID' });
      return;
    }

    const payroll = await payrollService.getById(id, req.user);

    res.status(200).json({
      message: 'Payroll retrieved successfully',
      data: payroll,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const getMyPayrolls = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const query: PayrollListQuery = {
      page: parseInt(getParam(req.query.page as string)) || 1,
      limit: parseInt(getParam(req.query.limit as string)) || 10,
      period: getParam(req.query.period as string) || undefined,
      status: getParam(req.query.status as string) || undefined,
      sort_by: getParam(req.query.sort_by as string) || 'period',
      sort_order: (getParam(req.query.sort_order as string) as 'asc' | 'desc') || 'desc',
    };

    const result = await payrollService.getMyPayrolls(query, req.user);

    res.status(200).json({
      message: 'Payrolls retrieved successfully',
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyPayslip = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid payroll ID' });
      return;
    }

    const payslip = await payrollService.getMyPayslip(id, req.user);

    res.status(200).json({
      message: 'Payslip retrieved successfully',
      data: payslip,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const generate = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const data: GeneratePayrollDTO = req.body;

    if (!data.company_id || !data.period) {
      res.status(400).json({ message: 'Company ID and period are required' });
      return;
    }

    // Validate period format
    if (!/^\d{4}-\d{2}$/.test(data.period)) {
      res.status(400).json({ message: 'Invalid period format. Use YYYY-MM' });
      return;
    }

    const result = await payrollService.generate(data, req.user);

    res.status(200).json({
      message: `Payroll generated: ${result.generated} success, ${result.errors} errors`,
      ...result,
    });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const calculate = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const data: CalculatePayrollDTO = req.body;

    if (!data.employee_id || !data.period) {
      res.status(400).json({ message: 'Employee ID and period are required' });
      return;
    }

    const result = await payrollService.calculate(data, req.user);

    res.status(200).json({
      message: 'Payroll calculated successfully',
      data: result,
    });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 :
                   error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid payroll ID' });
      return;
    }

    const data: UpdatePayrollDTO = req.body;
    const payroll = await payrollService.update(id, data, req.user);

    res.status(200).json({
      message: 'Payroll updated successfully',
      data: payroll,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 :
                   error.message.includes('Can only') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const validate = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid payroll ID' });
      return;
    }

    const payroll = await payrollService.validate(id, req.user);

    res.status(200).json({
      message: 'Payroll validated successfully',
      data: payroll,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Can only') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const submit = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid payroll ID' });
      return;
    }

    const payroll = await payrollService.submit(id, req.user);

    res.status(200).json({
      message: 'Payroll submitted for approval',
      data: payroll,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Can only') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const approve = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid payroll ID' });
      return;
    }

    const data: ApprovePayrollDTO = req.body;
    const payroll = await payrollService.approve(id, data, req.user);

    res.status(200).json({
      message: 'Payroll approved successfully',
      data: payroll,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Can only') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const reject = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid payroll ID' });
      return;
    }

    const data: RejectPayrollDTO = req.body;

    if (!data.rejection_reason) {
      res.status(400).json({ message: 'Rejection reason is required' });
      return;
    }

    const payroll = await payrollService.reject(id, data, req.user);

    res.status(200).json({
      message: 'Payroll rejected',
      data: payroll,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Can only') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

// ==========================================
// BULK OPERATIONS
// ==========================================

export const bulkSubmit = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: 'Payroll IDs array is required' });
      return;
    }

    const result = await payrollService.bulkSubmit(ids, req.user);

    res.status(200).json({
      message: `${result.success} payrolls submitted, ${result.failed} failed`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const bulkApprove = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { ids, approval_notes } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: 'Payroll IDs array is required' });
      return;
    }

    const result = await payrollService.bulkApprove(ids, { approval_notes }, req.user);

    res.status(200).json({
      message: `${result.success} payrolls approved, ${result.failed} failed`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const bulkReject = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { ids, rejection_reason } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: 'Payroll IDs array is required' });
      return;
    }

    if (!rejection_reason) {
      res.status(400).json({ message: 'Rejection reason is required' });
      return;
    }

    const result = await payrollService.bulkReject(ids, { rejection_reason }, req.user);

    res.status(200).json({
      message: `${result.success} payrolls rejected, ${result.failed} failed`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsPaid = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid payroll ID' });
      return;
    }

    const data: MarkAsPaidDTO = req.body;
    const payroll = await payrollService.markAsPaid(id, data, req.user);

    res.status(200).json({
      message: 'Payroll marked as paid',
      data: payroll,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Can only') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

// ==========================================
// PAYROLL SETTINGS CONTROLLERS
// ==========================================

export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const companyId = parseInt(getParam(req.params.companyId));
    if (isNaN(companyId)) {
      res.status(400).json({ message: 'Invalid company ID' });
      return;
    }

    const settings = await payrollService.getSettings(companyId, req.user);

    res.status(200).json({
      message: 'Payroll settings retrieved successfully',
      data: settings,
    });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const companyId = parseInt(getParam(req.params.companyId));
    if (isNaN(companyId)) {
      res.status(400).json({ message: 'Invalid company ID' });
      return;
    }

    const data: UpdatePayrollSettingDTO = req.body;
    const settings = await payrollService.updateSettings(companyId, data, req.user);

    res.status(200).json({
      message: 'Payroll settings updated successfully',
      data: settings,
    });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

// ==========================================
// SALARY COMPONENT CONTROLLERS
// ==========================================

export const listSalaryComponents = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const query: SalaryComponentQuery = {
      page: parseInt(getParam(req.query.page as string)) || 1,
      limit: parseInt(getParam(req.query.limit as string)) || 50,
      company_id: req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined,
      type: getParam(req.query.type as string) || undefined,
      category: getParam(req.query.category as string) || undefined,
      is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
    };

    const result = await payrollService.listSalaryComponents(query, req.user);

    res.status(200).json({
      message: 'Salary components retrieved successfully',
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createSalaryComponent = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const data: CreateSalaryComponentDTO = req.body;

    if (!data.name || !data.type) {
      res.status(400).json({ message: 'Name and type are required' });
      return;
    }

    const component = await payrollService.createSalaryComponent(data, req.user);

    res.status(201).json({
      message: 'Salary component created successfully',
      data: component,
    });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const updateSalaryComponent = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid component ID' });
      return;
    }

    const data: UpdateSalaryComponentDTO = req.body;
    const component = await payrollService.updateSalaryComponent(id, data, req.user);

    res.status(200).json({
      message: 'Salary component updated successfully',
      data: component,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const deleteSalaryComponent = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid component ID' });
      return;
    }

    await payrollService.deleteSalaryComponent(id, req.user);

    res.status(200).json({
      message: 'Salary component deleted successfully',
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

// ==========================================
// SALARY GRADE CONTROLLERS
// ==========================================

export const listSalaryGrades = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const grades = await payrollService.listSalaryGrades();

    res.status(200).json({
      message: 'Salary grades retrieved successfully',
      data: grades,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createSalaryGrade = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const data: CreateSalaryGradeDTO = req.body;

    if (!data.grade_code || !data.grade_name) {
      res.status(400).json({ message: 'Grade code and name are required' });
      return;
    }

    const grade = await payrollService.createSalaryGrade(data, req.user);

    res.status(201).json({
      message: 'Salary grade created successfully',
      data: grade,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSalaryGrade = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid grade ID' });
      return;
    }

    const data: UpdateSalaryGradeDTO = req.body;
    const grade = await payrollService.updateSalaryGrade(id, data, req.user);

    res.status(200).json({
      message: 'Salary grade updated successfully',
      data: grade,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const deleteSalaryGrade = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid grade ID' });
      return;
    }

    await payrollService.deleteSalaryGrade(id, req.user);

    res.status(200).json({
      message: 'Salary grade deleted successfully',
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

// ==========================================
// PAYROLL ADJUSTMENT CONTROLLERS
// ==========================================

export const listAdjustments = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const query: PayrollAdjustmentQuery = {
      page: parseInt(getParam(req.query.page as string)) || 1,
      limit: parseInt(getParam(req.query.limit as string)) || 10,
      employee_id: req.query.employee_id ? parseInt(getParam(req.query.employee_id as string)) : undefined,
      company_id: req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : undefined,
      type: getParam(req.query.type as string) || undefined,
      status: getParam(req.query.status as string) || undefined,
      pay_period: getParam(req.query.pay_period as string) || undefined,
    };

    const result = await payrollService.listAdjustments(query, req.user);

    res.status(200).json({
      message: 'Adjustments retrieved successfully',
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createAdjustment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const data: CreatePayrollAdjustmentDTO = req.body;

    if (!data.employee_id || !data.type || data.amount === undefined) {
      res.status(400).json({ message: 'Employee ID, type, and amount are required' });
      return;
    }

    const adjustment = await payrollService.createAdjustment(data, req.user);

    res.status(201).json({
      message: 'Adjustment created successfully',
      data: adjustment,
    });
  } catch (error: any) {
    const status = error.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const approveAdjustment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid adjustment ID' });
      return;
    }

    const data: ApproveAdjustmentDTO = req.body;
    const adjustment = await payrollService.approveAdjustment(id, data, req.user);

    res.status(200).json({
      message: 'Adjustment approved successfully',
      data: adjustment,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Can only') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const rejectAdjustment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const id = parseInt(getParam(req.params.id));
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid adjustment ID' });
      return;
    }

    const data: RejectAdjustmentDTO = req.body;

    if (!data.rejection_reason) {
      res.status(400).json({ message: 'Rejection reason is required' });
      return;
    }

    const adjustment = await payrollService.rejectAdjustment(id, data, req.user);

    res.status(200).json({
      message: 'Adjustment rejected',
      data: adjustment,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 :
                   error.message.includes('Can only') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

// ==========================================
// EXPORT
// ==========================================

export const exportExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    // company_id is optional - if not provided, export all accessible companies
    const companyId = req.query.company_id ? parseInt(getParam(req.query.company_id as string)) : null;
    const period = getParam(req.query.period as string);

    if (!period) {
      res.status(400).json({ message: 'Period is required' });
      return;
    }

    const workbook = await payrollService.exportToExcel(companyId, period, req.user);

    // Set filename based on whether it's single company or all
    const filename = companyId
      ? `Payroll_${period}_Company${companyId}.xlsx`
      : `Payroll_${period}_AllCompanies.xlsx`;

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${filename}`
    );

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({ message: error.message || 'Failed to export payroll' });
  }
};

// ==========================================
// FREELANCE / INTERNSHIP EXPORT
// ==========================================

const prismaClient = new PrismaClient();

export const exportFreelanceInternship = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const period = getParam(req.query.period as string);
    const cutoffDate = parseInt(getParam(req.query.cutoff_date as string)) || 20;

    if (!period) {
      res.status(400).json({ message: 'Period is required' });
      return;
    }

    // Get accessible company IDs for the user
    const accessibleCompanyIds = req.user.accessibleCompanyIds || [];

    // Fetch all freelance and internship employees from accessible companies
    const employees = await prismaClient.employee.findMany({
      where: {
        company_id: { in: accessibleCompanyIds },
        employment_type: { in: ['freelance', 'internship'] },
        employment_status: 'active',
      },
      include: {
        company: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
      },
      orderBy: [
        { company_id: 'asc' },
        { employment_type: 'asc' },
        { name: 'asc' },
      ],
    });

    if (employees.length === 0) {
      res.status(404).json({ message: 'No freelance or internship employees found' });
      return;
    }

    // Calculate period label based on cutoff date
    const [year, month] = period.split('-').map(Number);
    const startCutoff = cutoffDate + 1;
    const periodStart = new Date(year, month - 2, startCutoff);
    const periodEnd = new Date(year, month - 1, cutoffDate);

    const formatDate = (d: Date) => {
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };
    const periodLabel = `${formatDate(periodStart)} - ${formatDate(periodEnd)} ${year}`;

    // Generate Excel
    const preparedBy = req.user.employee?.name || req.user.email || 'HR System';
    const workbook = await freelanceExportService.generateExcel(
      employees,
      period,
      periodLabel,
      preparedBy
    );

    // Set filename
    const periodFormatted = period.replace('-', '');
    const filename = `Freelance_Internship_Payroll_${periodFormatted}.xlsx`;

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${filename}`
    );

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('Freelance export error:', error);
    res.status(500).json({ message: error.message || 'Failed to export freelance/internship payroll' });
  }
};
