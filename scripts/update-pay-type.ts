import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

async function main() {
  console.log('Reading salary Excel file...');
  const workbook = XLSX.readFile('/Users/adityacoy/Documents/hr-next/FINAL ALL PFI payroll_2026-01 rev5.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const range = XLSX.utils.decode_range(sheet['!ref']!);

  // Read data starting from row 3
  const payTypeData: { nik: string; pay_type: string; ptkp: string }[] = [];
  for (let r = 3; r <= range.e.r; r++) {
    const getCell = (c: number) => {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      return cell ? cell.v : null;
    };

    const nik = getCell(1);
    const payType = getCell(5); // NETT or GROSS
    const ptkp = getCell(6);

    if (!nik) continue;

    payTypeData.push({
      nik: String(nik).trim(),
      pay_type: String(payType || '').toLowerCase(), // 'nett' or 'gross'
      ptkp: String(ptkp || ''),
    });
  }

  console.log(`Found ${payTypeData.length} records`);

  // Show pay_type distribution from Excel
  const payTypes = payTypeData.reduce((acc: Record<string, number>, d) => {
    acc[d.pay_type] = (acc[d.pay_type] || 0) + 1;
    return acc;
  }, {});
  console.log('Pay types in Excel:', payTypes);

  let updated = 0;
  let notFound = 0;

  console.log('\nUpdating pay_type...');

  for (const data of payTypeData) {
    const employee = await prisma.employee.findFirst({
      where: { employee_id: data.nik }
    });

    if (!employee) {
      notFound++;
      continue;
    }

    // Map pay_type: NETT -> 'net', GROSS -> 'gross'
    const payType = data.pay_type === 'nett' ? 'net' : data.pay_type === 'gross' ? 'gross' : null;

    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        pay_type: payType,
        tax_status: data.ptkp || employee.tax_status,
      }
    });

    updated++;
  }

  console.log(`\nUpdated: ${updated}`);
  console.log(`Not found: ${notFound}`);

  // Verify
  const stats = await prisma.employee.groupBy({
    by: ['pay_type'],
    _count: true,
    where: { basic_salary: { gt: 0 } }
  });

  console.log('\nPay type distribution in DB:');
  stats.forEach((s: any) => {
    console.log(`  ${s.pay_type || 'NULL'}: ${s._count} employees`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
