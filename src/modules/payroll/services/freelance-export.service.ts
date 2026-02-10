/**
 * Freelance & Internship Payroll Export Service
 * Generates Excel files for freelance and internship payments
 */

import ExcelJS from 'exceljs';

interface FreelancePayrollData {
  no: number;
  employee_id: string;
  employee_name: string;
  employment_type: 'freelance' | 'internship';
  department: string;
  position: string;
  company_name: string;
  period: string;
  period_label: string;
  basic_salary: number;
  meal_allowance: number;
  transport_allowance: number;
  total_payment: number;
  gross_up: number;
  pph21: number;
  take_home_pay: number;
  company_cost: number;
  bank_name: string;
  bank_account: string;
}

// Constants for gross-up calculation (matching frontend)
const GROSS_UP_DIVISOR = 0.975; // H3/0.975
const PPH21_RATE = 0.025; // 2.5% PPH21 rate

export class FreelanceExportService {
  /**
   * Generate Excel export for freelance/internship payroll data
   */
  async generateExcel(
    employees: any[],
    period: string,
    periodLabel: string,
    preparedBy: string
  ): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'HR-Next System';
    workbook.created = new Date();

    // Create Freelance sheet
    const freelanceData = employees.filter(e => e.employment_type === 'freelance');
    if (freelanceData.length > 0) {
      this.createSheet(workbook, 'Freelance', freelanceData, period, periodLabel, preparedBy);
    }

    // Create Internship sheet
    const internshipData = employees.filter(e => e.employment_type === 'internship');
    if (internshipData.length > 0) {
      this.createSheet(workbook, 'Internship', internshipData, period, periodLabel, preparedBy);
    }

    // Create Summary sheet
    this.createSummarySheet(workbook, employees, period, periodLabel, preparedBy);

    return workbook;
  }

  private createSheet(
    workbook: ExcelJS.Workbook,
    sheetName: string,
    employees: any[],
    period: string,
    periodLabel: string,
    preparedBy: string
  ): void {
    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ state: 'frozen', xSplit: 3, ySplit: 6 }],
    });

    // Set column widths
    this.setColumnWidths(worksheet);

    // Add header section
    this.addHeaderSection(worksheet, sheetName, period, periodLabel, preparedBy, employees.length);

    // Add column headers (row 6)
    this.addColumnHeaders(worksheet);

    // Add data rows starting from row 7
    let rowIndex = 7;
    let totalPayment = 0;
    let totalTax = 0;
    let totalCompanyCost = 0;

    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      const rowData = this.calculatePayrollRow(employee, i + 1, period, periodLabel);
      this.addDataRow(worksheet, rowIndex, rowData);

      totalPayment += rowData.total_payment;
      totalTax += rowData.pph21;
      totalCompanyCost += rowData.company_cost;
      rowIndex++;
    }

    // Add totals row
    this.addTotalsRow(worksheet, rowIndex, employees.length, totalPayment, totalTax, totalCompanyCost);
  }

  private calculatePayrollRow(employee: any, no: number, period: string, periodLabel: string): FreelancePayrollData {
    const basicSalary = Number(employee.basic_salary || 0);
    const mealAllowance = Number(employee.meal_allowance || 0);
    const transportAllowance = Number(employee.transport_allowance || 0);

    const isFreelance = employee.employment_type === 'freelance';

    let totalPayment: number;
    if (isFreelance) {
      totalPayment = basicSalary;
    } else {
      totalPayment = basicSalary + mealAllowance + transportAllowance;
    }

    // Gross-up calculation
    const grossUp = Math.round(totalPayment / GROSS_UP_DIVISOR);
    const pph21 = Math.round(grossUp * PPH21_RATE);
    const companyCost = totalPayment + pph21;

    return {
      no,
      employee_id: employee.employee_id || '-',
      employee_name: employee.name || '',
      employment_type: employee.employment_type,
      department: employee.department?.name || '-',
      position: employee.position?.name || employee.job_title || '-',
      company_name: employee.company?.name || '-',
      period,
      period_label: periodLabel,
      basic_salary: basicSalary,
      meal_allowance: mealAllowance,
      transport_allowance: transportAllowance,
      total_payment: totalPayment,
      gross_up: grossUp,
      pph21,
      take_home_pay: totalPayment, // Employee receives full amount
      company_cost: companyCost,
      bank_name: employee.bank_name || '-',
      bank_account: employee.bank_account_number || '-',
    };
  }

  private setColumnWidths(worksheet: ExcelJS.Worksheet): void {
    const columnWidths: { [key: string]: number } = {
      A: 5,    // NO
      B: 15,   // EMPLOYEE ID
      C: 30,   // NAMA
      D: 20,   // COMPANY
      E: 20,   // DEPARTMENT
      F: 20,   // POSISI
      G: 15,   // BASIC/FEE
      H: 15,   // MEAL ALLOWANCE
      I: 15,   // TRANSPORT
      J: 18,   // TOTAL PAYMENT
      K: 15,   // GROSS UP
      L: 15,   // PPH 21
      M: 18,   // TAKE HOME PAY
      N: 18,   // COMPANY COST
      O: 15,   // BANK
      P: 20,   // NO REKENING
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
    type: string,
    period: string,
    periodLabel: string,
    preparedBy: string,
    employeeCount: number
  ): void {
    // Row 1: Title
    worksheet.getCell('A1').value = `PAYROLL ${type.toUpperCase()}`;
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.mergeCells('A1:F1');

    // Row 2: Period
    worksheet.getCell('A2').value = 'PERIODE';
    worksheet.getCell('B2').value = ':';
    worksheet.getCell('C2').value = `${period} (${periodLabel})`;
    worksheet.getCell('A2').font = { bold: true };

    // Row 3: Prepared By
    worksheet.getCell('A3').value = 'PREPARED BY';
    worksheet.getCell('B3').value = ':';
    worksheet.getCell('C3').value = preparedBy;
    worksheet.getCell('A3').font = { bold: true };

    // Row 4: Employee Count
    worksheet.getCell('A4').value = 'JUMLAH KARYAWAN';
    worksheet.getCell('B4').value = ':';
    worksheet.getCell('C4').value = employeeCount;
    worksheet.getCell('A4').font = { bold: true };

    // Row 5: Empty for spacing
  }

  private addColumnHeaders(worksheet: ExcelJS.Worksheet): void {
    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, size: 10, color: { argb: 'FFFFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      },
    };

    const headers: { [key: string]: string } = {
      A6: 'NO',
      B6: 'EMPLOYEE ID',
      C6: 'NAMA',
      D6: 'COMPANY',
      E6: 'DEPARTMENT',
      F6: 'POSISI',
      G6: 'BASIC / FEE',
      H6: 'MEAL\nALLOWANCE',
      I6: 'TRANSPORT\nALLOWANCE',
      J6: 'TOTAL\nPAYMENT',
      K6: 'GROSS UP',
      L6: 'PPH 21\n(Company)',
      M6: 'TAKE HOME\nPAY',
      N6: 'COMPANY\nCOST',
      O6: 'BANK',
      P6: 'NO REKENING',
    };

    Object.entries(headers).forEach(([cell, value]) => {
      const wsCell = worksheet.getCell(cell);
      wsCell.value = value;
      Object.assign(wsCell, { style: headerStyle });
    });

    worksheet.getRow(6).height = 35;
  }

  private addDataRow(worksheet: ExcelJS.Worksheet, rowIndex: number, data: FreelancePayrollData): void {
    const row = worksheet.getRow(rowIndex);
    const currencyFormat = '#,##0';

    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    row.getCell('A').value = data.no;
    row.getCell('A').alignment = { horizontal: 'center' };
    row.getCell('B').value = data.employee_id;
    row.getCell('C').value = data.employee_name;
    row.getCell('D').value = data.company_name;
    row.getCell('E').value = data.department;
    row.getCell('F').value = data.position;

    row.getCell('G').value = data.basic_salary;
    row.getCell('G').numFmt = currencyFormat;

    row.getCell('H').value = data.meal_allowance;
    row.getCell('H').numFmt = currencyFormat;

    row.getCell('I').value = data.transport_allowance;
    row.getCell('I').numFmt = currencyFormat;

    row.getCell('J').value = data.total_payment;
    row.getCell('J').numFmt = currencyFormat;
    row.getCell('J').font = { bold: true };

    row.getCell('K').value = data.gross_up;
    row.getCell('K').numFmt = currencyFormat;

    row.getCell('L').value = data.pph21;
    row.getCell('L').numFmt = currencyFormat;
    row.getCell('L').font = { color: { argb: 'FFFF6600' } };

    row.getCell('M').value = data.take_home_pay;
    row.getCell('M').numFmt = currencyFormat;
    row.getCell('M').font = { bold: true };
    row.getCell('M').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };

    row.getCell('N').value = data.company_cost;
    row.getCell('N').numFmt = currencyFormat;
    row.getCell('N').font = { bold: true, color: { argb: 'FF0070C0' } };

    row.getCell('O').value = data.bank_name;
    row.getCell('P').value = data.bank_account;

    // Apply borders
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= 16) {
        cell.border = borderStyle;
      }
    });
  }

  private addTotalsRow(
    worksheet: ExcelJS.Worksheet,
    rowIndex: number,
    dataCount: number,
    totalPayment: number,
    totalTax: number,
    totalCompanyCost: number
  ): void {
    const row = worksheet.getRow(rowIndex);
    const currencyFormat = '#,##0';

    row.getCell('A').value = 'TOTAL';
    row.getCell('A').font = { bold: true };
    worksheet.mergeCells(`A${rowIndex}:I${rowIndex}`);

    row.getCell('J').value = totalPayment;
    row.getCell('J').numFmt = currencyFormat;
    row.getCell('J').font = { bold: true };

    row.getCell('L').value = totalTax;
    row.getCell('L').numFmt = currencyFormat;
    row.getCell('L').font = { bold: true };

    row.getCell('M').value = totalPayment;
    row.getCell('M').numFmt = currencyFormat;
    row.getCell('M').font = { bold: true };

    row.getCell('N').value = totalCompanyCost;
    row.getCell('N').numFmt = currencyFormat;
    row.getCell('N').font = { bold: true };

    // Apply styling
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= 16) {
        cell.border = {
          top: { style: 'medium' },
          left: { style: 'thin' },
          bottom: { style: 'medium' },
          right: { style: 'thin' },
        };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
      }
    });
  }

  private createSummarySheet(
    workbook: ExcelJS.Workbook,
    employees: any[],
    period: string,
    periodLabel: string,
    preparedBy: string
  ): void {
    const worksheet = workbook.addWorksheet('Summary', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    // Set column widths
    worksheet.getColumn(1).width = 25;
    worksheet.getColumn(2).width = 20;
    worksheet.getColumn(3).width = 20;
    worksheet.getColumn(4).width = 20;

    // Title
    worksheet.getCell('A1').value = 'SUMMARY FREELANCE & INTERNSHIP PAYROLL';
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.mergeCells('A1:D1');

    worksheet.getCell('A3').value = 'Periode';
    worksheet.getCell('B3').value = `${period} (${periodLabel})`;
    worksheet.getCell('A4').value = 'Prepared By';
    worksheet.getCell('B4').value = preparedBy;
    worksheet.getCell('A5').value = 'Generated At';
    worksheet.getCell('B5').value = new Date().toLocaleString('id-ID');

    // Stats
    const freelanceCount = employees.filter(e => e.employment_type === 'freelance').length;
    const internshipCount = employees.filter(e => e.employment_type === 'internship').length;

    let totalPayment = 0;
    let totalTax = 0;
    let totalCompanyCost = 0;

    employees.forEach(emp => {
      const basic = Number(emp.basic_salary || 0);
      const meal = Number(emp.meal_allowance || 0);
      const transport = Number(emp.transport_allowance || 0);

      const payment = emp.employment_type === 'freelance' ? basic : basic + meal + transport;
      const grossUp = Math.round(payment / GROSS_UP_DIVISOR);
      const tax = Math.round(grossUp * PPH21_RATE);

      totalPayment += payment;
      totalTax += tax;
      totalCompanyCost += payment + tax;
    });

    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
      alignment: { horizontal: 'center' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      },
    };

    worksheet.getCell('A7').value = 'Kategori';
    worksheet.getCell('B7').value = 'Jumlah';
    worksheet.getCell('C7').value = 'Total Payment';
    worksheet.getCell('D7').value = 'Company Cost';
    ['A7', 'B7', 'C7', 'D7'].forEach(cell => {
      Object.assign(worksheet.getCell(cell), { style: headerStyle });
    });

    const currencyFormat = '#,##0';
    const dataStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    // Freelance row
    worksheet.getCell('A8').value = 'Freelance';
    worksheet.getCell('B8').value = freelanceCount;
    worksheet.getCell('B8').alignment = { horizontal: 'center' };

    // Internship row
    worksheet.getCell('A9').value = 'Internship';
    worksheet.getCell('B9').value = internshipCount;
    worksheet.getCell('B9').alignment = { horizontal: 'center' };

    // Total row
    worksheet.getCell('A10').value = 'TOTAL';
    worksheet.getCell('A10').font = { bold: true };
    worksheet.getCell('B10').value = employees.length;
    worksheet.getCell('B10').alignment = { horizontal: 'center' };
    worksheet.getCell('B10').font = { bold: true };
    worksheet.getCell('C10').value = totalPayment;
    worksheet.getCell('C10').numFmt = currencyFormat;
    worksheet.getCell('C10').font = { bold: true };
    worksheet.getCell('D10').value = totalCompanyCost;
    worksheet.getCell('D10').numFmt = currencyFormat;
    worksheet.getCell('D10').font = { bold: true };

    // Apply borders
    for (let row = 8; row <= 10; row++) {
      ['A', 'B', 'C', 'D'].forEach(col => {
        worksheet.getCell(`${col}${row}`).border = dataStyle;
      });
    }

    // Tax summary
    worksheet.getCell('A12').value = 'Total PPh 21 (Company Paid)';
    worksheet.getCell('A12').font = { bold: true };
    worksheet.getCell('B12').value = totalTax;
    worksheet.getCell('B12').numFmt = currencyFormat;
    worksheet.getCell('B12').font = { bold: true, color: { argb: 'FFFF6600' } };
  }
}

export const freelanceExportService = new FreelanceExportService();
