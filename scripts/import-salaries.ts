import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

function cleanNumber(val: any): number {
  if (val === null || val === undefined || val === '-' || val === '') return 0;
  if (typeof val === 'number') return val;
  // Remove non-numeric characters except decimal point
  const cleaned = String(val).replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
}

function cleanString(val: any): string | null {
  if (val === null || val === undefined || val === '-' || val === '') return null;
  return String(val).replace(/^'/, '').trim();
}

async function main() {
  console.log('Reading salary Excel file...');
  const workbook = XLSX.readFile('/Users/adityacoy/Documents/hr-next/FINAL ALL PFI payroll_2026-01 rev5.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const range = XLSX.utils.decode_range(sheet['!ref']!);

  // Read data starting from row 3
  const salaryData: any[] = [];
  for (let r = 3; r <= range.e.r; r++) {
    const getCell = (c: number) => {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      return cell ? cell.v : null;
    };

    const nik = getCell(1);
    if (!nik) continue;

    salaryData.push({
      nik: String(nik).trim(),
      name: getCell(2),
      pay_type: getCell(5), // NETT or GROSS
      ptkp_status: getCell(6),
      salary: cleanNumber(getCell(9)),
      meal_allowance: cleanNumber(getCell(11)),
      transport_allowance: cleanNumber(getCell(12)),
      telecom_allowance: cleanNumber(getCell(13)),
      housing_allowance: cleanNumber(getCell(14)),
      insurance_allowance: cleanNumber(getCell(15)),
      achievement_allowance: cleanNumber(getCell(16)),
      attendance_allowance: cleanNumber(getCell(17)),
      bank_account: cleanString(getCell(47)),
      bank_name: cleanString(getCell(48)),
    });
  }

  console.log(`Found ${salaryData.length} salary records`);

  let updated = 0;
  let notFound = 0;
  let errors = 0;

  console.log('\nUpdating employee salaries...');

  for (const data of salaryData) {
    try {
      // Find employee by NIK (employee_id)
      const employee = await prisma.employee.findFirst({
        where: { employee_id: data.nik }
      });

      if (!employee) {
        console.log(`  Not found: ${data.nik} - ${data.name}`);
        notFound++;
        continue;
      }

      // Calculate position allowance (sum of other allowances)
      const positionAllowance =
        data.telecom_allowance +
        data.housing_allowance +
        data.insurance_allowance +
        data.achievement_allowance +
        data.attendance_allowance;

      // Update employee record
      await prisma.employee.update({
        where: { id: employee.id },
        data: {
          basic_salary: data.salary,
          meal_allowance: data.meal_allowance || null,
          transport_allowance: data.transport_allowance || null,
          position_allowance: positionAllowance || null,
          tax_status: data.ptkp_status || employee.tax_status,
          bank_account_number: data.bank_account || employee.bank_account_number,
          bank_name: data.bank_name || employee.bank_name,
        }
      });

      updated++;
      if (updated % 20 === 0) {
        console.log(`  Progress: ${updated} updated`);
      }
    } catch (error: any) {
      console.error(`  Error updating ${data.nik}: ${error.message}`);
      errors++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Salary import completed!`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Not found: ${notFound}`);
  console.log(`  Errors: ${errors}`);
  console.log(`========================================`);

  // Show salary summary by company
  console.log('\nSalary summary by company:');
  const companies = await prisma.company.findMany({
    select: {
      name: true,
      employees: {
        where: {
          basic_salary: { gt: 0 }
        },
        select: {
          basic_salary: true
        }
      }
    }
  });

  companies.forEach(c => {
    const count = c.employees.length;
    const total = c.employees.reduce((sum, e) => sum + (e.basic_salary?.toNumber() || 0), 0);
    if (count > 0) {
      console.log(`  ${c.name}: ${count} employees, Total: Rp ${total.toLocaleString('id-ID')}`);
    }
  });

  await prisma.$disconnect();
}

main().catch(console.error);
