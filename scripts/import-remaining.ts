import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = await bcrypt.hash('Password123!', 10);
  const employeeRole = await prisma.role.findFirst({ where: { name: 'Employee' } });

  if (!employeeRole) {
    console.error('Employee role not found!');
    return;
  }

  // Get position IDs
  const compliancePos = await prisma.position.findFirst({ where: { name: 'COMPLIANCE ADVISOR', company_id: 2 } });
  const fpaPos = await prisma.position.findFirst({ where: { name: "FP&A EXECUTIVE", company_id: 2 } });
  const photographerPos = await prisma.position.findFirst({ where: { name: 'FREELANCER PHOTOGRAPHER', company_id: 5 } });

  const employees = [
    {
      nik: 'DEMO-EMP-001',
      name: 'Demo Employee',
      email: 'demo.employee@peoplehub.id',
      company_id: 1,
      gender: 'female',
      place_of_birth: 'JAKARTA',
      date_of_birth: new Date(2000, 0, 1),
      national_id: '1111111111111111',
      address: '1111111111',
      city: 'JAKARTA BARAT',
      phone: '1111111111111',
    },
    {
      nik: '2500001',
      name: 'CRISTIAN KEVIN',
      email: 'christian.kevin@pfigroups.com',
      company_id: 2,
      position_id: compliancePos?.id,
      job_title: 'COMPLIANCE ADVISOR',
      employment_type: 'freelance',
      join_date: new Date(2026, 0, 21),
      gender: 'male',
      city: 'JAKARTA',
      tax_status: 'TK/0',
      phone: '082378788881',
    },
    {
      nik: '2500002',
      name: 'NISA CHANDRA',
      email: 'nissa.chandracahyani@pfigroups.com',
      company_id: 2,
      position_id: fpaPos?.id,
      job_title: "FP&A EXECUTIVE",
      employment_type: 'freelance',
      join_date: new Date(2025, 1, 18),
      gender: 'female',
      marital_status: 'single',
      city: 'JAKARTA',
      tax_status: 'TK/0',
      phone: '081294156949',
    },
    {
      nik: '2500008',
      name: 'PUTRA ANUGRAH JIE',
      email: 'putrajie@gmail.com',
      company_id: 5,
      position_id: photographerPos?.id,
      job_title: 'FREELANCER PHOTOGRAPHER',
      employment_type: 'freelance',
      join_date: new Date(2025, 9, 27),
      gender: 'male',
      marital_status: 'divorced',
      place_of_birth: 'JAKARTA',
      date_of_birth: new Date(1982, 10, 6),
      national_id: '3172060611820002',
      tax_status: 'TK/0',
      bank_name: 'BCA',
      bank_account_number: '4130205441',
    },
  ];

  for (const emp of employees) {
    const existing = await prisma.user.findFirst({ where: { email: emp.email } });
    if (existing) {
      console.log('Skipped (exists):', emp.name);
      continue;
    }

    const user = await prisma.user.create({
      data: { email: emp.email, password: defaultPassword, is_active: true }
    });

    await prisma.userRole.create({
      data: { user_id: user.id, role_id: employeeRole.id }
    });

    await prisma.employee.create({
      data: {
        user_id: user.id,
        employee_id: emp.nik,
        name: emp.name,
        email: emp.email,
        company_id: emp.company_id,
        position_id: emp.position_id || null,
        job_title: emp.job_title || null,
        employment_type: emp.employment_type || 'permanent',
        employment_status: 'active',
        join_date: emp.join_date || null,
        gender: emp.gender || null,
        marital_status: emp.marital_status || null,
        place_of_birth: emp.place_of_birth || null,
        date_of_birth: emp.date_of_birth || null,
        national_id: emp.national_id || null,
        address: emp.address || null,
        city: emp.city || null,
        tax_status: emp.tax_status || null,
        bank_name: emp.bank_name || null,
        bank_account_number: emp.bank_account_number || null,
        phone: emp.phone || null,
        basic_salary: 0,
      }
    });
    console.log('Created:', emp.name);
  }

  // Update manager relationships
  console.log('\nUpdating manager relationships...');

  const yovan = await prisma.employee.findFirst({ where: { name: 'YOVAN OCTAVIUS' } });
  const hikari = await prisma.employee.findFirst({ where: { name: 'HIKARI UTAMININGSIH' } });
  const anita = await prisma.employee.findFirst({ where: { name: 'ANITA ANASTASIA' } });

  if (yovan) {
    const cristian = await prisma.employee.findFirst({ where: { email: 'christian.kevin@pfigroups.com' } });
    if (cristian) {
      await prisma.employee.update({ where: { id: cristian.id }, data: { manager_id: yovan.id } });
      console.log('Updated manager for CRISTIAN KEVIN');
    }
  }

  if (hikari) {
    const nisa = await prisma.employee.findFirst({ where: { email: 'nissa.chandracahyani@pfigroups.com' } });
    if (nisa) {
      await prisma.employee.update({ where: { id: nisa.id }, data: { manager_id: hikari.id } });
      console.log('Updated manager for NISA CHANDRA');
    }
  }

  if (anita) {
    const putra = await prisma.employee.findFirst({ where: { email: 'putrajie@gmail.com' } });
    if (putra) {
      await prisma.employee.update({ where: { id: putra.id }, data: { manager_id: anita.id } });
      console.log('Updated manager for PUTRA ANUGRAH JIE');
    }
  }

  console.log('\nDone!');
  await prisma.$disconnect();
}

main().catch(console.error);
