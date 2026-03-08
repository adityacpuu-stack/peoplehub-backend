/**
 * Payroll Export Service
 * Generates Excel files matching the PFI Payroll template
 *
 * Column layout (after AC, +2 shift for THR & BONUS in allowance section):
 *   A-Q: Basic info + Offering letter
 *   R: spacer
 *   S-T: Salary breakdown
 *   U: SALARY
 *   V-AE: ALLOWANCE (MEALS, OT, TRANSPORT, TELECOM, HOUSING, INSURANCE, ACHIEVEMENT, ATTENDANCE, THR, BONUS)
 *   AF: SUB TOTAL ALLOWANCE
 *   AG: TOTAL SALARY + ALLOWANCE
 *   AH-AL: BPJS Company
 *   AM-AO: BPJS Employee (company paid)
 *   AP: SUB TOTAL BPJS
 *   AQ: SUB TOTAL BPJS OBJECT PPH21
 *   AR: TOTAL GROSS
 *   AS-AT: GROSS UP
 *   AU: GOL
 *   AV: TARIF TER
 *   AW: TARIF TER GROSS UP
 *   AX: PPH21
 *   AY: ALLOWANCE+BPJS+PPH
 *   AZ: TOTAL GROSS INCLUDED PPH
 *   BA: TOTAL NET SALARY
 *   BB-BD: BPJS Employee Deduction
 *   BE: PPH21 Employee
 *   BF: Subtotal BPJS+PPH21 (GROSS)
 *   BG-BK: System Deductions
 *   BL: Grand Total Deductions
 *   BM: THP
 *   BN: spacer
 *   BO: NO REKENING
 *   BP: NAMA BANK
 *   BQ: REMARKS
 *   BR: spacer
 *   BS-BZ: Working days info
 */

import ExcelJS from 'exceljs';
import { Prisma } from '@prisma/client';

export class PayrollExportService {
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

    this.setColumnWidths(worksheet);
    this.addHeaderSection(worksheet, period, preparedBy, payrolls.length);
    this.addColumnHeaders(worksheet);

    let rowIndex = 9;
    for (let i = 0; i < payrolls.length; i++) {
      this.addDataRow(worksheet, rowIndex, i + 1, payrolls[i]);
      rowIndex++;
    }

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
      AD: 15,  // THR
      AE: 15,  // BONUS
      AF: 15,  // SUB TOTAL ALLOWANCE
      AG: 18,  // TOTAL SALARY + ALLOWANCE
      AH: 15,  // JHT Company
      AI: 12,  // JKM Company
      AJ: 12,  // JKK Company
      AK: 15,  // JKS Company
      AL: 15,  // JP Company
      AM: 15,  // JHT Employee (company paid)
      AN: 12,  // JP Employee (company paid)
      AO: 12,  // JKS Employee (company paid)
      AP: 15,  // SUB TOTAL BPJS
      AQ: 18,  // SUB TOTAL BPJS OBJECT PPH21
      AR: 20,  // TOTAL GROSS
      AS: 15,  // GROSS UP Initial
      AT: 15,  // GROSS UP Final
      AU: 8,   // GOL
      AV: 10,  // TARIF TER
      AW: 12,  // TARIF TER GROSS UP
      AX: 15,  // PPH21
      AY: 18,  // ALLOWANCE+BPJS+PPH
      AZ: 18,  // TOTAL GROSS INCLUDED PPH
      BA: 18,  // TOTAL NET SALARY
      BB: 15,  // JHT Employee
      BC: 12,  // JP Employee
      BD: 12,  // JKS Employee
      BE: 15,  // PPH21 Employee
      BF: 18,  // Subtotal BPJS+PPH21 (for GROSS)
      BG: 15,  // Absence Deduction
      BH: 15,  // Late Deduction
      BI: 15,  // Loan Deduction
      BJ: 15,  // Other Deductions
      BK: 15,  // Total System Deduction
      BL: 18,  // Grand Total All Deductions
      BM: 18,  // THP
      BN: 3,   // spacer
      BO: 22,  // NO REKENING
      BP: 15,  // NAMA BANK
      BQ: 15,  // REMARKS
      BR: 3,   // spacer
      BS: 12,  // WORKING DAYS MONTH
      BT: 15,  // SALARY/DAYS
      BU: 12,  // WORKING DAYS EMPLOYEE
      BV: 15,  // SALARY THIS MONTH
      BW: 12,  // OT HOURS
      BX: 12,  // SUM OT HOURS
      BY: 12,  // MEALS/DAYS
      BZ: 12,  // TRANSPORT/DAYS
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
    worksheet.getCell('A1').value = 'PFI PAYROLL PERIODE';
    worksheet.getCell('D1').value = ':';
    worksheet.getCell('E1').value = period;
    worksheet.getCell('A1').font = { bold: true, size: 14 };

    worksheet.getCell('A2').value = 'PEOPLE & CULTURE';
    worksheet.getCell('D2').value = ':';
    worksheet.getCell('E2').value = preparedBy;

    worksheet.getCell('A3').value = 'JUMLAH KARYAWAN';
    worksheet.getCell('D3').value = ':';
    worksheet.getCell('E3').value = employeeCount;

    worksheet.getCell('A5').value = 'PAYROLL PFI';
    worksheet.getCell('A5').font = { bold: true, size: 12 };
    worksheet.getCell('H5').value = 'OFFERING LETTER';
    worksheet.getCell('H5').font = { bold: true };
  }

  private addColumnHeaders(worksheet: ExcelJS.Worksheet): void {
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
      AF6: 'SUB TOTAL ALLOWANCE',
      AG6: 'TOTAL SALARY + ALLOWANCE',
      AH6: 'BPJS PAYMENT BY COMPANY',
      AM6: 'BPJS EMPLOYEE (Ditanggung Perusahaan)',
      AP6: 'SUB TOTAL BPJS',
      AQ6: 'SUB TOTAL BPJS (OBJECT PPH21)',
      AR6: 'TOTAL GROSS',
      AS6: 'GROSS UP',
      AU6: 'GOL',
      AV6: 'TARIF TER',
      AW6: 'TARIF TER GROSS UP',
      AX6: 'PPH21',
      AY6: 'ALLOWANCE+BPJS+PPH',
      AZ6: 'TOTAL GROSS SALARY\n(Included PPh)',
      BA6: 'TOTAL NET SALARY',
      BB6: 'BPJS DEDUCTION PAYMENT BY EMPLOYEE',
      BE6: 'PPH 21 Ditanggung Karyawan',
      BF6: 'Subtotal\nBPJS+PPH21\n(GROSS)',
      BG6: 'SYSTEM DEDUCTIONS',
      BL6: 'GRAND TOTAL\nDEDUCTIONS',
      BM6: 'THP\n(Take Home Pay)',
      BO6: 'NO REKENING PAYROLL',
      BP6: 'NAMA BANK PAYROLL',
      BQ6: 'REMARKS',
      BS6: 'HARI KERJA DALAM SATU BULAN',
      BT6: 'SALARY / DAYS',
      BU6: 'HARI KERJA YANG BERSANGKUTAN',
      BV6: 'SALARY THIS MONTH',
      BW6: 'OT / HOURS',
      BX6: 'SUM OVERTIME (HOURS)',
      BY6: 'MEALS/DAYS',
      BZ6: 'TRANSPORT/DAYS',
    };

    // Row 7: Sub headers
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
      AD7: 'THR',
      AE7: 'BONUS',
      AH7: 'JHT',
      AI7: 'JKM',
      AJ7: 'JKK',
      AK7: 'JKS',
      AL7: 'JP',
      AM7: 'JHT',
      AN7: 'JP',
      AO7: 'JKS',
      BB7: 'JHT',
      BC7: 'JP',
      BD7: 'JKS',
      BG7: 'Absence',
      BH7: 'Late',
      BI7: 'Loan',
      BJ7: 'Other',
      BK7: 'Total',
    };

    // Row 8: BPJS rates
    const rateHeaders: { [key: string]: string } = {
      AH8: '3.7%',
      AI8: '0.3%',
      AJ8: '0.24%',
      AK8: '4%',
      AL8: '2%',
      AM8: '2%',
      AN8: '1%',
      AO8: '1%',
      BB8: '2%',
      BC8: '1%',
      BD8: '1%',
    };

    // Apply headers
    Object.entries(mainHeaders).forEach(([cell, value]) => {
      const wsCell = worksheet.getCell(cell);
      wsCell.value = value;
      Object.assign(wsCell, { style: headerStyle });
    });

    Object.entries(subHeaders).forEach(([cell, value]) => {
      const wsCell = worksheet.getCell(cell);
      wsCell.value = value;
      Object.assign(wsCell, { style: headerStyle });
    });

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
    worksheet.mergeCells('V6:AE6');   // ALLOWANCE spans V-AE (10 cols: meals,ot,transport,telecom,housing,insurance,achievement,attendance,THR,bonus)
    worksheet.mergeCells('AF6:AF8');
    worksheet.mergeCells('AG6:AG8');
    worksheet.mergeCells('AH6:AL6');  // BPJS Company
    worksheet.mergeCells('AM6:AO6');  // BPJS Employee company paid
    worksheet.mergeCells('AP6:AP8');
    worksheet.mergeCells('AQ6:AQ8');
    worksheet.mergeCells('AR6:AR8');
    worksheet.mergeCells('AS6:AT6');  // GROSS UP
    worksheet.mergeCells('AU6:AU8');
    worksheet.mergeCells('AV6:AV8');
    worksheet.mergeCells('AW6:AW8');
    worksheet.mergeCells('AX6:AX8');
    worksheet.mergeCells('AY6:AY8');
    worksheet.mergeCells('AZ6:AZ8');
    worksheet.mergeCells('BA6:BA8');
    worksheet.mergeCells('BB6:BD6');  // BPJS Employee Deduction
    worksheet.mergeCells('BE6:BE8');
    worksheet.mergeCells('BF6:BF8');
    worksheet.mergeCells('BG6:BK6'); // SYSTEM DEDUCTIONS
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
    worksheet.mergeCells('BY6:BY8');
    worksheet.mergeCells('BZ6:BZ8');

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
    const currencyFormat = '#,##0';
    const percentFormat = '0.00%';

    // Basic info (A-G)
    row.getCell('A').value = no;
    row.getCell('B').value = payroll.employee?.employee_id || '';
    row.getCell('C').value = payroll.employee?.name || '';
    row.getCell('D').value = payroll.employee?.position?.name || payroll.employee?.job_title || '';
    row.getCell('E').value = payroll.employee?.company?.name || '';
    row.getCell('F').value = (payroll.pay_type || payroll.employee?.pay_type || '').toUpperCase();
    row.getCell('G').value = payroll.ptkp_status || payroll.employee?.ptkp_status || payroll.employee?.tax_status || '';

    // Contract/Probation dates (H-I)
    row.getCell('H').value = payroll.employee?.join_date
      ? new Date(payroll.employee.join_date).toLocaleDateString('id-ID')
      : '-';
    const endDate = payroll.employee?.probation_end_date || payroll.employee?.contract_end_date;
    row.getCell('I').value = endDate
      ? new Date(endDate).toLocaleDateString('id-ID')
      : '-';

    // Offering letter values (J-Q)
    row.getCell('J').value = Number(payroll.employee?.basic_salary || 0);
    row.getCell('J').numFmt = currencyFormat;
    row.getCell('K').value = Number(payroll.employee?.meal_allowance || 0);
    row.getCell('K').numFmt = currencyFormat;
    row.getCell('L').value = Number(payroll.employee?.transport_allowance || 0);
    row.getCell('L').numFmt = currencyFormat;
    row.getCell('M').value = Number(payroll.employee?.communication_allowance || 0);
    row.getCell('M').numFmt = currencyFormat;
    row.getCell('N').value = Number(payroll.employee?.housing_allowance || 0);
    row.getCell('N').numFmt = currencyFormat;

    const employeeOtherAllowances = this.parseEmployeeOtherAllowances(payroll.employee?.other_allowances);
    row.getCell('O').value = employeeOtherAllowances.insurance;
    row.getCell('O').numFmt = currencyFormat;
    row.getCell('P').value = employeeOtherAllowances.achievement;
    row.getCell('P').numFmt = currencyFormat;
    row.getCell('Q').value = employeeOtherAllowances.attendance;
    row.getCell('Q').numFmt = currencyFormat;

    // Salary Breakdown (S-T)
    row.getCell('S').value = Number(payroll.basic_salary || 0);
    row.getCell('S').numFmt = currencyFormat;
    row.getCell('T').value = Number(payroll.position_allowance || 0);
    row.getCell('T').numFmt = currencyFormat;

    // SALARY (U)
    row.getCell('U').value = Number(payroll.basic_salary || 0);
    row.getCell('U').numFmt = currencyFormat;

    // ALLOWANCES (V-AE) — now includes THR and BONUS
    row.getCell('V').value = Number(payroll.meal_allowance || 0);
    row.getCell('V').numFmt = currencyFormat;
    row.getCell('W').value = Number(payroll.overtime_pay || 0);
    row.getCell('W').numFmt = currencyFormat;
    row.getCell('X').value = Number(payroll.transport_allowance || 0);
    row.getCell('X').numFmt = currencyFormat;

    const allowancesDetail = this.parseAllowancesDetail(payroll.allowances_detail);

    const telecomAllowance = allowancesDetail.telecom ||
      allowancesDetail.communication ||
      Number(payroll.employee?.communication_allowance || 0);
    row.getCell('Y').value = telecomAllowance;
    row.getCell('Y').numFmt = currencyFormat;

    const housingAllowance = allowancesDetail.housing ||
      Number(payroll.employee?.housing_allowance || 0);
    row.getCell('Z').value = housingAllowance;
    row.getCell('Z').numFmt = currencyFormat;

    const insuranceAllowance = allowancesDetail.insurance || 0;
    row.getCell('AA').value = insuranceAllowance;
    row.getCell('AA').numFmt = currencyFormat;

    const achievementAllowance = allowancesDetail.achievement || 0;
    row.getCell('AB').value = achievementAllowance;
    row.getCell('AB').numFmt = currencyFormat;

    const attendanceAllowance = allowancesDetail.attendance || 0;
    row.getCell('AC').value = attendanceAllowance;
    row.getCell('AC').numFmt = currencyFormat;

    // THR & BONUS — now in allowance section (AD-AE)
    const thrAmount = Number(payroll.thr || 0);
    const bonusAmount = Number(payroll.bonus || 0);
    row.getCell('AD').value = thrAmount;
    row.getCell('AD').numFmt = currencyFormat;
    row.getCell('AE').value = bonusAmount;
    row.getCell('AE').numFmt = currencyFormat;

    // SUB TOTAL ALLOWANCE (AF) — now includes THR + BONUS
    const positionAllowance = Number(payroll.position_allowance || 0);
    const otherAllowances = Math.max(0, Number(payroll.other_allowances || 0)
      - insuranceAllowance
      - achievementAllowance
      - attendanceAllowance);
    const subTotalAllowance = Number(payroll.meal_allowance || 0) +
      Number(payroll.overtime_pay || 0) +
      Number(payroll.transport_allowance || 0) +
      positionAllowance +
      telecomAllowance +
      housingAllowance +
      insuranceAllowance +
      achievementAllowance +
      attendanceAllowance +
      thrAmount +
      bonusAmount +
      otherAllowances;
    row.getCell('AF').value = subTotalAllowance;
    row.getCell('AF').numFmt = currencyFormat;

    // TOTAL SALARY + ALLOWANCE (AG)
    const totalSalaryAllowance = Number(payroll.basic_salary || 0) + subTotalAllowance;
    row.getCell('AG').value = totalSalaryAllowance;
    row.getCell('AG').numFmt = currencyFormat;

    // BPJS Company (AH-AL)
    row.getCell('AH').value = Number(payroll.bpjs_jht_company || 0);
    row.getCell('AH').numFmt = currencyFormat;
    row.getCell('AI').value = Number(payroll.bpjs_jkm_company || 0);
    row.getCell('AI').numFmt = currencyFormat;
    row.getCell('AJ').value = Number(payroll.bpjs_jkk_company || 0);
    row.getCell('AJ').numFmt = currencyFormat;
    row.getCell('AK').value = Number(payroll.bpjs_kes_company || 0);
    row.getCell('AK').numFmt = currencyFormat;
    row.getCell('AL').value = Number(payroll.bpjs_jp_company || 0);
    row.getCell('AL').numFmt = currencyFormat;

    // BPJS Employee paid by company for NETT (AM-AO)
    const isNett = (payroll.pay_type || '').toLowerCase() === 'nett' ||
                   (payroll.pay_type || '').toLowerCase() === 'net';
    if (isNett) {
      row.getCell('AM').value = Number(payroll.bpjs_jht_employee || 0);
      row.getCell('AN').value = Number(payroll.bpjs_jp_employee || 0);
      row.getCell('AO').value = Number(payroll.bpjs_kes_employee || 0);
    } else {
      row.getCell('AM').value = 0;
      row.getCell('AN').value = 0;
      row.getCell('AO').value = 0;
    }
    row.getCell('AM').numFmt = currencyFormat;
    row.getCell('AN').numFmt = currencyFormat;
    row.getCell('AO').numFmt = currencyFormat;

    // SUB TOTAL BPJS (AP)
    const subTotalBpjsCompany = Number(payroll.bpjs_jht_company || 0) +
      Number(payroll.bpjs_jkm_company || 0) +
      Number(payroll.bpjs_jkk_company || 0) +
      Number(payroll.bpjs_kes_company || 0) +
      Number(payroll.bpjs_jp_company || 0);
    row.getCell('AP').value = subTotalBpjsCompany;
    row.getCell('AP').numFmt = currencyFormat;

    // SUB TOTAL BPJS OBJECT PPH21 (AQ)
    const bpjsObjectPph21 = subTotalBpjsCompany;
    row.getCell('AQ').value = bpjsObjectPph21;
    row.getCell('AQ').numFmt = currencyFormat;

    // TOTAL GROSS (AR)
    row.getCell('AR').value = Number(payroll.total_gross || 0);
    row.getCell('AR').numFmt = currencyFormat;

    // GROSS UP (AS-AT)
    row.getCell('AS').value = Number(payroll.gross_up_initial || 0);
    row.getCell('AS').numFmt = currencyFormat;
    row.getCell('AT').value = Number(payroll.final_gross_up || payroll.gross_up_initial || 0);
    row.getCell('AT').numFmt = currencyFormat;

    // GOL (AU)
    row.getCell('AU').value = payroll.ter_category || '';

    // TARIF TER (AV-AW)
    row.getCell('AV').value = Number(payroll.ter_rate_initial || payroll.ter_rate || 0);
    row.getCell('AV').numFmt = percentFormat;
    row.getCell('AW').value = Number(payroll.ter_rate || 0);
    row.getCell('AW').numFmt = percentFormat;

    // PPH21 (AX)
    row.getCell('AX').value = Number(payroll.pph21 || 0);
    row.getCell('AX').numFmt = currencyFormat;

    // ALLOWANCE + BPJS + PPH (AY)
    const allowanceBpjsPph = Number(payroll.bpjs_jht_employee || 0) +
      Number(payroll.bpjs_jp_employee || 0) +
      Number(payroll.bpjs_kes_employee || 0) +
      Number(payroll.pph21 || 0);
    row.getCell('AY').value = allowanceBpjsPph;
    row.getCell('AY').numFmt = currencyFormat;

    // TOTAL GROSS INCLUDED PPH (AZ)
    row.getCell('AZ').value = Number(payroll.gross_up_final || payroll.total_gross || 0);
    row.getCell('AZ').numFmt = currencyFormat;

    // TOTAL NET SALARY (BA)
    row.getCell('BA').value = Number(payroll.net_salary || payroll.basic_salary || 0);
    row.getCell('BA').numFmt = currencyFormat;

    // BPJS Employee Deduction for GROSS (BB-BD)
    if (!isNett) {
      row.getCell('BB').value = Number(payroll.bpjs_jht_employee || 0);
      row.getCell('BC').value = Number(payroll.bpjs_jp_employee || 0);
      row.getCell('BD').value = Number(payroll.bpjs_kes_employee || 0);
      row.getCell('BE').value = Number(payroll.pph21 || 0);
    } else {
      row.getCell('BB').value = '-';
      row.getCell('BC').value = '-';
      row.getCell('BD').value = '-';
      row.getCell('BE').value = '-';
    }
    row.getCell('BB').numFmt = currencyFormat;
    row.getCell('BC').numFmt = currencyFormat;
    row.getCell('BD').numFmt = currencyFormat;
    row.getCell('BE').numFmt = currencyFormat;

    // Subtotal BPJS+PPH21 for GROSS (BF)
    let subtotalBpjsPph21 = 0;
    if (!isNett) {
      subtotalBpjsPph21 = Number(payroll.bpjs_jht_employee || 0) +
        Number(payroll.bpjs_jp_employee || 0) +
        Number(payroll.bpjs_kes_employee || 0) +
        Number(payroll.pph21 || 0);
    }
    row.getCell('BF').value = subtotalBpjsPph21;
    row.getCell('BF').numFmt = currencyFormat;

    // System Deductions (BG-BK)
    const absenceDeduction = Number(payroll.absence_deduction || 0);
    const lateDeduction = Number(payroll.late_deduction || 0);
    const loanDeduction = Number(payroll.loan_deduction || 0);
    const otherDeductionsVal = Number(payroll.other_deductions || 0);
    const totalSystemDeductions = absenceDeduction + lateDeduction + loanDeduction + otherDeductionsVal;

    row.getCell('BG').value = absenceDeduction;
    row.getCell('BG').numFmt = currencyFormat;
    row.getCell('BH').value = lateDeduction;
    row.getCell('BH').numFmt = currencyFormat;
    row.getCell('BI').value = loanDeduction;
    row.getCell('BI').numFmt = currencyFormat;
    row.getCell('BJ').value = otherDeductionsVal;
    row.getCell('BJ').numFmt = currencyFormat;
    row.getCell('BK').value = totalSystemDeductions;
    row.getCell('BK').numFmt = currencyFormat;

    // Grand Total Deductions (BL)
    const grandTotalDeductions = subtotalBpjsPph21 + totalSystemDeductions;
    row.getCell('BL').value = grandTotalDeductions;
    row.getCell('BL').numFmt = currencyFormat;
    row.getCell('BL').font = { bold: true };

    // THP (BM)
    const thp = Number(payroll.thp || 0);
    row.getCell('BM').value = thp;
    row.getCell('BM').numFmt = currencyFormat;
    row.getCell('BM').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFF2CC' },
    };
    row.getCell('BM').font = { bold: true };

    // Bank info (BO-BQ)
    row.getCell('BO').value = payroll.employee?.bank_account_number || '';
    row.getCell('BP').value = payroll.employee?.bank_name || '';
    row.getCell('BQ').value = '';

    // Working days info (BS-BZ)
    const workingDays = Number(payroll.working_days || 0);
    const actualWorkingDays = Number(payroll.actual_working_days || payroll.working_days || 0);

    row.getCell('BS').value = workingDays;
    row.getCell('BT').value = workingDays > 0 ? Number(payroll.basic_salary || 0) / workingDays : 0;
    row.getCell('BT').numFmt = currencyFormat;
    row.getCell('BU').value = actualWorkingDays;
    row.getCell('BV').value = Number(payroll.basic_salary || 0);
    row.getCell('BV').numFmt = currencyFormat;
    row.getCell('BW').value = Number(payroll.overtime_hours || 0);
    row.getCell('BX').value = Number(payroll.overtime_hours || 0);
    row.getCell('BY').value = actualWorkingDays;
    row.getCell('BZ').value = actualWorkingDays;

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

    const sumColumns = [
      'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', // Offering letter
      'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', // Salary + allowances (incl THR, Bonus)
      'AH', 'AI', 'AJ', 'AK', 'AL', // BPJS Company
      'AM', 'AN', 'AO', 'AP', 'AQ', 'AR', // BPJS Employee company paid & totals
      'AS', 'AT', // Gross up
      'AX', 'AY', 'AZ', 'BA', // PPH & totals
      'BB', 'BC', 'BD', 'BE', // BPJS Employee Deduction & PPH21
      'BF', // Subtotal BPJS+PPH21 (GROSS)
      'BG', 'BH', 'BI', 'BJ', 'BK', // System deductions
      'BL', 'BM', // Grand Total Deductions & THP
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
      } else if (typeof allowancesDetail === 'object') {
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
