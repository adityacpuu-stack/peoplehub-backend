/**
 * Migration Script: MySQL (DigitalOcean) -> PostgreSQL (Railway)
 *
 * Run with: npx ts-node scripts/migrate-from-mysql.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper to parse TSV files
function parseTSV<T>(filePath: string): T[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split('\t');
  const data: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t');
    const obj: any = {};
    headers.forEach((header, idx) => {
      let value = values[idx] || null;
      if (value === 'NULL' || value === '\\N' || value === '') value = null;
      obj[header] = value;
    });
    data.push(obj);
  }

  return data;
}

// Helper to convert MySQL date to JS Date
function parseDate(dateStr: string | null): Date | null {
  if (!dateStr || dateStr === 'NULL' || dateStr === '0000-00-00') return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

// Helper to convert MySQL boolean (0/1) to JS boolean
function parseBool(val: string | null): boolean {
  return val === '1' || val === 'true';
}

// Helper to parse decimal
function parseDecimal(val: string | null): number | null {
  if (!val || val === 'NULL') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

// Helper to parse int
function parseInt2(val: string | null): number | null {
  if (!val || val === 'NULL') return null;
  const num = parseInt(val, 10);
  return isNaN(num) ? null : num;
}

// Map MySQL employment_status to PostgreSQL
function mapEmploymentStatus(status: string | null): string {
  const statusMap: Record<string, string> = {
    'active': 'active',
    'inactive': 'inactive',
    'suspended': 'suspended',
    'locked': 'suspended',
    'terminated': 'terminated',
  };
  return statusMap[status || 'active'] || 'active';
}

async function migrate() {
  console.log('Starting migration from MySQL to PostgreSQL...\n');

  const tmpDir = '/tmp';

  // Load data from TSV files
  console.log('Loading data from TSV files...');
  const companies = parseTSV<any>(path.join(tmpDir, 'mysql_companies.tsv'));
  const departments = parseTSV<any>(path.join(tmpDir, 'mysql_departments.tsv'));
  const positions = parseTSV<any>(path.join(tmpDir, 'mysql_positions.tsv'));
  const users = parseTSV<any>(path.join(tmpDir, 'mysql_users_export.tsv'));

  console.log(`Loaded: ${companies.length} companies, ${departments.length} departments, ${positions.length} positions, ${users.length} users\n`);

  // Create ID mappings (MySQL ID -> PostgreSQL ID)
  const companyIdMap = new Map<number, number>();
  const departmentIdMap = new Map<number, number>();
  const positionIdMap = new Map<number, number>();
  const userIdMap = new Map<number, number>();
  const employeeIdMap = new Map<number, number>();

  try {
    // 1. Migrate Companies
    console.log('Migrating companies...');
    for (const c of companies) {
      const code = c.code || c.name.substring(0, 10).toUpperCase().replace(/\s+/g, '');
      const existing = await prisma.company.findFirst({
        where: { OR: [{ name: c.name }, { code }] }
      });
      if (existing) {
        companyIdMap.set(parseInt(c.id), existing.id);
        console.log(`  Company "${c.name}" already exists (ID: ${existing.id})`);
        continue;
      }

      const created = await prisma.company.create({
        data: {
          name: c.name,
          code: code,
          legal_name: c.legal_name || c.name,
          address: c.address,
          city: c.city,
          province: c.province,
          postal_code: c.postal_code,
          country: c.country || 'Indonesia',
          phone: c.phone,
          email: c.email,
          website: c.website,
          tax_id: c.tax_id || c.npwp,
          industry: c.industry,
          status: c.status === 'active' ? 'active' : 'inactive',
        },
      });
      companyIdMap.set(parseInt(c.id), created.id);
      console.log(`  Created company "${c.name}" (ID: ${created.id})`);
    }

    // 2. Migrate Departments
    console.log('\nMigrating departments...');
    // Get first company ID as default
    const defaultCompanyId = companyIdMap.values().next().value || 1;

    for (const d of departments) {
      const companyId = d.company_id ? companyIdMap.get(parseInt(d.company_id)) || defaultCompanyId : defaultCompanyId;

      const existing = await prisma.department.findFirst({
        where: {
          name: d.name,
          company_id: companyId,
        }
      });

      if (existing) {
        departmentIdMap.set(parseInt(d.id), existing.id);
        console.log(`  Department "${d.name}" already exists (ID: ${existing.id})`);
        continue;
      }

      const created = await prisma.department.create({
        data: {
          name: d.name,
          code: d.code || d.name.substring(0, 10).toUpperCase().replace(/\s+/g, ''),
          description: d.description,
          company_id: companyId,
          status: d.is_active === '0' ? 'inactive' : 'active',
        },
      });
      departmentIdMap.set(parseInt(d.id), created.id);
      console.log(`  Created department "${d.name}" (ID: ${created.id})`);
    }

    // 3. Migrate Positions
    console.log('\nMigrating positions...');

    for (const p of positions) {
      const departmentId = p.department_id ? departmentIdMap.get(parseInt(p.department_id)) : undefined;
      // Try to get company_id from department or use first company
      let companyId: number = p.company_id ? (companyIdMap.get(parseInt(p.company_id)) || defaultCompanyId) : defaultCompanyId;
      if (departmentId) {
        // Get company from department
        const dept = await prisma.department.findUnique({ where: { id: departmentId } });
        if (dept?.company_id) companyId = dept.company_id;
      }

      const existing = await prisma.position.findFirst({
        where: { name: p.name, company_id: companyId }
      });

      if (existing) {
        positionIdMap.set(parseInt(p.id), existing.id);
        console.log(`  Position "${p.name}" already exists (ID: ${existing.id})`);
        continue;
      }

      const created = await prisma.position.create({
        data: {
          name: p.name,
          code: p.code || p.name.substring(0, 20).toUpperCase().replace(/\s+/g, '_'),
          description: p.description,
          company_id: companyId,
          department_id: departmentId,
          level: parseInt2(p.level) || 1,
          status: p.is_active === '0' ? 'inactive' : 'active',
        },
      });
      positionIdMap.set(parseInt(p.id), created.id);
      console.log(`  Created position "${p.name}" (ID: ${created.id})`);
    }

    // 4. Migrate Users & Employees
    console.log('\nMigrating users and employees...');

    // First pass: Create all users and employees (without manager relationships)
    for (const u of users) {
      // Skip users without valid email at the start
      if (!u.email || !u.email.includes('@')) {
        console.log(`  Skipping user "${u.name}" - invalid email: ${u.email}`);
        continue;
      }

      // Check if user already exists by email
      const existingUser = await prisma.user.findFirst({ where: { email: u.email } });
      if (existingUser) {
        userIdMap.set(parseInt(u.id), existingUser.id);
        const existingEmployee = await prisma.employee.findFirst({ where: { user_id: existingUser.id } });
        if (existingEmployee) {
          employeeIdMap.set(parseInt(u.id), existingEmployee.id);
          console.log(`  User "${u.email}" already exists (ID: ${existingUser.id}, Employee: ${existingEmployee.id})`);
        } else {
          console.log(`  User "${u.email}" exists but no employee record - will create employee`);
        }
        // Skip if employee exists
        if (existingEmployee) continue;
      }

      // Also check if employee_id already exists
      if (u.employee_id) {
        const existingByEmpId = await prisma.employee.findFirst({ where: { employee_id: u.employee_id } });
        if (existingByEmpId) {
          employeeIdMap.set(parseInt(u.id), existingByEmpId.id);
          if (!existingUser) {
            userIdMap.set(parseInt(u.id), existingByEmpId.user_id);
          }
          console.log(`  Employee with ID "${u.employee_id}" already exists (Employee ID: ${existingByEmpId.id})`);
          continue;
        }
      }

      // Create User if not exists
      let userId: number;
      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Skip users without valid email
        if (!u.email || !u.email.includes('@')) {
          console.log(`  Skipping user "${u.name}" - invalid email: ${u.email}`);
          continue;
        }

        // Generate default password if null
        const password = u.password || bcrypt.hashSync('PeopleHub2024!', 10);

        const createdUser = await prisma.user.create({
          data: {
            email: u.email,
            password: password,
            force_password_change: true, // Force password change for migrated users
            is_active: u.status === 'active',
            language: 'id',
            timezone: 'Asia/Jakarta',
            date_format: 'DD/MM/YYYY',
            theme: 'light',
          },
        });
        userId = createdUser.id;
        userIdMap.set(parseInt(u.id), userId);
      }

      // Create Employee
      const companyId = u.company_id ? companyIdMap.get(parseInt(u.company_id)) : null;
      const departmentId = u.department_id ? departmentIdMap.get(parseInt(u.department_id)) : null;
      const positionId = u.position_id ? positionIdMap.get(parseInt(u.position_id)) : null;

      const createdEmployee = await prisma.employee.create({
        data: {
          user_id: userId,
          employee_id: u.employee_id,
          name: u.name,
          nick_name: u.nick_name,
          email: u.email,
          phone: u.phone,
          mobile_number: u.mobile_number,

          // Personal Info
          date_of_birth: parseDate(u.date_of_birth),
          place_of_birth: u.place_of_birth,
          gender: u.gender,
          marital_status: u.marital_status,
          religion: u.religion,
          blood_type: u.blood_type,
          nationality: u.nationality || 'Indonesian',

          // Address
          address: u.address,
          city: u.city,
          province: u.province,
          postal_code: u.postal_code,
          current_address: u.current_address,

          // Identity
          national_id: u.national_id,
          npwp_number: u.npwp_number,
          tax_id: u.tax_id,
          passport_number: u.passport_number,

          // Emergency Contact
          emergency_contact_name: u.emergency_contact_name,
          emergency_contact_phone: u.emergency_contact_phone,
          emergency_contact_relationship: u.emergency_contact_relationship,

          // Job Info
          job_title: u.job_title,
          company_id: companyId,
          department_id: departmentId,
          position_id: positionId,
          division: u.division,
          organizational_level: u.organizational_level,
          grade_level: u.grade_level,
          assigned_shift: u.assigned_shift,

          // Employment Dates
          hire_date: parseDate(u.hire_date),
          probation_start_date: parseDate(u.probation_start_date),
          probation_end_date: parseDate(u.probation_end_date),
          confirmation_date: parseDate(u.confirmation_date),
          contract_end_date: parseDate(u.contract_end_date),
          resign_date: parseDate(u.resign_date),
          resign_reason: u.resign_reason,

          // Employment Details
          employment_type: u.employment_type,
          employment_status: mapEmploymentStatus(u.status),
          work_schedule: u.work_schedule,

          // Salary
          basic_salary: parseDecimal(u.basic_salary),
          salary_currency: u.salary_currency || 'IDR',
          pay_frequency: u.pay_frequency,
          pay_type: u.pay_type,
          tax_status: u.tax_status,
          transport_allowance: parseDecimal(u.transport_allowance),
          meal_allowance: parseDecimal(u.meal_allowance),
          performance_bonus: parseDecimal(u.performance_bonus),

          // Insurance
          bpjs_ketenagakerjaan_number: u.bpjs_ketenagakerjaan_number,
          bpjs_kesehatan_number: u.bpjs_kesehatan_number,
          medical_insurance: parseBool(u.medical_insurance),
          life_insurance: parseBool(u.life_insurance),
          number_of_dependents: parseInt2(u.number_of_dependents),

          // Bank
          bank_name: u.bank_name,
          bank_account_number: u.bank_account_number,
          bank_account_holder: u.bank_account_holder,

          // Education
          last_education: u.last_education?.toLowerCase(),
          education_major: u.education_major,
          education_institution: u.education_institution,
          graduation_year: parseInt2(u.graduation_year),

          // Family
          spouse_name: u.spouse_name,

          // Leave
          annual_leave_entitlement: parseDecimal(u.annual_leave_entitlement),
          sick_leave_entitlement: parseDecimal(u.sick_leave_entitlement),
          annual_leave_balance: parseDecimal(u.annual_leave_balance),
          sick_leave_balance: parseDecimal(u.sick_leave_balance),

          // Avatar
          avatar: u.avatar,

          // ESS
          ess_access: true,
          profile_completed: false,
        },
      });
      employeeIdMap.set(parseInt(u.id), createdEmployee.id);
      console.log(`  Created user & employee "${u.name}" (User ID: ${userId}, Employee ID: ${createdEmployee.id})`);
    }

    // Second pass: Update manager relationships
    console.log('\nUpdating manager relationships...');
    for (const u of users) {
      const employeeId = employeeIdMap.get(parseInt(u.id));
      if (!employeeId) continue;

      const managerId = u.manager_id ? employeeIdMap.get(parseInt(u.manager_id)) : null;
      const directManagerId = u.direct_manager_id ? employeeIdMap.get(parseInt(u.direct_manager_id)) : null;
      const skipLevelManagerId = u.skip_level_manager_id ? employeeIdMap.get(parseInt(u.skip_level_manager_id)) : null;

      if (managerId || directManagerId || skipLevelManagerId) {
        await prisma.employee.update({
          where: { id: employeeId },
          data: {
            manager_id: managerId,
            direct_manager_id: directManagerId,
            skip_level_manager_id: skipLevelManagerId,
            leave_approver_id: managerId || directManagerId,
            overtime_approver_id: managerId || directManagerId,
          },
        });
        console.log(`  Updated manager for employee ID ${employeeId}`);
      }
    }

    // 5. Assign default role to all users
    console.log('\nAssigning default roles...');
    const employeeRole = await prisma.role.findFirst({ where: { name: 'Employee' } });
    if (employeeRole) {
      for (const [mysqlId, pgUserId] of userIdMap) {
        const existingRole = await prisma.userRole.findFirst({
          where: { user_id: pgUserId, role_id: employeeRole.id },
        });
        if (!existingRole) {
          await prisma.userRole.create({
            data: { user_id: pgUserId, role_id: employeeRole.id },
          });
        }
      }
      console.log(`  Assigned Employee role to ${userIdMap.size} users`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log(`   Companies: ${companyIdMap.size}`);
    console.log(`   Departments: ${departmentIdMap.size}`);
    console.log(`   Positions: ${positionIdMap.size}`);
    console.log(`   Users: ${userIdMap.size}`);
    console.log(`   Employees: ${employeeIdMap.size}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrate().catch(console.error);
