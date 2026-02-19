/**
 * Employee Export Service
 * Generates Excel files for employee data export
 */

import ExcelJS from 'exceljs';

interface EmployeeExportData {
  id: number;
  employee_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  mobile_number: string | null;
  job_title: string | null;
  employment_status: string | null;
  employment_type: string | null;
  hire_date: Date | null;
  date_of_birth: Date | null;
  place_of_birth: string | null;
  gender: string | null;
  religion: string | null;
  marital_status: string | null;
  blood_type: string | null;
  nationality: string | null;
  national_id: string | null;
  npwp_number: string | null;

  // Address - KTP
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;

  // Address - Domicile
  current_address: string | null;
  current_city: string | null;
  current_province: string | null;
  current_postal_code: string | null;

  // Emergency Contact
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;

  // Employment
  join_date: Date | null;
  probation_end_date: Date | null;
  contract_start_date: Date | null;
  contract_end_date: Date | null;

  // Tax & BPJS
  tax_status: string | null;
  bpjs_ketenagakerjaan_number: string | null;
  bpjs_kesehatan_number: string | null;

  // Compensation
  basic_salary: number | null;
  salary_currency: string | null;
  pay_frequency: string | null;
  pay_type: string | null;
  transport_allowance: number | null;
  meal_allowance: number | null;
  position_allowance: number | null;
  housing_allowance: number | null;

  // Bank
  bank_name: string | null;
  bank_account_number: string | null;
  // Family
  spouse_name: string | null;
  children_count: number | null;
  number_of_dependents: number | null;

  // Relations
  company_name: string | null;
  department_name: string | null;
  position_name: string | null;
  manager_name: string | null;
  work_location_name: string | null;
}

// Prisma select for export query
export const EMPLOYEE_EXPORT_SELECT = {
  id: true,
  employee_id: true,
  name: true,
  email: true,
  phone: true,
  mobile_number: true,
  job_title: true,
  employment_status: true,
  employment_type: true,
  hire_date: true,
  date_of_birth: true,
  place_of_birth: true,
  gender: true,
  religion: true,
  marital_status: true,
  blood_type: true,
  nationality: true,
  national_id: true,
  npwp_number: true,
  // Address KTP
  address: true,
  city: true,
  province: true,
  postal_code: true,
  // Address Domicile
  current_address: true,
  current_city: true,
  current_province: true,
  current_postal_code: true,
  // Emergency Contact
  emergency_contact_name: true,
  emergency_contact_phone: true,
  emergency_contact_relationship: true,
  // Employment Dates
  join_date: true,
  probation_end_date: true,
  contract_start_date: true,
  contract_end_date: true,
  // Tax & BPJS
  tax_status: true,
  bpjs_ketenagakerjaan_number: true,
  bpjs_kesehatan_number: true,
  // Compensation
  basic_salary: true,
  salary_currency: true,
  pay_frequency: true,
  pay_type: true,
  transport_allowance: true,
  meal_allowance: true,
  position_allowance: true,
  housing_allowance: true,
  // Bank
  bank_name: true,
  bank_account_number: true,
  // Family
  spouse_name: true,
  children_count: true,
  number_of_dependents: true,
  // Relations
  company: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  position: { select: { id: true, name: true } },
  manager: { select: { id: true, name: true } },
  workLocation: { select: { id: true, name: true, city: true } },
} as const;

export class EmployeeExportService {
  /**
   * Generate Excel export for employee data
   */
  async generateExcel(
    employees: any[],
    exportedBy: string
  ): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PeopleHub HRIS';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Employees', {
      views: [{ state: 'frozen', xSplit: 3, ySplit: 5 }],
    });

    // ========== HEADER SECTION ==========
    const now = new Date();
    const exportDate = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Row 1: Title
    sheet.mergeCells('A1:BC1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'EMPLOYEE DATA EXPORT';
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    // Row 2: Export info
    sheet.mergeCells('A2:BC2');
    const infoCell = sheet.getCell('A2');
    infoCell.value = `Exported on: ${exportDate} | By: ${exportedBy} | Total: ${employees.length} employees`;
    infoCell.font = { size: 10, italic: true, color: { argb: '666666' } };
    infoCell.alignment = { horizontal: 'center' };

    // Row 3: Empty separator
    sheet.addRow([]);

    // ========== COLUMN DEFINITIONS ==========
    const columns = this.getColumnDefinitions();

    // Set column widths
    sheet.columns = columns.map((col) => ({
      width: col.width,
    }));

    // ========== ROW 4: GROUP/SECTION HEADERS ==========
    const groupHeaders = this.getGroupHeaders();
    const groupRow = sheet.getRow(4);
    groupRow.height = 24;

    groupHeaders.forEach((group) => {
      const startCol = this.colLetter(group.startCol);
      const endCol = this.colLetter(group.endCol);
      sheet.mergeCells(`${startCol}4:${endCol}4`);

      const cell = groupRow.getCell(group.startCol);
      cell.value = group.label;
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: group.color },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // ========== ROW 5: COLUMN HEADERS ==========
    const headerRow = sheet.getRow(5);
    columns.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2E86AB' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    headerRow.height = 30;

    // ========== DATA ROWS ==========
    employees.forEach((emp, index) => {
      const row = sheet.getRow(6 + index);
      const data = this.mapEmployeeToRow(emp, index + 1);

      data.forEach((value, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        cell.value = value;
        cell.font = { size: 10 };
        cell.alignment = {
          vertical: 'middle',
          wrapText: columns[colIdx]?.wrap || false,
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'DDDDDD' } },
          bottom: { style: 'thin', color: { argb: 'DDDDDD' } },
          left: { style: 'thin', color: { argb: 'DDDDDD' } },
          right: { style: 'thin', color: { argb: 'DDDDDD' } },
        };

        // Currency formatting
        if (columns[colIdx]?.format === 'currency') {
          cell.numFmt = '#,##0';
          cell.alignment = { ...cell.alignment, horizontal: 'right' };
        }

        // Date formatting
        if (columns[colIdx]?.format === 'date' && value) {
          cell.numFmt = 'DD/MM/YYYY';
        }
      });

      // Alternating row colors
      if (index % 2 === 1) {
        data.forEach((_, colIdx) => {
          row.getCell(colIdx + 1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F5F9FC' },
          };
        });
      }
    });

    return workbook;
  }

  private getColumnDefinitions(): {
    header: string;
    width: number;
    format?: string;
    wrap?: boolean;
  }[] {
    return [
      // Basic Info
      { header: 'No', width: 5 },
      { header: 'Employee ID', width: 20 },
      { header: 'Name', width: 25 },
      { header: 'Company', width: 25 },
      { header: 'Department', width: 20 },
      { header: 'Position', width: 22 },
      { header: 'Job Title', width: 22 },
      { header: 'Manager', width: 22 },
      { header: 'Work Location', width: 25 },
      { header: 'Status', width: 12 },
      { header: 'Employment Type', width: 16 },

      // Personal Info
      { header: 'Gender', width: 10 },
      { header: 'Place of Birth', width: 18 },
      { header: 'Date of Birth', width: 14, format: 'date' },
      { header: 'Religion', width: 12 },
      { header: 'Marital Status', width: 14 },
      { header: 'Blood Type', width: 10 },
      { header: 'Nationality', width: 14 },
      { header: 'NIK (KTP)', width: 20 },
      { header: 'NPWP', width: 22 },

      // Contact
      { header: 'Work Email', width: 28 },
      { header: 'Phone', width: 18 },
      { header: 'Mobile', width: 18 },

      // Address KTP
      { header: 'KTP Address', width: 35, wrap: true },
      { header: 'KTP City', width: 18 },
      { header: 'KTP Province', width: 18 },
      { header: 'KTP Postal Code', width: 14 },

      // Address Domicile
      { header: 'Current Address', width: 35, wrap: true },
      { header: 'Current City', width: 18 },
      { header: 'Current Province', width: 18 },
      { header: 'Current Postal Code', width: 14 },

      // Emergency Contact
      { header: 'Emergency Contact', width: 22 },
      { header: 'Emergency Phone', width: 18 },
      { header: 'Emergency Relation', width: 16 },

      // Employment Dates
      { header: 'Hire Date', width: 14, format: 'date' },
      { header: 'Join Date', width: 14, format: 'date' },
      { header: 'Probation End', width: 14, format: 'date' },
      { header: 'Contract Start', width: 14, format: 'date' },
      { header: 'Contract End', width: 14, format: 'date' },

      // Compensation
      { header: 'Basic Salary', width: 18, format: 'currency' },
      { header: 'Currency', width: 10 },
      { header: 'Pay Frequency', width: 14 },
      { header: 'Pay Type', width: 12 },
      { header: 'Transport Allowance', width: 18, format: 'currency' },
      { header: 'Meal Allowance', width: 18, format: 'currency' },
      { header: 'Position Allowance', width: 18, format: 'currency' },
      { header: 'Housing Allowance', width: 18, format: 'currency' },

      // Tax & BPJS
      { header: 'Tax Status', width: 12 },
      { header: 'BPJS TK No', width: 20 },
      { header: 'BPJS Kes No', width: 20 },

      // Bank
      { header: 'Bank Name', width: 18 },
      { header: 'Bank Account No', width: 20 },

      // Family
      { header: 'Spouse Name', width: 22 },
      { header: 'Children', width: 10 },
      { header: 'Dependents', width: 10 },
    ];
  }

  private getGroupHeaders(): {
    label: string;
    startCol: number;
    endCol: number;
    color: string;
  }[] {
    return [
      { label: 'INFORMASI DASAR', startCol: 1, endCol: 11, color: '1B4F72' },
      { label: 'DATA PRIBADI', startCol: 12, endCol: 20, color: '6C3483' },
      { label: 'KONTAK', startCol: 21, endCol: 23, color: '1A5276' },
      { label: 'ALAMAT KTP', startCol: 24, endCol: 27, color: '117A65' },
      { label: 'ALAMAT DOMISILI', startCol: 28, endCol: 31, color: '117A65' },
      { label: 'KONTAK DARURAT', startCol: 32, endCol: 34, color: 'B03A2E' },
      { label: 'TANGGAL KERJA', startCol: 35, endCol: 39, color: '1B4F72' },
      { label: 'KOMPENSASI & GAJI', startCol: 40, endCol: 47, color: 'B7950B' },
      { label: 'PAJAK & BPJS', startCol: 48, endCol: 50, color: '6E2C00' },
      { label: 'REKENING BANK', startCol: 51, endCol: 52, color: '1A5276' },
      { label: 'KELUARGA', startCol: 53, endCol: 55, color: '6C3483' },
    ];
  }

  private colLetter(colNum: number): string {
    let result = '';
    let num = colNum;
    while (num > 0) {
      const remainder = (num - 1) % 26;
      result = String.fromCharCode(65 + remainder) + result;
      num = Math.floor((num - 1) / 26);
    }
    return result;
  }

  private mapEmployeeToRow(emp: any, index: number): any[] {
    const formatDate = (date: any): Date | string => {
      if (!date) return '';
      return new Date(date);
    };

    return [
      index,
      emp.employee_id || '',
      emp.name || '',
      emp.company?.name || '',
      emp.department?.name || '',
      emp.position?.name || '',
      emp.job_title || '',
      emp.manager?.name || '',
      emp.workLocation ? `${emp.workLocation.name}${emp.workLocation.city ? ` - ${emp.workLocation.city}` : ''}` : '',
      emp.employment_status || '',
      emp.employment_type || '',

      // Personal
      emp.gender || '',
      emp.place_of_birth || '',
      formatDate(emp.date_of_birth),
      emp.religion || '',
      emp.marital_status || '',
      emp.blood_type || '',
      emp.nationality || '',
      emp.national_id || '',
      emp.npwp_number || '',

      // Contact
      emp.email || '',
      emp.phone || '',
      emp.mobile_number || '',

      // Address KTP
      emp.address || '',
      emp.city || '',
      emp.province || '',
      emp.postal_code || '',

      // Address Domicile
      emp.current_address || '',
      emp.current_city || '',
      emp.current_province || '',
      emp.current_postal_code || '',

      // Emergency
      emp.emergency_contact_name || '',
      emp.emergency_contact_phone || '',
      emp.emergency_contact_relationship || '',

      // Dates
      formatDate(emp.hire_date),
      formatDate(emp.join_date),
      formatDate(emp.probation_end_date),
      formatDate(emp.contract_start_date),
      formatDate(emp.contract_end_date),

      // Compensation
      emp.basic_salary ? Number(emp.basic_salary) : '',
      emp.salary_currency || '',
      emp.pay_frequency || '',
      emp.pay_type || '',
      emp.transport_allowance ? Number(emp.transport_allowance) : '',
      emp.meal_allowance ? Number(emp.meal_allowance) : '',
      emp.position_allowance ? Number(emp.position_allowance) : '',
      emp.housing_allowance ? Number(emp.housing_allowance) : '',

      // Tax & BPJS
      emp.tax_status || '',
      emp.bpjs_ketenagakerjaan_number || '',
      emp.bpjs_kesehatan_number || '',

      // Bank
      emp.bank_name || '',
      emp.bank_account_number || '',

      // Family
      emp.spouse_name || '',
      emp.children_count ?? '',
      emp.number_of_dependents ?? '',
    ];
  }
}
