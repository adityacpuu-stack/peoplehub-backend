/**
 * Payroll Export Service
 * Generates Excel files matching the PFI Payroll template
 */

import ExcelJS from 'exceljs';
import { Prisma } from '@prisma/client';

interface PayrollExportData {
  id: number;
  employee_id: string;
  employee_name: string;
  position: string;
  company_name: string;
  pay_type: string;
  tax_status: string;
  contract_start?: Date | null;
  contract_end?: Date | null;

  // Offering letter values
  basic_salary_offer: number;
  meal_allowance_offer: number;
  transport_allowance_offer: number;
  telecom_allowance_offer: number;
  housing_allowance_offer: number;
  insurance_allowance_offer: number;
  achievement_allowance_offer: number;
  attendance_allowance_offer: number;

  // Salary breakdown
  basic_salary: number;
  position_allowance: number;

  // Allowances
  salary: number;
  meal_allowance: number;
  overtime_pay: number;
  transport_allowance: number;
  telecom_allowance: number;
  housing_allowance: number;
  insurance_allowance: number;
  achievement_allowance: number;
  attendance_allowance: number;
  sub_total_allowance: number;
  total_salary_allowance: number;

  // BPJS Company
  bpjs_jht_company: number;
  bpjs_jkm_company: number;
  bpjs_jkk_company: number;
  bpjs_kes_company: number;
  bpjs_jp_company: number;

  // BPJS Employee (paid by company for NETT)
  bpjs_jht_employee_company: number;
  bpjs_jp_employee_company: number;
  bpjs_kes_employee_company: number;

  sub_total_bpjs_company: number;
  sub_total_bpjs_object_pph21: number;
  total_gross: number;

  // Gross Up
  gross_up_initial: number;
  gross_up_final: number;
  ter_golongan: string;
  ter_rate: number;
  ter_rate_gross_up: number;
  pph21: number;
  allowance_bpjs_pph: number;
  total_gross_included_pph: number;
  total_net_salary: number;

  // BPJS Employee Deduction
  bpjs_jht_employee: number;
  bpjs_jp_employee: number;
  bpjs_kes_employee: number;
  pph21_employee: number;
  total_deduction: number;
  thp: number;

  // Bank info
  bank_account: string;
  bank_name: string;
  remarks: string;

  // Working days
  working_days_month: number;
  salary_per_day: number;
  working_days_employee: number;
  salary_this_month: number;
  overtime_hours: number;
  overtime_total_hours: number;
  meal_days: number;
  transport_days: number;
}

export class PayrollExportService {
  /**
   * Generate Excel export for payroll data
   */
  async generateExcel(
    payrolls: any[],
    period: string,
    companyName: string,
    preparedBy: string
  ): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'HR-Next System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Payroll', {
      views: [{ state: 'frozen', xSplit: 3, ySplit: 8 }],
    });

    // Set column widths
    this.setColumnWidths(worksheet);

    // Add header section
    this.addHeaderSection(worksheet, period, preparedBy, payrolls.length);

    // Add column headers (rows 5-8)
    this.addColumnHeaders(worksheet);

    // Add data rows starting from row 9
    let rowIndex = 9;
    for (let i = 0; i < payrolls.length; i++) {
      const payroll = payrolls[i];
      this.addDataRow(worksheet, rowIndex, i + 1, payroll);
      rowIndex++;
    }

    // Add totals row
    this.addTotalsRow(worksheet, rowIndex, payrolls.length);

    return workbook;
  }

  private setColumnWidths(worksheet: ExcelJS.Worksheet): void {
    const columnWidths: { [key: string]: number } = {
      A: 5,    // NO
      B: 18,   // EMPLOYEE ID
      C: 30,   // FULL NAME
      D: 25,   // TITLE POSITION
      E: 20,   // BUSINESS UNIT
      F: 12,   // SALARY CALCULATION
      G: 10,   // STATUS PTKP
      H: 12,   // START
      I: 12,   // END
      J: 15,   // SALARY (offer)
      K: 15,   // MEALS ALLOWANCE
      L: 15,   // TRANSPORT ALLOWANCE
      M: 15,   // TELECOM ALLOWANCE
      N: 15,   // HOUSING ALLOWANCE
      O: 15,   // INSURANCE ALLOWANCE
      P: 15,   // ACHIEVEMENT ALLOWANCE
      Q: 15,   // ATTENDANCE ALLOWANCE
      R: 3,    // spacer
      S: 15,   // BASIC
      T: 15,   // POSITION ALLOWANCE
      U: 15,   // SALARY
      V: 15,   // MEALS
      W: 15,   // OVERTIME
      X: 15,   // TRANSPORT
      Y: 15,   // TELECOM
      Z: 15,   // HOUSING
      AA: 15,  // INSURANCE
      AB: 15,  // ACHIEVEMENT
      AC: 15,  // ATTENDANCE
      AD: 15,  // SUB TOTAL ALLOWANCE
      AE: 18,  // TOTAL SALARY + ALLOWANCE
      AF: 15,  // JHT Company
      AG: 12,  // JKM Company
      AH: 12,  // JKK Company
      AI: 15,  // JKS Company
      AJ: 15,  // JP Company
      AK: 15,  // JHT Employee (company paid)
      AL: 12,  // JP Employee (company paid)
      AM: 12,  // JKS Employee (company paid)
      AN: 15,  // SUB TOTAL BPJS
      AO: 18,  // SUB TOTAL BPJS OBJECT PPH21
      AP: 20,  // TOTAL GROSS
      AQ: 15,  // GROSS UP Initial
      AR: 15,  // GROSS UP Final
      AS: 8,   // GOL
      AT: 10,  // TARIF TER
      AU: 12,  // TARIF TER GROSS UP
      AV: 15,  // PPH21
      AW: 18,  // ALLOWANCE+BPJS+PPH
      AX: 18,  // TOTAL GROSS INCLUDED PPH
      AY: 18,  // TOTAL NET SALARY
      AZ: 15,  // JHT Employee
      BA: 12,  // JP Employee
      BB: 12,  // JKS Employee
      BC: 15,  // PPH21 Employee
      BD: 18,  // Subtotal BPJS+PPH21 (for GROSS)
      BE: 15,  // Absence Deduction
      BF: 15,  // Late Deduction
      BG: 15,  // Loan Deduction
      BH: 15,  // Other Deductions
      BI: 15,  // Total System Deduction
      BJ: 18,  // Grand Total All Deductions
      BK: 18,  // THP
      BL: 3,   // spacer
      BM: 22,  // NO REKENING
      BN: 15,  // NAMA BANK
      BO: 15,  // REMARKS
      BP: 3,   // spacer
      BQ: 12,  // WORKING DAYS MONTH
      BR: 15,  // SALARY/DAYS
      BS: 12,  // WORKING DAYS EMPLOYEE
      BT: 15,  // SALARY THIS MONTH
      BU: 12,  // OT HOURS
      BV: 12,  // SUM OT HOURS
      BW: 12,  // MEALS/DAYS
      BX: 12,  // TRANSPORT/DAYS
    };

    Object.entries(columnWidths).forEach(([col, width]) => {
      const colNum = this.columnToNumber(col);
      worksheet.getColumn(colNum).width = width;
    });
  }

  private columnToNumber(col: string): number {
    let result = 0;
    for (let i = 0; i < col.length; i++) {
      result = result * 26 + col.charCodeAt(i) - 64;
    }
    return result;
  }

  private addHeaderSection(
    worksheet: ExcelJS.Worksheet,
    period: string,
    preparedBy: string,
    employeeCount: number
  ): void {
    // Row 1: PFI PAYROLL PERIODE
    worksheet.getCell('A1').value = 'PFI PAYROLL PERIODE';
    worksheet.getCell('D1').value = ':';
    worksheet.getCell('E1').value = period;
    worksheet.getCell('A1').font = { bold: true, size: 14 };

    // Row 2: PEOPLE & CULTURE
    worksheet.getCell('A2').value = 'PEOPLE & CULTURE';
    worksheet.getCell('D2').value = ':';
    worksheet.getCell('E2').value = preparedBy;

    // Row 3: JUMLAH KARYAWAN
    worksheet.getCell('A3').value = 'JUMLAH KARYAWAN';
    worksheet.getCell('D3').value = ':';
    worksheet.getCell('E3').value = employeeCount;

    // Row 4: Empty for spacing
    // Row 5: PAYROLL PFI label
    worksheet.getCell('A5').value = 'PAYROLL PFI';
    worksheet.getCell('A5').font = { bold: true, size: 12 };
    worksheet.getCell('H5').value = 'OFFERING LETTER';
    worksheet.getCell('H5').font = { bold: true };
  }

  private addColumnHeaders(worksheet: ExcelJS.Worksheet): void {
    // Define header styles
    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, size: 10 },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      },
    };

    // Row 6: Main headers
    const mainHeaders: { [key: string]: string } = {
      A6: 'NO',
      B6: 'EMPLOYEE ID',
      C6: 'FULL NAME',
      D6: 'TITLE POSITION',
      E6: 'BUSINESS UNIT',
      F6: 'SALARY CALCULATION',
      G6: 'STATUS PTKP',
      H6: 'CONTRACT/PROBATION PERIODE',
      J6: 'SALARY',
      K6: 'MEALS ALLOWANCE',
      L6: 'TRANSPORT ALLOWANCE',
      M6: 'TELECOM ALLOWANCE',
      N6: 'HOUSING ALLOWANCE',
      O6: 'INSURANCE ALLOWANCE',
      P6: 'ACHIEVEMENT ALLOWANCE',
      Q6: 'ATTENDANCE ALLOWANCE',
      S6: 'Salary Breakdown',
      U6: 'SALARY',
      V6: 'ALLOWANCE',
      AD6: 'SUB TOTAL ALLOWANCE',
      AE6: 'TOTAL SALARY + ALLOWANCE',
      AF6: 'BPJS PAYMENT BY COMPANY',
      AK6: 'BPJS EMPLOYEE (Ditanggung Perusahaan)',
      AN6: 'SUB TOTAL BPJS',
      AO6: 'SUB TOTAL BPJS (OBJECT PPH21)',
      AP6: 'TOTAL GROSS',
      AQ6: 'GROSS UP',
      AS6: 'GOL',
      AT6: 'TARIF TER',
      AU6: 'TARIF TER GROSS UP',
      AV6: 'PPH21',
      AW6: 'ALLOWANCE+BPJS+PPH',
      AX6: 'TOTAL GROSS SALARY\n(Included PPh)',
      AY6: 'TOTAL NET SALARY',
      AZ6: 'BPJS DEDUCTION PAYMENT BY EMPLOYEE',
      BC6: 'PPH 21 Ditanggung Karyawan',
      BD6: 'Subtotal\nBPJS+PPH21\n(GROSS)',
      BE6: 'SYSTEM DEDUCTIONS',
      BJ6: 'GRAND TOTAL\nDEDUCTIONS',
      BK6: 'THP\n(Take Home Pay)',
      BM6: 'NO REKENING PAYROLL',
      BN6: 'NAMA BANK PAYROLL',
      BO6: 'REMARKS',
      BQ6: 'HARI KERJA DALAM SATU BULAN',
      BR6: 'SALARY / DAYS',
      BS6: 'HARI KERJA YANG BERSANGKUTAN',
      BT6: 'SALARY THIS MONTH',
      BU6: 'OT / HOURS',
      BV6: 'SUM OVERTIME (HOURS)',
      BW6: 'MEALS/DAYS',
      BX6: 'TRANSPORT/DAYS',
    };

    // Row 7: Sub headers (BPJS types)
    const subHeaders: { [key: string]: string } = {
      H7: 'START',
      I7: 'END',
      S7: 'BASIC',
      T7: 'POSITION ALLOWANCE',
      V7: 'MEALS',
      W7: 'OVERTIME',
      X7: 'TRANSPORT',
      Y7: 'TELECOM',
      Z7: 'HOUSING',
      AA7: 'INSURANCE',
      AB7: 'ACHIEVEMENT',
      AC7: 'ATTENDANCE',
      AF7: 'JHT',
      AG7: 'JKM',
      AH7: 'JKK',
      AI7: 'JKS',
      AJ7: 'JP',
      AK7: 'JHT',
      AL7: 'JP',
      AM7: 'JKS',
      AZ7: 'JHT',
      BA7: 'JP',
      BB7: 'JKS',
      BE7: 'Absence',
      BF7: 'Late',
      BG7: 'Loan',
      BH7: 'Other',
      BI7: 'Total',
    };

    // Row 8: BPJS rates
    const rateHeaders: { [key: string]: string } = {
      AF8: '3.7%',
      AG8: '0.3%',
      AH8: '0.24%',
      AI8: '4%',
      AJ8: '2%',
      AK8: '2%',
      AL8: '1%',
      AM8: '1%',
      AZ8: '2%',
      BA8: '1%',
      BB8: '1%',
    };

    // Apply main headers
    Object.entries(mainHeaders).forEach(([cell, value]) => {
      const wsCell = worksheet.getCell(cell);
      wsCell.value = value;
      Object.assign(wsCell, { style: headerStyle });
    });

    // Apply sub headers
    Object.entries(subHeaders).forEach(([cell, value]) => {
      const wsCell = worksheet.getCell(cell);
      wsCell.value = value;
      Object.assign(wsCell, { style: headerStyle });
    });

    // Apply rate headers
    Object.entries(rateHeaders).forEach(([cell, value]) => {
      const wsCell = worksheet.getCell(cell);
      wsCell.value = value;
      wsCell.font = { bold: true, size: 9 };
      wsCell.alignment = { horizontal: 'center' };
    });

    // Merge cells for multi-row headers
    worksheet.mergeCells('A6:A8');
    worksheet.mergeCells('B6:B8');
    worksheet.mergeCells('C6:C8');
    worksheet.mergeCells('D6:D8');
    worksheet.mergeCells('E6:E8');
    worksheet.mergeCells('F6:F8');
    worksheet.mergeCells('G6:G8');
    worksheet.mergeCells('H6:I6');
    worksheet.mergeCells('J6:J8');
    worksheet.mergeCells('K6:K8');
    worksheet.mergeCells('L6:L8');
    worksheet.mergeCells('M6:M8');
    worksheet.mergeCells('N6:N8');
    worksheet.mergeCells('O6:O8');
    worksheet.mergeCells('P6:P8');
    worksheet.mergeCells('Q6:Q8');
    worksheet.mergeCells('S6:T6');
    worksheet.mergeCells('U6:U8');
    worksheet.mergeCells('V6:AC6');
    worksheet.mergeCells('AD6:AD8');
    worksheet.mergeCells('AE6:AE8');
    worksheet.mergeCells('AF6:AJ6');
    worksheet.mergeCells('AK6:AM6');
    worksheet.mergeCells('AN6:AN8');
    worksheet.mergeCells('AO6:AO8');
    worksheet.mergeCells('AP6:AP8');
    worksheet.mergeCells('AQ6:AR6');
    worksheet.mergeCells('AS6:AS8');
    worksheet.mergeCells('AT6:AT8');
    worksheet.mergeCells('AU6:AU8');
    worksheet.mergeCells('AV6:AV8');
    worksheet.mergeCells('AW6:AW8');
    worksheet.mergeCells('AX6:AX8');
    worksheet.mergeCells('AY6:AY8');
    worksheet.mergeCells('AZ6:BB6');
    worksheet.mergeCells('BC6:BC8');
    worksheet.mergeCells('BD6:BD8'); // Subtotal BPJS+PPH21 (GROSS)
    worksheet.mergeCells('BE6:BI6'); // SYSTEM DEDUCTIONS header spans 5 columns
    worksheet.mergeCells('BJ6:BJ8'); // Grand Total Deductions
    worksheet.mergeCells('BK6:BK8'); // THP
    worksheet.mergeCells('BL6:BL8');
    worksheet.mergeCells('BM6:BM8');
    worksheet.mergeCells('BN6:BN8');
    worksheet.mergeCells('BO6:BO8');
    worksheet.mergeCells('BP6:BP8');
    worksheet.mergeCells('BQ6:BQ8');
    worksheet.mergeCells('BR6:BR8');
    worksheet.mergeCells('BS6:BS8');
    worksheet.mergeCells('BT6:BT8');
    worksheet.mergeCells('BU6:BU8');
    worksheet.mergeCells('BV6:BV8');
    worksheet.mergeCells('BW6:BW8');
    worksheet.mergeCells('BX6:BX8');

    // Set row heights
    worksheet.getRow(6).height = 30;
    worksheet.getRow(7).height = 20;
    worksheet.getRow(8).height = 20;
  }

  private addDataRow(
    worksheet: ExcelJS.Worksheet,
    rowIndex: number,
    no: number,
    payroll: any
  ): void {
    const row = worksheet.getRow(rowIndex);

    // Number format for currency
    const currencyFormat = '#,##0';
    const percentFormat = '0.00%';

    // Basic info
    row.getCell('A').value = no;
    row.getCell('B').value = payroll.employee?.employee_id || '';
    row.getCell('C').value = payroll.employee?.name || '';
    row.getCell('D').value = payroll.employee?.position?.name || payroll.employee?.job_title || '';
    row.getCell('E').value = payroll.employee?.company?.name || '';
    row.getCell('F').value = (payroll.pay_type || payroll.employee?.pay_type || '').toUpperCase();
    row.getCell('G').value = payroll.ptkp_status || payroll.employee?.ptkp_status || payroll.employee?.tax_status || '';

    // Contract/Probation dates
    row.getCell('H').value = payroll.employee?.join_date
      ? new Date(payroll.employee.join_date).toLocaleDateString('id-ID')
      : '-';
    // END: Use probation_end_date or contract_end_date
    const endDate = payroll.employee?.probation_end_date || payroll.employee?.contract_end_date;
    row.getCell('I').value = endDate
      ? new Date(endDate).toLocaleDateString('id-ID')
      : '-';

    // Offering letter values (from employee table)
    row.getCell('J').value = Number(payroll.employee?.basic_salary || 0);
    row.getCell('J').numFmt = currencyFormat;
    row.getCell('K').value = Number(payroll.employee?.meal_allowance || 0);
    row.getCell('K').numFmt = currencyFormat;
    row.getCell('L').value = Number(payroll.employee?.transport_allowance || 0);
    row.getCell('L').numFmt = currencyFormat;
    row.getCell('M').value = Number(payroll.employee?.communication_allowance || 0); // TELECOM
    row.getCell('M').numFmt = currencyFormat;
    row.getCell('N').value = Number(payroll.employee?.housing_allowance || 0); // HOUSING
    row.getCell('N').numFmt = currencyFormat;

    // Parse employee's other_allowances JSON for additional allowances (offering letter values)
    const employeeOtherAllowances = this.parseEmployeeOtherAllowances(payroll.employee?.other_allowances);
    row.getCell('O').value = employeeOtherAllowances.insurance; // INSURANCE
    row.getCell('O').numFmt = currencyFormat;
    row.getCell('P').value = employeeOtherAllowances.achievement; // ACHIEVEMENT
    row.getCell('P').numFmt = currencyFormat;
    row.getCell('Q').value = employeeOtherAllowances.attendance; // ATTENDANCE
    row.getCell('Q').numFmt = currencyFormat;

    // Salary Breakdown - BASIC
    row.getCell('S').value = Number(payroll.basic_salary || 0);
    row.getCell('S').numFmt = currencyFormat;
    // Position allowance
    row.getCell('T').value = Number(payroll.position_allowance || 0);
    row.getCell('T').numFmt = currencyFormat;

    // SALARY (basic)
    row.getCell('U').value = Number(payroll.basic_salary || 0);
    row.getCell('U').numFmt = currencyFormat;

    // ALLOWANCES
    row.getCell('V').value = Number(payroll.meal_allowance || 0);
    row.getCell('V').numFmt = currencyFormat;
    row.getCell('W').value = Number(payroll.overtime_pay || 0);
    row.getCell('W').numFmt = currencyFormat;
    row.getCell('X').value = Number(payroll.transport_allowance || 0);
    row.getCell('X').numFmt = currencyFormat;

    // Parse allowances_detail JSON for additional allowances
    const allowancesDetail = this.parseAllowancesDetail(payroll.allowances_detail);

    // TELECOM - from employee.communication_allowance or allowances_detail
    const telecomAllowance = allowancesDetail.telecom ||
      allowancesDetail.communication ||
      Number(payroll.employee?.communication_allowance || 0);
    row.getCell('Y').value = telecomAllowance;
    row.getCell('Y').numFmt = currencyFormat;

    // HOUSING - from employee.housing_allowance or allowances_detail
    const housingAllowance = allowancesDetail.housing ||
      Number(payroll.employee?.housing_allowance || 0);
    row.getCell('Z').value = housingAllowance;
    row.getCell('Z').numFmt = currencyFormat;

    // INSURANCE - from allowances_detail
    const insuranceAllowance = allowancesDetail.insurance || 0;
    row.getCell('AA').value = insuranceAllowance;
    row.getCell('AA').numFmt = currencyFormat;

    // ACHIEVEMENT - from allowances_detail
    const achievementAllowance = allowancesDetail.achievement || 0;
    row.getCell('AB').value = achievementAllowance;
    row.getCell('AB').numFmt = currencyFormat;

    // ATTENDANCE - from allowances_detail
    const attendanceAllowance = allowancesDetail.attendance || 0;
    row.getCell('AC').value = attendanceAllowance;
    row.getCell('AC').numFmt = currencyFormat;

    // SUB TOTAL ALLOWANCE (all allowances already include values from allowances table)
    const positionAllowance = Number(payroll.position_allowance || 0);
    const otherAllowances = Number(payroll.other_allowances || 0);
    const subTotalAllowance = Number(payroll.meal_allowance || 0) +
      Number(payroll.overtime_pay || 0) +
      Number(payroll.transport_allowance || 0) +
      positionAllowance +
      telecomAllowance +
      housingAllowance +
      insuranceAllowance +
      achievementAllowance +
      attendanceAllowance +
      otherAllowances;
    row.getCell('AD').value = subTotalAllowance;
    row.getCell('AD').numFmt = currencyFormat;

    // TOTAL SALARY + ALLOWANCE
    const totalSalaryAllowance = Number(payroll.basic_salary || 0) + subTotalAllowance;
    row.getCell('AE').value = totalSalaryAllowance;
    row.getCell('AE').numFmt = currencyFormat;

    // BPJS Company
    row.getCell('AF').value = Number(payroll.bpjs_jht_company || 0);
    row.getCell('AF').numFmt = currencyFormat;
    row.getCell('AG').value = Number(payroll.bpjs_jkm_company || 0);
    row.getCell('AG').numFmt = currencyFormat;
    row.getCell('AH').value = Number(payroll.bpjs_jkk_company || 0);
    row.getCell('AH').numFmt = currencyFormat;
    row.getCell('AI').value = Number(payroll.bpjs_kes_company || 0);
    row.getCell('AI').numFmt = currencyFormat;
    row.getCell('AJ').value = Number(payroll.bpjs_jp_company || 0);
    row.getCell('AJ').numFmt = currencyFormat;

    // BPJS Employee (paid by company for NETT)
    const isNett = (payroll.pay_type || '').toLowerCase() === 'nett' ||
                   (payroll.pay_type || '').toLowerCase() === 'net';
    if (isNett) {
      row.getCell('AK').value = Number(payroll.bpjs_jht_employee || 0);
      row.getCell('AL').value = Number(payroll.bpjs_jp_employee || 0);
      row.getCell('AM').value = Number(payroll.bpjs_kes_employee || 0);
    } else {
      row.getCell('AK').value = 0;
      row.getCell('AL').value = 0;
      row.getCell('AM').value = 0;
    }
    row.getCell('AK').numFmt = currencyFormat;
    row.getCell('AL').numFmt = currencyFormat;
    row.getCell('AM').numFmt = currencyFormat;

    // SUB TOTAL BPJS Company
    const subTotalBpjsCompany = Number(payroll.bpjs_jht_company || 0) +
      Number(payroll.bpjs_jkm_company || 0) +
      Number(payroll.bpjs_jkk_company || 0) +
      Number(payroll.bpjs_kes_company || 0) +
      Number(payroll.bpjs_jp_company || 0);
    row.getCell('AN').value = subTotalBpjsCompany;
    row.getCell('AN').numFmt = currencyFormat;

    // SUB TOTAL BPJS OBJECT PPH21
    const bpjsObjectPph21 = Number(payroll.bpjs_jht_company || 0) +
      Number(payroll.bpjs_jkm_company || 0) +
      Number(payroll.bpjs_jkk_company || 0) +
      Number(payroll.bpjs_kes_company || 0) +
      Number(payroll.bpjs_jp_company || 0);
    row.getCell('AO').value = bpjsObjectPph21;
    row.getCell('AO').numFmt = currencyFormat;

    // TOTAL GROSS
    row.getCell('AP').value = Number(payroll.total_gross || 0);
    row.getCell('AP').numFmt = currencyFormat;

    // GROSS UP values
    row.getCell('AQ').value = Number(payroll.gross_up_initial || 0);
    row.getCell('AQ').numFmt = currencyFormat;
    row.getCell('AR').value = Number(payroll.final_gross_up || payroll.gross_up_initial || 0);
    row.getCell('AR').numFmt = currencyFormat;

    // GOL (TER category)
    row.getCell('AS').value = payroll.ter_category || '';

    // TARIF TER
    row.getCell('AT').value = Number(payroll.ter_rate_initial || payroll.ter_rate || 0);
    row.getCell('AT').numFmt = percentFormat;
    row.getCell('AU').value = Number(payroll.ter_rate || 0);
    row.getCell('AU').numFmt = percentFormat;

    // PPH21
    row.getCell('AV').value = Number(payroll.pph21 || 0);
    row.getCell('AV').numFmt = currencyFormat;

    // ALLOWANCE + BPJS + PPH (calculated)
    const allowanceBpjsPph = Number(payroll.bpjs_jht_employee || 0) +
      Number(payroll.bpjs_jp_employee || 0) +
      Number(payroll.bpjs_kes_employee || 0) +
      Number(payroll.pph21 || 0);
    row.getCell('AW').value = allowanceBpjsPph;
    row.getCell('AW').numFmt = currencyFormat;

    // TOTAL GROSS INCLUDED PPH
    row.getCell('AX').value = Number(payroll.gross_up_final || payroll.total_gross || 0);
    row.getCell('AX').numFmt = currencyFormat;

    // TOTAL NET SALARY
    row.getCell('AY').value = Number(payroll.net_salary || payroll.basic_salary || 0);
    row.getCell('AY').numFmt = currencyFormat;

    // BPJS Employee Deduction (for GROSS employees)
    if (!isNett) {
      row.getCell('AZ').value = Number(payroll.bpjs_jht_employee || 0);
      row.getCell('BA').value = Number(payroll.bpjs_jp_employee || 0);
      row.getCell('BB').value = Number(payroll.bpjs_kes_employee || 0);
      row.getCell('BC').value = Number(payroll.pph21 || 0);
    } else {
      row.getCell('AZ').value = '-';
      row.getCell('BA').value = '-';
      row.getCell('BB').value = '-';
      row.getCell('BC').value = '-';
    }
    row.getCell('AZ').numFmt = currencyFormat;
    row.getCell('BA').numFmt = currencyFormat;
    row.getCell('BB').numFmt = currencyFormat;
    row.getCell('BC').numFmt = currencyFormat;

    // BD: Subtotal BPJS+PPH21 (for GROSS employees only)
    // For GROSS employees, these are deducted from their salary
    let subtotalBpjsPph21 = 0;
    if (!isNett) {
      subtotalBpjsPph21 = Number(payroll.bpjs_jht_employee || 0) +
        Number(payroll.bpjs_jp_employee || 0) +
        Number(payroll.bpjs_kes_employee || 0) +
        Number(payroll.pph21 || 0);
    }
    row.getCell('BD').value = subtotalBpjsPph21;
    row.getCell('BD').numFmt = currencyFormat;

    // System Deductions (from payroll adjustments)
    const absenceDeduction = Number(payroll.absence_deduction || 0);
    const lateDeduction = Number(payroll.late_deduction || 0);
    const loanDeduction = Number(payroll.loan_deduction || 0);
    const otherDeductions = Number(payroll.other_deductions || 0);
    const totalSystemDeductions = absenceDeduction + lateDeduction + loanDeduction + otherDeductions;

    row.getCell('BE').value = absenceDeduction;
    row.getCell('BE').numFmt = currencyFormat;
    row.getCell('BF').value = lateDeduction;
    row.getCell('BF').numFmt = currencyFormat;
    row.getCell('BG').value = loanDeduction;
    row.getCell('BG').numFmt = currencyFormat;
    row.getCell('BH').value = otherDeductions;
    row.getCell('BH').numFmt = currencyFormat;
    row.getCell('BI').value = totalSystemDeductions;
    row.getCell('BI').numFmt = currencyFormat;

    // BJ: Grand Total All Deductions (for reference) = Subtotal BPJS+PPH21 + System Deductions
    const grandTotalDeductions = subtotalBpjsPph21 + totalSystemDeductions;
    row.getCell('BJ').value = grandTotalDeductions;
    row.getCell('BJ').numFmt = currencyFormat;
    row.getCell('BJ').font = { bold: true };

    // BK: THP - Use stored value from database (already calculated correctly)
    const thp = Number(payroll.thp || 0);
    row.getCell('BK').value = thp;
    row.getCell('BK').numFmt = currencyFormat;
    row.getCell('BK').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFF2CC' },
    };
    row.getCell('BK').font = { bold: true };

    // Bank info
    row.getCell('BM').value = payroll.employee?.bank_account_number || '';
    row.getCell('BN').value = payroll.employee?.bank_name || '';
    row.getCell('BO').value = ''; // REMARKS

    // Working days info (from holiday calendar calculation)
    const workingDays = Number(payroll.working_days || 0);
    const actualWorkingDays = Number(payroll.actual_working_days || payroll.working_days || 0);

    row.getCell('BQ').value = workingDays; // HARI KERJA DALAM SATU BULAN
    row.getCell('BR').value = workingDays > 0 ? Number(payroll.basic_salary || 0) / workingDays : 0; // SALARY/DAYS
    row.getCell('BR').numFmt = currencyFormat;
    row.getCell('BS').value = actualWorkingDays; // HARI KERJA YANG BERSANGKUTAN
    row.getCell('BT').value = Number(payroll.basic_salary || 0); // SALARY THIS MONTH
    row.getCell('BT').numFmt = currencyFormat;
    row.getCell('BU').value = Number(payroll.overtime_hours || 0); // OT / HOURS
    row.getCell('BV').value = Number(payroll.overtime_hours || 0); // SUM OVERTIME (HOURS)
    row.getCell('BW').value = actualWorkingDays; // MEALS/DAYS
    row.getCell('BX').value = actualWorkingDays; // TRANSPORT/DAYS

    // Set row border
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  }

  private addTotalsRow(
    worksheet: ExcelJS.Worksheet,
    rowIndex: number,
    dataCount: number
  ): void {
    const row = worksheet.getRow(rowIndex);
    const currencyFormat = '#,##0';

    row.getCell('A').value = 'TOTAL';
    row.getCell('A').font = { bold: true };
    worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`);

    // Add SUM formulas for numeric columns
    const sumColumns = [
      'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', // Offering letter
      'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE', // Salary breakdown
      'AF', 'AG', 'AH', 'AI', 'AJ', // BPJS Company
      'AK', 'AL', 'AM', 'AN', 'AO', 'AP', // BPJS Employee company paid & totals
      'AQ', 'AR', // Gross up
      'AV', 'AW', 'AX', 'AY', // PPH & totals
      'AZ', 'BA', 'BB', 'BC', // BPJS Employee Deduction & PPH21
      'BD', // Subtotal BPJS+PPH21 (GROSS)
      'BE', 'BF', 'BG', 'BH', 'BI', // System deductions (Absence, Late, Loan, Other, Total)
      'BJ', 'BK', // Grand Total Deductions & THP
    ];

    sumColumns.forEach((col) => {
      const cell = row.getCell(col);
      cell.value = { formula: `SUM(${col}9:${col}${rowIndex - 1})` };
      cell.numFmt = currencyFormat;
      cell.font = { bold: true };
    });

    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'thin' },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    });
  }

  /**
   * Parse employee's other_allowances JSON for offering letter values
   */
  private parseEmployeeOtherAllowances(otherAllowances: any): {
    insurance: number;
    achievement: number;
    attendance: number;
  } {
    const result = { insurance: 0, achievement: 0, attendance: 0 };

    if (!otherAllowances) return result;

    try {
      if (Array.isArray(otherAllowances)) {
        for (const item of otherAllowances) {
          const type = (item.type || item.name || '').toLowerCase();
          const amount = Number(item.amount || item.value || 0);

          if (type.includes('insurance') || type.includes('asuransi')) {
            result.insurance += amount;
          } else if (type.includes('achievement') || type.includes('prestasi')) {
            result.achievement += amount;
          } else if (type.includes('attendance') || type.includes('kehadiran')) {
            result.attendance += amount;
          }
        }
      } else if (typeof otherAllowances === 'object') {
        result.insurance = Number(otherAllowances.insurance || 0);
        result.achievement = Number(otherAllowances.achievement || 0);
        result.attendance = Number(otherAllowances.attendance || 0);
      }
    } catch (e) {
      // Return zeros if parsing fails
    }

    return result;
  }

  /**
   * Parse allowances_detail JSON to extract specific allowance types
   * allowances_detail can be an array of { type, name, amount } or an object with type keys
   */
  private parseAllowancesDetail(allowancesDetail: any): {
    telecom: number;
    communication: number;
    housing: number;
    insurance: number;
    achievement: number;
    attendance: number;
  } {
    const result = {
      telecom: 0,
      communication: 0,
      housing: 0,
      insurance: 0,
      achievement: 0,
      attendance: 0,
    };

    if (!allowancesDetail) return result;

    try {
      // If it's an array (e.g., from Allowance records)
      if (Array.isArray(allowancesDetail)) {
        for (const item of allowancesDetail) {
          const type = (item.type || item.name || '').toLowerCase();
          const amount = Number(item.amount || 0);

          if (type.includes('telecom') || type.includes('pulsa') || type.includes('communication')) {
            result.telecom += amount;
            result.communication += amount;
          } else if (type.includes('housing') || type.includes('rumah') || type.includes('perumahan')) {
            result.housing += amount;
          } else if (type.includes('insurance') || type.includes('asuransi')) {
            result.insurance += amount;
          } else if (type.includes('achievement') || type.includes('prestasi') || type.includes('performance') || type.includes('kinerja')) {
            result.achievement += amount;
          } else if (type.includes('attendance') || type.includes('kehadiran')) {
            result.attendance += amount;
          } else if (type.includes('medical') || type.includes('kesehatan')) {
            result.insurance += amount;
          }
        }
      }
      // If it's an object with type keys
      else if (typeof allowancesDetail === 'object') {
        result.telecom = Number(allowancesDetail.telecom || allowancesDetail.communication || 0);
        result.communication = result.telecom;
        result.housing = Number(allowancesDetail.housing || 0);
        result.insurance = Number(allowancesDetail.insurance || 0);
        result.achievement = Number(allowancesDetail.achievement || allowancesDetail.performance || 0);
        result.attendance = Number(allowancesDetail.attendance || 0);
      }
    } catch (e) {
      // Return zeros if parsing fails
    }

    return result;
  }
}

export const payrollExportService = new PayrollExportService();
