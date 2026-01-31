/**
 * Payroll Calculation Service
 * Matches Laravel PayrollService and TaxCalculationService exactly
 *
 * Main orchestrator for all payroll calculations
 */

import { TERRateService, terRateService } from './ter-rate.service';
import { BPJSService, bpjsService, BPJSCalculationResult } from './bpjs.service';

export interface SalaryComponents {
  basic_salary: number;
  allowances: number;
  transport_allowance: number;
  meal_allowance: number;
  position_allowance: number;
  overtime: number;
}

export interface TaxCalculationResult {
  monthly_tax: number;
  annual_tax: number;
  gross_salary: number;
  gross_up_amount: number;
  gross_up_initial: number;
  ter_rate: number;
  ter_rate_initial: number;
  effective_rate: number;
  taxable_income: number;
  ptkp_monthly: number;
  ptkp_used: string;
  calculation_type: string;
  ter_golongan: string;
}

export interface PayrollCalculationResult {
  // Salary components
  basic_salary: number;
  allowances: number;
  transport_allowance: number;
  meal_allowance: number;
  position_allowance: number;
  overtime: number;

  // Gross calculations
  total_gross: number;
  gross_up_initial: number;
  final_gross_up: number;

  // BPJS Object PPH21
  bpjs_object_pph21: number;
  sub_total_bpjs_object_pph21: number;

  // Tax
  pph21: number;
  ter_rate: number;
  ter_rate_initial: number;
  ter_golongan: string;

  // BPJS
  bpjs_kes_employee: number;
  bpjs_jht_employee: number;
  bpjs_jp_employee: number;
  bpjs_employee_total: number;
  bpjs_kes_company: number;
  bpjs_jht_company: number;
  bpjs_jp_company: number;
  bpjs_jkk_company: number;
  bpjs_jkm_company: number;
  bpjs_company_total: number;

  // Deductions
  total_deductions: number;
  allowance_bpjs_pph: number;

  // Final amounts
  net_salary: number;
  thp: number;
  total_cost_company: number;

  // Who pays
  company_pays_tax: number;
  company_pays_bpjs: number;
  employee_pays_tax: number;
  employee_pays_bpjs: number;

  // Pay type
  pay_type: string;
}

export class PayrollCalculationService {
  private terService: TERRateService;
  private bpjsService: BPJSService;

  constructor() {
    this.terService = terRateService;
    this.bpjsService = bpjsService;
  }

  /**
   * Main calculation method - calculates payroll based on pay type
   */
  calculate(
    basicSalary: number,
    allowances: number,
    overtime: number,
    taxStatus: string,
    payType: string,
    transportAllowance: number = 0,
    mealAllowance: number = 0,
    positionAllowance: number = 0
  ): PayrollCalculationResult {
    // 1. Calculate BPJS (always use FULL basic salary)
    const bpjsCalc = this.bpjsService.calculate(basicSalary, payType);

    // 2. Calculate Tax based on pay type
    const taxCalc = payType === 'net' || payType === 'nett' || payType === 'gross_up'
      ? this.calculateGrossUp(basicSalary, allowances, overtime, taxStatus, bpjsCalc.object_pph21)
      : this.calculateRegular(basicSalary, allowances, overtime, taxStatus, bpjsCalc.object_pph21);

    // 3. Calculate final amounts
    const finalAmounts = this.calculateFinalAmounts(
      basicSalary,
      allowances,
      overtime,
      bpjsCalc,
      taxCalc,
      payType
    );

    return {
      // Salary components
      basic_salary: basicSalary,
      allowances,
      transport_allowance: transportAllowance,
      meal_allowance: mealAllowance,
      position_allowance: positionAllowance,
      overtime,

      // Gross calculations
      total_gross: finalAmounts.total_gross,
      gross_up_initial: taxCalc.gross_up_initial,
      final_gross_up: taxCalc.gross_up_amount,

      // BPJS Object PPH21
      bpjs_object_pph21: bpjsCalc.object_pph21,
      sub_total_bpjs_object_pph21: finalAmounts.total_gross + bpjsCalc.object_pph21,

      // Tax
      pph21: taxCalc.monthly_tax,
      ter_rate: taxCalc.ter_rate,
      ter_rate_initial: taxCalc.ter_rate_initial,
      ter_golongan: taxCalc.ter_golongan,

      // BPJS
      bpjs_kes_employee: bpjsCalc.details.jks_employee,
      bpjs_jht_employee: bpjsCalc.details.jht_employee,
      bpjs_jp_employee: bpjsCalc.details.jp_employee,
      bpjs_employee_total: bpjsCalc.employee_total,
      bpjs_kes_company: bpjsCalc.details.jks_company,
      bpjs_jht_company: bpjsCalc.details.jht_company,
      bpjs_jp_company: bpjsCalc.details.jp_company,
      bpjs_jkk_company: bpjsCalc.details.jkk_company,
      bpjs_jkm_company: bpjsCalc.details.jkm_company,
      bpjs_company_total: bpjsCalc.company_total,

      // Deductions
      total_deductions: finalAmounts.total_deductions,
      allowance_bpjs_pph: finalAmounts.allowance_bpjs_pph,

      // Final amounts
      net_salary: finalAmounts.net_salary,
      thp: finalAmounts.thp,
      total_cost_company: finalAmounts.total_cost_company,

      // Who pays
      company_pays_tax: finalAmounts.company_pays_tax,
      company_pays_bpjs: finalAmounts.company_pays_bpjs,
      employee_pays_tax: finalAmounts.employee_pays_tax,
      employee_pays_bpjs: finalAmounts.employee_pays_bpjs,

      // Pay type
      pay_type: payType,
    };
  }

  /**
   * Calculate PPh21 for Gross Up / NETT mode
   * Company pays tax, employee receives target net
   */
  private calculateGrossUp(
    basicSalary: number,
    allowances: number,
    overtime: number,
    taxStatus: string,
    objectPph21: number
  ): TaxCalculationResult {
    if (basicSalary <= 0) {
      return this.getZeroSalaryResult(allowances, overtime, taxStatus);
    }

    const terGolongan = this.terService.getTERGolongan(taxStatus);
    const ptkpMonthly = this.terService.getPTKP(taxStatus) / 12;

    // Target net = basic salary (what employee should receive)
    const targetNet = basicSalary;
    const subTotalAllowance = allowances + overtime;
    const bpjsObjectPph21 = objectPph21;

    // Total gross before gross-up = target net + allowances + BPJS object
    const totalGross = targetNet + subTotalAllowance + bpjsObjectPph21;

    // Gross up with iteration
    const grossUpResult = this.terService.calculateGrossUpWithIteration(totalGross, terGolongan);

    const monthlyTax = Math.round(grossUpResult.gross_up_amount * grossUpResult.ter_rate);
    const taxableIncome = Math.max(0, (grossUpResult.gross_up_amount * 12) - (ptkpMonthly * 12));
    const effectiveRate = grossUpResult.gross_up_amount > 0
      ? (monthlyTax / grossUpResult.gross_up_amount) * 100
      : 0;

    return {
      monthly_tax: monthlyTax,
      annual_tax: monthlyTax * 12,
      gross_salary: Math.round(grossUpResult.gross_up_amount),
      gross_up_amount: Math.round(grossUpResult.gross_up_amount),
      gross_up_initial: Math.round(grossUpResult.gross_up_initial),
      ter_rate: grossUpResult.ter_rate,
      ter_rate_initial: grossUpResult.ter_rate_initial,
      effective_rate: effectiveRate,
      taxable_income: Math.round(taxableIncome),
      ptkp_monthly: ptkpMonthly,
      ptkp_used: taxStatus,
      calculation_type: 'gross_up',
      ter_golongan: terGolongan,
    };
  }

  /**
   * Calculate PPh21 for Regular GROSS mode
   * Employee pays tax
   */
  private calculateRegular(
    basicSalary: number,
    allowances: number,
    overtime: number,
    taxStatus: string,
    objectPph21: number
  ): TaxCalculationResult {
    const terGolongan = this.terService.getTERGolongan(taxStatus);
    const ptkpMonthly = this.terService.getPTKP(taxStatus) / 12;

    const grossSalary = basicSalary + allowances + overtime;

    if (grossSalary <= 0) {
      return {
        monthly_tax: 0,
        annual_tax: 0,
        gross_salary: 0,
        gross_up_amount: 0,
        gross_up_initial: 0,
        ter_rate: 0,
        ter_rate_initial: 0,
        effective_rate: 0,
        taxable_income: 0,
        ptkp_monthly: ptkpMonthly,
        ptkp_used: taxStatus,
        calculation_type: 'regular',
        ter_golongan: terGolongan,
      };
    }

    const bpjsObjectPph21 = objectPph21;
    const totalGross = grossSalary + bpjsObjectPph21;

    // Gross up with iteration (for TER rate calculation)
    const grossUpResult = this.terService.calculateGrossUpWithIteration(totalGross, terGolongan);

    const monthlyTax = Math.round(grossUpResult.gross_up_amount * grossUpResult.ter_rate);
    const taxableIncome = Math.max(0, grossUpResult.gross_up_amount - ptkpMonthly);
    const effectiveRate = grossUpResult.gross_up_amount > 0
      ? (monthlyTax / grossUpResult.gross_up_amount) * 100
      : 0;

    return {
      monthly_tax: monthlyTax,
      annual_tax: monthlyTax * 12,
      gross_salary: Math.round(grossUpResult.gross_up_amount),
      gross_up_amount: Math.round(grossUpResult.gross_up_amount),
      gross_up_initial: Math.round(grossUpResult.gross_up_initial),
      ter_rate: grossUpResult.ter_rate,
      ter_rate_initial: grossUpResult.ter_rate_initial,
      effective_rate: effectiveRate,
      taxable_income: Math.round(taxableIncome),
      ptkp_monthly: ptkpMonthly,
      ptkp_used: taxStatus,
      calculation_type: 'regular',
      ter_golongan: terGolongan,
    };
  }

  /**
   * Get result for zero basic salary
   */
  private getZeroSalaryResult(allowances: number, overtime: number, taxStatus: string): TaxCalculationResult {
    const ptkpMonthly = this.terService.getPTKP(taxStatus) / 12;
    const terGolongan = this.terService.getTERGolongan(taxStatus);

    return {
      monthly_tax: 0,
      annual_tax: 0,
      gross_salary: allowances + overtime,
      gross_up_amount: allowances + overtime,
      gross_up_initial: allowances + overtime,
      ter_rate: 0,
      ter_rate_initial: 0,
      effective_rate: 0,
      taxable_income: 0,
      ptkp_monthly: ptkpMonthly,
      ptkp_used: taxStatus,
      calculation_type: 'gross_up',
      ter_golongan: terGolongan,
    };
  }

  /**
   * Calculate final amounts based on pay type
   */
  private calculateFinalAmounts(
    basicSalary: number,
    allowances: number,
    overtime: number,
    bpjsCalc: BPJSCalculationResult,
    taxCalc: TaxCalculationResult,
    payType: string
  ): {
    total_gross: number;
    net_salary: number;
    thp: number;
    total_deductions: number;
    allowance_bpjs_pph: number;
    total_cost_company: number;
    company_pays_tax: number;
    company_pays_bpjs: number;
    employee_pays_tax: number;
    employee_pays_bpjs: number;
  } {
    const isNett = payType === 'net' || payType === 'nett' || payType === 'gross_up';
    const totalGross = basicSalary + allowances + overtime;

    if (isNett) {
      // NETT mode: Company pays tax and BPJS
      // Employee receives basic salary + allowances + overtime as take home pay
      const thp = basicSalary + allowances + overtime; // Target net = basic salary + allowances + overtime
      const totalDeductions = 0; // No deductions from employee
      const allowanceBpjsPph = 0; // Employee doesn't pay

      // Company costs
      const companyPaysTax = taxCalc.monthly_tax;
      const companyPaysBpjs = bpjsCalc.company_total + bpjsCalc.employee_total; // Company pays both
      const totalCostCompany = taxCalc.gross_up_amount + bpjsCalc.company_total;

      return {
        total_gross: totalGross,
        net_salary: totalGross,
        thp,
        total_deductions: totalDeductions,
        allowance_bpjs_pph: allowanceBpjsPph,
        total_cost_company: totalCostCompany,
        company_pays_tax: companyPaysTax,
        company_pays_bpjs: companyPaysBpjs,
        employee_pays_tax: 0,
        employee_pays_bpjs: 0,
      };
    } else {
      // GROSS mode: Employee pays tax and BPJS
      // Use final PPH21 (after gross-up iteration) - same as shown in breakdown
      const pph21Employee = taxCalc.monthly_tax;
      const employeeBpjs = bpjsCalc.employee_total;
      const totalDeductions = pph21Employee + employeeBpjs;
      const allowanceBpjsPph = employeeBpjs + pph21Employee;

      const netSalary = totalGross;
      const thp = totalGross - pph21Employee - employeeBpjs;

      // Company costs
      const companyPaysTax = taxCalc.monthly_tax; // For reporting
      const companyPaysBpjs = bpjsCalc.company_total;
      const totalCostCompany = totalGross + bpjsCalc.company_total;

      return {
        total_gross: totalGross,
        net_salary: netSalary,
        thp,
        total_deductions: totalDeductions,
        allowance_bpjs_pph: allowanceBpjsPph,
        total_cost_company: totalCostCompany,
        company_pays_tax: 0, // Company doesn't pay tax in GROSS mode
        company_pays_bpjs: companyPaysBpjs,
        employee_pays_tax: pph21Employee,
        employee_pays_bpjs: employeeBpjs,
      };
    }
  }
}

export const payrollCalculationService = new PayrollCalculationService();
