import { PrismaClient, Prisma } from '@prisma/client';
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
  UpdatePayrollAdjustmentDTO,
  ApproveAdjustmentDTO,
  RejectAdjustmentDTO,
  PAYROLL_STATUS,
  PAYROLL_LIST_SELECT,
  PAYROLL_DETAIL_SELECT,
  PAYROLL_SETTING_SELECT,
  SALARY_COMPONENT_SELECT,
  SALARY_GRADE_SELECT,
  PAYROLL_ADJUSTMENT_SELECT,
  BPJSCalculation,
  TaxCalculation,
  PayrollCalculationResult,
  ProrateCalculation,
  ProrateInput,
  PRORATE_METHODS,
  DeductionCalculation,
  DeductionInput,
  DeductionDetail,
  DeductionRates,
  DEDUCTION_TYPES,
} from './payroll.types';
import { AuthUser, hasCompanyAccess, canAccessEmployee, getHighestRoleLevel, ROLE_HIERARCHY } from '../../middlewares/auth.middleware';
import { payrollCalculationService } from './services/payroll-calculation.service';
import { payrollExportService } from './services/payroll-export.service';

const prisma = new PrismaClient();

// Hidden system accounts - excluded from payroll generation
const HIDDEN_EMPLOYEE_IDS = ['EMP-001', 'PFI-PDR-HRSTAFF'];

export class PayrollService {
  // ==========================================
  // PAYROLL METHODS
  // ==========================================

  async list(query: PayrollListQuery, user: AuthUser) {
    const {
      page = 1,
      limit = 10,
      employee_id,
      company_id,
      department_id,
      period,
      status,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PayrollWhereInput = {};

    if (employee_id) {
      where.employee_id = employee_id;
    }

    if (company_id) {
      where.company_id = company_id;
    } else if (user.employee?.company_id && getHighestRoleLevel(user.roles) < ROLE_HIERARCHY['CEO']) {
      where.company_id = user.employee.company_id;
    }

    if (department_id) {
      where.employee = { department_id };
    }

    if (period) {
      where.period = period;
    }

    if (status) {
      where.status = status;
    }

    const orderBy: Prisma.PayrollOrderByWithRelationInput = {};
    if (sort_by === 'employee_name') {
      orderBy.employee = { name: sort_order };
    } else {
      (orderBy as any)[sort_by] = sort_order;
    }

    const [data, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
        select: PAYROLL_LIST_SELECT,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.payroll.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: number, user: AuthUser) {
    const payroll = await prisma.payroll.findUnique({
      where: { id },
      select: PAYROLL_DETAIL_SELECT,
    });

    if (!payroll) {
      throw new Error('Payroll not found');
    }

    // Check access
    if (!await canAccessEmployee(user, payroll.employee_id)) {
      throw new Error('Access denied');
    }

    return payroll;
  }

  async getMyPayrolls(query: PayrollListQuery, user: AuthUser) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    return this.list(
      { ...query, employee_id: user.employee.id },
      user
    );
  }

  async getMyPayslip(id: number, user: AuthUser) {
    if (!user.employee) {
      throw new Error('No employee profile found');
    }

    const payroll = await prisma.payroll.findFirst({
      where: {
        id,
        employee_id: user.employee.id,
        status: { in: [PAYROLL_STATUS.APPROVED, PAYROLL_STATUS.PAID] },
      },
      select: PAYROLL_DETAIL_SELECT,
    });

    if (!payroll) {
      throw new Error('Payslip not found or not yet approved');
    }

    return payroll;
  }

  async generate(data: GeneratePayrollDTO, user: AuthUser) {
    if (!hasCompanyAccess(user, data.company_id)) {
      throw new Error('Access denied to this company');
    }

    // Get company settings
    const settings = await this.getOrCreateSettings(data.company_id);

    // Parse period to get date range using cut-off dates
    const cutoffDate = settings.payroll_cutoff_date || 20;
    const { periodStart: payrollPeriodStart, periodEnd: payrollPeriodEnd } = this.parsePeriod(data.period, cutoffDate);

    // Get employees to process (only permanent employees, exclude freelance, internship, and Super Admin)
    // Include: active employees OR resigned employees whose resign_date is within the payroll period
    // Exclude employees whose join_date is after the payroll period end (they haven't started yet)
    const whereEmployee: Prisma.EmployeeWhereInput = {
      company_id: data.company_id,
      employee_id: { notIn: HIDDEN_EMPLOYEE_IDS },
      AND: [
        // Only include employees who joined on or before the payroll period end date
        // (or those without a recorded join_date)
        {
          OR: [
            { join_date: { lte: payrollPeriodEnd } },
            { join_date: null },
          ],
        },
        // Include active employees OR resigned employees with resign_date in this period
        {
          OR: [
            { employment_status: 'active' },
            {
              employment_status: 'resigned',
              resign_date: {
                gte: payrollPeriodStart,
                lte: payrollPeriodEnd,
              },
            },
          ],
        },
        // Exclude freelance and internship - they have separate payroll process
        {
          OR: [
            { employment_type: { notIn: ['freelance', 'internship'] } },
            { employment_type: null }, // Include employees without employment_type set (default to permanent)
          ],
        },
        // Exclude users with Super Admin role (they don't get payroll)
        {
          user: {
            userRoles: {
              none: {
                role: {
                  name: 'Super Admin',
                },
              },
            },
          },
        },
      ],
    };

    if (data.employee_ids && data.employee_ids.length > 0) {
      whereEmployee.id = { in: data.employee_ids };
    }

    const employees = await prisma.employee.findMany({
      where: whereEmployee,
      select: {
        id: true,
        name: true,
        company_id: true,
        basic_salary: true,
        transport_allowance: true,
        meal_allowance: true,
        position_allowance: true,
        tax_status: true,
        ptkp_status: true,
        pay_type: true,
        join_date: true,
        resign_date: true,
        bpjs_ketenagakerjaan_number: true,
        bpjs_kesehatan_number: true,
        jht_registered: true,
        jp_registered: true,
      },
    });

    const results = [];
    const errors = [];

    // Calculate working days in this period (excluding weekends and holidays)
    const workingDaysInPeriod = await this.getWorkingDays(payrollPeriodStart, payrollPeriodEnd, data.company_id);

    for (const employee of employees) {
      try {
        // Check if payroll already exists for this period
        const existing = await prisma.payroll.findFirst({
          where: {
            employee_id: employee.id,
            period: data.period,
          },
        });

        if (existing) {
          errors.push({ employee_id: employee.id, error: 'Payroll already exists for this period' });
          continue;
        }

        // Fetch approved overtime for this employee in the period
        const approvedOvertimes = await prisma.overtime.findMany({
          where: {
            employee_id: employee.id,
            status: 'approved',
            date: {
              gte: payrollPeriodStart,
              lte: payrollPeriodEnd,
            },
          },
          select: {
            hours: true,
            total_amount: true,
          },
        });

        // Sum up overtime hours and pay
        const overtimeHours = approvedOvertimes.reduce((sum, ot) => sum + Number(ot.hours || 0), 0);
        const overtimePay = approvedOvertimes.reduce((sum, ot) => sum + Number(ot.total_amount || 0), 0);

        // Fetch approved/active allowances for this employee in the period
        const approvedAllowances = await prisma.allowance.findMany({
          where: {
            employee_id: employee.id,
            deleted_at: null,
            status: { in: ['approved', 'active'] },
            OR: [
              // No date restrictions
              { effective_date: null },
              // Effective within period
              {
                effective_date: { lte: payrollPeriodEnd },
                OR: [
                  { end_date: null },
                  { end_date: { gte: payrollPeriodStart } },
                ],
              },
            ],
          },
          select: {
            name: true,
            type: true,
            amount: true,
            is_taxable: true,
          },
        });

        // Categorize allowances by type
        const allowancesByType: Record<string, number> = {
          position: 0,
          transport: 0,
          meal: 0,
          housing: 0,
          communication: 0,
          medical: 0,
          performance: 0,
          attendance: 0,
          other: 0,
        };
        for (const al of approvedAllowances) {
          const amount = Number(al.amount || 0);
          const type = (al.type || 'other').toLowerCase();
          if (type in allowancesByType) {
            allowancesByType[type] += amount;
          } else if (type === 'telecom') {
            allowancesByType.communication += amount;
          } else {
            allowancesByType.other += amount;
          }
        }
        // Exclude basic typed allowances from details (they have their own DB columns)
        // Keep performance, medical, attendance in details so Excel can parse them into separate columns
        const basicTypedAllowances = ['position', 'transport', 'meal', 'housing', 'communication', 'telecom'];
        const allowanceDetails = approvedAllowances
          .filter(al => !basicTypedAllowances.includes((al.type || '').toLowerCase()))
          .map(al => ({
            name: al.name,
            type: al.type,
            amount: Number(al.amount || 0),
          }));

        // Fetch attendance summary for deductions (absence, late)
        const attendanceSummary = await this.getAttendanceSummary(employee.id, payrollPeriodStart, payrollPeriodEnd);

        // Fetch unpaid leave days
        const unpaidLeaveDays = await this.getUnpaidLeaveDays(employee.id, payrollPeriodStart, payrollPeriodEnd);

        // Calculate payroll with overtime, allowance, and deduction data
        const payroll = await this.calculateAndCreate({
          employee_id: employee.id,
          period: data.period,
          basic_salary: employee.basic_salary?.toNumber(),
          overtime_hours: overtimeHours,
          overtime_pay: overtimePay,
          additional_allowances_by_type: allowancesByType,
          allowance_details: allowanceDetails,
          working_days: workingDaysInPeriod,
          actual_working_days: workingDaysInPeriod - attendanceSummary.absent_days,
          absent_days: attendanceSummary.absent_days,
          late_days: attendanceSummary.late_days,
          leave_days: unpaidLeaveDays,
        }, user, settings, employee);

        results.push(payroll);
      } catch (error: any) {
        errors.push({ employee_id: employee.id, error: error.message });
      }
    }

    return {
      generated: results.length,
      errors: errors.length,
      results,
      errorDetails: errors,
    };
  }

  async calculate(data: CalculatePayrollDTO, user: AuthUser) {
    if (!await canAccessEmployee(user, data.employee_id)) {
      throw new Error('Access denied to this employee');
    }

    const employee = await prisma.employee.findUnique({
      where: { id: data.employee_id },
      select: {
        id: true,
        company_id: true,
        basic_salary: true,
        transport_allowance: true,
        meal_allowance: true,
        position_allowance: true,
        tax_status: true,
        ptkp_status: true,
        bpjs_ketenagakerjaan_number: true,
        bpjs_kesehatan_number: true,
        jht_registered: true,
        jp_registered: true,
      },
    });

    if (!employee || !employee.company_id) {
      throw new Error('Employee not found or not assigned to a company');
    }

    const settings = await this.getOrCreateSettings(employee.company_id);

    return this.calculatePayroll(data, settings, employee);
  }

  private async calculateAndCreate(
    data: CalculatePayrollDTO,
    user: AuthUser,
    settings: any,
    employee: any
  ) {
    const calculation = await this.calculatePayroll(data, settings, employee);

    // Parse period
    const [year, month] = data.period.split('-').map(Number);
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);

    // Generate payroll number
    const payrollNumber = `PAY-${data.period.replace('-', '')}-${employee.id}`;

    return prisma.payroll.create({
      data: {
        employee_id: data.employee_id,
        company_id: employee.company_id,
        payroll_number: payrollNumber,
        period: data.period,
        period_start: periodStart,
        period_end: periodEnd,
        pay_type: data.pay_type || employee.pay_type || 'gross',
        basic_salary: calculation.basic_salary,
        gross_salary: calculation.gross_salary,
        // Use allowances from allowances table ONLY (not employee base to avoid double counting)
        transport_allowance: data.additional_allowances_by_type?.transport || 0,
        meal_allowance: data.additional_allowances_by_type?.meal || 0,
        position_allowance: data.additional_allowances_by_type?.position || 0,
        other_allowances: (data.additional_allowances_by_type?.other || 0) +
          (data.additional_allowances_by_type?.housing || 0) +
          (data.additional_allowances_by_type?.communication || 0),
        allowances_detail: data.allowance_details as any,
        overtime_hours: data.overtime_hours,
        overtime_pay: data.overtime_pay || calculation.overtime_pay,
        total_deductions: calculation.total_deductions,
        // Deductions
        absence_deduction: calculation.deductions?.absence_deduction,
        late_deduction: calculation.deductions?.late_deduction,
        loan_deduction: (calculation.deductions?.loan_deduction || 0) + (calculation.deductions?.advance_deduction || 0),
        other_deductions: (calculation.deductions?.other_deductions || 0) + (calculation.deductions?.penalty_deduction || 0) + (calculation.deductions?.leave_deduction || 0),
        deductions_detail: calculation.deductions?.deduction_details as any,
        // Tax & Gross Up Calculation
        taxable_income: calculation.tax.taxable_income,
        pph21: calculation.tax.pph21,
        pph21_paid_by_company: calculation.tax.pph21_paid_by_company,
        ter_rate: calculation.tax.ter_rate,
        ter_rate_initial: (calculation.tax as any).ter_rate_initial,
        ter_category: calculation.tax.ter_category,
        ptkp_status: calculation.tax.ptkp_status,
        ptkp_amount: calculation.tax.ptkp_amount,
        // Gross Up values
        gross_up_initial: (calculation.tax as any).gross_up_initial,
        final_gross_up: (calculation.tax as any).final_gross_up,
        total_gross: (calculation.tax as any).total_gross,
        bpjs_object_pph21: (calculation.tax as any).bpjs_object_pph21,
        thp: calculation.take_home_pay,
        total_cost_company: (calculation.tax as any).total_cost_company,
        // BPJS
        bpjs_kes_employee: calculation.bpjs.bpjs_kes_employee,
        bpjs_jht_employee: calculation.bpjs.bpjs_jht_employee,
        bpjs_jp_employee: calculation.bpjs.bpjs_jp_employee,
        bpjs_employee_total: calculation.bpjs.bpjs_employee_total,
        bpjs_kes_company: calculation.bpjs.bpjs_kes_company,
        bpjs_jht_company: calculation.bpjs.bpjs_jht_company,
        bpjs_jp_company: calculation.bpjs.bpjs_jp_company,
        bpjs_jkk_company: calculation.bpjs.bpjs_jkk_company,
        bpjs_jkm_company: calculation.bpjs.bpjs_jkm_company,
        bpjs_company_total: calculation.bpjs.bpjs_company_total,
        // Results
        net_salary: calculation.net_salary,
        take_home_pay: calculation.take_home_pay,
        total_cost_to_company: calculation.total_cost_to_company,
        // Attendance
        working_days: calculation.prorate?.total_days || data.working_days,
        actual_working_days: calculation.prorate?.actual_days || data.actual_working_days,
        absent_days: data.absent_days,
        late_days: data.late_days,
        leave_days: data.leave_days,
        // Prorate
        is_prorated: calculation.prorate?.is_prorated,
        prorate_factor: calculation.prorate?.prorate_factor,
        prorate_reason: calculation.prorate?.prorate_reason,
        status: PAYROLL_STATUS.DRAFT,
      },
      select: PAYROLL_DETAIL_SELECT,
    });
  }

  private async calculatePayroll(
    data: CalculatePayrollDTO,
    settings: any,
    employee: any
  ): Promise<PayrollCalculationResult> {
    // Determine pay type
    const payType = data.pay_type || employee.pay_type || 'gross';

    // Get FULL salary components (before prorate)
    // Use allowances from table (additional_allowances_by_type) instead of employee base to avoid double counting
    const fullBasicSalary = data.basic_salary || employee.basic_salary?.toNumber() || 0;
    const fullTransportAllowance = data.additional_allowances_by_type?.transport || 0;
    const fullMealAllowance = data.additional_allowances_by_type?.meal || 0;
    const fullPositionAllowance = data.additional_allowances_by_type?.position || 0;

    // Calculate prorate FIRST (before any calculations)
    const prorate = await this.calculateProrate({
      period: data.period,
      employee_id: data.employee_id,
      join_date: employee.join_date,
      resign_date: employee.resign_date,
      company_id: employee.company_id,
    });

    // Apply prorate to salary components
    const prorateFactor = prorate.prorate_factor;
    const isProrated = prorate.is_prorated;

    const basicSalary = this.applyProrate(fullBasicSalary, prorateFactor, isProrated);
    const transportAllowance = this.applyProrate(fullTransportAllowance, prorateFactor, isProrated);
    const mealAllowance = this.applyProrate(fullMealAllowance, prorateFactor, isProrated);
    const positionAllowance = this.applyProrate(fullPositionAllowance, prorateFactor, isProrated);

    // Include other allowances (housing, communication, other) from table
    const otherAllowances = (data.additional_allowances_by_type?.housing || 0) +
      (data.additional_allowances_by_type?.communication || 0) +
      (data.additional_allowances_by_type?.other || 0);
    const totalAllowances = transportAllowance + mealAllowance + positionAllowance + otherAllowances;

    // Use pre-calculated overtime pay if provided, otherwise calculate from hours
    const overtimePay = data.overtime_pay !== undefined && data.overtime_pay > 0
      ? data.overtime_pay
      : this.calculateOvertime(data.overtime_hours || 0, basicSalary, settings);

    // Get tax status
    const taxStatus = employee.ptkp_status || employee.tax_status || 'TK/0';

    // Use new calculation service (matches Laravel exactly)
    // Now using PRORATED values
    const calc = payrollCalculationService.calculate(
      basicSalary,
      totalAllowances,
      overtimePay,
      taxStatus,
      payType,
      transportAllowance,
      mealAllowance,
      positionAllowance
    );

    // Build BPJS result
    const bpjs: BPJSCalculation = {
      bpjs_kes_employee: calc.bpjs_kes_employee,
      bpjs_jht_employee: calc.bpjs_jht_employee,
      bpjs_jp_employee: calc.bpjs_jp_employee,
      bpjs_employee_total: calc.bpjs_employee_total,
      bpjs_kes_company: calc.bpjs_kes_company,
      bpjs_jht_company: calc.bpjs_jht_company,
      bpjs_jp_company: calc.bpjs_jp_company,
      bpjs_jkk_company: calc.bpjs_jkk_company,
      bpjs_jkm_company: calc.bpjs_jkm_company,
      bpjs_company_total: calc.bpjs_company_total,
    };

    // Build tax result with gross up values
    const tax: TaxCalculation & {
      ter_rate_initial?: number;
      gross_up_initial?: number;
      final_gross_up?: number;
      total_gross?: number;
      bpjs_object_pph21?: number;
      thp?: number;
      total_cost_company?: number;
    } = {
      taxable_income: 0,
      pph21: calc.pph21,
      pph21_paid_by_company: payType === 'net' || payType === 'nett' || payType === 'gross_up',
      ter_rate: calc.ter_rate,
      ter_rate_initial: calc.ter_rate_initial,
      ter_category: calc.ter_golongan,
      ptkp_status: taxStatus,
      ptkp_amount: 54000000,
      // Gross up values
      gross_up_initial: calc.gross_up_initial,
      final_gross_up: calc.final_gross_up,
      total_gross: calc.total_gross,
      bpjs_object_pph21: calc.bpjs_object_pph21,
      thp: calc.thp,
      total_cost_company: calc.total_cost_company,
    };

    // Calculate deductions from attendance, loans, adjustments
    const deductions = await this.calculateDeductions({
      employee_id: data.employee_id,
      period: data.period,
      basic_salary: basicSalary,
      working_days: data.working_days || 22, // Default 22 working days
      absent_days: data.absent_days || 0,
      late_days: data.late_days || 0,
      unpaid_leave_days: data.leave_days || 0,
      company_id: employee.company_id,
    }, settings);

    // Adjust THP with deductions
    const adjustedThp = calc.thp - deductions.total_deductions;

    return {
      basic_salary: calc.basic_salary,
      gross_salary: calc.final_gross_up,
      total_deductions: deductions.total_deductions,
      net_salary: calc.net_salary - deductions.total_deductions,
      take_home_pay: adjustedThp,
      total_cost_to_company: calc.total_cost_company,
      bpjs,
      tax,
      prorate,
      deductions,
      // Prorated allowances
      transport_allowance: transportAllowance,
      meal_allowance: mealAllowance,
      position_allowance: positionAllowance,
      // Overtime
      overtime_pay: overtimePay,
    };
  }

  /**
   * Calculate Gross Up (for NET pay type)
   * Given desired THP, calculate what gross salary should be
   * Uses iterative approach because TER rate depends on gross
   */
  private async calculateGrossUp(
    desiredTHP: number,
    totalAllowances: number,
    overtimePay: number,
    settings: any,
    employee: any,
    prorateFactor: number,
    isProrated: boolean,
    prorateBasicSalary: boolean,
    prorateAllowances: boolean
  ): Promise<{
    basicSalary: number;
    grossSalary: number;
    bpjs: BPJSCalculation;
    tax: TaxCalculation;
  }> {
    // Get BPJS employee rates
    const bpjsKesRate = employee.bpjs_kesehatan_number
      ? (settings.bpjs_kes_employee_rate?.toNumber() || 0.01)
      : 0;
    const bpjsJhtRate = employee.jht_registered
      ? (settings.bpjs_jht_employee_rate?.toNumber() || 0.02)
      : 0;
    const bpjsJpRate = employee.jp_registered
      ? (settings.bpjs_jp_employee_rate?.toNumber() || 0.01)
      : 0;
    const totalBpjsRate = bpjsKesRate + bpjsJhtRate + bpjsJpRate;

    // Initial estimate: Gross = THP / (1 - BPJS_rate)
    // We ignore PPh21 in first iteration since it depends on gross
    let estimatedBasicSalary = desiredTHP / (1 - totalBpjsRate);

    // Apply prorate to allowances
    const allowances = prorateAllowances
      ? this.applyProrate(totalAllowances, prorateFactor, isProrated)
      : totalAllowances;

    // Iterative refinement (max 10 iterations)
    let basicSalary = estimatedBasicSalary;
    let grossSalary = 0;
    let bpjs: BPJSCalculation;
    let tax: TaxCalculation;

    for (let i = 0; i < 10; i++) {
      // Apply prorate to basic salary
      const proratedBasic = prorateBasicSalary
        ? this.applyProrate(basicSalary, prorateFactor, isProrated)
        : basicSalary;

      grossSalary = proratedBasic + allowances + overtimePay;

      // Calculate BPJS
      bpjs = this.calculateBPJS(proratedBasic, settings, employee);

      // Calculate tax (marked as paid by company)
      tax = await this.calculateTax(grossSalary, bpjs, settings, employee, true);

      // Calculate actual THP with this gross
      // THP = Gross - BPJS_employee (PPh21 is paid by company)
      const actualTHP = grossSalary - bpjs.bpjs_employee_total;

      // Check if close enough (within 1000 IDR)
      if (Math.abs(actualTHP - desiredTHP) < 1000) {
        break;
      }

      // Adjust basic salary based on difference
      const diff = desiredTHP - actualTHP;
      basicSalary += diff / (1 - totalBpjsRate);
    }

    // Final calculation with converged values
    const finalBasic = prorateBasicSalary
      ? this.applyProrate(basicSalary, prorateFactor, isProrated)
      : basicSalary;

    grossSalary = finalBasic + allowances + overtimePay;
    bpjs = this.calculateBPJS(finalBasic, settings, employee);
    tax = await this.calculateTax(grossSalary, bpjs, settings, employee, true);

    return {
      basicSalary: Math.round(finalBasic),
      grossSalary: Math.round(grossSalary),
      bpjs,
      tax,
    };
  }

  private calculateBPJS(basicSalary: number, settings: any, employee: any): BPJSCalculation {
    // BPJS Kesehatan
    const bpjsKesMaxSalary = settings.bpjs_kes_max_salary?.toNumber() || 12000000;
    const bpjsKesSalary = Math.min(basicSalary, bpjsKesMaxSalary);
    const bpjs_kes_employee = employee.bpjs_kesehatan_number
      ? bpjsKesSalary * (settings.bpjs_kes_employee_rate?.toNumber() || 0.01)
      : 0;
    const bpjs_kes_company = employee.bpjs_kesehatan_number
      ? bpjsKesSalary * (settings.bpjs_kes_company_rate?.toNumber() || 0.04)
      : 0;

    // BPJS Ketenagakerjaan - JHT
    const bpjs_jht_employee = employee.jht_registered
      ? basicSalary * (settings.bpjs_jht_employee_rate?.toNumber() || 0.02)
      : 0;
    const bpjs_jht_company = employee.jht_registered
      ? basicSalary * (settings.bpjs_jht_company_rate?.toNumber() || 0.037)
      : 0;

    // BPJS Ketenagakerjaan - JP
    const bpjsJpMaxSalary = settings.bpjs_jp_max_salary?.toNumber() || 10042300;
    const bpjsJpSalary = Math.min(basicSalary, bpjsJpMaxSalary);
    const bpjs_jp_employee = employee.jp_registered
      ? bpjsJpSalary * (settings.bpjs_jp_employee_rate?.toNumber() || 0.01)
      : 0;
    const bpjs_jp_company = employee.jp_registered
      ? bpjsJpSalary * (settings.bpjs_jp_company_rate?.toNumber() || 0.02)
      : 0;

    // BPJS JKK & JKM (company only)
    const bpjs_jkk_company = employee.bpjs_ketenagakerjaan_number
      ? basicSalary * (settings.bpjs_jkk_rate?.toNumber() || 0.0024)
      : 0;
    const bpjs_jkm_company = employee.bpjs_ketenagakerjaan_number
      ? basicSalary * (settings.bpjs_jkm_rate?.toNumber() || 0.003)
      : 0;

    return {
      bpjs_kes_employee: Math.round(bpjs_kes_employee),
      bpjs_jht_employee: Math.round(bpjs_jht_employee),
      bpjs_jp_employee: Math.round(bpjs_jp_employee),
      bpjs_employee_total: Math.round(bpjs_kes_employee + bpjs_jht_employee + bpjs_jp_employee),
      bpjs_kes_company: Math.round(bpjs_kes_company),
      bpjs_jht_company: Math.round(bpjs_jht_company),
      bpjs_jp_company: Math.round(bpjs_jp_company),
      bpjs_jkk_company: Math.round(bpjs_jkk_company),
      bpjs_jkm_company: Math.round(bpjs_jkm_company),
      bpjs_company_total: Math.round(bpjs_kes_company + bpjs_jht_company + bpjs_jp_company + bpjs_jkk_company + bpjs_jkm_company),
    };
  }

  private async calculateTax(
    grossSalary: number,
    bpjs: BPJSCalculation,
    settings: any,
    employee: any,
    paidByCompany: boolean = false
  ): Promise<TaxCalculation> {
    // Position cost deduction (5% of gross, max 500k/month)
    const positionCostRate = settings.position_cost_rate?.toNumber() || 0.05;
    const positionCostMax = settings.position_cost_max?.toNumber() || 500000;
    const positionCost = Math.min(grossSalary * positionCostRate, positionCostMax);

    // Neto = Gross - BPJS Employee - Position Cost
    const netoMonthly = grossSalary - bpjs.bpjs_employee_total - positionCost;
    const netoYearly = netoMonthly * 12;

    // Get PTKP
    const ptkpStatus = employee.ptkp_status || employee.tax_status || 'TK/0';
    const ptkp = await prisma.pTKP.findUnique({
      where: { status: ptkpStatus },
    });
    const ptkpAmount = ptkp?.amount?.toNumber() || 54000000; // Default TK/0

    // Taxable income (PKP)
    const taxableIncomeYearly = Math.max(0, netoYearly - ptkpAmount);
    const taxableIncomeMonthly = taxableIncomeYearly / 12;

    let pph21 = 0;
    let terRate = 0;
    let terCategory = '';

    if (settings.use_ter_method) {
      // TER Method (simplified)
      terCategory = this.getTerCategory(ptkpStatus);
      terRate = await this.getTerRate(grossSalary, terCategory);
      pph21 = grossSalary * terRate;
    } else {
      // Progressive tax rate
      pph21 = this.calculateProgressiveTax(taxableIncomeYearly) / 12;
    }

    return {
      taxable_income: Math.round(taxableIncomeMonthly),
      pph21: Math.round(pph21),
      pph21_paid_by_company: paidByCompany,
      ter_rate: terRate,
      ter_category: terCategory,
      ptkp_status: ptkpStatus,
      ptkp_amount: ptkpAmount,
    };
  }

  private getTerCategory(ptkpStatus: string): string {
    // TER Category based on PTKP status
    if (ptkpStatus.startsWith('TK/0') || ptkpStatus.startsWith('TK/1')) {
      return 'A';
    } else if (ptkpStatus.startsWith('TK/2') || ptkpStatus.startsWith('TK/3') ||
               ptkpStatus.startsWith('K/0') || ptkpStatus.startsWith('K/1')) {
      return 'B';
    } else {
      return 'C';
    }
  }

  private async getTerRate(monthlyIncome: number, category: string): Promise<number> {
    // TER rates are based on monthly gross income
    const config = await prisma.taxConfiguration.findFirst({
      where: {
        tax_category: `TER_${category}`,
        min_income: { lte: monthlyIncome },
        OR: [
          { max_income: { gte: monthlyIncome } },
          { max_income: null },
        ],
        is_active: true,
      },
    });

    return config?.tax_rate?.toNumber() || 0;
  }

  private calculateProgressiveTax(yearlyTaxableIncome: number): number {
    // Indonesian progressive tax rates (2024)
    const brackets = [
      { limit: 60000000, rate: 0.05 },
      { limit: 250000000, rate: 0.15 },
      { limit: 500000000, rate: 0.25 },
      { limit: 5000000000, rate: 0.30 },
      { limit: Infinity, rate: 0.35 },
    ];

    let tax = 0;
    let remaining = yearlyTaxableIncome;
    let previousLimit = 0;

    for (const bracket of brackets) {
      if (remaining <= 0) break;

      const taxableInBracket = Math.min(remaining, bracket.limit - previousLimit);
      tax += taxableInBracket * bracket.rate;
      remaining -= taxableInBracket;
      previousLimit = bracket.limit;
    }

    return tax;
  }

  private calculateOvertime(hours: number, basicSalary: number, settings: any): number {
    if (hours <= 0) return 0;

    // Hourly rate = basic salary / 173 (standard monthly hours)
    const hourlyRate = basicSalary / 173;
    const overtimeRate = settings.overtime_rate_weekday?.toNumber() || 1.5;

    return Math.round(hours * hourlyRate * overtimeRate);
  }

  // ==========================================
  // PRORATE CALCULATION METHODS
  // ==========================================

  /**
   * Calculate prorate factor for an employee
   * @param input - Prorate calculation input
   * @returns ProrateCalculation result
   */
  async calculateProrate(input: ProrateInput): Promise<ProrateCalculation> {
    const {
      period,
      employee_id,
      join_date,
      resign_date,
      unpaid_leave_days = 0,
      prorate_method = PRORATE_METHODS.WORKING_DAYS,
      custom_factor,
      company_id,
    } = input;

    // If custom factor is provided, use it directly
    if (prorate_method === PRORATE_METHODS.CUSTOM && custom_factor !== undefined) {
      return {
        is_prorated: custom_factor < 1,
        prorate_factor: Math.max(0, Math.min(1, custom_factor)),
        actual_days: 0,
        total_days: 0,
        prorate_reason: 'Manual prorate',
        unpaid_leave_days,
      };
    }

    // Get employee data if not provided
    let employeeJoinDate = join_date ? new Date(join_date) : null;
    let employeeResignDate = resign_date ? new Date(resign_date) : null;
    let employeeCompanyId = company_id;

    if (!employeeJoinDate || !employeeResignDate || !employeeCompanyId) {
      const employee = await prisma.employee.findUnique({
        where: { id: employee_id },
        select: { join_date: true, resign_date: true, company_id: true },
      });

      if (employee) {
        employeeJoinDate = employeeJoinDate || employee.join_date;
        employeeResignDate = employeeResignDate || employee.resign_date;
        employeeCompanyId = employeeCompanyId || employee.company_id || undefined;
      }
    }

    // Get cutoff date from company settings
    let cutoffDate: number | undefined;
    if (employeeCompanyId) {
      const settings = await prisma.payrollSetting.findFirst({
        where: { company_id: employeeCompanyId, is_active: true },
        select: { payroll_cutoff_date: true },
      });
      cutoffDate = settings?.payroll_cutoff_date || undefined;
    }

    // Parse period to get start and end dates (using company cutoff settings)
    const { periodStart, periodEnd } = this.parsePeriod(period, cutoffDate);

    // Determine employee's working period within the payroll period
    const employeeStart = employeeJoinDate && employeeJoinDate > periodStart
      ? employeeJoinDate
      : periodStart;

    const employeeEnd = employeeResignDate && employeeResignDate < periodEnd
      ? employeeResignDate
      : periodEnd;

    // Calculate total working days in period
    let totalDays: number;
    let actualDays: number;

    if (prorate_method === PRORATE_METHODS.CALENDAR_DAYS) {
      totalDays = this.getCalendarDays(periodStart, periodEnd);
      actualDays = this.getCalendarDays(employeeStart, employeeEnd);
    } else {
      // Working days method (default)
      totalDays = await this.getWorkingDays(periodStart, periodEnd, company_id);
      actualDays = await this.getWorkingDays(employeeStart, employeeEnd, company_id);
    }

    // Subtract unpaid leave days
    actualDays = Math.max(0, actualDays - unpaid_leave_days);

    // Calculate prorate factor
    const prorateFactor = totalDays > 0 ? actualDays / totalDays : 0;

    // Determine prorate reason
    let prorateReason = '';
    if (employeeJoinDate && employeeJoinDate > periodStart) {
      prorateReason = 'Join mid-month';
    }
    if (employeeResignDate && employeeResignDate < periodEnd) {
      prorateReason = prorateReason ? prorateReason + ', Resign mid-month' : 'Resign mid-month';
    }
    if (unpaid_leave_days > 0) {
      prorateReason = prorateReason ? prorateReason + ', Unpaid leave' : 'Unpaid leave';
    }

    const isProrated = prorateFactor < 1;

    return {
      is_prorated: isProrated,
      prorate_factor: prorateFactor, // Keep full precision for accurate calculation
      actual_days: actualDays,
      total_days: totalDays,
      prorate_reason: prorateReason || undefined,
      employee_start_date: employeeStart,
      employee_end_date: employeeEnd,
      unpaid_leave_days,
    };
  }

  /**
   * Parse period string (YYYY-MM) to get period start and end dates
   * Uses configurable cutoff date from settings
   * Default: 21 previous month - 20 current month (2026+ rule)
   *
   * @param period - Period string in YYYY-MM format
   * @param cutoffDate - Optional cutoff date (default: 20)
   * @returns Object with periodStart and periodEnd dates
   */
  private parsePeriod(
    period: string,
    cutoffDate?: number
  ): { periodStart: Date; periodEnd: Date } {
    const [year, month] = period.split('-').map(Number);

    // Use provided cutoff or determine based on year
    // 2026+: cutoff = 20, start = 21
    // ≤2025: cutoff = 25, start = 26
    const endCutoff = cutoffDate ?? (year >= 2026 ? 20 : 25);
    const startCutoff = endCutoff + 1; // Start is always day after end cutoff

    // Period start: startCutoff of previous month
    const periodStart = new Date(year, month - 2, startCutoff);

    // Period end: endCutoff of current month
    const periodEnd = new Date(year, month - 1, endCutoff);

    return { periodStart, periodEnd };
  }

  /**
   * Get period dates using company's payroll settings
   * @param period - Period string in YYYY-MM format
   * @param companyId - Company ID to get settings from
   */
  async getPeriodDatesFromSettings(
    period: string,
    companyId: number
  ): Promise<{ periodStart: Date; periodEnd: Date; cutoffDate: number }> {
    const settings = await prisma.payrollSetting.findFirst({
      where: { company_id: companyId, is_active: true },
      select: { payroll_cutoff_date: true },
    });

    const cutoffDate = settings?.payroll_cutoff_date || 20;
    const { periodStart, periodEnd } = this.parsePeriod(period, cutoffDate);

    return { periodStart, periodEnd, cutoffDate };
  }

  /**
   * Get calendar days between two dates (inclusive)
   */
  private getCalendarDays(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  /**
   * Get working days between two dates (excluding weekends and holidays)
   */
  private async getWorkingDays(
    startDate: Date,
    endDate: Date,
    companyId?: number
  ): Promise<number> {
    // Get holidays in the period
    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        is_active: true,
        OR: [
          { company_id: null }, // National holidays
          { company_id: companyId }, // Company-specific holidays
        ],
      },
      select: { date: true },
    });

    const holidayDates = new Set(
      holidays.map((h) => h.date.toISOString().split('T')[0])
    );

    let workingDays = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      const dateStr = current.toISOString().split('T')[0];

      // Count if weekday (Mon-Fri) and not a holiday
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateStr)) {
        workingDays++;
      }

      current.setDate(current.getDate() + 1);
    }

    return workingDays;
  }

  /**
   * Apply prorate factor to salary components
   */
  applyProrate(
    amount: number,
    prorateFactor: number,
    shouldProrate: boolean = true
  ): number {
    if (!shouldProrate || prorateFactor >= 1) {
      return amount;
    }
    return Math.round(amount * prorateFactor);
  }

  /**
   * Get unpaid leave days for an employee in a period
   */
  async getUnpaidLeaveDays(
    employeeId: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    const unpaidLeaves = await prisma.leave.findMany({
      where: {
        employee_id: employeeId,
        status: 'approved',
        start_date: { lte: periodEnd },
        end_date: { gte: periodStart },
        leaveType: {
          is_paid: false,
        },
      },
      select: {
        start_date: true,
        end_date: true,
      },
    });

    let unpaidDays = 0;

    for (const leave of unpaidLeaves) {
      // Calculate overlap with period
      const leaveStart = leave.start_date > periodStart ? leave.start_date : periodStart;
      const leaveEnd = leave.end_date < periodEnd ? leave.end_date : periodEnd;

      // Count only weekdays
      const current = new Date(leaveStart);
      while (current <= leaveEnd) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          unpaidDays++;
        }
        current.setDate(current.getDate() + 1);
      }
    }

    return unpaidDays;
  }

  // ==========================================
  // DEDUCTION CALCULATION METHODS
  // ==========================================

  /**
   * Get default deduction rates from company settings
   */
  private getDefaultDeductionRates(settings: any): DeductionRates {
    return {
      absence_rate: settings.absence_deduction_rate?.toNumber() || 1.0,
      late_rate_per_minute: settings.late_rate_per_minute?.toNumber() || 0,
      late_rate_per_day: settings.late_rate_per_day?.toNumber() || 0.5,
      late_tolerance_minutes: settings.late_tolerance_minutes || 15,
      leave_rate: settings.leave_deduction_rate?.toNumber() || 1.0,
    };
  }

  /**
   * Calculate daily salary rate
   */
  private getDailySalary(basicSalary: number, workingDays: number): number {
    return workingDays > 0 ? basicSalary / workingDays : 0;
  }

  /**
   * Calculate all deductions for payroll
   */
  async calculateDeductions(
    input: DeductionInput,
    settings: any
  ): Promise<DeductionCalculation> {
    const {
      employee_id,
      period,
      basic_salary,
      working_days,
      absent_days = 0,
      late_minutes = 0,
      late_days = 0,
      unpaid_leave_days = 0,
      company_id,
    } = input;

    const rates = this.getDefaultDeductionRates(settings);
    const dailySalary = this.getDailySalary(basic_salary, working_days);
    const details: DeductionDetail[] = [];

    // ==========================================
    // 1. ABSENCE DEDUCTION (Potongan Alpha)
    // Formula: daily_salary × absent_days × rate
    // ==========================================
    const absenceDeduction = absent_days > 0
      ? Math.round(dailySalary * absent_days * rates.absence_rate)
      : 0;

    if (absenceDeduction > 0) {
      details.push({
        type: DEDUCTION_TYPES.ABSENCE,
        description: `Potongan tidak hadir (${absent_days} hari)`,
        amount: absenceDeduction,
      });
    }

    // ==========================================
    // 2. LATE DEDUCTION (Potongan Keterlambatan)
    // Formula (minute-based): (daily_salary / 8 / 60) × late_minutes × rate
    // Formula (day-based): daily_salary × late_days × rate
    // ==========================================
    let lateDeduction = 0;

    if (late_minutes > rates.late_tolerance_minutes && rates.late_rate_per_minute > 0) {
      // Minute-based calculation
      const hourlyRate = dailySalary / 8;
      const minuteRate = hourlyRate / 60;
      const chargeableMinutes = late_minutes - rates.late_tolerance_minutes;
      lateDeduction = Math.round(minuteRate * chargeableMinutes * rates.late_rate_per_minute);
    } else if (late_days > 0 && rates.late_rate_per_day > 0) {
      // Day-based calculation (fallback)
      lateDeduction = Math.round(dailySalary * late_days * rates.late_rate_per_day);
    }

    if (lateDeduction > 0) {
      const lateDesc = late_minutes > 0
        ? `Potongan keterlambatan (${late_minutes} menit)`
        : `Potongan keterlambatan (${late_days} hari)`;
      details.push({
        type: DEDUCTION_TYPES.LATE,
        description: lateDesc,
        amount: lateDeduction,
      });
    }

    // ==========================================
    // 3. LOAN DEDUCTION (Potongan Pinjaman)
    // Fetch from PayrollAdjustment with type='loan'
    // ==========================================
    const loanAdjustments = await this.getApprovedAdjustments(
      employee_id,
      period,
      [DEDUCTION_TYPES.LOAN],
      company_id
    );

    let loanDeduction = 0;
    for (const adj of loanAdjustments) {
      const amount = adj.amount?.toNumber() || 0;
      loanDeduction += amount;
      details.push({
        type: DEDUCTION_TYPES.LOAN,
        description: adj.description || 'Potongan pinjaman',
        amount,
        reference_id: adj.id,
      });
    }

    // ==========================================
    // 4. ADVANCE DEDUCTION (Potongan Kasbon)
    // Fetch from PayrollAdjustment with type='advance'
    // ==========================================
    const advanceAdjustments = await this.getApprovedAdjustments(
      employee_id,
      period,
      [DEDUCTION_TYPES.ADVANCE],
      company_id
    );

    let advanceDeduction = 0;
    for (const adj of advanceAdjustments) {
      const amount = adj.amount?.toNumber() || 0;
      advanceDeduction += amount;
      details.push({
        type: DEDUCTION_TYPES.ADVANCE,
        description: adj.description || 'Potongan kasbon',
        amount,
        reference_id: adj.id,
      });
    }

    // ==========================================
    // 5. UNPAID LEAVE DEDUCTION (Potongan Cuti Tidak Dibayar)
    // Formula: daily_salary × unpaid_leave_days × rate
    // ==========================================
    const leaveDeduction = unpaid_leave_days > 0
      ? Math.round(dailySalary * unpaid_leave_days * rates.leave_rate)
      : 0;

    if (leaveDeduction > 0) {
      details.push({
        type: DEDUCTION_TYPES.LEAVE,
        description: `Potongan cuti tidak dibayar (${unpaid_leave_days} hari)`,
        amount: leaveDeduction,
      });
    }

    // ==========================================
    // 6. PENALTY DEDUCTION (Potongan Denda)
    // Fetch from PayrollAdjustment with type='penalty'
    // ==========================================
    const penaltyAdjustments = await this.getApprovedAdjustments(
      employee_id,
      period,
      [DEDUCTION_TYPES.PENALTY],
      company_id
    );

    let penaltyDeduction = 0;
    for (const adj of penaltyAdjustments) {
      const amount = adj.amount?.toNumber() || 0;
      penaltyDeduction += amount;
      details.push({
        type: DEDUCTION_TYPES.PENALTY,
        description: adj.description || 'Potongan denda',
        amount,
        reference_id: adj.id,
      });
    }

    // ==========================================
    // 7. OTHER DEDUCTIONS (Potongan Lainnya)
    // Fetch from PayrollAdjustment with type='deduction' or 'other'
    // ==========================================
    const otherAdjustments = await this.getApprovedAdjustments(
      employee_id,
      period,
      [DEDUCTION_TYPES.OTHER, 'deduction'],
      company_id
    );

    let otherDeductions = 0;
    for (const adj of otherAdjustments) {
      const amount = adj.amount?.toNumber() || 0;
      otherDeductions += amount;
      details.push({
        type: DEDUCTION_TYPES.OTHER,
        description: adj.description || 'Potongan lainnya',
        amount,
        reference_id: adj.id,
      });
    }

    // ==========================================
    // TOTAL DEDUCTIONS
    // ==========================================
    const totalDeductions = absenceDeduction + lateDeduction + loanDeduction +
      advanceDeduction + leaveDeduction + penaltyDeduction + otherDeductions;

    return {
      absence_deduction: absenceDeduction,
      late_deduction: lateDeduction,
      loan_deduction: loanDeduction,
      advance_deduction: advanceDeduction,
      leave_deduction: leaveDeduction,
      penalty_deduction: penaltyDeduction,
      other_deductions: otherDeductions,
      total_deductions: totalDeductions,
      deduction_details: details,
    };
  }

  /**
   * Get approved payroll adjustments for an employee in a period
   */
  private async getApprovedAdjustments(
    employeeId: number,
    period: string,
    types: string[],
    companyId?: number
  ): Promise<any[]> {
    const { periodStart, periodEnd } = this.parsePeriod(period);

    return prisma.payrollAdjustment.findMany({
      where: {
        employee_id: employeeId,
        status: 'approved',
        type: { in: types },
        OR: [
          // Specific pay_period
          { pay_period: period },
          // Effective date within period
          {
            effective_date: {
              gte: periodStart,
              lte: periodEnd,
            },
          },
          // Recurring adjustments
          {
            is_recurring: true,
            effective_date: { lte: periodEnd },
            OR: [
              { recurring_end_date: null },
              { recurring_end_date: { gte: periodStart } },
            ],
          },
        ],
      },
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        reference_number: true,
      },
    });
  }

  /**
   * Get attendance summary for an employee in a period
   * Fetches absence days, late minutes from Attendance records
   */
  async getAttendanceSummary(
    employeeId: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<{ absent_days: number; late_minutes: number; late_days: number }> {
    // Get attendance records for the period
    const attendances = await prisma.attendance.findMany({
      where: {
        employee_id: employeeId,
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        status: true,
        late_minutes: true,
      },
    });

    let absentDays = 0;
    let totalLateMinutes = 0;
    let lateDays = 0;

    for (const att of attendances) {
      // Count absences (alpha)
      if (att.status === 'alpha' || att.status === 'absent') {
        absentDays++;
      }
      // Count late (based on late_minutes > 0 or status = 'late')
      const lateMinutes = att.late_minutes || 0;
      if (lateMinutes > 0 || att.status === 'late') {
        lateDays++;
        totalLateMinutes += lateMinutes;
      }
    }

    return {
      absent_days: absentDays,
      late_minutes: totalLateMinutes,
      late_days: lateDays,
    };
  }

  async update(id: number, data: UpdatePayrollDTO, user: AuthUser) {
    const existing = await prisma.payroll.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Payroll not found');
    }

    if (!await canAccessEmployee(user, existing.employee_id)) {
      throw new Error('Access denied');
    }

    if (existing.status !== PAYROLL_STATUS.DRAFT) {
      throw new Error('Can only update draft payrolls');
    }

    return prisma.payroll.update({
      where: { id },
      data,
      select: PAYROLL_DETAIL_SELECT,
    });
  }

  async validate(id: number, user: AuthUser) {
    const existing = await prisma.payroll.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Payroll not found');
    }

    if (existing.status !== PAYROLL_STATUS.DRAFT) {
      throw new Error('Can only validate draft payrolls');
    }

    return prisma.payroll.update({
      where: { id },
      data: {
        status: PAYROLL_STATUS.VALIDATED,
        validated_by: user.employee?.id,
        validated_at: new Date(),
      },
      select: PAYROLL_DETAIL_SELECT,
    });
  }

  async submit(id: number, user: AuthUser) {
    const existing = await prisma.payroll.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Payroll not found');
    }

    if (existing.status !== PAYROLL_STATUS.VALIDATED) {
      throw new Error('Can only submit validated payrolls');
    }

    return prisma.payroll.update({
      where: { id },
      data: {
        status: PAYROLL_STATUS.SUBMITTED,
        submitted_by: user.employee?.id,
        submitted_at: new Date(),
      },
      select: PAYROLL_DETAIL_SELECT,
    });
  }

  async approve(id: number, data: ApprovePayrollDTO, user: AuthUser) {
    const existing = await prisma.payroll.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Payroll not found');
    }

    if (existing.status !== PAYROLL_STATUS.SUBMITTED) {
      throw new Error('Can only approve submitted payrolls');
    }

    return prisma.payroll.update({
      where: { id },
      data: {
        status: PAYROLL_STATUS.APPROVED,
        approved_by: user.employee?.id,
        approved_at: new Date(),
        hr_notes: data.approval_notes,
      },
      select: PAYROLL_DETAIL_SELECT,
    });
  }

  async reject(id: number, data: RejectPayrollDTO, user: AuthUser) {
    const existing = await prisma.payroll.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Payroll not found');
    }

    if (existing.status !== PAYROLL_STATUS.SUBMITTED) {
      throw new Error('Can only reject submitted payrolls');
    }

    return prisma.payroll.update({
      where: { id },
      data: {
        status: PAYROLL_STATUS.REJECTED,
        rejected_by: user.employee?.id,
        rejected_at: new Date(),
        rejection_reason: data.rejection_reason,
      },
      select: PAYROLL_DETAIL_SELECT,
    });
  }

  async markAsPaid(id: number, data: MarkAsPaidDTO, user: AuthUser) {
    const existing = await prisma.payroll.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Payroll not found');
    }

    if (existing.status !== PAYROLL_STATUS.APPROVED) {
      throw new Error('Can only mark approved payrolls as paid');
    }

    return prisma.payroll.update({
      where: { id },
      data: {
        status: PAYROLL_STATUS.PAID,
        paid_by: user.employee?.id,
        paid_at: new Date(),
        payment_reference: data.payment_reference,
        payment_method: data.payment_method,
      },
      select: PAYROLL_DETAIL_SELECT,
    });
  }

  // ==========================================
  // BULK OPERATIONS
  // ==========================================

  async bulkSubmit(ids: number[], user: AuthUser): Promise<{ success: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        const existing = await prisma.payroll.findUnique({ where: { id } });
        if (!existing) {
          errors.push(`Payroll ${id}: Not found`);
          failed++;
          continue;
        }

        // Allow submit from draft or validated status
        if (existing.status !== PAYROLL_STATUS.DRAFT && existing.status !== PAYROLL_STATUS.VALIDATED) {
          errors.push(`Payroll ${id}: Can only submit draft or validated payrolls (current: ${existing.status})`);
          failed++;
          continue;
        }

        await prisma.payroll.update({
          where: { id },
          data: {
            status: PAYROLL_STATUS.SUBMITTED,
            submitted_at: new Date(),
          },
        });
        success++;
      } catch (error: any) {
        errors.push(`Payroll ${id}: ${error.message}`);
        failed++;
      }
    }

    return { success, failed, errors };
  }

  async bulkApprove(ids: number[], data: ApprovePayrollDTO, user: AuthUser): Promise<{ success: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        const existing = await prisma.payroll.findUnique({ where: { id } });
        if (!existing) {
          errors.push(`Payroll ${id}: Not found`);
          failed++;
          continue;
        }

        if (existing.status !== PAYROLL_STATUS.SUBMITTED) {
          errors.push(`Payroll ${id}: Can only approve submitted payrolls (current: ${existing.status})`);
          failed++;
          continue;
        }

        await prisma.payroll.update({
          where: { id },
          data: {
            status: PAYROLL_STATUS.APPROVED,
            approved_by: user.employee?.id,
            approved_at: new Date(),
            hr_notes: data.approval_notes,
          },
        });
        success++;
      } catch (error: any) {
        errors.push(`Payroll ${id}: ${error.message}`);
        failed++;
      }
    }

    return { success, failed, errors };
  }

  async bulkReject(ids: number[], data: RejectPayrollDTO, user: AuthUser): Promise<{ success: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        const existing = await prisma.payroll.findUnique({ where: { id } });
        if (!existing) {
          errors.push(`Payroll ${id}: Not found`);
          failed++;
          continue;
        }

        if (existing.status !== PAYROLL_STATUS.SUBMITTED) {
          errors.push(`Payroll ${id}: Can only reject submitted payrolls (current: ${existing.status})`);
          failed++;
          continue;
        }

        await prisma.payroll.update({
          where: { id },
          data: {
            status: PAYROLL_STATUS.REJECTED,
            rejected_by: user.employee?.id,
            rejected_at: new Date(),
            rejection_reason: data.rejection_reason,
          },
        });
        success++;
      } catch (error: any) {
        errors.push(`Payroll ${id}: ${error.message}`);
        failed++;
      }
    }

    return { success, failed, errors };
  }

  // ==========================================
  // PAYROLL SETTINGS METHODS
  // ==========================================

  async getSettings(companyId: number, user: AuthUser) {
    if (!hasCompanyAccess(user, companyId)) {
      throw new Error('Access denied to this company');
    }

    return this.getOrCreateSettings(companyId);
  }

  async updateSettings(companyId: number, data: UpdatePayrollSettingDTO, user: AuthUser) {
    if (!hasCompanyAccess(user, companyId)) {
      throw new Error('Access denied to this company');
    }

    return prisma.payrollSetting.upsert({
      where: { company_id: companyId },
      update: data,
      create: {
        company_id: companyId,
        ...data,
      },
      select: PAYROLL_SETTING_SELECT,
    });
  }

  private async getOrCreateSettings(companyId: number) {
    let settings = await prisma.payrollSetting.findUnique({
      where: { company_id: companyId },
      select: PAYROLL_SETTING_SELECT,
    });

    if (!settings) {
      settings = await prisma.payrollSetting.create({
        data: { company_id: companyId },
        select: PAYROLL_SETTING_SELECT,
      });
    }

    return settings;
  }

  // ==========================================
  // SALARY COMPONENT METHODS
  // ==========================================

  async listSalaryComponents(query: SalaryComponentQuery, user: AuthUser) {
    const { page = 1, limit = 10, company_id, type, category, is_active } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SalaryComponentWhereInput = {};

    if (company_id) {
      where.company_id = company_id;
    } else if (user.employee?.company_id) {
      where.OR = [
        { company_id: user.employee.company_id },
        { company_id: null },
      ];
    }

    if (type) where.type = type;
    if (category) where.category = category;
    if (is_active !== undefined) where.is_active = is_active;

    const [data, total] = await Promise.all([
      prisma.salaryComponent.findMany({
        where,
        select: SALARY_COMPONENT_SELECT,
        skip,
        take: limit,
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      }),
      prisma.salaryComponent.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createSalaryComponent(data: CreateSalaryComponentDTO, user: AuthUser) {
    if (data.company_id && !hasCompanyAccess(user, data.company_id)) {
      throw new Error('Access denied to this company');
    }

    return prisma.salaryComponent.create({
      data: {
        ...data,
        effective_from: data.effective_from ? new Date(data.effective_from) : undefined,
        effective_until: data.effective_until ? new Date(data.effective_until) : undefined,
      },
      select: SALARY_COMPONENT_SELECT,
    });
  }

  async updateSalaryComponent(id: number, data: UpdateSalaryComponentDTO, user: AuthUser) {
    const existing = await prisma.salaryComponent.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Salary component not found');
    }

    if (existing.company_id && !hasCompanyAccess(user, existing.company_id)) {
      throw new Error('Access denied');
    }

    return prisma.salaryComponent.update({
      where: { id },
      data: {
        ...data,
        effective_from: data.effective_from ? new Date(data.effective_from) : undefined,
        effective_until: data.effective_until ? new Date(data.effective_until) : undefined,
      },
      select: SALARY_COMPONENT_SELECT,
    });
  }

  async deleteSalaryComponent(id: number, user: AuthUser) {
    const existing = await prisma.salaryComponent.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Salary component not found');
    }

    if (existing.company_id && !hasCompanyAccess(user, existing.company_id)) {
      throw new Error('Access denied');
    }

    return prisma.salaryComponent.update({
      where: { id },
      data: { is_active: false },
    });
  }

  // ==========================================
  // SALARY GRADE METHODS
  // ==========================================

  async listSalaryGrades() {
    return prisma.salaryGrade.findMany({
      where: { status: 'active' },
      select: SALARY_GRADE_SELECT,
      orderBy: { level: 'asc' },
    });
  }

  async createSalaryGrade(data: CreateSalaryGradeDTO, user: AuthUser) {
    return prisma.salaryGrade.create({
      data,
      select: SALARY_GRADE_SELECT,
    });
  }

  async updateSalaryGrade(id: number, data: UpdateSalaryGradeDTO, user: AuthUser) {
    const existing = await prisma.salaryGrade.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Salary grade not found');
    }

    return prisma.salaryGrade.update({
      where: { id },
      data,
      select: SALARY_GRADE_SELECT,
    });
  }

  async deleteSalaryGrade(id: number, user: AuthUser) {
    const existing = await prisma.salaryGrade.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Salary grade not found');
    }

    return prisma.salaryGrade.update({
      where: { id },
      data: { status: 'inactive' },
    });
  }

  // ==========================================
  // PAYROLL ADJUSTMENT METHODS
  // ==========================================

  async listAdjustments(query: PayrollAdjustmentQuery, user: AuthUser) {
    const { page = 1, limit = 10, employee_id, company_id, type, status, pay_period } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PayrollAdjustmentWhereInput = {};

    if (employee_id) where.employee_id = employee_id;
    if (company_id) where.company_id = company_id;
    if (type) where.type = type;
    if (status) where.status = status;
    if (pay_period) where.pay_period = pay_period;

    const [data, total] = await Promise.all([
      prisma.payrollAdjustment.findMany({
        where,
        select: PAYROLL_ADJUSTMENT_SELECT,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.payrollAdjustment.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createAdjustment(data: CreatePayrollAdjustmentDTO, user: AuthUser) {
    if (!await canAccessEmployee(user, data.employee_id)) {
      throw new Error('Access denied to this employee');
    }

    const employee = await prisma.employee.findUnique({
      where: { id: data.employee_id },
      select: { company_id: true },
    });

    return prisma.payrollAdjustment.create({
      data: {
        ...data,
        company_id: employee?.company_id,
        effective_date: data.effective_date ? new Date(data.effective_date) : undefined,
        recurring_end_date: data.recurring_end_date ? new Date(data.recurring_end_date) : undefined,
        created_by: user.id,
        status: 'pending',
      },
      select: PAYROLL_ADJUSTMENT_SELECT,
    });
  }

  async approveAdjustment(id: number, data: ApproveAdjustmentDTO, user: AuthUser) {
    const existing = await prisma.payrollAdjustment.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Adjustment not found');
    }

    if (existing.status !== 'pending') {
      throw new Error('Can only approve pending adjustments');
    }

    return prisma.payrollAdjustment.update({
      where: { id },
      data: {
        status: 'approved',
        approved_by: user.employee?.id,
        approved_at: new Date(),
      },
      select: PAYROLL_ADJUSTMENT_SELECT,
    });
  }

  async rejectAdjustment(id: number, data: RejectAdjustmentDTO, user: AuthUser) {
    const existing = await prisma.payrollAdjustment.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Adjustment not found');
    }

    if (existing.status !== 'pending') {
      throw new Error('Can only reject pending adjustments');
    }

    return prisma.payrollAdjustment.update({
      where: { id },
      data: {
        status: 'rejected',
        rejection_reason: data.rejection_reason,
      },
      select: PAYROLL_ADJUSTMENT_SELECT,
    });
  }

  // ==========================================
  // EXPORT
  // ==========================================

  async exportToExcel(companyId: number | null, period: string, user: AuthUser) {
    // If companyId is provided, check access
    if (companyId && !hasCompanyAccess(user, companyId)) {
      throw new Error('Access denied to this company');
    }

    // Build where clause based on companyId
    const whereClause: Prisma.PayrollWhereInput = { period };

    if (companyId) {
      // Single company export
      whereClause.employee = { company_id: companyId };
    } else {
      // All companies - filter by user's accessible companies
      const accessibleCompanyIds = user.accessibleCompanyIds || [];
      if (accessibleCompanyIds.length === 0) {
        throw new Error('No accessible companies');
      }
      whereClause.employee = { company_id: { in: accessibleCompanyIds } };
    }

    // Get all payrolls for the period with detailed employee info
    const payrolls = await prisma.payroll.findMany({
      where: whereClause,
      select: {
        id: true,
        period: true,
        pay_type: true,
        ptkp_status: true,
        basic_salary: true,
        position_allowance: true,
        transport_allowance: true,
        meal_allowance: true,
        overtime_hours: true,
        overtime_rate: true,
        overtime_pay: true,
        total_gross: true,
        gross_up_initial: true,
        final_gross_up: true,
        ter_rate: true,
        ter_rate_initial: true,
        ter_category: true,
        pph21: true,
        bpjs_jht_company: true,
        bpjs_jkm_company: true,
        bpjs_jkk_company: true,
        bpjs_kes_company: true,
        bpjs_jp_company: true,
        bpjs_jht_employee: true,
        bpjs_jp_employee: true,
        bpjs_kes_employee: true,
        bpjs_employee_total: true,
        bpjs_company_total: true,
        total_deductions: true,
        absence_deduction: true,
        late_deduction: true,
        loan_deduction: true,
        other_deductions: true,
        deductions_detail: true,
        net_salary: true,
        thp: true,
        working_days: true,
        actual_working_days: true,
        status: true,
        allowances_detail: true,
        other_allowances: true,
        employee: {
          select: {
            id: true,
            employee_id: true,
            name: true,
            job_title: true,
            basic_salary: true,
            transport_allowance: true,
            meal_allowance: true,
            position_allowance: true,
            communication_allowance: true,
            housing_allowance: true,
            other_allowances: true,
            tax_status: true,
            pay_type: true,
            join_date: true,
            resign_date: true,
            probation_end_date: true,
            contract_end_date: true,
            bank_name: true,
            bank_account_number: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
            position: {
              select: {
                id: true,
                name: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { employee: { company: { name: 'asc' } } },
        { employee: { name: 'asc' } },
      ],
    });

    // Sort payrolls with custom company order: PFI, GDI, LFS, UOR, BCI, PDR, then others
    // Company order priority
    const companyOrder = [
      'PATH FINDER',      // PFI
      'GROWPATH',         // GDI
      'LAMPUNG FARM',     // LFS
      'UOR KREATIF',      // UOR
      'BUKA CERITA',      // BCI
      'PILAR DANA',       // PDR
    ];

    const getCompanyPriority = (companyName: string): number => {
      const upperName = companyName.toUpperCase();
      for (let i = 0; i < companyOrder.length; i++) {
        if (upperName.includes(companyOrder[i])) {
          return i;
        }
      }
      return companyOrder.length; // Other companies come last
    };

    const sortedPayrolls = [...payrolls].sort((a, b) => {
      const companyA = a.employee?.company?.name || '';
      const companyB = b.employee?.company?.name || '';

      // Compare by company priority order
      const priorityA = getCompanyPriority(companyA);
      const priorityB = getCompanyPriority(companyB);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Same priority - sort by company name alphabetically
      if (companyA !== companyB) {
        return companyA.localeCompare(companyB);
      }

      // Then by employee name
      const nameA = a.employee?.name || '';
      const nameB = b.employee?.name || '';
      return nameA.localeCompare(nameB);
    });

    // Determine company name for header
    let headerCompanyName = 'PFI Groups';
    if (companyId) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true },
      });
      headerCompanyName = company?.name || 'Unknown';
    }

    // Generate Excel using export service
    const preparedBy = user.employee?.name || user.email || 'System';
    return payrollExportService.generateExcel(sortedPayrolls, period, headerCompanyName, preparedBy);
  }
}
