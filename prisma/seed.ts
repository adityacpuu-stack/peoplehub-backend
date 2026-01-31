import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ==========================================
  // 1. Create Roles (7-level hierarchy)
  // ==========================================
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name_guard_name: { name: 'Super Admin', guard_name: 'web' } },
      update: {},
      create: { name: 'Super Admin', guard_name: 'web', level: 1, is_system: true, description: 'Full system access, infrastructure management' },
    }),
    prisma.role.upsert({
      where: { name_guard_name: { name: 'Group CEO', guard_name: 'web' } },
      update: {},
      create: { name: 'Group CEO', guard_name: 'web', level: 2, is_system: true, description: 'Access to all companies within corporate group' },
    }),
    prisma.role.upsert({
      where: { name_guard_name: { name: 'CEO', guard_name: 'web' } },
      update: {},
      create: { name: 'CEO', guard_name: 'web', level: 3, is_system: true, description: 'Single company access' },
    }),
    prisma.role.upsert({
      where: { name_guard_name: { name: 'HR Manager', guard_name: 'web' } },
      update: {},
      create: { name: 'HR Manager', guard_name: 'web', level: 4, is_system: true, description: 'Strategic HR management, policy configuration' },
    }),
    prisma.role.upsert({
      where: { name_guard_name: { name: 'Tax Manager', guard_name: 'web' } },
      update: {},
      create: { name: 'Tax Manager', guard_name: 'web', level: 4.5, is_system: true, description: 'Tax compliance and reporting management' },
    }),
    prisma.role.upsert({
      where: { name_guard_name: { name: 'HR Staff', guard_name: 'web' } },
      update: {},
      create: { name: 'HR Staff', guard_name: 'web', level: 5, is_system: true, description: 'Operational HR tasks, can be assigned to multiple companies' },
    }),
    prisma.role.upsert({
      where: { name_guard_name: { name: 'Tax Staff', guard_name: 'web' } },
      update: {},
      create: { name: 'Tax Staff', guard_name: 'web', level: 5.5, is_system: true, description: 'Tax calculation and document processing' },
    }),
    prisma.role.upsert({
      where: { name_guard_name: { name: 'Manager', guard_name: 'web' } },
      update: {},
      create: { name: 'Manager', guard_name: 'web', level: 6, is_system: true, description: 'Team management, approval workflows' },
    }),
    prisma.role.upsert({
      where: { name_guard_name: { name: 'Employee', guard_name: 'web' } },
      update: {},
      create: { name: 'Employee', guard_name: 'web', level: 7, is_system: true, description: 'Personal and team-related access' },
    }),
  ]);
  console.log('✅ Created Roles:', roles.map(r => r.name).join(', '));

  // ==========================================
  // 2. Create Companies (Holding + Subsidiaries)
  // ==========================================

  // PT PATH FINDER INVESTMENT as Holding Company
  const holdingCompany = await prisma.company.upsert({
    where: { code: 'PFI' },
    update: {},
    create: {
      name: 'Path Finder Investment',
      code: 'PFI',
      legal_name: 'PT PATH FINDER INVESTMENT',
      company_type: 'holding',
      group_name: 'Path Finder Group',
      tax_id: '01.234.567.8-901.000',
      email: 'info@pathfinder.co.id',
      phone: '+62 21 1234 5680',
      address: 'Gedung Investment Tower Lt. 15\nJl. Sudirman Kav. 10',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postal_code: '12910',
      country: 'Indonesia',
      website: 'https://pathfinder.co.id',
      industry: 'Investment & Finance',
      status: 'active',
    },
  });
  console.log('✅ Created Holding Company:', holdingCompany.name);

  // Subsidiary Companies
  const growPathCompany = await prisma.company.upsert({
    where: { code: 'GDI' },
    update: {},
    create: {
      name: 'GrowPath Distribution Indonesia',
      code: 'GDI',
      legal_name: 'PT GROWPATH DISTRIBUTION INDONESIA',
      company_type: 'subsidiary',
      group_name: 'Path Finder Group',
      parent_company_id: holdingCompany.id,
      tax_id: '01.234.567.8-902.000',
      email: 'info@growpath.co.id',
      phone: '+62 21 1234 5681',
      address: 'Gedung Logistik Center Lt. 5\nJl. Raya Bekasi KM 25',
      city: 'Bekasi',
      province: 'Jawa Barat',
      postal_code: '17530',
      country: 'Indonesia',
      website: 'https://growpath.co.id',
      industry: 'Distribution & Logistics',
      status: 'active',
    },
  });

  const lampungFarmCompany = await prisma.company.upsert({
    where: { code: 'LFS' },
    update: {},
    create: {
      name: 'Lampung Farm Solution',
      code: 'LFS',
      legal_name: 'PT LAMPUNG FARM SOLUTION',
      company_type: 'subsidiary',
      group_name: 'Path Finder Group',
      parent_company_id: holdingCompany.id,
      tax_id: '01.234.567.8-903.000',
      email: 'info@lampungfarm.co.id',
      phone: '+62 721 123 456',
      address: 'Jl. Raya Natar No. 88\nLampung Selatan',
      city: 'Lampung Selatan',
      province: 'Lampung',
      postal_code: '35362',
      country: 'Indonesia',
      website: 'https://lampungfarm.co.id',
      industry: 'Agriculture & Farming',
      status: 'active',
    },
  });

  const bukaCeritaCompany = await prisma.company.upsert({
    where: { code: 'BCI' },
    update: {},
    create: {
      name: 'Buka Cerita Indonesia',
      code: 'BCI',
      legal_name: 'PT BUKA CERITA INDONESIA',
      company_type: 'subsidiary',
      group_name: 'Path Finder Group',
      parent_company_id: holdingCompany.id,
      tax_id: '01.234.567.8-904.000',
      email: 'info@bukacerita.co.id',
      phone: '+62 21 1234 5682',
      address: 'Gedung Media Tower Lt. 8\nJl. Gatot Subroto Kav. 36',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postal_code: '12930',
      country: 'Indonesia',
      website: 'https://bukacerita.co.id',
      industry: 'Media & Publishing',
      status: 'active',
    },
  });

  const uorKreatifCompany = await prisma.company.upsert({
    where: { code: 'UKI' },
    update: {},
    create: {
      name: 'UOR Kreatif Indonesia',
      code: 'UKI',
      legal_name: 'PT UOR KREATIF INDONESIA',
      company_type: 'subsidiary',
      group_name: 'Path Finder Group',
      parent_company_id: holdingCompany.id,
      tax_id: '01.234.567.8-905.000',
      email: 'info@uorkreatif.co.id',
      phone: '+62 21 1234 5683',
      address: 'Gedung Creative Hub Lt. 12\nJl. Kuningan Barat No. 10',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postal_code: '12710',
      country: 'Indonesia',
      website: 'https://uorkreatif.co.id',
      industry: 'Creative & Design Agency',
      status: 'active',
    },
  });

  // Use growPathCompany as default subsidiary for employees
  const subsidiaryCompany = growPathCompany;

  const pilarDanaCompany = await prisma.company.upsert({
    where: { code: 'PDR' },
    update: {},
    create: {
      name: 'Pilar Dana Rakyat',
      code: 'PDR',
      legal_name: 'PT PILAR DANA RAKYAT',
      company_type: 'subsidiary',
      group_name: 'Path Finder Group',
      parent_company_id: holdingCompany.id,
      tax_id: '01.234.567.8-906.000',
      email: 'info@pilardana.co.id',
      phone: '+62 21 1234 5684',
      address: 'Gedung Finance Center Lt. 20\nJl. HR Rasuna Said Kav. C-5',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postal_code: '12940',
      country: 'Indonesia',
      website: 'https://pilardana.co.id',
      industry: 'Financial Services & Fintech',
      status: 'active',
    },
  });

  console.log('✅ Created Subsidiary Companies: GrowPath Distribution, Lampung Farm Solution, Buka Cerita Indonesia, UOR Kreatif Indonesia, Pilar Dana Rakyat');

  // ==========================================
  // 3. Create Departments
  // ==========================================
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: 'Human Resources',
        code: 'HR',
        description: 'Human Resources Department',
        company_id: holdingCompany.id,
        status: 'active',
        cost_center: 'CC-HR-001',
      },
    }),
    prisma.department.create({
      data: {
        name: 'Finance & Accounting',
        code: 'FIN',
        description: 'Finance and Accounting Department',
        company_id: holdingCompany.id,
        status: 'active',
        cost_center: 'CC-FIN-001',
      },
    }),
    prisma.department.create({
      data: {
        name: 'Information Technology',
        code: 'IT',
        description: 'Information Technology Department',
        company_id: subsidiaryCompany.id,
        status: 'active',
        cost_center: 'CC-IT-001',
      },
    }),
    prisma.department.create({
      data: {
        name: 'Operations',
        code: 'OPS',
        description: 'Operations Department',
        company_id: subsidiaryCompany.id,
        status: 'active',
        cost_center: 'CC-OPS-001',
      },
    }),
  ]);
  console.log('✅ Created Departments:', departments.map(d => d.name).join(', '));

  // ==========================================
  // 4. Create Positions
  // ==========================================
  const positions = await Promise.all([
    prisma.position.create({
      data: {
        name: 'HR Director',
        code: 'HRD',
        description: 'Head of Human Resources',
        company_id: holdingCompany.id,
        department_id: departments[0].id,
        level: 7,
        min_salary: 50000000,
        max_salary: 100000000,
        status: 'active',
      },
    }),
    prisma.position.create({
      data: {
        name: 'HR Manager',
        code: 'HRM',
        description: 'Human Resources Manager',
        company_id: holdingCompany.id,
        department_id: departments[0].id,
        level: 6,
        min_salary: 25000000,
        max_salary: 50000000,
        status: 'active',
      },
    }),
    prisma.position.create({
      data: {
        name: 'HR Staff',
        code: 'HRS',
        description: 'Human Resources Staff',
        company_id: holdingCompany.id,
        department_id: departments[0].id,
        level: 3,
        min_salary: 8000000,
        max_salary: 15000000,
        status: 'active',
      },
    }),
    prisma.position.create({
      data: {
        name: 'Software Engineer',
        code: 'SWE',
        description: 'Software Engineer',
        company_id: subsidiaryCompany.id,
        department_id: departments[2].id,
        level: 4,
        min_salary: 12000000,
        max_salary: 25000000,
        status: 'active',
      },
    }),
  ]);
  console.log('✅ Created Positions:', positions.map(p => p.name).join(', '));

  // ==========================================
  // 5. Create Work Location
  // ==========================================
  const workLocation = await prisma.workLocation.create({
    data: {
      name: 'HQ Jakarta',
      code: 'HQ-JKT',
      description: 'Head Office Jakarta',
      address: 'Gedung HRIS Tower\nJl. Jenderal Sudirman Kav. 52-53',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postal_code: '12190',
      country: 'Indonesia',
      latitude: -6.2088,
      longitude: 106.8456,
      radius_meters: 100,
      enable_attendance: true,
      require_location_verification: true,
      require_photo: true,
      late_tolerance_minutes: 15,
      is_active: true,
      company_id: holdingCompany.id,
    },
  });
  console.log('✅ Created Work Location:', workLocation.name);

  // ==========================================
  // 6. Create Leave Types
  // ==========================================
  const leaveTypes = await Promise.all([
    prisma.leaveType.create({
      data: {
        name: 'Annual Leave',
        code: 'AL',
        description: 'Cuti Tahunan',
        default_days: 12,
        max_days_per_request: 12,
        is_paid: true,
        requires_document: false,
        requires_approval: true,
        min_notice_days: 3,
        is_active: true,
        can_carry_forward: true,
        max_carry_forward_days: 6,
        color: '#4CAF50',
        company_id: holdingCompany.id,
      },
    }),
    prisma.leaveType.create({
      data: {
        name: 'Sick Leave',
        code: 'SL',
        description: 'Cuti Sakit',
        default_days: 14,
        max_days_per_request: 14,
        is_paid: true,
        requires_document: true,
        requires_approval: true,
        min_notice_days: 0,
        is_active: true,
        can_carry_forward: false,
        color: '#F44336',
        company_id: holdingCompany.id,
      },
    }),
    prisma.leaveType.create({
      data: {
        name: 'Maternity Leave',
        code: 'ML',
        description: 'Cuti Melahirkan',
        default_days: 90,
        max_days_per_request: 90,
        is_paid: true,
        requires_document: true,
        requires_approval: true,
        min_notice_days: 30,
        is_active: true,
        can_carry_forward: false,
        color: '#E91E63',
        gender_specific: 'female',
        company_id: holdingCompany.id,
      },
    }),
  ]);
  console.log('✅ Created Leave Types:', leaveTypes.map(lt => lt.name).join(', '));

  // ==========================================
  // 7. Create Users and Employees (SEPARATED)
  // ==========================================
  const hashedPassword = await bcrypt.hash('password123', 10);

  // --- Super Admin ---
  const superAdminUser = await prisma.user.create({
    data: {
      email: 'superadmin@hrisgroup.co.id',
      password: hashedPassword,
      is_active: true,
      email_verified_at: new Date(),
      language: 'id',
      timezone: 'Asia/Jakarta',
    },
  });

  const superAdminEmployee = await prisma.employee.create({
    data: {
      user_id: superAdminUser.id,
      employee_id: 'EMP-001',
      name: 'Super Administrator',
      email: 'superadmin@hrisgroup.co.id',
      phone: '+62 812 1234 5678',
      gender: 'male',
      date_of_birth: new Date('1985-01-15'),
      place_of_birth: 'Jakarta',
      nationality: 'Indonesian',
      religion: 'Islam',
      marital_status: 'married',
      address: 'Jl. Sudirman No. 1, Jakarta',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postal_code: '12190',
      national_id: '3171011501850001',
      npwp_number: '12.345.678.9-012.000',
      company_id: holdingCompany.id,
      department_id: departments[0].id,
      position_id: positions[0].id,
      work_location_id: workLocation.id,
      job_title: 'System Administrator',
      employment_type: 'permanent',
      employment_status: 'active',
      hire_date: new Date('2020-01-01'),
      basic_salary: 75000000,
      tax_status: 'K/2',
      bank_name: 'BCA',
      bank_account_number: '1234567890',
      bank_account_holder: 'Super Administrator',
      annual_leave_entitlement: 12,
      annual_leave_balance: 12,
      sick_leave_entitlement: 14,
      sick_leave_balance: 14,
    },
  });

  await prisma.userRole.create({
    data: { user_id: superAdminUser.id, role_id: roles[0].id },
  });
  console.log('✅ Created Super Admin:', superAdminUser.email);

  // --- HR Manager ---
  const hrManagerUser = await prisma.user.create({
    data: {
      email: 'hr.manager@hrisgroup.co.id',
      password: hashedPassword,
      is_active: true,
      email_verified_at: new Date(),
      language: 'id',
      timezone: 'Asia/Jakarta',
    },
  });

  const hrManagerEmployee = await prisma.employee.create({
    data: {
      user_id: hrManagerUser.id,
      employee_id: 'EMP-002',
      name: 'Dewi Kusuma',
      email: 'hr.manager@hrisgroup.co.id',
      phone: '+62 812 2345 6789',
      gender: 'female',
      date_of_birth: new Date('1988-05-20'),
      place_of_birth: 'Bandung',
      nationality: 'Indonesian',
      religion: 'Islam',
      marital_status: 'married',
      address: 'Jl. Gatot Subroto No. 10, Jakarta',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postal_code: '12930',
      national_id: '3171012005880002',
      npwp_number: '23.456.789.0-123.000',
      company_id: holdingCompany.id,
      department_id: departments[0].id,
      position_id: positions[1].id,
      work_location_id: workLocation.id,
      job_title: 'HR Manager',
      employment_type: 'permanent',
      employment_status: 'active',
      hire_date: new Date('2021-03-15'),
      basic_salary: 35000000,
      tax_status: 'K/1',
      bank_name: 'Mandiri',
      bank_account_number: '2345678901',
      bank_account_holder: 'Dewi Kusuma',
      annual_leave_entitlement: 12,
      annual_leave_balance: 10,
      sick_leave_entitlement: 14,
      sick_leave_balance: 14,
    },
  });

  await prisma.userRole.create({
    data: { user_id: hrManagerUser.id, role_id: roles[3].id },
  });
  console.log('✅ Created HR Manager:', hrManagerUser.email);

  // --- P&C Head ---
  const pcHeadUser = await prisma.user.create({
    data: {
      email: 'pc.head@hrisgroup.co.id',
      password: hashedPassword,
      is_active: true,
      email_verified_at: new Date(),
      language: 'id',
      timezone: 'Asia/Jakarta',
    },
  });

  const pcHeadEmployee = await prisma.employee.create({
    data: {
      user_id: pcHeadUser.id,
      employee_id: 'EMP-004',
      name: 'Rina Pratiwi',
      email: 'pc.head@hrisgroup.co.id',
      phone: '+62 812 4567 8901',
      gender: 'female',
      date_of_birth: new Date('1986-11-15'),
      place_of_birth: 'Semarang',
      nationality: 'Indonesian',
      religion: 'Islam',
      marital_status: 'married',
      address: 'Jl. Rasuna Said No. 25, Jakarta',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postal_code: '12940',
      national_id: '3171011511860004',
      npwp_number: '45.678.901.2-345.000',
      company_id: holdingCompany.id,
      department_id: departments[0].id,
      position_id: positions[0].id, // HR Director position
      work_location_id: workLocation.id,
      job_title: 'People & Culture Head',
      employment_type: 'permanent',
      employment_status: 'active',
      hire_date: new Date('2019-07-01'),
      basic_salary: 55000000,
      tax_status: 'K/2',
      bank_name: 'BCA',
      bank_account_number: '4567890123',
      bank_account_holder: 'Rina Pratiwi',
      annual_leave_entitlement: 12,
      annual_leave_balance: 12,
      sick_leave_entitlement: 14,
      sick_leave_balance: 14,
    },
  });

  await prisma.userRole.create({
    data: { user_id: pcHeadUser.id, role_id: roles[3].id }, // HR Manager role
  });
  console.log('✅ Created P&C Head:', pcHeadUser.email);

  // --- Manager ---
  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@hrisgroup.co.id',
      password: hashedPassword,
      is_active: true,
      email_verified_at: new Date(),
      language: 'id',
      timezone: 'Asia/Jakarta',
    },
  });

  const managerEmployee = await prisma.employee.create({
    data: {
      user_id: managerUser.id,
      employee_id: 'EMP-005',
      name: 'Agus Wijaya',
      email: 'manager@hrisgroup.co.id',
      phone: '+62 812 5678 9012',
      gender: 'male',
      date_of_birth: new Date('1985-03-20'),
      place_of_birth: 'Bandung',
      nationality: 'Indonesian',
      religion: 'Islam',
      marital_status: 'married',
      address: 'Jl. Sudirman No. 100, Jakarta',
      city: 'Jakarta Pusat',
      province: 'DKI Jakarta',
      postal_code: '10220',
      national_id: '3171012003850005',
      npwp_number: '56.789.012.3-456.000',
      company_id: subsidiaryCompany.id,
      department_id: departments[2].id, // IT Department
      position_id: positions[3].id,
      work_location_id: workLocation.id,
      job_title: 'IT Manager',
      employment_type: 'permanent',
      employment_status: 'active',
      hire_date: new Date('2018-01-15'),
      basic_salary: 35000000,
      tax_status: 'K/1',
      bank_name: 'Mandiri',
      bank_account_number: '5678901234',
      bank_account_holder: 'Agus Wijaya',
      annual_leave_entitlement: 12,
      annual_leave_balance: 10,
      sick_leave_entitlement: 14,
      sick_leave_balance: 14,
    },
  });

  await prisma.userRole.create({
    data: { user_id: managerUser.id, role_id: roles[7].id }, // Manager role (index 7)
  });
  console.log('✅ Created Manager:', managerUser.email);

  // --- Regular Employee ---
  const employeeUser = await prisma.user.create({
    data: {
      email: 'employee@hrisgroup.co.id',
      password: hashedPassword,
      is_active: true,
      email_verified_at: new Date(),
      language: 'id',
      timezone: 'Asia/Jakarta',
    },
  });

  const regularEmployee = await prisma.employee.create({
    data: {
      user_id: employeeUser.id,
      employee_id: 'EMP-006',
      name: 'Budi Santoso',
      email: 'employee@hrisgroup.co.id',
      phone: '+62 812 3456 7890',
      gender: 'male',
      date_of_birth: new Date('1995-08-10'),
      place_of_birth: 'Surabaya',
      nationality: 'Indonesian',
      religion: 'Kristen',
      marital_status: 'single',
      address: 'Jl. Kemang Raya No. 5, Jakarta',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postal_code: '12730',
      national_id: '3171011008950003',
      npwp_number: '34.567.890.1-234.000',
      company_id: subsidiaryCompany.id,
      department_id: departments[2].id,
      position_id: positions[3].id,
      work_location_id: workLocation.id,
      job_title: 'Software Engineer',
      employment_type: 'permanent',
      employment_status: 'active',
      hire_date: new Date('2023-06-01'),
      manager_id: hrManagerEmployee.id,
      basic_salary: 18000000,
      tax_status: 'TK/0',
      bank_name: 'BNI',
      bank_account_number: '3456789012',
      bank_account_holder: 'Budi Santoso',
      annual_leave_entitlement: 12,
      annual_leave_balance: 8,
      sick_leave_entitlement: 14,
      sick_leave_balance: 12,
    },
  });

  await prisma.userRole.create({
    data: { user_id: employeeUser.id, role_id: roles[8].id }, // Employee role (index 8)
  });
  console.log('✅ Created Employee:', employeeUser.email);

  // --- Tax Manager ---
  const taxManagerUser = await prisma.user.create({
    data: {
      email: 'tax.manager@hrisgroup.co.id',
      password: hashedPassword,
      is_active: true,
      email_verified_at: new Date(),
      language: 'id',
      timezone: 'Asia/Jakarta',
    },
  });

  const taxManagerEmployee = await prisma.employee.create({
    data: {
      user_id: taxManagerUser.id,
      employee_id: 'EMP-007',
      name: 'Siti Rahayu',
      email: 'tax.manager@hrisgroup.co.id',
      phone: '+62 812 7890 1234',
      gender: 'female',
      date_of_birth: new Date('1987-09-15'),
      place_of_birth: 'Yogyakarta',
      nationality: 'Indonesian',
      religion: 'Islam',
      marital_status: 'married',
      address: 'Jl. Menteng Raya No. 50, Jakarta',
      city: 'Jakarta Pusat',
      province: 'DKI Jakarta',
      postal_code: '10310',
      national_id: '3171011509870007',
      npwp_number: '67.890.123.4-567.000',
      company_id: holdingCompany.id,
      department_id: departments[1].id, // Finance & Accounting
      position_id: positions[1].id,
      work_location_id: workLocation.id,
      job_title: 'Tax Manager',
      employment_type: 'permanent',
      employment_status: 'active',
      hire_date: new Date('2020-02-01'),
      basic_salary: 30000000,
      tax_status: 'K/1',
      bank_name: 'BCA',
      bank_account_number: '7890123456',
      bank_account_holder: 'Siti Rahayu',
      annual_leave_entitlement: 12,
      annual_leave_balance: 11,
      sick_leave_entitlement: 14,
      sick_leave_balance: 14,
    },
  });

  await prisma.userRole.create({
    data: { user_id: taxManagerUser.id, role_id: roles[4].id }, // Tax Manager role (index 4)
  });
  console.log('✅ Created Tax Manager:', taxManagerUser.email);

  // ==========================================
  // 8. Create Payroll Settings
  // ==========================================
  await prisma.payrollSetting.create({
    data: {
      company_id: holdingCompany.id,
      bpjs_kes_employee_rate: 0.01,
      bpjs_kes_company_rate: 0.04,
      bpjs_kes_max_salary: 12000000,
      bpjs_jht_employee_rate: 0.02,
      bpjs_jht_company_rate: 0.037,
      bpjs_jp_employee_rate: 0.01,
      bpjs_jp_company_rate: 0.02,
      bpjs_jp_max_salary: 10042300,
      bpjs_jkk_rate: 0.0024,
      bpjs_jkm_rate: 0.003,
      use_ter_method: true,
      position_cost_rate: 0.05,
      position_cost_max: 500000,
      overtime_rate_weekday: 1.5,
      overtime_rate_weekend: 2.0,
      overtime_rate_holiday: 3.0,
      payroll_cutoff_date: 25,
      payment_date: 28,
      prorate_method: 'calendar_days',
      currency: 'IDR',
      is_active: true,
    },
  });
  console.log('✅ Created Payroll Settings');

  // ==========================================
  // 9. Create PTKP Data (2024 rates)
  // ==========================================
  const ptkpData = [
    { status: 'TK/0', description: 'Tidak Kawin, Tanggungan 0', amount: 54000000 },
    { status: 'TK/1', description: 'Tidak Kawin, Tanggungan 1', amount: 58500000 },
    { status: 'TK/2', description: 'Tidak Kawin, Tanggungan 2', amount: 63000000 },
    { status: 'TK/3', description: 'Tidak Kawin, Tanggungan 3', amount: 67500000 },
    { status: 'K/0', description: 'Kawin, Tanggungan 0', amount: 58500000 },
    { status: 'K/1', description: 'Kawin, Tanggungan 1', amount: 63000000 },
    { status: 'K/2', description: 'Kawin, Tanggungan 2', amount: 67500000 },
    { status: 'K/3', description: 'Kawin, Tanggungan 3', amount: 72000000 },
  ];

  await Promise.all(
    ptkpData.map((p) =>
      prisma.pTKP.upsert({
        where: { status: p.status },
        update: {},
        create: { status: p.status, description: p.description, amount: p.amount, is_active: true },
      })
    )
  );
  console.log('✅ Created PTKP data');

  // ==========================================
  // 10. Create Tax Brackets (PPh21 Progressive 2024)
  // ==========================================
  const taxBrackets = [
    { bracket_name: 'Bracket 1', rate: 0.05, min_income: 0, max_income: 60000000 },
    { bracket_name: 'Bracket 2', rate: 0.15, min_income: 60000000, max_income: 250000000 },
    { bracket_name: 'Bracket 3', rate: 0.25, min_income: 250000000, max_income: 500000000 },
    { bracket_name: 'Bracket 4', rate: 0.30, min_income: 500000000, max_income: 5000000000 },
    { bracket_name: 'Bracket 5', rate: 0.35, min_income: 5000000000, max_income: null },
  ];

  await Promise.all(
    taxBrackets.map((tb) =>
      prisma.taxBracket.create({
        data: {
          bracket_name: tb.bracket_name,
          rate: tb.rate,
          min_income: tb.min_income,
          max_income: tb.max_income,
          is_active: true,
          company_id: holdingCompany.id,
        },
      })
    )
  );
  console.log('✅ Created Tax Brackets');

  // ==========================================
  // 11. Create Indonesian Holidays 2024
  // ==========================================
  const holidays2024 = [
    { name: 'Tahun Baru 2024', date: '2024-01-01', type: 'national' },
    { name: 'Isra Miraj Nabi Muhammad SAW', date: '2024-02-08', type: 'religious' },
    { name: 'Imlek 2575 Kongzili', date: '2024-02-10', type: 'religious' },
    { name: 'Hari Raya Nyepi Tahun Baru Saka 1946', date: '2024-03-11', type: 'religious' },
    { name: 'Wafat Isa Al Masih', date: '2024-03-29', type: 'religious' },
    { name: 'Hari Raya Idul Fitri 1445 H (Hari 1)', date: '2024-04-10', type: 'religious' },
    { name: 'Hari Raya Idul Fitri 1445 H (Hari 2)', date: '2024-04-11', type: 'religious' },
    { name: 'Cuti Bersama Idul Fitri', date: '2024-04-12', type: 'cuti_bersama' },
    { name: 'Hari Buruh Internasional', date: '2024-05-01', type: 'national' },
    { name: 'Kenaikan Isa Al Masih', date: '2024-05-09', type: 'religious' },
    { name: 'Hari Raya Waisak 2568 BE', date: '2024-05-23', type: 'religious' },
    { name: 'Hari Lahir Pancasila', date: '2024-06-01', type: 'national' },
    { name: 'Hari Raya Idul Adha 1445 H', date: '2024-06-17', type: 'religious' },
    { name: 'Tahun Baru Islam 1446 H', date: '2024-07-07', type: 'religious' },
    { name: 'Hari Kemerdekaan RI', date: '2024-08-17', type: 'national' },
    { name: 'Hari Natal', date: '2024-12-25', type: 'religious' },
  ];

  await Promise.all(
    holidays2024.map((h) =>
      prisma.holiday.create({
        data: {
          name: h.name,
          date: new Date(h.date),
          type: h.type,
          is_active: true,
          source: 'manual',
          company_id: holdingCompany.id,
        },
      })
    )
  );
  console.log('✅ Created Holidays 2024');

  // ==========================================
  // 12. Create Attendance Settings
  // ==========================================
  await prisma.attendanceSetting.create({
    data: {
      company_id: holdingCompany.id,
      work_start_time: new Date('1970-01-01T09:00:00'),
      work_end_time: new Date('1970-01-01T18:00:00'),
      break_start_time: new Date('1970-01-01T12:00:00'),
      break_end_time: new Date('1970-01-01T13:00:00'),
      working_hours_per_day: 8,
      working_days_per_week: 5,
      working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      check_in_tolerance_minutes: 15,
      check_out_tolerance_minutes: 15,
      require_check_out: true,
      late_threshold_minutes: 15,
      late_affects_salary: true,
      absent_affects_salary: true,
      allow_overtime: true,
      overtime_threshold_minutes: 30,
      require_overtime_approval: true,
      enable_location_tracking: true,
      location_radius_meters: 100,
      require_photo_check_in: true,
      require_photo_check_out: true,
      track_break_time: true,
      break_duration_minutes: 60,
      attendance_affects_payroll: true,
      notify_late_employees: true,
      notify_absent_employees: true,
    },
  });
  console.log('✅ Created Attendance Settings');

  // ==========================================
  // 13. Create Employee Leave Balances
  // ==========================================
  const currentYear = new Date().getFullYear();

  await Promise.all([
    prisma.employeeLeaveBalance.create({
      data: {
        employee_id: superAdminEmployee.id,
        leave_type_id: leaveTypes[0].id,
        year: currentYear,
        allocated_days: 12,
        used_days: 0,
        remaining_days: 12,
      },
    }),
    prisma.employeeLeaveBalance.create({
      data: {
        employee_id: hrManagerEmployee.id,
        leave_type_id: leaveTypes[0].id,
        year: currentYear,
        allocated_days: 12,
        used_days: 2,
        remaining_days: 10,
      },
    }),
    prisma.employeeLeaveBalance.create({
      data: {
        employee_id: pcHeadEmployee.id,
        leave_type_id: leaveTypes[0].id,
        year: currentYear,
        allocated_days: 12,
        used_days: 1,
        remaining_days: 11,
      },
    }),
    prisma.employeeLeaveBalance.create({
      data: {
        employee_id: managerEmployee.id,
        leave_type_id: leaveTypes[0].id,
        year: currentYear,
        allocated_days: 12,
        used_days: 3,
        remaining_days: 9,
      },
    }),
    prisma.employeeLeaveBalance.create({
      data: {
        employee_id: regularEmployee.id,
        leave_type_id: leaveTypes[0].id,
        year: currentYear,
        allocated_days: 12,
        used_days: 4,
        remaining_days: 8,
      },
    }),
    prisma.employeeLeaveBalance.create({
      data: {
        employee_id: taxManagerEmployee.id,
        leave_type_id: leaveTypes[0].id,
        year: currentYear,
        allocated_days: 12,
        used_days: 1,
        remaining_days: 11,
      },
    }),
  ]);
  console.log('✅ Created Employee Leave Balances');

  // ==========================================
  // Done!
  // ==========================================
  console.log('\n🎉 Database seeding completed!');
  console.log('\n📋 Test Credentials:');
  console.log('   Super Admin:  superadmin@hrisgroup.co.id / password123');
  console.log('   HR Manager:   hr.manager@hrisgroup.co.id / password123');
  console.log('   P&C Head:     pc.head@hrisgroup.co.id / password123');
  console.log('   Tax Manager:  tax.manager@hrisgroup.co.id / password123');
  console.log('   Manager:      manager@hrisgroup.co.id / password123');
  console.log('   Employee:     employee@hrisgroup.co.id / password123');
  console.log('\n📊 Structure: User (auth) → Employee (HR data) [1:1 relation]');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
