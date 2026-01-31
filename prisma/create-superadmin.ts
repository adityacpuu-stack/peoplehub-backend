import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface SuperAdminConfig {
  email: string;
  password: string;
  name: string;
}

// Configuration - change these values as needed
const SUPERADMIN_CONFIG: SuperAdminConfig = {
  email: process.env.SUPERADMIN_EMAIL || 'superadmin@hrisgroup.co.id',
  password: process.env.SUPERADMIN_PASSWORD || 'Admin@123',
  name: process.env.SUPERADMIN_NAME || 'Super Administrator',
};

async function createSuperAdmin() {
  console.log('🔐 Creating Super Admin user...');

  try {
    // 1. Ensure Super Admin role exists
    const superAdminRole = await prisma.role.upsert({
      where: { name_guard_name: { name: 'Super Admin', guard_name: 'web' } },
      update: {},
      create: {
        name: 'Super Admin',
        guard_name: 'web',
        level: 1,
        is_system: true,
        description: 'Full system access, infrastructure management',
      },
    });
    console.log('✅ Super Admin role ready');

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: SUPERADMIN_CONFIG.email },
    });

    if (existingUser) {
      console.log(`⚠️  User with email ${SUPERADMIN_CONFIG.email} already exists (ID: ${existingUser.id})`);

      // Check if already has Super Admin role
      const existingRole = await prisma.userRole.findFirst({
        where: {
          user_id: existingUser.id,
          role_id: superAdminRole.id,
        },
      });

      if (existingRole) {
        console.log('✅ User already has Super Admin role');
      } else {
        await prisma.userRole.create({
          data: {
            user_id: existingUser.id,
            role_id: superAdminRole.id,
          },
        });
        console.log('✅ Super Admin role assigned to existing user');
      }

      return existingUser;
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(SUPERADMIN_CONFIG.password, 12);

    // 4. Create user
    const superAdminUser = await prisma.user.create({
      data: {
        email: SUPERADMIN_CONFIG.email,
        password: hashedPassword,
        is_active: true,
        email_verified_at: new Date(),
        language: 'id',
        timezone: 'Asia/Jakarta',
      },
    });
    console.log(`✅ User created: ${superAdminUser.email}`);

    // 5. Assign Super Admin role
    await prisma.userRole.create({
      data: {
        user_id: superAdminUser.id,
        role_id: superAdminRole.id,
      },
    });
    console.log('✅ Super Admin role assigned');

    // 6. Create Employee record (optional but recommended for consistency)
    const employee = await prisma.employee.create({
      data: {
        user_id: superAdminUser.id,
        employee_id: `SA-${superAdminUser.id.toString().padStart(5, '0')}`,
        name: SUPERADMIN_CONFIG.name,
        email: SUPERADMIN_CONFIG.email,
        employment_type: 'permanent',
        employment_status: 'active',
        hire_date: new Date(),
      },
    });
    console.log(`✅ Employee record created: ${employee.employee_id}`);

    console.log('\n🎉 Super Admin created successfully!');
    console.log('\n📋 Credentials:');
    console.log(`   Email:    ${SUPERADMIN_CONFIG.email}`);
    console.log(`   Password: ${SUPERADMIN_CONFIG.password}`);
    console.log('\n⚠️  Please change the password after first login!');

    return superAdminUser;
  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
    throw error;
  }
}

// Run the script
createSuperAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
