/**
 * BPJS Calculation Service
 * Matches Laravel BPJSCalculationService exactly
 *
 * Handles all BPJS calculations:
 * - JHT (Jaminan Hari Tua)
 * - JKM (Jaminan Kematian)
 * - JKK (Jaminan Kecelakaan Kerja)
 * - JKS (Jaminan Kesehatan) - BPJS Kesehatan
 * - JP (Jaminan Pensiun)
 */

// BPJS Caps sesuai regulasi 2025
export const JKS_CAP = 12000000;  // 12 juta cap untuk JKS
export const JP_CAP = 10547400;   // 10,547,400 cap untuk JP

// BPJS Rates sesuai regulasi 2025
export const BPJS_RATES = {
  company: {
    jht: 0.037,   // 3.70%
    jkm: 0.003,   // 0.30%
    jkk: 0.0024,  // 0.24%
    jks: 0.04,    // 4.00%
    jp: 0.02,     // 2.00%
  },
  employee: {
    jht: 0.02,    // 2.00%
    jp: 0.01,     // 1.00%
    jks: 0.01,    // 1.00%
  },
};

export interface BPJSCompanyContributions {
  jht: number;
  jkm: number;
  jkk: number;
  jks: number;
  jp: number;
}

export interface BPJSEmployeeContributions {
  jht: number;
  jp: number;
  jks: number;
}

export interface BPJSDetails {
  // Company contributions
  jht_company: number;
  jkm_company: number;
  jkk_company: number;
  jks_company: number;
  jp_company: number;
  // Employee contributions
  jht_employee: number;
  jp_employee: number;
  jks_employee: number;
}

export interface BPJSCalculationResult {
  company_total: number;
  employee_total: number;
  sub_total_bpjs: number;
  object_pph21: number;
  details: BPJSDetails;
  caps_applied: {
    jks_cap: number;
    jp_cap: number;
    jks_capped: boolean;
    jp_capped: boolean;
  };
}

export class BPJSService {
  /**
   * Calculate all BPJS contributions
   */
  calculate(basicSalary: number, payType: string = 'gross'): BPJSCalculationResult {
    const companyBPJS = this.calculateCompanyContributions(basicSalary);
    const employeeBPJS = this.calculateEmployeeContributions(basicSalary);

    const companyTotal = Object.values(companyBPJS).reduce((sum, val) => sum + val, 0);
    const employeeTotal = Object.values(employeeBPJS).reduce((sum, val) => sum + val, 0);

    const objectPph21 = this.calculateObjectPph21(companyBPJS, employeeBPJS, payType);

    // For gross: sub_total = company only
    // For nett/gross_up: sub_total = company + employee
    const subTotalBpjs = payType === 'gross'
      ? companyTotal
      : companyTotal + employeeTotal;

    return {
      company_total: Math.round(companyTotal),
      employee_total: Math.round(employeeTotal),
      sub_total_bpjs: Math.round(subTotalBpjs),
      object_pph21: Math.round(objectPph21),
      details: this.buildDetails(companyBPJS, employeeBPJS),
      caps_applied: this.getCapsApplied(basicSalary),
    };
  }

  /**
   * Calculate company BPJS contributions
   */
  calculateCompanyContributions(basicSalary: number): BPJSCompanyContributions {
    return {
      jht: basicSalary * BPJS_RATES.company.jht,
      jkm: basicSalary * BPJS_RATES.company.jkm,
      jkk: basicSalary * BPJS_RATES.company.jkk,
      jks: Math.min(basicSalary, JKS_CAP) * BPJS_RATES.company.jks,
      jp: Math.min(basicSalary, JP_CAP) * BPJS_RATES.company.jp,
    };
  }

  /**
   * Calculate employee BPJS contributions
   */
  calculateEmployeeContributions(basicSalary: number): BPJSEmployeeContributions {
    return {
      jht: basicSalary * BPJS_RATES.employee.jht,
      jp: Math.min(basicSalary, JP_CAP) * BPJS_RATES.employee.jp,
      jks: Math.min(basicSalary, JKS_CAP) * BPJS_RATES.employee.jks,
    };
  }

  /**
   * Calculate Object PPh21 (BPJS components subject to tax)
   * For GROSS: JKM + JKK + JKS (company only)
   * For NETT/GROSS_UP: JKM + JKK + JKS (company) + JHT + JP + JKS (employee)
   */
  calculateObjectPph21(
    companyBPJS: BPJSCompanyContributions,
    employeeBPJS: BPJSEmployeeContributions,
    payType: string
  ): number {
    if (payType === 'gross') {
      return companyBPJS.jkm + companyBPJS.jkk + companyBPJS.jks;
    }

    return companyBPJS.jkm + companyBPJS.jkk + companyBPJS.jks +
           employeeBPJS.jht + employeeBPJS.jp + employeeBPJS.jks;
  }

  /**
   * Calculate BPJS Object PPh21 for Gross Up calculation
   */
  calculateBPJSObjectPph21(basicSalary: number): number {
    const companyBPJS = this.calculateCompanyContributions(basicSalary);
    const employeeBPJS = this.calculateEmployeeContributions(basicSalary);

    return companyBPJS.jkm + companyBPJS.jkk + companyBPJS.jks +
           employeeBPJS.jht + employeeBPJS.jp + employeeBPJS.jks;
  }

  /**
   * Build detailed BPJS breakdown
   */
  private buildDetails(
    companyBPJS: BPJSCompanyContributions,
    employeeBPJS: BPJSEmployeeContributions
  ): BPJSDetails {
    return {
      // Company contributions
      jht_company: Math.round(companyBPJS.jht),
      jkm_company: Math.round(companyBPJS.jkm),
      jkk_company: Math.round(companyBPJS.jkk),
      jks_company: Math.round(companyBPJS.jks),
      jp_company: Math.round(companyBPJS.jp),
      // Employee contributions
      jht_employee: Math.round(employeeBPJS.jht),
      jp_employee: Math.round(employeeBPJS.jp),
      jks_employee: Math.round(employeeBPJS.jks),
    };
  }

  /**
   * Get caps applied information
   */
  private getCapsApplied(basicSalary: number) {
    return {
      jks_cap: JKS_CAP,
      jp_cap: JP_CAP,
      jks_capped: basicSalary > JKS_CAP,
      jp_capped: basicSalary > JP_CAP,
    };
  }
}

export const bpjsService = new BPJSService();
