import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Company name mapping to database
const COMPANY_MAP: Record<string, number> = {
  'PT PATH FINDER INVESTMENT': 1,
  'PT GROWPATH DISTRIBUTION INDONESIA': 2,
  'PT LAMPUNG FARM SOLUTION': 3,
  'PT BUKA CERITA INDONESIA': 4,
  'PT UOR KREATIF INDONESIA': 5,
  'PT PILAR DANA RAKYAT': 6,
};

// Gender mapping
const GENDER_MAP: Record<string, string> = {
  'Laki-laki': 'male',
  'Perempuan': 'female',
};

// Religion mapping
const RELIGION_MAP: Record<string, string> = {
  'Islam': 'islam',
  'Kristen': 'kristen',
  'Katolik': 'katolik',
  'Hindu': 'hindu',
  'Buddha': 'buddha',
  'Konghucu': 'konghucu',
  'Other': 'other',
};

// Marital status mapping
const MARITAL_MAP: Record<string, string> = {
  'Menikah': 'married',
  'Belum Menikah': 'single',
  'Cerai': 'divorced',
  'Duda': 'widowed',
  'Janda': 'widowed',
};

// Employment type mapping
const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  'Tetap': 'permanent',
  'Kontrak': 'contract',
  'Probation': 'probation',
  'Freelance': 'freelance',
  'Intern': 'intern',
};

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === '-') return null;

  // Handle DD/MM/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);
    return new Date(year, month, day);
  }
  return null;
}

function cleanPhone(phone: string): string {
  if (!phone) return '';
  // Remove leading quote and clean
  return phone.replace(/^'/, '').replace(/\D/g, '');
}

function cleanString(str: string): string {
  if (!str || str === '-') return '';
  return str.replace(/^'/, '').trim();
}

async function main() {
  console.log('Reading Excel file...');
  const workbook = XLSX.readFile('/Users/adityacoy/Documents/hr-next/employees_2026-01-28_224217.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data: any[] = XLSX.utils.sheet_to_json(sheet);

  console.log(`Found ${data.length} employees to import`);

  // Default password hash
  const defaultPassword = await bcrypt.hash('Password123!', 10);

  // Get default Employee role
  const employeeRole = await prisma.role.findFirst({
    where: { name: 'Employee' }
  });

  if (!employeeRole) {
    console.error('Employee role not found! Please seed roles first.');
    return;
  }

  // Cache for departments and positions
  const departmentCache: Record<string, Record<string, number>> = {};
  const positionCache: Record<string, Record<string, number>> = {}; // company_id -> name -> id
  const employeeCache: Record<string, number> = {}; // name -> id for manager lookup

  // First pass: Create all departments and positions
  console.log('\nCreating departments and positions...');

  for (const row of data) {
    const companyId = COMPANY_MAP[row['Perusahaan']];
    const deptName = row['Departemen'];
    const posName = row['Jabatan'];

    // Create department if needed
    if (deptName && deptName !== '-') {
      if (!departmentCache[companyId]) {
        departmentCache[companyId] = {};
      }

      if (!departmentCache[companyId][deptName]) {
        let dept = await prisma.department.findFirst({
          where: { name: deptName, company_id: companyId }
        });

        if (!dept) {
          dept = await prisma.department.create({
            data: {
              name: deptName,
              company_id: companyId,
              status: 'active',
            }
          });
          console.log(`  Created department: ${deptName} (Company ${companyId})`);
        }
        departmentCache[companyId][deptName] = dept.id;
      }
    }

    // Create position if needed (positions are per-company)
    if (posName && posName !== '-') {
      if (!positionCache[companyId]) {
        positionCache[companyId] = {};
      }

      if (!positionCache[companyId][posName]) {
        let pos = await prisma.position.findFirst({
          where: { name: posName, company_id: companyId }
        });

        if (!pos) {
          pos = await prisma.position.create({
            data: {
              name: posName,
              company_id: companyId,
              status: 'active',
            }
          });
          console.log(`  Created position: ${posName} (Company ${companyId})`);
        }
        positionCache[companyId][posName] = pos.id;
      }
    }
  }

  // Second pass: Create users and employees
  console.log('\nImporting employees...');

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of data) {
    try {
      const nik = cleanString(row['NIK']);
      const name = row['Nama Lengkap'];
      const email = row['Email']?.toLowerCase();
      const companyId = COMPANY_MAP[row['Perusahaan']];

      if (!email) {
        console.log(`  Skipped (no email): ${name}`);
        skipped++;
        continue;
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: { email: email }
      });

      if (existingUser) {
        // Get the employee linked to this user
        const existingEmployee = await prisma.employee.findFirst({
          where: { user_id: existingUser.id }
        });
        if (existingEmployee) {
          employeeCache[name] = existingEmployee.id;
        }
        console.log(`  Skipped (user exists): ${name} (${email})`);
        skipped++;
        continue;
      }

      // Check if employee with same NIK exists
      if (nik) {
        const existingByNik = await prisma.employee.findFirst({
          where: { employee_id: nik }
        });
        if (existingByNik) {
          employeeCache[name] = existingByNik.id;
          console.log(`  Skipped (NIK exists): ${name} (${nik})`);
          skipped++;
          continue;
        }
      }

      const deptName = row['Departemen'];
      const posName = row['Jabatan'];

      const departmentId = deptName && deptName !== '-' && departmentCache[companyId]
        ? departmentCache[companyId][deptName]
        : null;
      const positionId = posName && posName !== '-' && positionCache[companyId]
        ? positionCache[companyId][posName]
        : null;

      // Create user first
      const user = await prisma.user.create({
        data: {
          email: email,
          password: defaultPassword,
          is_active: true,
        }
      });

      // Assign Employee role
      await prisma.userRole.create({
        data: {
          user_id: user.id,
          role_id: employeeRole.id,
        }
      });

      // Create employee
      const employee = await prisma.employee.create({
        data: {
          user_id: user.id,
          employee_id: nik || null,
          name: name,
          email: email,
          company_id: companyId,
          department_id: departmentId,
          position_id: positionId,
          job_title: posName && posName !== '-' ? posName : null,
          employment_type: EMPLOYMENT_TYPE_MAP[row['Tipe Karyawan']] || 'permanent',
          employment_status: 'active',
          join_date: parseDate(row['Tanggal Masuk']),
          phone: cleanPhone(row['No. Telepon']) || null,
          gender: GENDER_MAP[row['Jenis Kelamin']] || null,
          place_of_birth: cleanString(row['Tempat Lahir']) || null,
          date_of_birth: parseDate(row['Tanggal Lahir']),
          religion: RELIGION_MAP[row['Agama']] || null,
          marital_status: MARITAL_MAP[row['Status Nikah']] || null,
          national_id: cleanString(row['No. KTP']) || null,
          address: cleanString(row['Alamat']) || null,
          city: cleanString(row['Kota']) || null,
          npwp_number: cleanString(row['NPWP']) || null,
          tax_status: cleanString(row['Status PTKP']) || null,
          bank_name: cleanString(row['Bank']) || null,
          bank_account_number: cleanString(row['No. Rekening']) || null,
          bpjs_kesehatan_number: cleanString(row['BPJS Kesehatan']) || null,
          bpjs_ketenagakerjaan_number: cleanString(row['BPJS TK']) || null,
          // Default salary (will need to be updated later)
          basic_salary: 0,
        }
      });

      employeeCache[name] = employee.id;
      created++;

      if (created % 10 === 0) {
        console.log(`  Progress: ${created} created, ${skipped} skipped`);
      }
    } catch (error: any) {
      console.error(`  Error importing ${row['Nama Lengkap']}: ${error.message}`);
      errors++;
    }
  }

  // Third pass: Update manager relationships
  console.log('\nUpdating manager relationships...');

  let managerUpdated = 0;
  for (const row of data) {
    const reportToName = row['Report To'];
    if (reportToName && reportToName !== '-') {
      const employeeName = row['Nama Lengkap'];
      const managerId = employeeCache[reportToName];
      const employeeId = employeeCache[employeeName];

      if (managerId && employeeId && managerId !== employeeId) {
        try {
          await prisma.employee.update({
            where: { id: employeeId },
            data: { manager_id: managerId }
          });
          managerUpdated++;
        } catch (e: any) {
          // Ignore if already updated
        }
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`Import completed!`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Manager relationships: ${managerUpdated}`);
  console.log(`========================================`);
  console.log(`\nDefault password for all new users: Password123!`);

  await prisma.$disconnect();
}

main().catch(console.error);
